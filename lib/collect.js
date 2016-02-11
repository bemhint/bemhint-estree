var _ = require('lodash'),
    walk = require('acorn/dist/walk');

/**
 *
 * @param {Object} ast SpiderMonkey AST.
 * @returns {Array} Array of collected object literals. Non-literal values replaced with undefined.
 */
exports.objectLiterals = function(ast) {
    var objects = [];
    walk.recursive(ast, objects, {
        ObjectExpression: function (node, list, c) {
            list.push({});
            node.properties.forEach(function (prop) {
                c(prop, list);
            });
        },
        Property: function (node, list, c) {
            var key = node.key.type === 'Identifier' ? node.key.name : node.key.value,
                obj = list.pop(),
                newlist;

            switch (node.value.type) {
                case 'Literal':
                    obj[key] = node.value.value;
                    break;
                case 'ObjectExpression':
                    newlist = [];
                    c(node.value, newlist);
                    obj[key] = newlist.pop();
                    list.push.apply(list, newlist);
                    break;
                case 'ArrayExpression':
                    newlist = obj[key] = [];
                    node.value.elements.forEach(function (el) {
                        c(el, newlist);
                    });
                    break;
                default:
                    obj[key] = undefined;
                    c(node.value, list);
            }
            list.push(obj);
        }
    });

    return objects;
};

/**
 *
 * @param {Array} objects List of object literals.
 * @returns {Object} Two lists of deps BEM entities in a form of {block, [elem], [mod], [val]}.
 *          {Array} regular — Top-level entities, or entities nested with `content` property.
 *          {Array} inMix — Entities from `mix` property.
 */
exports.depsEntities = function(objects) {
    var entities = {regular: {}, inMix: {}};

    collectBemEntities(null, false, objects);

    function mkEntityKey(block, elem, mod, val) {
        return block +
            (elem ? '__' + elem : '') +
            (mod ? '_' + mod + '_' + val : '');
    }

    function mkEntity(block, elem, mod, val) {
        var e = {};
        block && (e.block = block);
        elem && (e.elem = elem);
        mod && (e.mod = mod);
        val && (e.val = val);
        return e;
    }

    function pushEntity(inMix, block, elem, mod, val) {
        var key = mkEntityKey(block, elem, mod, val),
            prop = inMix ? 'inMix' : 'regular';
        if(entities[prop][key]) {
            return;
        }
        entities[prop][key] = mkEntity(block, elem, mod, val);
    }

    function collectBemEntities(blockCtx, inMix, data) {
        if (typeof data !== 'object') {
            return;
        }
        if(data.constructor === Array) {
            data.forEach(collectBemEntities.bind(this, blockCtx, inMix));
            return;
        }
        blockCtx = 'block' in data ? data.block : blockCtx;
        if (data.block || (blockCtx && data.elem)) {
            pushEntity(inMix, blockCtx, data.elem);
            Object.keys(data.mods || {}).forEach(function(modName) {
                data.mods[modName] && pushEntity(inMix, blockCtx, data.elem, modName, data.mods[modName]);
            });
            data.elem && Object.keys(data.elemMods || {}).forEach(function(modName) {
                data.elemMods[modName] && pushEntity(inMix, blockCtx, data.elem, modName, data.elemMods[modName]);
            });
        }
        if(!inMix) {
            data.mix && collectBemEntities(blockCtx, true, data.mix);
            data.content && collectBemEntities(blockCtx, false, data.content);
        }
    }

    return _.mapValues(entities, _.values);
};
