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
      layers: 1,
      layerIndexStart: 0,
      layerSrcFormat: '/low/{EXT}/{INDEX}.{EXT}',
      // layerSrcFormat: '/low/{EXT}/0.{EXT}',
      type: 'compressed',
    },
    {
      cols: 90,
      rows: 60,
      width: 1980,
      height: 1980,
      layers: 10,
      layerIndexStart: 0,
      layerSrcFormat: '/mid/{EXT}/{INDEX}.{EXT}',
      // layerSrcFormat: '/mid/{EXT}/0.{EXT}',
      type: 'compressed',
    },
    {
      cols: 18,
      rows: 12,
      width: 1980,
      height: 1980,
      layers: 241,
      layerIndexStart: 0,
      layerSrcFormat: '/high/{EXT}/{INDEX}.{EXT}',
      // layerSrcFormat: '/high/{EXT}/0.{EXT}',
      type: 'compressed',
    },
  ],
}
