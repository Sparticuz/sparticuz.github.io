# Quartz 5 with separate site and Obsidian vault repositories

Investigated 2026-10-22 using synthetic content. Implementation decision afterward: adopt the exact current-v5 pin and native npm plugins, but **keep the existing vault layout and filtering**, as selected by Kyle. PR #26 retains checkout into `quartz/content`; the public-subtree example below remains an alternative, not an implemented restriction. No Pages settings, vault contents, or credentials were changed.

## Recommendation

Keep the existing repository responsibilities:

- `Sparticuz/sparticuz.github.io`: owns site configuration, the build workflow, and GitHub Pages deployment.
- Private Obsidian vault repository: owns notes and attachments. The site workflow reads it with a repository-scoped, read-only credential.
- Official Quartz repository: supplies the renderer through an exact, reviewed upstream commit checked out during CI.

For this already-established wrapper repository, retain the upstream checkout rather than importing the entire Quartz source tree. Change the version/dependency strategy: pin a coherent current-v5 revision, use its own npm manifests and published stock plugins, and supply only normal site configuration. **Do not retain the npm manifest overrides merely to preserve the old `v5.0.0` tag.** This recommendation is incorporated into the revised PR #26.

The wrapper is a composition of supported checkout/build/deploy features, not a separately documented Quartz distribution mode. Keeping all Quartz source in the Pages repo is the conventional alternative and is also valid. It simplifies upstream CLI upgrade workflows but introduces a maintained source copy and upstream merges; it is not necessary just to separate the vault from the website.

## Why the version strategy matters

The `v5.0.0` tag and current `v5` branch both report package version `5.0.0`, but their packaging differs substantially:

- The tag uses GitHub-sourced shared types/utilities and a Git-plugin-oriented setup. The first version of PR #26 compensated for old utility dependencies by overlaying npm manifests; the revised PR removes those overlays.
- Current upstream uses published npm dependencies for shared types/utilities and stock community plugins. Its default YAML uses sources such as `@quartz-community/note-properties` rather than `github:quartz-community/note-properties`.
- Consequently, a tag-only version check does not describe current upstream code. Pin an exact reviewed commit, not the moving `v5` branch. The revision exercised here was `97a2d05f80c4c50534959b1d0d41cc4b3895625e`.

