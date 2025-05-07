export default {
  enabled: true,
  baseUrl: import.meta.env.VITE_TEXTURES_BASE_URL ?? '/media',
  preload: 'first', // 'v0', 'first' or false
  compressionFormat: 'dds', // or 'ktx'
  versions: [
    {
      cols: 512,
      rows: 104,
      width: 2048,
      height: 624,
      layers: Number.parseInt(import.meta.env.VITE_MEDIA_VERSION_0_LAYERS) ?? 1,
      layerSrcFormat: '/low/{EXT}/{INDEX}.{EXT}',
      type: 'compressed-grid',
    },
    {
      cols: 90,
      rows: 60,
      width: 1980,
      height: 1980,
      layers:
        Number.parseInt(import.meta.env.VITE_MEDIA_VERSION_1_LAYERS) ?? 10,
      layerSrcFormat: '/mid/{EXT}/{INDEX}.{EXT}',
      type: 'compressed-grid',
    },
    {
      cols: 18,
      rows: 12,
      width: 1980,
      height: 1980,
      layers:
        Number.parseInt(import.meta.env.VITE_MEDIA_VERSION_2_LAYERS) ?? 241,
      layerSrcFormat: '/high/{EXT}/{INDEX}.{EXT}',
      type: 'compressed-grid',
    },
  ],
}

export const uncompressedSingleMediaVersionConfig = {
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
  type: 'uncompressed-single',
}
