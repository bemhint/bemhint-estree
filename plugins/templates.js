var _ = require('lodash'),
    DepsChecker = require('../lib/deps-checker');

exports.forEachEntity = function(entity) {
    new DepsChecker(entity, ['bemhtml.js', 'bh.js'])
        .walkAst({ // Ignore everything conditional
            IfStatement: function() {},
            LogicalExpression: function() {},
            ConditionalExpression: function() {}
        })
        .collectEntities(function(regular, inMix, expect) {
            (regular.length + inMix.length) && expect(_.concat(regular, inMix), 'anyDeps');
        });
};
