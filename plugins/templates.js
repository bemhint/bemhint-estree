var _ = require('lodash'),
    DepsChecker = require('../lib/deps-checker');

exports.forEachEntity = function(entity) {
    new DepsChecker(entity, ['bemhtml.js', 'bh.js'])
        .collectEntities(function(regular, inMix, expect) {
            (regular.length + inMix.length) && expect(_.concat(regular, inMix), 'anyDeps');
        });
};
