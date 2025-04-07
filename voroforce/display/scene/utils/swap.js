export default function swap(obj, k1, k2) {
  const key1 = k1 === undefined ? 0 : 1
  const key2 = k2 === undefined ? 1 : 0
  const tmp = obj[key1]
  obj[key1] = obj[key2]
  obj[key2] = tmp
  return obj
}
