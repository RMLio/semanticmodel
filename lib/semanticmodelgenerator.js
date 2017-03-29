/**
 * Created by pheyvaer on 23.03.17.
 */

let Heap = require('heap');
let extend = require('extend');
let SemanticModel = require('./semanticmodel.js');
let logger = require('tracer').console(
  {
    format: "{{line}} => {{message}}"
  });

class Iterator {

  constructor(node, i, graph, getNextNode) {
    if (getNextNode === undefined) {
      getNextNode = true;
    }

    this.currentNode = node;
    this.graph = graph;
    this.i = i;
    this.origin = node;
    this.distance = 0;
    this.edges = [];
    this.cloneCounter = 0;

    if (getNextNode) {
      this.getNextNode();
    }
  }

  clone() {
    this.cloneCounter++;
    let clone = new Iterator(null, '' + this.i + '-' + this.cloneCounter, this.graph, false);
    clone.setOrigin(this.origin);

    return clone;
  }

  getOrigin() {
    return this.origin;
  }

  setOrigin(origin) {
    this.origin = origin;
  }

  setDistance(distance) {
    this.distance = distance;
  }

  setEdges(edges) {
    this.edges = [];
    let self = this;

    edges.forEach(function (e) {
      self.edges.push(e);
    });
  }

  setCurrentNode(node) {
    this.currentNode = node;
  }

  getCurrentNode(){
    return this.currentNode;
  }

  getI() {
    return this.i;
  }

  getDistance() {
    return this.distance;
  }

  getEdges() {
    return this.edges;
  }

  getNextNode() {
    let temp = this.currentNode;
    let edges = this.graph.getAllEdges();
    let possibleNewIteratorEdges = [];
    let bestEdge;
    let additionalIterators = [];

    //console.log(this.i);
    //console.log(this.currentNode);

    for (let i = 0; i < edges.length; i++) {
      if (edges[i].target === temp.id) {
        if (bestEdge === undefined || bestEdge.weight > edges[i].weight) {
          bestEdge = edges[i];
        }

        possibleNewIteratorEdges.push(edges[i]);
      }
    }

    //logger.log(possibleNewIteratorEdges.length);

    if (bestEdge) {
      //logger.log(bestEdge.id);
      //for all the other edges we create new iterators
      let self = this;

      possibleNewIteratorEdges.forEach(function (edge) {
        //logger.log(JSON.stringify(edge));
        if (edge.id !== bestEdge.id) {
          let it = self.clone();

          it.setCurrentNode(self.graph.get(edge.source));

          if (it.getCurrentNode() === null) {
            logger.log('This should NOT happen!');
          }

          it.setDistance(edge.weight);

          let edges = [];

          self.edges.forEach(function (e) {
            edges.push(e);
          });

          edges.push(edge);

          it.setEdges(edges);
          additionalIterators.push(it);
        }
      });

      if (additionalIterators.length > 0) {
        logger.log('additional iterators found!');
      }

      this.currentNode = this.graph.get(bestEdge.source);
      this.edges.push(bestEdge);
      this.distance = bestEdge.weight;
    } else {
      this.currentNode = null;
    }

    //logger.log('Now current node is');
    //logger.log(this.currentNode);
    //logger.log('Now current node is ' + JSON.stringify(this.currentNode));
    //logger.log('Now current node is ' + this.currentNode);

    return {node: temp, additionalIterators: additionalIterators};
  }

  hasNextNode() {
    return this.currentNode !== null;
  }
}

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

    for(let o = 0; o < Object.keys(list).length; o ++) {
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

  getResultTree(v, crossProduct) {
    //get all edges (unique)
    let edgeIDs = [];
    let weight = 0;
    let oIDs = [];

    this.origins.forEach(function(o){
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

  _coherence(tree) {
    let tagCounter = {};

    for (let i = 0; i < tree.edgeIDs.length; i++) {
      let tags = this.graph.get(tree.edgeIDs[i]).tags;
      //logger.log()

      for (let j = 0; j < tags.length; j++) {
        let tag = tags[j];

        if (tagCounter[tag] === undefined) {
          tagCounter[tag] = 1;
        } else {
          tagCounter[tag]++;
        }
      }
    }

    let counts = Object.keys(tagCounter).map(function (key) {
      return tagCounter[key];
    });

    return Math.max.apply(null, counts) / tree.edgeIDs.length;
  }

  getModels(mapping, k) {
    let iteratorHeap = new Heap(function (a, b) {
      if (a.getDistance() > b.getDistance()) {
        return -1;
      } else if (a.getDistance() < b.getDistance()) {
        return 1;
      } else {
        return 0;
      }
    });
    let outputHeap = new Heap(function (a, b) {
      if (a.weight < b.weight) {
        return 1;
      } else if (a.weight > b.weight) {
        return -1;
      } else {
        return 0;
      }
    });
    let attributes = mapping.attributes;
    let nodes = mapping.nodes;

    for (let i = 0; i < attributes.length; i++) {
      let node = this.graph.get(nodes[i].u);
      let iterator = new Iterator(node, i, this.graph);
      this.origins.push(node);

      iteratorHeap.push(iterator);
      this.iterators.push(iterator);
    }

    while (!iteratorHeap.empty()) {
      let topIterator = iteratorHeap.pop();
      let nn = topIterator.getNextNode();
      let v = nn.node;
      //logger.log(v);

      if (topIterator.hasNextNode()) {
        //logger.log('iterator again in heap');
        iteratorHeap.push(topIterator);
      }

      nn.additionalIterators.forEach(function(it){
        iteratorHeap.push(it);
        //logger.log(it.getI() + ' pushed on heap');
        //logger.log(it.getCurrentNode());
      });

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
        let resultTree = self.getResultTree(v, p);
        logger.log(resultTree);

        //if (resultTree.getRoot().children.length > 1) {
        if (outputHeap.size() === self.outputHeapSize) {
          outputHeap.pop();
        }

        outputHeap.push(resultTree);
      });
      //}
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

    for (let i = 0; i < Object.keys(ordered).length; i ++) {
      let k = Object.keys(ordered)[i];
      let v = ordered[k];

      ordered[k] = v.sort(function(a, b){return a.weight - b.weight});
      ordered2.push({coherence: k, trees: v.sort(function(a, b){return a.weight - b.weight})});
    }

    ordered2 = ordered2.sort(function(a, b){
      return b.coherence - a.coherence;
    });

    let result = [];

    ordered2.forEach(function(v){
      result = result.concat(v.trees);
    });

    return result;
  }
}

module.exports = SemanticModelGenerator;