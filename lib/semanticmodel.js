let extend = require('extend');
let type = require('./type.js').types;
let validateType = require('./type.js').validate;

class SemanticModel {

  constructor() {
    this.nodes = [];
    this.edges = [];
    this.counter = 0;
  }

  findNode(type, data) {
    if (!validateType(type)) {
      throw {message: 'The given type is invalid.'};
    }

    let results = [];

    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].type === type && this.nodes[i].data === data) {
        results.push(this.nodes[i]);
      }
    }

    return results;
  }

  createNode(node) {
    if (node.type !== undefined && validateType(node.type)) {
      throw {message: 'The type of the node is invalid.'};
    }

    if (node.type === undefined) {
      node.type = type.CLASS;
    }

    let newNode;

    if (node.type === type.CLASS) {
      newNode = extend({
        type: type.CLASS,
        supporters: [],
        data: undefined,
        sample: undefined
      }, node);
    } else {
      newNode = extend({
        type: type.DATAREFERENCE,
        supporters: [],
        data: undefined,
        language: undefined,
        datatype: undefined,
        sample: undefined
      }, node);
    }

    newNode.id = this.counter;
    this.counter++;
    this.nodes.push(newNode);

    return newNode;
  }

  createEdge(edge) {
    let newEdge = extend({
      supporters: [],
      data: undefined,
      source: undefined,
      target: undefined
    }, edge);

    newEdge.id = this.counter;
    this.counter++;
    this.edges.push(newEdge);

    return newEdge;
  }

  findEdge(data) {
    let results = [];

    for (let i = 0; i < this.edges.length; i++) {
      if (this.edges[i].type === type && this.edges[i].data === data) {
        results.push(this.edges[i]);
      }
    }

    return results;
  }

  get(id) {
    let i = 0;

    while (i < this.nodes.length && this.nodes[i].id !== id) {
      i++;
    }

    if (i < this.nodes.length) {
      return this.nodes[i];
    } else {
      i = 0;

      while (i < this.edges.length && this.edges[i].id !== id) {
        i++;
      }

      if (i < this.edges.length) {
        return this.edges[i];
      } else {
        return null;
      }
    }
  }

  exportModel() {
    let temp = {
      nodes: [],
      edges: [],
      counter: this.counter
    };

    for (let i = 0; i < this.nodes.length; i ++) {
      temp.nodes.push(extend(true, {}, this.nodes[i]));
    }

    for (let i = 0; i < this.edges.length; i ++) {
      temp.edges.push(extend(true, {}, this.edges[i]));
    }

    return temp;
  }

  importModel(model) {
    this.counter = model.counter;

    for (let i = 0; i < model.nodes.length; i ++) {
      this.nodes.push(extend(true, {}, model.nodes[i]));
    }

    for (let i = 0; i < model.edges.length; i ++) {
      this.edges.push(extend(true, {}, model.edges[i]));
    }
  }

  getAllNodes(type){
    if (type === undefined) {
      return this.nodes;
    } else if (validateType(type)) {
      let results = [];

      for (let i = 0; i < this.nodes.length; i ++) {
        if (this.nodes[i].type === type) {
          results.push(this.nodes[i]);
        }
      }

      return results;
    } else {
      throw {message: 'The given type is invalid.'};
    }
  }

  getAllEdges(){
    return this.edges;
  }
}

module.exports = SemanticModel;