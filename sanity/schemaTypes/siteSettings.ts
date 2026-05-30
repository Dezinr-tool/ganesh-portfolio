import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'bio', title: 'Hero Bio Text', type: 'text', rows: 3 }),
    defineField({ name: 'availableForWork', title: 'Available for Work?', type: 'boolean', initialValue: true }),
    defineField({ name: 'cvFile', title: 'CV PDF File', type: 'file' }),
    defineField({ name: 'calendarUrl', title: 'Calendar Booking URL', type: 'url' }),
    defineField({ name: 'linkedinUrl', title: 'LinkedIn URL', type: 'url' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
  ]
})
