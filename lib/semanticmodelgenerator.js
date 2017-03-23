/**
 * Created by pheyvaer on 23.03.17.
 */

class iterator {

  constructor(node) {
    this.node = node;
  }
}

class SemanticModelGenerator {

  constructor(graph){
    this.graph = graph;
  }

  getModels(mapping, k) {
    let attributes = mapping.attributes;
    let nodes = mapping.nodes;

    for(let i = 0; i < attributes.length; i ++) {
      let node = nodes[i].u;

    }
  }
}

module.exports = SemanticModelGenerator;