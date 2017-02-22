
module.exports = function Tag(name, startOffset, endOffset, attributes, isOpenTag, selfClosingTag) {
    this.name = name;
    this.startOffset = startOffset;
    this.endOffset = endOffset;
    this.attributes = attributes;
    this.isOpenTag = isOpenTag;
    this.selfClosingTag = selfClosingTag;
};
