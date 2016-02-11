var _ = require('lodash'),
    DepsChecker = require('../lib/deps-checker');

exports.forEachEntity = function(entity) {
    new DepsChecker(entity, 'js')
        .walkAst({ // Ignore first arg of BEM.DOM.decl()
            CallExpression: function(node, state, c) {
                if(node.callee.type !== 'MemberExpression') return c();
                if(node.callee.property.type !== 'Identifier') return c();
                if(node.callee.property.name !== 'decl') return c();
                var object = node.callee.object;
                switch(object.type) {
                    case 'Identifier':
                        if(['BEM', 'DOM', 'BEMDOM'].indexOf(object.name) === -1) return c();
                        break;
                    case 'MemberExpression':
                        if(object.property.type !== 'Identifier') return c();
                        if(object.property.name !== 'DOM') return c();
                        break;
                    default:
                        return c();
                }
                node.arguments.slice(1).forEach(function(arg) {
                    c(arg);
                })
            }
        })
        .walkAst({ // Ignore BEM.create()
            CallExpression: function(node, state, c) {
                if(node.callee.type !== 'MemberExpression') return c();
                if(node.callee.object.type !== 'Identifier') return c();
                if(node.callee.object.name !== 'BEM') return c();
                if(node.callee.property.type !== 'Identifier') return c();
                if(node.callee.property.name !== 'create') return c();
                return;
            }
        })
        .walkAst({ // Ignore findBlock*()
            CallExpression: function(node, state, c) {
                if(node.callee.type !== 'MemberExpression') return c();
                var prop = node.callee.property;
                if(prop.type !== 'Identifier') return c();
                if(['findBlockInside', 'findBlockOutside', 'findBlockOn'].indexOf(prop.name) === -1) return c();
                return;
            }
        })
        .walkAst({ // Ignore BEM.HTML.decl() and BEM.HTML.build()
            CallExpression: function(node, state, c) {
                if(node.callee.type !== 'MemberExpression') return c();
                if(node.callee.property.type !== 'Identifier') return c();
                if(['decl', 'build'].indexOf(node.callee.property.name) === -1) return c();
                var object = node.callee.object;
                switch(object.type) {
                    case 'Identifier':
                        if(['HTML', 'BEMHTML'].indexOf(object.name) === -1) return c();
                        break;
                    case 'MemberExpression':
                        if(object.property.type !== 'Identifier') return c();
                        if(object.property.name !== 'HTML') return c();
                        break;
                    default:
                        return c();
                }
                return;
            }
        })
        .walkAst({ // Ignore everything conditional
            IfStatement: function() {},
            LogicalExpression: function() {},
            ConditionalExpression: function() {}
        })
        .filterLiterals(function(obj) {
            return !(obj.modName || obj.baseBlock || obj.baseMix);
        })
        .collectEntities(function(regular, inMix, expect) {
            regular.length && expect(regular, 'anyDeps', 'js', 'bemhtml');
            (regular.length + inMix.length) && expect(_.concat(regular, inMix), 'anyDeps');
        });
};
