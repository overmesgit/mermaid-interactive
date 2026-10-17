// Shortened from src/net/http/pattern.go at Go's go1.22.0 tag, for the notes in examples/go-router.js.
// Only the lines the notes show are kept, as Go wrote them. "// ..." marks each cut, so line numbers differ from Go's.
// The whole file: https://github.com/golang/go/blob/go1.22.0/src/net/http/pattern.go

// Copyright 2023 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// Patterns for ServeMux routing.

package http
// ...
// conflictsWith reports whether p1 conflicts with p2, that is, whether
// there is a request that both match but where neither is higher precedence
// than the other.
//
//	Precedence is defined by two rules:
//	1. Patterns with a host win over patterns without a host.
//	2. Patterns whose method and path is more specific win. One pattern is more
//	   specific than another if the second matches all the (method, path) pairs
//	   of the first and more.
//
// If rule 1 doesn't apply, then two patterns conflict if their relationship
// is either equivalence (they match the same set of requests) or overlap
// (they both match some requests, but neither is more specific than the other).
func (p1 *pattern) conflictsWith(p2 *pattern) bool {
	if p1.host != p2.host {
		// Either one host is empty and the other isn't, in which case the
		// one with the host wins by rule 1, or neither host is empty
		// and they differ, so they won't match the same paths.
		return false
	}
	rel := p1.comparePathsAndMethods(p2)
	return rel == equivalent || rel == overlaps
}
// ...
// compareSegments determines the relationship between two segments.
func compareSegments(s1, s2 segment) relationship {
	if s1.multi && s2.multi {
		return equivalent
	}
	if s1.multi {
		return moreGeneral
	}
	if s2.multi {
		return moreSpecific
	}
	if s1.wild && s2.wild {
		return equivalent
	}
	if s1.wild {
		if s2.s == "/" {
			// A single wildcard doesn't match a trailing slash.
			return disjoint
		}
		return moreGeneral
	}
	if s2.wild {
		if s1.s == "/" {
			return disjoint
		}
		return moreSpecific
	}
	// Both literals.
	if s1.s == s2.s {
		return equivalent
	}
	return disjoint
}
// ...
func combineRelationships(r1, r2 relationship) relationship {
	switch r1 {
	case equivalent:
		return r2
	case disjoint:
		return disjoint
	case overlaps:
		if r2 == disjoint {
			return disjoint
		}
		return overlaps
	case moreGeneral, moreSpecific:
		switch r2 {
		case equivalent:
			return r1
		case inverseRelationship(r1):
			return overlaps
		default:
			return r2
		}
	default:
		panic(fmt.Sprintf("unknown relationship %q", r1))
	}
}
// ...
// describeConflict returns an explanation of why two patterns conflict.
func describeConflict(p1, p2 *pattern) string {
	mrel := p1.compareMethods(p2)
	prel := p1.comparePaths(p2)
	rel := combineRelationships(mrel, prel)
	if rel == equivalent {
		return fmt.Sprintf("%s matches the same requests as %s", p1, p2)
	}
	if rel != overlaps {
		panic("describeConflict called with non-conflicting patterns")
	}
	if prel == overlaps {
		return fmt.Sprintf(`%[1]s and %[2]s both match some paths, like %[3]q.
But neither is more specific than the other.
%[1]s matches %[4]q, but %[2]s doesn't.
%[2]s matches %[5]q, but %[1]s doesn't.`,
			p1, p2, commonPath(p1, p2), differencePath(p1, p2), differencePath(p2, p1))
	}
	if mrel == moreGeneral && prel == moreSpecific {
		return fmt.Sprintf("%s matches more methods than %s, but has a more specific path pattern", p1, p2)
	}
	if mrel == moreSpecific && prel == moreGeneral {
		return fmt.Sprintf("%s matches fewer methods than %s, but has a more general path pattern", p1, p2)
	}
	return fmt.Sprintf("bug: unexpected way for two patterns %s and %s to conflict: methods %s, paths %s", p1, p2, mrel, prel)
}
// ...
