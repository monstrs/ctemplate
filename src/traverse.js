export default function traverse(tree, visitors = {}, path = []) {
  if (Array.isArray(tree)) {
    return tree.map((node, index) => visitNode(node, visitors, path.concat([index])))
  }

  return visitNode(tree, visitors, path)
}

function visitNode(node, visitors, path) {
  if (visitors.beforeVisitNode) {
    node = visitors.beforeVisitNode(node, path)
  }

  if (node.type) {
    node.props = visitProps(node.props, node, visitors, path.concat(['props']))

    if (visitors.visitNode) {
      node = visitors.visitNode(node, path)
    }
  }

  return node
}

function visitProps(props = {}, node, visitors, path) {
  if (props.children) {
    props.children = visitChildren(props.children, visitors, path.concat(['children']))
  }

  props = searchNestedNodes(props, visitors, path, true)

  if (visitors.visitProps) {
    props = visitors.visitProps(props, node, path)
  }

  return props
}

function searchNestedNodes(props, visitors, path, skip = false) {
  if (props instanceof Object) {
    if (props.type && props.props) {
      return visitNode(props, visitors, path)
    }

    Object.keys(props).map(prop => {
      if (skip && prop === 'children') {
        return
      }

      if (Array.isArray(props[prop])) {
        props[prop] = props[prop].map((nested, index) => {
          return searchNestedNodes(nested, visitors, path.concat([prop, index]))
        })
      } else if (props[prop] instanceof Object) {
        if (props[prop].type && props[prop].props) {
          props[prop] = visitNode(props[prop], visitors, path.concat([prop]))
        } else {
          props[prop] = searchNestedNodes(props[prop], visitors, path.concat([prop]))
        }
      }
    })
  }

  return props
}

function visitChildren(children, visitors, path) {
  if (Array.isArray(children)) {
    children = children.map((child, index) => {
      if (child instanceof Object) {
        return visitNode(child, visitors, path.concat([index]))
      } else {
        return visitInlineChild(child, visitors, path.concat([index]))
      }
    })
  } else if (children instanceof Object) {
    children = visitNode(children, visitors, path)
  } else {
    children = visitInlineChild(children, visitors, path)
  }

  if (visitors.visitChildren) {
    children = visitors.visitChildren(children, path)
  }

  return children
}

function visitInlineChild(child, visitors, path) {
  if (visitors.visitInlineChild) {
    child = visitors.visitInlineChild(child, path)
  }

  return child
}
