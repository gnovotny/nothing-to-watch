import postFrag from '√/display/scene/shaders/post/post-default.frag'

export default {
  // cells: 10000,
  cells: 100,
  media: {
    compressionFormat: 'ktx',
  },
  display: {
    scene: {
      post: {
        enabled: true,
        fragmentShader: postFrag,
      },
    },
  },
}
