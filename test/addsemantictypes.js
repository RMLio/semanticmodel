/**
 * Created by pheyvaer on 22.03.17.
 */

let assert = require('chai').assert;
let SemanticModel = require('../index.js').SemanticModel;
let type = require('../index.js').nodeType.types;
let dma = require('./dma.json');
let npg = require('./npg.json');
let semanticTypes = require('./semantictypes.json').semanticTypes;

describe('Add Semantic Types:', function () {
  it('#1', function () {
    let sm1 = new SemanticModel();
    sm1.importModel(dma);
    let sm2 = new SemanticModel();
    sm2.importModel(npg);
    let graph = new SemanticModel();

    graph._addModel(sm1, 'dma');
    graph._addModel(sm2, 'npg');

    graph.addSemanticTypes(semanticTypes);

    //console.log(JSON.stringify(graph.exportModel()));

    assert.equal(graph.getAllNodes(type.CLASS).length, 7, 'Number of class nodes is incorrect.');
    assert.equal(graph.getAllNodes(type.DATAREFERENCE).length, 12, 'Number of data nodes is incorrect.');
    assert.equal(graph.getAllEdges().length, 17, 'Number of edges is incorrect.');
  });
});