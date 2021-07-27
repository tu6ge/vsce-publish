const actionStatus = require('action-status')
const execa = require('execa')
const mockedEnv = require('mocked-env')
const publish = require('../publish')
const readJSON = require('../read-json')
const {mockFiles} = require('./__utils')

jest.mock('action-status')
jest.mock('execa')
jest.mock('../read-json')

describe('publish()', () => {
  let restoreEnv = () => {}

  const execOpts = {stdio: 'inherit'}

  beforeEach(() => {
    execa.mockImplementation(() => Promise.resolve({stdout: '', stderr: ''}))
    actionStatus.mockImplementation(() => Promise.resolve())
  })

  afterEach(() => {
    restoreEnv()
    execa.mockClear()
    readJSON.mockClear()
  })

  it('throws if VSCE_PAT is falsy', () => {
    mockFiles({
      'package.json': {name: 'pkg', version: '1.0.0'}
    })
    mockEnv({VSCE_PAT: undefined})
    expect(() => publish()).toThrow()
    mockEnv({VSCE_PAT: ''})
    expect(() => publish()).toThrow()
  })

  it('does the right things on a feature branch', () => {
    mockEnv({
      GITHUB_REF: 'refs/heads/feature-x',
      GITHUB_SHA: 'deadfad',
      VSCE_PAT: 'secret'
    })
    mockFiles({
      'package.json': {name: 'pkg', version: '1.0.0'}
    })
    return publish().then(() => {
      expect(execa).toHaveBeenCalledTimes(1)
      expect(execa).toHaveBeenNthCalledWith(1, 'vsce', ['publish'], execOpts)
    })
  })

  // it('does the right things on a release branch', () => {
  //   mockEnv({
  //     GITHUB_REF: 'refs/heads/release-2.0.0',
  //     GITHUB_SHA: 'deadfad',
  //     VSCE_PAT: 'secret'
  //   })
  //   mockFiles({
  //     'package.json': {name: 'pkg', version: '1.0.0'}
  //   })
  //   const version = '2.0.0-rc.deadfad'
  //   return publish().then(() => {
  //     expect(execa).toHaveBeenCalledTimes(2)
  //     expect(execa).toHaveBeenNthCalledWith(
  //       1,
  //       'npm',
  //       ['version', version],
  //       Object.assign({}, execOpts, {cwd: path.join(process.cwd(), '.')})
  //     )
  //     expect(execa).toHaveBeenNthCalledWith(2, 'npm', ['publish', '.', '--tag', 'next', '--access', 'public'], execOpts)
  //   })
  // })

  it('does the right things on master', () => {
    const version = '1.1.0'
    mockEnv({
      GITHUB_REF: 'refs/heads/master',
      GITHUB_SHA: 'deadfad',
      VSCE_PAT: 'secret'
    })
    mockFiles({
      'package.json': {name: 'pkg', version}
    })
    return publish().then(() => {
      expect(execa).toHaveBeenCalledTimes(1)
      // expect(execa).toHaveBeenNthCalledWith(1, 'npm', ['view', `pkg@${version}`, 'version'], {stderr: 'inherit'})
      expect(execa).toHaveBeenNthCalledWith(1, 'vsce', ['publish'], execOpts)
    })
  })

  it('respects the "dryRun" option', () => {
    mockEnv({
      GITHUB_REF: 'refs/heads/run-dry',
      GITHUB_SHA: 'bedface',
      VSCE_PAT: 'secret'
    })
    mockFiles({
      'package.json': {name: 'pkg', version: '1.0.0'}
    })
    return publish({dryRun: true, dir: '.'}).then(() => {
      expect(execa).toHaveBeenCalledTimes(0)
    })
  })

  it('respects "dir" option on master', () => {
    const version = '1.1.0'
    mockEnv({
      GITHUB_REF: 'refs/heads/master',
      GITHUB_SHA: 'deadfad',
      VSCE_PAT: 'secret'
    })
    mockFiles({
      'foo/bar/package.json': {name: 'pkg', version}
    })
    return publish({dir: 'foo/bar'}).then(() => {
      expect(execa).toHaveBeenCalledTimes(1)
      // expect(execa).toHaveBeenNthCalledWith(1, 'npm', ['view', `pkg@${version}`, 'version'], {stderr: 'inherit'})
      expect(execa).toHaveBeenNthCalledWith(1, 'vsce', ['publish'], execOpts)
    })
  })

  // it('respects "dir" option on a release branch', () => {
  //   mockEnv({
  //     GITHUB_REF: 'refs/heads/release-2.0.0',
  //     GITHUB_SHA: 'deadfad',
  //     VSCE_PAT: 'secret'
  //   })
  //   mockFiles({
  //     'foo/bar/package.json': {name: 'pkg', version: '1.0.0'}
  //   })
  //   const version = '2.0.0-rc.deadfad'
  //   return publish({dir: 'foo/bar'}).then(() => {
  //     expect(execa).toHaveBeenCalledTimes(2)
  //     expect(execa).toHaveBeenNthCalledWith(
  //       1,
  //       'npm',
  //       ['version', version],
  //       Object.assign({}, execOpts, {cwd: path.join(process.cwd(), 'foo/bar')})
  //     )
  //     expect(execa).toHaveBeenNthCalledWith(
  //       2,
  //       'npm',
  //       ['publish', 'foo/bar', '--tag', 'next', '--access', 'public'],
  //       execOpts
  //     )
  //   })
  // })

  function mockEnv(env) {
    restoreEnv = mockedEnv(env)
  }
})
