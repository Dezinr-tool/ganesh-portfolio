import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'about',
  title: 'About',
  type: 'document',
  fields: [
    defineField({ name: 'sectionLabel', title: 'Section Label', type: 'string' }),
    defineField({ name: 'bodyText', title: 'Body Text', type: 'text', rows: 6 }),
  ],
})
