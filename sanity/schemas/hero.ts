import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'hero',
  title: 'Hero',
  type: 'document',
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      description: 'Use a line break for multiple headline lines.',
    }),
    defineField({ name: 'subtext', title: 'Subtext', type: 'text', rows: 4 }),
    defineField({
      name: 'badgeText',
      title: 'Badge Text',
      type: 'string',
      description: 'Use a line break for a second badge line (e.g. @BRUCIRA).',
    }),
    defineField({ name: 'ctaLabel', title: 'CTA Label', type: 'string' }),
    defineField({ name: 'ctaLink', title: 'CTA Link', type: 'string' }),
  ],
})
