/**
 * Created by pheyvaer on 22.03.17.
 */

let assert = require('chai').assert;
let SemanticModel = require('../index.js').SemanticModel;
let CandidateMappingGenerator = require('../index.js').CandidateMappingGenerator;
let type = require('../index.js').nodeType.types;
let dma = require('./dma.json');
let npg = require('./npg.json');
let semanticTypes = require('./semantictypes.json').semanticTypes;
let attributes = require('./attributes.json').attributes;

describe('Generate Candidate Mappings:', function () {
  it.only('#1', function () {
    let sm1 = new SemanticModel();
    sm1.importModel(dma);
    let sm2 = new SemanticModel();
    sm2.importModel(npg);
    let graph = new SemanticModel();

    graph._addModel(sm1, 'dma');
    graph._addModel(sm2, 'npg');

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
    let cmg = new CandidateMappingGenerator({
      branchingFactor: 2,
      numOfCandidates: 3,
      weights: {
        sizeReduction: 1/3,
        confidence: 1/3,
        coherence: 1/3
      }
    });

    let results = cmg.generateCandidateMappings(attributes, graph);

    assert.deepEqual(results, require('./candidatemappings.json').mappings, 'Candidate mappings are not correct.');
  });
});