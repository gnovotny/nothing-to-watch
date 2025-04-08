import baseConfig from '../base/config'
import postFrag from './post.frag'

export default {
  cells: 25000,
  media: {
    versions: [
      ...baseConfig.media.versions,
      {
        cols: 1,
        rows: 1,
        realCols: 9,
        realRows: 6,
        tileWidth: 220,
        tileHeight: 330,
        width: 1980,
        height: 1980,

        layers: 50000, // real layers for 50000/54: 925.9 = 926
        layerIndexStart: 0,
        layerSrcFormat: '/single/{INDEX}.jpg',
        // layerSrcFormat: async (
        //   layerIndex: number,
        //   voroforceStore: VoroforceInstance['store'],
        // ) => {
        //   const posterUrl = (
        //     await getCellFilm(
        //       voroforceStore.get('cells')[layerIndex],
        //       state.filmBatches,
        //     )
        //   )?.poster
        //   if (posterUrl) return `${appConfig.posterBaseUrl}${posterUrl}`
        // },
        type: 'extra',
      },
    ],
  },
  display: {
    scene: {
      post: {
        enabled: true,
        fragmentShader: postFrag,
        uniforms: {
          fBaseColor: {
            value: [0.005, 0.005, 0.005],
            animatable: true,
            themes: {
              default: {
                value: [0.005, 0.005, 0.005],
              },
              light: {
                value: [0.995, 0.995, 0.995],
              },
            },
          },
          fAlphaStrength: {
            // value: 0.3,
            value: 1,
            animatable: true,
            modes: {
              default: {
                // value: 0.3,
                value: 1,
              },
              select: {
                value: 1,
              },
            },
          },
          fEdgeStrength: {
            // value: 0.3,
            value: 1,
            animatable: true,
            modes: {
              default: {
                // value: 0.3,
                value: 1,
              },
              select: {
                value: 1,
              },
            },
          },
          iChannel0: {
            src: '/assets/rust.jpg',
            width: 512,
            height: 512,
          },
          iChannel1: {
            src: '/assets/noise.png',
            width: 256,
            height: 256,
          },
        },
      },
    },
  },
}
