"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = "(function defaultProps(defaultProps, props, name, context) {\n  if (defaultProps) {\n    for (var propName in defaultProps) {\n      if (typeof props[propName] === 'undefined') {\n        props[propName] = defaultProps[propName]\n      }\n    }\n  }\n\n  if (name) {\n    var propsGetterName = 'get' + name.charAt(0).toUpperCase() + name.slice(1) + 'Props'\n\n    if (this.props && this.props[propsGetterName]) {\n      return Object.assign(props, this.props[propsGetterName](context))\n    }\n  }\n\n  return props\n})";
module.exports = exports["default"];