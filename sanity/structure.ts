import type { StructureResolver } from 'sanity/structure'

const singleton = (S: Parameters<StructureResolver>[0], typeName: string, title: string) =>
  S.listItem()
    .title(title)
    .id(typeName)
    .child(S.document().schemaType(typeName).documentId(typeName))

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      singleton(S, 'siteSettings', 'Site Settings'),
      singleton(S, 'hero', 'Hero'),
      singleton(S, 'about', 'About'),
      singleton(S, 'socialLinks', 'Social Links'),
      S.divider(),
      S.documentTypeListItem('project').title('Projects'),
      S.documentTypeListItem('testimonial').title('Testimonials'),
    ])
