import path from 'path'
// import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from 'payload/i18n/en'
import {
  AlignFeature,
  BlockquoteFeature,
  BlocksFeature,
  BoldFeature,
  ChecklistFeature,
  HeadingFeature,
  IndentFeature,
  InlineCodeFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  RelationshipFeature,
  UnorderedListFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
//import { slateEditor } from '@payloadcms/richtext-slate'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig } from 'payload/config'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { experiencesData, projectsData, skillsData } from './src/data' // Import

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  //editor: slateEditor({}),
  editor: lexicalEditor(),
  collections: [
    {
      slug: 'users',
      auth: true,
      access: {
        delete: () => false,
        update: () => false,
      },
      fields: [],
    },
    {
      slug: 'experiences',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'location', type: 'text' },
        { name: 'description', type: 'richText' },
        { name: 'icon', type: 'text' },
        { name: 'date', type: 'text' },
      ],
    },
    {
      slug: 'projects',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'richText' },
        { name: 'tags', type: 'array', label: 'Tags', fields: [{ name: 'tag', type: 'text' }] },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'href', type: 'text', label: 'Website Link' },
      ],
    },
    {
      slug: 'skills',
      fields: [{ name: 'name', type: 'text', required: true, unique: true }],
    },
    {
      slug: 'media',
      upload: true,
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    {
      slug: 'pages',
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'content',
          type: 'richText',
        },
      ],
    },
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // db: postgresAdapter({
  //   pool: {
  //     connectionString: process.env.POSTGRES_URI || ''
  //   }
  // }),
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || '',
  }),

  /**
   * Payload can now accept specific translations from 'payload/i18n/en'
   * This is completely optional and will default to English if not provided
   */
  i18n: {
    supportedLanguages: { en },
  },

  admin: {
    autoLogin: {
      email: 'dev@payloadcms.com',
      password: 'test',
      prefillOnly: true,
    },
  },

  async onInit(payload) {
    try {
      const existingUsers = await payload.find({
        collection: 'users',
        limit: 1,
      })

      if (existingUsers.docs.length === 0) {
        await payload.create({
          collection: 'users',
          data: {
            email: 'dev@payloadcms.com',
            password: 'test',
          },
        })
      }

      // Seed experiences
      const existingExperiences = await payload.find({
        collection: 'experiences',
        limit: 1,
      })

      if (existingExperiences.docs.length === 0) {
        for (const experience of experiencesData) {
          await payload.create({
            collection: 'experiences',
            data: {
              ...experience,
              description: {
                root: {
                  type: 'root',
                  children: [],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 0,
                },
              },
              icon: experience.icon.toString(),
            },
          })
        }
      }

      // Seed projects
      const existingProjects = await payload.find({
        collection: 'projects',
        limit: 1,
      })

      if (existingProjects.docs.length === 0) {
        for (const project of projectsData) {
          await payload.create({
            collection: 'projects',
            data: {
              title: project.title,
              description: {
                root: {
                  type: 'root',
                  children: [],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 0,
                },
              },
              tags: project.tags.map((tag) => ({ tag })),
              href: project.href,
            },
          })
        }
      }

      // Seed skills
      const existingSkills = await payload.find({
        collection: 'skills',
        limit: 1,
      })

      if (existingSkills.docs.length === 0) {
        for (const skill of skillsData) {
          await payload.create({
            collection: 'skills',
            data: { name: skill },
          })
        }
      }
    } catch (error) {
      console.error('Error seeding data:', error)
    }
  },
  sharp,
})
