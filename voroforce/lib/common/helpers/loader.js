class LoaderEvent extends Event {
  constructor(name, data) {
    super(name ?? 'loaded')
    this.data = data
  }
}

export class Loader extends EventTarget {
  constructor(sharedLoadedMediaVersionLayersData, config) {
    super()

    this.sharedLoadedMediaVersionLayersData =
      sharedLoadedMediaVersionLayersData?.sharedLoadedMediaVersionLayersData
    this.config = config.media

    this.loadedIndex = 0
    this.loadingMediaLayers = 0
  }

  preloadAllMediaLayersVersion0(onLoad) {
    const count = this.config.versions[0].layers
    let loaded = 0
    const onLoadLayer = () => {
      loaded++
      if (loaded === count) {
        this.dispatchEvent(new LoaderEvent('preloaded'))
        onLoad?.()
      }
    }
    for (let i = 0; i < count; i++) {
      void this.loadMediaLayer(0, i, onLoadLayer)
    }
  }

  preloadFirstMediaLayerAllGridVersions(onLoad) {
    const count = this.config.versions.filter(
      ({ type }) => !type || type === 'default',
    ).length
    let loaded = 0
    const onLoadLayer = () => {
      loaded++
      if (loaded === count) {
        this.dispatchEvent(new LoaderEvent('preloaded'))
        onLoad?.()
      }
    }
    for (let i = 0; i < count; i++) {
      const type = this.config.versions[i].type
      if (type && type !== 'default') continue
      void this.loadMediaLayer(i, 0, onLoadLayer)
    }
  }

  async loadMediaLayer(versionIndex, layerIndex, onLoad) {
    if (
      this.sharedLoadedMediaVersionLayersData[versionIndex].data[layerIndex] !==
      0
    )
      return

    const baseUrl = this.config.baseUrl
    const config = this.config.versions[versionIndex]

    let src
    if (typeof config.layerSrcFormat === 'function') {
      src = await config.layerSrcFormat(layerIndex, this.store)
    } else {
      src = `${config.layerSrcFormat.startsWith('/') ? baseUrl : ''}${config.layerSrcFormat.replace(
        '{INDEX}',
        `${config.layerIndexStart + layerIndex}`,
      )}`
    }

    if (!src) return

    this.loadingMediaLayers++
    this.sharedLoadedMediaVersionLayersData[versionIndex].data[layerIndex] = 1

    let bytes
    const type = config.type ?? 'default'
    const isCompressed = src.endsWith('.dds')
    const isDefault = type === 'default'

    if (isCompressed) {
      // DDS File format constants
      const MAGIC = 0x20534444
      const DDPF_FOURCC = 0x4

      // DXT compression formats
      const FOURCC_DXT1 = 0x31545844

      const response = await fetch(src)
      const arrayBuffer = await response.arrayBuffer()
      const header = new Int32Array(arrayBuffer, 0, 31)

      // Verify magic number
      if (header[0] !== MAGIC) {
        throw new Error('Invalid DDS file format')
      }

      const height = header[3]
      // const width = header[2]
      const width = header[4]
      const pixelFormat = header[20]

      // Check compression type
      if (!(pixelFormat & DDPF_FOURCC)) {
        throw new Error('Unsupported DDS format: not compressed')
      }

      const fourCC = header[21]
      const blockSize = 8

      if (fourCC !== FOURCC_DXT1) {
        throw new Error('Unsupported DDS format: not DXT1')
      }

      // Calculate size and load texture data
      const size =
        (((Math.max(4, width) / 4) * Math.max(4, height)) / 4) * blockSize

      bytes = new Uint8Array(arrayBuffer, 128, size) // 128 is size of DDS header
    } else {
      // const blob = await (
      //   await fetch(src, {
      //     mode: 'no-cors',
      //   })
      // ).blob()
      // console.log('blob', blob)

      // Set image source to blob URL
      // image.src = URL.createObjectURL(blob)

      async function loadImage(src) {
        console.log('loadImage', src)
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            // URL.revokeObjectURL(img.src)
            resolve(img)
          }
          img.onerror = () => {
            reject(new Error(`Failed to load image`))
          }
          // img.crossOrigin = 'anonymous'
          img.src = src
        })
      }
      // bytes = await loadImage(URL.createObjectURL(blob))
      bytes = await loadImage(src)
    }

    this.loadedIndex++
    this.dispatchEvent(
      new LoaderEvent('mediaLayerLoaded', {
        bytes,
        versionIndex,
        layerIndex,
        type,
        isCompressed,
      }),
    )

    this.sharedLoadedMediaVersionLayersData[versionIndex].data[layerIndex] = 2

    onLoad?.()

    this.loadingMediaLayers--

    this.checkFinish()
  }

  checkFinish() {
    // if (this.loadedIndex === this.mediaLayersLen) {
    //   this.dispatchEvent(new LoaderEvent())
    // }

    if (this.loadingMediaLayers === 0) {
      this.dispatchEvent(new LoaderEvent('idle'))
    }
  }

  requestMediaLayerLoad(versionIndex, layers) {
    layers.forEach((layerIndex) => {
      if (
        this.sharedLoadedMediaVersionLayersData[versionIndex].data[
          layerIndex
        ] === 0
      ) {
        void this.loadMediaLayer(versionIndex, layerIndex)
      }
    })
  }

  load(src, onLoad) {
    let mediaElement
    let loadEventName
    if (src.endsWith('.mp4')) {
      loadEventName = 'onplay'
      mediaElement = document.createElement('video')
      mediaElement.autoplay = true
      mediaElement.loop = true
      mediaElement.muted = true
      mediaElement.playsInline = true
      mediaElement.crossOrigin = 'anonymous'
      mediaElement.src = src
      void mediaElement.play()
    } else {
      loadEventName = 'onload'
      mediaElement = new Image()
      mediaElement.src = src
      mediaElement.crossOrigin = 'anonymous'
    }

    mediaElement[loadEventName] = () => {
      this.dispatchEvent(new LoaderEvent('loaded', mediaElement))
      onLoad?.(mediaElement)
    }
  }
}
