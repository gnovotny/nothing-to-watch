import { isObject } from './type-check'

/**
 * Performs a deep merge of configs and returns a new config. Does not modify configs (immutable)
 *
 * @param {...any} configs - Configs to merge
 * @returns {any} New config with merged key/values
 */
export function mergeConfigs(...configs) {
  return configs.reduce((prev, obj = {}) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key]
      const oVal = obj[key]

      if (/*Array.isArray(pVal) && */ Array.isArray(oVal)) {
        prev[key] = oVal // overwrites arrays. use "pVal.concat(...oVal)" for concatenation
      } else if (isObject(pVal) && !Array.isArray(pVal) && isObject(oVal)) {
        prev[key] = mergeConfigs(pVal, oVal)
      } else {
        prev[key] = oVal
      }
    })

    return prev
  }, {})
}
