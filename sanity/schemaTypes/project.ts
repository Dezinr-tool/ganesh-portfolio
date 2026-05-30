import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Project Title', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 }, validation: Rule => Rule.required() }),
    defineField({ name: 'client', title: 'Client / Company', type: 'string' }),
    defineField({ name: 'category', title: 'Category', type: 'string', options: { list: [{ title: 'UI/UX', value: 'uiux' }, { title: 'Branding', value: 'branding' }, { title: 'Strategy', value: 'strategy' }, { title: 'Motion', value: 'motion' }, { title: 'Deck', value: 'deck' }] } }),
    defineField({ name: 'thumbnail', title: 'Thumbnail Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'summary', title: 'Short Summary', type: 'text', rows: 3 }),
    defineField({ name: 'body', title: 'Case Study Content', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({ name: 'year', title: 'Year', type: 'number' }),
    defineField({ name: 'featured', title: 'Featured on Homepage?', type: 'boolean', initialValue: false }),
    defineField({ name: 'order', title: 'Display Order', type: 'number' }),
  ],
  preview: { select: { title: 'title', subtitle: 'client', media: 'thumbnail' } }
})
