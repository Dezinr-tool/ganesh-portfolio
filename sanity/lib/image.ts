import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'

import { dataset, isSanityConfigured, projectId } from '../env'

const builder = isSanityConfigured
  ? createImageUrlBuilder({ projectId, dataset })
  : null

export const urlFor = (source: SanityImageSource) => {
  if (!builder) {
    throw new Error('Sanity image URLs require NEXT_PUBLIC_SANITY_PROJECT_ID')
  }

  return builder.image(source)
}
