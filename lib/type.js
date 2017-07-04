/**
 * Created by pheyvaer on 21.03.17.
 */

let types = {
  "CLASS": 0,
  "DATAREFERENCE": 1
};

/**
 * This method check whether the given type is a valid type.
 * @param type: the type that needs to be validated
 * @returns {boolean}:
 */
function isValid(type) {
  let keys = Object.keys(types);
  let i = 0;

  while (i < keys.length && types[keys[i]] !== type) {
    i ++;
  }

  return i < keys.length;
}

module.exports = {
  types: types,
  isValid: isValid
};