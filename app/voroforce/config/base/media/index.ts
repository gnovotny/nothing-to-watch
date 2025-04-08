export default {
  enabled: false,
  baseUrl: import.meta.env.VITE_TEXTURES_BASE_URL ?? '/media',
  preload: 'first', // 'v0', 'first' or false
  versions: [
    {
      cols: 512,
      rows: 104,
      width: 2048,
      height: 624,
      layers: 1,
      layerIndexStart: 0,
      layerSrcFormat: '/low/dds/{INDEX}.dds',
      type: 'default',
    },
    {
      cols: 90,
      rows: 60,
      width: 1980,
      height: 1980,
      layers: 10,
      layerIndexStart: 0,
      layerSrcFormat: '/mid/dds/{INDEX}.dds',
      type: 'default',
    },
    {
      cols: 18,
      rows: 12,
      width: 1980,
      height: 1980,
      layers: 241,
      layerIndexStart: 0,
      layerSrcFormat: '/high/dds/{INDEX}.dds',
      type: 'default',
    },
  ],
}
