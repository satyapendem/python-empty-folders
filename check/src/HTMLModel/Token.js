
module.exports = function Token(value, type, startOffset, endOffset) {
    this.value = value;
    this.type = type;
    this.startOffset = startOffset;
    this.endOffset = endOffset;
};