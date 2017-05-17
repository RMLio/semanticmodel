/**
 * Created by pheyvaer on 17.05.17.
 */

let assert = require('chai').assert;
let SemanticModel = require('../index.js').SemanticModel;
let rml2sm = require('../index.js').RMLMappingToSemanticModelGenerator;
let Utils = require('../index.js').Utils;
let type = require('../index.js').nodeType.types;
let mappings = require('./rml2sm.json').rml2sm;

describe('Generate Semantic Model from RML Mapping:', function () {
  it('TriplesMap', function () {
    let rml = mappings[0].rml;
    //console.log(JSON.stringify(rml2sm(rml).exportModel()));

    assert.deepEqual(rml2sm(rml).exportModel(), mappings[0].sm, 'Semantic model is not correct.');
  });

  it('class', function () {
    let rml = mappings[1].rml;
    //console.log(JSON.stringify(rml2sm(rml).exportModel()));

    assert.deepEqual(rml2sm(rml).exportModel(), mappings[1].sm, 'Semantic model is not correct.');
  });

  it('template', function () {
    let rml = mappings[2].rml;
    //console.log(JSON.stringify(rml2sm(rml).exportModel()));

    assert.deepEqual(rml2sm(rml).exportModel(), mappings[2].sm, 'Semantic model is not correct.');
  });

  it('predicates', function () {
    let rml = mappings[3].rml;
    //console.log(JSON.stringify(rml2sm(rml).exportModel()));

    assert.deepEqual(rml2sm(rml).exportModel(), mappings[3].sm, 'Semantic model is not correct.');
  });

  it('predicates 2', function () {
    let rml = mappings[4].rml;
    //console.log(JSON.stringify(rml2sm(rml).exportModel()));

    assert.deepEqual(rml2sm(rml).exportModel(), mappings[4].sm, 'Semantic model is not correct.');
  });

  it('predicates 3', function () {
    let rml = mappings[5].rml;
    //console.log(JSON.stringify(rml2sm(rml).exportModel()));

    assert.deepEqual(rml2sm(rml).exportModel(), mappings[5].sm, 'Semantic model is not correct.');
  });

  it('LogicalSources', function () {
    let rml = mappings[6].rml;
    //console.log(JSON.stringify(rml2sm(rml).exportModel()));

    assert.deepEqual(rml2sm(rml).exportModel(), mappings[6].sm, 'Semantic model is not correct.');
  });
});