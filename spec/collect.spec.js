var acorn = require('acorn'),
    collect = require('../lib/collect');

describe('collect', function() {
    describe('objectLiterals()', function() {
        function collectObjLiterals(fn) {
            var content = fn.toString().replace(/^function[^{]+\{/, '').replace(/\}$/, '');
            return collect.objectLiterals(acorn.parse(content));
        }

        it('should not collect anything from empty program', function() {
            expect(collectObjLiterals(function() {})).toEqual([]);
        });

        it('should not collect anything if there are no object literals', function() {
            expect(collectObjLiterals(function() {
                test(14);
                function test(a) {
                    if (a > 0) {
                        return a + test(a - 1)
                    } else {
                        return 0;
                    }
                }
            })).toEqual([]);
        });

        it('should collect all kinds of object literals', function() {
            expect(collectObjLiterals(function() {
                var x = {};
                test({a: 'b'});
                function test(obj) {
                    return {deeply: {nested: {object: true}}};
                }
                var y = {
                    num: 12,
                    vrbl: x,
                    iife: (function() {
                        return {nested: 'yes'};
                    })(),
                    koo: {woo: ({a: 'x'})['a']}
                }
            })).toEqual([
                {},
                {a: 'b'},
                {deeply: {nested: {object: true}}},
                {nested: 'yes'},
                {a: 'x'},
                {
                    num: 12,
                    vrbl: undefined,
                    iife: undefined,
                    koo: {woo: undefined}
                }
            ]);
        });

        it('should not collect top level arrays or non-object nested array values', function() {
            expect(collectObjLiterals(function() {
                var tla = [{bem: 'json'}];
                var nested = {
                    object: {okay: 1},
                    array: ['will', 'be', 'empty'],
                    mix: [
                        'will',
                        {contain: [
                            {only: 'objects'},
                            'but', ['not', {arr: 'rays'}, 42]
                        ]}
                    ]
                }
            })).toEqual([
                {bem: 'json'},
                {
                    object: {okay: 1},
                    array: [],
                    mix: [{
                        contain: [
                            {only: 'objects'},
                            {arr: 'rays'}
                        ]
                    }]
                }
            ]);
        });
    });

    describe('depsEntities()', function() {
        it('should not collect deps entities from empty array', function() {
            expect(collect.depsEntities([])).toEqual({
                regular: [],
                inMix: []
            });
        });

        it('should collect top level deps entities', function() {
            expect(collect.depsEntities([
                {block: 'block'},
                {block: 'block', elem: 'elem'},
                {block: 'block', mods: {mod: 'val'}},
                {block: 'block', elem: 'elem', mods: {mod: 'val'}}
            ])).toEqual({
                regular: [
                    {block: 'block'},
                    {block: 'block', elem: 'elem'},
                    {block: 'block', mod: 'mod', val: 'val'},
                    {block: 'block', elem: 'elem', mod: 'mod', val: 'val'}
                ],
                inMix: []
            });
        });

        it('should collect elemMods', function() {
            expect(collect.depsEntities([
                {block: 'block', elem: 'elem', elemMods: {mod: 'val'}}
            ])).toEqual({
                regular: [
                    {block: 'block', elem: 'elem'},
                    {block: 'block', elem: 'elem', mod: 'mod', val: 'val'}
                ],
                inMix: []
            });
        });

        it('should collect boolean mods', function() {
            expect(collect.depsEntities([
                {block: 'a', mods: {mod: 'val', checked: true}},
                {block: 'b', elem: 'elem', elemMods: {hovered: true, mod: 'val'}}
            ])).toEqual({
                regular: [
                    {block: 'a'},
                    {block: 'a', mod: 'mod', val: 'val'},
                    {block: 'a', mod: 'checked', val: true},
                    {block: 'b', elem: 'elem'},
                    {block: 'b', elem: 'elem', mod: 'hovered', val: true},
                    {block: 'b', elem: 'elem', mod: 'mod', val: 'val'}
                ],
                inMix: []
            });
        });

        it('should collect mixed deps entities', function() {
            expect(collect.depsEntities([
                {block: 'parent', mix: [
                    {block: 'block'},
                    {block: 'block', elem: 'elem'},
                    {block: 'block', mods: {mod: 'val'}},
                    {block: 'block', elem: 'elem', mods: {mod: 'val'}}
                ]}
            ])).toEqual({
                regular: [
                    {block: 'parent'}
                ],
                inMix: [
                    {block: 'block'},
                    {block: 'block', elem: 'elem'},
                    {block: 'block', mod: 'mod', val: 'val'},
                    {block: 'block', elem: 'elem', mod: 'mod', val: 'val'}
                ]
            });
        });

        it('should collect nested objects via content', function() {
            expect(collect.depsEntities([
                {block: 'parent', content: [
                    {block: 'block'},
                    {block: 'block', elem: 'elem'},
                    {block: 'block', mods: {mod: 'val'}},
                    {block: 'block', elem: 'elem', mods: {mod: 'val'}}
                ]}
            ])).toEqual({
                regular: [
                    {block: 'parent'},
                    {block: 'block'},
                    {block: 'block', elem: 'elem'},
                    {block: 'block', mod: 'mod', val: 'val'},
                    {block: 'block', elem: 'elem', mod: 'mod', val: 'val'}
                ],
                inMix: []
            });
        });

        it('should support block context passing', function() {
            expect(collect.depsEntities([
                {
                    block: 'parent',
                    content: {
                        block: 'child',
                        content: {
                            elem: 'wrap',
                            mix: {elem: 'wrap-mix'},
                            content: {
                                tag: false,
                                content: {
                                    elem: 'content',
                                    mix: [{block: 'parent', elem: 'content'}, {elem: 'content-mix'}]
                                }
                            }
                        }
                    }
                }
            ])).toEqual({
                regular: [
                    {block: 'parent'},
                    {block: 'child'},
                    {block: 'child', elem: 'wrap'},
                    {block: 'child', elem: 'content'}
                ],
                inMix: [
                    {block: 'child', elem: 'wrap-mix'},
                    {block: 'parent', elem: 'content'},
                    {block: 'child', elem: 'content-mix'}
                ]
            });
        });

        it('should ignore broken things', function() {
            expect(collect.depsEntities([
                {content: {tag: 'li'}},
                {elem: 'elem'},
                {mods: {mod: 'val'}},
                {
                    block: 'block',
                    mix: undefined,
                    mods: {name: undefined},
                    customField: {block: 'ignored'},
                    content: {
                        block: undefined,
                        elem: 'elem'
                    }
                }
            ])).toEqual({
                regular: [
                    {block: 'block'},
                    {block: 'block', mod: 'name'}
                ],
                inMix: []
            });
        });
    });
});
