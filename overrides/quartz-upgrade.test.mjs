import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { resolveRelative, slugifyFilePath } from "@quartz-community/utils";
import { VFile } from "vfile";
import YAML from "yaml";
import { NoteProperties } from "./.quartz/plugins/note-properties/dist/index.js";
import { CreatedModifiedDate } from "./.quartz/plugins/created-modified-date/dist/index.js";
import { CrawlLinks } from "./.quartz/plugins/crawl-links/dist/index.js";

const config = YAML.parse(await readFile("quartz.config.yaml", "utf8"));
const options = (name) =>
  config.plugins.find(
    (plugin) => plugin.source === `github:quartz-community/${name}`,
  ).options;

test("site YAML date fields survive frontmatter parsing", async () => {
  const ctx = { allSlugs: [], argv: { directory: "content" } };
  const processor = unified()
    .use(remarkParse)
    .use(NoteProperties(options("note-properties")).markdownPlugins(ctx))
    .use(
      CreatedModifiedDate(options("created-modified-date")).markdownPlugins(
        ctx,
      ),
    );

  for (const [values, expected] of [
    [
      ["2020-02-03", "2021-04-05", "2022-06-07"],
      [new Date(2020, 1, 3), new Date(2021, 3, 5), new Date(2022, 5, 7)],
    ],
    [
      [
        '"2023-08-09T10:11:12-04:00"',
        '"2024-09-10T11:12:13+02:00"',
        '"2025-10-11T12:13:14Z"',
      ],
      [
        new Date("2023-08-09T14:11:12Z"),
        new Date("2024-09-10T09:12:13Z"),
        new Date("2025-10-11T12:13:14Z"),
      ],
    ],
  ]) {
    const file = new VFile({
      path: "content/date-check.md",
      value: `---\ncreated: ${values[0]}\nupdated: ${values[1]}\npublishDate: ${values[2]}\n---\nDate check`,
    });
    await processor.run(processor.parse(file), file);
    assert.deepEqual(file.data.dates, {
      created: expected[0],
      modified: expected[1],
      published: expected[2],
    });
    assert.equal(file.data.defaultDateType, "created");
  }
});

test("mixed-case links target the slugs emitted by Quartz", async () => {
  const source = slugifyFilePath("index.md");
  const target = slugifyFilePath("Journal/My Note.md");
  const ctx = { allSlugs: [source, target] };
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(CrawlLinks(options("crawl-links")).htmlPlugins(ctx));
  const file = new VFile({ value: "[Note](Journal/My%20Note.md)" });
  file.data.slug = source;
  const tree = await processor.run(processor.parse(file), file);
  assert.equal(
    tree.children[0].children[0].properties.href,
    resolveRelative(source, target),
  );
});
