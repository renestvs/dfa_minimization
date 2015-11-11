// NEEDS: automaton.js

/*
    Copyright (c) 2013, Raphaël Jakse (Université Joseph Fourier)
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

/*jslint indent: 4, plusplus: true, ass:true */
/*global Automaton:false, btoa:false, atob:false, Set:false, epsilon:false */

(function (pkg) {
    "use strict";

    function toString(q, trans) {
        if (q === epsilon) {
            return "ε";
        }
        return pkg.automaton2dot_standardizedString(q, trans).replace(/\\\\/g, "\\");
    }

    function dotState(q) {
        var s = toString(q);
        return JSON.stringify(s).replace(/&/g, "&amp;") + "[id=\"" + btoa(s) + "\"]";
    }

    function catln() {
        var i, len, r = "";

        for (i = 0, len = arguments.length; i < len; ++i) {
            r += arguments[i];
        }

        return r + "\n";
    }

    function cat() {
        var i, len, r = "";

        for (i = 0, len = arguments.length; i < len; ++i) {
            r += arguments[i];
        }

        return r;
    }

    pkg.automaton2dot_standardizedString = function (s, trans) {
        if (!trans && typeof s === "string") {
            s = s.trim();
            try {
                var v = aude.getValue(s);
                if (typeof v === "string" && s[0] === s[s.length - 1] && (s[0] === "\"" || s[0] === "'")) {
                    return s.substring(1, s.length - 1);
                }

                return aude.elementToString(v);
            } catch (e) {
                return s;
            }
        }

        return aude.elementToString(s, trans ? {"ε": epsilon} : {});
    };

    pkg.automaton2dot = function (a, title) {
        if (!title) {
            title = "automaton";
        }

        var res                = catln("digraph ", JSON.stringify(title), " {\n\trankdir=LR\n\t_begin [style = invis];"),
            nonacceptingStates = aude.toArray(a.getNonFinalStates()),
            acceptingStates    = aude.toArray(a.getFinalStates()),
            transitions        = aude.toArray(a.getTransitions()),
            states             = aude.toArray(a.getStates()),
            initialState       = a.getInitialState(),
            leng               = states.length,
            table              = [],
            startState,
            endState,
            endTrans,
            trans,
            symbols,
            comma,
            trLen,
            tmp,
            len,
            tr,
            eS,
            sS,
            s,
            t,
            q,
            i;

        if (!a.hasState(initialState)) {
            throw new Error("Automaton has no initial state.");
        }

        if (a.isAcceptingState(initialState)) {
            res += catln("\n\tnode [shape = doublecircle];");
            res += catln("\t\t", dotState(initialState));
        }

        if (nonacceptingStates.length || !a.isAcceptingState(initialState)) {
            res += catln("\n\tnode [shape = circle];");

            if (!a.isAcceptingState(initialState)) {
                res += catln("\t\t", dotState(initialState));
            }

            for (q in nonacceptingStates) {
                if (nonacceptingStates.hasOwnProperty(q) && nonacceptingStates[q] !== initialState) {
                    res += catln("\t\t", dotState(nonacceptingStates[q]));
                }
            }
        }

        if (acceptingStates.length) {
            res += catln("\n\tnode [shape = doublecircle];");
            for (q in acceptingStates) {
                if (acceptingStates.hasOwnProperty(q) && acceptingStates[q] !== initialState) {
                    res += catln("\t\t", dotState(acceptingStates[q]));
                }
            }
        }

        res += "\n";

        for (tr = 0, trLen = transitions.length; tr < trLen; ++tr) {
            t = transitions[tr];

            if (!table[t.startState]) {
                table[t.startState] = {};
            }

            if (!table[t.startState][t.endState]) {
                table[t.startState][t.endState] = new Set();
            }

            table[t.startState][t.endState].add(t.symbol);
        }

        if (!a.hasState(initialState)) {
            throw new Error("Initial state is not set.");
        }

        res += cat("\t_begin -> ", JSON.stringify(toString(initialState).replace(/&/g, "&amp;")), " [label = \"\" arrowhead=vee id=initialStateArrow]\n");

        for (sS = 0; sS < leng; ++sS) {
            startState = states[sS];

            trans = table[startState];
            if (trans) {
                for (eS = 0; eS < leng; ++eS) {
                    endState = states[eS];
                    endTrans = trans[endState];
                    if (endTrans) {
                        res += cat("\t", JSON.stringify(toString(startState)).replace(/&/g, "&amp;"), " -> ", JSON.stringify(toString(endState)).replace(/&/g, "&amp;"), " [label = ");

                        symbols = aude.toArray(endTrans);
                        comma   = "";
                        s       = "";
                        tmp     = "";

                        symbols.sort();

                        for (i = 0, len = symbols.length; i < len; ++i) {
                            s = toString(symbols[i], true);
                            tmp += cat(comma, s);

                            if (!comma.length) {
                                comma = ",";
                            }
                        }

                        res += JSON.stringify(tmp).replace(/&/g, "&amp;") + catln(", id=\"", btoa(toString(startState)), " ", btoa(toString(endState)), "\"]");
                    }
                }
            }
        }

        return res + catln("}");
    };
}(this));
