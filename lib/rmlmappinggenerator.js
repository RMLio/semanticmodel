/**
 * Created by pheyvaer on 31.03.17.
 */

let type = require('./type.js').types;
let prefixNs = require('prefix-ns');
let namespaces = prefixNs.asMap();

// let namespaces = {
//   rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
//   owl: 'http://www.w3.org/2002/07/owl#',
//   rml: 'http://semweb.mmlab.be/ns/rml#',
//   rr: 'http://www.w3.org/ns/r2rml#'
// };


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

      if (node.template) {
        self.triples.push({subject: sm, predicate: namespaces.rr + 'template', object: '"' + node.template + '"'});
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

  _generateLogicalSources(nodes) {
    let self = this;

    nodes.forEach(function(node){
      let sourceDescription = self._getSourceDescription(node);

      if (sourceDescription !== null) {
        //IRI of the triples map
        let tm = self.node2TripleMap[node.id];
        //IRI of the predicate object map
        let ls = self.config.baseIRI + node.id + '-LS';
        self.triples.push({subject: tm, predicate: namespaces.rml + 'logicalSource', object: ls});

        if (sourceDescription.type !== undefined) {
          let ql = 'http://semweb.mmlab.be/ns/ql#';

          switch (sourceDescription.type) {
            case 'csv':
              ql += 'CSV';
              break;
            case 'xml':
              ql += 'XPath';
              break;
            default:
              ql += 'JSONPath';
              break;
          }

          self.triples.push({subject: ls, predicate: namespaces.rml + 'referenceFormulation', object: ql});
        }

        if (sourceDescription.source !== undefined) {
          self.triples.push({subject: ls, predicate: namespaces.rml + 'source', object: sourceDescription.source});
        }

        if (sourceDescription.iterator !== undefined) {
          self.triples.push({subject: ls, predicate: namespaces.rml + 'iterator', object: sourceDescription.iterator});
        }
      }
    });
  }

  _getSourceDescription(classNode) {
    let self = this;

    if (classNode.sourceDescription !== undefined) {
      return classNode.sourceDescription;
    } else {
      let edges = this.semanticmodel.getEdgesWithNodeAsSource(classNode.id);

      for (let i = 0; i < edges.length; i ++) {
        let edge = edges[i];
        let targetNode = self.semanticmodel.get(edge.target);

        if (targetNode.type === type.DATAREFERENCE && targetNode.sourceDescription !== undefined) {
          return targetNode.sourceDescription;
        }
      }

      return null;
    }
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
    this._generateLogicalSources(classNodes);
    this._generateSubjectMaps(classNodes);
    this._generatePredicateObjectMaps(classNodes);

    return this.triples;
  }
}

module.exports = RMLMappingGenerator;