/**
 * Created by pheyvaer on 30.03.17.
 */

let logger = require('tracer').console({format: "{{line}} => {{message}}"});

/**
 * Iterator for the BANKS algorithm.
 */
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

  /**
   * Clone the current iterator.
   * @returns {Iterator}: a new iterator based on the current one
   */
  clone() {
    this.cloneCounter++;
    let clone = new Iterator(null, '' + this.i + '-' + this.cloneCounter, this.graph, false);
    clone.setOrigin(this.origin);

    return clone;
  }

  /**
   * Returns the origin of the iterator.
   * @returns {*}
   */
  getOrigin() {
    return this.origin;
  }

  /**
   * Set the origin of the iterator.
   * @param origin
   */
  setOrigin(origin) {
    this.origin = origin;
  }

  /**
   * Set the distance of the iterator.
   * @param distance: the distance to use
   */
  setDistance(distance) {
    this.distance = distance;
  }

  /**
   * Set the edges of the iterator.
   * @param edges: the edges to use
   */
  setEdges(edges) {
    this.edges = [];
    let self = this;

    //we make a shallow copy of the array
    //thus, the same edges are used
    edges.forEach(function (e) {
      self.edges.push(e);
    });
  }

  /**
   * Set the current node of the iterator.
   * @param node
   */
  setCurrentNode(node) {
    this.currentNode = node;
  }

  /**
   * Get the current node of the iterator.
   * @returns {*|null}
   */
  getCurrentNode() {
    return this.currentNode;
  }

  /**
   * Get the identifier of the iterator.
   * @returns {*}
   */
  getI() {
    return this.i;
  }

  /**
   * Get the distance to the next node.
   * @returns {*|number}
   */
  getDistance() {
    return this.distance;
  }

  /**
   * Get all traversed edges of the iterator. This includes the edge for the next node.
   * @returns {Array}
   */
  getEdges() {
    return this.edges;
  }

  /**
   * Get the next node of the iterator. When multiple node are possible, additional iterators are created for those nodes.
   * They are returned together with the next node of this iterator.
   * @returns {{node: (*|null), additionalIterators: Array}}
   */
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
        //we only consider the edges that are not the best edge, because the best edge is used for this iterator.
        if (edge.id !== bestEdge.id) {
          //we clone the current iterator
          let it = self.clone();

          //we update the current node to the other node
          it.setCurrentNode(self.graph.get(edge.source));
          //we update the distance to the distance for that other node
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

      //we update the current iterator
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

  /**
   * Check if the iterator still has nodes left to consider.
   * @returns {boolean}
   */
  hasNextNode() {
    return this.currentNode !== null;
  }
}

module.exports = Iterator;