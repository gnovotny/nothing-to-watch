import mainFrag from '../config/display/main-test-new3-mobile.frag'

export default {
  cells: 5000,
  // cells: 100,
  multiThreading: {
    enabled: false,
  },
  devTools: {
    enabled: true,
    expanded: true,
  },
  media: {
    enabled: true,
    compressionFormat: 'ktx',
  },
  display: {
    scene: {
      main: {
        fragmentShader: mainFrag,
      },
      post: {
        enabled: false,
      },
    },
  },
}
