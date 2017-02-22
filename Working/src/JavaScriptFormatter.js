/**
 * Created by harrylang on 16/11/11.
 */

var AcornTokenizer = require('./AcornTokenizer');
var ESTreeWalker = require('./ESTreeWalker');
var acorn = require('acorn');

/**
 * JavaScript格式化构造器
 * @param builder
 * @constructor
 */
function JavaScriptFormatter(builder) {
    this._builder = builder;
}

JavaScriptFormatter.prototype = {
    /**
     * 格式化入口
     * @param text  被格式化内容
     * @param lineEndings   所有换行(\n)结束位置
     * @param fromOffset    解析起始偏移量
     * @param toOffset      解析结束偏移量
     */
    format: function (text, lineEndings, fromOffset, toOffset) {
        this._fromOffset = fromOffset;
        this._toOffset = toOffset;
        this._content = text.substring(this._fromOffset, this._toOffset);
        this._lastLineNumber = 0;
        this._tokenizer = new AcornTokenizer(this._content);
        // ranges 是否记录当前‘词’的起始和结束偏移量
        var ast = acorn.parse(this._content, {ranges: false, ecmaVersion: 6});
        var walker = new ESTreeWalker(this._beforeVisit.bind(this), this._afterVisit.bind(this));
        walker.walk(ast);
    },
    /**
     *
     * @param token
     * @param format
     * @private
     */
    _push: function (token, format) {
        for (var i = 0; i < format.length; ++i) {
            if (format[i] === "s") {
                this._builder.addSoftSpace();
            } else if (format[i] === "S") {
                this._builder.addHardSpace();
            } else if (format[i] === "n") {
                this._builder.addNewLine();
            } else if (format[i] === ">") {
                this._builder.increaseNestingLevel();
            } else if (format[i] === "<") {
                this._builder.decreaseNestingLevel();
            } else if (format[i] === "t") {
                if (this._tokenizer.tokenLineStart() - this._lastLineNumber > 1)
                    this._builder.addNewLine(true);
                this._lastLineNumber = this._tokenizer.tokenLineEnd();
                this._builder.addToken(this._content.substring(token.start, token.end), this._fromOffset + token.start);
            }
        }
    },
    /**
     *
     * @param node
     * @private
     */
    _beforeVisit: function (node) {
        if (!node.parent) {
            return;
        }
        while (this._tokenizer.peekToken() && this._tokenizer.peekToken().start < node.start) {
            var token = (this._tokenizer.nextToken());
            var format = this._formatToken(node.parent, token);
            this._push(token, format);
        }
    },
    /**
     *
     * @param node
     * @private
     */
    _afterVisit: function (node) {
        while (this._tokenizer.peekToken() && this._tokenizer.peekToken().start < node.end) {
            var token = (this._tokenizer.nextToken());
            var format = this._formatToken(node, token);
            this._push(token, format);
        }
        this._push(null, this._finishNode(node));
    },
    /**
     *
     * @param node
     * @returns {*}
     * @private
     */
    _inForLoopHeader: function (node) {
        var parent = node.parent;
        if (!parent)
            return false;
        if (parent.type === "ForStatement")
            return node === parent.init || node === parent.test || node === parent.update;
        if (parent.type === "ForInStatement" || parent.type === "ForOfStatement")
            return node === parent.left || parent.right;
        return false;
    },
    /**
     *
     * @param node
     * @param token
     * @returns {*}
     * @private
     */
    _formatToken: function (node, token) {
        var AT = AcornTokenizer;
        if (AT.lineComment(token))
            return "tn";
        if (AT.blockComment(token))
            return "tn";
        if (node.type === "ContinueStatement" || node.type === "BreakStatement") {
            return node.label && AT.keyword(token) ? "ts" : "t";
        } else if (node.type === "Identifier") {
            return "t";
        } else if (node.type === "ReturnStatement") {
            if (AT.punctuator(token, ";"))
                return "t";
            return node.argument ? "ts" : "t";
        } else if (node.type === "Property") {
            if (AT.punctuator(token, ":"))
                return "ts";
            return "t";
        } else if (node.type === "ArrayExpression") {
            if (AT.punctuator(token, ","))
                return "ts";
            return "t";
        } else if (node.type === "LabeledStatement") {
            if (AT.punctuator(token, ":"))
                return "ts";
        } else if (node.type === "LogicalExpression" || node.type === "AssignmentExpression" || node.type === "BinaryExpression") {
            if (AT.punctuator(token) && !AT.punctuator(token, "()"))
                return "sts";
        } else if (node.type === "ConditionalExpression") {
            if (AT.punctuator(token, "?:"))
                return "sts";
        } else if (node.type === "VariableDeclarator") {
            if (AT.punctuator(token, "="))
                return "sts";
        } else if (node.type === "FunctionDeclaration") {
            if (AT.punctuator(token, ",)"))
                return "ts";
        } else if (node.type === "FunctionExpression") {
            if (AT.punctuator(token, ",)"))
                return "ts";
            if (AT.keyword(token, "function"))
                return node.id ? "ts" : "t";
        } else if (node.type === "WithStatement") {
            if (AT.punctuator(token, ")"))
                return node.body && node.body.type === "BlockStatement" ? "ts" : "tn>";
        } else if (node.type === "SwitchStatement") {
            if (AT.punctuator(token, "{"))
                return "tn>";
            if (AT.punctuator(token, "}"))
                return "n<tn";
            if (AT.punctuator(token, ")"))
                return "ts";
        } else if (node.type === "SwitchCase") {
            if (AT.keyword(token, "case"))
                return "n<ts";
            if (AT.keyword(token, "default"))
                return "n<t";
            if (AT.punctuator(token, ":"))
                return "tn>";
        } else if (node.type === "VariableDeclaration") {
            if (AT.punctuator(token, ",")) {
                var allVariablesInitialized = true;
                var declarations = /** @type {!Array.<!ESTree.Node>} */(node.declarations);
                for (var i = 0; i < declarations.length; ++i)
                    allVariablesInitialized = allVariablesInitialized && !!declarations[i].init;
                return !this._inForLoopHeader(node) && allVariablesInitialized ? "nSSts" : "ts";
            }
        } else if (node.type === "BlockStatement") {
            if (AT.punctuator(token, "{"))
                return node.body.length ? "tn>" : "t";
            if (AT.punctuator(token, "}"))
                return node.body.length ? "n<t" : "t";
        } else if (node.type === "CatchClause") {
            if (AT.punctuator(token, ")"))
                return "ts";
        } else if (node.type === "ObjectExpression") {
            if (!node.properties.length)
                return "t";
            if (AT.punctuator(token, "{"))
                return "tn>";
            if (AT.punctuator(token, "}"))
                return "n<t";
            if (AT.punctuator(token, ","))
                return "tn";
        } else if (node.type === "IfStatement") {
            if (AT.punctuator(token, ")"))
                return node.consequent && node.consequent.type === "BlockStatement" ? "ts" : "tn>";

            if (AT.keyword(token, "else")) {
                var preFormat = node.consequent && node.consequent.type === "BlockStatement" ? "st" : "n<t";
                var postFormat = "n>";
                if (node.alternate && (node.alternate.type === "BlockStatement" || node.alternate.type === "IfStatement"))
                    postFormat = "s";
                return preFormat + postFormat;
            }
        } else if (node.type === "CallExpression") {
            if (AT.punctuator(token, ","))
                return "ts";
        } else if (node.type === "SequenceExpression" && AT.punctuator(token, ",")) {
            return node.parent && node.parent.type === "SwitchCase" ? "ts" : "tn";
        } else if (node.type === "ForStatement" || node.type === "ForOfStatement" || node.type === "ForInStatement") {
            if (AT.punctuator(token, ";"))
                return "ts";
            if (AT.keyword(token, "in") || AT.identifier(token, "of"))
                return "sts";

            if (AT.punctuator(token, ")"))
                return node.body && node.body.type === "BlockStatement" ? "ts" : "tn>";
        } else if (node.type === "WhileStatement") {
            if (AT.punctuator(token, ")"))
                return node.body && node.body.type === "BlockStatement" ? "ts" : "tn>";
        } else if (node.type === "DoWhileStatement") {
            var blockBody = node.body && node.body.type === "BlockStatement";
            if (AT.keyword(token, "do"))
                return blockBody ? "ts" : "tn>";
            if (AT.keyword(token, "while"))
                return blockBody ? "sts" : "n<ts";
        } else if (node.type === "ClassBody") {
            if (AT.punctuator(token, "{"))
                return "stn>";
            if (AT.punctuator(token, "}"))
                return "<ntn";
            return "t";
        } else if (node.type === "YieldExpression") {
            return "t";
        } else if (node.type === "Super") {
            return "t";
        }
        return AT.keyword(token) && !AT.keyword(token, "this") ? "ts" : "t";
    },
    /**
     *
     * @param node
     * @returns {*}
     * @private
     */
    _finishNode: function (node) {
        if (node.type === "WithStatement") {
            if (node.body && node.body.type !== "BlockStatement")
                return "n<";
        } else if (node.type === "VariableDeclaration") {
            if (!this._inForLoopHeader(node))
                return "n";
        } else if (node.type === "ForStatement" || node.type === "ForOfStatement" || node.type === "ForInStatement") {
            if (node.body && node.body.type !== "BlockStatement")
                return "n<";
        } else if (node.type === "BlockStatement") {
            if (node.parent && node.parent.type === "IfStatement" && node.parent.alternate && node.parent.consequent === node)
                return "";
            if (node.parent && node.parent.type === "FunctionExpression" && node.parent.parent && node.parent.parent.type === "Property")
                return "";
            if (node.parent && node.parent.type === "FunctionExpression" && node.parent.parent && node.parent.parent.type === "VariableDeclarator")
                return "";
            if (node.parent && node.parent.type === "FunctionExpression" && node.parent.parent && node.parent.parent.type === "CallExpression")
                return "";
            if (node.parent && node.parent.type === "DoWhileStatement")
                return "";
            if (node.parent && node.parent.type === "TryStatement" && node.parent.block === node)
                return "s";
            if (node.parent && node.parent.type === "CatchClause" && node.parent.parent.finalizer)
                return "s";
            return "n";
        } else if (node.type === "WhileStatement") {
            if (node.body && node.body.type !== "BlockStatement")
                return "n<";
        } else if (node.type === "IfStatement") {
            if (node.alternate) {
                if (node.alternate.type !== "BlockStatement" && node.alternate.type !== "IfStatement")
                    return "<";
            } else if (node.consequent) {
                if (node.consequent.type !== "BlockStatement")
                    return "<";
            }
        } else if (node.type === "BreakStatement" || node.type === "ContinueStatement" || node.type === "ThrowStatement" || node.type === "ReturnStatement" || node.type === "ExpressionStatement") {
            return "n";
        }
        return "";
    }
};

module.exports = JavaScriptFormatter;