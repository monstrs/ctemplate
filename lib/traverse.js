'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = traverse;

function traverse(tree) {
  var visitors = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var path = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

  if (Array.isArray(tree)) {
    return tree.map(function (node, index) {
      return visitNode(node, visitors, path.concat([index]));
    });
  }

  return visitNode(tree, visitors, path);
}

function visitNode(node, visitors, path) {
  if (visitors.beforeVisitNode) {
    node = visitors.beforeVisitNode(node, path);
  }

  if (node.type) {
    node.props = visitProps(node.props, node, visitors, path.concat(['props']));

    if (visitors.visitNode) {
      node = visitors.visitNode(node, path);
    }
  }

  return node;
}

function visitProps(props, node, visitors, path) {
  if (props === undefined) props = {};

  if (props.children) {
    props.children = visitChildren(props.children, visitors, path.concat(['children']));
  }

  props = searchNestedNodes(props, visitors, path, true);

  if (visitors.visitProps) {
    props = visitors.visitProps(props, node, path);
  }

  return props;
}

function searchNestedNodes(props, visitors, path) {
  var skip = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

  if (props instanceof Object) {
    if (props.type && props.props) {
      return visitNode(props, visitors, path);
    }

    _Object$keys(props).map(function (prop) {
      if (skip && prop === 'children') {
        return;
      }

      if (Array.isArray(props[prop])) {
        props[prop] = props[prop].map(function (nested, index) {
          return searchNestedNodes(nested, visitors, path.concat([prop, index]));
        });
      } else if (props[prop] instanceof Object) {
        if (props[prop].type && props[prop].props) {
          props[prop] = visitNode(props[prop], visitors, path.concat([prop]));
        } else {
          props[prop] = searchNestedNodes(props[prop], visitors, path.concat([prop]));
        }
      }
    });
  }

  return props;
}

function visitChildren(children, visitors, path) {
  if (Array.isArray(children)) {
    children = children.map(function (child, index) {
      if (child instanceof Object) {
        return visitNode(child, visitors, path.concat([index]));
      } else {
        return visitInlineChild(child, visitors, path.concat([index]));
      }
    });
  } else if (children instanceof Object) {
    children = visitNode(children, visitors, path);
  } else {
    children = visitInlineChild(children, visitors, path);
  }

  if (visitors.visitChildren) {
    children = visitors.visitChildren(children, path);
  }

  return children;
}

function visitInlineChild(child, visitors, path) {
  if (visitors.visitInlineChild) {
    child = visitors.visitInlineChild(child, path);
  }

  return child;
}
module.exports = exports['default'];