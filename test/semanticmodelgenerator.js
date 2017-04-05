/**
 * Created by pheyvaer on 22.03.17.
 */

let assert = require('chai').assert;
let SemanticModel = require('../index.js').SemanticModel;
let CandidateMappingGenerator = require('../index.js').CandidateMappingGenerator;
let SemanticModelGenerator = require('../index.js').SemanticModelGenerator;
let type = require('../index.js').nodeType.types;
let dma = require('./dma.json');
let npg = require('./npg.json');
let semanticTypes = require('./semantictypes.json').semanticTypes;
let attributes = require('./attributes.json').attributes;

describe('Generate Semantic Models:', function () {
  it.only('#1', function () {
    let sm1 = new SemanticModel();
    sm1.importModel(dma);
    let sm2 = new SemanticModel();
    sm2.importModel(npg);
    let graph = new SemanticModel(2);

    graph.addModels([{
      model: sm1,
      tag: 'dma'
    }, {
      model: sm2,
      tag: 'npg'
    }]);

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

    //for (let i = 0; i < results.length; i ++) {
    //  console.log(JSON.stringify(results[i]));
    //}

    let t = [];

    for (let i = 0; i < results.length; i ++) {
      let smg = new SemanticModelGenerator(graph, 2);
      let r = smg.getModels(results[i], 2);
      t.push(r[0]);
      t.push(r[1]);
    }

    t = SemanticModelGenerator.sortTrees(t);
    assert.deepEqual(t, require('./semanticmodelgenerator.json').trees, 'Trees are not correct.');
    assert.deepEqual(SemanticModel.getModelBasedOnTree(t[0], graph), require('./semanticmodelgenerator.json').models[0], 'Model is not correct.');

    //console.log(JSON.stringify(SemanticModel.getModelBasedOnTree(t[0], graph)));
  });
});