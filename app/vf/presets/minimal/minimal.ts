import baseConfig, { uncompressedSingleMediaVersionConfig } from '../../config'

export default {
  cells: 50000,
  media: {
    versions: [
      ...baseConfig.media.versions,
      ...(import.meta.env.VITE_EXPERIMENTAL_MEDIA_VERSION_3_ENABLED
        ? [uncompressedSingleMediaVersionConfig]
        : []),
    ],
  },
}
