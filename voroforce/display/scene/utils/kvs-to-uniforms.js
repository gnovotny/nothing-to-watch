export const kVsToUniforms = (kvs) => {
  return kvs
    ? Object.entries(kvs).reduce((prev, [k, v]) => {
        prev[k] = {
          value: v,
        }
        return prev
      }, {})
    : {}
}
