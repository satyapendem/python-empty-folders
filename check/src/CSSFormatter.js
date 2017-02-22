
var createTokenizer = require('./codeMirrorTokenizer');
var lowerBound = require('./util').lowerBound;


function CSSFormatter(builder) {
    this._builder = builder;
}

CSSFormatter.prototype = {
   
    format: function (text, lineEndings, fromOffset, toOffset) {
        this._lineEndings = lineEndings;
        this._fromOffset = fromOffset;
        this._toOffset = toOffset;
        this._lastLine = -1;    
        this._state = {};   
        var tokenize = createTokenizer('text/css');
        
        var oldEnforce = this._builder.setEnforceSpaceBetweenWords(false);
        tokenize(text.substring(this._fromOffset, this._toOffset), this._tokenCallback.bind(this));
        this._builder.setEnforceSpaceBetweenWords(oldEnforce);
    },
    
    _tokenCallback: function (token, type, startPosition) {
        startPosition += this._fromOffset;  // 重置当前word在整个文本中的起始位置

        var startLine = lowerBound(this._lineEndings, startPosition); // 获取当前词所在行数

        
        if (startLine !== this._lastLine) {
            this._state.eatWhitespace = true;
        }
        //
        if (/^property/.test(type) && !this._state.inPropertyValue) {
            this._state.seenProperty = true;
        }
        
        this._lastLine = startLine;

        
        var isWhitespace = /^\s+$/.test(token);
        if (isWhitespace) {
            if (!this._state.eatWhitespace) {
                this._builder.addSoftSpace();
            }
            return;
        }
        this._state.eatWhitespace = false;

        if (token === "\n") {
            return;
        }

        if (token !== "}") {
            
            if (this._state.afterClosingBrace) {
                this._builder.addNewLine(true);
            }
            this._state.afterClosingBrace = false;
        }
        //
        if (token === "}") {
            if (this._state.inPropertyValue) {
                this._builder.addNewLine();
            }
            this._builder.decreaseNestingLevel();
            this._state.afterClosingBrace = true;
            this._state.inPropertyValue = false;
        } else if (token === ":" && !this._state.inPropertyValue && this._state.seenProperty) {
            this._builder.addToken(token, startPosition);
            this._builder.addSoftSpace();
            this._state.eatWhitespace = true;
            this._state.inPropertyValue = true;
            this._state.seenProperty = false;
            return;
        } else if (token === "{") {
            this._builder.addSoftSpace();
            this._builder.addToken(token, startPosition);
            this._builder.addNewLine();
            this._builder.increaseNestingLevel();
            return;
        }

        this._builder.addToken(token, startPosition);

        if (type === "comment" && !this._state.inPropertyValue && !this._state.seenProperty)
            this._builder.addNewLine();
        if (token === ";" && this._state.inPropertyValue) {
            this._state.inPropertyValue = false;
            this._builder.addNewLine();
        } else if (token === "}") {
            this._builder.addNewLine();
        }
    }
};

module.exports = CSSFormatter;