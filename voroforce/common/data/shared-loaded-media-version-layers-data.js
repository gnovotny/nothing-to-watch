export class SharedLoadedMediaVersionLayersData {
  constructor(data) {
    this.data = data
  }

  getLayerStatus(layerIndex) {
    switch (this.data[layerIndex]) {
      case 1:
        return 'loading'
      case 2:
        return 'loaded'
    }
    return 'empty'
  }

  setLayerLoading(layerIndex) {
    this.data[layerIndex] = 1
  }

  setLayerLoaded(layerIndex) {
    this.data[layerIndex] = 2
  }

  isLayerLoaded(layerIndex) {
    return this.data[layerIndex] === 2
  }
}
