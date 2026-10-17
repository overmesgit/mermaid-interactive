// Shortened from src/net/http/routing_index.go at Go's go1.22.0 tag, for the notes in examples/go-router.js.
// Only the lines the notes show are kept, as Go wrote them. "// ..." marks each cut, so line numbers differ from Go's.
// The whole file: https://github.com/golang/go/blob/go1.22.0/src/net/http/routing_index.go

// Copyright 2023 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package http

import "math"

// A routingIndex optimizes conflict detection by indexing patterns.
//
// The basic idea is to rule out patterns that cannot conflict with a given
// pattern because they have a different literal in a corresponding segment.
// See the comments in [routingIndex.possiblyConflictingPatterns] for more details.
type routingIndex struct {
	// map from a particular segment position and value to all registered patterns
	// with that value in that position.
	// For example, the key {1, "b"} would hold the patterns "/a/b" and "/a/b/c"
	// but not "/a", "b/a", "/a/c" or "/a/{x}".
	segments map[routingIndexKey][]*pattern
	// All patterns that end in a multi wildcard (including trailing slash).
	// We do not try to be clever about indexing multi patterns, because there
	// are unlikely to be many of them.
	multis []*pattern
}

type routingIndexKey struct {
	pos int    // 0-based segment position
	s   string // literal, or empty for wildcard
}

func (idx *routingIndex) addPattern(pat *pattern) {
	if pat.lastSegment().multi {
		idx.multis = append(idx.multis, pat)
	} else {
		if idx.segments == nil {
			idx.segments = map[routingIndexKey][]*pattern{}
		}
		for pos, seg := range pat.segments {
			key := routingIndexKey{pos: pos, s: ""}
			if !seg.wild {
				key.s = seg.s
			}
			idx.segments[key] = append(idx.segments[key], pat)
		}
	}
}
// ...
	// For ordinary and multi patterns, the only conflicts can be with a multi,
	// or a pattern that has the same literal or a wildcard at some literal
	// position.
	// We could intersect all the possible matches at each position, but we
	// do something simpler: we find the position with the fewest patterns.
	var lmin, wmin []*pattern
	min := math.MaxInt
	hasLit := false
	for i, seg := range pat.segments {
		if seg.multi {
			break
		}
		if !seg.wild {
			hasLit = true
			lpats := idx.segments[routingIndexKey{s: seg.s, pos: i}]
			wpats := idx.segments[routingIndexKey{s: "", pos: i}]
			if sum := len(lpats) + len(wpats); sum < min {
				lmin = lpats
				wmin = wpats
				min = sum
			}
		}
	}
	if hasLit {
		apply(lmin)
		apply(wmin)
		return err
// ...
