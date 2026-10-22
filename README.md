# sparticuz.github.io

My personal site rendered using Quartz, with a backend of Obsidian

See [here](https://www.kmcnally.net/Journal/2024/20240611---Publish-your-Obsidian-Vault-using-Quartz) for more information

## Quartz dependencies

The deployment workflow pins Quartz to `v5.0.0`, uses Node 24, and tracks GitHub Actions by major version. Overrides are copied into the Quartz checkout before `npm ci`.

- `overrides/package.json` and `overrides/package-lock.json` refresh npm dependencies within Quartz's supported ranges. The shared Quartz types and utilities use published npm packages so core and plugins agree on URL normalization.
- `overrides/quartz.config.yaml` contains the site configuration and plugin settings; `overrides/quartz.lock.json` pins plugin commits.
- The standard frontmatter parser recognizes `created`, `updated`, and `publishDate`, replacing the custom date transformer. Dates still come only from frontmatter, with `created` used for display and feeds. Date-only YAML values use local midnight.
- Quartz 5 generates lowercase URLs. The alias-redirects plugin preserves original mixed-case note URLs with redirect pages.

CI runs `node --test quartz-upgrade.test.mjs` in the Quartz checkout before building, covering YAML dates and mixed-case link resolution. When updating dependencies, regenerate the npm manifests and plugin lockfile in a Quartz checkout and copy them back into `overrides/`.
