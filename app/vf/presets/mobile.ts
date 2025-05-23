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
          fEdgeRoundnessMod: {
            value: 8,
            animatable: true,
            modes: {
              default: {
                value: 8,
              },
              select: {
                value: 8,
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
