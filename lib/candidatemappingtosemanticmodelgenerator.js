/**
 * Created by pheyvaer on 23.03.17.
 */

let Heap = require('heap');
let extend = require('extend');
let SemanticModel = require('./semanticmodel.js');
let Iterator = require('./banksiterator.js');
let logger = require('tracer').console({format: "{{line}} => {{message}}", level:'error'});

class SemanticModelGenerator {

  constructor(graph, outputHeapSize) {
    this.graph = new SemanticModel();
    this.graph.importModel(graph.exportModel());
    this.outputHeapSize = outputHeapSize;
    this.iterators = [];
    this.origins = [];
  }

  /**
   * Calculate the cross product of the all the visits to a node by iterators.
   * @param currentIteratorVisit: visit of the current iterator
   * @param list: previous node visits by iterators
   * @returns {[*]}: cross product
   * @private
   */
  static _crossProduct(currentIteratorVisit, list) {
    let l = [];

    for (let o = 0; o < Object.keys(list).length; o++) {
      let v = list[Object.keys(list)[o]];

      if (v.iterator.getI() !== currentIteratorVisit.iterator.getI()) {
        l.push(v);
      }
    }

    //delete l[i];
    let perOrigin = {};

    l.forEach(function (item) {
      let o = item.origin;

      if (Object.keys(perOrigin).indexOf(o.id) === -1) {
        perOrigin[o.id] = [];
      }

      perOrigin[o.id].push(item);
    });

    let result = [[currentIteratorVisit]];

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

  /**
   * Generates a tree based on a given set of visits by iterators
   * @param iteratorVisits: the visits of iterators
   * @returns {{weight: number, edgeIDs: Array}}
   */
  _getResultTree(iteratorVisits) {
    //get all edges (unique)
    let edgeIDs = [];
    let weight = 0;
    let oIDs = [];

    this.origins.forEach(function (o) {
      oIDs.push(o.id);
    });

    for (let i = 0; i < iteratorVisits.length; i++) {
      let origin = iteratorVisits[i].origin;
      let edges = iteratorVisits[i].edges;

      let index = oIDs.indexOf(origin.id);

      //remove the ID of the origin, once encountered
      if (index !== -1) {
        oIDs.splice(index, 1);
      }

      //iterate over all the edges to calculate the weight of the tree
      for (let k = 0; k < edges.length - 1; k++) {
        if (edgeIDs.indexOf(edges[k].id) === -1) {
          edgeIDs.push(edges[k].id);
          weight += edges[k].weight;
        }
      }
    }

    //when not all origins are in the tree, the tree is not good, so weight is Infinity
    if (oIDs.length > 0) {
      //logger.log('oIDS left: ' + oIDs.length);
      weight = Infinity;
    }

    return {
      weight: weight,
      edgeIDs: edgeIDs
    };
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
  getModelsFromCandidateMapping(mapping, k) {
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

      let iteratorVisit = {origin: topIterator.getOrigin(), iterator: topIterator, edges: edges};
      let crossProduct = SemanticModelGenerator._crossProduct(iteratorVisit, v.list);
      //logger.log('#crossProduct = ' + crossProduct.length);

      v.list[topIterator.getI()] = iteratorVisit;
      let self = this;

      crossProduct.forEach(function (iteratorVisits) {
        let resultTree = self._getResultTree(iteratorVisits);
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
}

module.exports = SemanticModelGenerator;