var _ = require('lodash'),
    depsjs = require('depsjs');

function Deps(bemEntity, depsContent) {
    this._bemEntity = bemEntity;
    this._selfDep = this._formatSelfDep(this._bemEntity);
    this._depsContent = depsContent;
}

Deps.prototype.getMissing = function(deps, kind, fromTech, toTech) {
    var depIsMissing = function(kind, dep) {
            var expected = {};
            fromTech && (expected.tech = fromTech);
            expected[kind] = _.assign(toTech ? {tech: toTech} : {}, dep);
            var diff = depsjs.difference(this._depsContent, expected, this._bemEntity);
            diff = depsjs.subtraction(diff, this._selfDep, this._bemEntity);
            return diff.length;
        }.bind(this);

    return deps.filter(function(dep) {
        return kind === 'anyDeps'
            ? depIsMissing('mustDeps', dep) && depIsMissing('shouldDeps', dep)
            : depIsMissing(kind, dep);
    });
};

Deps.prototype._formatSelfDep = function(bemEntity) {
    var selfDep = _.omit({
        block: bemEntity.block,
        elem: bemEntity.elem,
        mod: bemEntity.modName ? _.set({}, bemEntity.modName, bemEntity.modVal || true) : undefined
    }, _.isUndefined);

    return {mustDeps: selfDep, shouldDeps: selfDep};
};

module.exports = Deps;
