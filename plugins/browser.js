var _ = require('lodash'),
    DepsChecker = require('../lib/deps-checker');

exports.forEachEntity = function(entity) {
    new DepsChecker(entity, 'js')
        .filterLiterals(function(obj) {
            return !(obj.modName || obj.baseBlock || obj.baseMix);
        })
        .collectEntities(function(regular, inMix, expect) {
            regular.length && expect(regular, 'anyDeps', 'js', 'bemhtml');
            (regular.length + inMix.length) && expect(_.concat(regular, inMix), 'anyDeps');
        });
};
