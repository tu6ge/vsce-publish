const path = require('path')
const meta = require('github-action-meta')
const actionStatus = require('action-status')
const getContext = require('./context')
const runDry = require('./run-dry')

module.exports = function publish(options = {dir: '.'}, npmArgs = []) {
  if (!process.env.VSCE_TOKEN) {
    throw new Error(`You must set the VSCE_TOKEN environment variable`)
  }

  const run = options.dryRun ? runDry : require('execa')
  const execOpts = {stdio: 'inherit'}

  return getContext(options).then(context => {
    const {name, publisher, version, tag, packageJson} = context
    const {sha} = meta.git

    // this is true if we think we're publishing the version that's in git
    const isLatest = packageJson.version === version

    return (context.status ? publishStatus(context, context.status) : Promise.resolve())
      .then(() => {
        if (isLatest) {
          console.warn(`[publish] skipping "vsce version" because "${version}" matches package.json`)
          // this is a fairly reliable way to determine whether the package@version is published
          // vsce show tu6ge.vueformulate-helper | grep Version |tr -d Version: | xargs
          return run('vsce', ['show', `${publisher}.${name}`], {stderr: 'inherit'})
            .then(({stdout})=>{
              return /Version:(.*)\n/.exec(stdout)
            }).then(res=>{
              return res[1].trim()
            })
            .then((res) => {
              return res === version
            })
            .then(published => {
              if (published) {
                console.warn(`[publish] ${version} is already published`)
                process.exit(0)
              }
            })
        } else {
          return publishStatus(context, {
            state: 'pending',
            description: `npm version ${version}`
          }).then(() =>
            
            run(
              'npm',
              [...npmArgs, 'version', version],
              Object.assign({}, execOpts, {cwd: path.join(process.cwd(), options.dir)})
            )
          )
        }
      })
      .then(() =>
        publishStatus(context, {
          state: 'pending',
          description: `npm publish --tag ${tag}`
        })
      )
      // vsce publish -p $VSCE_TOKEN
      .then(() => run('vsce', ['publish'], execOpts))
      .then(() =>
        publishStatus(context, {
          state: 'success',
          description: version,
          url: `https://unpkg.com/${name}@${version}/`
        })
      )
      .then(() => {
        if (isLatest) {
          const {GITHUB_TOKEN} = process.env
          if (!GITHUB_TOKEN) {
            console.warn(`[publish] GITHUB_TOKEN is not set; skipping tag`)
            return context
          }

          const tagContext = 'git tag'
          const tag = `v${version}`

          const Octokit = require('@octokit/rest')
          const github = new Octokit({auth: `token ${GITHUB_TOKEN}`})
          const {repo} = meta

          return publishStatus(context, {
            context: tagContext,
            state: 'pending',
            description: `Tagging the release as "${tag}"...`
          })
            .then(() =>
              github.git.createRef({
                owner: repo.owner,
                repo: repo.name,
                sha,
                ref: `refs/tags/${tag}`
              })
            )
            .then(() =>
              publishStatus(context, {
                context: tagContext,
                state: 'success',
                description: `Tagged ${sha.substr(0, 7)} as "${tag}"`,
                url: `https://github.com/${repo}/releases/new?tag=${tag}`
              })
            )
        }
      })
      .then(() => context)
  })
}

function publishStatus(context, options = {}) {
  return actionStatus(
    Object.assign(
      {
        context: `publish ${context.name}`,
        // note: these need to be empty so that action-status
        // doesn't throw an error w/o "required" env vars
        description: '',
        url: ''
      },
      options
    )
  )
}
