export default `(function defaultProps(defaultProps, props, name, context) {
  if (defaultProps) {
    for (var propName in defaultProps) {
      if (typeof props[propName] === 'undefined') {
        props[propName] = defaultProps[propName]
      }
    }
  }

  if (name) {
    var propsGetterName = 'get' + name.charAt(0).toUpperCase() + name.slice(1) + 'Props'

    if (this.props && this.props[propsGetterName]) {
      return Object.assign(props, this.props[propsGetterName](context))
    }
  }

  return props
})`
