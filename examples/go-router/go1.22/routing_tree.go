// Shortened from src/net/http/routing_tree.go at Go's go1.22.0 tag, for the notes in examples/go-router.js.
// Only the lines the notes show are kept, as Go wrote them. "// ..." marks each cut, so line numbers differ from Go's.
// The whole file: https://github.com/golang/go/blob/go1.22.0/src/net/http/routing_tree.go

// Copyright 2023 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// This file implements a decision tree for fast matching of requests to
// patterns.
//
// The root of the tree branches on the host of the request.
// The next level branches on the method.
// The remaining levels branch on consecutive segments of the path.
//
// The "more specific wins" precedence rule can result in backtracking.
// For example, given the patterns
//     /a/b/z
//     /a/{x}/c
// we will first try to match the path "/a/b/c" with /a/b/z, and
// when that fails we will try against /a/{x}/c.

package http
// ...
func (root *routingNode) match(host, method, path string) (*routingNode, []string) {
	if host != "" {
		// There is a host. If there is a pattern that specifies that host and it
		// matches, we are done. If the pattern doesn't match, fall through to
		// try patterns with no host.
		if l, m := root.findChild(host).matchMethodAndPath(method, path); l != nil {
			return l, m
		}
	}
	return root.emptyChild.matchMethodAndPath(method, path)
}
// ...
func (n *routingNode) matchMethodAndPath(method, path string) (*routingNode, []string) {
	if n == nil {
		return nil, nil
	}
	if l, m := n.findChild(method).matchPath(path, nil); l != nil {
		// Exact match of method name.
		return l, m
	}
	if method == "HEAD" {
		// GET matches HEAD too.
		if l, m := n.findChild("GET").matchPath(path, nil); l != nil {
			return l, m
		}
	}
	// No exact match; try patterns with no method.
	return n.emptyChild.matchPath(path, nil)
}
// ...
	// Get the first segment of path.
	seg, rest := firstSegment(path)
	// First try matching against patterns that have a literal for this position.
	// We know by construction that such patterns are more specific than those
	// with a wildcard at this position (they are either more specific, equivalent,
	// or overlap, and we ruled out the first two when the patterns were registered).
	if n, m := n.findChild(seg).matchPath(rest, matches); n != nil {
		return n, m
	}
	// If matching a literal fails, try again with patterns that have a single
	// wildcard (represented by an empty string in the child mapping).
	// Again, by construction, patterns with a single wildcard must be more specific than
	// those with a multi wildcard.
	// We skip this step if the segment is a trailing slash, because single wildcards
	// don't match trailing slashes.
	if seg != "/" {
		if n, m := n.emptyChild.matchPath(rest, append(matches, seg)); n != nil {
			return n, m
		}
	}
	// Lastly, match the pattern (there can be at most one) that has a multi
	// wildcard in this position to the rest of the path.
	if c := n.findChild("*"); c != nil {
		// Don't record a match for a nameless wildcard (which arises from a
		// trailing slash in the pattern).
		if c.pattern.lastSegment().s != "" {
			matches = append(matches, pathUnescape(path[1:])) // remove initial slash
		}
		return c, matches
	}
	return nil, nil
}
// ...
