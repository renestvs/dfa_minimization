var aude = {
    elementToString : Set.prototype.elementToString,

    getNextValue: function (s, j, len, map) {
        if (len === undefined) {
            len = s.length;
        }

        while (j < len && (!s[j].trim() || s[j] === ",")) {
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
                        ? s.substring(j0, j + 1)
                        : "\"" + s.substring(j0 + 1,j).replace(/"/g, "\\\"") + "\""
                ),
                lastIndex: lastIndex
            };
        }

        if (s[j] === "{") {
            var key, set = new Set();
            ++j;
            closed = false;
            while (j < len) {
                while (j < len && (!s[j].trim() || s[j] === ",")) {
                    ++j;
                }

                if (s[j] === "}") {
                    lastIndex = j + 1;
                    closed = true;
                    j = lastIndex;
                    break;
                }

                nextValue = aude.getNextValue(s, j, len, map);

                if (j === nextValue.lastIndex) {
                    throw new Error(_("Value is malformed."));
                }

                j = nextValue.lastIndex;

                if (s[j] === ":") {
                    if (set instanceof Set) {
                        if (set.card() === 0) {
                            set = {};
                        } else {
                            throw new Error(_("Value is malformed."));
                        }
                    }
                    ++j;

                    key = nextValue.value;
                    nextValue = aude.getNextValue(s, j, len, map);
                    set[key] = nextValue.value;
                } else if (set instanceof Set) {
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
                value:set,
                lastIndex:lastIndex
            };
        }

        if (s[j] === "(" || s[j] === "[") {
            end = s[j] === "(" ? ")" : "]";
            var tuple = (end === ")") ? new pkg.Tuple() : [];
            ++j;
            closed = false;
            while (j < len) {
                while (j < len && (!s[j].trim() || s[j] === ",")) {
                    ++j;
                }

                if (s[j] === end) {
                    lastIndex = j + 1;
                    j = lastIndex;
                    closed = true;
                    break;
                }

                nextValue = aude.getNextValue(s, j, len, map);

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
                value:tuple,
                lastIndex:lastIndex
            };
        }

        while (j < len && s[j].trim() && ":(,})]".indexOf(s[j]) === -1) {
            ++j;
        }

        var valName = s.substring(j0,j).trim();

        if (s[j] === "(") {
            var values = [];

            if (/^[a-zA-Z]+$/.test(valName)) {
                if (typeof that[valName] !== "function") {
                    throw new Error(_("Constructor name in value refers to unkown class."));
                }
                ++j;
                while (j < len && s[j] !== ")") {
                    nextValue = aude.getNextValue(s,j,len, map);
                    j = nextValue.lastIndex;
                    values.push(nextValue.value);
                }
            }

            if (valName === "Date") {
                return {
                    value : new Date(values[0] || null),
                    lastIndex: j + 1
                };
            }

            if (valName === "Object") {
                return {
                    value : values[0] || null, // FIXME check correction
                    lastIndex: j + 1
                };
            }

            var F = function (){return;};

            F.prototype = that[valName].prototype;
            var v = new F();
            that[valName].apply(v, values);

            return {
                value:v,
                lastIndex:j + 1
            };
        }

        switch (valName) {
        case "true":
            return {
                value:true,
                lastIndex:j
            };
        case "false":
            return {
                value:false,
                lastIndex:j
            };
        case "null":
            return {
                value:null,
                lastIndex:j
            };
        case "undefined":
            return {
                value:undefined,
                lastIndex:j
            };
        case "NaN":
            return {
                value:NaN,
                lastIndex:j
            };
        case "Infinity":
        case "+Infinity":
            return {
                value:Infinity,
                lastIndex:j
            };
        case "-Infinity":
            return {
                value:-Infinity,
                lastIndex:j
            };
        default:
            var d = parseFloat(valName);
            if (d.toString() === valName) {
                return {
                    value:d,
                    lastIndex:j
                };
            }
        }

        return {
            value:typeof map === "object" && map.hasOwnProperty(valName) ? map[valName] : valName,
            lastIndex:j
        };
    },

    getValue: function (s, map) {
        s = s.trim();
        var len = s.length,
                nextValue = aude.getNextValue(s, 0, len, map);
        if (nextValue.lastIndex === len) {
            return nextValue.value;
        }
        throw new Error(_("Value is malformed."));
    },

    toArray: function (l) {
        if (l instanceof Set || l instanceof Tuple) {
            return l.getList();
        } else if (l instanceof Array) {
            return l;
        }

        throw new Error(_("Cannot make an array from arbitrary type"));
    },

    inter : audescript.inter,
    union : audescript.union,
    unionInPlace : audescript.unionInPlace,
    minus : audescript.minus,
    minusInPlace : audescript.minusInPlace,
    toSet : Set.prototype.toSet
};
