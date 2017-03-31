let extend = require('extend');
let type = require('./type.js').types;
let isValidateType = require('./type.js').isValid;

class SemanticModel {

  constructor() {
    this.nodes = [];
    this.edges = [];
    this.counter = 0;
    this.defaultWeight = 1;
  }

  /*
    return: all nodes with type @type and label @label
   */
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

  /*
    create new currentNode using @currentNode
    currentNode.id is overwritten
    type is type.CLASS is not specified
    return: newly created currentNode
   */
  createNode(node) {
    if (node.type !== undefined && !isValidateType(node.type)) {
      throw {message: 'The type of the currentNode is invalid.'};
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

  /*
   create new edge using @edge
   edge.id is overwritten
   return: newly created edge
   */
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

  /*
    return: all edges with label @label
   */
  getEdges(label) {
    let results = [];

    for (let i = 0; i < this.edges.length; i++) {
      if (this.edges[i].label === label) {
        results.push(this.edges[i]);
      }
    }

    return results;
  }

  getEdgesWithNodeAsSource(id) {
    let result = [];

    edges.forEach(function(edge){
      if (edge.source === id) {
        result.push(edge);
      }
    });

    return result;
  }

  /*
    return: all edges where the source currentNode is of the type @sourecType and target currentNode is of the type @targetType
   */
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

  /*
    return: all edges with label @label between the nodes @sourceNode and @targetNode
   */
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

  /*
    return: edge that has as source currentNode @currentNode and that has label @label
   */
  _getOutgoingEdgeWithLabel(node, label) {
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
   return: any element with id === @id, either edge or currentNode
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

  /*
    return: JSON object that can be used with `importModel` to recreate the semantic model
   */
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

  /*
    the JSON object created by `exportModel` can be used by this method to reconstruct a semantic model
   */
  importModel(model) {
    this.counter = model.counter;

    for (let i = 0; i < model.nodes.length; i++) {
      this.nodes.push(extend(true, {}, model.nodes[i]));
    }

    for (let i = 0; i < model.edges.length; i++) {
      this.edges.push(extend(true, {}, model.edges[i]));
    }
  }

  /*
    return: all nodes that have as type @type
   */
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

  /*
    return: all edges
   */
  getAllEdges() {
    return this.edges;
  }


  /*
    return: currentNode with the largest set of .tags from the array @nodes
   */
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

  /*
    add the class nodes of the model @model to this
    @model: the model from which the class nodes need to be added
    @tag: the unique tag for the model
    @mapNodesFromModelThis: the map between the nodes of @model and this
   */
  _addClassNodesModel(model, mapNodesFromModelThis, tag) {
    let classNodesModel = model.getAllNodes(type.CLASS);

    for (let i = 0; i < classNodesModel.length; i++) {
      //class currentNode v
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
        this.createNode({type: type.CLASS, label: label, tags: [tag], weight: this.defaultWeight - 1 / (this.numOfModels + 1)});
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
        vTag.weight = this.defaultWeight - vTag.tags.length / (this.numOfModels + 1);
      }

      mapNodesFromModelThis[v.id] = vTag.id;
      //console.log(mapNodesFromModelThis);
    }
  }

  /*
    add data nodes of the model @model to this
    @model: the model from which the data nodes need to be added
    @tag: the unique tag for the model
    @mapNodesFromModelThis: the map between the nodes of @model and this
   */
  _addDataNodesModel(model, mapNodesFromModelThis, tag) {
    let edgesBetweenClassAndDataNodes = model.getEdgesBetweenTypes(type.CLASS, type.DATAREFERENCE);

    for (let i = 0; i < edgesBetweenClassAndDataNodes.length; i++) {
      let e = edgesBetweenClassAndDataNodes[i];
      let u = model.get(e.source);
      let v = model.get(e.target);

      //label of edge @e
      let label = e.label;
      let u2 = this.get(mapNodesFromModelThis[u.id]);
      let outgoingEdge = this._getOutgoingEdgeWithLabel(u2, label);
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

  /*
    adds the edges of the model @model to this
    @model: the model from which the edges need to be added
    @tag: the unique tag for the model
    @mapNodesFromModelThis: the map between the nodes of @model and this
   */
  _addEdgesModel(model, mapNodesFromModelThis, tag) {
    for (let i = 0; i < model.getAllEdges().length; i++) {
      let e = model.getAllEdges()[i];
      //source currentNode of edge @e
      let u = model.get(e.source);
      //target currentNode of edge @e
      let v = model.get(e.target);
      //get corresponding currentNode in this
      let u2 = this.get(mapNodesFromModelThis[u.id]);
      //get corresponding currentNode in this
      let v2 = this.get(mapNodesFromModelThis[v.id]);

      //all edges between u2 and v2 with label @e.label
      let edgesBetweenU2AndV2 = this.getEdgesBetweenNodes(u2, v2, e.label);

      if (edgesBetweenU2AndV2.length > 0) {
        //at least one edge found, so add tag to it
        //normally, maximum one edge should be found
        let edge = edgesBetweenU2AndV2[0];
        edge.tags.push(tag);
        edge.weight = this.defaultWeight - edge.tags.length / (this.numOfModels + 1);
      } else {
        //no edge found, so we make a new one
        this.createEdge({
          label: e.label,
          source: u2.id,
          target: v2.id,
          tags: [tag],
          weight: this.defaultWeight
        });

        //console.log('model: ' + u.id + ' -- ' + e.label + ' --> ' + v.id);
        //console.log('graph: ' + u2.id + ' -- ' + e.label + ' --> ' + v2.id);
      }
    }
  }

  /*
    add a semantic model @model to this
    @model: the semantic model to add
    @tag: a unique tag for @model
   */
  addModel(model, tag) {
    //keys: nodes in mode
    //values: matched nodes in this
    let mapNodesFromModelThis = {};

    this._addClassNodesModel(model, mapNodesFromModelThis, tag);
    this._addDataNodesModel(model, mapNodesFromModelThis, tag);
    this._addEdgesModel(model, mapNodesFromModelThis, tag);
  }

  addModels(models) {
    let self = this;
    self.numOfModels = models.length;

    models.forEach(function(m){
      let model = m.model;
      let tag = m.tag;

      self.addModel(model, tag);
    });
  }

  /*
   @semanticTypes: array with object with three attributes: @class, @predicate, and @attribute
   remark: we didn't implement the Karma-specific logic
   */
  addSemanticTypes(semanticTypes) {
    let weight = this.getAllEdges().length;

    for (let i = 0; i < semanticTypes.length; i++) {
      let lV = semanticTypes[i].class;
      let lE = semanticTypes[i].predicate;
      let a = semanticTypes[i].attribute;

      //look for the class currentNode of the semantic type
      let vMatches = this.getNodes(type.CLASS, lV);

      if (vMatches.length === 0) {
        //no class currentNode found, so we add one
        this.createNode({
          type: type.CLASS,
          label: lV
        });

        vMatches = this.getNodes(type.CLASS, lV);
      }

      //we iterate over all the class nodes
      for (let j = 0; j < vMatches.length; j++) {
        let v = vMatches[j];
        //look for outgoing edge with label of semantic type
        let outgoingEdge = this._getOutgoingEdgeWithLabel(v, lE);

        if (!outgoingEdge) {
          //such edge not found, so we add a data currentNode and edge
          let w = this.createNode({
            type: type.DATAREFERENCE,
            label: a
          });

          this.createEdge({
            label: lE,
            source: v.id,
            target: w.id,
            weight: weight
          });
        } else {
          //This is NOT done in the original algorithm!
          this.get(outgoingEdge.target).label = a;
        }
      }
    }
  }

  //TODO take into account disconnected graph components
  //TODO take into rdfs:subClassOf
  /*
    add the ontology paths of the ontology @ontology to this
    @ontology: the ontology from which to consider the ontology paths
   */
  addOntologyPaths(ontology) {
    let classes = this.getAllNodes(type.CLASS);
    let weight = this.getAllEdges().length;

    //these two for loops iterate over all class pairs
    for (let i = 0; i < classes.length; i++) {
      for (let j = 0; j < classes.length; j++) {
        if (i !== j) {
          let u = classes[i];
          let v = classes[j];
          let c1 = u.label;
          let c2 = v.label;

          //get all the properties that connect the two class nodes @u and @v
          let properties = ontology.getConnectingProperties(c1, c2);

          for (let k = 0; k < properties.length; k++) {
            let lE = properties[k];

            //check if the property is already in this
            let existingEdges = this.getEdgesBetweenNodes(u, v, lE);

            if (existingEdges.length === 0) {
              //the property is not yet present, add it
              this.createEdge({
                source: u.id,
                target: v.id,
                label: lE,
                weight: weight
              })
            }
          }
        }
      }
    }
  }

  static getModelBasedOnTree(tree, graph) {
    let sm = new SemanticModel();
    let edges = [];
    let nodes = [];
    let alreadyAddedNodeIDs = [];
    let largestID = -1;

    tree.edgeIDs.forEach(function(id){
      if (id > largestID) {
        largestID = id;
      }

      let edge = graph.get(id);

      edges.push(edge);

      if (alreadyAddedNodeIDs.indexOf(edge.source) === -1) {
        nodes.push(graph.get(edge.source));
        alreadyAddedNodeIDs.push(edge.source);
      }

      if (alreadyAddedNodeIDs.indexOf(edge.target) === -1) {
        nodes.push(graph.get(edge.target));
        alreadyAddedNodeIDs.push(edge.target);
      }
    });

    let largestNodeID = Math.max.apply(null, alreadyAddedNodeIDs);

    if (largestNodeID > largestID) {
      largestID = largestNodeID;
    }

    sm.importModel({edges: edges, nodes: nodes, counter: largestID + 1});

    return sm;
  }
}

module.exports = SemanticModel;