/*kate: tab-width 4; space-indent on; indent-width 4; replace-tabs on; eol unix; */
/*
    Copyright (c) 2013-2015, Raphaël Jakse (Université Joseph Fourier)
    All rights reserved.
    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of Université Joseph Fourier nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
    WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE REGENTS AND CONTRIBUTORS BE LIABLE FOR ANY
    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*eslint no-eval:0, no-native-reassign:0, no-extend-native:0 */

(function (pkg, that) {
    "use strict";

    var _ = pkg.l10n || (that.libD && that.libD.l10n ? that.libD.l10n() : function (s) { return s; });

    function notdef() {}

    var Tuple      = that.Tuple      || notdef;
    var Automaton  = that.Automaton  || notdef;
    var Transition = that.Transition || notdef;

    function tuplesEq(t1, t2) {
        if (t1.length !== t2.length) {
            return false;
        }

        var j;
        for (j = 0; j < t1.length; ++j) {
            if (!pkg.eq(t1[j], t2[j])) {
                return false;
            }
        }

        return true;
    }

    function objEq(v1, v2, dontMirror) {
        for (var i in v1) {
            if (v1.hasOwnProperty(i)) {
                if (!(v2.hasOwnProperty(i) && (dontMirror || pkg.eq(v1[i], v2[i])))) {
                    return false;
                }
            }
        }

        if (!dontMirror) {
            return objEq(v2, v1, true);
        }

        return true;
    }

    pkg.Tuple = Tuple;

    // checks "real" equality between v1 and v2
    pkg.eq = function (v1, v2) {
        if (v1 instanceof pkg.Tuple && v1.length === 1) {
            return pkg.eq(v2, v1[0]);
        }

        /*eslint-disable eqeqeq */

        return v1 == v2 || (
            v1 !== null
            && typeof v1 === typeof v2
            && v1.constructor === v2.constructor
            && (v1 instanceof Set
                ? v1.card() === v2.card() && !v1.minus(v2).card()
                : (v1 instanceof Transition
                    ?          pkg.eq(v1.symbol, v2.symbol)
                            && pkg.eq(v1.startState, v2.startState)
                            && pkg.eq(v1.endState, v2.endState)
                    : (v1 instanceof Automaton
                        ?          pkg.eq(v1.states, v2.states)
                                && pkg.eq(v1.finalStates, v2.finalStates)
                                && pkg.eq(v1.trans, v2.trans)
                                && pkg.eq(v1.q_init, v2.q_init)
                        : (v1 instanceof pkg.Tuple
                            ? tuplesEq(v1, v2)
                            : (
                                (v1.constructor === Object || v1.constructor === Array
                                    ? objEq(v1, v2)
                                    : JSON.stringify(v1) === JSON.stringify(v2)
                                )
                            )
                        )
                    )
                )
            )
        );

        /*eslint-enable eqeqeq */
    };

    pkg.ct = function (container, value) {
        // contains
        if (typeof container === "string" || container instanceof Array) {
            return container.indexOf(value) !== -1;
        }

        if (container instanceof Set) {
            return container.has(value);
        }
    };

    pkg.ict = function (value, container) {
        return pkg.ct(container, value);
    };

    pkg.U = pkg.union = function (container1, container2) {
        return pkg.unionInPlace(
            pkg.unionInPlace(new Set(), container1),
            container2
        );
    };

    pkg.I = pkg.inter = function (container1, container2) {
        var res = new Set();

        container2 = pkg.toSet(container2);

        container1.forEach(
            function (e) {
                if (container2.has(e)) {
                    res.add(e);
                }
            }
        );

        return res;
    };

    pkg.M = pkg.minus = function (container1, container2) {
        return pkg.minusInPlace(new Set(container1), container2);
    };

    pkg.minusInPlace = function (container1, container2) {
        if (container1 instanceof Set) {
            container1.minusInPlace(container2);
            return container1;
        }

        throw new Error(audescript.l10n("Inter in place is only possible with sets"));
    };

    pkg.subsetOf = function (container1, container2) {
        return container1.subsetOf(container2);
    };

    pkg.cross = pkg.X = function (container1, container2) {
        return pkg.toSet(container1).cross(pkg.toSet(container2));
    };

    pkg.has = function (container, value) {
        return container.hasOwnProperty(value);
    };

    pkg.symDiff = function (container1, container2) {
        return pkg.toSet(container1).symDiff(container2);
    },

    pkg.toSet = Set.prototype.toSet;

    pkg.set = function(l) {
        return new Set(l);
    };

    pkg.Ui = pkg.unionInPlace = function (container1, container2) {
        if (container1 instanceof Set) {
            container1.unionInPlace(container2);
            return container1;
        }

        throw new Error(audescript.l10n("Union in place is only possible with sets"));
    };

    pkg.o = function (a) {
        var res = Object.create(null);

        for (var i = 0; i < a.length; i += 2) {
            res[a[i]] = a[i + 1];
        }

        return res;
    };

    pkg.e = function (v) {
        if (v instanceof Set) {
            return v.card() === 0;
        }

        if (v instanceof Array) {
            return v.length === 0;
        }

        if (typeof v === "string") {
            return v === "";
        }

        try {

        } catch (e) {
            throw new Error(audescript.l10n("This value's type is not supported by the 'is (not) empty' operator"));
        }
    }

    var modules = {};

    pkg.m = function (moduleName, newModule) {
        if (newModule && !modules[moduleName]) {
            modules[moduleName] = {};
        }

        return modules[moduleName];
    };

    pkg.tuple = function (arr) {
        return (new Tuple()).fromList(arr);
    };

    pkg.console = console;

    Object.defineProperty(Object.prototype, "forEach", {
        enumerable: false,
        writable:   true,
        value: function (callback) {
            var i;
            for (i in this) {
                if (this.hasOwnProperty(i)) {
                    callback(this[i]);
                }
            }
        }
    });

    Object.defineProperty(Array.prototype, "peek", {
        enumerable: false,
        writable:   true,
        value: function () {
            return this[this.length - 1];
        }
    });
}((typeof exports !== "undefined" && exports) || (this.audescript || (this.audescript = {})), this));
