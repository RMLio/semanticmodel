/**
 * Created by pheyvaer on 23.03.17.
 */

let type = require('./type.js').types;
let extend = require('extend');

class CandidateMappingGenerator {

  constructor(options) {
    this.options = options;
  }

  /**
   * This method generates all the candidate mappings that include the @attributes from the @semanticmodel
   * @param attributes: the attribute that need be addressed in the mapping
   * @param semanticModel: the semantic model from which candidate mappings need to be generated
   * @returns {Array}: the resulting candidate mappings
   */
  generateCandidateMappings(attributes, semanticModel) {
    let mappings = [];

    //iterate over all the attributes
    for (let i = 0; i < attributes.length; i++) {
      let attribute = attributes[i].attribute;
      let semanticTypes = attributes[i].semanticTypes;

      console.log(attribute);

      let isMappingEmpty = (mappings.length === 0);

      let matches = [];
      let confidences = [];

      //we get all matches and confidences of the current attribute
      for (let j = 0; j < semanticTypes.length; j++) {
        let temp = CandidateMappingGenerator._getMatches(semanticTypes[j], semanticModel);
        matches = matches.concat(temp);

        for (let k = 0; k < temp.length; k++) {
          confidences.push(semanticTypes[j].confidence);
        }
      }

      console.log(confidences);

      //if there are not mappings found yet, we can add all the matches
      if (isMappingEmpty) {
        for (let k = 0; k < matches.length; k++) {
          let match = matches[k];
          let mapping = {
            attributes: [attribute],
            confidences: [confidences[k]],
            nodes: [{u: match.u, v: match.v}]
          };

          mappings.push(mapping);
        }
      } else {
        //mappings already exist, so we generate all the combinations of the existing mappings with the current matches
        let currentMappingsLength = mappings.length;

        while (currentMappingsLength > 0) {
          for (let l = 0; l < matches.length; l++) {
            //console.log('match ' + l);
            let match = matches[l];
            let mapping = extend(true, {}, mappings[0]);
            //console.log(mapping);
            mapping.attributes.push(attribute);
            mapping.confidences.push(confidences[l]);
            mapping.nodes.push({u: match.u, v: match.v});
            mappings.push(mapping);
          }

          let removedMapping = mappings.shift();

          if (matches.length === 0) {
            mappings.push(removedMapping);
          }

          currentMappingsLength--;
        }
      }

      console.log(JSON.stringify(mappings));
    }

    //console.log(mappings.length);

    //to limit the number of mappings that are generated a branching factor is checked
    //we remove the mapping with the lowest score
    if (mappings.length > this.options.brachingFactor) {
      console.log('enforcing branchingFactor');

      for (let j = 0; j < mappings.length; j++) {
        mappings[j].score = this._score(mappings[j], semanticModel);
      }

      mappings = mappings.sort(function (a, b) {
        return b.score - a.score;
      });
      mappings = mappings.slice(0, this.options.branchingFactor);
    }

    for (let j = 0; j < mappings.length; j++) {
      mappings[j].score = this._score(mappings[j], semanticModel);
    }

    mappings = mappings.sort(function (a, b) {
      return b.score - a.score;
    });
    mappings = mappings.slice(0, Math.min(mappings.length, this.options.numOfCandidates));

    return mappings;
  }

  /**
   * Get all the matches in the @model for the give @semanticType
   * @param semanticType: the semantic type for which to look in the @model
   * @param model: the model to inspect for matches
   * @returns {Array}: the found matches
   * @private
   */
  static _getMatches(semanticType, model) {
    let results = [];
    let vMatches = model.getNodes(type.CLASS, semanticType.class);

    for (let j = 0; j < vMatches.length; j++) {
      let v = vMatches[j];
      let outgoingEdge = model._getOutgoingEdgeWithLabel(v, semanticType.predicate);

      if (outgoingEdge) {
        results.push({v: v.id, u: outgoingEdge.target});
      }
    }

    return results;
  }

  /**
   * Calculate the score of a mapping.
   * @param mapping: the mapping for which to calculate the score
   * @param model: the model to which the mapping applies
   * @returns {number}: the score of the mapping
   * @private
   */
  _score(mapping, model) {
    return this.options.weights.confidence * CandidateMappingGenerator._confidence(mapping) +
      this.options.weights.coherence * CandidateMappingGenerator._coherence(mapping, model) +
      this.options.weights.sizeReduction * CandidateMappingGenerator._sizeReduction(mapping);
  }

  /**
   * Calculate the confidence of a mapping
   * @param mapping: the mapping for which to calculate the confidence
   * @returns {number}: the confidence of the mapping
   * @private
   */
  static _confidence(mapping) {
    let confidence = 0;

    for (let i = 0; i < mapping.confidences.length; i++) {
      confidence += mapping.confidences[i];
    }

    confidence /= mapping.constructor.length;

    return confidence;
  }

  /**
   * Calculate the coherence of a mapping
   * @param mapping: the mapping for which to calculate the coherence
   * @param model: the model to which the mapping applies
   * @returns {number}: the coherence of the mapping
   * @private
   */
  static _coherence(mapping, model) {
    let tagCounter = {};

    //iterate over all node pairs in the mapping
    for (let i = 0; i < mapping.nodes.length; i++) {
      let nodeV = model.get(mapping.nodes[i].v);
      let nodeU = model.get(mapping.nodes[i].u);

      //get tags from both nodes
      let tags = nodeV.tags.concat(nodeU.tags);

      //iterate over all tags and update the counters for each tag
      for (let j = 0; j < tags.length; j++) {
        let tag = tags[j];

        //first time we encounter this tag, so initialize tagCounter for that tag
        if (tagCounter[tag] === undefined) {
          tagCounter[tag] = 1;
        } else {
          tagCounter[tag]++;
        }
      }
    }

    //get all counts for all tags
    let counts = Object.keys(tagCounter).map(function (key) {
      return tagCounter[key];
    });

    return Math.max.apply(null, counts) / mapping.nodes.length;
  }

  /**
   * Calculate the size reduction of a mapping
   * @param mapping: the mapping for which to calculate the size reduction
   * @returns {number}: the size reduction of the given mapping
   * @private
   */
  static _sizeReduction(mapping) {
    let size = mapping.nodes.length * 2;
    let k = mapping.attributes.length;
    let l = k + 1;
    let u = 2 * k;

    return (u - size) / (u - l + 1);
  }
}

module.exports = CandidateMappingGenerator;