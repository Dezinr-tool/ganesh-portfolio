export const siteSettingsQuery = `*[_type == "siteSettings"][0]{
  siteName,
  tagline,
  email,
  phone,
  location,
  footerCopyright,
  worksSectionTitle,
  testimonialsHeading
}`

export const heroQuery = `*[_type == "hero"][0]{
  headline,
  subtext,
  badgeText,
  ctaLabel,
  ctaLink
}`

export const aboutQuery = `*[_type == "about"][0]{
  sectionLabel,
  bodyText
}`

export const socialLinksQuery = `*[_type == "socialLinks"][0]{
  instagram,
  linkedin,
  behance,
  dribbble
}`

export const projectsQuery = `*[_type == "project"] | order(order asc, title asc) {
  _id,
  title,
  "slug": slug.current,
  category,
  year,
  client,
  role,
  description,
  liveUrl,
  thumbnailImage,
  coverImage,
  gallery
}`

export const projectBySlugQuery = `*[_type == "project" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  category,
  year,
  client,
  role,
  description,
  liveUrl,
  thumbnailImage,
  coverImage,
  gallery
}`

export const projectSlugsQuery = `*[_type == "project" && defined(slug.current)][].slug.current`

export const testimonialsQuery = `*[_type == "testimonial"] | order(order asc, name asc) {
  _id,
  name,
  role,
  company,
  quote,
  initials
}`

export const homepageQuery = `{
  "siteSettings": ${siteSettingsQuery},
  "hero": ${heroQuery},
  "about": ${aboutQuery},
  "socialLinks": ${socialLinksQuery},
  "projects": ${projectsQuery},
  "testimonials": ${testimonialsQuery}
}`
