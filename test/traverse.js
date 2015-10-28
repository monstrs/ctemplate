import { clone } from 'ramda'
import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import traverse from '../src/traverse'
import template from './fixtures/template'

chai.use(sinonChai)

describe('check traverse', () => {
  it('check visit node', () => {
    const visitNode = sinon.stub().returnsArg(0)

    traverse(clone(template), { visitNode })

    expect(visitNode).to.have.been.callCount(5)
  })
})
