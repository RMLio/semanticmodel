/**
 * Created by pheyvaer on 21.03.17.
 */

module.exports = {
  nodeType: require('./lib/type.js'),
  SemanticModel: require('./lib/semanticmodel.js'),
  CandidateMappingGenerator: require('./lib/candidatemappinggenerator.js'),
  CandidateMappingToSemanticModelGenerator: require('./lib/candidatemappingtosemanticmodelgenerator.js'),
  RMLMappingToSemanticModelGenerator: require('./lib/rmlmappingtosemanticmodelgenerator.js'),
  RMLMappingGenerator: require('./lib/rmlmappinggenerator.js'),
  Utils: require('./lib/utils.js')
};