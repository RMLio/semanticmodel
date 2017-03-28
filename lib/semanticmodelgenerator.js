/**
 * Created by pheyvaer on 23.03.17.
 */

let Heap = require('heap');
let extend = require('extend');
let SemanticModel = require('./semanticmodel.js');

class Iterator {

  constructor(node, i, graph) {
    this.currentNode = node;
    this.graph = graph;
    this.i = i;
    this.origin = node;
    this.distance = 0;
    this.edges = [];
    this.getNextNode();
  }

  getOrigin() {
    return this.origin;
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
    let bestEdge;

    for (let i = 0; i < edges.length; i++) {
      if (edges[i].target === temp.id) {
        if (bestEdge === undefined || bestEdge.weight > edges[i].weight) {
          bestEdge = edges[i];
        }
      }
    }

    if (bestEdge) {
      this.currentNode = this.graph.get(bestEdge.source);
      this.edges.push(bestEdge);
      this.distance = bestEdge.weight;
    } else {
      this.currentNode = null;
    }

    console.log('58 => Now current node is ' + JSON.stringify(this.currentNode));

    return temp;
  }

  getPreviousNodes(node) {
    return this.previousNodes[node];
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
  }

  static _crossProduct(u, list, i) {
    let result = list.slice();

    list.splice(i, 1);
    list.push(u);

    return result;
  }

  getResultTree(v, crossProduct) {
    //get all edges (unique)
    let edgeIDs = [];
    let weight = 0;

    for (let i = 0; i < crossProduct.length; i++) {
      let origin = crossProduct[i];

      if (origin === undefined) {
        weight = Infinity;
        break;
      }

      console.log('104 => ' + JSON.stringify(origin));
      let j = 0;

      while (j < this.iterators.length && origin.id !== this.iterators[j].getOrigin().id) {
        j++
      }

      let edges = this.iterators[j].getEdges();

      for (let k = 0; k < edges.length; k++) {
        console.log('114 => ' + edges[k].id);
        if (edgeIDs.indexOf(edges[k].id) === -1) {
          edgeIDs.push(edges[k].id);
          weight += edges[k].weight;
        }
      }
    }

    let tree = {
      weight: weight,
      edgeIDs: edgeIDs,
    };

    return tree;
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

      iteratorHeap.push(iterator);
      this.iterators.push(iterator);
    }

    while (!iteratorHeap.empty()) {
      let topIterator = iteratorHeap.pop();
      let v = topIterator.getNextNode();
      console.log(v);

      if (topIterator.hasNextNode()) {
        iteratorHeap.push(topIterator);
      }

      if (v.list === undefined) {
        v.list = [];

        for (let i = 0; i < attributes.length; i++) {
          v.list[i] = undefined;
        }
      }

      //let crossProduct = SemanticModelGenerator._crossProduct(topIterator.getOrigin(), v.list, topIterator.getI());
      v.list[topIterator.getI()] = topIterator.getOrigin();

      let resultTree = this.getResultTree(v, v.list);
      console.log(resultTree);

      //if (resultTree.getRoot().children.length > 1) {
      if (outputHeap.size() === this.outputHeapSize) {
        outputHeap.pop();
      }

      outputHeap.push(resultTree);
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

    outputHeap.toArray().forEach(function(a){
      resultsHeap.push(a);
    });

    while (!resultsHeap.empty() && results.length < k) {
      results.push(resultsHeap.pop());
    }

    //console.log(results);
    return results;
  }
}

module.exports = SemanticModelGenerator;