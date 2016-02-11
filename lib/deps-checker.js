var vm = require('vm'),
    acorn = require('acorn'),
    collect = require('./collect'),
    Deps = require('./deps');

function DepsChecker(entity, techs) {
    this._entity = entity;
    this._techs = [].concat(techs);
    this._walkers = [];
    this._filters = [];

    var depsTech = entity.getTechByName('deps.js');
    this._deps = new Deps(
        entity.getTechs()[0].entity,
        depsTech ? vm.runInThisContext(depsTech.content) : []);
}

DepsChecker.prototype.walkAst = function(walker) {
    this._walkers.push(walker);
    return this;
};

DepsChecker.prototype.filterLiterals = function(callback) {
    this._filters.push(callback);
    return this;
};

DepsChecker.prototype.collectEntities = function(callback) {
    this._techs.forEach(function(techName) {
        var tech = this._entity.getTechByName(techName);
        if(!tech) return;

        var literals = collect.objectLiterals(acorn.parse(tech.content), this._walkers);
        this._filters.forEach(function(func) {
            literals = literals.filter(func);
        });
        var entities = collect.depsEntities(literals);

        callback(
            entities.regular,
            entities.inMix,
            this._expect.bind(this, techName)
        );
    }.bind(this));
};

DepsChecker.prototype._expect = function(tech, deps, kind, fromTech, toTech) {
    var missing = this._deps.getMissing(deps, kind, fromTech, toTech);
    missing.length && this._entity.addError({
        msg: 'Missing ' +
            (kind === 'anyDeps' ? 'mustDeps or shouldDeps' : kind) +
            (fromTech ? ' by tech ' + fromTech + '->' + toTech : ''),
        tech: tech,
        value: missing
    });
};

module.exports = DepsChecker;
