/**
 * Created by pheyvaer on 31.03.17.
 */

/**
 * Created by pheyvaer on 22.03.17.
 */

let assert = require('chai').assert;
let SemanticModel = require('../index.js').SemanticModel;
let type = require('../index.js').nodeType.types;
let dma = require('./dma.json');
let npg = require('./npg.json');
let RMLMappingGenerator = require('../lib/rmlmappinggenerator.js');

describe('RMLMappingGenerator: ', function () {
  it('#1', function () {
    let sm1 = new SemanticModel();
    sm1.importModel(dma);
    let rmg = new RMLMappingGenerator({baseIRI: 'http://www.mymapping.com#'});

    let triples = rmg.generate(sm1);
    //console.log(JSON.stringify(triples));

    assert.deepEqual(triples, require('./rmlmappinggenerator.json').triples, 'RML mapping is not correct.');
  });
});