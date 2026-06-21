import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'socialLinks',
  title: 'Social Links',
  type: 'document',
  fields: [
    defineField({ name: 'instagram', title: 'Instagram', type: 'url' }),
    defineField({ name: 'linkedin', title: 'LinkedIn', type: 'url' }),
    defineField({ name: 'behance', title: 'Behance', type: 'url' }),
    defineField({ name: 'dribbble', title: 'Dribbble', type: 'url' }),
  ],
})
