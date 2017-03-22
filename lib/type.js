/**
 * Created by pheyvaer on 21.03.17.
 */

let types = {
  "CLASS": 0,
  "DATAREFERENCE": 1
};

let isValid = function(type) {
  let keys = Object.keys(types);
  let i = 0;

  while (i < keys.length && types[keys[i]] !== type) {
    i ++;
  }

  return i < keys.length;
};

module.exports = {
  types: types,
  isValid: isValid
};