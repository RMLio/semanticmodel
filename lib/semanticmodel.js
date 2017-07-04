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

  /**
   * This method returns all nodes with the given type and label.
   * @param type: the type the node has to have
   * @param label: the label the node has to have
   * @returns {Array}
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

  /**
   * This method creates a new node, based on the information in @node.
   * @param node: the information used to create the new node; id is overwritten; type is type.CLASS if not specified
   * @returns {*}: the newly created node
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
        sample: undefined,
        weight: null
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

  /**
   * This method creates a new edge, based on the information in @edge.
   * @param edge: the information of the new edge; id is overwritten
   * @returns {target}: the newly created edge
   */
  createEdge(edge) {
    let newEdge = extend({
      tags: [],
      label: undefined,
      source: undefined,
      target: undefined,
      joinConditions: []
    }, edge);

    newEdge.id = this.counter;
    this.counter++;
    this.edges.push(newEdge);

    return newEdge;
  }

  /**
   * This method returns all edges with a given label.
   * @param label: the label the edges have to have
   * @returns {Array}
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

  /**
   * This method returns all the edges with as source the node with a given id.
   * @param id: the id of the source node of the edges
   * @returns {Array}: the resulting edges
   */
  getEdgesWithNodeAsSource(id) {
    let result = [];

    this.edges.forEach(function(edge){
      if (edge.source === id) {
        result.push(edge);
      }
    });

    return result;
  }

  /**
   * This method returns all the edges between nodes that are of of the given types.
   * @param sourceType: the type of the source of the edge
   * @param targetType: the type of the target of the edge
   * @returns {Array}: the resulting edges
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

  /**
   * This methods returns all edges with a given label between two given nodes.
   * @param sourceNode: the source node of the edge
   * @param targetNode: the target node of the edge
   * @param label: the label of the edge
   * @returns {Array}: the resulting edges
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

  /**
   * This method returns all the outgoing edges of a given node that have a given label.
   * @param node: the node that is the source of the edge
   * @param label: the label of the edge
   * @returns {*}: the resulting edge
   * @private
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

  /**
   * This method returns any element in the semantic model that has the given id.
   * @param id: the id of the element in the semantic model
   * @returns {*}
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

  /**
   * This method returns a JSON object representing the Semantic Model and can be used with the method 'importModel'
   * to recreate the Semantic Model.
   * @returns {{nodes: Array, edges: Array, counter: (number|*)}}
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

  /**
   * This method recreates the Semantic Model based on the JSON object that is created with the method 'exportModel'.
   * @param model
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

  /**
   * This method returns all nodes with a given type.
   * @param type: the type of the nodes
   * @returns {Array}: the resulting nodess
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

  /**
   * This method returns all edges.
   * @returns {Array}
   */
  getAllEdges() {
    return this.edges;
  }

  /*
    return: currentNode with the largest set of .tags from the array @nodes
   */
  /**
   * This method returns the node with the largest set of tags from the given array of nodes.
   * @param nodes: the array of nodes to consider
   * @param tag: preference is given to tag sets that do not include this tag
   * @returns {*}
   * @private
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

  /**
   * This method adds the class nodes of the given Semantic Model to this model.
   * @param model: the semantic model from which the class nodes are coming
   * @param mapNodesFromModelThis: the map between the nodes of @model and this model.
   * @param tag: the unique tag of @model
   * @private
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
        let nodeWeight = null;

        if (this.numOfModels !== undefined) {
          nodeWeight = this.defaultWeight - 1 / (this.numOfModels + 1);
        }

        this.createNode({type: type.CLASS, label: label, tags: [tag], weight: nodeWeight});
      }

      //class nodes with label @label in this
      let matchedNodes = this.getNodes(type.CLASS, label);
      let unmappedNodes = matchedNodes.filter(node => {
        let values = Object.keys(mapNodesFromModelThis).map(key => mapNodesFromModelThis[key]);

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

        if (this.numOfModels !== undefined) {
          vTag.weight = this.defaultWeight - vTag.tags.length / (this.numOfModels + 1);
        }
      }

      mapNodesFromModelThis[v.id] = vTag.id;
      //console.log(mapNodesFromModelThis);
    }
  }

  /**
   * This method adds the data nodes of the given Semantic Model to this model.
   * @param model: the semantic model from which the data nodes are coming
   * @param mapNodesFromModelThis: the map between the nodes of @model and this model.
   * @param tag: the unique tag of @model
   * @private
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

  /**
   * This method adds the edges of the given Semantic Model to this model.
   * @param model: the semantic model from which the edges are coming
   * @param mapNodesFromModelThis: the map between the nodes of @model and this model.
   * @param tag: the unique tag of @model
   * @private
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

        if (this.numOfModels !== undefined) {
          edge.weight = this.defaultWeight - edge.tags.length / (this.numOfModels + 1);
        }
      } else {
        //no edge found, so we make a new one
        let edge = {
          label: e.label,
          source: u2.id,
          target: v2.id,
          tags: [tag]
        };

        if (this.numOfModels === undefined) {
          edge.weight = null;
        } else {
          edge.weight = this.defaultWeight;
        }

        this.createEdge(edge);

        //console.log('model: ' + u.id + ' -- ' + e.label + ' --> ' + v.id);
        //console.log('graph: ' + u2.id + ' -- ' + e.label + ' --> ' + v2.id);
      }
    }
  }

  /**
   * This method adds the given Semantic Model to this model.
   * @param model: the semantic model that needs to be added
   * @param tag: the unique tag of @model
   * @private
   */
  _addModel(model, tag) {
    //keys: nodes in mode
    //values: matched nodes in this
    let mapNodesFromModelThis = {};

    this._addClassNodesModel(model, mapNodesFromModelThis, tag);
    this._addDataNodesModel(model, mapNodesFromModelThis, tag);
    this._addEdgesModel(model, mapNodesFromModelThis, tag);
  }

  /**
   * This methods at the given models to this model.
   * @param models: the array of models that need to be added to this model
   */
  addModels(models) {
    this.numOfModels = models.length;

    models.forEach(m =>{
      let model = m.model;
      let tag = m.tag;

      this._addModel(model, tag);
    });
  }

  /**
   * This method adds the given semantic types to the model.
   * @param semanticTypes: an array of semantic types.
   * Each object in the array has three attributes: @class, @predicate, and @attribute.
   * Remark: we didn't implement the Karma-specific logic
   */
  addSemanticTypes(semanticTypes) {
    let weight = null;

    if (this.numOfModels !== undefined) {
      weight = this.getAllEdges().length;
    }

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
  /**
   * This method add the paths of a given ontology to this model.
   * @param ontology: the ontology from which to take the paths.
   */
  addOntologyPaths(ontology) {
    let classes = this.getAllNodes(type.CLASS);
    let weight = null;

    if (this.numOfModels !== undefined) {
      weight = this.getAllEdges().length;
    }

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

  /**
   * This method returns a new Semantic Model based on a given tree and the tree's Semantic Model.
   * @param tree: the tree from which to generate the new Semantic Model
   * @param graph: the @tree's Semantic Model
   * @returns {SemanticModel}: the new Semantic Model
   */
  static getModelBasedOnTree(tree, graph) {
    let sm = new SemanticModel();
    let edges = [];
    let nodes = [];
    let alreadyAddedNodeIDs = [];
    let largestID = -1;

    tree.edgeIDs.forEach(id => {
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