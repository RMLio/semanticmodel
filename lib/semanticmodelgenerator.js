/**
 * Created by pheyvaer on 23.03.17.
 */

let Heap = require('heap');
let extend = require('extend');
let SemanticModel = require('./semanticmodel.js');
let Iterator = require('./banksiterator.js');
let logger = require('tracer').console({format: "{{line}} => {{message}}"});

class SemanticModelGenerator {

  constructor(graph, outputHeapSize) {
    this.graph = new SemanticModel();
    this.graph.importModel(graph.exportModel());
    this.outputHeapSize = outputHeapSize;
    this.iterators = [];
    this.origins = [];
  }

  static _crossProduct(u, list, i) {
    let l = [];

    for (let o = 0; o < Object.keys(list).length; o++) {
      let v = list[Object.keys(list)[o]];

      if (v.iterator.getI() !== i.iterator.getI()) {
        l.push(v);
      }
    }

    delete l[i];
    let perOrigin = {};

    l.forEach(function (item) {
      let o = item.origin;

      if (Object.keys(perOrigin).indexOf(o.id) === -1) {
        perOrigin[o.id] = [];
      }

      perOrigin[o.id].push(item);
    });

    let result = [[u]];

    for (let key = 0; key < Object.keys(perOrigin).length; key++) {
      let val = perOrigin[Object.keys(perOrigin)[key]];
      if (result.length === 0) {
        val.forEach(function (v) {
          result.push([v]);
        });
      } else {
        let tempLength = result.length;

        for (let j = 0; j < tempLength; j++) {
          val.forEach(function (v, k) {
            if (k === 0) {
              result[j].push(v);
            } else {
              let t = extend(true, {}, result[j]);
              t.push(v);
              result.push(t);
            }
          });
        }
      }
    }

    return result;
  }

  getResultTree(crossProduct) {
    //get all edges (unique)
    let edgeIDs = [];
    let weight = 0;
    let oIDs = [];

    this.origins.forEach(function (o) {
      oIDs.push(o.id);
    });

    //logger.log(oIDs);

    for (let i = 0; i < crossProduct.length; i++) {
      let origin = crossProduct[i].origin;
      let edges = crossProduct[i].edges;

      let index = oIDs.indexOf(origin.id);

      if (index !== -1) {
        oIDs.splice(index, 1);
      }

      //logger.log(JSON.stringify(origin));

      for (let k = 0; k < edges.length - 1; k++) {
        //logger.log(edges[k].id);
        if (edgeIDs.indexOf(edges[k].id) === -1) {
          edgeIDs.push(edges[k].id);
          weight += edges[k].weight;
        }
      }
    }

    if (oIDs.length > 0) {
      //logger.log('oIDS left: ' + oIDs.length);
      weight = Infinity;
    }

    let tree = {
      weight: weight,
      edgeIDs: edgeIDs
    };

    return tree;
  }

  /**
   * Calculates the coherence of a tree.
   * @param tree: the tree for which to calculate the coherence
   * @returns {number}: the coherence of the given tree
   * @private
   */
  _coherence(tree) {
    let tagCounter = {};

    //iterator over all the edges
    for (let i = 0; i < tree.edgeIDs.length; i++) {
      let tags = this.graph.get(tree.edgeIDs[i]).tags;
      //logger.log()

      //update the counters for the tags
      for (let j = 0; j < tags.length; j++) {
        let tag = tags[j];

        //initialize tagCounter when new tag found
        if (tagCounter[tag] === undefined) {
          tagCounter[tag] = 1;
        } else {
          tagCounter[tag]++;
        }
      }
    }

    //get all the counts of the tags
    let counts = Object.keys(tagCounter).map(function (key) {
      return tagCounter[key];
    });

    return Math.max.apply(null, counts) / tree.edgeIDs.length;
  }

  /**
   * Create an heap for the iterators.
   * @returns {*}
   * @private
   */
  static _createIteratorHeap() {
    return new Heap(function (a, b) {
      if (a.getDistance() > b.getDistance()) {
        return -1;
      } else if (a.getDistance() < b.getDistance()) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  /**
   * Create a heap for the trees.
   * @returns {*}
   * @private
   */
  static _createOutputHeap() {
    return new Heap(function (a, b) {
      if (a.weight < b.weight) {
        return 1;
      } else if (a.weight > b.weight) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  /**
   * Create iterators based on the mapping and put them in the iterator heap
   * @param mapping: the mapping from which iterators need to be generated
   * @param iteratorHeap: the iterator heap to which the iterators need to be added
   * @private
   */
  _createIterators(mapping, iteratorHeap) {
    let attributes = mapping.attributes;
    let nodes = mapping.nodes;

    for (let i = 0; i < attributes.length; i++) {
      let node = this.graph.get(nodes[i].u);
      let iterator = new Iterator(node, i, this.graph);
      this.origins.push(node);

      iteratorHeap.push(iterator);
      this.iterators.push(iterator);
    }
  }

  /**
   * Generate the top K models for a mapping.
   * @param mapping: the mapping for which to generate models
   * @param k: the top-k models that need to be returned
   * @returns {Array}
   */
  getModels(mapping, k) {
    let iteratorHeap = SemanticModelGenerator._createIteratorHeap();
    let outputHeap = SemanticModelGenerator._createOutputHeap();

    this._createIterators(mapping, iteratorHeap);

    //check every iterator until no iterators are left
    while (!iteratorHeap.empty()) {
      //get the best iterator (shortest distance)
      let topIterator = iteratorHeap.pop();
      let nn = topIterator.getNextNode();
      let v = nn.node;
      //logger.log(v);

      //only add reconsider the iterator again if is has another node
      if (topIterator.hasNextNode()) {
        //logger.log('iterator again in heap');
        iteratorHeap.push(topIterator);
      }

      //if additional iterators were created, add them to the heap
      nn.additionalIterators.forEach(function (it) {
        iteratorHeap.push(it);
        //logger.log(it.getI() + ' pushed on heap');
        //logger.log(it.getCurrentNode());
      });

      //a list to keep track of all the iterators that traveled to a specific node
      if (v.list === undefined) {
        v.list = {};
      }

      let edges = [];

      topIterator.getEdges().forEach(function (e) {
        edges.push(e);
      });

      let temp = {origin: topIterator.getOrigin(), iterator: topIterator, edges: edges};
      let crossProduct = SemanticModelGenerator._crossProduct(temp, v.list, temp);
      //logger.log('#crossProduct = ' + crossProduct.length);

      v.list[topIterator.getI()] = temp;
      let self = this;

      crossProduct.forEach(function (p) {
        let resultTree = self.getResultTree(p);
        logger.log(resultTree);

        if (outputHeap.size() === self.outputHeapSize) {
          outputHeap.pop();
        }

        outputHeap.push(resultTree);
      });
    }

    let results = [];
    let resultsHeap = new Heap(function (a, b) {
      if (a.weight > b.weight) {
        return 1;
      } else if (a.weight < b.weight) {
        return -1;
      } else {
        return 0;
      }
    });

    outputHeap.toArray().forEach(function (a) {
      resultsHeap.push(a);
    });

    while (!resultsHeap.empty() && results.length < k) {
      let temp = resultsHeap.pop();
      temp.coherence = this._coherence(temp);
      results.push(temp);
    }

    //console.log(results);
    return results;
  }

  /**
   *
   * @param trees: trees that need to be sorted
   * @returns {Array} of sorted @trees first on coherence (higher is better) and then on weight (lower is better)
   */
  static sortTrees(trees) {
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
}

module.exports = SemanticModelGenerator;