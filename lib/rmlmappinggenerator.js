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

  _generateTripleMaps(nodes){
    let self = this;

    nodes.forEach(function(node){
      self.node2TripleMap[node.id] = self.config.baseIRI + node.id;
    });
  }

  _generateSubjectMaps(nodes) {
    let self = this;

    nodes.forEach(function(node){
      let tm = self.node2TripleMap[node.id];
      let sm = self.config.baseIRI + node.id + '-SM';
      self.triples.push({subject: tm, predicate: namespaces.rr + 'subjectMap', object: sm});

      if (node.label) {
        self.triples.push({subject: sm, predicate: namespaces.rr + 'class', object: node.label});
      }
    });
  }

  _generatePredicateObjectMaps(nodes){
    let self = this;

    nodes.forEach(function(node){
      let edges = self.semanticmodel.getEdgesWithNodeAsSource(node.id);

      edges.forEach(function(edge){
        let tm = self.node2TripleMap[node.id];
        let pom = self.config.baseIRI + node.id + '-POM-' + edge.id;

        self.triples.push({subject: tm, predicate: namespaces.rr + 'predicateObjectMap', object: pom});
        self.triples.push({subject: pom, predicate: namespaces.rr + 'predicate', object: edge.label});

        let targetNode = self.semanticmodel.get(edge.target);
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