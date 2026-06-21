import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'siteName', title: 'Site Name', type: 'string' }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'location', title: 'Location', type: 'text', rows: 2 }),
    defineField({ name: 'footerCopyright', title: 'Footer Copyright', type: 'text', rows: 3 }),
    defineField({
      name: 'worksSectionTitle',
      title: 'Works Section Title',
      type: 'string',
      initialValue: 'recent works',
    }),
    defineField({
      name: 'testimonialsHeading',
      title: 'Testimonials Section Heading',
      type: 'string',
      initialValue: "Trusted by the people I've built with",
    }),
  ],
})
