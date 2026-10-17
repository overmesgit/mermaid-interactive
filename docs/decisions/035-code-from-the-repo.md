# ADR-035 Read code files from the repo, not a code/ folder

- Status: accepted
- Date: 2026-10-14
- Supersedes: the `code/` folder in [ADR-030](030-code-folder.md). Packing the files as gzip, the empty fence, and the whole-file view stay.

## Context

ADR-030 had the writer copy every file a note shows into a `code/` folder next to the content file. The files are already in the repo the explanation is about, so the copy is extra work. It is also a second version of each file, so it can fall out of step with the real one.

## Decision

A `file=` path is relative to the root of the repo the explanation is about. The join runs from that root, so it reads the files where they are.

There is no separate list of files. Each note already names its file, so the join collects the paths from the `file=` fences in the content file. A path named by several notes is packed once.

The whole file is packed, not only the lines a note shows. `lines` picks what the note shows first, and the panel can still open the whole file.

An older version is named with a git revision before the path, as `git show` takes it:

```md
~~~go file=main:api/session.go lines=30-41
~~~
```

The join reads a path with `:` through `git show`, and any other path from the working tree:

```bash
{
  sed -e '/^\/\* DIAGRAMS \*\/$/r '"$content" -e '/^\/\* DIAGRAMS \*\/$/d' "$skill/assets/explainer.html"
  sed -n 's/^[[:space:]]*~~~.*[[:space:]]file=\([^[:space:]]*\).*/\1/p' "$content" | sort -u |
  while read -r f; do
    printf '<script type="application/gzip" data-file="%s">\n' "$f"
    case "$f" in
      *:*) git show "$f" ;;
      *)   cat "$f" ;;
    esac | gzip -cn | base64
    printf '</script>\n'
  done
} > explanation.html
```

`$skill` is the skill's folder and `$content` is the content file. `sed` reads only lines that open a `~~~` fence, so `file=` written in a sentence is not packed. With no `file=` fences the loop packs nothing, so one command covers both cases.

A diff is not a file, so it cannot be shown. Two notes, one on the old version and one on the new, show the same change.

## Consequences

The writer copies nothing. A note names the file it shows, and that is the whole setup.

A line range is written against the file as it is now. If the file changes before the join, the range can point at the wrong lines, and the page's check only notices a range that runs past the end. To freeze a file, name a commit: `file=4f2c1e9:api/session.go`.

The join must run from the repo root, and naming an older version needs git.

A path cannot contain a space, because the fence ends the path there. A path with `:` is read as a revision and a path. It still cannot contain `"`, as in ADR-030.

The page's check also reports a `file=` whose packed file is empty, which is what a missing path or a wrong revision leaves.

Reading files while previewing with `?src=` (ADR-034) is settled in ADR-038.
