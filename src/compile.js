import transform from 'babel-core/lib/transformation'
import File from 'babel-core/lib/transformation/file'
import * as t from 'babel-core/lib/types'
import * as util from 'babel-core/lib/util'
import traverse from './traverse'
import defaultPropsHelperTemplate from './helpers/default-props'

export default function compile(className, code) {
  const options = {
    stage: 0,
    optional: [ 'runtime' ],
  }

  const file = new File(options, transform.pipeline)

  file.addCode('')
  file.addAst(t.file(t.program([]), [], []))

  const defaultPropsHelperName = 'ctemplate-default-props'
  util.templates[`helper-${defaultPropsHelperName}`] = util.parseTemplate(defaultPropsHelperName, defaultPropsHelperTemplate)

  const ref = util.template(`helper-${defaultPropsHelperName}`)

  const defaultPropsHelper = file.scope.generateUidIdentifier(defaultPropsHelperName)
  file.declarations[defaultPropsHelperName] = defaultPropsHelper
  defaultPropsHelper._compact = true

  file.scope.push({
    id: defaultPropsHelper,
    init: ref,
    unique: true,
  })

  function visitNode(node) {
    const obj = t.objectExpression([])

    const typeName = node.type.split('/').pop()
    const type = file.addImport(node.type, typeName)
    let props = node.props

    if (!t.isJSXIdentifier(node.type)) {
      props = t.callExpression(
        t.memberExpression(defaultPropsHelper, t.callExpression(t.identifier('bind'), [t.identifier('this')])),
        [
          t.memberExpression(type, t.identifier('defaultProps')),
          props,
          t.literal(node.name),
          t.conditionalExpression(
            t.binaryExpression('===', t.unaryExpression('typeof', t.identifier('context')), t.literal('undefined')),
            t.literal(null),
            t.identifier('context')
          )
        ]
      )
    }

    obj.properties.push(t.property('init', t.identifier('$$typeof'), file.addHelper('typeof-react-element')))
    obj.properties.push(t.property('init', t.identifier('key'), t.literal(null)))
    obj.properties.push(t.property('init', t.identifier('ref'), t.literal(null)))
    obj.properties.push(t.property('init', t.identifier('type'), type))
    obj.properties.push(t.property('init', t.identifier('props'), props))

    if (node.runtime) {
      const context = t.arrowFunctionExpression([t.identifier('context')], t.blockStatement([
        t.returnStatement(obj),
      ]))

      return t.callExpression(t.memberExpression(context, t.identifier('bind')), [t.identifier('this')])
    }

    return obj
  }

  function visitChildren(children) {
    if (Array.isArray(children)) {
      return t.arrayExpression(children)
    }

    return children
  }

  function visitProps(props) {
    const obj = t.objectExpression([])

    Object.keys(props).forEach(key => {
      if (props[key].type) {
        obj.properties.push(t.property('init', t.identifier(key), props[key]))
      } else if (Array.isArray(props[key])) {
        const arr = t.arrayExpression([])
        props[key].map(element => {
          if (element.type) {
            arr.elements.push(element)
          } else {
            arr.elements.push(visitProps(element))
          }
        })

        obj.properties.push(t.property('init', t.identifier(key), arr))
      } else if (props[key] instanceof Object) {
        obj.properties.push(t.property('init', t.identifier(key), visitProps(props[key])))
      } else {
        obj.properties.push(t.property('init', t.identifier(key), t.literal(props[key])))
      }
    })

    return obj
  }

  function visitInlineChild(child) {
    return t.literal(child)
  }

  const template = traverse(code, {
    visitNode,
    visitProps,
    visitChildren,
    visitInlineChild,
  })

  const renderBody = t.functionExpression(null, [], t.blockStatement([
    t.returnStatement(template),
  ]))

  const render = t.methodDefinition(t.identifier('render'), renderBody)

  const superClass = t.memberExpression(file.addImport('react'), t.identifier('Component'))

  const cls = t.classDeclaration(t.identifier(className), t.classBody([render]), superClass)

  file.ast.program.body.push(cls)
  file.ast.program.body.push(t.exportDefaultDeclaration(t.identifier(className)))

  return file.transform().code.replace(/_Symbol\.\"for\"/g, '_Symbol["for"]')
}
