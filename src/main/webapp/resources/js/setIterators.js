if (typeof Symbol === "undefined") {
    try {
        eval("\
            Set.prototype.iterator =  function () {\
                for (var i in this.l) {\
                    yield this.l[i];\
                }\
            };\
            Tuple.prototype.iterator =  function () {\
                for (var i = 0; i < this.length; i++) {\
                    yield this[i];\
                }\
            };\
        ");
    } catch (e) {}
}

(function () {
    var iteratorCode = "\
        (function () {\
            var symbol;\
            try { symbol = Symbol.iterator; }\
            catch (e) { symbol = '@@iterator'; }\
            Set.prototype[symbol] = function*() {\
                for (var i in this.l) {\
                    if (this.l.hasOwnProperty(i)) {\
                        yield this.l[i];\
                    }\
                }\
            };\
            Tuple.prototype[symbol] = function*() {\
                for (var i = 0; i < this.length; i++) {\
                    yield this[i];\
                }\
            };\
        })();\
    ";

    try {
        eval(iteratorCode);
    } catch (e) {
        iteratorCode = babel.transform(iteratorCode).code;
        try {
            eval(
                iteratorCode
            );
        } catch (e) {
            console.error(e);
        }
    }
})();
