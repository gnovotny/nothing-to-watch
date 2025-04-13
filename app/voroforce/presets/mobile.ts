export default {
  cells: 5000,
  media: {
    enabled: true,
    compressionFormat: 'ktx',
  },
  display: {
    scene: {
      main: {
        uniforms: {
          bPixelSearch: { value: false },
        },
      },
      post: {
        enabled: false,
      },
    },
  },
}
