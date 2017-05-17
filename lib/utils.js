/**
 * Created by pheyvaer on 17.05.17.
 */

/**
 *
 * @param trees: trees that need to be sorted
 * @returns {Array} of sorted @trees first on coherence (higher is better) and then on weight (lower is better)
 */
function sortTrees(trees) {
  let ordered = {};

  trees.forEach(function (tree) {
    if (ordered[tree.coherence] === undefined) {
      ordered[tree.coherence] = [];
    }

    ordered[tree.coherence].push(tree);
  });

  let ordered2 = [];

  for (let i = 0; i < Object.keys(ordered).length; i++) {
    let k = Object.keys(ordered)[i];
    let v = ordered[k];

    ordered[k] = v.sort(function (a, b) {
      return a.weight - b.weight
    });
    ordered2.push({
      coherence: k, trees: v.sort(function (a, b) {
        return a.weight - b.weight
      })
    });
  }

  ordered2 = ordered2.sort(function (a, b) {
    return b.coherence - a.coherence;
  });

  let result = [];

  ordered2.forEach(function (v) {
    result = result.concat(v.trees);
  });

  return result;
}

module.exports = {
  sortTrees: sortTrees
};