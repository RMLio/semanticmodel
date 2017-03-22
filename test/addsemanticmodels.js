/**
 * Created by pheyvaer on 22.03.17.
 */

let assert = require('chai').assert;
let SemanticModel = require('../index.js').SemanticModel;
let type = require('../index.js').nodeType.types;
let dma = require('./dma.json');
let npg = require('./npg.json');

describe('Add Semantic Models:', function () {
  it('add class nodes', function () {
    let sm1 = new SemanticModel();
    sm1.importModel(dma);
    let sm2 = new SemanticModel();
    sm2.importModel(npg);
    let graph = new SemanticModel();
    graph._addClassNodesModel(sm1, {}, 'dma');
    assert.deepEqual(graph.exportModel(), require('./dmaClassesInGraph.json'), 'Adding DMA to graph is not correctly done');

    graph = new SemanticModel();
    graph._addClassNodesModel(sm2, {}, 'npg');
    assert.deepEqual(graph.exportModel(), require('./npgClassesInGraph.json'), 'Adding NPG to graph is not correctly done');

    graph = new SemanticModel();
    let map = {};
    graph._addClassNodesModel(sm1, map, 'dma');
    map = {};
    graph._addClassNodesModel(sm2, map, 'npg');

    assert.deepEqual(graph.exportModel(), require('./dmanpgClassesInGraph.json'), 'Adding NPG and DMA to graph is not correctly done');
  });

  it('add data nodes', function () {
    let sm1 = new SemanticModel();
    sm1.importModel(dma);
    let sm2 = new SemanticModel();
    sm2.importModel(npg);
    let graph = new SemanticModel();
    let map = {};
    graph._addClassNodesModel(sm1, map, 'dma');
    graph._addDataNodesModel(sm1, map, 'dma');

    assert.deepEqual(graph.exportModel(), require('./dmaDatasInGraph.json'), 'Adding DMA to graph is not correctly done');

    graph = new SemanticModel();
    map = {};
    graph._addClassNodesModel(sm2, map, 'npg');
    graph._addDataNodesModel(sm2, map, 'npg');

    assert.deepEqual(graph.exportModel(), require('./npgDatasInGraph.json'), 'Adding NPG to graph is not correctly done');

    graph = new SemanticModel();
    map = {};
    graph._addClassNodesModel(sm1, map, 'dma');
    graph._addDataNodesModel(sm1, map, 'dma');
    map = {};
    graph._addClassNodesModel(sm2, map, 'npg');
    graph._addDataNodesModel(sm2, map, 'npg');

    assert.deepEqual(graph.exportModel(), require('./dmanpgDatasInGraph.json'), 'Adding DMA and NPG to graph is not correctly done');
    //console.log(JSON.stringify(graph.exportModel()));
    //assert.deepEqual(graph.exportModel(), require('./dmaClassesInGraph.json'), 'Adding DMA to graph is not correctly done');
  });

  it('add edges', function () {
    let sm1 = new SemanticModel();
    sm1.importModel(dma);

    let sm2 = new SemanticModel();
    sm2.importModel(npg);

    let graph = new SemanticModel();
    let map = {};

    graph._addClassNodesModel(sm1, map, 'dma');
    graph._addDataNodesModel(sm1, map, 'dma');
    graph._addEdgesModel(sm1, map, 'dma');

    assert.deepEqual(graph.exportModel(), require('./dmaEdgesInGraph.json'), 'Adding DMA to graph is not correctly done');

    graph = new SemanticModel();
    map = {};

    graph._addClassNodesModel(sm2, map, 'dma');
    graph._addDataNodesModel(sm2, map, 'dma');
    graph._addEdgesModel(sm2, map, 'dma');

    assert.deepEqual(graph.exportModel(), require('./npgEdgesInGraph.json'), 'Adding NPG to graph is not correctly done');

    graph = new SemanticModel();
    map = {};
    graph._addClassNodesModel(sm1, map, 'dma');
    graph._addDataNodesModel(sm1, map, 'dma');
    graph._addEdgesModel(sm1, map, 'dma');

    map = {};
    graph._addClassNodesModel(sm2, map, 'npg');
    graph._addDataNodesModel(sm2, map, 'npg');
    graph._addEdgesModel(sm2, map, 'npg');

    //console.log(JSON.stringify(graph.exportModel()));
    assert.deepEqual(graph.exportModel(), require('./dmanpgEdgesInGraph.json'), 'Adding DMA and NPG to graph is not correctly done');
  });

  it('add models', function () {
    let sm1 = new SemanticModel();
    sm1.importModel(dma);

    let sm2 = new SemanticModel();
    sm2.importModel(npg);

    let graph = new SemanticModel();

    graph.addModel(sm1, 'dma');

    assert.deepEqual(graph.exportModel(), require('./dmaEdgesInGraph.json'), 'Adding DMA to graph is not correctly done');

    graph = new SemanticModel();
    graph.addModel(sm2, 'dma');

    assert.deepEqual(graph.exportModel(), require('./npgEdgesInGraph.json'), 'Adding NPG to graph is not correctly done');

    graph = new SemanticModel();
    graph.addModel(sm1, 'dma');
    graph.addModel(sm2, 'npg');

    assert.deepEqual(graph.exportModel(), require('./dmanpgEdgesInGraph.json'), 'Adding DMA and NPG to graph is not correctly done');
  });
});