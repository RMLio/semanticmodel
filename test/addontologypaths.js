/**
 * Created by pheyvaer on 22.03.17.
 */

let assert = require('chai').assert;
let SemanticModel = require('../index.js').SemanticModel;
let type = require('../index.js').nodeType.types;
let dma = require('./dma.json');
let npg = require('./npg.json');
let semanticTypes = require('./semantictypes.json').semanticTypes;

describe('Add Ontology Paths:', function () {
  it('#1', function () {
    let sm1 = new SemanticModel();
    sm1.importModel(dma);
    let sm2 = new SemanticModel();
    sm2.importModel(npg);
    let graph = new SemanticModel();

    graph.addModel(sm1, 'dma');
    graph.addModel(sm2, 'npg');

    graph.addSemanticTypes(semanticTypes);
    graph.addOntologyPaths({
      getConnectingProperties: function(c1, c2) {
        if(c1 === 'edm:EuropeanaAggregation') {
          if (c2 === 'aac:CulturalHeritageObject') {
            return ['ore:aggregates'];
          } else if (c2 === 'foaf:Document') {
            return ['foaf:page'];
          } else {
            return [];
          }
        } else if (c1 === 'aac:CulturalHeritageObject') {
          if (c2 === 'aac:Person') {
            return ['aac:sitter', 'dcterms:creator'];
          } else if (c2 === 'foaf:Person') {
            return ['dcterms:creator'];
          }  else {
            return [];
          }
        } else if (c1 === 'edm:WebResource' && c2 === 'foaf:Document') {
          return ['edm:isShownAt'];
        } else {
          return [];
        }
      }
    });

    //console.log(JSON.stringify(graph.exportModel()));

    assert.equal(graph.getAllNodes(type.CLASS).length, 7, 'Number of class nodes is incorrect.');
    assert.equal(graph.getAllNodes(type.DATAREFERENCE).length, 12, 'Number of data nodes is incorrect.');
    assert.equal(graph.getAllEdges().length, 21, 'Number of edges is incorrect.');
    assert.deepEqual(graph.exportModel(), require('./addontologypaths.json'), 'Adding ontology to graph is not correctly done');
  });
});