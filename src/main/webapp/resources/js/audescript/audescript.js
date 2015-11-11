(function(that) {/// <reference path="./typings/tsd.d.ts" />
/*
    Copyright (C) 2015 JAKSE Raphaël

    The JavaScript code in this page is free software: you can
    redistribute it and/or modify it under the terms of the GNU
    General Public License (GNU GPL) as published by the Free Software
    Foundation, either version 3 of the License, or (at your option)
    any later version.  The code is distributed WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS
    FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.

    As additional permission under GNU GPL version 3 section 7, you
    may distribute non-source (e.g., minimized or compacted) forms of
    that code without the copy of the GNU GPL normally required by
    section 4, provided you include this license notice and a URL
    through which recipients can access the Corresponding Source.
*/
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var SourceMap = require("source-map");
var SourceNode = SourceMap.SourceNode;
function format(message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return message.replace(/{(\d+)}/g, function (match, i) {
        return (i in args ? args[i] : match);
    });
}
;
var _ = typeof libD === "undefined" ? function (message) {
    return message;
} : libD.l10n();
var AudescriptASTStatement = (function () {
    function AudescriptASTStatement(beginState) {
        this.lexerStateBegin = beginState;
        //         this.lexerStateEnd   = beginState.lexer.getState();
        this.whiteBefore = "";
        this.whiteAfter = "";
    }
    AudescriptASTStatement.commentToJS = function (s) {
        return s.replace(/#([^\n]*)/g, "//$1");
    };
    AudescriptASTStatement.needParentheses = function (ast, parent) {
        if (ast instanceof AudescriptASTTernary) {
            if (parent && parent.op[parent.op.length - 1] === "=" && parent.op !== "=" && parent.op !== "/=" && parent.op !== "!=") {
                return false;
            }
            else {
                return true;
            }
        }
        if (ast instanceof AudescriptASTBracketParenBrace) {
            return false;
        }
        if (ast instanceof AudescriptASTInfixedOp) {
            if (ast.op === "." || AudescriptASTInfixedOp.operatorsToJS[ast.op] instanceof Function) {
                return false;
            }
            if (parent) {
                return false;
            }
            return true;
        }
        return false;
    };
    AudescriptASTStatement.newIdentifier = function (usedIdentifiers, base) {
        if (base === void 0) { base = "i"; }
        if (usedIdentifiers.indexOf(base) === -1) {
            return base;
        }
        var i = 0;
        var newId;
        do {
            newId = base + (i++);
        } while (usedIdentifiers.indexOf(newId) !== -1);
        return newId;
    };
    AudescriptASTStatement.getIdentifier = function (expr) {
        if (expr instanceof AudescriptASTIdentifier) {
            return expr.identifier;
        }
        if (expr instanceof AudescriptASTParen) {
            if (expr.expressions.length === 1) {
                return AudescriptASTStatement.getIdentifier(expr.expressions[0]);
            }
        }
        return null;
    };
    AudescriptASTStatement.opStrongerThan = function (op1, op2) {
        var foundOp1 = false;
        var foundOp2 = false;
        for (var _i = 0, _a = AudescriptASTStatement.opOrder; _i < _a.length; _i++) {
            var opList = _a[_i];
            foundOp1 = foundOp1 || (opList.indexOf(op1) !== -1);
            foundOp2 = foundOp2 || (opList.indexOf(op2) !== -1);
            if (foundOp2 && !foundOp1) {
                return false;
            }
            if (foundOp1) {
                return true;
            }
        }
        throw new Error(format(_("BUG: unexpected operator {0}"), "'" + op1 + "'"));
    };
    AudescriptASTStatement.op = function (o, left, right) {
        var ast;
        if (left) {
            if (right) {
                ast = new AudescriptASTInfixedOp(o.state, left, o.op, right);
            }
            else {
                ast = new AudescriptASTSuffixedOp(o.state, left, o.op);
            }
        }
        else if (right) {
            ast = new AudescriptASTPrefixedOp(o.state, right, o.op);
        }
        else {
            throw Error(format(_("BUG : operation {0} without expressions"), "'" + o.op + "'"));
        }
        ast.prependWhite(o.whiteBefore);
        return ast;
    };
    AudescriptASTStatement.expressionListToAST = function (whiteBefore, expressionList, whiteAfter) {
        if (expressionList.length === 1) {
            var expr = expressionList[0];
            if (expr instanceof AudescriptASTExpression) {
                expr.prependWhite(whiteBefore);
                expr.appendWhite(whiteAfter);
                return expr;
            }
            throw new Error("BUG: Unexpected remaining operator in expression list");
        }
        var i = 0;
        while (i < expressionList.length) {
            if (expressionList[i] instanceof AudescriptASTExpressionListOp) {
                var op = expressionList[i];
                var j = i - 1;
                while (j >= 0) {
                    if ((expressionList[j] instanceof AudescriptASTExpressionListOp)) {
                        if (AudescriptASTStatement.opStrongerThan(op.op, expressionList[j].op)) {
                            j++;
                            break;
                        }
                    }
                    j--;
                }
                j = Math.max(j, 0);
                var k = i + 1;
                while (k < expressionList.length) {
                    if ((expressionList[k] instanceof AudescriptASTExpressionListOp)) {
                        if (AudescriptASTStatement.opStrongerThan(op.op, expressionList[k].op)) {
                            k--;
                            break;
                        }
                    }
                    k++;
                }
                k = Math.min(k, expressionList.length - 1);
                return AudescriptASTStatement.expressionListToAST(whiteBefore, expressionList.slice(0, j).concat([
                    AudescriptASTStatement.op(op, AudescriptASTStatement.expressionListToAST("", expressionList.slice(j, i), ""), AudescriptASTStatement.expressionListToAST("", expressionList.slice(i + 1, k + 1), ""))
                ]).concat(expressionList.slice(k + 1)), whiteAfter);
            }
            i++;
        }
        return null;
    };
    AudescriptASTStatement.staticEvalNum = function (ast) {
        // TODO this function rejects valid static expressions.
        // May handle more cases.
        var sen = AudescriptASTStatement.staticEvalNum;
        if (ast instanceof AudescriptASTParen) {
            if (ast.expressions.length === 1) {
                return sen(ast.expressions[0]);
            }
            return NaN;
        }
        if (ast instanceof AudescriptASTNumber) {
            return parseFloat(ast.strNumber);
        }
        if (ast instanceof AudescriptASTPrefixedOp) {
            switch (ast.op) {
                case "~":
                    return sen(ast.expr);
                default:
                    return NaN;
            }
        }
        if (ast instanceof AudescriptASTInfixedOp) {
            switch (ast.op) {
                case "mod":
                    return sen(ast.left) % sen(ast.right);
                case "/":
                    return sen(ast.left) / sen(ast.right);
                case "*":
                    return sen(ast.left) * sen(ast.right);
                case "+":
                    return sen(ast.left) + sen(ast.right);
                case "-":
                    return sen(ast.left) - sen(ast.right);
                case ">>>":
                    return sen(ast.left) >>> sen(ast.right);
                case "<<":
                    return sen(ast.left) << sen(ast.right);
                case ">>":
                    return sen(ast.left) >> sen(ast.right);
                default:
                    return NaN;
            }
        }
        return NaN;
    };
    AudescriptASTStatement.fastAndConst = function (ast) {
        var fac = AudescriptASTStatement.fastAndConst;
        if (ast instanceof AudescriptASTBracketParenBrace) {
            if (ast.expressions.length !== 1 || !(ast instanceof AudescriptASTParen)) {
                return false;
            }
            return fac(ast.expressions[0]);
        }
        if (ast instanceof AudescriptASTTernary) {
            return false;
        }
        if (ast instanceof AudescriptASTNumber ||
            ast instanceof AudescriptASTString ||
            ast instanceof AudescriptASTRegexp ||
            ast instanceof AudescriptASTChar ||
            ast instanceof AudescriptASTBool) {
            return true;
        }
        if (ast instanceof AudescriptASTIdentifier) {
            return true; // WARNING: only if the identifier is not modified in the body of the loop
        }
        if (ast instanceof AudescriptASTFunction) {
            return false;
        }
        if (ast instanceof AudescriptASTInfixedOp) {
            return false;
        }
        console.error("ast", ast);
        throw new Error("BUG: Unexpected ast expression element");
    };
    AudescriptASTStatement.getNeededModules = function (ast) {
        var getNeededModules = AudescriptASTStatement.getNeededModules;
        if (ast instanceof AudescriptASTRoot) {
            return getNeededModules(ast.root);
        }
        if (ast instanceof AudescriptASTBracketParenBrace) {
            var res = [];
            if (ast.values) {
                for (var _i = 0, _a = ast.values; _i < _a.length; _i++) {
                    var expr = _a[_i];
                    res = res.concat(getNeededModules(expr));
                }
            }
            else {
                for (var _b = 0, _c = ast.expressions; _b < _c.length; _b++) {
                    var expr = _c[_b];
                    res = res.concat(getNeededModules(expr));
                }
            }
            return res;
        }
        if (ast instanceof AudescriptASTReturnThrow) {
            return ast.expr ? getNeededModules(ast.expr) : [];
        }
        if (ast instanceof AudescriptASTDecl) {
            return getNeededModules(ast.expr);
        }
        if (ast instanceof AudescriptASTTernary) {
            return getNeededModules(ast.expr).concat(getNeededModules(ast.blockIf)).concat(getNeededModules(ast.blockElse));
        }
        if (ast instanceof AudescriptASTIf) {
            var res_1 = getNeededModules(ast.expr).concat(getNeededModules(ast.blockIf));
            if (ast.blockElse) {
                res_1 = res_1.concat(getNeededModules(ast.blockElse));
            }
            ;
            return res_1;
        }
        if (ast instanceof AudescriptASTExport) {
            return getNeededModules(ast.exported);
        }
        if (ast instanceof AudescriptASTBreak ||
            ast instanceof AudescriptASTNumber ||
            ast instanceof AudescriptASTString ||
            ast instanceof AudescriptASTRegexp ||
            ast instanceof AudescriptASTChar ||
            ast instanceof AudescriptASTBool ||
            ast instanceof AudescriptASTIdentifier ||
            ast instanceof AudescriptASTNullStatement) {
            return [];
        }
        if (ast instanceof AudescriptASTForeach) {
            return getNeededModules(ast.expr).concat(getNeededModules(ast.iterated)).concat(getNeededModules(ast.block));
        }
        if (ast instanceof AudescriptASTFor) {
            return (getNeededModules(ast.identifier)
                .concat(getNeededModules(ast.begin))
                .concat(getNeededModules(ast.end))
                .concat(getNeededModules(ast.step))
                .concat(getNeededModules(ast.block)));
        }
        if (ast instanceof AudescriptASTWhile ||
            ast instanceof AudescriptASTDoWhile ||
            ast instanceof AudescriptASTRepeatTimes) {
            return getNeededModules(ast.expr).concat(getNeededModules(ast.block));
        }
        if (ast instanceof AudescriptASTRepeatForever) {
            return getNeededModules(ast.block);
        }
        if (ast instanceof AudescriptASTFunction) {
            return getNeededModules(ast.block);
        }
        if (ast instanceof AudescriptASTComposition || ast instanceof AudescriptASTInfixedOp) {
            return getNeededModules(ast.left).concat(getNeededModules(ast.right));
        }
        if (ast instanceof AudescriptASTPrefixedOp || ast instanceof AudescriptASTSuffixedOp) {
            return getNeededModules(ast.expr);
        }
        if (ast instanceof AudescriptASTTry) {
            var res_2 = getNeededModules(ast.blockTry);
            if (ast.blockCatch) {
                res_2 = res_2.concat(getNeededModules(ast.blockCatch));
            }
            if (ast.blockFinally) {
                res_2 = res_2.concat(getNeededModules(ast.blockFinally));
            }
            return res_2;
        }
        if (ast instanceof AudescriptASTFromImport) {
            return [ast.getModuleName()];
        }
        console.error("ast", ast);
        throw new Error(_("BUG:Unexpected AST element"));
    };
    AudescriptASTStatement.getUsedIdentifiers = function (ast) {
        // WARNING not accurate, but sufficient for generating unused identifiers (over estimates used identifiers)
        var getUsed = AudescriptASTStatement.getUsedIdentifiers;
        if (ast instanceof AudescriptASTRoot) {
            return getUsed(ast.root);
        }
        if (ast instanceof AudescriptASTBracketParenBrace) {
            var res = [];
            if (ast.values) {
                for (var _i = 0, _a = ast.values; _i < _a.length; _i++) {
                    var expr = _a[_i];
                    res = res.concat(getUsed(expr));
                }
            }
            else {
                for (var _b = 0, _c = ast.expressions; _b < _c.length; _b++) {
                    var expr = _c[_b];
                    res = res.concat(getUsed(expr));
                }
            }
            return res;
        }
        if (ast instanceof AudescriptASTReturnThrow) {
            return ast.expr ? getUsed(ast.expr) : [];
        }
        if (ast instanceof AudescriptASTDecl) {
            return getUsed(ast.declared).concat(getUsed(ast.expr));
        }
        if (ast instanceof AudescriptASTTernary) {
            return getUsed(ast.expr).concat(getUsed(ast.blockIf)).concat(getUsed(ast.blockElse));
        }
        if (ast instanceof AudescriptASTIf) {
            var res_3 = getUsed(ast.expr).concat(getUsed(ast.blockIf));
            if (ast.blockElse) {
                res_3 = res_3.concat(getUsed(ast.blockElse));
            }
            ;
            return res_3;
        }
        if (ast instanceof AudescriptASTExport) {
            return getUsed(ast.exported);
        }
        if (ast instanceof AudescriptASTBreak ||
            ast instanceof AudescriptASTNumber ||
            ast instanceof AudescriptASTString ||
            ast instanceof AudescriptASTRegexp ||
            ast instanceof AudescriptASTChar ||
            ast instanceof AudescriptASTBool ||
            ast instanceof AudescriptASTNullStatement) {
            return [];
        }
        if (ast instanceof AudescriptASTIdentifier) {
            return [ast.identifier];
        }
        if (ast instanceof AudescriptASTForeach) {
            return getUsed(ast.expr).concat(getUsed(ast.iterated)).concat(getUsed(ast.block));
        }
        if (ast instanceof AudescriptASTFor) {
            return (getUsed(ast.identifier)
                .concat(getUsed(ast.begin))
                .concat(getUsed(ast.end))
                .concat(getUsed(ast.step))
                .concat(getUsed(ast.block)));
        }
        if (ast instanceof AudescriptASTWhile ||
            ast instanceof AudescriptASTDoWhile ||
            ast instanceof AudescriptASTRepeatTimes) {
            return getUsed(ast.expr).concat(getUsed(ast.block));
        }
        if (ast instanceof AudescriptASTRepeatForever) {
            return getUsed(ast.block);
        }
        if (ast instanceof AudescriptASTFunction) {
            var res_4 = ast.funName ? getUsed(ast.funName) : [];
            return (res_4
                .concat(getUsed(ast.params))
                .concat(getUsed(ast.block)));
        }
        if (ast instanceof AudescriptASTComposition || ast instanceof AudescriptASTInfixedOp) {
            return getUsed(ast.left).concat(getUsed(ast.right));
        }
        if (ast instanceof AudescriptASTPrefixedOp || ast instanceof AudescriptASTSuffixedOp) {
            return getUsed(ast.expr);
        }
        if (ast instanceof AudescriptASTTry) {
            var res_5 = getUsed(ast.blockTry);
            if (ast.blockCatch) {
                res_5 = res_5.concat(getUsed(ast.blockCatch));
            }
            if (ast.blockFinally) {
                res_5 = res_5.concat(getUsed(ast.blockFinally));
            }
            if (ast.exc) {
                res_5 = res_5.concat(getUsed(ast.exc));
            }
            return res_5;
        }
        if (ast instanceof AudescriptASTFromImport) {
            var res_6 = [];
            for (var _d = 0, _e = ast.importList; _d < _e.length; _d++) {
                var imp = _e[_d];
                res_6.push(imp[1].identifier);
            }
            return res_6;
        }
        console.error("ast", ast);
        throw new Error(_("BUG:Unexpected AST element"));
    };
    AudescriptASTStatement.needsSemicolon = function (ast) {
        if (ast instanceof AudescriptASTIf ||
            ast instanceof AudescriptASTNullStatement ||
            ast instanceof AudescriptASTForeach ||
            ast instanceof AudescriptASTWhile ||
            ast instanceof AudescriptASTFor ||
            ast instanceof AudescriptASTTry ||
            ast instanceof AudescriptASTRepeatTimes ||
            ast instanceof AudescriptASTRepeatForever) {
            return false;
        }
        if (ast instanceof AudescriptASTFunction) {
            if (ast.funName) {
                return false;
            }
        }
        if (ast instanceof AudescriptASTComposition) {
            return AudescriptASTStatement.needsSemicolon(ast.right);
        }
        return true;
    };
    AudescriptASTStatement.checkNotInfixedOpNotAssignement = function (ast) {
        if (ast instanceof AudescriptASTInfixedOp && ast.op !== "call" && (ast.op[ast.op.length - 1] !== "=" || ast.op === "=" || ast.op === "!=")) {
            if (ast.op === "=") {
                ast.lexerStateBegin.parseError(format(_("Expecting a statement, not an expression (operator {0}). Maybe you meant ':='?"), "'" + ast.op + "'"));
            }
            ast.lexerStateBegin.parseError(format(_("Expecting a statement, not an expression (operator {0})"), "'" + ast.op + "'"));
        }
    };
    AudescriptASTStatement.prototype.sourceNode = function (arr) {
        var whiteBefore = [this.whiteBefore];
        var whiteAfter = [this.whiteAfter];
        return new SourceNode(this.lexerStateBegin.line, this.lexerStateBegin.column, this.lexerStateBegin.source, whiteBefore.concat(arr).concat(whiteAfter));
    };
    AudescriptASTStatement.prototype.prependWhite = function (str) {
        this.whiteBefore = AudescriptASTStatement.commentToJS(str) + this.whiteBefore;
    };
    AudescriptASTStatement.prototype.appendWhite = function (str) {
        this.whiteAfter += AudescriptASTStatement.commentToJS(str);
    };
    AudescriptASTStatement.prototype.toJS = function () {
        throw Error(_("Not implemented"));
    };
    AudescriptASTStatement.prototype.setAudescriptVar = function (v) {
        throw Error(_("Not implemented"));
    };
    AudescriptASTStatement.opOrder = [
        ["."],
        ["index"],
        ["call"],
        ["not", "~"],
        ["++", "--"],
        ["new"],
        ["instanceof", "typeof"],
        ["/", "*"],
        ["mod"],
        ["+", "-"],
        [">>>", "<<", ">>"],
        ["cross"],
        ["union", "inter", "\\"],
        ["symdiff"],
        ["does not contain", "contains", "does not belong to", "belongs to", "not subset of", "subset of", "not in", "in"],
        ["<", "<=", ">=", ">", "=", "is not", "is", "!="],
        ["and"],
        ["or"],
        [">>>=", "+=", "-=", ":=", "&=", "|=", "*=", "%=", "^="]
    ];
    return AudescriptASTStatement;
})();
var AudescriptASTRoot = (function (_super) {
    __extends(AudescriptASTRoot, _super);
    function AudescriptASTRoot(lexer, root) {
        _super.call(this, lexer);
        this.root = root;
    }
    AudescriptASTRoot.prototype.toJS = function () {
        var identifiers = AudescriptASTStatement.getUsedIdentifiers(this.root);
        var newId = AudescriptASTStatement.newIdentifier(identifiers, "_");
        identifiers.push(newId);
        var exp = AudescriptASTStatement.newIdentifier(identifiers, "e");
        this.setAudescriptVar([newId, exp]);
        return this.sourceNode(['return (function (' + newId + ') {"use strict"; let ' + exp + " = " + newId + '.m("' + this.lexerStateBegin.moduleName + '", true); ', this.root.toJS(), '\n}(require("audescript-runtime")));']);
    };
    AudescriptASTRoot.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.root.setAudescriptVar(v);
    };
    return AudescriptASTRoot;
})(AudescriptASTStatement);
var AudescriptASTFromImport = (function (_super) {
    __extends(AudescriptASTFromImport, _super);
    function AudescriptASTFromImport(lexer, moduleName, importList) {
        _super.call(this, lexer);
        this.initialWhite = "";
        this.importList = importList;
        this.importListWhite = [];
        this.moduleName = moduleName;
        this.whiteBeforeModuleName = moduleName.whiteBefore;
        this.whiteAfterModuleName = moduleName.whiteAfter;
        moduleName.whiteBefore = "";
        moduleName.whiteAfter = "";
        for (var _i = 0, _a = this.importList; _i < _a.length; _i++) {
            var imp = _a[_i];
            var w0 = imp[0].whiteBefore || "";
            var w1 = imp[0].whiteAfter || "";
            imp[0].whiteBefore = "";
            imp[0].whiteAfter = "";
            var w2 = void 0;
            var w3 = void 0;
            if (imp[0] === imp[1]) {
                w2 = " ";
                w3 = "";
            }
            else {
                w2 = imp[1].whiteBefore || "";
                w3 = imp[1].whiteAfter || "";
                imp[1].whiteBefore = "";
                imp[1].whiteAfter = "";
            }
            this.importListWhite.push([w0, w1, w2, w3]);
        }
    }
    AudescriptASTFromImport.prototype.getModuleName = function () {
        var res = this.moduleName.toJS().toStringWithSourceMap().code.trim();
        if (res[0] === "'" || res[0] === '"') {
            return res.substring(1, res.length - 1);
        }
        return res;
    };
    AudescriptASTFromImport.prototype.toJS = function () {
        var res = ["let" + this.initialWhite + "{"];
        var comma = "";
        for (var i = 0; i < this.importList.length; i++) {
            var imp = this.importList[i];
            var impW = this.importListWhite[i];
            res = res.concat([
                comma + (impW[0] === " " ? "" : impW[0]),
                imp[1].toJS(),
                ":" + impW[2] + impW[1],
                imp[0].toJS()
            ]);
            comma = "," + impW[3];
        }
        var ma, mb;
        if (this.moduleName instanceof AudescriptASTIdentifier) {
            mb = '.m("';
            ma = '")';
        }
        else {
            mb = ".m(";
            ma = ")";
        }
        res = res.concat(["} = ", this.audescriptVar[0] + this.whiteBeforeModuleName + mb, this.moduleName.toJS(), ma + this.importListWhite[this.importListWhite.length - 1][3] + (this.whiteAfterModuleName === " " ? "" : this.whiteAfterModuleName)]);
        return this.sourceNode(res);
    };
    AudescriptASTFromImport.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        for (var _i = 0, _a = this.importList; _i < _a.length; _i++) {
            var imp = _a[_i];
            imp[0].setAudescriptVar(v);
            imp[1].setAudescriptVar(v);
        }
    };
    AudescriptASTFromImport.prototype.setInitialWhite = function (white) {
        this.initialWhite = AudescriptASTStatement.commentToJS(white);
    };
    return AudescriptASTFromImport;
})(AudescriptASTStatement);
var AudescriptASTExpressionListOp = (function () {
    function AudescriptASTExpressionListOp(state, op, white) {
        if (white === void 0) { white = ""; }
        this.state = state;
        this.whiteBefore = white;
        op = op.toLowerCase();
        switch (op) {
            case "u":
                this.op = "union";
                break;
            case "x":
                this.op = "cross";
                break;
            case "/=":
            case "<>":
                this.op = "!=";
                break;
            default: this.op = op;
        }
    }
    return AudescriptASTExpressionListOp;
})();
var AudescriptASTExpression = (function (_super) {
    __extends(AudescriptASTExpression, _super);
    function AudescriptASTExpression() {
        _super.apply(this, arguments);
    }
    return AudescriptASTExpression;
})(AudescriptASTStatement);
var AudescriptASTBracketParenBrace = (function (_super) {
    __extends(AudescriptASTBracketParenBrace, _super);
    function AudescriptASTBracketParenBrace(lexer, expressions, values, innerWhite) {
        _super.call(this, lexer);
        this.values = null;
        this.expressions = expressions;
        this.values = values;
        this.innerWhite = innerWhite;
    }
    AudescriptASTBracketParenBrace.prototype.expressionsToJS = function (assignment) {
        var res = [];
        for (var i = 0; i < this.expressions.length; i++) {
            var expr = this.expressions[i];
            if (this.values) {
                var value = this.values[i];
                res.push((res.length ? "," : ""), expr.toJS(), ",", value instanceof AudescriptASTBracketParenBrace
                    ? value.toJS("", "", assignment)
                    : value.toJS());
            }
            else {
                res.push((res.length ? "," : ""), expr instanceof AudescriptASTBracketParenBrace
                    ? expr.toJS("", "", assignment)
                    : expr.toJS());
            }
        }
        return res;
    };
    AudescriptASTBracketParenBrace.prototype.toJS = function (beginChar, endChar, assignment) {
        if (assignment === void 0) { assignment = false; }
        if (!beginChar || !endChar) {
            throw new Error("BUG: AudescriptASTBracketParenBrace's toJS expects begin and end chars");
        }
        var begin = [beginChar];
        return (this.sourceNode(begin
            .concat(this.expressionsToJS(assignment))
            .concat([this.innerWhite + endChar])));
    };
    AudescriptASTBracketParenBrace.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        for (var _i = 0, _a = this.expressions; _i < _a.length; _i++) {
            var expr = _a[_i];
            expr.setAudescriptVar(v);
        }
        if (this.values) {
            for (var _b = 0, _c = this.values; _b < _c.length; _b++) {
                var expr = _c[_b];
                expr.setAudescriptVar(v);
            }
        }
    };
    return AudescriptASTBracketParenBrace;
})(AudescriptASTExpression);
var AudescriptASTBracket = (function (_super) {
    __extends(AudescriptASTBracket, _super);
    function AudescriptASTBracket(lexer, expressions, innerWhite) {
        _super.call(this, lexer, expressions, null, innerWhite);
    }
    AudescriptASTBracket.prototype.toJS = function (right, left, assignment) {
        if (right === void 0) { right = ""; }
        if (left === void 0) { left = ""; }
        if (assignment === void 0) { assignment = false; }
        return _super.prototype.toJS.call(this, "[", "]", assignment);
    };
    return AudescriptASTBracket;
})(AudescriptASTBracketParenBrace);
var AudescriptASTParen = (function (_super) {
    __extends(AudescriptASTParen, _super);
    function AudescriptASTParen(lexer, tuple, expressions, innerWhite) {
        _super.call(this, lexer, expressions, null, innerWhite);
        this.tuple = tuple;
    }
    AudescriptASTParen.prototype.toJS = function (left, right, assignment) {
        if (left === void 0) { left = ""; }
        if (right === void 0) { right = ""; }
        if (assignment === void 0) { assignment = false; }
        return (this.tuple
            ? _super.prototype.toJS.call(this, this.audescriptVar[0] + ".tuple([", "])")
            : (assignment
                ? _super.prototype.toJS.call(this, "[", "]", true)
                : _super.prototype.toJS.call(this, "(", ")", false)));
    };
    return AudescriptASTParen;
})(AudescriptASTBracketParenBrace);
var AudescriptASTBrace = (function (_super) {
    __extends(AudescriptASTBrace, _super);
    function AudescriptASTBrace(lexer, expressions, values, innerWhite) {
        _super.call(this, lexer, expressions, values, innerWhite);
    }
    AudescriptASTBrace.prototype.toJS = function (right, left, assignment) {
        if (right === void 0) { right = ""; }
        if (left === void 0) { left = ""; }
        if (assignment === void 0) { assignment = false; }
        return (this.values
            ? _super.prototype.toJS.call(this, this.audescriptVar[0] + ".o([", "])", assignment)
            : (assignment
                ? _super.prototype.toJS.call(this, "[", "]", true)
                : _super.prototype.toJS.call(this, this.audescriptVar[0] + ".set([", "])", assignment)));
    };
    return AudescriptASTBrace;
})(AudescriptASTBracketParenBrace);
var AudescriptASTReturnThrow = (function (_super) {
    __extends(AudescriptASTReturnThrow, _super);
    function AudescriptASTReturnThrow(lexer, keyword, expr) {
        _super.call(this, lexer);
        this.initialWhite = "";
        this.expr = expr;
        this.keyword = keyword;
    }
    AudescriptASTReturnThrow.prototype.toJS = function () {
        return this.sourceNode([this.keyword, this.initialWhite, this.expr ? this.expr.toJS() : ""]);
    };
    AudescriptASTReturnThrow.prototype.setInitialWhite = function (w) {
        this.initialWhite += AudescriptASTStatement.commentToJS(w);
    };
    AudescriptASTReturnThrow.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        if (this.expr) {
            this.expr.setAudescriptVar(v);
        }
    };
    return AudescriptASTReturnThrow;
})(AudescriptASTStatement);
var AudescriptASTExport = (function (_super) {
    __extends(AudescriptASTExport, _super);
    function AudescriptASTExport(lexer, exported) {
        _super.call(this, lexer);
        this.exported = exported;
    }
    AudescriptASTExport.prototype.toJS = function () {
        var res;
        if (this.exported instanceof AudescriptASTFunction) {
            if (this.exported.whiteBefore === " ") {
                this.exported.whiteBefore = "";
            }
            var id = this.exported.funName.identifier;
            res = [
                this.exported.toJS() + " " + this.audescriptVar[1] + "." +
                    id + " = " + id
            ];
        }
        else if (this.exported instanceof AudescriptASTIdentifier) {
            res = [
                this.audescriptVar[1] + "." +
                    this.exported.identifier + " =",
                this.exported.toJS()
            ];
        }
        else {
            if (this.exported.whiteBefore === " ") {
                this.exported.whiteBefore = "";
            }
            var declared = this.exported.declared;
            res = [
                this.exported.toJS(), "; " + this.audescriptVar[1] + "." +
                    declared.identifier + " = " + declared.identifier
            ];
        }
        // TODO BUG if the exported variable changes, the export is not updated
        return this.sourceNode(res);
    };
    AudescriptASTExport.prototype.setInitialWhite = function (w) {
        this.exported.prependWhite(w);
    };
    AudescriptASTExport.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.exported.setAudescriptVar(v);
    };
    return AudescriptASTExport;
})(AudescriptASTStatement);
var AudescriptASTDecl = (function (_super) {
    __extends(AudescriptASTDecl, _super);
    function AudescriptASTDecl(lexer, keyword, declared, expr) {
        _super.call(this, lexer);
        this.keyword = keyword;
        this.declared = declared;
        this.expr = expr;
    }
    AudescriptASTDecl.prototype.toJS = function () {
        var declared;
        if (this.declared instanceof AudescriptASTBracketParenBrace) {
            declared = this.declared.toJS("[", "]", true);
        }
        else {
            declared = this.declared.toJS();
        }
        return this.sourceNode([
            this.keyword,
            declared,
            "=",
            this.expr.toJS()
        ]);
    };
    AudescriptASTDecl.prototype.setInitialWhite = function (w) {
        this.declared.prependWhite(w);
    };
    AudescriptASTDecl.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.declared.setAudescriptVar(v);
        this.expr.setAudescriptVar(v);
    };
    return AudescriptASTDecl;
})(AudescriptASTStatement);
var AudescriptASTTernary = (function (_super) {
    __extends(AudescriptASTTernary, _super);
    function AudescriptASTTernary(lexer, expr, blockIf, blockElse) {
        _super.call(this, lexer);
        this.whiteBefore += (expr.whiteAfter === " " ? "" : expr.whiteAfter);
        this.whiteAfterExpr = expr.whiteAfter;
        expr.whiteBefore = expr.whiteAfter = "";
        this.whiteBeforeIf = blockIf.whiteBefore;
        this.whiteAfterIf = blockIf.whiteAfter;
        blockIf.whiteBefore = blockIf.whiteAfter = "";
        this.whiteBeforeElse = blockElse.whiteBefore;
        this.whiteAfter += (blockElse.whiteAfter === " " ? "" : blockElse.whiteAfter);
        blockElse.whiteBefore = blockElse.whiteAfter = "";
        this.expr = expr;
        this.blockIf = blockIf;
        this.blockElse = blockElse;
    }
    AudescriptASTTernary.prototype.toJS = function () {
        var needParen = AudescriptASTStatement.needParentheses(this.expr);
        return this.sourceNode([
            (needParen ? "(" : ""), this.expr.toJS(), (needParen ? ")" : "") +
                (this.whiteAfterExpr || " ") + "?" + (this.whiteBeforeIf || " "), this.blockIf.toJS(), (this.whiteAfterIf || " ") + ":" +
                (this.whiteBeforeElse || " "), this.blockElse.toJS()
        ]);
    };
    AudescriptASTTernary.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.blockIf.setAudescriptVar(v);
        this.blockElse.setAudescriptVar(v);
        this.expr.setAudescriptVar(v);
    };
    return AudescriptASTTernary;
})(AudescriptASTExpression);
var AudescriptASTIf = (function (_super) {
    __extends(AudescriptASTIf, _super);
    function AudescriptASTIf(lexer, unless, expr, blockIf, blockElse) {
        _super.call(this, lexer);
        this.unless = unless;
        this.whiteBeforeExpr = expr.whiteBefore;
        this.whiteAfterExpr = expr.whiteAfter;
        expr.whiteBefore = expr.whiteAfter = "";
        this.expr = expr;
        this.blockIf = blockIf;
        this.blockElse = blockElse;
    }
    AudescriptASTIf.prototype.toJS = function () {
        var expr = (this.unless ? ["!(", this.expr.toJS(), ")"] : [this.expr.toJS()]);
        var res = (["if" + this.whiteBeforeExpr + "("]
            .concat(expr)
            .concat([")" + (this.whiteAfterExpr || " ") + "{", this.blockIf.toJS(), "}"]));
        if (this.blockElse) {
            if (this.blockElse instanceof AudescriptASTIf) {
                res = res.concat([" else", this.blockElse.toJS()]);
            }
            else {
                res = res.concat([" else {", this.blockElse.toJS(), "}"]);
            }
        }
        return this.sourceNode(res);
    };
    AudescriptASTIf.prototype.setInitialWhite = function (white) {
        this.whiteBeforeExpr = this.whiteBeforeExpr + white;
    };
    AudescriptASTIf.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.blockIf.setAudescriptVar(v);
        if (this.blockElse) {
            this.blockElse.setAudescriptVar(v);
        }
        this.expr.setAudescriptVar(v);
    };
    return AudescriptASTIf;
})(AudescriptASTExpression);
var AudescriptASTTry = (function (_super) {
    __extends(AudescriptASTTry, _super);
    function AudescriptASTTry(lexer, blockTry, blockCatch, exc, blockFinally) {
        _super.call(this, lexer);
        if (exc) {
            this.whiteBeforeExc = exc.whiteBefore;
            this.whiteAfterExc = exc.whiteAfter;
            exc.whiteBefore = exc.whiteAfter = "";
        }
        this.blockTry = blockTry;
        this.blockCatch = blockCatch;
        this.blockFinally = blockFinally;
        this.exc = exc;
    }
    AudescriptASTTry.prototype.toJS = function () {
        var s = [
            "try {", this.blockTry.toJS(), "}"
        ];
        if (this.blockCatch) {
            [].push.call(s, " catch" + this.whiteBeforeExc + "(", this.exc.toJS(), ") {" + this.whiteAfterExc, this.blockCatch.toJS(), "}");
        }
        if (this.blockFinally) {
            [].push.call(s, " finally {", this.blockFinally.toJS(), "}");
        }
        return this.sourceNode(s);
    };
    AudescriptASTTry.prototype.setInitialWhite = function (white) {
        this.blockTry.prependWhite(white);
    };
    AudescriptASTTry.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.blockTry.setAudescriptVar(v);
        if (this.blockCatch) {
            this.blockCatch.setAudescriptVar(v);
            this.exc.setAudescriptVar(v);
        }
        if (this.blockFinally) {
            this.blockFinally.setAudescriptVar(v);
        }
    };
    return AudescriptASTTry;
})(AudescriptASTExpression);
var AudescriptASTBreak = (function (_super) {
    __extends(AudescriptASTBreak, _super);
    function AudescriptASTBreak(lexer) {
        _super.call(this, lexer);
    }
    AudescriptASTBreak.prototype.toJS = function () {
        return this.sourceNode(["break"]);
    };
    AudescriptASTBreak.prototype.setInitialWhite = function (w) {
        this.whiteAfter = w + this.whiteAfter;
    };
    AudescriptASTBreak.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
    };
    return AudescriptASTBreak;
})(AudescriptASTStatement);
var AudescriptASTContinue = (function (_super) {
    __extends(AudescriptASTContinue, _super);
    function AudescriptASTContinue(lexer) {
        _super.call(this, lexer);
    }
    AudescriptASTContinue.prototype.toJS = function () {
        return this.sourceNode(["continue"]);
    };
    AudescriptASTContinue.prototype.setInitialWhite = function (w) {
        this.whiteAfter = w + this.whiteAfter;
    };
    AudescriptASTContinue.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
    };
    return AudescriptASTContinue;
})(AudescriptASTStatement);
var AudescriptASTNumber = (function (_super) {
    __extends(AudescriptASTNumber, _super);
    function AudescriptASTNumber(lexer, strNumber) {
        _super.call(this, lexer);
        this.strNumber = strNumber;
    }
    AudescriptASTNumber.prototype.toJS = function () {
        return this.sourceNode([this.strNumber]);
    };
    AudescriptASTNumber.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
    };
    return AudescriptASTNumber;
})(AudescriptASTExpression);
var AudescriptASTString = (function (_super) {
    __extends(AudescriptASTString, _super);
    function AudescriptASTString(lexer, strString) {
        _super.call(this, lexer);
        this.strString = strString;
    }
    AudescriptASTString.prototype.toJS = function () {
        return this.sourceNode([this.strString]);
    };
    AudescriptASTString.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
    };
    return AudescriptASTString;
})(AudescriptASTExpression);
var AudescriptASTRegexp = (function (_super) {
    __extends(AudescriptASTRegexp, _super);
    function AudescriptASTRegexp(lexer, regexp) {
        _super.call(this, lexer);
        this.regexp = regexp;
    }
    AudescriptASTRegexp.prototype.toJS = function () {
        return this.sourceNode([this.regexp]);
    };
    AudescriptASTRegexp.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
    };
    return AudescriptASTRegexp;
})(AudescriptASTExpression);
var AudescriptASTIdentifier = (function (_super) {
    __extends(AudescriptASTIdentifier, _super);
    function AudescriptASTIdentifier(lexer, identifier) {
        _super.call(this, lexer);
        this.identifier = identifier;
    }
    AudescriptASTIdentifier.prototype.toJS = function () {
        return this.sourceNode([this.identifier]);
    };
    AudescriptASTIdentifier.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
    };
    return AudescriptASTIdentifier;
})(AudescriptASTExpression);
var AudescriptASTChar = (function (_super) {
    __extends(AudescriptASTChar, _super);
    function AudescriptASTChar(lexer, strChar) {
        _super.call(this, lexer);
        this.strChar = strChar;
    }
    AudescriptASTChar.prototype.toJS = function () {
        return this.sourceNode([this.strChar]);
    };
    AudescriptASTChar.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
    };
    return AudescriptASTChar;
})(AudescriptASTExpression);
var AudescriptASTBool = (function (_super) {
    __extends(AudescriptASTBool, _super);
    function AudescriptASTBool(lexer, b) {
        _super.call(this, lexer);
        this.b = b;
    }
    AudescriptASTBool.prototype.toJS = function () {
        return this.sourceNode([this.b]);
    };
    AudescriptASTBool.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
    };
    return AudescriptASTBool;
})(AudescriptASTExpression);
var AudescriptASTForeach = (function (_super) {
    __extends(AudescriptASTForeach, _super);
    function AudescriptASTForeach(lexer, expr, iterated, block) {
        _super.call(this, lexer);
        this.whiteAfterExpr = iterated.whiteAfter;
        iterated.whiteAfter = "";
        this.expr = expr;
        this.iterated = iterated;
        this.block = block;
    }
    AudescriptASTForeach.prototype.setInitialWhite = function (white) {
        this.expr.prependWhite(white);
    };
    AudescriptASTForeach.prototype.toJS = function () {
        var expr = ((this.expr instanceof AudescriptASTBracketParenBrace)
            ? this.expr.toJS("", "", true)
            : this.expr.toJS());
        return this.sourceNode([
            "for (let", expr, "of", this.iterated.toJS(), ")" + (this.whiteAfterExpr || " ") + "{",
            this.block.toJS(), "}"
        ]);
    };
    //FIXME destructuration while iterating over Set
    AudescriptASTForeach.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.expr.setAudescriptVar(v);
        this.iterated.setAudescriptVar(v);
        this.block.setAudescriptVar(v);
    };
    return AudescriptASTForeach;
})(AudescriptASTStatement);
var AudescriptASTFor = (function (_super) {
    __extends(AudescriptASTFor, _super);
    function AudescriptASTFor(lexer, identifier, begin, end, step, block) {
        _super.call(this, lexer);
        this.whiteAfterId = identifier.whiteAfter;
        this.whiteBeforeId = identifier.whiteBefore;
        this.whiteAfterBegin = begin.whiteAfter === " " ? "" : begin.whiteAfter;
        this.whiteBeforeEnd = end.whiteBefore;
        this.whiteAfterEnd = end.whiteAfter;
        this.whiteBeforeStep = step.whiteBefore;
        this.whiteAfterStep = step.whiteAfter;
        identifier.whiteBefore = "";
        identifier.whiteAfter = "";
        begin.whiteAfter = "";
        end.whiteBefore = "";
        end.whiteAfter = "";
        step.whiteAfter = "";
        step.whiteBefore = "";
        this.identifier = identifier;
        this.begin = begin;
        this.end = end;
        this.step = step;
        this.block = block;
    }
    AudescriptASTFor.prototype.setInitialWhite = function (white) {
        this.whiteBeforeId = white + this.whiteBeforeId;
    };
    AudescriptASTFor.prototype.toJS = function () {
        var id = this.identifier.toJS();
        var end = this.end.toJS();
        var step = this.step.toJS();
        var fastEnd = AudescriptASTStatement.fastAndConst(this.end) && end.toString().indexOf("\n") === -1;
        var fastStep = AudescriptASTStatement.fastAndConst(this.step) && step.toString().indexOf("\n") === -1;
        var used = null;
        if (!fastEnd || !fastStep) {
            used = AudescriptASTStatement.getUsedIdentifiers(this.block);
            used.push(this.identifier.identifier);
        }
        var genEnd = end;
        var genStep = step;
        if (!fastEnd) {
            genEnd = AudescriptASTStatement.newIdentifier(used, "e");
            used.push(genEnd);
        }
        if (!fastStep) {
            genStep = AudescriptASTStatement.newIdentifier(used, "s");
            used.push(genStep);
        }
        var stepValue = AudescriptASTStatement.staticEvalNum(this.step);
        var stepSign = isNaN(stepValue) ? "?" : (stepValue < 0 ? "-" : "+");
        return this.sourceNode([
            "for (let" + (this.whiteBeforeId || " "), id, (this.whiteAfterId || " ") + "=",
            this.begin.toJS()
        ].concat(fastEnd
            ? [this.whiteAfterBegin]
            : [
                "," + (this.whiteAfterBegin || " ") + genEnd + " =" + (this.whiteBeforeEnd || " "),
                end,
                this.whiteAfterEnd === " " ? "" : this.whiteAfterEnd
            ]).concat(fastStep
            ? []
            : [
                ", " + genStep + " =" + (this.whiteBeforeStep || " "),
                step
            ]).concat([";"]).concat(stepSign === "+"
            ? [(fastEnd ? this.whiteBeforeEnd : ""), id, " <= ", genEnd]
            : (stepSign === "-"
                ? [(fastEnd ? this.whiteBeforeEnd : ""), id, " >= ", genEnd]
                : [
                    " ", genStep, " < 0" + ((fastEnd ? this.whiteBeforeEnd : "") || " ") + "? ",
                    id, " >= ", genEnd, " : ",
                    id, " <= ", genEnd
                ])).concat(["; ",
            id, " +=", (fastStep ? this.whiteBeforeStep : "") || " ", genStep, ")",
            (fastStep ? this.whiteBeforeStep : " ") || " ", (this.whiteAfterStep === " " ? "" : this.whiteAfterStep), "{",
            this.block.toJS(), "}"
        ]));
    };
    AudescriptASTFor.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.identifier.setAudescriptVar(v);
        this.begin.setAudescriptVar(v);
        this.end.setAudescriptVar(v);
        this.step.setAudescriptVar(v);
        this.block.setAudescriptVar(v);
    };
    return AudescriptASTFor;
})(AudescriptASTStatement);
var AudescriptASTWhile = (function (_super) {
    __extends(AudescriptASTWhile, _super);
    function AudescriptASTWhile(lexer, expr, until, block) {
        _super.call(this, lexer);
        this.whiteBeforeExpr = expr.whiteBefore;
        this.whiteAfterExpr = expr.whiteAfter;
        expr.whiteBefore = expr.whiteAfter = "";
        this.until = until;
        this.expr = expr;
        this.block = block;
    }
    AudescriptASTWhile.prototype.setInitialWhite = function (white) {
        this.whiteBeforeExpr = white + this.whiteBeforeExpr;
    };
    AudescriptASTWhile.prototype.toJS = function () {
        return this.sourceNode([
            "while" + this.whiteBeforeExpr + "(" + (this.until ? "!(" : ""), this.expr.toJS(), (this.until ? ")" : "") + ")" + (this.whiteAfterExpr || " ") + "{", this.block.toJS(), "}"
        ]);
    };
    AudescriptASTWhile.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.expr.setAudescriptVar(v);
        this.block.setAudescriptVar(v);
    };
    return AudescriptASTWhile;
})(AudescriptASTStatement);
var AudescriptASTDoWhile = (function (_super) {
    __extends(AudescriptASTDoWhile, _super);
    function AudescriptASTDoWhile(lexer, block, until, expr) {
        _super.call(this, lexer);
        this.block = block;
        this.expr = expr;
        this.until = until;
        this.whiteBeforeExpr = expr.whiteBefore;
        this.whiteAfterExpr = expr.whiteAfter;
        expr.whiteBefore = expr.whiteAfter = "";
    }
    AudescriptASTDoWhile.prototype.setInitialWhite = function (white) {
        this.block.prependWhite(white);
    };
    AudescriptASTDoWhile.prototype.toJS = function () {
        return this.sourceNode([
            "do {", this.block.toJS(), "} while" + this.whiteBeforeExpr + "(", (this.until ? "!(" : "") + this.expr.toJS(), (this.until ? ")" : "") + ")" + (this.whiteAfterExpr === " " ? "" : this.whiteAfterExpr)
        ]);
    };
    AudescriptASTDoWhile.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.expr.setAudescriptVar(v);
        this.block.setAudescriptVar(v);
    };
    return AudescriptASTDoWhile;
})(AudescriptASTStatement);
var AudescriptASTRepeatForever = (function (_super) {
    __extends(AudescriptASTRepeatForever, _super);
    function AudescriptASTRepeatForever(lexer, block) {
        _super.call(this, lexer);
        this.block = block;
    }
    AudescriptASTRepeatForever.prototype.setInitialWhite = function (white) {
        this.initialWhite = AudescriptASTStatement.commentToJS(white);
    };
    AudescriptASTRepeatForever.prototype.toJS = function () {
        return this.sourceNode([
            "while", this.initialWhite, "(true) {", this.block.toJS(), "}"
        ]);
    };
    AudescriptASTRepeatForever.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.block.setAudescriptVar(v);
    };
    return AudescriptASTRepeatForever;
})(AudescriptASTStatement);
var AudescriptASTRepeatTimes = (function (_super) {
    __extends(AudescriptASTRepeatTimes, _super);
    function AudescriptASTRepeatTimes(lexer, expr, block) {
        _super.call(this, lexer);
        this.whiteBeforeExpr = expr.whiteBefore;
        this.whiteAfterExpr = expr.whiteAfter;
        expr.whiteBefore = expr.whiteAfter = "";
        this.block = block;
        this.expr = expr;
    }
    AudescriptASTRepeatTimes.prototype.setInitialWhite = function (white) {
        this.expr.prependWhite(white);
    };
    AudescriptASTRepeatTimes.prototype.toJS = function () {
        var identifiers = AudescriptASTStatement.getUsedIdentifiers(this.block);
        var id1 = AudescriptASTStatement.newIdentifier(identifiers);
        identifiers.push(id1);
        var initN = [""], nExpr = this.expr.toJS();
        if (!AudescriptASTStatement.fastAndConst(this.expr) ||
            AudescriptASTStatement.getIdentifier(this.expr)) {
            var id2 = " " + AudescriptASTStatement.newIdentifier(identifiers);
            initN = [id2 + " =" + this.whiteBeforeExpr, nExpr, ","];
            nExpr = id2;
        }
        var forLet = ["for (let"];
        return this.sourceNode(forLet.concat(initN).concat([
            " " + id1 + " = 0; " + id1 + " <", nExpr, ";" + this.whiteAfterExpr + id1, "++) {",
            this.block.toJS(), "}"
        ]));
    };
    AudescriptASTRepeatTimes.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.expr.setAudescriptVar(v);
        this.block.setAudescriptVar(v);
    };
    return AudescriptASTRepeatTimes;
})(AudescriptASTStatement);
var AudescriptASTFunction = (function (_super) {
    __extends(AudescriptASTFunction, _super);
    function AudescriptASTFunction(lexer, isProcedure, id, params, block) {
        _super.call(this, lexer);
        this.isProcedure = isProcedure;
        this.funName = id;
        this.params = params;
        this.block = block;
    }
    AudescriptASTFunction.prototype.setInitialWhite = function (white) {
        if (this.funName) {
            this.funName.prependWhite(white);
        }
        else {
            this.params.prependWhite(white);
        }
    };
    AudescriptASTFunction.prototype.toJS = function () {
        return this.sourceNode([
            "function" + (this.funName ? this.funName.toJS() : "") +
                this.params.toJS() + " {" + this.block.toJS() + "}"
        ]);
    };
    AudescriptASTFunction.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        if (this.funName) {
            this.funName.setAudescriptVar(v);
        }
        this.params.setAudescriptVar(v);
        this.block.setAudescriptVar(v);
    };
    return AudescriptASTFunction;
})(AudescriptASTExpression);
var AudescriptASTComposition = (function (_super) {
    __extends(AudescriptASTComposition, _super);
    function AudescriptASTComposition(lexer, left, right) {
        _super.call(this, lexer);
        if (!(right instanceof AudescriptASTComposition || right instanceof AudescriptASTNullStatement)) {
            throw Error("BUG: second element of a AST composition node should be an ast composition or null node");
        }
        AudescriptASTStatement.checkNotInfixedOpNotAssignement(left);
        if ((left instanceof AudescriptASTBreak ||
            left instanceof AudescriptASTReturnThrow ||
            left instanceof AudescriptASTContinue) && !(right instanceof AudescriptASTNullStatement)) {
            lexer.parseError(_("Unreachable code after a break or a return statement"));
        }
        this.whiteAfterLeft = left.whiteAfter;
        left.whiteAfter = "";
        this.left = left;
        this.right = right;
    }
    AudescriptASTComposition.prototype.toJS = function () {
        return this.sourceNode([this.left.toJS(), (AudescriptASTStatement.needsSemicolon(this.left) ? ";" : ""), this.whiteAfterLeft, this.right.toJS()]); //TODO check JS's automatic semicolon insertion
    };
    AudescriptASTComposition.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.left.setAudescriptVar(v);
        this.right.setAudescriptVar(v);
    };
    return AudescriptASTComposition;
})(AudescriptASTStatement);
var AudescriptASTInfixedOp = (function (_super) {
    __extends(AudescriptASTInfixedOp, _super);
    function AudescriptASTInfixedOp(lexer, left, op, right) {
        _super.call(this, lexer);
        this.whiteBefore += left.whiteBefore;
        this.whiteAfter += right.whiteAfter;
        left.whiteBefore = right.whiteAfter = "";
        this.left = left;
        this.op = op;
        this.right = right;
    }
    AudescriptASTInfixedOp.prototype.toJS = function () {
        var res;
        var left;
        var right;
        var leftlspace = this.left.whiteBefore;
        var leftrspace = this.left.whiteAfter;
        this.left.whiteBefore = "";
        this.left.whiteAfter = "";
        var rightlspace = this.right.whiteBefore;
        var rightrspace = this.right.whiteAfter;
        this.right.whiteBefore = "";
        this.right.whiteAfter = "";
        if (AudescriptASTInfixedOp.operatorsToJS.hasOwnProperty(this.op)) {
            var op = AudescriptASTInfixedOp.operatorsToJS[this.op];
            if (op instanceof Function) {
                res = op(this.audescriptVar[0], this.left.toJS(), this.right.toJS(), leftlspace, leftrspace, rightlspace, rightrspace);
            }
            else if (typeof op === "string") {
                if (AudescriptASTStatement.needParentheses(this.left, this)) {
                    res = [leftlspace + "(", this.left.toJS(), ")", leftrspace];
                }
                else if (this.left instanceof AudescriptASTBracketParenBrace) {
                    res = [leftlspace, this.left.toJS("", "", false), leftrspace];
                }
                else {
                    res = [leftlspace, this.left.toJS(), leftrspace];
                }
                res.push(op);
                if (AudescriptASTStatement.needParentheses(this.right, this)) {
                    res = res.concat([rightlspace + "(", this.right.toJS(), ")" + rightrspace]);
                }
                else {
                    res.push(rightlspace, this.right.toJS(), rightrspace);
                }
            }
        }
        else {
            if (AudescriptASTStatement.needParentheses(this.left, this)) {
                res = [leftlspace + "(", this.left.toJS(), ")" + leftrspace];
            }
            else {
                res = [leftlspace, this.left.toJS(), leftrspace];
            }
            res.push(this.op);
            if (AudescriptASTStatement.needParentheses(this.right, this)) {
                res = res.concat([rightlspace + "(", this.right.toJS(), ")" + rightrspace]);
            }
            else {
                res.push(rightlspace, this.right.toJS(), rightrspace);
            }
        }
        return this.sourceNode(res);
    };
    AudescriptASTInfixedOp.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.left.setAudescriptVar(v);
        this.right.setAudescriptVar(v);
    };
    AudescriptASTInfixedOp.operatorsToJS = {
        "and": "&&",
        "or": "||",
        "not": "!",
        "is not": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            if (right.toString().trim() === "empty") {
                return [leftlspace, "!" + a + ".e(", left, (leftrspace === " " ? "" : leftrspace) + (rightlspace === " " ? "" : rightlspace) + ")", rightrspace];
            }
            else {
                return [leftlspace, left, leftrspace + "!==" + rightlspace, right, rightrspace];
            }
        },
        "is": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            if (right.toString().trim() === "empty") {
                return [leftlspace, a + ".e(", left, (leftrspace === " " ? "" : leftrspace) + (rightlspace === " " ? "" : rightlspace) + ")", rightrspace];
            }
            else {
                return [leftlspace, left, leftrspace + "===" + rightlspace, right, rightrspace];
            }
        },
        ":=": "=",
        "!=": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return ([
                leftlspace, "!",
                AudescriptASTInfixedOp.operatorsToJS["="](a, left, right, "", leftrspace, rightlspace, ""),
                rightrspace
            ]);
        },
        "/=": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return AudescriptASTInfixedOp.operatorsToJS["!="](a, left, right, leftlspace, leftrspace, rightlspace, rightrspace);
        },
        "<>": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return AudescriptASTInfixedOp.operatorsToJS["!="](a, left, right, leftlspace, leftrspace, rightlspace, rightrspace);
        },
        "=": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".eq(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "U": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".U(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "U=": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".Ui(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "union": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".U(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "inter": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".I(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "cross": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".X(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "symdiff": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".symDiff(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "minus": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".M(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "\\": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".M(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "sym diff": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".sd(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "does not contain": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return ([
                leftlspace, "!",
                AudescriptASTInfixedOp.operatorsToJS["contains"](a, left, right, "", leftrspace, rightlspace, ""),
                rightrspace
            ]);
        },
        "not subset of": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return ([
                leftlspace, "!",
                AudescriptASTInfixedOp.operatorsToJS["subset of"](a, left, right, "", leftrspace, rightlspace, ""),
                rightrspace
            ]);
        },
        "not element of": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return ([
                leftlspace, "!",
                AudescriptASTInfixedOp.operatorsToJS["element of"](a, left, right, "", leftrspace, rightlspace, ""),
                rightrspace
            ]);
        },
        "does not belong to": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return ([
                leftlspace, "!",
                AudescriptASTInfixedOp.operatorsToJS["belongs to"](a, left, right, "", leftrspace, rightlspace, ""),
                rightrspace
            ]);
        },
        "not in": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return ([
                leftlspace, "!",
                AudescriptASTInfixedOp.operatorsToJS["in"](a, left, right, "", leftrspace, rightlspace, ""),
                rightrspace
            ]);
        },
        "contains": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".ct(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "subset of": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".subsetof(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "element of": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".ict(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "belongs to": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".ict(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")" + rightrspace];
        },
        "in": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, a + ".has(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
        },
        "call": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, left, leftrspace, rightlspace, right, rightrspace];
        },
        "index": function (a, left, right, leftlspace, leftrspace, rightlspace, rightrspace) {
            return [leftlspace, left, leftrspace, rightlspace, right, rightrspace];
        }
    };
    return AudescriptASTInfixedOp;
})(AudescriptASTExpression);
var AudescriptASTPrefixedOp = (function (_super) {
    __extends(AudescriptASTPrefixedOp, _super);
    function AudescriptASTPrefixedOp(lexer, expr, op) {
        _super.call(this, lexer);
        this.expr = expr;
        this.op = op;
    }
    AudescriptASTPrefixedOp.prototype.toJS = function () {
        var op = this.op;
        if (op === "not") {
            op = "!";
            if (this.expr.whiteBefore === " ") {
                this.expr.whiteBefore = "";
            }
        }
        return this.sourceNode([op, this.expr.toJS()]);
    };
    AudescriptASTPrefixedOp.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.expr.setAudescriptVar(v);
    };
    return AudescriptASTPrefixedOp;
})(AudescriptASTExpression);
var AudescriptASTSuffixedOp = (function (_super) {
    __extends(AudescriptASTSuffixedOp, _super);
    function AudescriptASTSuffixedOp(lexer, expr, op) {
        _super.call(this, lexer);
        this.expr = expr;
        this.op = op;
    }
    AudescriptASTSuffixedOp.prototype.toJS = function () {
        return this.sourceNode([this.expr.toJS(), this.op]);
    };
    AudescriptASTSuffixedOp.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
        this.expr.setAudescriptVar(v);
    };
    return AudescriptASTSuffixedOp;
})(AudescriptASTExpression);
var AudescriptASTNullStatement = (function (_super) {
    __extends(AudescriptASTNullStatement, _super);
    function AudescriptASTNullStatement(lexer) {
        _super.call(this, lexer);
    }
    AudescriptASTNullStatement.prototype.toJS = function () {
        return this.sourceNode([""]);
    };
    AudescriptASTNullStatement.prototype.setAudescriptVar = function (v) {
        this.audescriptVar = v;
    };
    return AudescriptASTNullStatement;
})(AudescriptASTStatement);
var audescriptParseError = (function () {
    function audescriptParseError(message) {
        this.name = "ParseError";
        this.message = message || "Parse error";
        this.stack = (new Error(message)).stack;
    }
    return audescriptParseError;
})();
audescriptParseError.prototype.toString = Error.prototype.toString;
var audescriptUnexpectedEndParseError = (function (_super) {
    __extends(audescriptUnexpectedEndParseError, _super);
    function audescriptUnexpectedEndParseError(message) {
        _super.call(this, message || _("Unexpected end"));
        this.name = "UnexpectedEndParseError";
    }
    return audescriptUnexpectedEndParseError;
})(audescriptParseError);
function parseUnsignedNumber(lexer) {
    var dotEncountered = false, begin = lexer.curPos();
    if (!lexer.end() && lexer.curChar() === "0") {
        lexer.nextChar();
        if (!lexer.end() && (lexer.curChar().toLowerCase() === "x")) {
            do {
                lexer.nextChar();
            } while ("0123456789ABCDEF_".indexOf(lexer.curChar().toUpperCase()) !== -1);
            return lexer.substringFrom(begin).replace(/_/g, "");
        }
    }
    while (!lexer.end()
        && ("0123456789_".indexOf(lexer.curChar()) !== -1
            || (!dotEncountered && lexer.curChar() === "."))) {
        if (!dotEncountered) {
            dotEncountered = lexer.curChar() === ".";
        }
        lexer.nextChar();
    }
    // TODO: checking if the number is correct (e.g: doesn't end with a dot)
    if (!lexer.end() && (lexer.curChar() === "e" || lexer.curChar() === "E")) {
        lexer.nextChar();
        if (!lexer.end() && (lexer.curChar() === "+" || lexer.curChar() === "-")) {
            lexer.nextChar();
        }
    }
    while (!lexer.end() && "0123456789_".indexOf(lexer.curChar()) !== -1) {
        lexer.nextChar();
    }
    return lexer.substringFrom(begin);
}
function tryNumber(lexer) {
    var sign = "";
    var state = lexer.getState();
    if (!lexer.end() && (lexer.curChar() === "-" || lexer.curChar() === "+")) {
        sign = lexer.nextChar();
    }
    if (!lexer.end() && "0123456789".indexOf(lexer.curChar()) !== -1) {
        return sign + parseUnsignedNumber(lexer).replace(/_/g, "");
    }
    lexer.restoreState(state);
    return "";
}
var AudescriptLexer = (function () {
    //     lexer  : AudescriptLexer;
    function AudescriptLexer(str, moduleName, source, lexer) {
        if (lexer) {
            this.line = lexer.line;
            this.column = lexer.column;
            this.i = lexer.i;
            this.str = lexer.str;
            this.moduleName = lexer.moduleName;
            this.source = lexer.source;
        }
        else {
            this.str = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
            this.line = 1;
            this.column = 1;
            this.i = 0;
            this.moduleName = moduleName;
            this.source = source;
        }
    }
    AudescriptLexer.prototype.getState = function () {
        return new AudescriptLexer(this.str, this.moduleName, this.source, this);
    };
    AudescriptLexer.prototype.restoreState = function (state) {
        this.str = state.str;
        this.i = state.i;
        this.line = state.line;
        this.column = state.column;
    };
    AudescriptLexer.prototype.end = function () {
        return this.i >= this.str.length;
    };
    AudescriptLexer.prototype.getWhite = function (newLineIsSignificant) {
        var res = "";
        var begin = this.curPos();
        while (!this.end()) {
            if (this.str[this.i] === "#" || (this.str[this.i] === "/" && this.str[this.i + 1] === "/")) {
                while (!this.end() && this.curChar() !== "\n") {
                    this.nextChar();
                }
            }
            if (this.end() || this.curChar().trim() || (newLineIsSignificant && this.curChar() === "\n")) {
                break;
            }
            this.nextChar();
        }
        return this.substringFrom(begin);
    };
    AudescriptLexer.prototype.nextChar = function () {
        if (this.end()) {
            this.unepexctedEnd();
        }
        if (this.str[this.i] === '\n') {
            this.line++;
            this.column = 0;
        }
        this.column++;
        return this.str[this.i++];
    };
    AudescriptLexer.prototype.curChar = function () {
        if (this.end()) {
            this.unepexctedEnd();
        }
        return this.str[this.i];
    };
    AudescriptLexer.prototype.curPos = function () {
        return this.i;
    };
    AudescriptLexer.prototype.getLine = function () {
        return this.line;
    };
    AudescriptLexer.prototype.getColumn = function () {
        return this.column;
    };
    AudescriptLexer.prototype.substringFrom = function (begin) {
        return this.str.substring(begin, this.i);
    };
    AudescriptLexer.prototype.getWord = function (drawEndAndQuotes) {
        if (drawEndAndQuotes === void 0) { drawEndAndQuotes = false; }
        if (this.end()) {
            if (drawEndAndQuotes) {
                return "<end>";
            }
            this.unepexctedEnd();
        }
        var begin = this.curPos();
        if (AudescriptParser.identifierStartChar.test(this.curChar())) {
            do {
                this.nextChar();
            } while (!this.end() && AudescriptParser.identifierPartChar.test(this.curChar()));
        }
        else {
            this.nextChar();
        }
        if (drawEndAndQuotes) {
            return '"' + this.substringFrom(begin) + '"';
        }
        return this.substringFrom(begin);
    };
    AudescriptLexer.prototype.eat = function (str) {
        if (!this.tryEat(str, true)) {
            this.parseError(format(_("Unexpected {0}, expecting {1}"), "'" + this.getWord(true) + "'", str));
        }
    };
    AudescriptLexer.prototype.tryEat = function (str, autoCheckAfter) {
        // FIXME "end repeat" should match "end     repeat"
        if (this.i + str.length > this.str.length) {
            return false;
        }
        for (var i = 0; i < str.length; i++) {
            if (this.str[this.i + i].toLowerCase() !== str[i]) {
                return false;
            }
        }
        if (autoCheckAfter && this.i + str.length < this.str.length) {
            if (AudescriptParser.identifierPartChar.test(str[str.length - 1]) && AudescriptParser.identifierPartChar.test(this.str[this.i + str.length])) {
                return false;
            }
        }
        for (var i = 0; i < str.length; i++) {
            this.nextChar();
        }
        return true;
    };
    AudescriptLexer.prototype.formatError = function (message) {
        if (message) {
            return format(_("Parse error on line {0} column {1}: {2}"), this.getLine(), this.getColumn(), message);
        }
        return format(_("Parse error on line {0} column {1}"), this.getLine(), this.getColumn());
    };
    AudescriptLexer.prototype.parseError = function (message) {
        throw new Error(this.formatError(message));
    };
    AudescriptLexer.prototype.unepexctedEnd = function (message) {
        throw new audescriptUnexpectedEndParseError(this.formatError(message || _("Unexpected end")));
    };
    return AudescriptLexer;
})();
var AudescriptParser = (function () {
    // "this", "does", "contain", "subset", "element", "belongs", "contains",
    function AudescriptParser(lexer) {
        this.parseExport = function (state) {
            var exported;
            var word = this.lexer.getWord();
            var white = this.lexer.getWhite();
            var newState = this.lexer.getState();
            switch (word) {
                case "function":
                    exported = this.parseFunction(newState);
                    break;
                case "procedure":
                    exported = this.parseProcedure(newState);
                    break;
                case "var":
                    word = "let";
                case "let":
                case "const":
                    exported = this.parseLet(newState, word);
                    break;
                default:
                    this.lexer.restoreState(state);
                    exported = this.parseIdentifier();
            }
            if (!exported) {
                this.lexer.parseError(format(_("Unexpected {0}, expecting a named function, let or const declaration"), this.lexer.getWord(true)));
            }
            if (exported instanceof AudescriptASTFunction) {
                if (!exported.funName) {
                    this.lexer.parseError(format(_("Only named functions can be exported"), this.lexer.getWord(true)));
                }
            }
            else if (exported instanceof AudescriptASTDecl) {
                if (!(exported.declared instanceof AudescriptASTIdentifier)) {
                    this.lexer.parseError(format(_("Sorry, destructuring declarations cannot be exported yet"), this.lexer.getWord(true)));
                }
            }
            if (exported instanceof AudescriptASTDecl || exported instanceof AudescriptASTFunction) {
                exported.setInitialWhite(white);
            }
            return new AudescriptASTExport(state, exported);
        };
        this.lexer = lexer;
    }
    AudescriptParser.prototype.parse = function () {
        var state = this.lexer.getState();
        var res = this.parseStatement();
        res.appendWhite(this.lexer.getWhite());
        if (!this.lexer.end()) {
            this.lexer.parseError(format(_("Unexpected {0}"), this.lexer.getWord(true)));
        }
        return new AudescriptASTRoot(state, res);
    };
    AudescriptParser.prototype.parseNumber = function () {
        var state = this.lexer.getState();
        var numberStr = tryNumber(this.lexer);
        if (numberStr) {
            return new AudescriptASTNumber(state, numberStr);
        }
        return null;
    };
    AudescriptParser.prototype.parseChar = function () {
        if (!this.lexer.end() && this.lexer.curChar() === "'") {
            var state = this.lexer.getState();
            this.lexer.nextChar();
            if (this.lexer.curChar() === "\\") {
                this.lexer.nextChar();
                if (this.lexer.curChar() === "u") {
                    this.lexer.nextChar();
                    this.lexer.nextChar();
                    this.lexer.nextChar();
                    this.lexer.nextChar();
                }
                else if (this.lexer.curChar() === "x") {
                    this.lexer.nextChar();
                    this.lexer.nextChar();
                }
            }
            this.lexer.nextChar();
            if (this.lexer.curChar() === "'") {
                this.lexer.nextChar();
                return new AudescriptASTChar(state, this.lexer.substringFrom(state.curPos()));
            }
            else {
                this.lexer.parseError(format(_("Unexpected \"{0}\", expecting \"{1}\""), this.lexer.curChar(), "'"));
                return null;
            }
        }
        return null;
    };
    AudescriptParser.prototype.parseIdentifier = function (allowKeyword) {
        if (allowKeyword === void 0) { allowKeyword = false; }
        if (!this.lexer.end() && AudescriptParser.identifierStartChar.test(this.lexer.curChar())) {
            var state = this.lexer.getState();
            do {
                this.lexer.nextChar();
            } while (!this.lexer.end() && AudescriptParser.identifierPartChar.test(this.lexer.curChar()));
            var identifier = this.lexer.substringFrom(state.curPos());
            if (allowKeyword || AudescriptParser.keywords.indexOf(identifier) === -1) {
                if (!allowKeyword && identifier === "nil") {
                    identifier = "null";
                }
                return new AudescriptASTIdentifier(state, identifier);
            }
            else {
                this.lexer.restoreState(state);
            }
        }
        return null;
    };
    AudescriptParser.prototype.parseBool = function () {
        var state = this.lexer.getState();
        var b;
        if (this.lexer.tryEat("true")) {
            b = "true";
        }
        else if (this.lexer.tryEat("false")) {
            b = "false";
        }
        else {
            return null;
        }
        return new AudescriptASTBool(state, b);
    };
    AudescriptParser.prototype.parseEmptySet = function () {
        var state = this.lexer.getState();
        if (this.lexer.tryEat("empty set") || this.lexer.tryEat("emptyset")) {
            return new AudescriptASTBrace(state, [], null, "");
        }
    };
    AudescriptParser.prototype.parseEmptyObject = function () {
        var state = this.lexer.getState();
        if (this.lexer.tryEat("empty object") || this.lexer.tryEat("emptyobj")) {
            return new AudescriptASTBrace(state, [], [], "");
        }
    };
    AudescriptParser.prototype.parseRegexp = function () {
        if (!this.lexer.end() && this.lexer.curChar() === "/") {
            var state = this.lexer.getState();
            do {
                this.lexer.nextChar();
                if (this.lexer.curChar() === "\\") {
                    this.lexer.nextChar();
                }
            } while (this.lexer.curChar() !== "/");
            this.lexer.nextChar();
            while (!this.lexer.end() && "azertyuiopqsdfghjklmwxcvbn".indexOf(this.lexer.curChar()) !== -1) {
                this.lexer.nextChar();
            }
            return new AudescriptASTRegexp(state, this.lexer.substringFrom(state.curPos()));
        }
        return null;
    };
    AudescriptParser.prototype.parseString = function () {
        if (!this.lexer.end() && this.lexer.curChar() === '"') {
            var state = this.lexer.getState();
            this.lexer.nextChar();
            try {
                while (this.lexer.curChar() !== '"') {
                    if (this.lexer.curChar() === "\\") {
                        this.lexer.nextChar();
                    }
                    this.lexer.nextChar();
                }
                this.lexer.nextChar();
            }
            catch (e) {
                if (e instanceof audescriptUnexpectedEndParseError) {
                    this.lexer.unepexctedEnd(_("Unterminated string litteral"));
                }
                else {
                    throw e;
                }
            }
            return new AudescriptASTString(state, this.lexer.substringFrom(state.curPos()));
        }
        return null;
    };
    AudescriptParser.prototype.parseInsideParen = function (end, allowTuple) {
        if (allowTuple === void 0) { allowTuple = false; }
        var expectingComma = true;
        var expressions = [];
        var values = null;
        var white = "";
        var expectColon = false, dontExpectColon = false;
        do {
            this.lexer.nextChar();
            white = this.lexer.getWhite();
            if (this.lexer.curChar() === end) {
                break;
            }
            var subExpr = this.parseExpression(true);
            if (!subExpr) {
                if (this.lexer.curChar() === ",") {
                    expectingComma = false;
                    this.lexer.nextChar();
                }
                break;
            }
            subExpr.prependWhite(white);
            white = "";
            subExpr.appendWhite(this.lexer.getWhite());
            expressions.push(subExpr);
            if (end === "}") {
                if (expectColon && this.lexer.curChar() !== ":") {
                    this.lexer.parseError(format(_("Unexpected {0}, expecting {1}"), this.lexer.getWord(true), "':'"));
                }
                else if (dontExpectColon && this.lexer.curChar() === ":") {
                    this.lexer.parseError(format(_("Unexpected {0}, expecting ',' or {1}"), this.lexer.getWord(true), "'" + end + "'"));
                }
                else if (this.lexer.curChar() === ":") {
                    if (!expectColon) {
                        values = [];
                        expectColon = true;
                    }
                    this.lexer.nextChar();
                    white = this.lexer.getWhite();
                    subExpr = this.parseExpression(true);
                    if (!subExpr) {
                        this.lexer.parseError(format(_("Unexpected {0}, expecting an expression"), this.lexer.getWord(true)));
                        break;
                    }
                    subExpr.prependWhite(white);
                    white = "";
                    subExpr.appendWhite(this.lexer.getWhite());
                    values.push(subExpr);
                }
                else {
                    dontExpectColon = true;
                }
            }
            if (this.lexer.curChar() === ',') {
                expectingComma = false;
            }
        } while (this.lexer.curChar() === ',');
        var innerWhite = white;
        allowTuple = allowTuple && (!expressions.length || !expectingComma);
        if (this.lexer.curChar() !== end) {
            this.lexer.parseError(format(expectingComma
                ? _("Unexpected {0}, expecting ',' or {1}")
                : _("Unexpected {0}, expecting {1}"), this.lexer.getWord(true), "'" + end + "'"));
            return null;
        }
        this.lexer.nextChar();
        return [expressions, values, innerWhite, allowTuple];
    };
    AudescriptParser.prototype.parseParen = function () {
        if (this.lexer.curChar() === '(') {
            var state = this.lexer.getState();
            var _a = this.parseInsideParen(')'), expressions = _a[0], values = _a[1], innerWhite = _a[2], allowTuple = _a[3];
            return new AudescriptASTParen(state, false, expressions, innerWhite);
        }
        return null;
    };
    AudescriptParser.prototype.parseParenBracketBrace = function (allowTuple) {
        if (this.lexer.end()) {
            return null;
        }
        var end;
        if (this.lexer.curChar() === '(') {
            end = ")";
        }
        else if (this.lexer.curChar() === '[') {
            end = "]";
        }
        else if (this.lexer.curChar() === '{') {
            end = "}";
        }
        else {
            return null;
        }
        var state = this.lexer.getState();
        var expressions, innerWhite, values;
        _a = this.parseInsideParen(end, allowTuple), expressions = _a[0], values = _a[1], innerWhite = _a[2], allowTuple = _a[3];
        if (end === "]") {
            return new AudescriptASTBracket(state, expressions, innerWhite);
        }
        else if (end === ")") {
            return new AudescriptASTParen(state, allowTuple, expressions, innerWhite);
        }
        else {
            return new AudescriptASTBrace(state, expressions, values, innerWhite);
        }
        return null;
        var _a;
    };
    AudescriptParser.prototype.parseDestructuringExpression = function () {
        var expr = this.parseParenBracketBrace() || this.parseIdentifier();
        //         AudescriptASTStatement.checkDestructuringExpression(expr); FIXME
        return expr;
    };
    AudescriptParser.prototype.parseForeach = function (state) {
        var expr = this.parseDestructuringExpression();
        expr.appendWhite(this.lexer.getWhite());
        this.lexer.eat("in");
        var iterated = this.expectExpression(true);
        iterated.appendWhite(this.lexer.getWhite());
        this.lexer.eat("do");
        var block = this.parseStatement();
        block.appendWhite(this.lexer.getWhite());
        var ended = (this.lexer.tryEat("end loop", true) ||
            this.lexer.tryEat("end do", true) ||
            this.lexer.tryEat("end foreach", true) ||
            this.lexer.tryEat("end for", true) ||
            this.lexer.tryEat("od", true) ||
            this.lexer.tryEat("done", true));
        return new AudescriptASTForeach(state, expr, iterated, block);
    };
    AudescriptParser.prototype.parseFor = function (state) {
        var identifier = this.parseIdentifier();
        if (!identifier) {
            this.lexer.parseError(format(_("Unexpected {0}, expecting an identifier"), this.lexer.getWord(true)));
        }
        identifier.appendWhite(this.lexer.getWhite());
        this.lexer.eat("from");
        var begin = this.expectExpression(true);
        begin.appendWhite(this.lexer.getWhite());
        this.lexer.eat("to");
        var end = this.expectExpression(true);
        end.appendWhite(this.lexer.getWhite());
        var step;
        if (this.lexer.tryEat("step") || this.lexer.tryEat("step")) {
            step = this.expectExpression(true);
            step.appendWhite(this.lexer.getWhite());
        }
        else {
            step = new AudescriptASTNumber(this.lexer.getState(), "1");
            step.prependWhite(" ");
            step.appendWhite(" ");
        }
        this.lexer.eat("do");
        var block = this.parseStatement();
        block.appendWhite(this.lexer.getWhite());
        var ended = (this.lexer.tryEat("end loop", true) ||
            this.lexer.tryEat("end do", true) ||
            this.lexer.tryEat("end for", true) ||
            this.lexer.tryEat("od", true) ||
            this.lexer.tryEat("done", true));
        if (!ended) {
            state.parseError(_("Could not find the end of this loop. The loop must be ended by 'done', 'end for', 'end loop', 'end do' or 'od'"));
        }
        return new AudescriptASTFor(state, identifier, begin, end, step, block);
    };
    AudescriptParser.prototype.parseWhile = function (state, flags, isUntil) {
        var expr = this.expectExpression(true);
        expr.appendWhite(this.lexer.getWhite());
        try {
            this.lexer.eat("do");
        }
        catch (e) {
            if (flags & AudescriptParser.EXPECT_WHILE_UNTIL) {
                return null;
            }
            else {
                throw e;
            }
        }
        var block = this.parseStatement();
        block.appendWhite(this.lexer.getWhite());
        var ended = (this.lexer.tryEat("end loop", true) ||
            this.lexer.tryEat("end do", true) ||
            (isUntil
                ? this.lexer.tryEat("end until", true)
                : this.lexer.tryEat("end while", true)) ||
            this.lexer.tryEat("od", true) ||
            this.lexer.tryEat("done", true));
        if (isUntil) {
            if (!ended) {
                state.parseError(_("Could not find the end of this loop. The loop must be ended by 'done', 'end until', 'end loop', 'od' or 'end do'"));
            }
            return new AudescriptASTWhile(state, expr, true, block);
        }
        if (!ended) {
            state.parseError(_("Could not find the end of this loop. The loop must be ended by 'done', 'end while', 'end loop', 'od' or 'end do'"));
        }
        return new AudescriptASTWhile(state, expr, false, block);
    };
    AudescriptParser.prototype.parseDoWhile = function (state) {
        var block = this.parseStatement(AudescriptParser.EXPECT_WHILE_UNTIL);
        block.appendWhite(this.lexer.getWhite());
        var keyworddIsUntil;
        if (this.lexer.tryEat("while", true)) {
            keyworddIsUntil = false;
        }
        else if (this.lexer.tryEat("until")) {
            keyworddIsUntil = true;
        }
        else {
            this.lexer.parseError(format(_("Unexpected {0}, expecting 'while' or 'until'"), this.lexer.getWord(true)));
        }
        var white = this.lexer.getWhite();
        var expr = this.expectExpression(false);
        expr.prependWhite(white);
        return new AudescriptASTDoWhile(state, block, keyworddIsUntil, expr);
    };
    AudescriptParser.prototype.parseRepeat = function (state) {
        if (this.lexer.curChar() === "\n") {
            return this.parseDoWhile(state);
        }
        if (this.lexer.tryEat("forever")) {
            var block_1 = this.parseStatement();
            block_1.appendWhite(this.lexer.getWhite());
            if (!this.lexer.tryEat("end repeat") && !this.lexer.tryEat("end loop")) {
                state.parseError(_("Could not find the end of this loop. The loop must be ended by 'end repeat' or 'end loop'"));
            }
            return new AudescriptASTRepeatForever(state, block_1);
        }
        var expr = this.expectExpression(true);
        expr.appendWhite(this.lexer.getWhite());
        this.lexer.eat("times");
        var block = this.parseStatement();
        block.appendWhite(this.lexer.getWhite());
        if (!this.lexer.tryEat("end repeat") && !this.lexer.tryEat("end loop")) {
            state.parseError(_("Could not find the end of this loop. The loop must be ended by 'end repeat' or 'end loop'"));
        }
        return new AudescriptASTRepeatTimes(state, expr, block);
    };
    AudescriptParser.prototype.parseUntil = function (state, flags) {
        return this.parseWhile(state, flags, true);
    };
    AudescriptParser.prototype.parseFunction = function (state, isProcedure) {
        var id = this.parseIdentifier();
        if (id) {
            id.appendWhite(this.lexer.getWhite());
        }
        var params = this.parseParen();
        if (!params) {
            // should never happen
            this.lexer.parseError(format(_("Unexpected {0}, expecting parameter list"), this.lexer.getWord(true)));
        }
        var block = this.parseStatement();
        block.appendWhite(this.lexer.getWhite());
        this.lexer.eat(isProcedure ? "end procedure" : "end function");
        return new AudescriptASTFunction(state, isProcedure, id, params, block);
    };
    AudescriptParser.prototype.parseProcedure = function (state) {
        return this.parseFunction(state, true);
    };
    AudescriptParser.prototype.tryParseFunction = function () {
        var state = this.lexer.getState();
        var isProcedure = false;
        if (this.lexer.tryEat("function")) {
            isProcedure = false;
        }
        else if (this.lexer.tryEat("procedure")) {
            isProcedure = true;
        }
        else {
            return null;
        }
        var white = this.lexer.getWhite(true);
        var res = this.parseFunction(state, isProcedure);
        res.setInitialWhite(white);
        return res;
    };
    AudescriptParser.prototype.parseBreak = function (state) {
        return new AudescriptASTBreak(state);
    };
    AudescriptParser.prototype.parseContinue = function (state) {
        return new AudescriptASTContinue(state);
    };
    AudescriptParser.prototype.expectExpression = function (insideExpression) {
        var res = this.parseExpression(insideExpression);
        if (!res) {
            this.lexer.parseError(_("Expecting expression"));
        }
        return res;
    };
    AudescriptParser.prototype.parseReturnThrow = function (state, keyword) {
        if (this.lexer.end() || this.lexer.curChar() === "\n") {
            if (keyword === "throw") {
                this.lexer.parseError(_("Expecting an expression after throw"));
            }
            return new AudescriptASTReturnThrow(state, keyword, null);
        }
        return new AudescriptASTReturnThrow(state, keyword, this.expectExpression(false));
    };
    AudescriptParser.prototype.parseLet = function (state, keyword) {
        var declared = this.parseDestructuringExpression();
        declared.appendWhite(this.lexer.getWhite());
        this.lexer.eat(":=");
        var expr = this.expectExpression(false);
        return new AudescriptASTDecl(state, keyword, declared, expr);
    };
    AudescriptParser.prototype.parseTernary = function () {
        var state = this.lexer.getState();
        if (!this.lexer.tryEat("if")) {
            return null;
        }
        var expr = this.expectExpression(true);
        expr.appendWhite(this.lexer.getWhite());
        this.lexer.eat("then");
        var blockIf = this.expectExpression(true);
        blockIf.appendWhite(this.lexer.getWhite());
        this.lexer.eat("else");
        var blockElse = this.expectExpression(true);
        blockElse.appendWhite(this.lexer.getWhite());
        return new AudescriptASTTernary(state, expr, blockIf, blockElse);
    };
    AudescriptParser.prototype.parseIf = function (state, unless) {
        if (unless === void 0) { unless = false; }
        var expr = this.expectExpression(true);
        expr.appendWhite(this.lexer.getWhite());
        this.lexer.eat("then");
        var blockIf = this.parseStatement();
        blockIf.appendWhite(this.lexer.getWhite());
        var blockElse = null;
        if (!unless && this.lexer.tryEat("else")) {
            var whiteBefore = this.lexer.getWhite(true);
            if (this.lexer.tryEat("if")) {
                var white = this.lexer.getWhite();
                var state2 = this.lexer.getState();
                var newIf = this.parseIf(state2);
                newIf.prependWhite(whiteBefore);
                newIf.setInitialWhite(white);
                return new AudescriptASTIf(state, false, expr, blockIf, newIf);
            }
            blockElse = this.parseStatement();
            blockElse.appendWhite(this.lexer.getWhite());
        }
        if (unless) {
            this.lexer.eat("end unless");
        }
        else if (!this.lexer.tryEat("fi") && !this.lexer.tryEat("end if")) {
            state.parseError(_("Could not find the end of this if statement. The if statement must be ended by 'fi' or 'end if'"));
        }
        return new AudescriptASTIf(state, unless, expr, blockIf, blockElse);
    };
    AudescriptParser.prototype.parseTry = function (state) {
        var blockTry = this.parseStatement();
        var blockCatch = null;
        var exc = null;
        var blockFinally = null;
        if (this.lexer.tryEat("catch") || this.lexer.tryEat("except")) {
            var white = this.lexer.getWhite();
            exc = this.parseIdentifier();
            if (!exc) {
                this.lexer.parseError(format(_("Unexpected {0}, expecting an identifier"), this.lexer.getWord(true)));
            }
            exc.prependWhite(white);
            blockCatch = this.parseStatement();
        }
        if (this.lexer.tryEat("finally")) {
            blockFinally = this.parseStatement();
        }
        if (!blockCatch && !blockFinally) {
            this.lexer.parseError(format(_("Unexpected {0}, expecting a catch (or except) or finally block"), this.lexer.getWord(true)));
        }
        this.lexer.eat("end try");
        return new AudescriptASTTry(state, blockTry, blockCatch, exc, blockFinally);
    };
    AudescriptParser.prototype.parseFromImport = function (state) {
        var moduleName = this.parseIdentifier() || this.parseString();
        if (!moduleName) {
            this.lexer.parseError(format(_("Unexpected {0}, expecting a module name after the from keyword"), this.lexer.getWord(true)));
        }
        moduleName.appendWhite(this.lexer.getWhite());
        this.lexer.eat("import");
        var importList = [];
        do {
            var white = this.lexer.getWhite();
            var exported = this.parseIdentifier();
            if (!exported) {
                this.lexer.parseError(format(_("Unexpected {0}, expecting a identifier after import or comma"), this.lexer.getWord(true)));
            }
            exported.prependWhite(this.lexer.getWhite());
            var newState = this.lexer.getState();
            white = this.lexer.getWhite();
            var as = exported;
            if (this.lexer.tryEat("as")) {
                white = this.lexer.getWhite();
                as = this.parseIdentifier();
                if (!as) {
                    this.lexer.parseError(format(_("Unexpected {0}, expecting a identifier after as"), this.lexer.getWord(true)));
                }
                as.prependWhite(white);
                newState = this.lexer.getState();
                white = this.lexer.getWhite();
            }
            importList.push([exported, as]);
            if (this.lexer.end() || this.lexer.curChar() !== ",") {
                this.lexer.restoreState(newState);
                break;
            }
            as.appendWhite(white);
            this.lexer.nextChar();
        } while (true);
        return new AudescriptASTFromImport(state, moduleName, importList);
    };
    AudescriptParser.prototype.parseControlStatement = function (flags) {
        if (this.lexer.end()) {
            return null;
        }
        var state = this.lexer.getState();
        var word = this.lexer.getWord().toLowerCase();
        var white = this.lexer.getWhite(true);
        var res;
        // TODO support if expression here
        switch (word) {
            case "for":
                if (this.lexer.tryEat("each")) {
                    white += this.lexer.getWhite();
                    res = this.parseForeach(state);
                    break;
                }
                else {
                    res = this.parseFor(state);
                    break;
                }
            case "foreach":
                res = this.parseForeach(state);
                break;
            case "try":
                res = this.parseTry(state);
                break;
            case "if":
                res = this.parseIf(state);
                break;
            case "unless":
                res = this.parseIf(state, true);
                break;
            case "while":
                res = this.parseWhile(state, flags);
                break;
            case "repeat":
                res = this.parseRepeat(state);
                break;
            case "do":
                res = this.parseRepeat(state);
                break; // we really meant parseRepeat
            case "until":
                res = this.parseUntil(state, flags);
                break;
            case "function":
                res = this.parseFunction(state);
                break;
            case "procedure":
                res = this.parseProcedure(state);
                break;
            case "return":
                res = this.parseReturnThrow(state, word);
                break;
            case "throw":
                res = this.parseReturnThrow(state, word);
                break;
            case "break":
                res = this.parseBreak(state);
                break;
            case "continue":
                res = this.parseContinue(state);
                break;
            case "export":
                res = this.parseExport(state);
                break;
            case "from":
                res = this.parseFromImport(state);
                break;
            case "var":
                word = "let";
            case "let":
            case "const":
                res = this.parseLet(state, word);
                break;
            case "import":
                this.lexer.parseError(_("import is not yet supported. Use the from ... import ... syntax instead"));
        }
        if (!res) {
            this.lexer.restoreState(state);
            return null;
        }
        res.setInitialWhite(white);
        return res;
    };
    AudescriptParser.prototype.error = function () {
        this.lexer.parseError();
    };
    AudescriptParser.prototype.parseOperator = function (operators) {
        for (var _i = 0; _i < operators.length; _i++) {
            var op = operators[_i];
            if (this.lexer.tryEat(op, true)) {
                return op;
            }
        }
        return null;
    };
    AudescriptParser.prototype.parseExpression = function (insideExpression) {
        var initialWhite = this.lexer.getWhite();
        var expressionList = [];
        var expectExpr = "";
        var white = "";
        while (true) {
            var state = this.lexer.getState();
            white = this.lexer.getWhite();
            var opState = this.lexer.getState();
            var op = this.parseOperator(AudescriptParser.prefixOperators);
            if (op) {
                expressionList.push(new AudescriptASTExpressionListOp(opState, op, white));
                white = this.lexer.getWhite(!insideExpression);
            }
            var res_7 = (this.parseNumber() ||
                this.parseChar() ||
                this.parseString() ||
                this.parseBool() ||
                this.parseRegexp() ||
                this.parseEmptyObject() ||
                this.parseEmptySet() ||
                this.parseTernary() ||
                this.tryParseFunction() ||
                this.parseIdentifier(expectExpr === ".") ||
                this.parseParenBracketBrace(true));
            if (!res_7) {
                if (op || expectExpr) {
                    this.lexer.parseError(format(_("Expecting an expression after operator {0}"), ("'" + (op || expectExpr) + "'")));
                }
                this.lexer.restoreState(state);
                break;
            }
            expectExpr = "";
            res_7.prependWhite(white);
            expressionList.push(res_7);
            state = this.lexer.getState();
            white = this.lexer.getWhite(!insideExpression);
            // NOTE: we forbid things like:
            // function()
            //     let a := 3
            //              + 2
            //
            // This should be written:
            //
            //     let a := (3
            //               + 2)
            //
            // or:
            //
            //     let a := 3 +
            //              2
            //
            opState = this.lexer.getState();
            op = this.parseOperator(AudescriptParser.suffixOperators);
            if (op) {
                res_7.appendWhite(white);
                white = "";
                expressionList.push(new AudescriptASTExpressionListOp(opState, op));
                state = this.lexer.getState();
            }
            opState = this.lexer.getState();
            op = this.parseOperator(AudescriptParser.operators);
            if (op) {
                res_7.appendWhite(white);
                white = "";
                expressionList.push(new AudescriptASTExpressionListOp(opState, op));
                expectExpr = op;
            }
            else {
                var found = false;
                while (true) {
                    if (!this.lexer.end() && this.lexer.curChar() === "(") {
                        res_7.appendWhite(white);
                        white = "";
                        expressionList.push(new AudescriptASTExpressionListOp(opState, "call"));
                        expressionList.push(res_7 = this.parseParen());
                        found = true;
                    }
                    else if (!this.lexer.end() && this.lexer.curChar() === "[") {
                        res_7.appendWhite(white);
                        white = "";
                        expressionList.push(new AudescriptASTExpressionListOp(opState, "index"));
                        expressionList.push(res_7 = this.parseParenBracketBrace());
                        found = true;
                    }
                    else {
                        if (found) {
                            this.lexer.restoreState(state);
                            white = this.lexer.getWhite(!insideExpression);
                        }
                        break;
                    }
                    state = this.lexer.getState();
                    white = this.lexer.getWhite(!insideExpression);
                }
                if (!found) {
                    break;
                }
                opState = this.lexer.getState();
                op = this.parseOperator(AudescriptParser.operators);
                if (op) {
                    res_7.appendWhite(white);
                    white = "";
                    expressionList.push(new AudescriptASTExpressionListOp(opState, op));
                    expectExpr = op;
                }
                else {
                    this.lexer.restoreState(state);
                    white = this.lexer.getWhite(true);
                    break;
                }
            }
        }
        var res = AudescriptASTStatement.expressionListToAST(initialWhite, expressionList, "");
        if (res) {
            res.appendWhite(white + this.lexer.getWhite(true));
        }
        return res;
    };
    AudescriptParser.prototype.parseStatement = function (flags) {
        if (flags === void 0) { flags = 0; }
        var white = this.lexer.getWhite();
        var state = this.lexer.getState();
        var res = this.parseControlStatement(flags) || this.parseExpression(false);
        if (!res) {
            res = new AudescriptASTNullStatement(state);
            res.prependWhite(white);
            return res;
        }
        res.prependWhite(white);
        res.appendWhite(this.lexer.getWhite(true));
        if (!this.lexer.end() && this.lexer.curChar() === ";") {
            this.lexer.nextChar();
            res.appendWhite(this.lexer.getWhite(true));
        }
        return new AudescriptASTComposition(state, res, this.parseStatement(flags));
    };
    AudescriptParser.EXPECT_WHILE_UNTIL = 1;
    AudescriptParser.prefixOperators = ["++", "--", "not", "~", "typeof", "new", "u="];
    AudescriptParser.suffixOperators = ["++", "--"];
    AudescriptParser.operators = [
        "does not contain", "not subset of", "not element of",
        "does not belong to", "contains", "subset of", "element of",
        "belongs to", "instance of", "union", "inter", "symdiff", "minus",
        "instanceof", "cross", "u", "x",
        ">>>=",
        "+=", "-=", ":=",
        "&=", "|=", "*=", "%=", "^=",
        "!=", "/=", "<>",
        "=", "is not", "is",
        "<=", ">=",
        ">>>",
        "<<=", ">>=",
        "<<", ">>",
        "or", "and", "mod",
        "&", "|", "*", "^", "~",
        "<", ">",
        "+", "-", ".", "\\"
    ];
    AudescriptParser.keywords = [
        "not", "of", "to", "is", "until", "repeat", "times", "or", "and", "mod",
        "forever", "raise", "except", "break", "case", "class", "loop", "then",
        "to", "fi", "done", "except", "catch", "const", "continue", "debugger",
        "default", "delete", "do", "od", "else", "export", "extends", "finally",
        "for", "function", "if", "unless", "import", "in", "instanceof", "let",
        "new", "return", "super", "switch", "throw", "raise", "try", "typeof",
        "var", "void", "while", "with", "yield", "end", "foreach"
    ];
    return AudescriptParser;
})();
(function (that) {
    var audescript = that.audescript = {
        parse: function (str, moduleName, fname) {
            if (fname === void 0) { fname = "<string>"; }
            return new AudescriptParser(new AudescriptLexer(str, moduleName, fname)).parse();
        },
        toJS: function (str, moduleName, fname) {
            var parsed = audescript.parse(str, moduleName, fname);
            var needs = AudescriptASTStatement.getNeededModules(parsed);
            var codemap = parsed.toJS().toStringWithSourceMap({
                file: fname || "<stdin>"
            });
            return {
                neededModules: needs,
                map: codemap.map,
                code: codemap.code
            };
        },
        l10n: _
    };
    if (typeof module !== "undefined" && typeof require !== "undefined" && require.main === module) {
        require('source-map-support').install();
        var fs = require('fs');
        function writeResult(content, filename) {
            var moduleName = "", newFile;
            if (filename) {
                moduleName = filename.replace(/\.[^/.]+$/, "");
                newFile = moduleName + ".js";
                if (filename === newFile) {
                    newFile += ".js";
                }
            }
            var codemap = audescript.toJS(content, moduleName, filename || "<stdin>");
            if (filename) {
                fs.writeFile(newFile, codemap.code, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                });
                fs.writeFile(newFile + ".map", codemap.map.toString(), function (err) {
                    if (err) {
                        return console.error(err);
                    }
                });
            }
            else {
                console.log(codemap.code);
            }
        }
        if (process.argv[2] && process.argv[2] !== "-") {
            fs.readFile(process.argv[2], function (err, data) {
                if (err) {
                    return console.error(err);
                }
                writeResult(data.toString(), process.argv[2]);
            });
            return;
        }
        var script = "";
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', function (chunk) {
            script += chunk;
        });
        process.stdin.on("end", function () {
            writeResult(script);
        });
    }
}(typeof that.exports === "object" ? that.exports : this));
//Thanks http://stackoverflow.com/questions/2008279/validate-a-javascript-function-name/9392578#9392578
AudescriptParser.identifierStartChar = /^[$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]$/;
AudescriptParser.identifierPartChar = /^[$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc0-9\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1dc0-\u1de6\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f]*$/;
//# sourceMappingURL=audescript.bundle.js.map
}(this));
