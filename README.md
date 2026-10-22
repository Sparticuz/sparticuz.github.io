# sparticuz.github.io

My personal site rendered using Quartz, with a backend of Obsidian

See [here](https://www.kmcnally.net/Journal/2024/20240611---Publish-your-Obsidian-Vault-using-Quartz) for more information

## Quartz dependencies

- `overrides/quartz.config.yaml` contains normal site configuration and npm plugin settings.

## Separate vault and deployment

This repository owns the build and GitHub Pages deployment. The private Obsidian repository is checked out into `quartz/content` with `NOTESPRIVATEKEY`; checkout credentials are not persisted. The existing vault layout, content-relative paths, and publication filter are preserved.

**Publication warning:** `publish: true` filters notes, not attachments. Non-Markdown files can still be published unless excluded by `ignorePatterns`.

Pushes to `master` and the existing `workflow_dispatch` trigger rebuild the site. A vault workflow can dispatch this workflow with a credential authorized for this repository.
