/**
 * Created by pheyvaer on 23.03.17.
 */

let type = require('./type.js').types;
let extend = require('extend');

class CandidateMappingGenerator {

  constructor(options) {
    this.options = options;
  }

  generateCandidateMappings(attributes, semanticModel) {
    let mappings = [];

    for (let i = 0; i < attributes.length; i++) {
      let attribute = attributes[i].attribute;
      let semanticTypes = attributes[i].semanticTypes;

      console.log(attribute);

      let isMappingEmpty = (mappings.length === 0);

      let matches = [];
      let confidences = [];

      for (let j = 0; j < semanticTypes.length; j++) {
        let temp = this._getMatches(semanticTypes[j], semanticModel);
        matches = matches.concat(temp);

        for (let k = 0; k < temp.length; k++) {
          confidences.push(semanticTypes[j].confidence);
        }
      }

      console.log(confidences);

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
        let currentMappingsLength = mappings.length;

        while (currentMappingsLength > 0) {
          for (let l = 0; l < matches.length; l++) {
            console.log('match ' + l);
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

  _getMatches(semanticType, model) {
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

  _score(mapping, model) {
    return this.options.weights.confidence * CandidateMappingGenerator._confidence(mapping) +
      this.options.weights.coherence * CandidateMappingGenerator._coherence(mapping, model) +
      this.options.weights.sizeReduction * CandidateMappingGenerator._sizeReduction(mapping);
  }

  static
  _confidence(mapping) {
    let confidence = 0;

    for (let i = 0; i < mapping.confidences.length; i++) {
      confidence += mapping.confidences[i];
    }

    confidence /= mapping.constructor.length;

    return confidence;
  }

  static _coherence(mapping, model) {
    let tagCounter = {};

    for (let i = 0; i < mapping.nodes.length; i++) {
      let nodeV = model.get(mapping.nodes[i].v);
      let nodeU = model.get(mapping.nodes[i].u);

      let tags = nodeV.tags.concat(nodeU.tags);

      for (let j = 0; j < tags.length; j++) {
        let tag = tags[j];

        if (tagCounter[tag] === undefined) {
          tagCounter[tag] = 1;
        } else {
          tagCounter[tag]++;
        }
      }
    }

    let counts = Object.keys(tagCounter).map(function (key) {
      return tagCounter[key];
    });

    return Math.max.apply(null, counts) / mapping.nodes.length;
  }

  static _sizeReduction(mapping) {
    let size = mapping.nodes.length * 2;
    let k = mapping.attributes.length;
    let l = k + 1;
    let u = 2 * k;

    return (u - size) / (u - l + 1);
  }
}

module.exports = CandidateMappingGenerator;