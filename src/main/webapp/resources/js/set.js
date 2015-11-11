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

/**
 * @author  Raphaël Jakse
 * @file This is a library for manipulating mathematical sets.
 * @note Any function of this package that takes a Set also accepts any object that can be turned into a set (e.g. Object, Array variables).
 * @version 0.1a
 */

// TODO: support objects which contain circular references inside sets (stringifization problem)

(function (pkg, that) {
    "use strict";

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
            }
        }
    };

    var _ = pkg.Set.l10n = that.libD && that.libD.l10n ? that.libD.l10n() : function (s) { return s; };

    function listToString(l) {
        var res = "", i, len;
        for (i = 0, len = l.length; i < len; ++i) {
            if (res) {
                res += ",";
            }
            res += Set.prototype.elementToString(l[i]);
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
         * This method adds an element to the set.
         * @method add
         * @memberof Set
         * @param {any} element the element to add to the set.
         * @exception {Error} throws an error if the element does not verify the belonging constraints.
         */
        add: function (element) {
            var rep = "$" + this.elementToString(element);
            if ((element instanceof pkg.Set) && !this.contains(element)) {
                var th = this;
                var bind = function () {
                    if (th.l.hasOwnProperty(rep)) {
                        delete th.l[rep];
                        th.l[rep] = element;
                        th.updated("elementModified");
                    }
                    else {
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
            set = Set.prototype.toSet(set);
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
            set = Set.prototype.toSet(set);
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
            set = Set.prototype.toSet(set);
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

        cross: function (set) {
            var res = new Set();

            this.forEach(
                function (e1) {
                    set.forEach(
                        function (e2) {
                            res.add(new Tuple().fromList([e1, e2]));
                        }
                    );
                }
            );

            return res;
        },

        /**
         * This method checks if the set is a subset of the set given in parameter.
         * @memberof Set
         * @method subsetOf
         * @param {Set} set The set which is tested to be the superset of the set.
         * @returns {Boolean} Returns true if the set is a subset of the set given in parameter, false otherwise.
         */
        subsetOf: function (set) {
            set = Set.prototype.toSet(set);
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
            set = Set.prototype.toSet(set);

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

            var i, underset_i,
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

            for (underset_i in PCompl.l) {
                if (PCompl.l.hasOwnProperty(underset_i)) {
                    U.add(PCompl.l[underset_i].plus(lastE));
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
                    res += ",";
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
         * This method is to track modifications of the set (element removed, element added,...).
         * @method listen
         * @private
         * @memberof Set
         * @param {Function} callback Function which will be called when the given event was fired.
         * @param {string} event The event to track, or "all" to track all events.
         */
        listen: function (callback, event) {
            this.listeners.push({event:event,callback:callback});
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

        some: function (func) {
            var i;
            for (i in this.l) {
                if (this.l.hasOwnProperty(i)) {
                    if (func(this.l[i])) {
                        return true;
                    }
                }
            }
            return false;
        },

        /**
         * This method returns a copy of the set.
         * @method copy
         * @memberof Set
        */
        copy : function () {
            return new pkg.Set(this);
        },

        /**
         * This method empties the set.
         * @method empty
         * @memberof Set
        */
        empty : function () {
            this._blockEvents = true;
            var i, len, l = this.getList();
            for (i = 0, len = l.length; i < len; ++i) {
                this.remove(l[i]);
            }
            this._blockEvents = false;
            this.updated("empty");
        },

        clear : function () {
            this.empty();
        },

        /**
         * This method tests whether the set is empty or not.
         * @method isEmpty
         * @memberof Set
         * @returns {Boolean} Returns true if the set is empty, false otherwise.
        */
        isEmpty : function () {
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
        getItem : function () {
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
                    if (!e.length || /["'\\{\[\]}\(\),\s]/.test(e) || parseFloat(e).toString() === e || (typeof map === "object" && map.hasOwnProperty(e))) {
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
                        if (res) {
                            res += ",";
                        } else {
                            res = "{";
                        }

                        res += JSON.stringify(keys[i]) + ":" + pkg.Set.prototype.elementToString(e[keys[i]]);
                    }
                    return res ? res + "}" : "Object()";
                }

                return e.toString();
            }
        },

        toSet: function (l) {
            if (l instanceof Set) {
                return l;
            }
            return new Set(l);
        }
    };


    pkg.Set.prototype.serializeElement = pkg.Set.prototype.toString;

    pkg.Tuple = function () {
        var length = 0;
        Object.defineProperty(this, "length", {
            enumerable: false,
            configurable: false,
            get : function () {
                return length;
            },
            set : function (v) {
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
    };

    Object.defineProperties(pkg.Tuple.prototype, {
        fromList: {
            enumerable:false,
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
            enumerable:false,
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
            enumerable:false,
            value: function (i) {
                return this[i];
            }
        },

        setItem: {
            enumerable:false,
            value: function (i, e, noCheckLength) {
                if (!noCheckLength && this.length <= i) {
                    while (this.length <= i) {
                        this.length = i + 1;
                    }
                }
                Object.defineProperty(this, i, {
                    enumerable:true,
                    configurable:true,
                    get : function () {
                        return e;
                    },

                    set : function (nv) {
                        e = nv;
                        this.checkCoupleToTuple();
                    }
                });
                this.checkCoupleToTuple();
                return this;
            }
        },

        push: {
            enumerable:false,
            value: function (e) {
                this.setItem(this.length, e);
                this.checkCoupleToTuple();
                return this;
            }
        },

        checkCoupleToTuple: {
            enumerable:false,
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
            enumerable:false,
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
                        pkg.Tuple(Array.prototype.slice.call(this, 0, this.length - 1)),
                        this[this.length - 1]
                    ];
                }
            }
        },

        getList: {
            enumerable:false,
            value: function () {
                var i, l = [];
                l.length = this.length;
                for (i = 0; i <  this.length; ++i) {
                    l[i] = this[i];
                }
                return i;
            }
        },

        toString: {
            enumerable:false,
            value: function () {
                return Set.prototype.elementToString(this);
            }
        }
    });

}(typeof this.exports === "object" ? this.exports : this, typeof this.exports === "object" ? this.exports : this));
