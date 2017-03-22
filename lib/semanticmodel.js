let extend = require('extend');
let type = require('./type.js').types;
let isValidateType = require('./type.js').isValid;

class SemanticModel {

  constructor() {
    this.nodes = [];
    this.edges = [];
    this.counter = 0;
  }

  getNodes(type, label) {
    if (!isValidateType(type)) {
      throw {message: 'The given type is invalid.'};
    }

    let results = [];

    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].type === type && this.nodes[i].label === label) {
        results.push(this.nodes[i]);
      }
    }

    return results;
  }

  createNode(node) {
    if (node.type !== undefined && !isValidateType(node.type)) {
      throw {message: 'The type of the node is invalid.'};
    }

    if (node.type === undefined) {
      node.type = type.CLASS;
    }

    let newNode;

    if (node.type === type.CLASS) {
      newNode = extend({
        type: type.CLASS,
        tags: [],
        label: undefined,
        sample: undefined
      }, node);
    } else {
      newNode = extend({
        type: type.DATAREFERENCE,
        tags: [],
        label: undefined,
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
      tags: [],
      label: undefined,
      source: undefined,
      target: undefined,
    }, edge);

    newEdge.id = this.counter;
    this.counter++;
    this.edges.push(newEdge);

    return newEdge;
  }

  getEdges(label) {
    let results = [];

    for (let i = 0; i < this.edges.length; i++) {
      if (this.edges[i].type === type && this.edges[i].label === label) {
        results.push(this.edges[i]);
      }
    }

    return results;
  }

  getEdgesBetweenTypes(sourceType, targetType) {
    let results = [];

    for (let i = 0; i < this.edges.length; i++) {
      let edge = this.edges[i];
      if (this.get(edge.source).type === sourceType && this.get(edge.target).type === targetType) {
        results.push(edge);
      }
    }

    return results;
  }

  getEdgesBetweenNodes(sourceNode, targetNode, label) {
    let results = [];

    for (let i = 0; i < this.edges.length; i++) {
      if (this.edges[i].source === sourceNode.id && this.edges[i].target === targetNode.id) {
        if (!label || this.edges[i].label === label) {
          results.push(this.edges[i]);
        }
      }
    }

    return results;
  }

  _getOutGoingEdgeWithLabel(node, label) {
    let i = 0;

    while (i < this.edges.length && (this.edges[i].source !== node.id || this.edges[i].label !== label)) {
      i++;
    }

    if (i < this.edges.length) {
      return this.edges[i];
    } else {
      return null;
    }
  }

  /*
    return: any element with id === @id, either edge or node
   */
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

    for (let i = 0; i < this.nodes.length; i++) {
      temp.nodes.push(extend(true, {}, this.nodes[i]));
    }

    for (let i = 0; i < this.edges.length; i++) {
      temp.edges.push(extend(true, {}, this.edges[i]));
    }

    return temp;
  }

  importModel(model) {
    this.counter = model.counter;

    for (let i = 0; i < model.nodes.length; i++) {
      this.nodes.push(extend(true, {}, model.nodes[i]));
    }

    for (let i = 0; i < model.edges.length; i++) {
      this.edges.push(extend(true, {}, model.edges[i]));
    }
  }

  getAllNodes(type) {
    if (type === undefined) {
      return this.nodes;
    } else if (isValidateType(type)) {
      let results = [];

      for (let i = 0; i < this.nodes.length; i++) {
        if (this.nodes[i].type === type) {
          results.push(this.nodes[i]);
        }
      }

      return results;
    } else {
      throw {message: 'The given type is invalid.'};
    }
  }

  getAllEdges() {
    return this.edges;
  }


  static _getNodeWithLargestTagSet(nodes, tag) {
    let node;

    for (let i = 0; i < nodes.length; i++) {
      if (node === undefined || node.tags.length < nodes[i].tags.length) {
        node = nodes[i];
      } else if (node.tags.length === nodes[i].tags.length) {
        if (node.tags.indexOf(tag) !== -1 && nodes[i].tags.indexOf(tag) === -1) {
          node = nodes[i];
        }
      }
    }

    return node;
  }

  _addClassNodesModel(model, mapNodesFromModelThis, tag) {
    let classNodesModel = model.getAllNodes(type.CLASS);

    for (let i = 0; i < classNodesModel.length; i++) {
      //class node v
      let v = classNodesModel[i];
      //console.log('===');
      //console.log(v);
      //label of v
      let label = v.label;
      //number of class nodes in model with label @label
      let c1 = model.getNodes(type.CLASS, label).length;
      //console.log('c1: ' + c1);
      //number of class nodes in this with label @label
      let c2 = this.getNodes(type.CLASS, label).length;
      //console.log('c2: ' + c2);
      //add (c1 - c2) class nodes with label @label to this
      let diffC = Math.max(0, c1 - c2);

      for (let j = 0; j < diffC; j++) {
        this.createNode({type: type.CLASS, label: label, tags: [tag]});
      }

      //class nodes with label @label in this
      let matchedNodes = this.getNodes(type.CLASS, label);
      let unmappedNodes = matchedNodes.filter(function (node) {
        let values = Object.keys(mapNodesFromModelThis).map(function (key) {
          return mapNodesFromModelThis[key];
        });

        let k = 0;

        while (k < values.length && values[k] !== node.id) {
          k++;
        }

        return k === values.length;
      });

      //console.log(unmappedNodes);
      let vTag = SemanticModel._getNodeWithLargestTagSet(unmappedNodes, tag);
      //console.log(vTag);

      if (vTag.tags.indexOf(tag) === -1) {
        vTag.tags.push(tag);
      }

      mapNodesFromModelThis[v.id] = vTag.id;
      //console.log(mapNodesFromModelThis);
    }
  }

  _addDataNodesModel(model, mapNodesFromModelThis, tag) {
    let edgesBetweenClassAndDataNodes = model.getEdgesBetweenTypes(type.CLASS, type.DATAREFERENCE);

    for (let i = 0; i < edgesBetweenClassAndDataNodes.length; i++) {
      let e = edgesBetweenClassAndDataNodes[i];
      let u = model.get(e.source);
      let v = model.get(e.target);

      //label of edge @e
      let label = e.label;
      let u2 = this.get(mapNodesFromModelThis[u.id]);
      let outgoingEdge = this._getOutGoingEdgeWithLabel(u2, label);
      let v2;

      if (outgoingEdge) {
        //
        v2 = this.get(outgoingEdge.target);
        v2.tags.push(tag);
      } else {
        //no outgoing edge found, create new one
        v2 = this.createNode(v);
      }

      mapNodesFromModelThis[v.id] = v2.id;
    }
  }

  _addEdgesModel(model, mapNodesFromModelThis, tag) {
    for (let i = 0; i < model.getAllEdges().length; i++) {
      let e = model.getAllEdges()[i];
      //source node of edge @e
      let u = model.get(e.source);
      //target node of edge @e
      let v = model.get(e.target);
      //get corresponding node in this
      let u2 = this.get(mapNodesFromModelThis[u.id]);
      //get corresponding node in this
      let v2 = this.get(mapNodesFromModelThis[v.id]);

      //all edges between u2 and v2 with label @e.label
      let edgesBetweenU2AndV2 = this.getEdgesBetweenNodes(u2, v2, e.label);

      if (edgesBetweenU2AndV2.length > 0) {
        //at least one edge found, so add tag to it
        //normally, maximum one edge should be found
        edgesBetweenU2AndV2[0].tags.push(tag);
      } else {
        //no edge found, so we make a new one
        this.createEdge({
          label: e.label,
          source: u2.id,
          target: v2.id,
          tags: [tag]
        });

        //console.log('model: ' + u.id + ' -- ' + e.label + ' --> ' + v.id);
        //console.log('graph: ' + u2.id + ' -- ' + e.label + ' --> ' + v2.id);
      }
    }
  }

  addModel(model, tag) {
    //keys: nodes in mode
    //values: matched nodes in this
    let mapNodesFromModelThis = {};

    this._addClassNodesModel(model, mapNodesFromModelThis, tag);
    this._addDataNodesModel(model, mapNodesFromModelThis, tag);
    this._addEdgesModel(model, mapNodesFromModelThis, tag);
  }

  /*
    @semanticTypes: array with object with three attributes: @class, @predicate, and @attribute
   */
  addSemanticTypes(semanticTypes) {
    for (let i = 0; i < semanticTypes.length; i++) {
      let lV = semanticTypes[i].class;
      let lE = semanticTypes[i].predicate;
      let a = semanticTypes[i].attribute;

      let vMatch = this.getNodes(type.CLASS, lV);

      if (vMatch.length === 0) {
        this.createNode({
          type: type.CLASS,
          label: lV
        });

        vMatch = this.getNodes(type.CLASS, lV);
      }

      for (let j = 0; j < vMatch.length; j++) {
        let v = vMatch[j];
        let outgoingLink = this._getOutGoingEdgeWithLabel(v, lE);

        if (!outgoingLink) {
          let w = this.createNode({
            type: type.DATAREFERENCE,
            label: a
          });

          this.createEdge({
            label: lE,
            source: v.id,
            target: w.id
          });
        }
      }
    }
  }
}

module.exports = SemanticModel;