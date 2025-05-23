import midConfig from '../mid/mid'
import postFrag from './post-high2.frag'
import { mergeConfigs } from '√'

export default mergeConfigs(midConfig, {
  cells: 50000,
  display: {
    scene: {
      post: {
        fragmentShader: postFrag,
        voroIndexBuffer: true,
      },
    },
  },
})
