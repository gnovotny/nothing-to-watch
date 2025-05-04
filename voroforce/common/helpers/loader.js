import { CustomEventTarget } from '../../utils/custom-event-target'

class LoaderEvent extends Event {
  constructor(name, data) {
    super(name ?? 'loaded')
    this.data = data
  }
}

export class Loader extends CustomEventTarget {
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
      ({ type }) => !type || type === 'compressed-grid',
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
      if (type && type !== 'compressed-grid') continue
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
    const ext =
      !config.type || config.type === 'compressed-grid'
        ? this.config.compressionFormat
        : undefined

    let src
    if (typeof config.layerSrcFormat === 'function') {
      src = await config.layerSrcFormat(layerIndex, this.store)
    } else {
      src = `${config.layerSrcFormat.startsWith('/') ? baseUrl : ''}${config.layerSrcFormat
        .replaceAll('{INDEX}', `${(config.layerIndexStart ?? 0) + layerIndex}`)
        .replaceAll('{EXT}', ext)}`
    }

    if (!src) return

    this.loadingMediaLayers++
    this.sharedLoadedMediaVersionLayersData[versionIndex].data[layerIndex] = 1

    let bytes
    const type = config.type ?? 'compressed-grid'

    // const ext = src.split('.').pop().split('?')[0].toLowerCase()

    const isDds = ext === 'dds'
    const isKtx = ext === 'ktx'
    const isEtc = ext === 'etc'

    if (isDds) {
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
        console.log('src', src)
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
    } else if (isEtc) {
      // TODO incomplete
      // const response = await fetch(src)
      // const arrayBuffer = await response.arrayBuffer()
      //
      // const dataView = new DataView(arrayBuffer)
      // let offset = 0
      //
      // const magic = dataView.getUint32(offset, true)
      // offset += 4
      //
      // // Validate magic bytes (replace with your format's identifier)
      // // const expectedMagic = 0x31435445 // "ETC1" in ASCII as uint32
      // // const expectedMagic = 0x3511010 // 55727696
      // const expectedMagic = 55727696 // 55727696
      //
      // if (magic !== expectedMagic) {
      //   throw new Error('Invalid ETC file format')
      // }
      //
      // const width = dataView.getUint16(offset, true)
      // offset += 2
      //
      // const height = dataView.getUint16(offset, true)
      // offset += 2
      //
      // // Calculate data size for ETC1 (4 bits per pixel)
      // const dataSize = Math.ceil(width / 4) * Math.ceil(height / 4) * 8
      //
      // // Extract the compressed texture data
      // bytes = new Uint8Array(arrayBuffer, offset, dataSize)
    } else if (isKtx) {
      const response = await fetch(src)
      const arrayBuffer = await response.arrayBuffer()

      const idCheck = [
        0xab, 0x4b, 0x54, 0x58, 0x20, 0x31, 0x31, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
      ]
      const id = new Uint8Array(arrayBuffer, 0, 12)
      for (let i = 0; i < id.length; i++)
        if (id[i] !== idCheck[i])
          return console.error('File missing KTX identifier')

      const size = Uint32Array.BYTES_PER_ELEMENT
      const head = new DataView(arrayBuffer, 12, 13 * size)
      const littleEndian = head.getUint32(0, true) === 0x04030201
      const glType = head.getUint32(size, littleEndian)
      if (glType !== 0) {
        throw new Error('only compressed formats currently supported')
      }
      // this.glInternalFormat = head.getUint32(4 * size, littleEndian)
      // const width = head.getUint32(6 * size, littleEndian)
      // const height = head.getUint32(7 * size, littleEndian)
      // this.numberOfFaces = head.getUint32(10 * size, littleEndian)
      // this.numberOfMipmapLevels = Math.max(
      //   1,
      //   head.getUint32(11 * size, littleEndian),
      // )
      const bytesOfKeyValueData = head.getUint32(12 * size, littleEndian)

      let offset = 12 + 13 * 4 + bytesOfKeyValueData
      const levelSize = new Int32Array(arrayBuffer, offset, 1)[0]
      offset += 4 // levelSize field
      bytes = new Uint8Array(arrayBuffer, offset, levelSize)
    } else {
      const blob = await (
        await fetch(src, {
          // mode: 'no-cors',
        })
      ).blob()

      async function loadImage(src) {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            URL.revokeObjectURL(img.src)
            resolve(img)
          }
          img.onerror = () => {
            reject(new Error('Failed to load image'))
          }
          // img.crossOrigin = 'use-credentials'
          img.src = src
        })
      }
      bytes = await loadImage(URL.createObjectURL(blob))
      // bytes = await loadImage(src)
    }

    this.loadedIndex++
    this.dispatchEvent(
      new LoaderEvent('mediaLayerLoaded', {
        bytes,
        versionIndex,
        layerIndex,
        type,
        isCompressed: isDds,
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
