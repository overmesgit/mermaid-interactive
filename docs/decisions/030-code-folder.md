# ADR-030 Notes show code from a code folder, packed into the page with gzip

- Status: accepted, not built yet
- Date: 2026-10-11

## Context

`~~~js source=name` ([ADR-024](024-notes-name-functions.md)) shows a function the page has loaded. That only covers the engine's own code. A PR explanation had to paste its code into each note, so the same function was copied into several notes, and a note could not show the rest of the file around a snippet.

The deliverable is one HTML file ([ADR-027](027-one-file-from-a-template.md)). A page opened from disk cannot read a folder next to it, so the code has to be inside the file. Code pasted into the page as raw text breaks it when the code contains `</script`, which HTML and JavaScript files often do.

## Decision

An explanation can have a `code/` folder next to `diagrams.js`. It holds the files the explanation needs, in any layout. A file can be a whole source file, part of one, an older version, or a `.diff`.

A note names a file and an optional line range in an empty fence:

```md
~~~go file=api/session.go lines=40-58
~~~
```

The path is relative to `code/`. `lines` is 1-based and inclusive. Without it the whole file is shown. The fence's language is used as written.

The panel shows the snippet under a header with the path and the lines. Clicking the header opens the whole file in the panel, with that range highlighted.

The join packs each file as gzip, then base64, in an inert script tag after the engine:

```html
<script type="application/gzip" data-file="api/session.go">H4sIAAAA…</script>
```

```bash
{
  cat skill/assets/head.html diagrams.js skill/assets/tail.html
  (cd code && find . -type f | sort | while read -r f; do
    printf '<script type="application/gzip" data-file="%s">\n' "${f#./}"
    gzip -cn "$f" | base64
    printf '</script>\n'
  done)
} > explanation.html
```

The page decodes a file the first time a note needs it, with `atob` and `DecompressionStream("gzip")`. `atob` ignores line breaks, so the different wrapping of `base64` on Linux and macOS does not matter. `gzip -n` leaves out the name and the time, so the same folder joins to the same bytes.

`source=` stays for the engine's own code. Code that is not in a file, such as a three-line sketch, can still be written in the note.

## Consequences

A code file can hold anything, including `</script`, because base64 has no `<`. The code is about three times smaller than raw text.

The code is not readable in the HTML source. It is read through the page. `diagrams.js` and the engine stay plain text.

The join needs a POSIX shell with `find`, `gzip`, and `base64`. Linux, macOS, and Git Bash have them. Plain PowerShell does not.

`DecompressionStream` needs a current browser: Chrome 80, Firefox 113, Safari 16.4, or later.

The page's check ([ADR-029](029-join-and-check-in-page.md)) also reports a `file=` that names no packed file, or a `lines` range past the end of the file.

A file path must not contain `"`. It is written into an attribute.
