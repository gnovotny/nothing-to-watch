export default {
  cells: 5000,
  media: {
    compressionFormat: 'ktx',
  },
  display: {
    scene: {
      main: {
        uniforms: {
          bPixelSearch: { value: false },
          fBorderRoundnessMod: {
            value: 1,
            animatable: true,
            modes: {
              default: {
                value: 1,
              },
              select: {
                value: 1,
              },
            },
          },
        },
      },
      post: {
        enabled: false,
      },
    },
  },
}
