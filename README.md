# sparticuz.github.io

My personal site rendered using Quartz, with a backend of Obsidian

See [here](https://www.kmcnally.net/Journal/2024/20240611---Publish-your-Obsidian-Vault-using-Quartz) for more information

## Quartz dependencies

The deployment workflow pins Quartz 5 to reviewed upstream commit `97a2d05f80c4c50534959b1d0d41cc4b3895625e`, uses Node 24, and tracks GitHub Actions by major version. This revision is newer than the `v5.0.0` tag even though upstream still reports version 5.0.0.

- Quartz's own `package.json` and `package-lock.json` are used unchanged. `npm ci` installs its stock npm plugins; no separate plugin restore or dependency overlays are needed.
- `overrides/quartz.config.yaml` contains normal site configuration and npm plugin settings. The remaining overrides are site assets and regression checks, not Quartz source patches.
- The standard frontmatter parser recognizes `created`, `updated`, and `publishDate`, replacing the custom date transformer. Dates still come only from frontmatter, with `created` used for display and feeds. Date-only YAML values use local midnight.
- Quartz 5 generates lowercase URLs. The alias-redirects plugin preserves original mixed-case note URLs with redirect pages.

CI runs `node --test quartz-upgrade.test.mjs` in the Quartz checkout before building, covering YAML dates and mixed-case link resolution. To upgrade, review and update the upstream commit pin, then run these checks and a local site build using that revision's unchanged dependency manifests.

## Separate vault and deployment

This repository owns the build and GitHub Pages deployment. The private Obsidian repository is checked out into `quartz/content` with `NOTESPRIVATEKEY`; checkout credentials are not persisted. The existing vault layout, content-relative paths, and publication filter are preserved.

**Publication warning:** `publish: true` filters notes, not attachments. Non-Markdown files can still be published unless excluded by `ignorePatterns`. This upgrade intentionally does not reorganize the vault or restrict it to a public subtree.

Pushes to `master` and the existing `workflow_dispatch` trigger rebuild the site. A vault workflow can dispatch this workflow with a credential authorized for this repository; no new dispatch credentials or vault workflow are provisioned here.

See [the deployment investigation](QUARTZ-DEPLOYMENT-RESEARCH.md) for the alternatives and publication-boundary findings.
