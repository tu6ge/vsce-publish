# tu6ge/vsce-publish

This [GitHub Action][github actions] publishes to visual studio marketplace  with the following conventions:

1. If we're on the default branch, the `version` field is used as-is and we just run `vsce publish`.
   - After publishing a new version on the default branch, we tag the commit SHA with `v{version}` via the GitHub API.
   - If the version in `package.json` is already published, we exit with a `0` code. Previously, we exited with a `78` code, which was Actions v1-speak for "neutral", but this has been [removed from Actions v2](https://twitter.com/ethomson/status/1163899559279497217?s=20).
1. If we're on a `release-<version>` branch, we publish a release candidate to the `next` npm dist-tag with the version in the form: `<version>-rc.<sha>`.
   - A [status check][status checks] is created with the context `npm version` noting whether the `version` field in `package.json` matches the `<version>` portion of the branch. If it doesn't, the check's status is marked as pending.
1. Otherwise, we publish a "canary" release, which has a version in the form: `0.0.0-<sha>`.

## Status checks

Depending on the branch, a series of [statuses][status checks] will be created by this action in your checks: **publish** is the action's check, and **publish {package-name}** is a [commit status] created by the action that reports the version published and links to `unpkg.com` via "Details":

![image](https://user-images.githubusercontent.com/113896/52375286-23368980-2a14-11e9-8974-062a3e45a846.png)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Ftu6ge%2Fvsce-publish.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Ftu6ge%2Fvsce-publish?ref=badge_shield)

If you're on a release branch (`release-<version>`) and the `<version>` portion of the branch name doesn't match the `version` field in `package.json`, you'll get a pending status reminding you to update it:

![image](https://user-images.githubusercontent.com/113896/52388530-b63ae800-2a43-11e9-92ef-14ec9459c109.png)

## Usage

**You will need to provide an azure DevOps access token with publish permissions via the `VSCE_PAT` secret in the Actions visual editor** if you haven't already. The `GITHUB_TOKEN` secret is also required to create tags after releasing on the master branch.

We suggest that you place this action after any linting and/or testing actions to catch as many errors as possible before publishing.


### Actions
To use this in an Actions workflow, add the following YAML to one or more of your steps:

```yaml
- uses: tu6ge/vsce-publish@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    VSCE_PAT: ${{ secrets.VSCE_PAT }}
```

You can pass additional [inputs](#inputs) via the `with` key:

```hcl
- name: Publish to the visual studio marketplace
  uses: "tu6ge/vsce-publish@master"
  with:
    npm-args: "--unsafe-perm --allow-same-version"
    default-branch: "main"
```


## Inputs

### `dry_run` **No test**

Does everything publish would do except actually publishing to the registry. Reports the details of what would have been published.

Default: `false`

#### Example

```hcl
- name: Publish to the visual studio marketplace
  uses: "tu6ge/vsce-publish@master"
  with:
    dry_run: true
```

### `dir` **No test**

Accepts a path to the directory that contains the `package.json` to publish.

Default: `.`

#### Example

```hcl
- name: Publish to the visual studio marketplace
  uses: "tu6ge/vsce-publish@master"
  with:
    dir: "packages/example"
}
```

### `default_branch`

The branch you'd like to use to trigger releases. Typically this is `main` or `master`.

Default: `master`

```hcl
- name: Publish to the visual studio marketplace
  uses: "tu6ge/vsce-publish@master"
  with:
    default_branch: "main"
```

### `release_tag` **No test**

The `release_tag` input can be used to override the auto-generated release tag.

Default: `latest`

```hcl
- name: Publish to the visual studio marketplace
  uses: "tu6ge/vsce-publish@master"
  with:
    release_tag: "1.0.0"
```

[github actions]: https://github.com/features/actions
[commit status]: https://developer.github.com/v3/repos/statuses/
[status checks]: https://help.github.com/articles/about-status-checks/


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Ftu6ge%2Fvsce-publish.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Ftu6ge%2Fvsce-publish?ref=badge_large)