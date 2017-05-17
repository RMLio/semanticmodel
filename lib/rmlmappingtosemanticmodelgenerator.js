/**
 * Created by pheyvaer on 17.05.17.
 */

let SemanticModel = require('./semanticmodel.js');
let type = require('./type.js').types;
let N3 = require('n3');
let prefixes = require('prefix-ns').asMap();
prefixes.ql = 'http://semweb.mmlab.be/ns/ql#';

class RMLMappingToSemanticModelGenerator {

  constructor(rml) {
    this.rml = rml;
    this.store = N3.Store();
    this.store.addTriples(rml);
    this.triplesMapsToClassNodes = {};
    this.graph = new SemanticModel();
  }

  _parseTriplesMaps(triplesMaps) {
    let self = this;

    triplesMaps.forEach(function (triplesMap) {
      self.triplesMapsToClassNodes[triplesMap] = self.graph.createNode({
        type: type.CLASS
      });
    });
  }

  _parseSubjectMaps(triplesMaps) {
    let self = this;

    triplesMaps.forEach(function (triplesMap) {
      let subjectMaps = self.store.getTriples(triplesMap, prefixes.rr + 'subjectMap', null);
      subjectMaps = subjectMaps.map(function (a) {
        return a.object
      });

      if (subjectMaps.length > 0) {
        let node = self.triplesMapsToClassNodes[triplesMap];
        let classes = self.store.getTriples(subjectMaps[0], prefixes.rr + 'class', null);
        classes = classes.map(function (a) {
          return a.object
        });

        node.label = classes;

        let templates = self.store.getTriples(subjectMaps[0], prefixes.rr + 'template', null);
        templates = templates.map(function (a) {
          return a.object
        });

        if (templates.length > 0) {
          node.template = templates[0];
        }
      }
    });
  }

  _parsePredicateObjectMaps(triplesMaps) {
    let self = this;

    triplesMaps.forEach(function (triplesMap) {
      let predicateObjectMaps = self.store.getTriples(triplesMap, prefixes.rr + 'predicateObjectMap', null);
      predicateObjectMaps = predicateObjectMaps.map(function (a) {
        return a.object
      });

      predicateObjectMaps.forEach(function (predicateObjectMap) {
        let predicates = self.store.getTriples(predicateObjectMap, prefixes.rr + 'predicate', null).map(function (a) {
          return a.object
        });
        let predicateMaps = self.store.getTriples(predicateObjectMap, prefixes.rr + 'predicateMap', null).map(function (a) {
          return a.object
        });

        predicateMaps.forEach(function (predicateMap) {
          let morePredicates = self.store.getTriples(predicateMap, prefixes.rr + 'constant', null).map(function (a) {
            return a.object
          });
          predicates = predicates.concat(morePredicates);
        });

        let objectMaps = self.store.getTriples(predicateObjectMap, prefixes.rr + 'objectMap', null).map(function (a) {
          return a.object
        });
        let reference;

        if (objectMaps.length > 0) {
          let references = self.store.getTriples(objectMaps[0], prefixes.rml + 'reference', null).map(function (a) {
            return N3.Util.getLiteralValue(a.object);
          });

          if (references.length > 0) {
            reference = references[0];
          }
        }

        if (predicates.length === 0) {
          predicates = [undefined];
        }

        predicates.forEach(function (predicate) {
          let dataNode = self.graph.createNode({
            type: type.DATAREFERENCE,
            label: reference,
            sourceDescription: self.triplesMapsToClassNodes[triplesMap].sourceDescription
          });

          self.graph.createEdge({
            source: self.triplesMapsToClassNodes[triplesMap].id,
            target: dataNode.id,
            label: predicate
          });
        });
      });
    });
  }

  _parseLogicalSources(triplesMaps) {
    let self = this;

    triplesMaps.forEach(function (triplesMap) {
      let logicalSources = self.store.getTriples(triplesMap, prefixes.rml + 'logicalSource', null).map(function (a) {
        return a.object
      });

      if (logicalSources.length > 0) {
        let sourceDescription = {};

        //get source
        let sources = self.store.getTriples(logicalSources[0], prefixes.rml + 'source', null).map(function (a) {
          return N3.Util.getLiteralValue(a.object);
        });

        if (sources.length > 0) {
          sourceDescription.source = sources[0];
        }

        //get iterator
        let iterators = self.store.getTriples(logicalSources[0], prefixes.rml + 'iterator', null).map(function (a) {
          return N3.Util.getLiteralValue(a.object);
        });

        if (iterators.length > 0) {
          sourceDescription.iterator = iterators[0];
        }

        //get referenceFormulation
        let referenceFormulations = self.store.getTriples(logicalSources[0], prefixes.rml + 'referenceFormulation', null).map(function (a) {
          return a.object
        });

        if (referenceFormulations.length > 0) {
          switch (referenceFormulations[0]) {
            case prefixes.ql + 'CSV':
              sourceDescription.type = 'csv';
              break;
            case prefixes.ql + 'JSONPath':
              sourceDescription.type = 'json';
              break;
            case prefixes.ql + 'XPath':
              sourceDescription.type = 'xml';
              break;
          }
        }

        self.triplesMapsToClassNodes[triplesMap].sourceDescription = sourceDescription;
      }
    });
  }

  _getTriplesMap(){
    let temp = this.store.getTriples(null, prefixes.rdf + 'type', prefixes.rr + 'TriplesMap').map(function (a) {
      return a.subject
    });

    let temp2 = this.store.getTriples(null, prefixes.rml + 'logicalSource', null).map(function (a) {
      return a.subject
    });

    temp = temp.concat(temp2);

    temp2 = this.store.getTriples(null, prefixes.rr + 'subjectMap', null).map(function (a) {
      return a.subject
    });

    temp = temp.concat(temp2);

    return temp.filter(function(item, pos) {
      return temp.indexOf(item) === pos;
    });
  }

  generate() {
    let triplesMaps = this._getTriplesMap();
    this._parseTriplesMaps(triplesMaps);
    this._parseLogicalSources(triplesMaps);
    this._parseSubjectMaps(triplesMaps);
    this._parsePredicateObjectMaps(triplesMaps);

    return this.graph;
  }
}

function generate(rml) {
  let generator = new RMLMappingToSemanticModelGenerator(rml);
  return generator.generate();
}

module.exports = generate;