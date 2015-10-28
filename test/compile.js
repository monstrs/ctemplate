import { clone } from 'ramda'
import compile from '../src/compile'
import template from './fixtures/template'

describe('check compile template', () => {
  it('compile', () => {
    const source = compile('TestClass', clone(template))
    // console.log(source)
  })
})
