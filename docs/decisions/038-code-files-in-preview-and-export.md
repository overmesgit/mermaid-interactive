# ADR-038 Preview reads code files from the server, and Export packs them

- Status: accepted
- Date: 2026-10-15
- Settles: the open question in [ADR-035](035-code-from-the-repo.md) on reading files while previewing with `?src=`

## Context

Code files reach the page only through the join, which packs them. While writing, an author previews with `?src=` ([ADR-034](034-pick-the-content-file.md)), and nothing is packed then, so every `file=` fence would show as missing until the join. The Export button had the same gap, because it inlines the scripts and nothing else.

## Decision

When a file is not packed and the page is served over HTTP, the page reads it from the server, by its path from the page's folder. That works when the server serves the repo the files are in, as in the preview of this repo's own How lesson. A path with a revision, such as `main:api/session.go`, exists only in git, so a preview reports it as missing.

Export packs every file a note names, the same way the join does: gzip, base64, in a script tag after the engine. A file it cannot read is left out, and the saved file reports it. The template export packs nothing, because it holds no content.

## Consequences

A preview shows working-tree files as they are now, and the joined page shows them as they were at the join.

A preview of an explanation about another repo cannot read that repo's files. The joined page can.

The page's check reports a missing file in the preview too, so a revision path is listed there until the join.
