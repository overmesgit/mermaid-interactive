# ADR-048 Pack code files into the content file, and preview it on the site

- Status: accepted
- Date: 2026-10-16
- Supersedes: where the files go in [ADR-030](030-code-folder.md) and [ADR-038](038-code-files-in-preview-and-export.md). They were packed into the page as script tags. Now they are packed into the content file.

## Context

Someone who has only a content file had nowhere to look at it. To see one, they had to clone this repo and run a server, or have the skill's template and a shell.

A page on GitHub Pages could fill the template in the browser. But code notes name files from the repo the explanation is about, and the site cannot see that repo. The files were only added when the HTML was built, as separate tags in the page, so a content file on its own never carried them.

## Decision

Building the HTML is split into two steps.

1. **Pack.** A shell command copies the content file to `packed.js` and adds one line per file a note names, as gzip and base64: `packFile("api/session.go", `...`);`. `packFile()` is a helper that loads before the content, like `arrow()` and `md`. So the packed file is the whole explanation, and it needs no repo.
2. **Fill.** The same `sed` command as before puts `packed.js` into the template.

The page reads a code file from what `packFile()` stored first. A `?src=` preview still reads files from the server when they are not packed. The Export button packs into the content script the same way, and skips files the content already carries, so there is one packing format.

`preview.html`, on GitHub Pages, takes a content file pasted, opened, or dropped. It fills the template in the browser and shows it in a frame. Download HTML saves the same page. Nothing is uploaded.

A content file is a script, so opening one runs it. The frame is sandboxed, so the script runs with no origin and cannot reach the site. The frame loads from a blob URL instead of `srcdoc`, because the page writes each move into the link's `#` so Back undoes it, and a `srcdoc` frame refuses that.

## Consequences

A packed content file can be handed to anyone. They drop it on the preview page to read it, and download the HTML if they want one file.

A content file that was not packed still previews. Its code notes say the file is not packed, and the ⚠ list names them.

The skill writes two files, `packed.js` and `explanation.html`. Packing an already packed file adds the files twice, which works but wastes space, so the format guide says to pack from the original.

The preview page has no live update and cannot load a link. Both were left out on purpose. Loading a link would run a stranger's script, which the sandbox now makes possible to allow later.
