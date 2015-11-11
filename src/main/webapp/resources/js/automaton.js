/*kate: tab-width 4; space-indent on; indent-width 4; replace-tabs on; eol unix; */
/*jslint browser: true, ass: true, continue: true, es5: false, forin: true, todo: true, vars: true, white: true, indent: 3 */
/*jshint noarg:true, n.clear():true, eqeqeq:true, boss:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, indent:3, maxerr:50, browser:true, es5:false, forin:false, onevar:false, white:false */

/*
    Copyright (c) 2013-2014, Raphaël Jakse (Université Joseph Fourier)
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

/*jslint indent:4, plusplus:true, nomen:true */
/*global Set:false, aude:false */

/**
 * @file This is a class to manipulate automata in Javascript
 * @author Raphaël Jakse
 * @requires Set.js
 *
 */

(function (pkg, that) {
    "use strict";

    /**
     * epsilon: Represents epsilon to manipulate epsilon transitions.
     * epsilon is a function to enforce equality to be true when and only when comparing explicitely with epsilon.
     * @alias epsilon
     */
    pkg.epsilon = function () { return; };


    pkg.automataMap = {
        "\\e":pkg.epsilon,
        "ε":pkg.epsilon
    };

    /**
     * A class to manipulate automata in Javascript.

     * @class
     * @alias Automaton
     */
    pkg.Automaton = function (states, Sigma, qInit, trans, finalStates) {
        if (states) {
            if (states instanceof pkg.Automaton) {
                pkg.Automaton.call(this, new Set(states.states), new Set(states.Sigma), states.qInit, new Set(states.trans), new Set(states.finalStates));
                this.currentStates = new Set(states.currentStates);
                this.lastTakenTransitions = new Set(states.lastTakenTransitions);
                return;
            }

            if (!(states instanceof Array) && !(states instanceof Set)) {
                throw new Error(_("Automaton constructor takes an Automaton in argument, or nothing."));
            }
        }

        this.states = aude.toSet(states);
        this.Sigma = aude.toSet(Sigma);
        this.qInit = qInit;
        this.trans =  aude.toSet(trans);
        this.finalStates = aude.toSet(finalStates);

        if (!this.currentStates) {
            this.currentStates = new Set();
            this.lastTakenTransitions = new Set();
        }
    };

    var _      = pkg.Automaton.l10n = that.libD && that.libD.l10n ? that.libD.l10n() : function (s) { return s; },
    format = function (s, i) { return s.replace("{0}", i); };

    pkg.Automaton.prototype = {
        /**
         * This method adds a state to the automaton.
         * @method
         * @memberof Automaton
         * @param {any} state The state to add, can be of any type.
         * @param {boolean} [final] If given and true, the state will be a final (accepting) state.
         * @see addFinalState
         * @see addAcceptingState
         */
        addState: function (state, final) {
            this.states.add(state);
            if (final) {
                this.finalStates.add(state);
            }
        },

        /**
         * This method adds a final (accepting) state to the automaton. If the state is already there, makes it final.
         * @method
         * @memberof Automaton
         * @param {any} state The state to add, can be of any type.
         * @see Automaton#setNonFinalState
         */
        addFinalState: function (state) {
            this.addState(state, true);
        },

        /**
         * This method is an alias of the addFinalStateState method.
         * @see Automaton#addFinalState
         */
        addAcceptingState: function (state) {
            this.addState(state, true);
        },

        /**
         * This method is an alias of the addFinalState method.
         * @see Automaton#setNonFinalState
         */
        setFinalState: function (state) {
            this.addState(state, true);
        },

        /**
         * This method removes a state from the Set of final states of the automaton.
         * @method
         * @memberof Automaton
         * @param {any} state The state to add, can be of any type.
         * @see Automaton#addFinalState
         */
        setNonFinalState: function (state) {
            this.finalStates.remove(state);
        },

        /**
         * This methodes toggles a state in the Set of final states of the automaton.
         * @method
         * @memberof Automaton
         * @param {any} state The state to add or remove, can be of any type.
         */
        toggleFinalState: function (state) {
            if (this.finalStates.has(state)) {
                this.setNonFinalState(state);
            } else {
                this.setFinalState(state);
            }
        },

        /**
         * This method is an alias of the addFinalStateState method.
         * @method
         * @memberof Automaton
         * @see Automaton#addFinalState
         */
        setAcceptingState: function (state) {
            this.addState(state, true);
        },

        /**
         * This method is an alias of the toggleFinalState method.
         * @method
         * @memberof Automaton
         * @see Automaton#toggleFinalState
         */
        toggleAcceptingState: function (state) {
            this.toggleFinalState(state);
        },

        /**
         * This method is an alias of the setNonFinalState method.
         * @method
         * @memberof Automaton
         * @see Automaton#setNonFinalState
         */
        setNonAcceptingState: function (state) {
            this.finalStates.remove(state);
        },

        /**
         * This method returns the Set of non final (accepting) states of the automaton.
         * @method
         * @memberof Automaton
         * @returns {Set} The Set of non final states
         */
        getNonFinalStates: function () {
            return aude.minus(this.getStates(), this.getFinalStates());
        },

        /**
         * This method is an alias of the getNonAcceptingStates method.
         * @method
         * @memberof Automaton
         * @returns {Set} The Set of non final states
         * @see Automaton#getNonAcceptingStates
         */
        getNonAcceptingStates: function () {
            return aude.minus(this.getStates(), this.getFinalStates());
        },

        /**
         * This method returns the Set of states of the automaton.
         * @method
         * @memberof Automaton
         * @returns {Set} The Set of non final states
         */
        getStates: function () {
            return this.states;
        },

        /**
         * This method sets the Set of states of the automaton.
         * @method
         * @memberof Automaton
         * @param {Set} states The Set new Set of states of the automaton.
         * @param {Boolean} dontCopy If you don't want the function to copy the given Set of state, Set this to true; the Set will be used directly.
         */
        setStates: function (states, dontCopy) {
            if (states instanceof Set || states instanceof Array) {
                this.states = dontCopy ? aude.toSet(states) : new Set(states);
            } else {
                throw new Error(_("Automaton.setStates(): The given argument is not a Set."));
            }
        },

        /**
         * This method returns the Set of final (accepting) states of the automaton.
         * @method
         * @memberof Automaton
         * @returns {Set} The Set of final states of the automaton.
         * @see Automaton#setFinalStates
         * @see Automaton#setFinalState
         */
        getFinalStates: function () {
            return this.finalStates;
        },

         /**
         * This method is an alias of the getFinalStates method.
         * @method
         * @memberof Automaton
         * @returns {Set} The Set of final states of the automaton.
         * @see Automaton#getFinalStates
         */
        getAcceptingStates: function () {
            return this.finalStates;
        },

        /**
         * This method sets the Set of final (accepting) states of the automaton. Every other state is Set to non final.
         * @method
         * @memberof Automaton
         * @param {Set} states The new Set of final states of the automaton.
         * @param {Boolean} dontCopy If you don't want the function to copy the given Set of state, Set this to true; the Set will be used directly.
         * @see Automaton#getAcceptingStates
         */
        setFinalStates: function (states, dontCopy) {
            if (states instanceof Set || states instanceof Array) {
                this.finalStates = dontCopy ? aude.toSet(states) : new Set(states);
            } else {
                throw new Error(_("Automaton.setFinalStates(): The given argument is not a Set."));
            }
        },

        /**
         * This method is an alias of the setFinalStates method.
         * @method
         * @memberof Automaton
         * @see Automaton#setFinalStates
         */
        setAcceptingStates: function (states) {
            return this.setFinalState(states);
        },

        /**
         * This method sets the initial state of the automaton.
         * @method
         * @memberof Automaton
         * @param {any} state The new initial state of the automaton.
         * @see Automaton#getInitialState
         */
        setInitialState: function (state) {
            this.states.add(state);
            this.qInit = state;
        },

        /**
         * This method returns the initial state of the automaton.
         * @method
         * @memberof Automaton
         * @returns {any} The initial state of the automaton.
         * @see Automaton#setInitialState
         */
        getInitialState: function () {
            return this.qInit;
        },

        /**
         * This method removes a state from the automaton.
         * @method
         * @memberof Automaton
         * @param {any} the state to remove
         * @see addState
         */
        removeState: function (state) {
            this.states.remove(state);
            this.finalStates.remove(state);
        },

        /**
         * This method checks if the automaton has the state given in parameter.
         * @method
         * @memberof Automaton
         * @param {any} state The state to check
         * @returns {boolean} Returns true if the states is in the automaton, false otherwise.
         */
        hasState: function (state) {
            return this.states.has(state);
        },

        /**
         * This method checks if the state given in parameter is a final state of this automaton.
         * @method
         * @memberof Automaton
         * @param {any} state The state to check
         * @returns {boolean} Returns true if the states is in the automaton, false otherwise.
         */
        isFinalState: function (state) {
            return this.finalStates.has(state);
        },

         /**
         * This method is an alias of the isFinalState method.
         * @method
         * @memberof Automaton
         * @returns {boolean} Returns true if the states is in the automaton, false otherwise.
         * @see Automaton#isFinalState
         */
        isAcceptingState: function (state) {
            return this.finalStates.has(state);
        },

        /**
         * This method adds a transition to the automaton. It can takes one or three arguments: a Transition object, or a state, a symbol and a state. This method automatically adds states and symbols which have not yet been added to the automaton.
         *
         * @method
         * @memberof Automaton
         * @example
         *    A = new pkg.Automaton();
         *    A.setInitialState(1);
         *    A.addFinalState(2);
         *    A.addTransition(1, "a", 2);
         *    var t = new pkg.Transition(1, epsilon, 2);
         *    A.addTransition(t);
         * @see Automaton#removeTransition
         * @see Automaton#hasTransition
         * @see Automaton#getTransitions
         * @see Automaton#getTransitionFunction
         * @see Transition
         */
        addTransition: function (t, t1, t2) {
            if (arguments.length > 1) {
                return this.addTransition(new pkg.Transition(t, t1, t2));
            }

            this.states.add(t.startState);
            this.states.add(t.endState);
            this.addSymbol(t.symbol);
            this.trans.add(t);
        },

        /**
         * This function removes a transition to the automaton. It can takes one or three arguments: a Transition object, or a state, a symbol and a state. Don't forget to remove states or symbol that should also be removed, if necessary; this method does not do that automatically.
         *
         * @method
         * @memberof Automaton
         *
         * @see Automaton#addTransition
         * @see Automaton#hasTransition
         * @see Automaton#getTransitions
         * @see Automaton#getTransitionFunction
         * @see Transition
         * @see Automaton#removeSymbol
         * @see Automaton#removeState
         */
        removeTransition: function (t, t1, t2) {
            if (arguments.length > 1) {
                return this.removeTransition(new pkg.Transition(t, t1, t2));
            }

            this.trans.remove(t);
        },

         /**
          * This method checks if a transition exists in the automaton. It can takes one or three arguments: a Transition object, or a state, a symbol and a state.
          *
          * @method
          * @memberof Automaton
          *
          * @returns {boolean} Returns true if the transition exists, false otherwise
          * @see Automaton#addTransition
          * @see Automaton#removeTransition
          * @see Automaton#hasTransition
          * @see Automaton#getTransitions
          * @see Automaton#getTransitionFunction
          * @see Transition
          */
        hasTransition: function (t, t1, t2) {
            if (arguments.length > 1) {
                return this.hasTransition(new pkg.Transition(t, t1, t2));
            }

            return this.trans.has(t);
        },

        /**
         * This method returns the Set of transitions of the automaton.
         *
         * @method
         * @memberof Automaton
         *
         * @returns {Set} Returns the Set of transitions of the Automaton.
         * @see Automaton#addTransition
         * @see Automaton#removeTransition
         * @see Automaton#hasTransition
         * @see Automaton#getTransitionFunction
         * @see Transition
         */
        getTransitions: function () {
            return this.trans;
        },

        /**
         * This method returns the Set of symbols of the Automaton.
         *
         * @method
         * @memberof Automaton
         *
         * @returns {Set} Returns the alphabet of the automaton.
         *
         * @see Automaton#addSymbol
         * @see Automaton#removeSymbol
         */
        getAlphabet: function () {
            return this.Sigma;
        },

        /**
         * This method returns the transition function of the automaton. This function is such that:
         *  - f() returns the set of start states
         *  - f(startState) return the set of symbols such that one more (startState, symbol, endState) transitions exist(s)
         *  - f(startState, symbol) returns the set of states reachable with (startState, symbol). If determinizedFunction is true, return the only state reachable with (startState, symbol).
         *  - f(null, null, true) returns the set of endStates of all transitions.
         * @method
         * @memberof Automaton
         * @param {Boolean} determinizedFunction If the automaton is deterministic, makes the transition function easier to use (see description for more information). Leads to undetermined behavior in case the automaton is not deterministic.
         * @returns {Function} Returns a convenient function to manipulate transitions of the automaton.
         * @example
         *    var f = A.getTransitionFunction();
         *    f().forEach(function (startState) {
         *        f(startState).forEach(function (symbol) {
         *             f(startState, symbol).forReach(function (endState) {
         *                 console.log(startState, symbol, endState); // logs all the automaton's transition
         *             })
         *        });
         *    });
         * @see Automaton#addTransition
         * @see Automaton#removeTransition
         * @see Automaton#hasTransition
         * @see Transition
         */
        getTransitionFunction: function (determinizedFunction) {
            var transList = aude.toArray(this.getTransitions()),
                transition,
                symbolsByState = [],
                startState,
                startStates = new Set(),
                endStates   = new Set(),
                endStatesByStartStateBySymbols = {},
                endStatesByStartStateEpsilon = {},
                symbol,
                t;

            for (t in transList) {
                transition = transList[t];
                startStates.add(transition.startState);
                endStates.add(transition.endState);
                startState = aude.elementToString(transition.startState);
                if (!symbolsByState[startState]) {
                    symbolsByState[startState] = new Set();
                    endStatesByStartStateBySymbols[startState] = {};
                }

                if (transition.symbol === pkg.epsilon) {
                    if (determinizedFunction) {
                        endStatesByStartStateEpsilon[startState] = transition.endState;
                    } else {
                        if (!endStatesByStartStateEpsilon[startState]) {
                            endStatesByStartStateEpsilon[startState] = new Set();
                        }
                        endStatesByStartStateEpsilon[startState].add(transition.endState);
                    }
                } else {
                    symbol = aude.elementToString(transition.symbol);
                    if (determinizedFunction) {
                        endStatesByStartStateBySymbols[startState][symbol] = transition.endState;
                    } else {
                        if (!endStatesByStartStateBySymbols[startState][symbol]) {
                            endStatesByStartStateBySymbols[startState][symbol] = new Set();
                        }
                        endStatesByStartStateBySymbols[startState][symbol].add(transition.endState);
                    }
                }
                symbolsByState[startState].add(transition.symbol);
            }

            transList = null;

            return function (startState, symbol, getEndStates) {
                if (getEndStates) {
                    return endStates;
                }

                switch (arguments.length) {
                    case 0:
                        return startStates;
                    case 1:
                        return symbolsByState[aude.elementToString(startState)] || new Set();
                    case 2:
                        var s;
                        if (symbol === pkg.epsilon) {
                            s = endStatesByStartStateEpsilon[aude.elementToString(startState)];
                            if (!determinizedFunction && s === undefined) {
                                return new Set();
                            }
                            return s;
                        }

                        s = (endStatesByStartStateBySymbols[aude.elementToString(startState)] || [])[aude.elementToString(symbol)];
                        if (!determinizedFunction && s === undefined) {
                            return new Set();
                        }
                        return s;
                }
            };
        },

        /**
         * This method sets the Set of symbols of the automaton.
         * @method
         * @memberof Automaton
         * @param {Set} alphabet The Set of symbol to use.
         * @see Automaton#addAlphabet
         * @see Automaton#removeAlphabet
         * @see Automaton#addSymbol
         * @see Automaton#hasSymbol
         * @see Automaton#removeSymbol
         */
        setAlphabet: function (alphabet, byRef) {
            if (byRef) {
                if (alphabet instanceof Set) {
                    this.Sigma = alphabet;
                    return;
                }
                throw new Error(_("Automaton.setAlphabet(): The given argument is not a Set."));
            }

            this.Sigma = new Set(alphabet);
        },

        /**
         * This method adds a Set of symbols to the automaton.
         * @method
         * @memberof Automaton
         * @param {Set} alphabet The Set of symbol to add to the current alphabet.
         * @see Automaton#setAlphabet
         * @see Automaton#removeAlphabet
         * @see Automaton#addSymbol
         * @see Automaton#hasSymbol
         * @see Automaton#removeSymbol
         */
        addAlphabet: function (alphabet) {
            aude.unionInPlace(this.Sigma, alphabet);
        },

        /**
         * This method removes a Set of symbols from the automaton.
         * @method
         * @memberof Automaton
         * @param {Set} alphabet The Set of symbol to remove from the current alphabet.
         * @see Automaton#addAlphabet
         * @see Automaton#setAlphabet
         * @see Automaton#addSymbol
         * @see Automaton#hasSymbol
         * @see Automaton#removeSymbol
         */
        removeAlphabet: function (alphabet) {
            aude.minusInPlace(this.Sigma, alphabet);
        },

        /**
         * This method adds a symbol to the automaton.
         * @method
         * @memberof Automaton
         * @param {any} symbol The symbol to add
         * @see Automaton#removeSymbol
         * @see Automaton#hasSymbol
         * @see Automaton#addAlphabet
         * @see Automaton#setAlphabet
         * @see Automaton#removeAlphabet
         */
        addSymbol: function (symbol) {
            if (symbol !== pkg.epsilon) {
                this.Sigma.add(symbol);
            }
        },



        /**
         * This method tests whether a symbol belongs to the automaton.
         * @method
         * @memberof Automaton
         * @param {any} symbol The symbol to test
         * @returns {boolean} Returns true if the Automaton has the symbol, false otherwise.
         * @see Automaton#addAlphabet
         * @see Automaton#setAlphabet
         * @see Automaton#removeAlphabet
         * @see Automaton#addSymbol
         * @see Automaton#removeSymbol
        */
        hasSymbol: function (symbol) {
            return this.trans.has(symbol);
        },

        /**
         * This method removes a symbol from the automaton.
         * @method
         * @memberof Automaton
         * @param {any} symbol The symbol to remove
         * @see Automaton#addAlphabet
         * @see Automaton#setAlphabet
         * @see Automaton#removeAlphabet
         * @see Automaton#addSymbol
         * @see Automaton#hasSymbol
        */
        removeSymbol: function (symbol) {
            this.trans.add(symbol);
        },

        /**
         * This method returns a string representation of the automaton.
         * @method toString
         * @memberof Automaton
         * @note ATTENTION: This method is not stabilized yet. The string representation of the Automaton is still to be defined.
         * @returns {string} Returns the string representation of the Set.
         */
        toString: function () {
            return "Automaton(" + aude.elementToString(this.states) + ", " + aude.elementToString(this.Sigma) + ", " + aude.elementToString(this.qInit) + ", " + aude.elementToString(this.trans) + "," + aude.elementToString(this.finalStates) + ")";
        },

        /**
         * This method sets the current state of the automaton
         * @method
         * @memberof Automaton
         * @param {any} state The state to make current
         * @see Automaton#setCurrentStates
         * @see Automaton#addCurrentState
         * @see Automaton#addCurrentStates
         * @see Automaton#removeCurrentState
         * @see Automaton#removeCurrentStates
         * @see Automaton#getCurrentStates
        */
        setCurrentState: function (state) {
            this.lastTakenTransitions.clear();
            if (this.states.has(state)) {
                this.currentStates.clear();
                this.currentStates.add(state);
                this.currentStatesAddAccessiblesByEpsilon();
            }
        },

        /**
         * This method sets the current states of the automaton.
         * @method
         * @memberof Automaton
         * @param {Set} states The Set of states to make current
         * @see Automaton#setCurrentState
         * @see Automaton#addCurrentState
         * @see Automaton#addCurrentStates
         * @see Automaton#removeCurrentState
         * @see Automaton#removeCurrentStates
         * @see Automaton#getCurrentStates
        */
        setCurrentStates: function (states) {
            this.lastTakenTransitions.clear();
            states = aude.toSet(states);
            if (states.subsetOf(this.states)) {
                this.currentStates.clear();
                aude.unionInPlace(this.currentStates, aude.toSet(states));
                this.currentStatesAddAccessiblesByEpsilon();
            }
        },

        /**
         * This method make states of the automaton current.
         * @method
         * @memberof Automaton
         * @param {any} state The state to add to the Set of current states.
         * @see Automaton#setCurrentState
         * @see Automaton#setCurrentStates
         * @see Automaton#addCurrentStates
         * @see Automaton#removeCurrentState
         * @see Automaton#removeCurrentStates
         * @see Automaton#getCurrentStates
        */
        addCurrentState: function (state) {
            if (this.states.has(state)) {
                this.currentStates.add(state);
                this.currentStatesAddAccessiblesByEpsilon();
            }
        },

        /**
         * This method remove a state from the Set of current states of the automaton.
         * @method
         * @memberof Automaton
         * @param {any} state The state to remove from the Set of current states.
         * @see Automaton#setCurrentState
         * @see Automaton#setCurrentStates
         * @see Automaton#addCurrentState
         * @see Automaton#addCurrentStates
         * @see Automaton#removeCurrentStates
         * @see Automaton#getCurrentStates
        */
        removeCurrentState: function (state) {
            this.currentStates.remove(state);
            this.currentStatesAddAccessiblesByEpsilon();
        },

        /**
         * This method add a Set of states to the Set of current states of the automaton.
         * @method
         * @memberof Automaton
         * @param {Set} states The Set of states to add to the Set of current states.
         * @see Automaton#setCurrentState
         * @see Automaton#setCurrentStates
         * @see Automaton#addCurrentState
         * @see Automaton#removeCurrentState
         * @see Automaton#removeCurrentStates
         * @see Automaton#getCurrentStates
        */
        addCurrentStates: function (states) {
            aude.unionInPlace(this.currentStates, states);
            this.currentStatesAddAccessiblesByEpsilon();
        },

        /**
         * This method add a Set of states to the Set of current states of the automaton.
         * @method
         * @memberof Automaton
         * @param {Set} states The Set of states to add to the Set of current states.
         * @see Automaton#setCurrentState
         * @see Automaton#setCurrentStates
         * @see Automaton#addCurrentState
         * @see Automaton#addCurrentStates
         * @see Automaton#removeCurrentState
         * @see Automaton#getCurrentStates
        */
        removeCurrentStates: function (states) {
            aude.minusInPlace(this.currentStates, states);
            this.currentStatesAddAccessiblesByEpsilon();
        },

        /**
         * This method returns the Set of current states of the automaton.
         * @method
         * @memberof Automaton
         * @return {Set} The Set of current states of the automaton.
         * @see Automaton#setCurrentState
         * @see Automaton#setCurrentStates
         * @see Automaton#addCurrentState
         * @see Automaton#addCurrentStates
         * @see Automaton#removeCurrentState
         * @see Automaton#removeCurrentStates
        */
        getCurrentStates: function () {
            return this.currentStates;
        },

        /**
         * This methods looks at current states and transitions of the Automaton to add all states accessible with epsilon to the current states.
         * @method
         * @memberof Automaton
         * @param {Function} [transitionFunction] The transition function, as given by the getTransitionFunction() method
         * @param {Set} [visited] States that were already visited by the function.
         */
        currentStatesAddAccessiblesByEpsilon: function (transitionFunction, visited) {
            var cs   = aude.toArray(this.currentStates),
                cont = false, // we continue if we added states
                th   = this;

            if (!visited) {
                visited = new Set();
            }

            if (!transitionFunction) {
                transitionFunction = this.getTransitionFunction();
            }

            var i;

            function browseState(state) {
                if (!visited.has(state)) {
                    th.currentStates.add(state);
                    th.lastTakenTransitions.add(new pkg.Transition(cs[i], pkg.epsilon, state));
                    cont = true;
                }
            }

            for (i = 0; i < cs.length; ++i) {
                if (!visited.has(cs[i])) {
                    visited.add(cs[i]);
                    transitionFunction(cs[i], pkg.epsilon).forEach(browseState);
                }
            }

            if (cont) {
                this.currentStatesAddAccessiblesByEpsilon(transitionFunction, visited);
            }
        },

         /**
         * This methods returns the set of successors of a state. Its behavior is well defined only on determinized automata.
         *
         * @method
         * @memberof Automaton
         * @param {State} [state] The state from which the successors are to get
         * @param {Symbol} [symbol] If given, restrain successors to a symbol. If not given, consider all symbols.
         */
        getSuccessors: function (state, symbol) {
            var successors = new Set();
            var allSymbols = arguments.length === 1;

            this.trans.forEach(
                function (t) {
                    if (t.startState === state) {
                        if (allSymbols || t.symbol === symbol) {
                            successors.add(t.endState);
                        }
                    }
                }
            );

            return successors;
        },

        getReachable : function (state, visited) {
            if (state === undefined) {
                state = this.getInitialState();
            }

            if (!visited) {
                visited = new Set();
            }

            var that = this;

            this.getSuccessors(state).forEach(
                function (s) {
                    if (s !== state && !visited.has(s)) {
                        visited.add(s);
                        aude.unionInPlace(visited, that.getReachable(s, visited));
                    }
                }
            );

            return visited;
        },


        /**
         * This methods looks at current states and transitions of the Automaton to replace current states by all states accessible with the given symbol.
         * @method
         * @memberof Automaton
         * @throws {Error} Throws an error if epsilon is given as the symbol.
         * @param {any} symbol The symbol to "eat"
         * @param {Function} [transitionFunction] The transition function, as given by the getTransitionFunction() method
         * @param {boolean} [dontEraseTakenTransitions] dontEraseTakenTransitions If true, don't reinitialize the Set of last taken transitions, just append newly taken transition to it.
         * @see Automaton#runWord
         * @see Automaton#acceptedWord
         * @see Automaton#getCurrentStates
         * @see Automaton#getLastTakenTransitions
         */
        runSymbol: function (symbol, transitionFunction, dontEraseTakenTransitions) {
            if (symbol === pkg.epsilon) {
                throw new Error(_("Automaton.runSymbol(): epsilon is forbidden."));
            }

            if (!this.Sigma.has(symbol)) {
                this.lastTakenTransitions.clear();
                this.currentStates.clear();
                return false;
            }

            if (!transitionFunction) {
                transitionFunction = this.getTransitionFunction();
            }

            if (!dontEraseTakenTransitions) {
                this.lastTakenTransitions.clear();
            }

            var cs = aude.toArray(this.currentStates),
                th = this;

            var i;

            function addState(state) {
                th.currentStates.add(state);
                th.lastTakenTransitions.add(new pkg.Transition(cs[i], symbol, state));
            }

            for (i = 0; i < cs.length; ++i) {
                this.currentStates.remove(cs[i]);
            }

            for (i = 0; i < cs.length; ++i) {
                transitionFunction(cs[i], symbol).forEach(addState);
            }

            this.currentStatesAddAccessiblesByEpsilon(transitionFunction);
        },

        /**
         * This method runs each symbol of the list of symbol given. See the description of the runSymbol for more information. Don't forget to Set the current state to the initial state if you need it.
         * @method
         * @memberof Automaton
         * @throws {Error} Throws an error if epsilon is given as a symbol.
         * @param {Array} The list of symbols to run
         * @see Automaton#runSymbol
         * @see Automaton#acceptedWord
         * @see Automaton#getCurrentStates
        */
        runWord: function (symbols) {
            var i, transitionFunction = this.getTransitionFunction();
            for (i in symbols) {
                this.runSymbol(symbols[i], transitionFunction);
            }
        },

        /**
         * This method runs a word from the initial state and checks if this word is accepted by the automaton. It takes care to restore current states and last taken transitions after the run.
         * @method
         * @memberof Automaton
         * @throws {Error} Throws an error if epsilon is given as a symbol.
         * @param {Array} The list of symbols to run
         * @see Automaton#runSymbol
         * @see Automaton#runWord
        */
        acceptedWord: function (symbols) {
            var states      = aude.toArray(this.getCurrentStates()),
                transitions = new Set(this.getLastTakenTransitions());

            this.setCurrentState(this.getInitialState());
            this.runWord(symbols);
            var accepted = aude.inter(this.currentStates, this.finalStates).card() !== 0;
            this.setCurrentStates(states);
            this.lastTakenTransitions = transitions;
            return accepted;
        },

        /**
         * This method returns the Set of transitions that were taken while running on the last symbol. See the runSymbol method for more information.
         * @method
         * @memberof Automaton
         * @returns {Set} The Set of last taken transitions
         * @see Automaton#runSymbol
         * @see Automaton#getCurrentStates
        */
        getLastTakenTransitions: function () {
            return this.lastTakenTransitions;
        },

        copy: function () {
            return new pkg.Automaton(this);
        }
    };

    pkg.Automaton.prototype.serializeElement = pkg.Automaton.prototype.toString;

    /**
     * A class to manipulate transitions of automata in Javascript.

     * @class
     * @alias Transition
     */
    pkg.Transition = function (startState, symbol, endState) {
        this.startState = startState;
        this.symbol     = symbol;
        this.endState   = endState;
    };

    pkg.Transition.prototype = {
        toString: function () {
            return "Transition(" + aude.elementToString(this.startState) + ", " + aude.elementToString(this.symbol) + ", " + aude.elementToString(this.endState) + ")";
        }
    };

    pkg.Transition.prototype.serializeElement = pkg.Transition.prototype.toString;

    /**
     * Parses the textual representation of an automaton and returns an automaton from it.
     * @alias read_automaton
     * @param {String} code the code of an automaton.
     * @returns {Automaton} Returns the corresponding automaton.
     */
    pkg.read_automaton = function (code) {
        var getNextValue = aude.getNextValue;

        var c = code.split("\n");
        var a = new pkg.Automaton();
        var i = 1, len = c.length;
        try {
            a.setInitialState(getNextValue(c[0], 0, c[0].length).value);

            for (i = 1; i < len && c[i].trim(); ++i) {
                a.addState(getNextValue(c[i], 0, c[i].length).value);
            }

            for (++i; i < len && c[i].trim(); ++i) {
                a.addFinalState(getNextValue(c[i], 0, c[i].length).value);
            }

            var startState, endState, symbol, j, leng, nextValue;
            for (++i; i < len && c[i].trim(); ++i) {
                leng = c[i].length;
                startState = (nextValue = getNextValue(c[i], 0, leng)).value;
                symbol = (nextValue = getNextValue(c[i], nextValue.lastIndex, leng)).value;
                if (symbol === "\\e") {
                    symbol = pkg.epsilon;
                }
                j = nextValue.lastIndex;
                endState = getNextValue(c[i], j, leng).value;

                a.addTransition(startState, symbol, endState);
            }
            return a;
        }
        catch(e) {
            throw new Error(format(_("read_automaton: Line {0} is malformed."), i + 1));
        }
    };

    /**
     * Returns the textual representation of an automaton
     * @alias automaton_code
     * @param {Automaton} a The automaton to get the textual representation of.
     * @returns {String} The string representation of the Automaton. The.clear() string is returned if the Automaton is not correct, e.g. no initial state is Set.
     */
    pkg.automaton_code = function (a) {
        var qInit   = a.getInitialState(),
            toString = aude.elementToString;

        if (qInit === undefined || qInit === null) {
            return "";
        }

        var r  = toString(qInit) + "\n",
            F  = a.getFinalStates(),
            Fl = aude.toArray(F),
            Q  = aude.toArray(a.getStates()),
            T  = aude.toArray(a.getTransitions()),
            i;

        Q.sort();
        T.sort();

        for (i in Q) {
            if (Q[i] !== qInit && !F.has(Q[i])) {
                r += toString(Q[i]) + "\n";
            }
        }
        r += "\n";

        for (i in Fl) {
            r += toString((Fl[i])) + "\n";
        }

        r += "\n";
        for (i in T) {
            r += toString(T[i].startState) +
                            " " +
                  (T[i].symbol === pkg.epsilon ? "\\e" : toString(T[i].symbol, pkg.automataMap)) +
                            " " +
                  toString(T[i].endState) +
                            "\n";
        }
        return r + "\n";
    };

    /**
     * Returns the list of symbols of a transition from its string representation
     * @alias parse_transition
     * @param {String} text The string representation of a transition
     * @returns {Array} Returns an array of symbols corresponding to the representation of the transition.
     */
    pkg.parse_transition = function (text) {
        return aude.getValue("[" + text + "]", pkg.automataMap);
    };

    /**
     * From a transition's string representation (like "a, b, \e"), gives transition's string representation (like "a,b,ε") (transforms \e → ε).
     * @alias format_transition
     * @param {String} trans The string representation of a transition to format.
     * @return {String} Returns the formatted version of the string representation of the transition
     */
    pkg.format_transition = function (trans) {
        var res = "", i, len, symbols = pkg.parse_transition(trans);
        for (i = 0, len = symbols.length; i < len; ++i) {
            if (res) {
                res += ",";
            }

            if (symbols[i] === pkg.epsilon) {
                res += "ε";
            } else {
                res += aude.elementToString(symbols[i], pkg.automataMap);
            }
        }
        return res;
    };
}(typeof this.exports === "object" ? this.exports : this, typeof this.exports === "object" ? this.exports : this));
