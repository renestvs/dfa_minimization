/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2015, Raphaël JAKSE.
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

define(function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var qString = exports.qString = {
    token : "string", // single line
    regex : "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
};

var qqString = exports.qqString = {
    token : "string", // single line
    regex : '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
};

var tString = exports.tString = {
    token : "string", // backtick string
    regex : "[`](?:(?:\\\\.)|(?:[^'\\\\]))*?[`]"
};

var constantNumericHex = exports.constantNumericHex = {
    token : "constant.numeric", // hex
    regex : "0[xX][0-9a-fA-F](?:[0-9a-fA-F]|_(?=[0-9a-fA-F]))*\\b"
};

var constantNumericFloat = exports.constantNumericFloat = {
    token : "constant.numeric", // float
    regex : "[+-]?\\d(?:\\d|_(?=\\d))*(?:(?:\\.\\d(?:\\d|_(?=\\d))*)?(?:[eE][+-]?\\d+)?)?\\b"
};

var AudescriptHighlightRules = function() {

    var builtinFunctions = (
        ""
    );

    var keywords = (
        "and|begin|break|case|do|else|end|as|for|if|fi|of|in|not|or|then|unless|" +
        "until|when|yield|while|od|done|continue|try|catch|except|finally|switch|" +
        "case|to|down|downto|upto|up|new|return|delete|throw|raise|typeof|default|" +
        "from|import|export|instanceof|repeat|times|end|void|class|declare|module|" +
        "static|interface|implements|constructor|public|private|string|number|" +
        "boolean|any|extends|super|enum|import|super|package|protected|static|yield|" +
        "let|var|const|function|procedure|union|inter|minus|symdiff|loop|foreach|" +
        "belongs|belong|does|contains|contain|is|empty|cross"
    );

    var buildinConstants = (
        "Infinity|NaN|false|null|nil|true|undefined|this"
    );

    var builtinVariables = (
        ""
    );

    var keywordMapper = this.$keywords = this.createKeywordMapper({
        "keyword": keywords,
        "constant.language": buildinConstants,
        "variable.language": builtinVariables,
        "support.function": builtinFunctions,
        "invalid.deprecated": "debugger"
    }, "identifier");


    this.$rules = {
        "start" : [
            {
                token : "comment",
                regex : "#.*$",
            }, {
                token : "comment",
                regex : "//.*$",
            },

            [{
                regex: "[{}]", onMatch: function(val, state, stack) {
                    this.next = val == "{" ? this.nextState : "";
                    if (val == "{" && stack.length) {
                        stack.unshift("start", state);
                        return "paren.lparen";
                    }
                    if (val == "}" && stack.length) {
                        stack.shift();
                        this.next = stack.shift();
                        if (this.next.indexOf("string") != -1)
                            return "paren.end";
                    }
                    return val == "{" ? "paren.lparen" : "paren.rparen";
                },
                nextState: "start"
            }, {
                token : "string.start",
                regex : /"/,
                push  : [{
                    token : "constant.language.escape",
                    regex : /\\(?:[nsrtvfbae'"\\]|c.|C-.|M-.(?:\\C-.)?|[0-7]{3}|x[\da-fA-F]{2}|u[\da-fA-F]{4})/
                }, {
                    token : "paren.start",
                    regex : /\#{/,
                    push  : "start"
                }, {
                    token : "string.end",
                    regex : /"/,
                    next  : "pop"
                }, {
                    defaultToken: "string"
                }]
            }, {
                token : "string.start",
                regex : /`/,
                push  : [{
                    token : "constant.language.escape",
                    regex : /\\(?:[nsrtvfbae'"\\]|c.|C-.|M-.(?:\\C-.)?|[0-7]{3}|x[\da-fA-F]{2}|u[\da-fA-F]{4})/
                }, {
                    token : "paren.start",
                    regex : /\#{/,
                    push  : "start"
                }, {
                    token : "string.end",
                    regex : /`/,
                    next  : "pop"
                }, {
                    defaultToken: "string"
                }]
            }, {
                token : "string.start",
                regex : /'/,
                push  : [{
                    token : "constant.language.escape",
                    regex : /\\['\\]/
                },  {
                    token : "string.end",
                    regex : /'/,
                    next  : "pop"
                }, {
                    defaultToken: "string"
                }]
            }],
            // TODO: add support for %[QqxWwrs][{[(]

            {
                token : "text", // namespaces aren't symbols
                regex : "::"
            }, {
                token : "variable.instance", // instance variable
                regex : "@{1,2}[a-zA-Z_\\d]+"
            },

            constantNumericHex,
            constantNumericFloat,

            {
                token : "constant.language.boolean",
                regex : "(?:true|false)\\b"
            }, {
                token : keywordMapper,
                // TODO: Unicode escape sequences
                // TODO: Unicode identifiers
                regex : "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
            }, {
                token : "punctuation.separator.key-value",
                regex : "=>"
            }, {
               token : "string.character",
               regex : "\\B\\?."
            }, {
                token : "keyword.operator",
                regex : "!|\\$|%|&|\\*|\\-\\-|\\-|\\+\\+|\\+|~|=|:=|!=|/=|<=|>=|<<=|>>=|>>>=|<>|<|>|!|or|and|contain|is|contains|belongs|belong|does|not|minus|cross|inter|U=|\\||\\?\\:|\\*=|%=|\\+=|\\-=|&=|\\^=|\\b(?:in|instanceof|new|delete|typeof|void)"
            }, {
                token : "paren.lparen",
                regex : "[[({]"
            }, {
                token : "paren.rparen",
                regex : "[\\])}]"
            }, {
                token : "text",
                regex : "\\s+"
            }
        ],
        "comment" : [
            {
                token : "comment", // comment spanning whole line
                regex : ".+"
            }
        ]
    };

    this.normalizeRules();
};

oop.inherits(AudescriptHighlightRules, TextHighlightRules);

exports.AudescriptHighlightRules = AudescriptHighlightRules;
});
