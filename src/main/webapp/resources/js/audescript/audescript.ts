/// <reference path="./typings/tsd.d.ts" />
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

import SourceMap = require("source-map");
let  SourceNode = SourceMap.SourceNode;
type SourceNode = SourceMap.SourceNode;

declare var that : any;
declare var libD : any;

function format(message : string, ...args : any[]) : string {
    return message.replace(/{(\d+)}/g, function(match, i) {
        return (
            i in args ? args[i] : match
        );
    });
};

let _ = typeof libD === "undefined" ? function (message : string) : string {
    return message;
} : libD.l10n();

class AudescriptASTStatement {
    lexerStateBegin : AudescriptLexer;
//     lexerStateEnd   : AudescriptLexer;
    whiteBefore     : string;
    whiteAfter      : string;
    audescriptVar   : [string, string];

    constructor(beginState : AudescriptLexer) {
        this.lexerStateBegin = beginState;
//         this.lexerStateEnd   = beginState.lexer.getState();
        this.whiteBefore     = "";
        this.whiteAfter      = "";
    }

    static commentToJS(s : string) : string {
        return s.replace(/#([^\n]*)/g,  "//$1");
    }

    static needParentheses(ast : AudescriptASTExpression, parent? : AudescriptASTInfixedOp) {
        if (ast instanceof AudescriptASTTernary) {
            if (parent && parent.op[parent.op.length - 1] === "=" && parent.op !== "=" && parent.op !== "/=" && parent.op !== "!=") {
                return false;
            } else {
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
    }

    static newIdentifier(usedIdentifiers : string[], base : string = "i") : string {
        if (usedIdentifiers.indexOf(base) === -1) {
            return base;
        }

        let i = 0;
        let newId : string;

        do {
            newId = base + (i++);
        } while (usedIdentifiers.indexOf(newId) !== -1);

        return newId;
    }

    static getIdentifier(expr : AudescriptASTExpression) : string {
        if (expr instanceof AudescriptASTIdentifier) {
            return expr.identifier;
        }

        if (expr instanceof AudescriptASTParen) {
            if (expr.expressions.length === 1) {
                return AudescriptASTStatement.getIdentifier(expr.expressions[0]);
            }
        }

        return null;
    }

    static opOrder = [
        ["."],
        ["index" ],
        ["call" ],
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


    static opStrongerThan(op1 : string, op2 : string) : boolean {
        let foundOp1 = false;
        let foundOp2 = false;

        for (let opList of AudescriptASTStatement.opOrder) {
            foundOp1 = foundOp1 || (opList.indexOf(op1) !== -1);
            foundOp2 = foundOp2 || (opList.indexOf(op2) !== -1);

            if (foundOp2 && !foundOp1) {
                return false;
            }

            if (foundOp1) {
                return true;
            }
        }

        throw new Error(
            format(
                _("BUG: unexpected operator {0}"),
                "'" + op1 + "'"
            )
        );
    }

    static op(o : AudescriptASTExpressionListOp, left : AudescriptASTExpression, right : AudescriptASTExpression) : AudescriptASTExpression {
        let ast : AudescriptASTExpression;
        if (left) {
            if (right) {
                ast = new AudescriptASTInfixedOp(
                    o.state,
                    left,
                    o.op,
                    right
                );
            } else {
                ast = new AudescriptASTSuffixedOp(
                    o.state,
                    left,
                    o.op
                );
            }
        } else if (right) {
            ast = new AudescriptASTPrefixedOp(
                o.state,
                right,
                o.op
            );
        } else {
            throw Error(
                format(
                    _("BUG : operation {0} without expressions"),
                    "'" + o.op + "'"
                )
            );
        }

        ast.prependWhite(o.whiteBefore);
        return ast;
    }

    static expressionListToAST(whiteBefore : string,
                               expressionList : (AudescriptASTExpression | AudescriptASTExpressionListOp)[],
                               whiteAfter : string) {

        if (expressionList.length === 1) {
            let expr = expressionList[0];
            if (expr instanceof AudescriptASTExpression) {
                expr.prependWhite(whiteBefore);
                expr.appendWhite(whiteAfter);
                return expr;
            }

            throw new Error("BUG: Unexpected remaining operator in expression list");
        }

        let i = 0;
        while (i < expressionList.length) {
            if (expressionList[i] instanceof AudescriptASTExpressionListOp) {
                let op = <AudescriptASTExpressionListOp> expressionList[i];

                let j = i - 1;
                while (j >= 0) {
                    if ((expressionList[j] instanceof AudescriptASTExpressionListOp)) {
                        if (AudescriptASTStatement.opStrongerThan(op.op, (<AudescriptASTExpressionListOp> expressionList[j]).op)) {
                            j++;
                            break;
                        }
                    }
                    j--;
                }

                j = Math.max(j, 0);

                let k = i + 1;

                while (k < expressionList.length) {
                    if ((expressionList[k] instanceof AudescriptASTExpressionListOp)) {
                        if (AudescriptASTStatement.opStrongerThan(op.op, (<AudescriptASTExpressionListOp> expressionList[k]).op)) {
                            k--;
                            break;
                        }
                    }
                    k++;
                }

                k = Math.min(k, expressionList.length - 1);

                return AudescriptASTStatement.expressionListToAST(
                    whiteBefore,
                    expressionList.slice(0, j).concat(
                        [
                            AudescriptASTStatement.op(
                                op,
                                AudescriptASTStatement.expressionListToAST(
                                    "",
                                    expressionList.slice(j, i),
                                    ""
                                ),
                                AudescriptASTStatement.expressionListToAST(
                                    "",
                                    expressionList.slice(i + 1, k + 1),
                                    ""
                                )
                            )
                        ]
                    ).concat(expressionList.slice(k + 1)),
                    whiteAfter
                );
            }
            i++;
        }

        return null;
    }

    static staticEvalNum(ast : AudescriptASTExpression) : number {
        // TODO this function rejects valid static expressions.
        // May handle more cases.

        let sen = AudescriptASTStatement.staticEvalNum;

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
    }

    static fastAndConst(ast : AudescriptASTExpression) : boolean {
        let fac = AudescriptASTStatement.fastAndConst;

        if (ast instanceof AudescriptASTBracketParenBrace) {
            if (ast.expressions.length !== 1 || !(ast instanceof AudescriptASTParen)) {
                return false;
            }

            return fac(ast.expressions[0]);
        }

        if (ast instanceof AudescriptASTTernary) {
            return false;
        }

        if (
            ast instanceof AudescriptASTNumber ||
            ast instanceof AudescriptASTString ||
            ast instanceof AudescriptASTRegexp ||
            ast instanceof AudescriptASTChar   ||
            ast instanceof AudescriptASTBool
        ) {
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
    }

    static getNeededModules(ast : AudescriptASTStatement) : string[] {
        let getNeededModules = AudescriptASTStatement.getNeededModules;

        if (ast instanceof AudescriptASTRoot) {
            return getNeededModules(ast.root);
        }

        if (ast instanceof AudescriptASTBracketParenBrace) {
            var res = [];

            if (ast.values) {
                for (let expr of ast.values) {
                    res = res.concat(getNeededModules(expr));
                }
            } else {
                for (let expr of ast.expressions) {
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
            let res = getNeededModules(ast.expr).concat(getNeededModules(ast.blockIf));
            if (ast.blockElse) {
                res = res.concat(getNeededModules(ast.blockElse))
            };
            return res;
        }

        if (ast instanceof AudescriptASTExport) {
            return getNeededModules(ast.exported);
        }


        if (
            ast instanceof AudescriptASTBreak  ||
            ast instanceof AudescriptASTNumber ||
            ast instanceof AudescriptASTString ||
            ast instanceof AudescriptASTRegexp ||
            ast instanceof AudescriptASTChar   ||
            ast instanceof AudescriptASTBool   ||
            ast instanceof AudescriptASTIdentifier ||
            ast instanceof AudescriptASTNullStatement
        ) {
            return [];
        }

        if (ast instanceof AudescriptASTForeach) {
            return getNeededModules(ast.expr).concat(getNeededModules(ast.iterated)).concat(getNeededModules(ast.block));
        }

        if (ast instanceof AudescriptASTFor) {
            return (
                getNeededModules(ast.identifier)
                .concat(getNeededModules(ast.begin))
                .concat(getNeededModules(ast.end))
                .concat(getNeededModules(ast.step))
                .concat(getNeededModules(ast.block))
            );
        }

        if (
            ast instanceof AudescriptASTWhile   ||
            ast instanceof AudescriptASTDoWhile ||
            ast instanceof AudescriptASTRepeatTimes
        ) {
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
            let res : string[] = getNeededModules(ast.blockTry);

            if (ast.blockCatch) {
                res = res.concat(getNeededModules(ast.blockCatch));
            }

            if (ast.blockFinally) {
                res = res.concat(getNeededModules(ast.blockFinally));
            }

            return res;
        }

        if (ast instanceof AudescriptASTFromImport) {
            return [ast.getModuleName()];
        }

        console.error("ast", ast);

        throw new Error(_("BUG:Unexpected AST element"));
    }


    static getUsedIdentifiers(ast : AudescriptASTStatement) : string[] {
        // WARNING not accurate, but sufficient for generating unused identifiers (over estimates used identifiers)
        let getUsed = AudescriptASTStatement.getUsedIdentifiers;

        if (ast instanceof AudescriptASTRoot) {
            return getUsed(ast.root);
        }

        if (ast instanceof AudescriptASTBracketParenBrace) {
            var res = [];

            if (ast.values) {
                for (let expr of ast.values) {
                    res = res.concat(getUsed(expr));
                }
            } else {
                for (let expr of ast.expressions) {
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
            let res = getUsed(ast.expr).concat(getUsed(ast.blockIf));
            if (ast.blockElse) {
                res = res.concat(getUsed(ast.blockElse))
            };
            return res;
        }

        if (ast instanceof AudescriptASTExport) {
            return getUsed(ast.exported);
        }


        if (
            ast instanceof AudescriptASTBreak  ||
            ast instanceof AudescriptASTNumber ||
            ast instanceof AudescriptASTString ||
            ast instanceof AudescriptASTRegexp ||
            ast instanceof AudescriptASTChar   ||
            ast instanceof AudescriptASTBool   ||
            ast instanceof AudescriptASTNullStatement
        ) {
            return [];
        }

        if (ast instanceof AudescriptASTIdentifier) {
            return [ast.identifier];
        }

        if (ast instanceof AudescriptASTForeach) {
            return getUsed(ast.expr).concat(getUsed(ast.iterated)).concat(getUsed(ast.block));
        }

        if (ast instanceof AudescriptASTFor) {
            return (
                getUsed(ast.identifier)
                .concat(getUsed(ast.begin))
                .concat(getUsed(ast.end))
                .concat(getUsed(ast.step))
                .concat(getUsed(ast.block))
            );
        }

        if (
            ast instanceof AudescriptASTWhile   ||
            ast instanceof AudescriptASTDoWhile ||
            ast instanceof AudescriptASTRepeatTimes
        ) {
            return getUsed(ast.expr).concat(getUsed(ast.block));
        }

        if (ast instanceof AudescriptASTRepeatForever) {
            return getUsed(ast.block);
        }

        if (ast instanceof AudescriptASTFunction) {
            let res = ast.funName ? getUsed(ast.funName) : [];
            return (
                res
                .concat(getUsed(ast.params))
                .concat(getUsed(ast.block))
            );
        }

        if (ast instanceof AudescriptASTComposition || ast instanceof AudescriptASTInfixedOp) {
            return getUsed(ast.left).concat(getUsed(ast.right));
        }

        if (ast instanceof AudescriptASTPrefixedOp || ast instanceof AudescriptASTSuffixedOp) {
            return getUsed(ast.expr);
        }

        if (ast instanceof AudescriptASTTry) {
            let res : string[] = getUsed(ast.blockTry);

            if (ast.blockCatch) {
                res = res.concat(getUsed(ast.blockCatch));
            }

            if (ast.blockFinally) {
                res = res.concat(getUsed(ast.blockFinally));
            }

            if (ast.exc) {
                res = res.concat(getUsed(ast.exc));
            }

            return res;
        }

        if (ast instanceof AudescriptASTFromImport) {
            let res : string[] = [];

            for (let imp of ast.importList) {
                res.push(imp[1].identifier);
            }

            return res;
        }

        console.error("ast", ast);

        throw new Error(_("BUG:Unexpected AST element"));
    }

    static needsSemicolon(ast : AudescriptASTStatement) : boolean {
        if (
            ast instanceof AudescriptASTIf            ||
            ast instanceof AudescriptASTNullStatement ||
            ast instanceof AudescriptASTForeach       ||
            ast instanceof AudescriptASTWhile         ||
            ast instanceof AudescriptASTFor           ||
            ast instanceof AudescriptASTTry           ||
            ast instanceof AudescriptASTRepeatTimes   ||
            ast instanceof AudescriptASTRepeatForever
        ) {
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
    }

    static checkNotInfixedOpNotAssignement(ast : AudescriptASTStatement) : void {
        if (ast instanceof AudescriptASTInfixedOp && ast.op !== "call" && (ast.op[ast.op.length -1] !== "=" || ast.op === "=" || ast.op === "!=")) {
            if (ast.op === "=") {
                ast.lexerStateBegin.parseError(
                    format(
                        _("Expecting a statement, not an expression (operator {0}). Maybe you meant ':='?"),
                        "'" + ast.op + "'"
                    )
                );
            }

            ast.lexerStateBegin.parseError(
                format(
                    _("Expecting a statement, not an expression (operator {0})"),
                    "'" + ast.op + "'"
                )
            );
        }
    }

    sourceNode(arr : (string | SourceNode)[]) : SourceNode {
        let whiteBefore : (SourceNode | string)[] = [this.whiteBefore]
        let whiteAfter  : (SourceNode | string)[] = [this.whiteAfter];
        return new SourceNode(
            this.lexerStateBegin.line,
            this.lexerStateBegin.column,
            this.lexerStateBegin.source,
            whiteBefore.concat(arr).concat(whiteAfter)
        );
    }

    prependWhite(str : string) : void {
        this.whiteBefore = AudescriptASTStatement.commentToJS(str) + this.whiteBefore;
    }

    appendWhite(str : string) : void {
        this.whiteAfter += AudescriptASTStatement.commentToJS(str);
    }

    toJS() : SourceNode {
        throw Error(_("Not implemented"));
    }

    setAudescriptVar(v : [string, string]) : void {
        throw Error(_("Not implemented"));
    }
}

class AudescriptASTRoot extends AudescriptASTStatement {
    root : AudescriptASTStatement;

    constructor(lexer : AudescriptLexer, root : AudescriptASTStatement) {
        super(lexer);
        this.root = root;
    }

    toJS() : SourceNode {
        let identifiers = AudescriptASTStatement.getUsedIdentifiers(this.root);
        let newId = AudescriptASTStatement.newIdentifier(
            identifiers,
            "_"
        );

        identifiers.push(newId);

        let exp = AudescriptASTStatement.newIdentifier(
            identifiers,
            "e"
        );

        this.setAudescriptVar([newId, exp]);

        return this.sourceNode(
            ['return (function (' + newId + ') {"use strict"; let ' + exp + " = " + newId + '.m("' + this.lexerStateBegin.moduleName + '", true); ', this.root.toJS(), '\n}(require("audescript-runtime")));']
        );
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.root.setAudescriptVar(v);
    }
}

class AudescriptASTFromImport extends AudescriptASTStatement implements AudescriptASTInitialWhite {
    moduleName : AudescriptASTExpression;
    importList : ([AudescriptASTIdentifier, AudescriptASTIdentifier])[];
    importListWhite : ([string, string, string, string])[];
    whiteBeforeModuleName : string;
    whiteAfterModuleName : string;
    initialWhite = "";

    constructor(lexer : AudescriptLexer, moduleName : AudescriptASTExpression, importList : ([AudescriptASTIdentifier, AudescriptASTIdentifier])[]) {
        super(lexer);
        this.importList = importList;
        this.importListWhite = [];
        this.moduleName = moduleName;
        this.whiteBeforeModuleName = moduleName.whiteBefore;
        this.whiteAfterModuleName = moduleName.whiteAfter;

        moduleName.whiteBefore = "";
        moduleName.whiteAfter = "";

        for (let imp of this.importList) {
            let w0 = imp[0].whiteBefore || "";
            let w1 = imp[0].whiteAfter || "";
            imp[0].whiteBefore = "";
            imp[0].whiteAfter = "";
            let w2 : string;
            let w3 : string;

            if (imp[0] === imp[1]) {
                w2 = " ";
                w3 = "";
            } else {
                w2 = imp[1].whiteBefore || "";
                w3 = imp[1].whiteAfter || "";
                imp[1].whiteBefore = "";
                imp[1].whiteAfter = "";
            }

            this.importListWhite.push([w0, w1, w2, w3]);
        }
    }

    getModuleName() : string {
        let res = this.moduleName.toJS().toStringWithSourceMap().code.trim();

        if (res[0] === "'" || res[0] === '"') {
            return res.substring(1, res.length - 1);
        }

        return res;
    }

    toJS() : SourceNode {
        let res : (string | SourceNode)[] = ["let" + this.initialWhite + "{"];

        let comma = "";
        for (let i = 0; i < this.importList.length; i++) {
            let imp  = this.importList[i];
            let impW = this.importListWhite[i];

            res = res.concat(
                [
                    comma + (impW[0] === " " ? "" : impW[0]),
                    imp[1].toJS(),
                    ":" + impW[2] + impW[1],
                    imp[0].toJS()
                ]
            );

            comma = "," + impW[3];
        }

        let ma, mb;

        if (this.moduleName instanceof AudescriptASTIdentifier) {
            mb = '.m("';
            ma = '")';
        } else {
            mb = ".m(";
            ma = ")";
        }

        res = res.concat(["} = ", this.audescriptVar[0] + this.whiteBeforeModuleName + mb, this.moduleName.toJS(), ma + this.importListWhite[this.importListWhite.length - 1][3] + (this.whiteAfterModuleName === " " ? "" : this.whiteAfterModuleName)]);

        return this.sourceNode(res);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;

        for (let imp of this.importList) {
            imp[0].setAudescriptVar(v);
            imp[1].setAudescriptVar(v);
        }
    }

    setInitialWhite(white : string) : void {
        this.initialWhite = AudescriptASTStatement.commentToJS(white);
    }
}

class AudescriptASTExpressionListOp {
    state : AudescriptLexer;
    op    : string;
    whiteBefore : string;

    constructor(state : AudescriptLexer, op : string, white : string = "") {
        this.state = state;
        this.whiteBefore = white;
        op = op.toLowerCase();
        switch (op) {
            case "u":  this.op = "union"; break;
            case "x":  this.op = "cross"; break;
            case "/=":
            case "<>": this.op = "!="; break;
            default :  this.op = op;
        }
    }
}

interface AudescriptASTInitialWhite extends AudescriptASTStatement {
    setInitialWhite(white : string) : void;
}

class AudescriptASTExpression extends AudescriptASTStatement {}

class AudescriptASTBracketParenBrace extends AudescriptASTExpression {
    expressions : AudescriptASTExpression[];
    values      : AudescriptASTExpression[] = null;
    innerWhite  : string;

    constructor(lexer : AudescriptLexer, expressions : AudescriptASTExpression[], values : AudescriptASTExpression[], innerWhite : string) {
        super(lexer);
        this.expressions = expressions;
        this.values      = values;
        this.innerWhite  = innerWhite;
    }

    expressionsToJS(assignment : boolean) : (SourceNode|string)[] {
        let res = [];

        for (let i = 0; i < this.expressions.length; i++) {
            let expr = this.expressions[i];

            if (this.values) {
                let value = this.values[i];
                res.push(
                    (res.length ? "," : ""),
                    expr.toJS(), ",", // formerly ":"
                    value instanceof AudescriptASTBracketParenBrace
                        ? value.toJS("", "", assignment)
                        : value.toJS()
                );
            } else {
                res.push(
                    (res.length ? "," : ""),
                    expr instanceof AudescriptASTBracketParenBrace
                        ? expr.toJS("", "", assignment)
                        : expr.toJS()
                );
            }
        }

        return res;
    }

    toJS(beginChar? : string, endChar? : string, assignment : boolean = false) : SourceNode {
        if (!beginChar || !endChar) {
            throw new Error("BUG: AudescriptASTBracketParenBrace's toJS expects begin and end chars");
        }

        let begin :( SourceNode | string)[] = [beginChar];
        return (
            this.sourceNode(
                begin
                .concat(this.expressionsToJS(assignment))
                .concat([this.innerWhite + endChar])
            )
        );
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        for (let expr of this.expressions) {
            expr.setAudescriptVar(v);
        }

        if (this.values) {
            for (let expr of this.values) {
                expr.setAudescriptVar(v);
            }
        }
    }
}

class AudescriptASTBracket extends AudescriptASTBracketParenBrace {
    constructor(lexer : AudescriptLexer, expressions : AudescriptASTExpression[], innerWhite : string) {
        super(lexer, expressions, null, innerWhite);
    }

    toJS(right : string = "", left : string = "", assignment : boolean = false) : SourceNode {
        return super.toJS("[", "]", assignment);
    }
}

class AudescriptASTParen extends AudescriptASTBracketParenBrace {
    tuple : boolean;
    assignment : boolean;

    constructor(lexer : AudescriptLexer, tuple : boolean, expressions : AudescriptASTExpression[], innerWhite : string) {
        super(lexer, expressions, null, innerWhite);
        this.tuple = tuple;
    }

    toJS(left : string = "", right : string = "", assignment : boolean = false) : SourceNode {
        return (
            this.tuple
                ? super.toJS(this.audescriptVar[0] + ".tuple([", "])")
                : (
                    assignment
                        ? super.toJS("[", "]", true)
                        : super.toJS("(", ")", false)
                )
        );
    }
}

class AudescriptASTBrace extends AudescriptASTBracketParenBrace {
    constructor(lexer : AudescriptLexer, expressions : AudescriptASTExpression[], values : AudescriptASTExpression[], innerWhite : string) {
        super(lexer, expressions, values, innerWhite);
    }

    toJS(right : string = "", left : string = "", assignment : boolean = false) : SourceNode {
        return (
            this.values
                ? super.toJS(this.audescriptVar[0] + ".o([", "])", assignment)
                : (
                    assignment
                        ? super.toJS("[", "]", true)
                        : super.toJS(this.audescriptVar[0] + ".set([", "])", assignment)
                )
        );
    }
}

class AudescriptASTReturnThrow extends AudescriptASTStatement implements AudescriptASTInitialWhite {
    expr : AudescriptASTExpression;
    keyword : string;
    initialWhite = "";

    constructor(lexer : AudescriptLexer, keyword : string, expr : AudescriptASTExpression) {
        super(lexer);
        this.expr = expr;
        this.keyword = keyword
    }

    toJS() : SourceNode {
        return this.sourceNode([this.keyword, this.initialWhite, this.expr ? this.expr.toJS() : ""]);
    }

    setInitialWhite(w : string) : void {
        this.initialWhite += AudescriptASTStatement.commentToJS(w);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        if (this.expr) {
            this.expr.setAudescriptVar(v);
        }
    }
}

class AudescriptASTExport extends AudescriptASTStatement implements AudescriptASTInitialWhite {
    exported : AudescriptASTExpression;

    constructor(lexer : AudescriptLexer, exported : AudescriptASTExpression) {
        super(lexer);
        this.exported = exported;
    }

    toJS() : SourceNode {
        let res;
        if (this.exported instanceof AudescriptASTFunction) {
            if (this.exported.whiteBefore === " ") {
                this.exported.whiteBefore = "";
            }

            let id = (<AudescriptASTFunction> this.exported).funName.identifier;
            res = [
                this.exported.toJS() + " " + this.audescriptVar[1] + "." +
                id + " = " + id
            ];
        } else if (this.exported instanceof AudescriptASTIdentifier) {
            res = [
                this.audescriptVar[1] + "." +
                (<AudescriptASTIdentifier> this.exported).identifier + " =",
                this.exported.toJS()
            ];
        } else {
            if (this.exported.whiteBefore === " ") {
                this.exported.whiteBefore = "";
            }

            let declared = <AudescriptASTIdentifier> (<AudescriptASTDecl> this.exported).declared;
            res = [
                this.exported.toJS(), "; " + this.audescriptVar[1] + "." +
                declared.identifier + " = " + declared.identifier
            ];
        }

        // TODO BUG if the exported variable changes, the export is not updated

        return this.sourceNode(res);
    }

    setInitialWhite(w : string) : void {
        this.exported.prependWhite(w);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.exported.setAudescriptVar(v);
    }
}


class AudescriptASTDecl extends AudescriptASTStatement implements AudescriptASTInitialWhite {
    keyword  : string // "let" or "const"
    declared : AudescriptASTExpression;
    expr     : AudescriptASTExpression;

    constructor(lexer : AudescriptLexer, keyword : string, declared : AudescriptASTExpression, expr : AudescriptASTExpression) {
        super(lexer);
        this.keyword  = keyword;
        this.declared = declared;
        this.expr = expr;
    }

    toJS() : SourceNode {
        let declared : SourceNode;

        if (this.declared instanceof AudescriptASTBracketParenBrace) {
            declared = (<AudescriptASTBracketParenBrace> this.declared).toJS("[", "]", true);
        } else {
            declared = this.declared.toJS();
        }

        return this.sourceNode([
            this.keyword,
            declared,
            "=",
            this.expr.toJS()
        ]);
    }

    setInitialWhite(w : string) : void {
        this.declared.prependWhite(w);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.declared.setAudescriptVar(v);
        this.expr.setAudescriptVar(v);
    }
}

class AudescriptASTTernary extends AudescriptASTExpression {
    expr      : AudescriptASTExpression;
    blockIf   : AudescriptASTExpression;
    blockElse : AudescriptASTExpression;
    whiteBeforeExpr : string;
    whiteAfterExpr  : string;
    whiteBeforeIf   : string;
    whiteAfterIf    : string;
    whiteBeforeElse : string;
    whiteAfterElse  : string;

    constructor(lexer : AudescriptLexer, expr : AudescriptASTExpression, blockIf : AudescriptASTExpression, blockElse : AudescriptASTExpression) {
        super(lexer);

        this.whiteBefore += (expr.whiteAfter  === " " ? "" : expr.whiteAfter);
        this.whiteAfterExpr = expr.whiteAfter;
        expr.whiteBefore = expr.whiteAfter = "";
        this.whiteBeforeIf = blockIf.whiteBefore;
        this.whiteAfterIf = blockIf.whiteAfter;
        blockIf.whiteBefore = blockIf.whiteAfter = "";
        this.whiteBeforeElse = blockElse.whiteBefore;
        this.whiteAfter += (blockElse.whiteAfter === " " ? "" : blockElse.whiteAfter);
        blockElse.whiteBefore = blockElse.whiteAfter = "";

        this.expr      = expr;
        this.blockIf   = blockIf;
        this.blockElse = blockElse;
    }

    toJS() : SourceNode {
        var needParen = AudescriptASTStatement.needParentheses(this.expr);
        return this.sourceNode([
            (needParen ? "(" : ""), this.expr.toJS(), (needParen ? ")" : "") +
            (this.whiteAfterExpr || " ")  + "?" + (this.whiteBeforeIf || " "), this.blockIf.toJS(), (this.whiteAfterIf || " ") + ":" +
            (this.whiteBeforeElse || " "), this.blockElse.toJS()
        ]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.blockIf.setAudescriptVar(v);
        this.blockElse.setAudescriptVar(v);
        this.expr.setAudescriptVar(v);
    }
}

class AudescriptASTIf extends AudescriptASTExpression implements AudescriptASTInitialWhite {
    unless    : boolean;
    expr      : AudescriptASTExpression;
    blockIf   : AudescriptASTStatement;
    blockElse : AudescriptASTStatement;
    whiteBeforeExpr : string;
    whiteAfterExpr  : string;

    constructor(lexer : AudescriptLexer, unless : boolean, expr : AudescriptASTExpression, blockIf : AudescriptASTStatement, blockElse : AudescriptASTStatement) {
        super(lexer);

        this.unless = unless;
        this.whiteBeforeExpr = expr.whiteBefore;
        this.whiteAfterExpr  = expr.whiteAfter;
        expr.whiteBefore = expr.whiteAfter = "";

        this.expr      = expr;
        this.blockIf   = blockIf;
        this.blockElse = blockElse;
    }

    toJS() : SourceNode {
        let expr : (SourceNode | string)[] = (
            this.unless ? ["!(", this.expr.toJS(), ")"] : [this.expr.toJS()]
        );

        let res : (SourceNode | string)[] = (
            (<(SourceNode | string)[]> ["if" + this.whiteBeforeExpr + "("])
            .concat(expr)
            .concat([")" + (this.whiteAfterExpr || " ") + "{", this.blockIf.toJS(), "}"])
        );

        if (this.blockElse) {
            if (this.blockElse instanceof AudescriptASTIf) {
                res = res.concat([" else", this.blockElse.toJS()]);
            } else {
                res = res.concat([" else {", this.blockElse.toJS(), "}"]);
            }
        }

        return this.sourceNode(res);
    }

    setInitialWhite(white : string) : void {
        this.whiteBeforeExpr = this.whiteBeforeExpr + white;
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.blockIf.setAudescriptVar(v);

        if (this.blockElse) {
            this.blockElse.setAudescriptVar(v);
        }

        this.expr.setAudescriptVar(v);
    }
}

class AudescriptASTTry extends AudescriptASTExpression implements AudescriptASTInitialWhite {
    blockTry     : AudescriptASTStatement;
    blockCatch   : AudescriptASTStatement;
    blockFinally : AudescriptASTStatement;
    exc          : AudescriptASTIdentifier;
    whiteBeforeExc : string;
    whiteAfterExc  : string;

    constructor(lexer : AudescriptLexer, blockTry : AudescriptASTStatement, blockCatch : AudescriptASTStatement, exc : AudescriptASTIdentifier, blockFinally : AudescriptASTStatement) {
        super(lexer);

        if (exc) {
            this.whiteBeforeExc = exc.whiteBefore;
            this.whiteAfterExc  = exc.whiteAfter;
            exc.whiteBefore = exc.whiteAfter = "";
        }

        this.blockTry     = blockTry;
        this.blockCatch   = blockCatch;
        this.blockFinally = blockFinally;
        this.exc          = exc;
    }

    toJS() : SourceNode {
        let s = [
            "try {", this.blockTry.toJS(), "}"
        ];

        if (this.blockCatch) {
            [].push.call(s, " catch" + this.whiteBeforeExc + "(", this.exc.toJS(), ") {" + this.whiteAfterExc, this.blockCatch.toJS(), "}");
        }

        if (this.blockFinally) {
            [].push.call(s, " finally {", this.blockFinally.toJS(), "}");
        }

        return this.sourceNode(s);
    }

    setInitialWhite(white : string) : void {
        this.blockTry.prependWhite(white);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.blockTry.setAudescriptVar(v);

        if (this.blockCatch) {
            this.blockCatch.setAudescriptVar(v);
            this.exc.setAudescriptVar(v);
        }

        if (this.blockFinally) {
            this.blockFinally.setAudescriptVar(v);
        }

    }
}

class AudescriptASTBreak extends AudescriptASTStatement implements AudescriptASTInitialWhite {
    constructor(lexer : AudescriptLexer) {
        super(lexer);
    }

    toJS() : SourceNode {
        return this.sourceNode(["break"]);
    }

    setInitialWhite(w : string) : void {
        this.whiteAfter = w + this.whiteAfter;
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
    }
}

class AudescriptASTContinue extends AudescriptASTStatement implements AudescriptASTInitialWhite {
    constructor(lexer : AudescriptLexer) {
        super(lexer);
    }

    toJS() : SourceNode {
        return this.sourceNode(["continue"]);
    }

    setInitialWhite(w : string) : void {
        this.whiteAfter = w + this.whiteAfter;
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
    }
}

class AudescriptASTNumber extends AudescriptASTExpression {
    strNumber : string;

    constructor(lexer : AudescriptLexer, strNumber : string) {
        super(lexer);
        this.strNumber = strNumber;
    }

    toJS() : SourceNode {
        return this.sourceNode([this.strNumber]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
    }
}

class AudescriptASTString extends AudescriptASTExpression {
    strString : string;

    constructor(lexer : AudescriptLexer, strString : string) {
        super(lexer);
        this.strString = strString;
    }

    toJS() : SourceNode {
        return this.sourceNode([this.strString]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
    }
}

class AudescriptASTRegexp extends AudescriptASTExpression {
    regexp : string;

    constructor(lexer : AudescriptLexer, regexp : string) {
        super(lexer);
        this.regexp = regexp;
    }

    toJS() : SourceNode {
        return this.sourceNode([this.regexp]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
    }
}

class AudescriptASTIdentifier extends AudescriptASTExpression {
    identifier : string;

    constructor(lexer : AudescriptLexer, identifier : string) {
        super(lexer);
        this.identifier = identifier;
    }

    toJS() : SourceNode {
        return this.sourceNode([this.identifier]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
    }
}

class AudescriptASTChar extends AudescriptASTExpression {
    strChar : string;

    constructor(lexer : AudescriptLexer, strChar : string) {
        super(lexer);
        this.strChar = strChar;
    }

    toJS() : SourceNode {
        return this.sourceNode([this.strChar]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
    }
}

class AudescriptASTBool extends AudescriptASTExpression {
    b : string;

    constructor(lexer : AudescriptLexer, b : string) {
        super(lexer);
        this.b = b;
    }

    toJS() : SourceNode {
        return this.sourceNode([this.b]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
    }
}

class AudescriptASTForeach extends AudescriptASTStatement implements AudescriptASTInitialWhite {
    initialWhite : string;

    expr     : AudescriptASTExpression;
    iterated : AudescriptASTExpression;
    block    : AudescriptASTStatement;
    whiteAfterExpr  : string;

    constructor(lexer : AudescriptLexer, expr : AudescriptASTExpression, iterated : AudescriptASTExpression, block : AudescriptASTStatement) {
        super(lexer);

        this.whiteAfterExpr  = iterated.whiteAfter;
        iterated.whiteAfter = "";

        this.expr     = expr;
        this.iterated = iterated;
        this.block    = block;
    }

    setInitialWhite(white : string) : void {
        this.expr.prependWhite(white);
    }

    toJS() {
        let expr = (
            (this.expr instanceof AudescriptASTBracketParenBrace)
                ? (<AudescriptASTBracketParenBrace> this.expr).toJS("", "", true)
                : this.expr.toJS()
        );

        return this.sourceNode([
            "for (let", expr, "of", this.iterated.toJS(), ")" + (this.whiteAfterExpr || " ") + "{",
            this.block.toJS(), "}"
        ]);
    }
    //FIXME destructuration while iterating over Set

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.expr.setAudescriptVar(v);
        this.iterated.setAudescriptVar(v);
        this.block.setAudescriptVar(v);
    }
}

class AudescriptASTFor extends AudescriptASTStatement implements AudescriptASTInitialWhite {
    initialWhite : string;

    identifier      : AudescriptASTIdentifier;
    begin           : AudescriptASTExpression;
    end             : AudescriptASTExpression;
    step            : AudescriptASTExpression;
    block           : AudescriptASTStatement;
    whiteBeforeId   : string;
    whiteAfterId    : string;
    whiteAfterBegin : string;
    whiteBeforeEnd  : string;
    whiteAfterEnd   : string;
    whiteBeforeStep : string;
    whiteAfterStep  : string;

    constructor(lexer : AudescriptLexer, identifier : AudescriptASTIdentifier, begin : AudescriptASTExpression, end : AudescriptASTExpression, step : AudescriptASTExpression, block : AudescriptASTStatement ) {
        super(lexer);
        this.whiteAfterId      = identifier.whiteAfter;
        this.whiteBeforeId     = identifier.whiteBefore;
        this.whiteAfterBegin   = begin.whiteAfter === " " ? "" : begin.whiteAfter;
        this.whiteBeforeEnd    = end.whiteBefore;
        this.whiteAfterEnd     = end.whiteAfter;
        this.whiteBeforeStep   = step.whiteBefore;
        this.whiteAfterStep    = step.whiteAfter;
        identifier.whiteBefore = "";
        identifier.whiteAfter  = "";
        begin.whiteAfter       = "";
        end.whiteBefore        = "";
        end.whiteAfter         = "";
        step.whiteAfter        = "";
        step.whiteBefore       = "";

        this.identifier = identifier;
        this.begin      = begin;
        this.end        = end;
        this.step       = step;
        this.block      = block;
    }

    setInitialWhite(white : string) : void {
        this.whiteBeforeId = white + this.whiteBeforeId;
    }

    toJS() : SourceNode {
        let id = this.identifier.toJS();
        let end = this.end.toJS();
        let step = this.step.toJS();
        let fastEnd  = AudescriptASTStatement.fastAndConst(this.end)  && end.toString().indexOf("\n")  === -1;
        let fastStep = AudescriptASTStatement.fastAndConst(this.step) && step.toString().indexOf("\n") === -1;
        let used = null;

        if (!fastEnd || !fastStep) {
            used = AudescriptASTStatement.getUsedIdentifiers(this.block);
            used.push(this.identifier.identifier);
        }

        let genEnd  : string | SourceNode = end;
        let genStep : string | SourceNode = step;

        if (!fastEnd) {
            genEnd = AudescriptASTStatement.newIdentifier(used, "e");
            used.push(genEnd);
        }

        if (!fastStep) {
            genStep = AudescriptASTStatement.newIdentifier(used, "s");
            used.push(genStep);
        }

        let stepValue = AudescriptASTStatement.staticEvalNum(this.step);
        let stepSign = isNaN(stepValue) ? "?" : (stepValue < 0 ? "-" : "+");

        return this.sourceNode(
            [
                "for (let" + (this.whiteBeforeId || " "), id, (this.whiteAfterId || " ") + "=",
                this.begin.toJS()
            ].concat(
                fastEnd
                    ? [ this.whiteAfterBegin ]
                    : [
                        "," + (this.whiteAfterBegin || " ") + genEnd + " =" + (this.whiteBeforeEnd || " "),
                        end,
                        this.whiteAfterEnd === " " ? "" : this.whiteAfterEnd
                    ]
            ).concat(
                fastStep
                    ? []
                    : [
                        ", " + genStep + " =" + (this.whiteBeforeStep || " "),
                        step
                    ]
            ).concat([";"]).concat(
                stepSign === "+"
                    ? [(fastEnd ? this.whiteBeforeEnd : ""), id, " <= ", genEnd]
                    : (
                        stepSign === "-"
                            ? [(fastEnd ? this.whiteBeforeEnd : ""), id, " >= ", genEnd]
                            : [
                                " ", genStep, " < 0" + ((fastEnd ? this.whiteBeforeEnd : "") || " ") + "? ",
                                        id, " >= ", genEnd, " : ",
                                        id, " <= ", genEnd
                            ]
                    )
            ).concat(["; ",
                id, " +=", (fastStep ? this.whiteBeforeStep : "") || " ", genStep, ")",
                (fastStep ? this.whiteBeforeStep : " ") || " ", (this.whiteAfterStep === " " ? "" : this.whiteAfterStep), "{",
                this.block.toJS(), "}"
            ])
        );
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.identifier.setAudescriptVar(v);
        this.begin.setAudescriptVar(v);
        this.end.setAudescriptVar(v);
        this.step.setAudescriptVar(v);
        this.block.setAudescriptVar(v);
    }
}

class AudescriptASTWhile extends AudescriptASTStatement implements AudescriptASTInitialWhite {
    expr : AudescriptASTExpression;
    block : AudescriptASTStatement;
    whiteBeforeExpr : string;
    whiteAfterExpr  : string;
    until : boolean;

    constructor(lexer : AudescriptLexer, expr : AudescriptASTExpression, until : boolean, block : AudescriptASTStatement) {
        super(lexer);
        this.whiteBeforeExpr = expr.whiteBefore;
        this.whiteAfterExpr  = expr.whiteAfter;
        expr.whiteBefore = expr.whiteAfter = "";

        this.until = until;
        this.expr = expr;
        this.block = block;
    }

    setInitialWhite(white : string) : void {
        this.whiteBeforeExpr = white + this.whiteBeforeExpr;
    }

    toJS() : SourceNode {
        return this.sourceNode([
            "while" + this.whiteBeforeExpr + "(" + (this.until ? "!(" : ""), this.expr.toJS(), (this.until ? ")" : "") + ")" + (this.whiteAfterExpr || " ") + "{", this.block.toJS(), "}"
        ]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.expr.setAudescriptVar(v);
        this.block.setAudescriptVar(v);
    }
}

class AudescriptASTDoWhile extends AudescriptASTStatement implements AudescriptASTInitialWhite {
    block : AudescriptASTStatement;
    expr : AudescriptASTExpression;
    whiteBeforeExpr : string;
    whiteAfterExpr  : string;
    until : boolean;

    constructor(lexer : AudescriptLexer, block : AudescriptASTStatement, until : boolean, expr : AudescriptASTExpression) {
        super(lexer);
        this.block = block;
        this.expr = expr;
        this.until = until;
        this.whiteBeforeExpr = expr.whiteBefore;
        this.whiteAfterExpr  = expr.whiteAfter;
        expr.whiteBefore = expr.whiteAfter = "";
   }

    setInitialWhite(white : string) : void {
        this.block.prependWhite(white);
    }

    toJS() : SourceNode {
        return this.sourceNode([
            "do {", this.block.toJS(), "} while" + this.whiteBeforeExpr + "(",  (this.until ? "!(" : "") + this.expr.toJS(),  (this.until ? ")" : "") + ")" + (this.whiteAfterExpr === " " ? "" : this.whiteAfterExpr)
        ]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.expr.setAudescriptVar(v);
        this.block.setAudescriptVar(v);
    }
}

class AudescriptASTRepeatForever extends AudescriptASTStatement implements AudescriptASTInitialWhite {
    initialWhite : string;
    block : AudescriptASTStatement;

    constructor(lexer : AudescriptLexer, block : AudescriptASTStatement) {
        super(lexer);
        this.block = block;
    }

    setInitialWhite(white : string) : void {
        this.initialWhite = AudescriptASTStatement.commentToJS(white);
    }

    toJS() : SourceNode {
        return this.sourceNode([
            "while", this.initialWhite, "(true) {", this.block.toJS(), "}"
        ]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.block.setAudescriptVar(v);
    }
}

class AudescriptASTRepeatTimes extends AudescriptASTStatement implements AudescriptASTInitialWhite {
    expr  : AudescriptASTExpression;
    block : AudescriptASTStatement;
    whiteBeforeExpr : string;
    whiteAfterExpr  : string;

    constructor(lexer : AudescriptLexer, expr : AudescriptASTExpression, block : AudescriptASTStatement) {
        super(lexer);
        this.whiteBeforeExpr = expr.whiteBefore;
        this.whiteAfterExpr  = expr.whiteAfter;
        expr.whiteBefore = expr.whiteAfter = "";
        this.block = block;
        this.expr = expr;
    }

    setInitialWhite(white : string) : void {
        this.expr.prependWhite(white);
    }

    toJS() : SourceNode {
        let identifiers = AudescriptASTStatement.getUsedIdentifiers(this.block);
        let id1 = AudescriptASTStatement.newIdentifier(identifiers);
        identifiers.push(id1);

        let initN : (SourceNode | string)[] = [""], nExpr : (SourceNode | string) = this.expr.toJS();
        if (
            !AudescriptASTStatement.fastAndConst(this.expr) ||
            AudescriptASTStatement.getIdentifier(this.expr)
        ) {
            let id2 = " " + AudescriptASTStatement.newIdentifier(identifiers);
            initN = [id2 + " =" + this.whiteBeforeExpr, nExpr, ","];
            nExpr = id2;
        }

        let forLet : (SourceNode | string)[] = ["for (let"];
        return this.sourceNode(
            forLet.concat(initN).concat([
                " " + id1 + " = 0; " + id1 + " <", nExpr, ";" + this.whiteAfterExpr + id1, "++) {",
                this.block.toJS(), "}"
            ])
        );
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.expr.setAudescriptVar(v);
        this.block.setAudescriptVar(v);
    }
}

class AudescriptASTFunction extends AudescriptASTExpression {
    isProcedure : boolean;
    funName : AudescriptASTIdentifier;
    params : AudescriptASTParen;
    block : AudescriptASTStatement;

    constructor(lexer : AudescriptLexer, isProcedure : boolean, id : AudescriptASTIdentifier, params : AudescriptASTParen, block : AudescriptASTStatement) {
        super(lexer);
        this.isProcedure = isProcedure;
        this.funName = id;
        this.params = params;
        this.block = block;
    }

    setInitialWhite(white : string) : void {
        if (this.funName) {
            this.funName.prependWhite(white)
        } else {
            this.params.prependWhite(white)
        }
    }

    toJS() : SourceNode {
        return this.sourceNode([
            "function" + (this.funName ? this.funName.toJS() : "") +
            this.params.toJS() + " {" + this.block.toJS() + "}"
        ]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;

        if( this.funName) {
            this.funName.setAudescriptVar(v);
        }

        this.params.setAudescriptVar(v);
        this.block.setAudescriptVar(v);
    }
}

class AudescriptASTComposition extends AudescriptASTStatement {
    left    : AudescriptASTStatement;
    right   : AudescriptASTStatement;
    whiteAfterLeft : string;

    constructor(lexer : AudescriptLexer, left : AudescriptASTExpression, right : AudescriptASTExpression) {
        super(lexer);

        if (!(right instanceof AudescriptASTComposition || right instanceof AudescriptASTNullStatement)) {
            throw Error("BUG: second element of a AST composition node should be an ast composition or null node");
        }

        AudescriptASTStatement.checkNotInfixedOpNotAssignement(left);

        if (
            (
                left instanceof AudescriptASTBreak  ||
                left instanceof AudescriptASTReturnThrow ||
                left instanceof AudescriptASTContinue
            ) && !(right instanceof AudescriptASTNullStatement)
        ) {
            lexer.parseError(
                _("Unreachable code after a break or a return statement")
            )
        }

        this.whiteAfterLeft = left.whiteAfter;
        left.whiteAfter = "";

        this.left = left;
        this.right = right;
    }

    toJS() : SourceNode {
        return this.sourceNode([this.left.toJS(), (
            AudescriptASTStatement.needsSemicolon(this.left) ? ";" : ""
        ), this.whiteAfterLeft, this.right.toJS()]); //TODO check JS's automatic semicolon insertion
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.left.setAudescriptVar(v);
        this.right.setAudescriptVar(v);
    }
}

class AudescriptASTInfixedOp extends AudescriptASTExpression {
    left    : AudescriptASTExpression;
    op      : string;
    right   : AudescriptASTExpression;

    static operatorsToJS = {
        "and": "&&",
        "or": "||",
        "not": "!",
        "is not":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                if (right.toString().trim() === "empty") {
                    return [leftlspace, "!" + a + ".e(", left, (leftrspace === " " ? "" : leftrspace) + (rightlspace === " " ? "" : rightlspace) + ")", rightrspace];
                } else {
                    return [leftlspace, left, leftrspace + "!==" + rightlspace, right, rightrspace];
                }
            },
        "is":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                if (right.toString().trim() === "empty") {
                    return [leftlspace, a + ".e(", left, (leftrspace === " " ? "" : leftrspace) + (rightlspace === " " ? "" : rightlspace) + ")", rightrspace];
                } else {
                    return [leftlspace, left, leftrspace + "===" + rightlspace, right, rightrspace];
                }
            },
        ":=": "=",
        "!=":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return ([
                    leftlspace, "!",
                    AudescriptASTInfixedOp.operatorsToJS["="](a, left, right, "", leftrspace, rightlspace, ""),
                    rightrspace
                ]);
            },
        "/=":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return AudescriptASTInfixedOp.operatorsToJS["!="](a, left, right, leftlspace, leftrspace, rightlspace, rightrspace);
            },
        "<>":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return AudescriptASTInfixedOp.operatorsToJS["!="](a, left, right, leftlspace, leftrspace, rightlspace, rightrspace);
            },
        "=":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".eq(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },
        "U":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".U(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },
        "U=":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".Ui(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },
        "union":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".U(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },
        "inter":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".I(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },
        "cross":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".X(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },

        "symdiff":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".symDiff(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },

        "minus":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".M(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },
        "\\":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".M(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },
        "sym diff":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".sd(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },
        "does not contain":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return ([
                    leftlspace, "!",
                    AudescriptASTInfixedOp.operatorsToJS["contains"](a, left, right, "", leftrspace, rightlspace, ""),
                    rightrspace
                ]);
            },
        "not subset of":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return ([
                    leftlspace, "!",
                    AudescriptASTInfixedOp.operatorsToJS["subset of"](a, left, right, "", leftrspace, rightlspace, ""),
                    rightrspace
                ]);
            },
        "not element of":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return ([
                    leftlspace, "!",
                    AudescriptASTInfixedOp.operatorsToJS["element of"](a, left, right, "", leftrspace, rightlspace, ""),
                    rightrspace
                ]);
            },
        "does not belong to":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return ([
                    leftlspace, "!",
                    AudescriptASTInfixedOp.operatorsToJS["belongs to"](a, left, right, "", leftrspace, rightlspace, ""),
                    rightrspace
                ]);
            },
        "not in":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return ([
                    leftlspace, "!",
                    AudescriptASTInfixedOp.operatorsToJS["in"](a, left, right, "", leftrspace, rightlspace, ""),
                    rightrspace
                ]);
            },
        "contains":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace :   string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".ct(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },
        "subset of":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".subsetof(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },
        "element of":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".ict(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },
        "belongs to":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".ict(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")" + rightrspace];
            },
        "in":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, a + ".has(", left, (leftrspace === " " ? "" : leftrspace) + "," + rightlspace, right, ")", rightrspace];
            },
        "call":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, left, leftrspace, rightlspace, right, rightrspace];
            },
        "index":
            function (a : string, left : SourceNode, right : SourceNode, leftlspace : string, leftrspace : string, rightlspace : string, rightrspace : string) {
                return [leftlspace, left, leftrspace, rightlspace, right, rightrspace];
            }
    };

    constructor(lexer : AudescriptLexer, left : AudescriptASTExpression, op : string, right : AudescriptASTExpression) {
        super(lexer);
        this.whiteBefore += left.whiteBefore;
        this.whiteAfter += right.whiteAfter;
        left.whiteBefore = right.whiteAfter = "";
        this.left = left;
        this.op = op;
        this.right = right;
    }

    toJS() : SourceNode {
        let res : (SourceNode | string)[];
        let left  : SourceNode;
        let right : SourceNode;

        let leftlspace = this.left.whiteBefore;
        let leftrspace = this.left.whiteAfter;
        this.left.whiteBefore = "";
        this.left.whiteAfter = "";
        let rightlspace = this.right.whiteBefore;
        let rightrspace = this.right.whiteAfter;
        this.right.whiteBefore = "";
        this.right.whiteAfter = "";

        if (AudescriptASTInfixedOp.operatorsToJS.hasOwnProperty(this.op)) {
            let op : (string | Function) = AudescriptASTInfixedOp.operatorsToJS[this.op];

            if (op instanceof Function) {
                res = op(this.audescriptVar[0], this.left.toJS(), this.right.toJS(), leftlspace, leftrspace, rightlspace, rightrspace);
            } else if (typeof op === "string") {
                if (AudescriptASTStatement.needParentheses(this.left, this)) {
                    res = [leftlspace + "(", this.left.toJS(), ")", leftrspace];
                } else if (this.left instanceof AudescriptASTBracketParenBrace) {
                    res = [leftlspace, (<AudescriptASTBracketParenBrace>this.left).toJS("", "", false), leftrspace];
                } else {
                    res = [leftlspace, this.left.toJS(), leftrspace];
                }

                res.push(op);

                if (AudescriptASTStatement.needParentheses(this.right, this)) {
                    res = res.concat([rightlspace + "(", this.right.toJS(), ")" + rightrspace]);
                } else {
                    res.push(rightlspace, this.right.toJS(), rightrspace);
                }
            }
        } else {
            if (AudescriptASTStatement.needParentheses(this.left, this)) {
                res = [leftlspace + "(", this.left.toJS(), ")" + leftrspace];
            } else {
                res = [leftlspace, this.left.toJS(), leftrspace];
            }

            res.push(this.op);

            if (AudescriptASTStatement.needParentheses(this.right, this)) {
                res = res.concat([rightlspace + "(", this.right.toJS(), ")" + rightrspace]);
            } else {
                res.push(rightlspace, this.right.toJS(), rightrspace);
            }
        }

        return this.sourceNode(res);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.left.setAudescriptVar(v);
        this.right.setAudescriptVar(v);
    }
}

class AudescriptASTPrefixedOp extends AudescriptASTExpression {
    expr    : AudescriptASTExpression;
    op      : string;

    constructor(lexer : AudescriptLexer, expr : AudescriptASTExpression, op : string) {
        super(lexer);
        this.expr = expr;
        this.op = op;
    }

    toJS() : SourceNode {
        let op = this.op;

        if (op === "not") {
            op = "!";
            if (this.expr.whiteBefore === " ") {
                this.expr.whiteBefore = "";
            }
        }

        return this.sourceNode([op, this.expr.toJS()]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.expr.setAudescriptVar(v);
    }
}

class AudescriptASTSuffixedOp extends AudescriptASTExpression {
    expr    : AudescriptASTExpression;
    op      : string;

    constructor(lexer : AudescriptLexer, expr : AudescriptASTExpression, op : string) {
        super(lexer);
        this.expr = expr;
        this.op = op;
    }

    toJS() : SourceNode {
        return this.sourceNode([this.expr.toJS(), this.op]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
        this.expr.setAudescriptVar(v);
    }
}

class AudescriptASTNullStatement extends AudescriptASTStatement {
    constructor(lexer : AudescriptLexer) {
        super(lexer);
    }

    toJS() : SourceNode {
        return this.sourceNode([""]);
    }

    setAudescriptVar(v : [string, string]) : void {
        this.audescriptVar = v;
    }
}

class audescriptParseError implements Error {
    public stack: any;
    public name: string;
    public message: string;

    constructor(message?: string) {
        this.name = "ParseError";
        this.message = message || "Parse error";
        this.stack = (<any>new Error(message)).stack;
    }
}

audescriptParseError.prototype.toString = Error.prototype.toString;

class audescriptUnexpectedEndParseError extends audescriptParseError {
    constructor(message?: string) {
        super(message || _("Unexpected end"));
        this.name = "UnexpectedEndParseError";
    }
}


function parseUnsignedNumber(lexer : AudescriptLexer) {
    var dotEncountered = false,
        begin = lexer.curPos();

    if (!lexer.end() && lexer.curChar() === "0") {
        lexer.nextChar();
        if (!lexer.end() && (lexer.curChar().toLowerCase() === "x")) {
            do {
                lexer.nextChar();
            } while ("0123456789ABCDEF_".indexOf(lexer.curChar().toUpperCase()) !== -1);
            return lexer.substringFrom(begin).replace(/_/g, "");
        }
    }

    while (
        !lexer.end()
        && (
            "0123456789_".indexOf(lexer.curChar()) !== -1
            || (!dotEncountered && lexer.curChar() === ".")
        )) {
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

function tryNumber(lexer : AudescriptLexer) {
    let sign = "";

    let state = lexer.getState();

    if (!lexer.end() && (lexer.curChar() === "-" || lexer.curChar() === "+")) {
        sign = lexer.nextChar();
    }

    if (!lexer.end() && "0123456789".indexOf(lexer.curChar()) !== -1) {
        return sign + parseUnsignedNumber(lexer).replace(/_/g, "");
    }

    lexer.restoreState(state);

    return "";
}

class AudescriptLexer {
    str        : string;
    i          : number;
    line       : number;
    column     : number;
    source     : string;
    moduleName : string;
//     lexer  : AudescriptLexer;

    constructor(str : string, moduleName : string, source : string, lexer? : AudescriptLexer) {
        if (lexer) {
            this.line       = lexer.line;
            this.column     = lexer.column;
            this.i          = lexer.i;
            this.str        = lexer.str;
            this.moduleName = lexer.moduleName;
            this.source     = lexer.source;
//             this.lexer = lexer;
        } else {
            this.str        = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
            this.line       = 1;
            this.column     = 1;
            this.i          = 0;
            this.moduleName = moduleName;
            this.source     = source;
//             this.lexer = null;
        }
    }

    getState() : AudescriptLexer {
        return new AudescriptLexer(this.str, this.moduleName , this.source, this);
    }

    restoreState(state : AudescriptLexer) : void {
        this.str    = state.str;
        this.i      = state.i;
        this.line   = state.line;
        this.column = state.column;
    }

    end() : boolean {
        return this.i >= this.str.length;
    }

    getWhite(newLineIsSignificant? : boolean) : string {
        let res = "";
        let begin = this.curPos();

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
    }

    nextChar() : string {
        if (this.end()) {
            this.unepexctedEnd();
        }

        if (this.str[this.i] === '\n') {
            this.line++;
            this.column = 0;
        }

        this.column++;

        return this.str[this.i++];
    }

    curChar() : string {
        if (this.end()) {
            this.unepexctedEnd();
        }
        return this.str[this.i];
    }

    curPos() : number {
        return this.i;
    }

    getLine() : number {
        return this.line;
    }

    getColumn() : number {
        return this.column;
    }

    substringFrom(begin : number) : string {
        return this.str.substring(begin, this.i);
    }

    getWord(drawEndAndQuotes : boolean = false) : string {
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
        } else {
            this.nextChar();
        }

        if (drawEndAndQuotes) {
            return '"' + this.substringFrom(begin) + '"';
        }

        return this.substringFrom(begin);
    }

    eat(str : string) : void {
        if (!this.tryEat(str, true)) {
            this.parseError(
                format(
                    _("Unexpected {0}, expecting {1}"),
                    "'" + this.getWord(true) + "'",
                    str
                )
            );
        }
    }

    tryEat(str : string, autoCheckAfter? : boolean) : boolean {
        // FIXME "end repeat" should match "end     repeat"

        if (this.i + str.length > this.str.length) {
            return false;
        }

        for (let i = 0; i < str.length; i++) {
            if (this.str[this.i + i].toLowerCase() !== str[i]) {
                return false;
            }
        }

        if (autoCheckAfter && this.i + str.length < this.str.length) {
            if (AudescriptParser.identifierPartChar.test(str[str.length - 1]) && AudescriptParser.identifierPartChar.test(this.str[this.i + str.length])) {
                return false;
            }
        }

        for (let i = 0; i < str.length; i++) {
            this.nextChar();
        }

        return true;
    }

    formatError(message? : string) : string {
        if (message) {
            return format(
                _("Parse error on line {0} column {1}: {2}"),
                this.getLine(),
                this.getColumn(),
                message
            );
        }

        return format(
            _("Parse error on line {0} column {1}"),
            this.getLine(),
            this.getColumn()
        );
    }

    parseError(message? : string) : void {
        throw new Error(
            this.formatError(message)
        );
    }

    unepexctedEnd(message? : string) : void {
        throw new audescriptUnexpectedEndParseError(
            this.formatError(message || _("Unexpected end"))
        );
    }
}

class AudescriptParser {
    lexer : AudescriptLexer;

    static EXPECT_WHILE_UNTIL : number = 1;

    static identifierStartChar : RegExp; // these two regular expressions
    static identifierPartChar  : RegExp; // are defined in audescript.identifier.js

    static prefixOperators = [ "++", "--", "not", "~", "typeof", "new", "u=" ];

    static suffixOperators = [ "++", "--"];

    static operators = [
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

    static keywords = [
        "not", "of", "to", "is", "until", "repeat", "times", "or", "and", "mod",
        "forever", "raise", "except", "break", "case", "class", "loop", "then",
        "to", "fi", "done", "except", "catch", "const", "continue", "debugger",
        "default", "delete", "do", "od", "else", "export", "extends", "finally",
        "for", "function", "if", "unless", "import", "in", "instanceof", "let",
        "new", "return", "super", "switch", "throw", "raise", "try", "typeof",
        "var", "void", "while", "with", "yield", "end", "foreach"
    ];
    // "this", "does", "contain", "subset", "element", "belongs", "contains",

    constructor(lexer : AudescriptLexer) {
        this.lexer = lexer;
    }

    parse() : AudescriptASTExpression {
        let state = this.lexer.getState();
        let res = this.parseStatement();
        res.appendWhite(this.lexer.getWhite());
        if (!this.lexer.end()) {
            this.lexer.parseError(
                format(
                    _("Unexpected {0}"),
                    this.lexer.getWord(true)
                )
            );
        }

        return new AudescriptASTRoot(
            state,
            res
        );
    }

    parseNumber() : AudescriptASTNumber {
        let state = this.lexer.getState();
        var numberStr = tryNumber(this.lexer);
        if (numberStr) {
            return new AudescriptASTNumber(state, numberStr)
        }
        return null;
    }

    parseChar() : AudescriptASTChar {
        if (!this.lexer.end() && this.lexer.curChar() === "'") {
            let state = this.lexer.getState();
            this.lexer.nextChar();

            if (this.lexer.curChar() === "\\") {
                this.lexer.nextChar();
                if (this.lexer.curChar() === "u") {
                    this.lexer.nextChar();
                    this.lexer.nextChar();
                    this.lexer.nextChar();
                    this.lexer.nextChar();
                } else if (this.lexer.curChar() === "x") {
                    this.lexer.nextChar();
                    this.lexer.nextChar();
                }
                //TODO check characters for \u and \x
            }

            this.lexer.nextChar();

            if (this.lexer.curChar() === "'") {
                this.lexer.nextChar();
                return new AudescriptASTChar(
                    state,
                    this.lexer.substringFrom(state.curPos())
                );
            } else {
                this.lexer.parseError(
                    format(
                        _("Unexpected \"{0}\", expecting \"{1}\""),
                        this.lexer.curChar(),
                        "'"
                    )
                );
                return null;
            }
        }

        return null;
    }

    parseIdentifier(allowKeyword : boolean = false) : AudescriptASTIdentifier {
        if (!this.lexer.end() && AudescriptParser.identifierStartChar.test(this.lexer.curChar())) {
            let state = this.lexer.getState();

            do {
                this.lexer.nextChar();
            } while (!this.lexer.end() && AudescriptParser.identifierPartChar.test(this.lexer.curChar()));

            let identifier = this.lexer.substringFrom(state.curPos());

            if (allowKeyword || AudescriptParser.keywords.indexOf(identifier) === -1) {
                if (!allowKeyword && identifier === "nil") {
                    identifier = "null";
                }

                return new AudescriptASTIdentifier(
                    state,
                    identifier
                );
            } else {
                this.lexer.restoreState(state);
            }
        }

        return null;
    }

    parseBool() : AudescriptASTBool {
        let state = this.lexer.getState();

        let b : string;

        if (this.lexer.tryEat("true")) {
            b = "true";
        } else if (this.lexer.tryEat("false")) {
            b = "false";
        } else {
            return null;
        }

        return new AudescriptASTBool(
            state,
            b
        );
    }

    parseEmptySet() : AudescriptASTBrace {
        let state = this.lexer.getState();

        if (this.lexer.tryEat("empty set") || this.lexer.tryEat("emptyset")) {
            return new AudescriptASTBrace(
                state,
                [],
                null,
                ""
            );
        }
    }

    parseEmptyObject() : AudescriptASTBrace {
        let state = this.lexer.getState();

        if (this.lexer.tryEat("empty object") || this.lexer.tryEat("emptyobj")) {
            return new AudescriptASTBrace(
                state,
                [],
                [],
                ""
            );
        }
    }

    parseRegexp() : AudescriptASTRegexp {
        if (!this.lexer.end() && this.lexer.curChar() === "/") {
            let state = this.lexer.getState();

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

            return new AudescriptASTRegexp(
                state,
                this.lexer.substringFrom(state.curPos())
            );
        }

        return null;
    }

    parseString() : AudescriptASTString {
        if (!this.lexer.end() && this.lexer.curChar() === '"') {
            let state = this.lexer.getState();
            this.lexer.nextChar();

            try {
                while (this.lexer.curChar() !== '"') {
                    if (this.lexer.curChar() === "\\") {
                        this.lexer.nextChar();
                    }
                    this.lexer.nextChar();
                    //TODO handle \u and \x
                }
                this.lexer.nextChar();
            } catch (e) {
                if (e instanceof audescriptUnexpectedEndParseError) {
                    this.lexer.unepexctedEnd(_("Unterminated string litteral"));
                } else {
                    throw e;
                }
            }

            return new AudescriptASTString(
                state,
                this.lexer.substringFrom(state.curPos())
            );
        }
        return null;
    }

    parseInsideParen(end : string, allowTuple : boolean = false) : [AudescriptASTExpression[], AudescriptASTExpression[], string, boolean] {
        let expectingComma = true;

        let expressions : AudescriptASTExpression[] = [];
        let values: AudescriptASTExpression[] = null;
        let white = "";

        let expectColon = false, dontExpectColon = false;

        do {
            this.lexer.nextChar();
            white = this.lexer.getWhite();

            if (this.lexer.curChar() === end) {
                break;
            }

            let subExpr = this.parseExpression(true);

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
                    this.lexer.parseError(
                        format(
                            _("Unexpected {0}, expecting {1}"),
                            this.lexer.getWord(true),
                            "':'"
                        )
                    );
                } else if (dontExpectColon && this.lexer.curChar() === ":") {
                    this.lexer.parseError(
                        format(
                            _("Unexpected {0}, expecting ',' or {1}"),
                            this.lexer.getWord(true),
                            "'" + end + "'"
                        )
                    );
                } else if (this.lexer.curChar() === ":") {
                    if (!expectColon) {
                        values = [];
                        expectColon = true;
                    }

                    this.lexer.nextChar();

                    white = this.lexer.getWhite();

                    subExpr = this.parseExpression(true);

                    if (!subExpr) {
                        this.lexer.parseError(
                            format(
                                _("Unexpected {0}, expecting an expression"),
                                this.lexer.getWord(true)
                            )
                        );
                        break;
                    }

                    subExpr.prependWhite(white);
                    white = "";

                    subExpr.appendWhite(this.lexer.getWhite());
                    values.push(subExpr);
                } else {
                    dontExpectColon = true;
                }
            }

            if (this.lexer.curChar() === ',') {
                expectingComma = false;
            }
        } while (this.lexer.curChar() === ',');

        let innerWhite = white;

        allowTuple = allowTuple && (!expressions.length || !expectingComma);

        if (this.lexer.curChar() !== end) {
            this.lexer.parseError(
                format(
                    expectingComma
                        ? _("Unexpected {0}, expecting ',' or {1}")
                        : _("Unexpected {0}, expecting {1}"),
                    this.lexer.getWord(true),
                    "'" + end + "'"
                )
            );
            return null;
        }

        this.lexer.nextChar();

        return [expressions, values, innerWhite, allowTuple];
    }

    parseParen() : AudescriptASTParen {
        if (this.lexer.curChar() === '(') {
            let state = this.lexer.getState();
            let [expressions, values, innerWhite, allowTuple] = this.parseInsideParen(')');

            return new AudescriptASTParen(
                state,
                false,
                expressions,
                innerWhite
            );
        }

        return null;
    }

    parseParenBracketBrace(allowTuple? : boolean) : AudescriptASTBracketParenBrace {
        if (this.lexer.end()) {
            return null;
        }

        let end : string;

        if (this.lexer.curChar() === '(') {
            end = ")";
        } else if (this.lexer.curChar() === '[') {
            end = "]";
        } else if (this.lexer.curChar() === '{') {
            end = "}";
        } else {
            return null;
        }

        let state = this.lexer.getState();

        let expressions, innerWhite, values;

        [expressions, values, innerWhite, allowTuple] = this.parseInsideParen(end, allowTuple);

        if (end === "]") {
            return new AudescriptASTBracket(
                state,
                expressions,
                innerWhite
            );
        } else if (end === ")") {
            return new AudescriptASTParen(
                state,
                allowTuple,
                expressions,
                innerWhite
            );
        } else {
            return new AudescriptASTBrace(
                state,
                expressions,
                values,
                innerWhite
            );
        }

        return null;
    }

    parseDestructuringExpression() : AudescriptASTExpression {
        let expr = this.parseParenBracketBrace() || this.parseIdentifier();
//         AudescriptASTStatement.checkDestructuringExpression(expr); FIXME
        return expr;
    }

    parseForeach(state : AudescriptLexer) : AudescriptASTForeach {
        let expr = this.parseDestructuringExpression();
        expr.appendWhite(this.lexer.getWhite());

        this.lexer.eat("in");

        let iterated = this.expectExpression(true);
        iterated.appendWhite(this.lexer.getWhite());

        this.lexer.eat("do");

        let block = this.parseStatement();
        block.appendWhite(this.lexer.getWhite());

        let ended = (
            this.lexer.tryEat("end loop", true)    ||
            this.lexer.tryEat("end do", true)      ||
            this.lexer.tryEat("end foreach", true) ||
            this.lexer.tryEat("end for", true)     ||
            this.lexer.tryEat("od", true)          ||
            this.lexer.tryEat("done", true)
        );

        return new AudescriptASTForeach(
            state,
            expr,
            iterated,
            block
        )
    }

    parseFor(state : AudescriptLexer) : AudescriptASTFor {
        let identifier = this.parseIdentifier();

        if (!identifier) {
            this.lexer.parseError(
                format(
                    _("Unexpected {0}, expecting an identifier"),
                    this.lexer.getWord(true)
                )
            );
        }

        identifier.appendWhite(this.lexer.getWhite());

        this.lexer.eat("from");

        let begin = this.expectExpression(true);
        begin.appendWhite(this.lexer.getWhite());

        this.lexer.eat("to");

        let end = this.expectExpression(true);
        end.appendWhite(this.lexer.getWhite());

        let step : AudescriptASTExpression;

        if (this.lexer.tryEat("step") || this.lexer.tryEat("step")) {
            step = this.expectExpression(true);
            step.appendWhite(this.lexer.getWhite());
        } else {
            step = new AudescriptASTNumber(this.lexer.getState(), "1");
            step.prependWhite(" ");
            step.appendWhite(" ");
        }

        this.lexer.eat("do");

        let block = this.parseStatement();
        block.appendWhite(this.lexer.getWhite());

        let ended = (
            this.lexer.tryEat("end loop", true)    ||
            this.lexer.tryEat("end do", true)      ||
            this.lexer.tryEat("end for", true)     ||
            this.lexer.tryEat("od", true)          ||
            this.lexer.tryEat("done", true)
        );

        if (!ended) {
            state.parseError(
                _("Could not find the end of this loop. The loop must be ended by 'done', 'end for', 'end loop', 'end do' or 'od'")
            );
        }

        return new AudescriptASTFor(
            state,
            identifier,
            begin,
            end,
            step,
            block
        );
    }

    parseWhile(state : AudescriptLexer, flags : number, isUntil? : boolean) : AudescriptASTWhile {
        let expr = this.expectExpression(true);
        expr.appendWhite(this.lexer.getWhite());

        try {
            this.lexer.eat("do");
        } catch (e) {
            if (flags & AudescriptParser.EXPECT_WHILE_UNTIL) {
                return null;
            } else {
                throw e;
            }
        }

        let block = this.parseStatement();
        block.appendWhite(this.lexer.getWhite());

        let ended = (
            this.lexer.tryEat("end loop", true)  ||
            this.lexer.tryEat("end do", true)    ||
            (isUntil
                ? this.lexer.tryEat("end until", true)
                : this.lexer.tryEat("end while", true)
            )                                    ||
            this.lexer.tryEat("od", true)        ||
            this.lexer.tryEat("done", true)
        );

        if (isUntil) {
            if (!ended) {
                state.parseError(
                    _("Could not find the end of this loop. The loop must be ended by 'done', 'end until', 'end loop', 'od' or 'end do'")
                );
            }

            return new AudescriptASTWhile(state, expr, true, block);
        }

        if (!ended) {
            state.parseError(
                _("Could not find the end of this loop. The loop must be ended by 'done', 'end while', 'end loop', 'od' or 'end do'")
            );
        }

        return new AudescriptASTWhile(state, expr, false, block);
    }

    parseDoWhile(state : AudescriptLexer) : AudescriptASTInitialWhite {
        let block = this.parseStatement(AudescriptParser.EXPECT_WHILE_UNTIL);

        block.appendWhite(this.lexer.getWhite());

        let keyworddIsUntil : boolean;

        if (this.lexer.tryEat("while", true)) {
            keyworddIsUntil = false;
        } else if (this.lexer.tryEat("until")) {
            keyworddIsUntil = true;
        } else {
            this.lexer.parseError(
                format(
                    _("Unexpected {0}, expecting 'while' or 'until'"),
                    this.lexer.getWord(true)
                )
            );
        }

        let white = this.lexer.getWhite();

        let expr = this.expectExpression(false);
        expr.prependWhite(white);

        return new AudescriptASTDoWhile(
            state,
            block,
            keyworddIsUntil,
            expr
        );
    }

    parseRepeat(state : AudescriptLexer) : AudescriptASTInitialWhite {
        if (this.lexer.curChar() === "\n") {
            return this.parseDoWhile(state);
        }

        if (this.lexer.tryEat("forever")) {
            let block = this.parseStatement();
            block.appendWhite(this.lexer.getWhite());

            if (!this.lexer.tryEat("end repeat") && !this.lexer.tryEat("end loop")) {
                state.parseError(
                    _("Could not find the end of this loop. The loop must be ended by 'end repeat' or 'end loop'")
                );
            }

            return new AudescriptASTRepeatForever(
                state,
                block
            );
        }

        let expr = this.expectExpression(true);
        expr.appendWhite(this.lexer.getWhite());

        this.lexer.eat("times");

        let block = this.parseStatement();
        block.appendWhite(this.lexer.getWhite());

        if (!this.lexer.tryEat("end repeat") && !this.lexer.tryEat("end loop")) {
            state.parseError(
                _("Could not find the end of this loop. The loop must be ended by 'end repeat' or 'end loop'")
            );
        }

        return new AudescriptASTRepeatTimes(
            state,
            expr,
            block
        );
    }

    parseUntil(state : AudescriptLexer, flags : number) : AudescriptASTWhile {
        return this.parseWhile(state, flags, true);
    }

    parseFunction(state : AudescriptLexer, isProcedure? : boolean) : AudescriptASTFunction {
        let id = this.parseIdentifier();

        if (id) {
            id.appendWhite(this.lexer.getWhite());
        }

        let params = this.parseParen();
        if (!params) {
            // should never happen
            this.lexer.parseError(
                format(
                    _("Unexpected {0}, expecting parameter list"),
                    this.lexer.getWord(true)
                )
            );
        }

        let block = this.parseStatement();
        block.appendWhite(this.lexer.getWhite());

        this.lexer.eat(isProcedure ? "end procedure" : "end function");

        return new AudescriptASTFunction(
            state,
            isProcedure,
            id,
            params,
            block
        );
    }

    parseProcedure(state : AudescriptLexer) : AudescriptASTFunction {
        return this.parseFunction(state, true);
    }

    tryParseFunction() : AudescriptASTFunction {
        let state = this.lexer.getState();
        let isProcedure = false;
        if (this.lexer.tryEat("function")) {
            isProcedure = false;
        } else if (this.lexer.tryEat("procedure")) {
            isProcedure = true;
        } else {
            return null;
        }

        let white = this.lexer.getWhite(true);

        let res = this.parseFunction(state, isProcedure);
        res.setInitialWhite(white);
        return res;
    }

    parseBreak(state : AudescriptLexer) : AudescriptASTBreak {
        return new AudescriptASTBreak(state);
    }

    parseContinue(state : AudescriptLexer) : AudescriptASTContinue {
        return new AudescriptASTContinue(state);
    }

    expectExpression(insideExpression : boolean) : AudescriptASTExpression {
        let res = this.parseExpression(insideExpression);
        if (!res) {
            this.lexer.parseError(
                _("Expecting expression")
            );
        }

        return res;
    }

    parseReturnThrow(state : AudescriptLexer, keyword : string) : AudescriptASTReturnThrow {
        if (this.lexer.end() || this.lexer.curChar() === "\n") {
            if (keyword === "throw") {
                this.lexer.parseError(
                    _("Expecting an expression after throw")
                );
            }
            return new AudescriptASTReturnThrow(state, keyword, null);
        }
        return new AudescriptASTReturnThrow(state, keyword, this.expectExpression(false));
    }

    parseLet(state : AudescriptLexer, keyword : string) : AudescriptASTDecl {
        let declared = this.parseDestructuringExpression();
        declared.appendWhite(this.lexer.getWhite());

        this.lexer.eat(":=");

        let expr = this.expectExpression(false);

        return new AudescriptASTDecl(
            state,
            keyword,
            declared,
            expr
        );
    }

    parseTernary() : AudescriptASTTernary {
        let state = this.lexer.getState();

        if (!this.lexer.tryEat("if")) {
            return null;
        }

        let expr = this.expectExpression(true);
        expr.appendWhite(this.lexer.getWhite());

        this.lexer.eat("then");

        let blockIf = this.expectExpression(true);
        blockIf.appendWhite(this.lexer.getWhite());

        this.lexer.eat("else");

        let blockElse = this.expectExpression(true);
        blockElse.appendWhite(this.lexer.getWhite());

        return new AudescriptASTTernary(
            state,
            expr,
            blockIf,
            blockElse
        );
    }

    parseIf(state : AudescriptLexer, unless : boolean = false) : AudescriptASTIf {
        let expr = this.expectExpression(true);
        expr.appendWhite(this.lexer.getWhite());

        this.lexer.eat("then");

        let blockIf = this.parseStatement();
        blockIf.appendWhite(this.lexer.getWhite());

        let blockElse : AudescriptASTStatement = null;

        if (!unless && this.lexer.tryEat("else")) {
            let whiteBefore = this.lexer.getWhite(true);
            if (this.lexer.tryEat("if")) {
                let white = this.lexer.getWhite();
                let state2 = this.lexer.getState();

                let newIf = this.parseIf(state2);
                newIf.prependWhite(whiteBefore);
                newIf.setInitialWhite(white);
                return new AudescriptASTIf(
                    state,
                    false,
                    expr,
                    blockIf,
                    newIf
                );
            }

            blockElse = this.parseStatement();
            blockElse.appendWhite(this.lexer.getWhite());
        }

        if (unless) {
            this.lexer.eat("end unless");
        } else if (!this.lexer.tryEat("fi") && !this.lexer.tryEat("end if")) {
            state.parseError(
                _("Could not find the end of this if statement. The if statement must be ended by 'fi' or 'end if'")
            );
        }

        return new AudescriptASTIf(
            state,
            unless,
            expr,
            blockIf,
            blockElse
        );
    }

    parseTry(state : AudescriptLexer) : AudescriptASTTry {
        let blockTry = this.parseStatement();
        let blockCatch   : AudescriptASTStatement  = null;
        let exc          : AudescriptASTIdentifier = null;
        let blockFinally : AudescriptASTStatement  = null;

        if (this.lexer.tryEat("catch") || this.lexer.tryEat("except")) {
            let white = this.lexer.getWhite();
            exc = this.parseIdentifier();

            if (!exc) {
                this.lexer.parseError(
                    format(
                        _("Unexpected {0}, expecting an identifier"),
                        this.lexer.getWord(true)
                    )
                );
            }

            exc.prependWhite(white);

            blockCatch = this.parseStatement();
        }

        if (this.lexer.tryEat("finally")) {
            blockFinally = this.parseStatement();
        }

        if (!blockCatch && !blockFinally) {
            this.lexer.parseError(
                format(
                    _("Unexpected {0}, expecting a catch (or except) or finally block"),
                    this.lexer.getWord(true)
                )
            );
        }

        this.lexer.eat("end try");

        return new AudescriptASTTry(
            state,
            blockTry,
            blockCatch,
            exc,
            blockFinally
        );
    }

    parseFromImport(state : AudescriptLexer) {
        let moduleName = this.parseIdentifier() || this.parseString();

        if (!moduleName) {
            this.lexer.parseError(
                format(
                    _("Unexpected {0}, expecting a module name after the from keyword"),
                    this.lexer.getWord(true)
                )
            );
        }

        moduleName.appendWhite(this.lexer.getWhite());

        this.lexer.eat("import");

        let importList : [AudescriptASTIdentifier, AudescriptASTIdentifier][] = [];

        do {
            let white = this.lexer.getWhite();
            let exported = this.parseIdentifier();

            if (!exported) {
                this.lexer.parseError(
                    format(
                        _("Unexpected {0}, expecting a identifier after import or comma"),
                        this.lexer.getWord(true)
                    )
                );
            }

            exported.prependWhite(this.lexer.getWhite());
            let newState = this.lexer.getState();
            white = this.lexer.getWhite();

            let as = exported;

            if (this.lexer.tryEat("as")) {
                white = this.lexer.getWhite();
                as = this.parseIdentifier();

                if (!as) {
                    this.lexer.parseError(
                        format(
                            _("Unexpected {0}, expecting a identifier after as"),
                            this.lexer.getWord(true)
                        )
                    );
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

        return new AudescriptASTFromImport(
            state,
            moduleName,
            importList
        );
    }

    parseExport = function (state) : AudescriptASTExport {
        let exported : AudescriptASTIdentifier | AudescriptASTFunction | AudescriptASTDecl;
        let word     = this.lexer.getWord();
        let white    = this.lexer.getWhite();
        let newState = this.lexer.getState();

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
            this.lexer.parseError(
                format(
                    _("Unexpected {0}, expecting a named function, let or const declaration"),
                    this.lexer.getWord(true)
                )
            );
        }

        if (exported instanceof AudescriptASTFunction) {
            if (!exported.funName) {
                this.lexer.parseError(
                    format(
                        _("Only named functions can be exported"),
                        this.lexer.getWord(true)
                    )
                );
            }
        } else if (exported instanceof AudescriptASTDecl) {
            if (!(exported.declared instanceof AudescriptASTIdentifier)) {
                this.lexer.parseError(
                    format(
                        _("Sorry, destructuring declarations cannot be exported yet"),
                        this.lexer.getWord(true)
                    )
                );
            }
        }

        if (exported instanceof AudescriptASTDecl || exported instanceof AudescriptASTFunction) {
            exported.setInitialWhite(white);
        }

        return new AudescriptASTExport(
            state,
            exported
        );
    }

    parseControlStatement(flags : number) : AudescriptASTExpression {
        if (this.lexer.end()) {
            return null;
        }

        let state = this.lexer.getState();
        let word  = this.lexer.getWord().toLowerCase();
        let white = this.lexer.getWhite(true);
        let res : AudescriptASTInitialWhite;


        // TODO support if expression here
        switch (word) {
            case "for":
                if (this.lexer.tryEat("each")) {
                    white += this.lexer.getWhite();
                    res = this.parseForeach(state);
                    break;
                } else {
                    res = this.parseFor(state);
                    break;
                }
            case "foreach":   res = this.parseForeach(state);           break;
            case "try":       res = this.parseTry(state);               break;
            case "if":        res = this.parseIf(state);                break;
            case "unless":    res = this.parseIf(state, true);          break;
            case "while":     res = this.parseWhile(state, flags);      break;
            case "repeat":    res = this.parseRepeat(state);            break;
            case "do":        res = this.parseRepeat(state);            break; // we really meant parseRepeat
            case "until":     res = this.parseUntil(state, flags);      break;
            case "function":  res = this.parseFunction(state);          break;
            case "procedure": res = this.parseProcedure(state);         break;
            case "return":    res = this.parseReturnThrow(state, word); break;
            case "throw" :    res = this.parseReturnThrow(state, word); break;
            case "break":     res = this.parseBreak(state);             break;
            case "continue":  res = this.parseContinue(state);          break;
            case "export":    res = this.parseExport(state);            break;
            case "from":      res = this.parseFromImport(state);        break;
            case "var":
                word = "let";
            case "let":
            case "const":
                res = this.parseLet(state, word);
                break;
            case "import":
                this.lexer.parseError(
                    _("import is not yet supported. Use the from ... import ... syntax instead")
                );
        }

        if (!res) {
            this.lexer.restoreState(state);
            return null;
        }

        res.setInitialWhite(white);
        return res;
    }

    error() : void {
        this.lexer.parseError();
    }

    parseOperator(operators : string[]) : string {
        for (let op of operators) {
            if (this.lexer.tryEat(op, true)) {
                return op;
            }
        }

        return null;
    }

    parseExpression(insideExpression : boolean) : AudescriptASTExpression {
        let initialWhite = this.lexer.getWhite();

        let expressionList : (
            AudescriptASTExpression | AudescriptASTExpressionListOp
        )[] = [];

        let expectExpr = "";
        let white = "";
        while (true) {
            let state   = this.lexer.getState();
            white = this.lexer.getWhite();
            let opState = this.lexer.getState();
            let op = this.parseOperator(AudescriptParser.prefixOperators);

            if (op) {
                expressionList.push(
                    new AudescriptASTExpressionListOp(opState, op, white)
                );

                white = this.lexer.getWhite(!insideExpression);
            }

            let res : AudescriptASTExpression = (
                this.parseNumber()      ||
                this.parseChar()        ||
                this.parseString()      ||
                this.parseBool()        ||
                this.parseRegexp()      ||
                this.parseEmptyObject() ||
                this.parseEmptySet()    ||
                this.parseTernary()     ||
                this.tryParseFunction() ||
                this.parseIdentifier(expectExpr === ".")  ||
                this.parseParenBracketBrace(true)
            );

            if (!res) {
                if (op || expectExpr) {
                    this.lexer.parseError(
                        format(
                            _("Expecting an expression after operator {0}"),
                            ("'" + (op || expectExpr) + "'")
                        )
                    );
                }

                this.lexer.restoreState(state);
                break;
            }

            expectExpr = "";

            res.prependWhite(white);
            expressionList.push(res);

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
                res.appendWhite(white);
                white = "";
                expressionList.push(
                    new AudescriptASTExpressionListOp(opState, op)
                );

                state = this.lexer.getState();
            }

            opState = this.lexer.getState();
            op = this.parseOperator(AudescriptParser.operators);

            if (op) {
                res.appendWhite(white);
                white = "";
                expressionList.push(
                    new AudescriptASTExpressionListOp(opState, op)
                );
                expectExpr = op;
            } else {
                let found = false;
                while (true) {
                    if (!this.lexer.end() && this.lexer.curChar() === "(") {
                        res.appendWhite(white);
                        white = "";
                        expressionList.push(
                            new AudescriptASTExpressionListOp(opState, "call")
                        );
                        expressionList.push(res = this.parseParen());
                        found = true;
                    } else if (!this.lexer.end() && this.lexer.curChar() === "[") {
                        res.appendWhite(white);
                        white = "";
                        expressionList.push(
                            new AudescriptASTExpressionListOp(opState, "index")
                        );
                        expressionList.push(res = this.parseParenBracketBrace());
                        found = true;
                    } else {
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
                    res.appendWhite(white);
                    white = "";
                    expressionList.push(
                        new AudescriptASTExpressionListOp(opState, op)
                    );
                    expectExpr = op;
                } else {
                    this.lexer.restoreState(state);
                    white = this.lexer.getWhite(true);
                    break;
                }
            }
        }

        let res =  AudescriptASTStatement.expressionListToAST(
            initialWhite,
            expressionList,
            ""
        );

        if (res) {
            res.appendWhite(white + this.lexer.getWhite(true));
        }

        return res;
    }

    parseStatement(flags : number = 0) : AudescriptASTStatement {
        let white = this.lexer.getWhite();
        let state = this.lexer.getState();

        let res = this.parseControlStatement(flags) || this.parseExpression(false)

        if (!res) {
            res = new AudescriptASTNullStatement(
                state
            );

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
    }
}

declare var module   : Object;
declare var process  : any;
declare var Packages : any;
declare var java     : any;
declare var require  : any;

(function (that) {
    let audescript = that.audescript = {
        parse : function (str : string, moduleName : string, fname : string = "<string>") : AudescriptASTStatement {
            return new AudescriptParser(
                new AudescriptLexer(str, moduleName, fname)
            ).parse();
        },

        toJS : function (str : string, moduleName : string, fname? : string) : any {
            let parsed = audescript.parse(str, moduleName, fname);
            let needs = AudescriptASTStatement.getNeededModules(parsed);
            let codemap = parsed.toJS().toStringWithSourceMap({
                file: fname || "<stdin>"
            });

            return {
                neededModules: needs,
                map:           codemap.map,
                code:          codemap.code
            };
        },

        l10n : _
    };

    if (typeof module !== "undefined" && typeof require !== "undefined" && require.main === module) {
        require('source-map-support').install();

        let fs = require('fs');

        function writeResult(content : string, filename? : string) {
            let moduleName = "", newFile;
            if (filename) {
                moduleName = filename.replace(/\.[^/.]+$/, "");
                newFile = moduleName + ".js";

                if (filename === newFile) {
                    newFile += ".js";
                }
            }

            let codemap = audescript.toJS(content, moduleName, filename || "<stdin>");


            if (filename) {
                fs.writeFile(newFile, codemap.code, function (err) {
                    if(err) {
                        return console.error(err);
                    }
                });

                fs.writeFile(newFile + ".map", codemap.map.toString(), function (err) {
                    if(err) {
                        return console.error(err);
                    }
                });
            } else {
                console.log(codemap.code);
            }
        }

        if (process.argv[2] && process.argv[2] !== "-") {
            fs.readFile(process.argv[2], function (err, data) {
                if(err) {
                    return console.error(err);
                }
                writeResult(data.toString(), process.argv[2]);
            });
            return;
        }

        let script = "";
        process.stdin.resume();
        process.stdin.setEncoding('utf8');

        process.stdin.on('data', function(chunk) {
            script += chunk;
        });

        process.stdin.on("end", function () {
            writeResult(script);
        });
    }
}(typeof that.exports === "object" ? that.exports : this));
