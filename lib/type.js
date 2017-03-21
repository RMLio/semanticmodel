/**
 * Created by pheyvaer on 21.03.17.
 */

let types = {
  "CLASS": 0,
  "DATAREFERENCE": 1
};

let validate = function(type) {
  let keys = Object.keys(types);

  while (i < keys.length && types[keys[i]] !== type) {
    i ++;
  }

  return i < keys.length;
}

module.exports = {
  types: types,
  validate: validate
}