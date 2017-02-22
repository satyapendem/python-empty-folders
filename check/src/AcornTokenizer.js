
var acorn = require('acorn');
var computeLineEndings = require('./util').computeLineEndings;

function AcornTokenizer(content) {
    this._content = content;
    this._comments = [];   // 存储被解析文本注释信息
    this._tokenizer = acorn.tokenizer(this._content, {ecmaVersion: 6, onComment: this._comments});
    this._lineEndings = computeLineEndings(this._content); // 所有换行(\n)结束位置
    this._lineNumber = 0;
    this._tokenLineStart = 0;
    this._tokenLineEnd = 0;
    this._nextTokenInternal();
}

AcornTokenizer.prototype = {
    _nextTokenInternal: function () {
        if (this._comments.length) {
            return this._comments.shift();
        }
        var token = this._bufferedToken;
        this._bufferedToken = this._tokenizer.getToken();
        return token;
    },
    /**
     *
     */
    _rollLineNumberToPosition: function (position) {
        while (this._lineNumber + 1 < this._lineEndings.length && position > this._lineEndings[this._lineNumber]) {
            ++this._lineNumber;
        }
        return this._lineNumber;
    },
    /**
     *
     * @returns {*}
     */
    nextToken: function () {
        var token = this._nextTokenInternal();
        if (token.type === acorn.tokTypes.eof) {
            return null;
        }

        this._tokenLineStart = this._rollLineNumberToPosition(token.start);
        this._tokenLineEnd = this._rollLineNumberToPosition(token.end);
        this._tokenColumnStart = this._tokenLineStart > 0 ? token.start - this._lineEndings[this._tokenLineStart - 1] - 1 : token.start;
        return token;
    },
    
    peekToken: function () {
        if (this._comments.length) {
            return this._comments[0];
        }
        return this._bufferedToken.type !== acorn.tokTypes.eof ? this._bufferedToken : null;
    },
    /**
     *
     * @returns {number|*}
     */
    tokenLineStart: function () {
        return this._tokenLineStart;
    },
    /**
     *
     * @returns {number|*}
     */
    tokenLineEnd: function () {
        return this._tokenLineEnd;
    },
    /**
     *
     * @returns {*}
     */
    tokenColumnStart: function () {
        return this._tokenColumnStart;
    }
};

AcornTokenizer.punctuator = function (token, values) {
    return token.type !== acorn.tokTypes.num &&
        token.type !== acorn.tokTypes.regexp &&
        token.type !== acorn.tokTypes.string &&
        token.type !== acorn.tokTypes.name && !token.type.keyword &&
        (!values || (token.type.label.length === 1 && values.indexOf(token.type.label) !== -1));
};

AcornTokenizer.keyword = function (token, keyword) {
    return !!token.type.keyword &&
        token.type !== acorn.tokTypes._true &&
        token.type !== acorn.tokTypes._false &&
        token.type !== acorn.tokTypes._null &&
        (!keyword || token.type.keyword === keyword);
};

AcornTokenizer.identifier = function (token, identifier) {
    return token.type === acorn.tokTypes.name && (!identifier || token.value === identifier);
};

AcornTokenizer.lineComment = function (token) {
    return token.type === "Line";
};

AcornTokenizer.blockComment = function (token) {
    return token.type === "Block";
};

module.exports = AcornTokenizer;