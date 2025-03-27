import defaultVertexShader from './shaders/default.vert'

export const defaultSceneConfig = {
  dev: {
    enabled: false,
  },
  main: {
    enabled: true,
    geometry: 'triangle',
    vertexShader: defaultVertexShader,
  },
  post: {
    enabled: false,
    geometry: 'triangle',
    vertexShader: defaultVertexShader,
  },
}
