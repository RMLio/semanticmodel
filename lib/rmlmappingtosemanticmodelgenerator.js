/**
 * Created by pheyvaer on 17.05.17.
 */

let SemanticModel = require('./semanticmodel.js');
let type = require('./type.js').types;
let N3 = require('n3');
let prefixes = require('prefix-ns').asMap();
prefixes.ql = 'http://semweb.mmlab.be/ns/ql#';

/**
 * This class creates a semantic model baed on an RML mapping.
 */
class RMLMappingToSemanticModelGenerator {

  constructor(rml) {
    this.rml = rml;
    this.store = N3.Store();
    this.store.addTriples(rml);
    this.triplesMapsToClassNodes = {};
    this.graph = new SemanticModel();
  }

  /**
   * This methods parses the Triples Maps and creates class nodes for each one of them.
   * @param triplesMaps
   * @private
   */
  _parseTriplesMaps(triplesMaps) {

    triplesMaps.forEach(triplesMap => {
      this.triplesMapsToClassNodes[triplesMap] = this.graph.createNode({
        type: type.CLASS
      });
    });
  }

  /**
   * This methods parses all Subject Maps of the given Triples Maps.
   * @param triplesMaps: the Triples Maps for which the Subject Maps needs to be parsed.
   * @private
   */
  _parseSubjectMaps(triplesMaps) {

    triplesMaps.forEach(triplesMap => {
      let subjectMaps = this.store.getTriples(triplesMap, prefixes.rr + 'subjectMap', null).map(a => a.object);

      //at least one Subject Map is found
      if (subjectMaps.length > 0) {
        let node = this.triplesMapsToClassNodes[triplesMap];
        //we get the classes of the first Subject Map
        node.label = this.store.getTriples(subjectMaps[0], prefixes.rr + 'class', null).map(a => a.object);

        //we get the templates from the Subject Map
        let templates = this.store.getTriples(subjectMaps[0], prefixes.rr + 'template', null).map(a => a.object);

        //only when a template is found we add it to the node
        if (templates.length > 0) {
          node.template = templates[0];
        }
      }
    });
  }

  /**
   * This method parses the Predicate Object Maps of the given Triples Maps.
   * @param triplesMaps: the Triples Maps from which the Predicate Object Maps need to be parsed.
   * @private
   */
  _parsePredicateObjectMaps(triplesMaps) {

    triplesMaps.forEach(triplesMap => {
      let predicateObjectMaps = this.store.getTriples(triplesMap, prefixes.rr + 'predicateObjectMap', null).map(a => a.object);

      predicateObjectMaps.forEach(predicateObjectMap => {
        let predicates = this.store.getTriples(predicateObjectMap, prefixes.rr + 'predicate', null).map(a => a.object);
        let predicateMaps = this.store.getTriples(predicateObjectMap, prefixes.rr + 'predicateMap', null).map(a => a.object);

        predicateMaps.forEach(predicateMap => {
          let morePredicates = this.store.getTriples(predicateMap, prefixes.rr + 'constant', null).map(a => a.object);
          predicates = predicates.concat(morePredicates);
        });

        let objectMaps = this.store.getTriples(predicateObjectMap, prefixes.rr + 'objectMap', null).map(a => a.object);
        let reference;

        if (objectMaps.length > 0) {
          let references = this.store.getTriples(objectMaps[0], prefixes.rml + 'reference', null).map(a => N3.Util.getLiteralValue(a.object));

          if (references.length > 0) {
            reference = references[0];
          }
        }

        if (predicates.length === 0) {
          predicates = [undefined];
        }

        predicates.forEach(predicate => {
          let dataNode = this.graph.createNode({
            type: type.DATAREFERENCE,
            label: reference,
            sourceDescription: this.triplesMapsToClassNodes[triplesMap].sourceDescription
          });

          this.graph.createEdge({
            source: this.triplesMapsToClassNodes[triplesMap].id,
            target: dataNode.id,
            label: predicate
          });
        });
      });
    });
  }

  /**
   * This method parses the Logical Sources of a given set of Triples Maps.
   * @param triplesMaps: the Triples Maps for which to parse the Logical Sources
   * @private
   */
  _parseLogicalSources(triplesMaps) {

    triplesMaps.forEach(triplesMap => {
      let logicalSources = this.store.getTriples(triplesMap, prefixes.rml + 'logicalSource', null).map(a => a.object);

      if (logicalSources.length > 0) {
        let sourceDescription = {};

        //get source
        let sources = this.store.getTriples(logicalSources[0], prefixes.rml + 'source', null).map(function (a) {
          return N3.Util.getLiteralValue(a.object);
        });

        if (sources.length > 0) {
          sourceDescription.source = sources[0];
        }

        //get iterator
        let iterators = this.store.getTriples(logicalSources[0], prefixes.rml + 'iterator', null).map(function (a) {
          return N3.Util.getLiteralValue(a.object);
        });

        if (iterators.length > 0) {
          sourceDescription.iterator = iterators[0];
        }

        //get referenceFormulation
        let referenceFormulations = this.store.getTriples(logicalSources[0], prefixes.rml + 'referenceFormulation', null).map(a => a.object);

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

        this.triplesMapsToClassNodes[triplesMap].sourceDescription = sourceDescription;
      }
    });
  }

  /**
   * This method returns all the Triples Maps.
   * @returns {Array.<*>}
   * @private
   */
  _getTriplesMap(){
    //everything with type rr:TriplesMap
    let temp = this.store.getTriples(null, prefixes.rdf + 'type', prefixes.rr + 'TriplesMap').map(a => a.subject);
    //everything that has an rml:LogicalSource
    let temp2 = this.store.getTriples(null, prefixes.rml + 'logicalSource', null).map(a => a.subject);

    temp = temp.concat(temp2);
    //everything that has an rr:SubjectMap
    temp2 = this.store.getTriples(null, prefixes.rr + 'subjectMap', null).map(a => a.subject);
    temp = temp.concat(temp2);

    return temp.filter((item, pos) => temp.indexOf(item) === pos);
  }

  /**
   * This method parses the different elements of an RML mapping and returns the semantic model.
   * @returns {SemanticModel}
   */
  generate() {
    let triplesMaps = this._getTriplesMap();
    this._parseTriplesMaps(triplesMaps);
    this._parseLogicalSources(triplesMaps);
    this._parseSubjectMaps(triplesMaps);
    this._parsePredicateObjectMaps(triplesMaps);

    return this.graph;
  }
}

/**
 * This is the public method of this module.
 * @param rml
 * @returns {SemanticModel}
 */
function generate(rml) {
  let generator = new RMLMappingToSemanticModelGenerator(rml);
  return generator.generate();
}

module.exports = generate;