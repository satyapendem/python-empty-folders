module.exports = function Element(name) {
    this.name = name;
    this.children = [];
    this.parent = null;
    this.openTag = null;
    this.closeTag = null;
};