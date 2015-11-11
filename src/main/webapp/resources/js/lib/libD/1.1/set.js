/*jslint browser: true, ass: true, continue: true, es5: false, forin: true, todo: true, vars: true, white: true, indent: 3 */
/*jshint noarg:true, noempty:true, eqeqeq:true, boss:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, indent:3, maxerr:50, browser:true, es5:false, forin:false, onevar:false, white:false */

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

/*jslint nomen: true, plusplus: true, indent:4 */
/*eslint no-console:0*/
/*global console:0*/

/**
 * @author  Raphaël Jakse
 * @file This is a library for manipulating mathematical sets.
 * @note Any function of this package that takes a Set also accepts any object that can be turned into a set (e.g. Object, Array variables).
 * @version 0.1a
 */

// TODO: support objects which contain circular references inside sets (stringifization problem)

(function (pkg, that) {
    "use strict";
    var _ = pkg.Setl10n = that.libD && that.libD.l10n ? that.libD.l10n() : function (s) {
		return s;
	};

    /**
     * A class to manipulate sets in Javascript.
     *
     * Note: Any function of this class, this constructor included, that takes a Set as parameter also accepts any object that can be turned into a set (e.g. Object, Array variables). For the sake of readability, this is not mentioned elsewhere.
     *
     * @class
     * @alias Set

     * @param {Set} [l] This optional parameter is an Array, a Set or an Object containing the elements to add to the newly created set.
     */
    pkg.Set = function (l) {
        if (!(this instanceof pkg.Set)) {
            return new pkg.Set(l);
        }

        this.l = {};
        this.listeners = [];

        if (l) {
            if (l instanceof pkg.Set) {// l is a set
                this.setTypeConstraint(l.typeConstraint);
                l = l.getList();
            }

            var i, len;

            if (l instanceof Array || l instanceof pkg.Tuple) {
                for (i = 0, len = l.length; i < len; ++i) {
                    this.add(l[i]);
                }
            } else {
                if (l.contents) {
                    for (i in l.contents) {
                        if (l.contents.hasOwnProperty(i)) {
                            this.add(l.contents[i]);
                        }
                    }
                } else {
                    throw new Error("A Set can only be built from a list or another Set.");
                }

                if (l.typeConstraint) {
                    this.setTypeConstraint(l.typeConstraint);
                }
            }
        }
    };

    function listToString(l) {
        var res = "", i, len;
        for (i = 0, len = l.length; i < len; ++i) {
            if (res) {
                res += ", ";
            }
            res += pkg.Set.prototype.elementToString(l[i]);
        }

        if (l instanceof pkg.Tuple) {
            if (l.length === 1) {
                return res;
            }
            return "(" + res + ")";
        }
        return "[" + res + "]";
    }

    pkg.Set.prototype = {
        /**
         * This method tests the presence of an element in the set. The has method is an alias of this method.
         * @method contains
         * @memberof Set
         * @param {any} element The element of which the presence in the set must be tested.
         * @returns {Boolean} Returns true if the element belongs to the set, false otherwise.

         */
        contains: function (element) {
            element = this.checkConstraint(element);
            return this.l.hasOwnProperty("$" + this.elementToString(element));
        },

        /**
         * This method tests the presence of an element in the set. It is an alias of the method contains.
         * @method has
         * @memberof Set
         * @param {any} element The element of which the presence in the set must be tested.
         * @returns {Boolean} Returns true if the element belongs to the set, false otherwise.
         */
        has: function (element) {
            return this.contains(element);
        },

        /**
         * This method raise an exception if an element does not verifies the constraints to belong to the set.
         * @method checkConstraint
         * @memberof Set
         * @param {any} element The element to check.
         * @exception {Error} Throws an error if the element does not satisfy the constrains.
         * @returns {any} Returns an eventually adapted version of the element (e.g. if the constraint is the element to be a set, if the element was an Array or an Object, it is turned into a Set).
         * @see Set#setTypeConstraint
         */
        checkConstraint: function (element) {
            if (this.typeConstraint) {
                if (typeof this.typeConstraint === "string") {
                    if (this.typeConstraint === "integer") {
                        if (!(typeof element === "number" && element % 1 === 0)) {
                            throw new Error(_("Set.checkConstraint(element): The element does not satisfies the type constraint."));
                        }
                    } else if (typeof element !== this.typeConstraint) {
                        throw new Error(_("Set.checkConstraint(element): The element does not satisfies the type constraint."));
                    }
                } else if (!(element instanceof this.typeConstraint)) {
                    if (this.typeConstraint === pkg.Set && (element instanceof Array || element instanceof pkg.Tuple)) {
                        element = pkg.toSet(element); // this is ok to implicitely convert lists to sets
                    } else {
                        throw new Error(_("Set.checkConstraint(element): Tthe element does not satisfies the type constraint."));
                    }
                }
            }
            return element;
        },

        /**
         * This method adds an element to the set.
         * @method add
         * @memberof Set
         * @param {any} element the element to add to the set.
         * @exception {Error} throws an error if the element does not verify the belonging constraints.
         */
        add: function (element) {
            element = this.checkConstraint(element);
            var rep = "$" + this.elementToString(element);
            if ((element instanceof pkg.Set) && !this.contains(element)) {
                var th = this;
                var bind = function () {
                    if (th.l.hasOwnProperty(rep)) {
                        delete th.l[rep];
                        th.l[rep] = element;
                        th.updated("elementModified");
                    } else {
                        element.release(bind, "all");
                    }
                };

                element.listen(bind, "all");
            }
            this.l[rep] = element;
            this.updated("add", element);
        },

        /**
         * This method removes an element from the set.
         * @method remove
         * @memberof Set
         * @param {any} element The element to remove from the set.
         */
        remove: function (element) {
            delete this.l["$" + this.elementToString(element)];
            this.updated("remove", element);
        },

        /**
         * This method calculates the cardinal (i.e the number of elements) of the set.
         * @method card
         * @memberof Set
         * @returns {number} Returns the cardinal of the set.
         * @see Set#isEmpty
         */
        card: function () {
            var i, s = 0;
            for (i in this.l) {
                if (this.l.hasOwnProperty(i)) {
                    ++s;
                }
            }
            return s;
        },

        /**
         * This method adds the elements of the set given in parameter to the set.
         * @method unionInPlace
         * @memberof Set
         * @param {Set} set The set with which the union is done.
         * @returns {Set} Returns the set itself.
         * @see Set#interInPlace
         * @see Set#minusInPlace
         * @see Set#union
         */

        unionInPlace: function (set) {
            set = pkg.toSet(set);
            this._blockEvents = true;

            var i;
            for (i in set.l) {
                if (set.l.hasOwnProperty(i)) {
                    this.add(set.l[i]);
                }
            }
            this._blockEvents = false;
            this.updated("unionInPlace", set);
            return this;
        },

        /**
         * This method removes the elements of the set which are not in the set given in parameter.
         * @method interInPlace
         * @memberof Set
         * @param {Set} set The set with which the intersection is done.
         * @returns {Set} Returns the set itself.
         * @see Set#unionInPlace
         * @see Set#minusInPlace
         * @see Set#inter
         */

        interInPlace: function (set) {
            set = pkg.toSet(set);
            this._blockEvents = true;
            var i, e;
            for (i in this.l) {
                if (this.l.hasOwnProperty(i)) {
                    e = this.l[i];
                    if (!set.contains(e)) {
                        this.remove(e);
                    }
                }
            }
            this._blockEvents = false;
            this.updated("interInPlace", set);
            return this;
        },

        /**
         * This method removes the elements of the set which are in the set given in parameter.
         * @method minusInPlace
         * @memberof Set
         * @param {Set} set The set with which the difference is done.
         * @returns {Set} Returns the set itself.
         * @see Set#interInPlace
         * @see Set#unionInPlace
         * @see Set#minus
         */
        minusInPlace: function (set) {
            set = pkg.toSet(set);
            this._blockEvents = true;
            var i;
            for (i in set.l) {
                if (set.l.hasOwnProperty(i)) {
                    this.remove(set.l[i]);
                }
            }
            this._blockEvents = false;
            this.updated("minusInPlace", set);
            return this;
        },

        minus: function (set) {
            return new pkg.Set(this).minusInPlace(set);
        },

        inter: function (set) {
            return new pkg.Set(this).interInPlace(set);
        },

        union: function (set) {
            return new pkg.Set(this).unionInPlace(set);
        },

        /**
         * This method checks if the set is a subset of the set given in parameter.
         * @memberof Set
         * @method subsetOf
         * @param {Set} set The set which is tested to be the superset of the set.
         * @returns {Boolean} Returns true if the set is a subset of the set given in parameter, false otherwise.
         */
        subsetOf: function (set) {
            set = pkg.toSet(set);
            var i;
            for (i in this.l) {
                if (this.l.hasOwnProperty(i) && !set.contains(this.l[i])) {
                    return false;
                }
            }
            return true;
        },

        /**
         * This method returns the symmetric difference of the set and the set given in parameter.
         * @memberof Set
         * @method symDiff
         * @param {Set} set The set with which the symmetric difference is done.
         * @returns {Set} Returns the result of the symmetric difference.
         * @see Set#minus
         * @see Set#union
         * @see Set#inter
         * @see Set#plus
         */
        symDiff: function (set) {
            var i, r = new pkg.Set();
            set = pkg.toSet(set);

            for (i in this.l) {
                if (this.l.hasOwnProperty(i) && !set.contains(this.l[i])) {
                    r.add(this.l[i]);
                }
            }

            for (i in set.l) {
                if (set.l.hasOwnProperty(i) && !this.contains(set.l[i])) {
                    r.add(set.l[i]);
                }
            }

            return r;
        },


        /**
         * This method returns a new set, which contains elements of the set and element passed in argument.
         * @memberof Set
         * @method plus
         * @param {any} ... The elements to add to the set.
         * @returns {Set} Returns the newly formed set.
         * @see Set#minus
         * @see Set#union
         * @see Set#inter
         * @see Set#symDiff
         * @note The set isn't modified.
         */
        plus: function () {
            var i, len, r = new pkg.Set();
            r.unionInPlace(this);
            for (i = 0, len = arguments.length; i < len; ++i) {
                r.add(arguments[i]);
            }
            return r;
        },

        /**
         * This method calculates the powerset of the set.
         * @method powerset
         * @memberof Set
         * @returns {Set} Returns the powerset of the set.
         */
        powerset: function () {
            if (this.card() === 0) {
                return new pkg.Set([new pkg.Set()]);
            }

            var i, undersetI,
                lastE, Complement = new pkg.Set();

            for (i in this.l) {
                if (this.l.hasOwnProperty(i)) {
                    lastE = this.l[i];
                    Complement.add(lastE);
                }
            }

            Complement.remove(lastE);
            var PCompl = Complement.powerset();
            var U = new pkg.Set();

            for (undersetI in PCompl.l) {
                if (PCompl.l.hasOwnProperty(undersetI)) {
                    U.add(PCompl.l[undersetI].plus(lastE));
                }
            }

            return pkg.union(PCompl, U);
        },

        /**
         * This method returns a list containing elements of the set.
         * @method getList
         * @memberof Set
         * @note the ordering of the created list isn't defined.
         * @returns {Array} Returns the list of the elements of the set.
         * @see Set#getSortedList
         */
        getList: function () {
            var i, r = [];
            for (i in this.l) {
                if (this.l.hasOwnProperty(i)) {
                    r.push(this.l[i]);
                }
            }
            return r;
        },

        /**
         * This method returns a sorted list containing elements of the set.
         * @method getSortedList
         * @memberof Set
         * @note the ordering of the created list is defined by the sort method of arrays.
         * @returns {Array} Returns the list of the elements of the set.
         * @see Set#getSortedList
         */
        getSortedList: function () {
            return this.getList().sort();
        },

        /**
         * This method returns a string representation of the set.
         * @method toString
         * ATTENTION: This method is not stabilized yet. The string representation of the set is still to be defined.
         * @memberof Set
         * @returns {string} Returns the string representation of the set.
         */
        toString: function () {
            var res = "", i, len;
            var l = this.getSortedList();
            for (i = 0, len = l.length; i < len; ++i) {
                if (res) {
                    res += ", ";
                }
                res += this.elementToString(l[i]);
            }
            return "{" + res + "}";
        },

        /**
         * This method should be called whenever the set is modified.
         * @method updated
         * @private
         * @memberof Set
         * @param {string} event A string representing what modified the set (add, remove, ...).
         * @param {any} object An object you want to attach to the event.
         */
        updated: function (event, object) {
            if (!this._blockEvents) {
                var i, len;
                for (i = 0, len = this.listeners.length; i < len; ++i) {
                    if (this.listeners[i].event === event || this.listeners[i].event === "all") {
                        this.listeners[i].callback(event, object);
                    }
                }
            }
        },

        /**
         * This method is to track modifications of the set (element removed, element added, ...).
         * @method listen
         * @private
         * @memberof Set
         * @param {Function} callback Function which will be called when the given event was fired.
         * @param {string} event The event to track, or "all" to track all events.
         */
        listen: function (callback, event) {
            this.listeners.push({
				event: event,
				callback: callback
			});
        },

        /**
         * This method is to stop tracking modifications of the set.
         * @method release
         * @private
         * @memberof Set
         * @param {Function} callback Function which was called when the given event was fired.
         * @param {string} event The event which was tracked, or "all".
         */
        release: function (callback, event) {
            var i, len;
            for (i = 0, len = this.listeners.length; i < len; ++i) {
                if (this.listeners[i].event === event && this.listeners[i].callback === callback) {
                    this.listeners.splice(i, 1);
                }
            }
        },

        /**
         * This method is to iterate over all the elements of the set.
         * @method forEach
         * @memberof Set
         * @param {Function} callback Function which will be called on each element. This function will be called with one argument: the element of the current iteration.
         * @note To stop iterating at any time, throw an exception from within the function.
         */
        forEach: function (callback) {
            var i;
            for (i in this.l) {
                if (this.l.hasOwnProperty(i)) {
                    callback(this.l[i]);
                }
            }
        },

        /**
         * This method is to set a type constraint on elements that will be added to the set.
         * @method setTypeConstraint
         * @memberof Set
         * @param {any} typeConstraint a string representation of a Javascript basic type, or a constructor of a Javascript class.
         * @note This function should always be called when the set is empty because it doesn't check the constraint on the current elements of the set.
         */
        setTypeConstraint: function (typeConstraint) {
            this.typeConstraint = typeConstraint;
        },

        /**
         * This method is to verify a property on each element of the set. If the function passed in argument returns true for all elements of the set, this method returns true; false otherwise.
         * @method every
         * @memberof Set
         * @param {Function} func Function which will be called on each element. This function should return true or false.
         * @note To stop iterating at any time, throw an exception from within the function, or return false. Iterating is stopped whenever all elements have been tested, or the callback function returns false.
         */
        every: function (func) {
            var i;
            for (i in this.l) {
                if (this.l.hasOwnProperty(i)) {
                    if (!func(this.l[i])) {
                        return false;
                    }
                }
            }
            return true;
        },

        /**
         * This method returns a copy of the set.
         * @method copy
         * @memberof Set
        */
        copy: function () {
            return new pkg.Set(this);
        },

        /**
         * This method empties the set.
         * @method empty
         * @memberof Set
        */
        empty: function () {
            this._blockEvents = true;
            var i, len, l = this.getList();
            for (i = 0, len = l.length; i < len; ++i) {
                this.remove(l[i]);
            }
            this._blockEvents = false;
            this.updated("empty");
        },

        /**
         * This method tests whether the set is empty or not.
         * @method isEmpty
         * @memberof Set
         * @returns {Boolean} Returns true if the set is empty, false otherwise.
        */
        isEmpty: function () {
            var i;
            for (i in this.l) {
                if (this.l.hasOwnProperty(i)) {
                    return false;
                }
            }
            return true;
        },

        /**
         * This method returns an element of the set. Notice: do not expect this to be random!
         * @method getItem
         * @memberof Set
         * @returns {Boolean} Returns an element of the set.
        */
        getItem: function () {
            var i;
            for (i in this.l) {
                if (this.l.hasOwnProperty(i)) {
                    return this.l[i];
                }
            }
        },

        elementToString: function (e, map) {
            if (typeof e === "number" && isNaN(e)) {
                return "NaN";
            }
            switch (e) {
            case undefined:
                return "undefined";
            case null:
                return "null";
            case -Infinity:
                return "-Infinity";
            case Infinity:
                return "Infinity";
            default:
                if (e instanceof Array || e instanceof pkg.Tuple) {
                    return listToString(e);
                }

                if (typeof e === "string") {
                    if (!e.length || /["'\\{\[\]}\(\), \s]/.test(e) || parseFloat(e).toString() === e || (typeof map === "object" && map.hasOwnProperty(e))) {
                        e = JSON.stringify(e);
                    }
                    return e.toString();
                }

                if (e instanceof Date) {
                    return "Date(\"" + e.toString() + "\")";
                }

                if (typeof e === "object" && e.serializeElement) {
                    return e.serializeElement();
                }

                if (typeof e === "object") {
                    if (e.toJSON) {
                        return JSON.stringify(e);
                    }

                    var i, res = "", keys = Object.keys(e).sort();
                    for (i in keys) {
						if (keys.hasOwnProperty(i)) {
							if (res) {
								res += ", ";
							} else {
								res = "{";
							}

							console.log(e, keys[i]);
							res += JSON.stringify(keys[i]) + ":" + pkg.Set.prototype.elementToString(e[keys[i]]);
						}
                    }
                    return res ? res + "}" : "Object()";
                }

                return e.toString();
            }
        },

        getNextValue: function (s, j, len, map) {
            if (len === undefined) {
                len = s.length;
            }

            while (j < len && (!s[j].trim() || s[j] === ", ")) {
                ++j;
            }

            var j0 = j, lastIndex, end, closed, nextValue;

            if (s[j] === "\"" || s[j] === "'") {
                end = s[j++];
                while (j < len && s[j] !== end) {
                    if (s[j] === "\\") {
                        ++j;
                    }
                    ++j;
                }

                lastIndex = j + 1;
                return {
                    value: JSON.parse(
						end === "\""
							? "\"" + s.substring(j0 + 1, j).replace(/"/g, "\\\"") + "\""
							: s.substring(j0, j + 1)),
                    lastIndex: lastIndex
                };
            }

            if (s[j] === "{") {
                var key, set = new pkg.Set();
                ++j;
                closed = false;
                while (j < len) {
                    while (j < len && (!s[j].trim() || s[j] === ", ")) {
                        ++j;
                    }

                    if (s[j] === "}") {
                        lastIndex = j + 1;
                        closed = true;
                        j = lastIndex;
                        break;
                    }

                    nextValue = pkg.Set.prototype.getNextValue(s, j, len, map);

                    if (j === nextValue.lastIndex) {
                        throw new Error(_("Value is malformed."));
                    }

                    j = nextValue.lastIndex;

                    if (s[j] === ":") {
                        if (set instanceof pkg.Set) {
                            if (set.isEmpty()) {
                                set = {};
                            } else {
                                throw new Error(_("Value is malformed."));
                            }
                        }
                        ++j;

                        key = nextValue.value;
                        nextValue = pkg.Set.prototype.getNextValue(s, j, len, map);
                        set[key] = nextValue.value;
                    } else if (set instanceof pkg.Set) {
                        set.add(nextValue.value);
                    } else {
                        throw new Error(_("Value is malformed."));
                    }

                    j = nextValue.lastIndex;
                }

                if (!closed) {
                    throw new Error(_("Value is malformed."));
                }

                return {
                    value: set,
                    lastIndex: lastIndex
                };
            }

            if (s[j] === "(" || s[j] === "[") {
                end = s[j] === "(" ? ")" : "]";
                var tuple = (end === ")") ? new pkg.Tuple() : [];
                ++j;
                closed = false;
                while (j < len) {
                    while (j < len && (!s[j].trim() || s[j] === ", ")) {
                        ++j;
                    }

                    if (s[j] === end) {
                        lastIndex = j + 1;
                        j = lastIndex;
                        closed = true;
                        break;
                    }

                    nextValue = pkg.Set.prototype.getNextValue(s, j, len, map);

                    if (j === nextValue.lastIndex) {
                        throw new Error(_("Value is malformed."));
                    }

                    tuple.push(nextValue.value);
                    j = nextValue.lastIndex;
                }

                if (!closed) {
                    throw new Error(_("Value is malformed."));
                }

                return {
                    value: tuple,
                    lastIndex: lastIndex
                };
            }

            while (j < len && s[j].trim() && ":(, })]".indexOf(s[j]) === -1) {
                ++j;
            }

            var valName = s.substring(j0, j).trim();

            if (s[j] === "(") {
                var values = [];

                if (/^[a-zA-Z]+$/.test(valName)) {
                    if (typeof that[valName] !== "function") {
                        throw new Error(_("Constructor name in value refers to unkown class."));
                    }
                    ++j;
                    while (j < len && s[j] !== ")") {
                        nextValue = pkg.Set.prototype.getNextValue(s, j, len, map);
                        j = nextValue.lastIndex;
                        values.push(nextValue.value);
                    }
                }

                if (valName === "Date") {
                    return {
                        value: new Date(values[0] || null),
                        lastIndex: j + 1
                    };
                }

                if (valName === "Object") {
                    return {
                        value: values[0] || null, // FIXME check correction
                        lastIndex: j + 1
                    };
                }

                var F = function () {};

                F.prototype = that[valName].prototype;
                var v = new F();
                that[valName].apply(v, values);

                return {
                    value: v,
                    lastIndex: j + 1
                };
            }

            switch (valName) {
            case "true":
                return {
                    value: true,
                    lastIndex: j
                };
            case "false":
                return {
                    value: false,
                    lastIndex: j
                };
            case "null":
                return {
                    value: null,
                    lastIndex: j
                };
            case "undefined":
                return {
                    value: undefined,
                    lastIndex: j
                };
            case "NaN":
                return {
                    value: NaN,
                    lastIndex: j
                };
            case "Infinity":
            case "+Infinity":
                return {
                    value: Infinity,
                    lastIndex: j
                };
            case "-Infinity":
                return {
                    value: -Infinity,
                    lastIndex: j
                };
            default:
                var d = parseFloat(valName);
                if (d.toString() === valName) {
                    return {
                        value: d,
                        lastIndex: j
                    };
                }
            }

            return {
                value: typeof map === "object" && map.hasOwnProperty(valName) ? map[valName] : valName,
                lastIndex: j
            };
        },

        getValue: function (s, map) {
            s = s.trim();
            var len = s.length,
                 nextValue = pkg.Set.prototype.getNextValue(s, 0, len, map);
            if (nextValue.lastIndex === len) {
                return nextValue.value;
            }
            throw new Error(_("Value is malformed."));
        }
    };

    pkg.Tuple = function () {
        if (!(this instanceof pkg.Tuple)) {
            return new pkg.Tuple().fromList(arguments);
        }

        var length = 0;
        Object.defineProperty(this, "length", {
            enumerable: false,
            configurable: false,
            get: function () {
                return length;
            },
            set: function (v) {
                if (v < length) {
                    while (length > v) {
                        delete this[length - 1];
                        --length;
                    }
                } else if (v > length) {
                    this.setItem(length, undefined, true);
                    ++length;
                }
            }

        });
        this.fromList(arguments);
    };

    Object.defineProperties(pkg.Tuple.prototype, {
        fromList: {
            enumerable: false,
            value: function (l) {
                this.blockCheckCoupleToTuple = true;
                var i, len;
                for (i = 0, len = l.length; i < len; ++i) {
                    this.push(l[i]);
                }
                this.blockCheckCoupleToTuple = false;
                this.checkCoupleToTuple();
                return this;
            }
        },

        flattenList: {
            enumerable: false,
            value: function (l) {
                var cur = 0, th = this;
                function add(e) {
                    if (e instanceof pkg.Tuple || e instanceof Array) {
                        var i, len;
                        for (i = 0, len = e.length; i < len; ++i) {
                            add(e[i]);
                        }
                    } else {
                        th.setItem(cur, e);
                        ++cur;
                    }
                }
                add(l);
                return this;
            }
        },

        item: {
            enumerable: false,
            value: function (i) {
                return this[i];
            }
        },

        setItem: {
            enumerable: false,
            value: function (i, e, noCheckLength) {
                if (!noCheckLength && this.length <= i) {
                    while (this.length <= i) {
                        this.length = i + 1;
                    }
                }
                Object.defineProperty(this, i, {
                    enumerable: true,
                    configurable: true,
                    get: function () {
                        return e;
                    },

                    set: function (nv) {
                        e = nv;
                        this.checkCoupleToTuple();
                    }
                });
                this.checkCoupleToTuple();
                return this;
            }
        },

        push: {
            enumerable: false,
            value: function (e) {
                this.setItem(this.length, e);
                this.checkCoupleToTuple();
                return this;
            }
        },

        checkCoupleToTuple: {
            enumerable: false,
            value: function () {
                if (!this.blockCheckCoupleToTuple) {
                    this.blockCheckCoupleToTuple = true;
                    if (this.length !== 2 || !(this[0] instanceof pkg.Tuple)) {
                        return;
                    }

                    var lastItem = this[1], t = this[0];
                    this.length = 0;

                    var i, len;
                    for (i = 0, len = t.length; i < len; ++i) {
                        this.setItem(i, t[i]);
                    }

                    this.push(lastItem);
                    delete this.blockCheckCoupleToTuple;
                    this.checkCoupleToTuple();
                }
            }
        },

        asCouple: {
            enumerable: false,
            value: function () {
                switch (this.length) {
                case 0:
                    return [];
                case 1:
                    return [
                        this[0]
                    ];
                case 2:
                    return [
                        this[0],
                        this[1]
                    ];
                default:
                    return [
                        new pkg.Tuple(Array.prototype.slice.call(this, 0, this.length - 1)),
                        this[this.length - 1]
                    ];
                }
            }
        },

        getList: {
            enumerable: false,
            value: function () {
                var i, l = [];
                l.length = this.length;
                for (i = 0; i < this.length; ++i) {
                    l[i] = this[i];
                }
                return i;
            }
        },

        toString: {
            enumerable: false,
            value: function () {
                return pkg.Set.prototype.elementToString(this);
            }
        }
    });

    pkg.Set.prototype.serializeElement = pkg.Set.prototype.toString;

    pkg.toSet = function (l) {
        if (l instanceof pkg.Set) {
            return l;
        }
        return new pkg.Set(l);
    };

    pkg.setUnion = function (set1, set2) {
        var set = pkg.toSet(set1);
        set.unionInPlace(set2);
        return set;
    };

    pkg.setInter = function (set1, set2) {
        var set = new pkg.Set(), e, i;
        for (i in set1.l) {
            if (set1.l.hasOwnProperty(i)) {
                e = set1.l[i];
                if (set2.contains(set1.l[i])) {
                    set.add(e);
                }
            }
        }
        return set;
    };

    pkg.setMinus = function (set1, set2) {
        set1 = new pkg.Set(set1);
        set1.minusInPlace(set2);
        return set1;
    };

    pkg.setCross = function (set1, set2) {
        var i, j, set = new pkg.Set();
        set1 = pkg.toSet(set1);
        set2 = pkg.toSet(set2);
        for (i in set1.l) {
            if (set1.l.hasOwnProperty(i)) {
                for (j in set2.l) {
                    if (set2.l.hasOwnProperty(j)) {
                        set.add(new pkg.Tuple(set1.l[i], set2.l[j]));
                    }
                }
            }
        }
        return set;
    };

	if (that.libD.moduleLoaded) {
		that.libD.moduleLoaded("set");
	}

}(this.libD || (this.libD = {}), this));