Sources: [tag manifest](https://github.com/jackyzha0/quartz/blob/v5.0.0/package.json), [tested revision manifest](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/package.json), [tested revision defaults](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz.config.default.yaml).

This trades a named release tag for a tested, immutable upstream revision. If remaining strictly on the old release tag is required, its dependency workaround remains a separate maintenance responsibility; the cleaner current-v5 setup is not equivalent to the untouched old tag.

## Build layout and dependency ownership

Recommended CI sequence:

1. Check out the site repo.
2. Check out official Quartz at the selected full SHA into `quartz/`.
3. Check out the private vault into a separate `vault/` directory, without persisting its checkout credential.
4. Copy the site's `quartz.config.yaml` into `quartz/`; copy any deliberately customized static assets separately. These are site settings/assets, not parser patches.
5. From `quartz/`, run `npm ci` against upstream's unchanged lockfile.
6. Build the selected public content directory, for example `npx quartz build -d ../vault/Public`.
7. Upload only `quartz/public`, then deploy through the Pages repository's `github-pages` environment.

The build's `-d` selects the **content directory**, not the Quartz project directory. Keep the process working directory at the Quartz project so configuration and dependencies resolve there. The live build-CLI documentation describes `-d` differently; current source and the successful external-directory smoke run establish the actual behavior for the tested revision.

Sources: [directory argument](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/cli/args.js), [content-relative parsing](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/parse.ts), [configuration loading](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts).

Stock npm plugin versions are owned by `package-lock.json`; they do not require a second Git-plugin lockfile. If extra Git plugins are genuinely needed, commit their `quartz.lock.json` and use the current `npx quartz plugin install` workflow. Do not use `--latest` during deployment. The old `plugin restore` command is a deprecated compatibility alias on current v5, not the command to copy into a new setup.

Sources: [upstream npm lockfile](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/package-lock.json), [npm-source resolution](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts), [plugin CLI implementation](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/bootstrap-cli.mjs).

## Publication boundary: notes and attachments

**A private vault repository plus `publish: true` is not a complete privacy boundary.** Quartz explicitly warns that non-Markdown files are emitted regardless of Markdown filter plugins. An unreferenced image, PDF, recording, or other attachment can therefore become public even when the adjacent note is unpublished.

Prefer a deliberately public subtree containing both public notes and public attachments, and point the build at that subtree. Keep `ExplicitPublish` as an additional opt-in check for notes within it. Files inside that subtree must be treated as publishable; files outside it remain outside the build input. The read-only vault checkout credential still grants access to the whole vault repository, not only that directory.

If notes are currently scattered throughout the vault, first agree on a content boundary. Moving them under `Public/` may change content-relative paths and existing URLs; preserve the intended relative hierarchy or plan aliases before reorganizing. Do not silently move vault content or invent a custom exporter as part of a dependency upgrade. Existing `ignorePatterns` can supplement a boundary, but a denylist alone is easier to get wrong.

Sources: [official private-pages warning](https://quartz.jzhao.xyz/features/private-pages), [asset emitter](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/emitters/assets.ts).

## Triggers and least-privilege access

Keep build/deployment in the Pages repository. GitHub's normal Pages artifact deployment is repository-scoped; moving the build into the private vault and publishing into another repo adds a cross-repository handoff or generated-output push with write credentials.

- Site changes: keep the existing `master` push trigger.
- Manual rebuild: retain `workflow_dispatch`.
- Automatic vault changes: a vault workflow can dispatch the existing site workflow. The documented CLI form for this repository is `gh workflow run deploy.yml --repo Sparticuz/sparticuz.github.io --ref master`.
- A fine-grained PAT restricted to the site repository with `Actions: write` is the simplest additional dispatch credential for one site. An already-established GitHub App is preferable for short-lived installation tokens; creating an App solely for this site adds management overhead. No token or App was created here.
- Prefer `workflow_dispatch` to `repository_dispatch` here: the latter's fine-grained API permission is `Contents: write`, while workflow dispatch needs `Actions: write`.
- The workflow's normal `GITHUB_TOKEN` is scoped to its own repository; it does not automatically grant private-vault checkout or cross-repository dispatch access.
- A single-vault, read-only deploy key remains a narrow checkout credential. Disable credential persistence after checkout. Build needs `contents: read`; only the publish job needs `pages: write` and `id-token: write`.

Sources: [Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [checkout private repositories and credential persistence](https://github.com/actions/checkout), [deploy keys and GitHub Apps](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys), [workflow dispatch API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event), [repository dispatch API](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event), [CLI dispatch](https://cli.github.com/manual/gh_workflow_run).

## Local verification

Used a fresh checkout of the exact current-v5 revision above, its unchanged `package.json`/`package-lock.json`, and npm 11. Local Sharp library detection was disabled with `SHARP_IGNORE_GLOBAL_LIBVIPS=1`; this was an environment-only setting, not a repository change.

- `npm ci` succeeded: 326 packages installed.
- Copied the official default configuration; disabled analytics, generated social images, and draft filtering; enabled explicit publication; selected frontmatter-only created dates.
- `npx quartz build -d /tmp/quartz-research-vault/Public -o /tmp/quartz-research-output` succeeded with stock npm plugins, without a Git-plugin install or custom dependency manifests: three Markdown inputs parsed, one excluded, 58 files emitted.
- The output contained the public notes, lowercase canonical note file, and a redirect at the original mixed-case URL.
- The unpublished Markdown note was absent.
- An unreferenced `.txt` attachment inside the public subtree was emitted, confirming the documented risk.
- A synthetic attachment outside that subtree was absent.

This verifies content-directory selection, publication filtering/assets behavior, and basic build compatibility. It is not a full migration/browser verification of this site's configuration on the new upstream revision. No real vault content or production deployment was exercised.

## Existing deployment and outstanding facts

Read-only GitHub metadata confirmed this Pages site uses workflow-based deployment, with `master` as its configured source branch. The existing site workflow already owns artifact upload and Pages deployment; that ownership should remain unchanged.

Not inspected: the private vault's layout or workflow, whether it already dispatches site rebuilds, the actual permissions on existing credentials, and whether its current ignore rules protect every nonpublic attachment. No disclosure or exposure of real private files was established by this investigation.

Official upgrade references: [Migrating to Quartz 5](https://quartz.jzhao.xyz/getting-started/migrating), [Quartz plugin CLI](https://quartz.jzhao.xyz/cli/plugin), [Quartz hosting](https://quartz.jzhao.xyz/hosting).
