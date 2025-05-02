import midConfig from '../mid/mid'
// import postFrag from './post-high.frag'
import postFrag from './post-high-with-index-output.frag'
import { mergeConfigs } from '√'

export default mergeConfigs(midConfig, {
  cells: 50000,
  display: {
    scene: {
      post: {
        fragmentShader: postFrag,
        position: true,
      },
    },
  },
})
