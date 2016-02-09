var Deps = require('../lib/deps');

describe('Deps', function() {
    describe('getMissing()', function() {
        describe('regular deps', function() {
            var instance;

            function testMissing(deps, kinds) {
                Object.keys(kinds).forEach(function(kind) {
                    expect(instance.getMissing(deps, kind)).toEqual(kinds[kind], kind);
                });
            }

            beforeEach(function() {
                instance = new Deps({
                    block: 'block'
                }, {
                    mustDeps: [
                        {elems: ['x', 'y']},
                        {mods:  {m1: ['v1', 'v2'], m2: 'v'}},
                        {block: 'a'},
                        {block: 'b', elems: ['x', 'y'], mods: {m1: ['v1', 'v2'], m2: 'v'}}
                    ],
                    shouldDeps: [
                        {elem: 'z'},
                        {mods:  {m3: ['v1', 'v2'], m4: 'v'}},
                        {block: 'c', elem: ['x', 'y']},
                        {block: 'b', mod: 'm3', val: 'v'},
                        {block: 'e', mod: 'bool'}
                    ]
                });
            });

            it('self elems', function() {
                testMissing([
                    {block: 'block', elem: 'w'},
                    {block: 'block', elem: 'x'},
                    {block: 'block', elem: 'z'}
                ], {
                    mustDeps: [
                        {block: 'block', elem: 'w'},
                        {block: 'block', elem: 'z'}
                    ],
                    shouldDeps: [
                        {block: 'block', elem: 'w'},
                        {block: 'block', elem: 'x'}
                    ],
                    anyDeps: [
                        {block: 'block', elem: 'w'}
                    ]
                })
            });


            it('self mods', function() {
                testMissing([
                    {block: 'block', mod: 'm1', val: 'v1'},
                    {block: 'block', mod: 'm2', val: 'v'},
                    {block: 'block', mod: 'm3', val: 'v2'},
                    {block: 'block', mod: 'm4'},
                    {block: 'block', mod: 'm5'}
                ], {
                    mustDeps: [
                        {block: 'block', mod: 'm3', val: 'v2'},
                        {block: 'block', mod: 'm4'},
                        {block: 'block', mod: 'm5'}
                    ],
                    shouldDeps: [
                        {block: 'block', mod: 'm1', val: 'v1'},
                        {block: 'block', mod: 'm2', val: 'v'},
                        {block: 'block', mod: 'm5'}
                    ],
                    anyDeps: [
                        {block: 'block', mod: 'm5'}
                    ]
                })
            });

            it('blocks', function() {
                testMissing([
                    {block: 'a'},
                    {block: 'b'},
                    {block: 'c'}
                ], {
                    mustDeps: [
                        {block: 'c'}
                    ],
                    shouldDeps: [
                        {block: 'a'},
                        {block: 'b'},
                        {block: 'c'}
                    ],
                    anyDeps: [
                        {block: 'c'}
                    ]
                })
            });

            it('elems', function() {
                testMissing([
                    {block: 'b', elem: 'x'},
                    {block: 'c', elem: 'y'},
                    {block: 'c', elem: 'z'}
                ], {
                    mustDeps: [
                        {block: 'c', elem: 'y'},
                        {block: 'c', elem: 'z'}
                    ],
                    shouldDeps: [
                        {block: 'b', elem: 'x'},
                        {block: 'c', elem: 'z'}
                    ],
                    anyDeps: [
                        {block: 'c', elem: 'z'}
                    ]
                })
            });

            it('mods', function() {
                testMissing([
                    {block: 'b'},
                    {block: 'b', mod: 'm1', val: 'v1'},
                    {block: 'b', mod: 'm2', val: 'v'},
                    {block: 'b', mod: 'm3', val: 'v'},
                    {block: 'e', mod: 'bool'}
                ], {
                    mustDeps: [
                        {block: 'b', mod: 'm3', val: 'v'},
                        {block: 'e', mod: 'bool'}
                    ],
                    shouldDeps: [
                        {block: 'b'},
                        {block: 'b', mod: 'm1', val: 'v1'},
                        {block: 'b', mod: 'm2', val: 'v'},
                    ],
                    anyDeps: []
                })
            });
        });

    });
});
