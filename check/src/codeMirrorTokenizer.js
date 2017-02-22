
var CodeMirror = require('codemirror');
var lowerBound = require("./util").lowerBound;
var AbortTokenization = require('./AbortTokenization')


module.exports = function createTokenizer(mimeType) {
    // help: http://www.uedsc.com/write-codemirror-a-mode.html
    var mode = CodeMirror.getMode({indentUnit: 2}, mimeType);
    var state = CodeMirror.startState(mode);

    
    function tokenize(line, callback) {

        var stream = new CodeMirror.StringStream(line);

        while (!stream.eol()) {
            var style = mode.token(stream, state);
            var value = stream.current();

            if (callback(value, style, stream.start, stream.start + value.length) === AbortTokenization) {
                return;
            }
            stream.start = stream.pos;
        }

    }

    return tokenize;
};