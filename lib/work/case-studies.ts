export type CaseStudySection = {
  label: string
  paragraphs: string[]
}

export type CaseStudy = {
  slug: string
  title: string
  mainImage: string
  /** Full-bleed 16:9 intro video at the top of the page. */
  heroVideo?: string | null
  /** First frame shown while `heroVideo` loads. */
  heroPoster?: string | null
  /** BRIEF, SERVICE, INDUSTRY, STATUS */
  services: [string, string, string, string]
  barcodeTitle: string
  sections: CaseStudySection[]
  websiteUrl?: string
  websiteLabel?: string
  backgroundMain: string
  /** In every gallery slot, `video` plays in place of `image`, which then serves as its poster. */
  backgroundTop: { title: string; image: string; video?: string | null }
  backgroundMiddle: { title: string; image: string; video?: string | null }
  dsgn3: { image: string; title: string; video?: string | null }
  dsgn4: { title: string; image: string; bg?: string | null; video?: string | null }
  dsgn5: { title: string; image: string; video?: string | null }
  dsgn6: { title: string; image: string; video?: string | null }
  dsgn7: { title: string; image: string; bg: string; video?: string | null }
}

export const SERVICE_LABELS = ['BRIEF', 'SERVICE', 'INDUSTRY', 'STATUS'] as const
