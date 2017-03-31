/**
 * Created by pheyvaer on 31.03.17.
 */

let type = require('./type.js').types;

let namespaces = {
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  rml: 'http://semweb.mmlab.be/ns/rml#',
  rr: 'http://www.w3.org/ns/r2rml#'
};


class RMLMappingGenerator {

  constructor(config){
    this.config = config;
    this.node2TripleMap = {};
    this.triples = [];
  }

  /**
   * Generate the triple map IRIs for the given nodes.
   * @param nodes: the nodes for which to generate the triple map IRIs
   * @private
   */
  _generateTripleMaps(nodes){
    let self = this;

    nodes.forEach(function(node){
      self.node2TripleMap[node.id] = self.config.baseIRI + node.id;
    });
  }

  /**
   * Generate the subject maps for the given nodes. This includes the connection with the triple map and the class.
   * @param nodes: the nodes for which to generate the subject maps
   * @private
   */
  _generateSubjectMaps(nodes) {
    let self = this;

    nodes.forEach(function(node){
      //IRI of the triples map
      let tm = self.node2TripleMap[node.id];
      //IRI of the predicate object map
      let sm = self.config.baseIRI + node.id + '-SM';
      self.triples.push({subject: tm, predicate: namespaces.rr + 'subjectMap', object: sm});

      if (node.label) {
        self.triples.push({subject: sm, predicate: namespaces.rr + 'class', object: node.label});
      }
    });
  }

  /**
   * Generate the predicate object maps together with the corresponding object maps for the given nodes.
   * @param nodes: the nodes for which the generate the predicate object maps and object maps
   * @private
   */
  _generatePredicateObjectMaps(nodes){
    let self = this;

    nodes.forEach(function(node){
      let edges = self.semanticmodel.getEdgesWithNodeAsSource(node.id);

      edges.forEach(function(edge){
        //IRI of the triples map
        let tm = self.node2TripleMap[node.id];
        //IRI of the predicate object map
        let pom = self.config.baseIRI + node.id + '-POM-' + edge.id;

        self.triples.push({subject: tm, predicate: namespaces.rr + 'predicateObjectMap', object: pom});
        self.triples.push({subject: pom, predicate: namespaces.rr + 'predicate', object: edge.label});

        let targetNode = self.semanticmodel.get(edge.target);
        //IRI of the object map
        let om = self.config.baseIRI + node.id + '-OM-' + edge.id;

        self.triples.push({subject: pom, predicate: namespaces.rr + 'objectMap', object: om});

        if (targetNode.type === type.DATAREFERENCE) {
          //simple object map
          self.triples.push({subject: om, predicate: namespaces.rml + 'reference', object: targetNode.label});
        } else {
          //referencing object map
          self.triples.push({subject: om, predicate: namespaces.rr + 'parentTriplesMap', object: self.node2TripleMap[targetNode.id]});
        }
      });
    });
  }

  /**
   * Generate the RML triples for a given semantic model.
   * @param semanticmodel: the semantic model for which to generate the RML mapping
   * @returns {Array}: the RDF triples of the RML mapping
   */
  generate(semanticmodel) {
    //reset the triples
    this.triples = [];
    this.semanticmodel = semanticmodel;
    let classNodes = semanticmodel.getAllNodes(type.CLASS);

    this._generateTripleMaps(classNodes);
    this._generateSubjectMaps(classNodes);
    this._generatePredicateObjectMaps(classNodes);

    return this.triples;
  }
}

module.exports = RMLMappingGenerator;