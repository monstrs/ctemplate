'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _interopRequireWildcard = require('babel-runtime/helpers/interop-require-wildcard')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = compile;

var _babelCoreLibTransformation = require('babel-core/lib/transformation');

var _babelCoreLibTransformation2 = _interopRequireDefault(_babelCoreLibTransformation);

var _babelCoreLibTransformationFile = require('babel-core/lib/transformation/file');

var _babelCoreLibTransformationFile2 = _interopRequireDefault(_babelCoreLibTransformationFile);

var _babelCoreLibTypes = require('babel-core/lib/types');

var t = _interopRequireWildcard(_babelCoreLibTypes);

var _babelCoreLibUtil = require('babel-core/lib/util');

var util = _interopRequireWildcard(_babelCoreLibUtil);

var _traverse = require('./traverse');

var _traverse2 = _interopRequireDefault(_traverse);

var _helpersDefaultProps = require('./helpers/default-props');

var _helpersDefaultProps2 = _interopRequireDefault(_helpersDefaultProps);

function compile(className, code) {
  var options = {
    stage: 0,
    optional: ['runtime']
  };

  var file = new _babelCoreLibTransformationFile2['default'](options, _babelCoreLibTransformation2['default'].pipeline);

  file.addCode('');
  file.addAst(t.file(t.program([]), [], []));

  var defaultPropsHelperName = 'ctemplate-default-props';
  util.templates['helper-' + defaultPropsHelperName] = util.parseTemplate(defaultPropsHelperName, _helpersDefaultProps2['default']);

  var ref = util.template('helper-' + defaultPropsHelperName);

  var defaultPropsHelper = file.scope.generateUidIdentifier(defaultPropsHelperName);
  file.declarations[defaultPropsHelperName] = defaultPropsHelper;
  defaultPropsHelper._compact = true;

  file.scope.push({
    id: defaultPropsHelper,
    init: ref,
    unique: true
  });

  function visitNode(node) {
    var obj = t.objectExpression([]);

    var typeName = node.type.split('/').pop();
    var type = file.addImport(node.type, typeName);
    var props = node.props;

    if (!t.isJSXIdentifier(node.type)) {
      props = t.callExpression(t.memberExpression(defaultPropsHelper, t.callExpression(t.identifier('bind'), [t.identifier('this')])), [t.memberExpression(type, t.identifier('defaultProps')), props, t.literal(node.name), t.conditionalExpression(t.binaryExpression('===', t.unaryExpression('typeof', t.identifier('context')), t.literal('undefined')), t.literal(null), t.identifier('context'))]);
    }

    obj.properties.push(t.property('init', t.identifier('$$typeof'), file.addHelper('typeof-react-element')));
    obj.properties.push(t.property('init', t.identifier('key'), t.literal(null)));
    obj.properties.push(t.property('init', t.identifier('ref'), t.literal(null)));
    obj.properties.push(t.property('init', t.identifier('type'), type));
    obj.properties.push(t.property('init', t.identifier('props'), props));

    if (node.runtime) {
      var context = t.arrowFunctionExpression([t.identifier('context')], t.blockStatement([t.returnStatement(obj)]));

      return t.callExpression(t.memberExpression(context, t.identifier('bind')), [t.identifier('this')]);
    }

    return obj;
  }

  function visitChildren(children) {
    if (Array.isArray(children)) {
      return t.arrayExpression(children);
    }

    return children;
  }

  function visitProps(props) {
    var obj = t.objectExpression([]);

    _Object$keys(props).forEach(function (key) {
      if (props[key].type) {
        obj.properties.push(t.property('init', t.identifier(key), props[key]));
      } else if (Array.isArray(props[key])) {
        (function () {
          var arr = t.arrayExpression([]);
          props[key].map(function (element) {
            if (element.type) {
              arr.elements.push(element);
            } else {
              arr.elements.push(visitProps(element));
            }
          });

          obj.properties.push(t.property('init', t.identifier(key), arr));
        })();
      } else if (props[key] instanceof Object) {
        obj.properties.push(t.property('init', t.identifier(key), visitProps(props[key])));
      } else {
        obj.properties.push(t.property('init', t.identifier(key), t.literal(props[key])));
      }
    });

    return obj;
  }

  function visitInlineChild(child) {
    return t.literal(child);
  }

  var template = (0, _traverse2['default'])(code, {
    visitNode: visitNode,
    visitProps: visitProps,
    visitChildren: visitChildren,
    visitInlineChild: visitInlineChild
  });

  var renderBody = t.functionExpression(null, [], t.blockStatement([t.returnStatement(template)]));

  var render = t.methodDefinition(t.identifier('render'), renderBody);

  var superClass = t.memberExpression(file.addImport('react'), t.identifier('Component'));

  var cls = t.classDeclaration(t.identifier(className), t.classBody([render]), superClass);

  file.ast.program.body.push(cls);
  file.ast.program.body.push(t.exportDefaultDeclaration(t.identifier(className)));

  return file.transform().code.replace(/_Symbol\.\"for\"/g, '_Symbol["for"]');
}

module.exports = exports['default'];