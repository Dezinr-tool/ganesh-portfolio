export type CaseStudySection = {
  label: string
  paragraphs: string[]
}

export type CaseStudy = {
  slug: string
  title: string
  mainImage: string
  /** CHALANGE, SERVICE, INDUSTRY, YEAR */
  services: [string, string, string, string]
  barcodeTitle: string
  sections: CaseStudySection[]
  websiteUrl?: string
  websiteLabel?: string
  backgroundMain: string
  backgroundTop: { title: string; image: string }
  backgroundMiddle: { title: string; image: string }
  dsgn3: { image: string; title: string }
  dsgn4: { title: string; image: string; bg?: string | null }
  dsgn5: { title: string; image: string }
  dsgn6: { title: string; image: string }
  dsgn7: { title: string; image: string; bg: string; video?: string | null }
}

export const SERVICE_LABELS = ['CHALANGE', 'SERVICE', 'INDUSTRY', 'YEAR'] as const
