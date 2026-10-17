// A PR-style explanation of the Go 1.22 ServeMux router: methods, wildcards, and "the more specific pattern wins".
// The change is proposal golang/go#61410, landed as about 20 commits by Jonathan Amsterdam in September 2023.
// Its code notes show Go's source from the go1.21.0 and go1.22.0 tags, shortened to the lines they show, in examples/go-router/.
// examples/go-router.packed.js is this file packed from the repo root, so the editor can show the code. Pack it again after editing this file.
// It follows docs/rules.md: an overview first, the change side by side, processes instead of sentences, arrow labels instead of arrow notes,
// and one color per type of thing: requests, routes, handlers, and the router, in the diagrams and the text.

window.DIAGRAMS = {
  types: { request: "Request", route: "Route", handler: "Handler", router: "Router" },
  tabs: [
    { id: "overview", label: "Go 1.22 router", lesson: ["overview", "wins", "conflict", "tree", "outcomes"] },
    { id: "basics", label: "Basics" },
  ],
  views: {
    overview: {
      tab: "overview",
      parent: null,
      title: "What changed",
      summary: "Go 1.22's router can match the method and capture parts of the path.",
      story: md`
        **The change in one sentence:** Go 1.22's standard router understands patterns like \`GET /posts/{id}\`, so most servers no longer need a third-party router such as chi or gorilla/mux.

        The picture shows one request, [\`GET /posts/42\`](~request), in both versions. On the left, the Go 1.21 [ServeMux](#oldMux) matches only the path, so the handler checks the method and cuts the id out of the URL itself.

        [](#oldHandler)

        On the right, the Go 1.22 [ServeMux](#newMux) matches the method and the path, and hands the handler the id.

        [](#newHandler)

        **The routes used in every step**, a small blog API:

        ~~~go
        mux.HandleFunc("GET /posts/{id}", getPost)
        mux.HandleFunc("GET /posts/new", newPostForm)
        mux.HandleFunc("GET /posts/{id}/comments", listComments)
        mux.HandleFunc("POST /posts", createPost)
        ~~~

        **What's ahead:**

        1. \`GET /posts/new\` matches two of these routes, and the more specific one runs.
        2. Two routes where neither wins are refused at startup.
        3. How a request finds its route quickly.
        4. What a request gets when no route matches.

        **The original change.** Go reviews changes on Gerrit, not as GitHub pull requests. The work is proposal [golang/go#61410](https://github.com/golang/go/issues/61410). It landed as about 20 commits in September 2023. The main reviews are [patterns](https://go-review.googlesource.com/c/go/+/526815), [the conflict check](https://go-review.googlesource.com/c/go/+/526616), [the routing tree](https://go-review.googlesource.com/c/go/+/527315), and [ServeMux using them](https://go-review.googlesource.com/c/go/+/528039).

        New to HTTP routing? The **Basics** tab shows what a request is made of and what a router does, in one picture.
      `,
      chart: `flowchart LR
  subgraph before["Go 1.21"]
    direction TB
    oldReq["GET /posts/42<br><small>The request</small>"]
    oldMux["ServeMux<br><small>Exact path, or the longest<br>prefix ending in /</small>"]
    oldHandler["Handler for /posts/<br><small>Checks the method,<br>cuts the id out of the path</small>"]
    oldReq --> oldMux
    oldMux -->|"/posts/ is the longest prefix"| oldHandler
  end
  subgraph after["Go 1.22"]
    direction TB
    newReq["GET /posts/42<br><small>The request</small>"]
    newMux["ServeMux<br><small>Method, host, path,<br>and wildcards</small>"]
    newHandler["Handler for GET /posts/{id}<br><small>Gets id = 42<br>from r.PathValue</small>"]
    newReq --> newMux
    newMux -->|"GET /posts/{id} matches"| newHandler
  end
  before ~~~ after`,
      nodeInteractions: {
        oldReq: { label: "GET /posts/42", kicker: "Request", type: "request", tooltip: "The same request on both sides." },
        oldMux: {
          label: "ServeMux, Go 1.21",
          type: "router",
          kicker: "Before",
          tooltip: "Tries the exact path, then the longest registered prefix that ends in a slash.",
          body: md`
            The whole matcher: look the path up in a map, and if that fails, walk the slash-ending patterns from longest to shortest. The method is never read.

            ~~~go file=examples/go-router/go1.21/server.go lines=13-30 mark=22-28
            ~~~
          `,
        },
        oldHandler: {
          label: "Handler for /posts/",
          kicker: "Your code, before",
          type: "handler",
          tooltip: "Has to check the method and parse the id itself.",
          body: md`
            A typical handler, sketched. Most of it is routing:

            ~~~go
            func posts(w http.ResponseWriter, r *http.Request) {
                if r.Method != http.MethodGet {
                    http.Error(w, "method not allowed", 405)
                    return
                }
                id := strings.TrimPrefix(r.URL.Path, "/posts/")
                if id == "" || strings.Contains(id, "/") {
                    http.NotFound(w, r)
                    return
                }
                // ... finally, the actual work
            }
            ~~~
          `,
        },
        newReq: { label: "GET /posts/42", kicker: "Request", type: "request", tooltip: "The same request on both sides." },
        newMux: {
          label: "ServeMux, Go 1.22",
          type: "router",
          kicker: "After",
          status: "changed",
          tooltip: "Same type and API. Inside, a tree finds the route and an index checks new routes for conflicts.",
          body: md`
            The map and the sorted list are replaced by a tree, used to match requests, and an index, used to check each new route. The Go 1.21 router is kept for programs that need it.

            ~~~go file=examples/go-router/go1.22/server.go lines=34-40 mark=36-37
            ~~~
          `,
        },
        newHandler: {
          label: "Handler for GET /posts/{id}",
          kicker: "Your code, after",
          type: "handler",
          status: "changed",
          tooltip: "The method check and the parsing are gone.",
          body: md`
            ~~~go
            func getPost(w http.ResponseWriter, r *http.Request) {
                id := r.PathValue("id") // "42"
                // ... the actual work
            }
            ~~~

            The router stores the matched values on the request, in the order the wildcards appear. \`PathValue\` looks the name up in the route and returns its value.

            ~~~go file=examples/go-router/go1.22/request.go lines=13-18
            ~~~
          `,
        },
      },
      edgeInteractions: [
        ["oldReq", "oldMux"],
        ["oldMux", "oldHandler"],
        ["newReq", "newMux"],
        ["newMux", "newHandler"],
      ],
    },

    wins: {
      tab: "overview",
      parent: null,
      title: "Two routes match: the more specific wins",
      summary: "Like addresses, the route that says more goes first: GET /posts/new above GET /posts/{id}.",
      story: md`
        **This is the hard part.** One request matches two of the routes:

        | | | |
        | --- | --- | --- |
        | request | [\`GET /posts/new\`](~request) | |
        | route 1 | [\`GET /posts/new\`](~route) | |
        | route 2 | [\`GET /posts/{id}\`](~route) | with \`id = new\` |

        Which one runs? Your first guess is probably the exact match, [route 1](~route), and it is right. Addresses show why.

        **Imagine a mail room** that sorts its addresses from the most exact to the least, and sends each letter to the first one that fits.

        | | address |
        | --- | --- |
        | 1 | \`Lyon, Rose Street, house 12\` |
        | 2 | \`Lyon, Rose Street, any house\` |
        | 3 | \`Lyon, any street\` |

        A letter to \`house 12\` fits all three and stops at 1. A letter to \`house 7\` stops at 2. An address goes higher when it says everything the one below says, and more: that is **more specific**.

        **A route is an address for requests.** The method is the city, each path segment is the next part, and \`{id}\` is \`any house\`:

        | part | routes 1 and 2 | addresses 1 and 2 | |
        | --- | --- | --- | --- |
        | method, city | \`GET\`, \`GET\` | \`Lyon\`, \`Lyon\` | the same |
        | segment 1, street | \`posts\`, \`posts\` | \`Rose Street\`, \`Rose Street\` | the same |
        | segment 2, house | \`new\`, \`{id}\` | \`house 12\`, \`any house\` | 1 says more |

        So [route 1](~route) goes above [route 2](~route), the request stops there, and [newPostForm](#winner) runs. [\`GET /posts/42\`](~request) is the letter to \`house 7\`: it reaches [route 2](~route).

        [](#compare)

        **What Go really does.** Go never writes the list down, and still gets the same answer:

        1. **At startup** it compares each new route with the ones it could clash with. A pair that cannot be put in order, like \`any city, Rose Street, house 12\` and \`Lyon, Rose Street, any house\`, makes it panic. That is the next step.
        2. **On each request** it reads the method, then each segment, and tries the exact value before \`any\`. The first full match is the one the list would give. Step 4 shows it as a tree.

        Registration order never decides, on purpose. Packages often register routes from \`init\` functions, which run in an order you do not control.
      `,
      chart: `flowchart TB
  req["Request<br><small>GET /posts/new</small>"]
  subgraph order["The routes that match it, most specific first"]
    direction TB
    pNew["1. GET /posts/new<br><small>Matches: the first match wins</small>"]
    pId["2. GET /posts/{id}<br><small>Would match, with id = new</small>"]
    pNew ~~~ pId
  end
  pComments["GET /posts/{id}/comments<br><small>Needs three segments</small>"]
  pPost["POST /posts<br><small>Other method, other path</small>"]
  compare["At startup: compare part by part<br><small>method: GET, GET<br>segment 1: posts, posts<br>segment 2: new, {id}</small>"]
  winner["newPostForm runs<br><small>The handler of route 1</small>"]
  req -->|checked from the top| pNew
  pNew -->|first match| winner
  req -.->|no| pComments
  req -.->|no| pPost
  compare -.->|puts route 1 above route 2| pNew`,
      nodeInteractions: {
        req: { label: "Request GET /posts/new", kicker: "Request", type: "request", tooltip: "The request being routed." },
        pNew: { label: "Route 1: GET /posts/new", kicker: "Route", type: "route", tooltip: "First in the order, and it matches, so it wins." },
        pId: { label: "Route 2: GET /posts/{id}", kicker: "Route", type: "route", tooltip: "Would match, with id = new, but route 1 comes first." },
        pComments: { label: "Route GET /posts/{id}/comments", kicker: "Route", type: "route", tooltip: "Needs a third segment, so it does not match." },
        pPost: { label: "Route POST /posts", kicker: "Route", type: "route", tooltip: "Different method and path, so it does not match." },
        compare: {
          label: "At startup: compare part by part",
          kicker: "The rule",
          tooltip: "When a route is registered, it is compared with the routes it could clash with. This is what puts route 1 above route 2.",
          body: md`
            Two routes are compared with each other only at startup, when a route is registered. A request never triggers this comparison.

            Comparing the methods of two routes, or their paths, gives one of five answers:

            1. **The same.** \`/posts/{id}\` and \`/posts/{x}\`. The wildcard's name does not matter, so registering both panics.
            2. **More specific.** \`/posts/new\` against \`/posts/{id}\`. Every request the first matches, the second matches too, but not the other way round.
            3. **More general.** \`/posts/{id}\` against \`/posts/new\`, the same pair the other way round.
            4. **No overlap.** \`/posts/new\` against \`/posts/edit\`. No request matches both.
            5. **Overlap, and neither contains the other.** \`/posts/{id}\` against \`/{kind}/new\`. Both match \`/posts/new\`, but each also matches requests the other does not.

            Here the methods are the same, \`GET\` and \`GET\`, and the paths give answer 2: segment 2 is \`new\` against \`{id}\`.

            ~~~go file=examples/go-router/go1.22/pattern.go lines=37-69 mark=58-63
            ~~~

            Then the two answers are combined:

            - The method and the path both the same: the same route twice, which panics at registration.
            - One more specific, and the other the same or also more specific: that route goes first.
            - One more specific and the other more general: there is no order, and registration panics. That case is the next step.
            - Either one with no overlap: no request matches both, so the two routes never compete.

            ~~~go file=examples/go-router/go1.22/pattern.go lines=71-94 mark=82-90
            ~~~
          `,
        },
        winner: {
          label: "newPostForm runs",
          kicker: "Result",
          type: "handler",
          tooltip: "The handler of GET /posts/new, the first route in the order that matches.",
          body: md`
            Checked by running Go 1.22 with the four routes:

            | request | runs | |
            | --- | --- | --- |
            | \`GET /posts/new\` | \`GET /posts/new\` | |
            | \`GET /posts/42\` | \`GET /posts/{id}\` | \`id = "42"\` |
            | \`HEAD /posts/42\` | \`GET /posts/{id}\` | \`id = "42"\` |

            HEAD reaches \`GET /posts/{id}\`, because a GET route also serves HEAD.
          `,
        },
      },
      edgeInteractions: [
        ["req", "pNew"],
        ["pNew", "winner"],
        ["req", "pComments"],
        ["req", "pPost"],
        ["compare", "pNew"],
      ],
    },

    conflict: {
      tab: "overview",
      parent: null,
      title: "Neither wins: refused at startup",
      summary: "Adding /posts/new next to GET /posts/{id} makes the program panic when it registers the route.",
      story: md`
        Add one more route, [\`/posts/new\`](#add) with no method, next to the four. Now two routes match the request [\`GET /posts/new\`](~request), and each spells out a part the other does not:

        | | method | path |
        | --- | --- | --- |
        | [\`/posts/new\`](~route) | any | \`/posts/new\`, spelled out |
        | [\`GET /posts/{id}\`](~route) | \`GET\`, spelled out | \`/posts/{id}\` |

        So [neither is more specific](#cmpId), and there is no rule to pick one. They are the two addresses from the previous step that cannot be put in order: [\`/posts/new\`](~route) is \`any city, Rose Street, house 12\`, and [\`GET /posts/{id}\`](~route) is \`Lyon, Rose Street, any house\`.

        The router does not guess. \`HandleFunc\` panics, so the server fails at startup, not on some request later.

        [](#boom)

        To find the route it clashes with, the router does not compare against every route. An [index](#indexData), filled as routes are registered, narrows them down first.

        [](#index)
      `,
      chart: `flowchart LR
  add["HandleFunc /posts/new<br><small>No method, so every method</small>"]
  indexData["The index, for the four routes<br><small>segment 1 = posts: all four<br>segment 2 = new: GET /posts/new<br>segment 2 = a wildcard: GET /posts/{id},<br>GET /posts/{id}/comments<br>segment 3 = comments: GET /posts/{id}/comments</small>"]
  index["Look up candidates<br><small>Segment 2 is new: three candidates</small>"]
  cmpNew["Against GET /posts/new<br><small>Same path, fewer methods.<br>GET /posts/new is more specific</small>"]
  cmpId["Against GET /posts/{id}<br><small>Wider method, narrower path.<br>Neither is more specific</small>"]
  boom["panic at startup<br><small>conflicts with GET /posts/{id}</small>"]
  add --> index
  indexData -.->|read| index
  index -->|1st| cmpNew
  index -->|2nd| cmpId
  cmpId --> boom`,
      nodeInteractions: {
        add: {
          label: "HandleFunc /posts/new",
          kicker: "Registration",
          type: "route",
          tooltip: "The fifth route. It has no method, so it matches every method.",
          body: md`
            Registration parses the route, asks the index for candidates, and compares each one. Only then is the route added to the tree and the index.

            ~~~go file=examples/go-router/go1.22/server.go lines=115-157 mark=142-152
            ~~~
          `,
        },
        indexData: {
          label: "The index",
          kicker: "Data",
          tooltip: "A map from a segment position and its literal to the routes that have it there.",
          body: md`
            For the four routes, the index holds these lists. A wildcard is stored under an empty literal. Routes ending in a slash or \`{name...}\` go in a separate list, which is empty here.

            | Key | Routes |
            | --- | --- |
            | 1, posts | all four |
            | 2, new | GET /posts/new |
            | 2, wildcard | GET /posts/{id}, GET /posts/{id}/comments |
            | 3, comments | GET /posts/{id}/comments |

            ~~~go file=examples/go-router/go1.22/routing_index.go lines=13-50 mark=23,35-50
            ~~~
          `,
        },
        index: {
          label: "Look up candidates",
          kicker: "Index",
          tooltip: "Picks the literal position with the fewest routes, and returns those routes plus the wildcards there.",
          body: md`
            \`/posts/new\` has two literals. Segment 1, \`posts\`, has four routes. Segment 2, \`new\`, has one route with that literal and two with a wildcard there, so three. The index picks the smaller set: \`GET /posts/new\`, \`GET /posts/{id}\`, and \`GET /posts/{id}/comments\`. A route with a different literal there, such as \`/users/new\`, would never be compared.

            ~~~go file=examples/go-router/go1.22/routing_index.go lines=52-78 mark=60-74
            ~~~
          `,
        },
        cmpNew: {
          label: "Against GET /posts/new",
          kicker: "Compare",
          tooltip: "The same path, and GET is narrower than every method. So GET /posts/new wins for GET, and there is no conflict.",
        },
        cmpId: {
          label: "Against GET /posts/{id}",
          kicker: "Compare",
          status: "problem",
          tooltip: "Every method is wider than GET, but new is narrower than {id}. Neither contains the other.",
          body: md`
            Two routes conflict when they match the same requests, or when they overlap and neither is more specific. A route with a host never conflicts with one without, because the host always wins.

            ~~~go file=examples/go-router/go1.22/pattern.go lines=13-35 mark=33-34
            ~~~

            The third candidate, \`GET /posts/{id}/comments\`, is never compared. The check stops at the first conflict.
          `,
        },
        boom: {
          label: "panic at startup",
          kicker: "Result",
          status: "problem",
          tooltip: "The message names both routes, where each was registered, and why they clash.",
          body: md`
            The message from Go 1.22, with the paths shortened and the lines wrapped:

            ~~~text
            pattern "/posts/new"
              (registered at main.go:23)
            conflicts with pattern "GET /posts/{id}"
              (registered at main.go:15):
            /posts/new matches more methods
            than GET /posts/{id}, but has
            a more specific path pattern
            ~~~

            The fix is to pick a side, for example \`GET /posts/new\`, which is already registered.

            ~~~go file=examples/go-router/go1.22/pattern.go lines=96-121 mark=114-116
            ~~~
          `,
        },
      },
      edgeInteractions: [
        ["add", "index"],
        ["indexData", "index"],
        ["index", "cmpNew"],
        ["index", "cmpId"],
        ["cmpId", "boom"],
      ],
    },

    tree: {
      tab: "overview",
      parent: null,
      title: "Finding the route quickly",
      summary: "A tree of method, then path segments, tried literal first. GET /posts/new/comments takes the bold path.",
      story: md`
        Comparing every request with every route would be slow. So the router keeps the four routes in a tree: the [host](#root), then the [method](#get), then one level per path segment. Each route's handler sits where its path ends.

        Follow [\`GET /posts/new/comments\`](~request). At the second segment, the tree tries the literal [\`new\`](#tNew) first.

        [](#posts->tNew)

        \`new\` has nothing below it, so the search backs up and tries the wildcard \`{id}\`, which takes \`new\` as its value. Then \`comments\` matches.

        [](#posts->tId)

        So \`GET /posts/{id}/comments\` runs, with \`id = "new"\`.

        **Why "literal first" gives the most specific route.** A literal is always narrower than a wildcard in the same place, unless another part of the two routes points the other way. That case is exactly the conflict refused at startup, in the previous step. So the startup check is what lets the search stay this simple.
      `,
      chart: `flowchart TD
  root["Any host<br><small>No route names a host</small>"]
  get["GET<br><small>Also searched for HEAD</small>"]
  post["POST"]
  posts["posts"]
  postsPost["posts<br><small>Handler: POST /posts</small>"]
  tNew["new<br><small>Handler: GET /posts/new</small>"]
  tId["{id}<br><small>Handler: GET /posts/{id}</small>"]
  tComments["comments<br><small>Handler: GET /posts/{id}/comments</small>"]
  root --> get
  root --> post
  get --> posts
  post --> postsPost
  posts -->|"1st: literal, fails below"| tNew
  posts -->|"2nd: wildcard, id = new"| tId
  tId --> tComments`,
      nodeInteractions: {
        root: {
          label: "Any host",
          kicker: "Level 1",
          tooltip: "Routes with the request's host are searched first, then routes with no host.",
          body: md`
            ~~~go file=examples/go-router/go1.22/routing_tree.go lines=25-35
            ~~~
          `,
        },
        get: {
          label: "GET",
          kicker: "Level 2",
          tooltip: "The exact method first, then GET for a HEAD request, then routes with no method.",
          body: md`
            ~~~go file=examples/go-router/go1.22/routing_tree.go lines=37-53 mark=41,45-50,52
            ~~~
          `,
        },
        post: { label: "POST", kicker: "Level 2", tooltip: "Only POST /posts lives here." },
        posts: { label: "posts", kicker: "Segment 1", tooltip: "Two children: the literal new, and a wildcard." },
        postsPost: { label: "posts, under POST", kicker: "Leaf", tooltip: "The handler for POST /posts." },
        tNew: {
          label: "new",
          kicker: "Literal",
          tooltip: "Tried first. It holds GET /posts/new, but has no comments below it, so this request fails here.",
          body: md`
            The three tries, in order: the literal, the single wildcard, then a \`{name...}\` wildcard. The comment on the first try is the argument from the story.

            ~~~go file=examples/go-router/go1.22/routing_tree.go lines=55-86 mark=57-63,70-73
            ~~~
          `,
        },
        tId: { label: "{id}", kicker: "Wildcard", tooltip: "Tried after the literal fails. Takes new as the value of id." },
        tComments: { label: "comments", kicker: "Leaf", tooltip: "The match: GET /posts/{id}/comments, with id = new." },
      },
      edgeInteractions: [
        arrow("root", "get", "The request's method is GET."),
        ["root", "post"],
        arrow("get", "posts", "Segment 1 is posts."),
        ["post", "postsPost"],
        arrow("posts", "tNew", "Tried first: the literal new matches, but nothing below it matches comments."),
        arrow("posts", "tId", "Tried second: the wildcard takes new."),
        arrow("tId", "tComments", "Segment 3 is comments: a match."),
      ],
    },

    outcomes: {
      tab: "overview",
      parent: null,
      title: "What a request gets",
      summary: "A handler, a 405 that lists the allowed methods, or a 404.",
      story: md`
        The router [looks for a route](#match). If one matches, [your handler](#handler) runs. When no route matches, Go 1.22 tells two cases apart. If the path matches a route with another method, the answer is **405 Method Not Allowed**, with an \`Allow\` header listing the methods. Otherwise it is 404, as before.

        With the four routes, [\`GET /users\`](~request) gets 404, because no route has that path.

        [](#allowed)

        A few smaller changes came with the series. Paths are now unescaped one segment at a time, so \`%2F\` inside a segment no longer acts as a slash. And setting [\`GODEBUG=httpmuxgo121=1\`](#compat) brings back the whole Go 1.21 router.

        **Check yourself.** With the four routes, what does \`DELETE /posts/42\` get? And what if you also register \`/\`? Open the 405 box for the answer.
      `,
      chart: `flowchart LR
  req["A request<br><small>Method, host, path</small>"]
  match{"Does a route match?"}
  handler["Your handler<br><small>Reads wildcards with r.PathValue</small>"]
  allowed["405 Method Not Allowed<br><small>The path matches with another method</small>"]
  notfound["404 Not Found<br><small>No route matches the path</small>"]
  compat["GODEBUG=httpmuxgo121=1<br><small>Brings back the Go 1.21 router</small>"]
  req --> match
  match -->|yes| handler
  match -->|"only with another method"| allowed
  match -->|no| notfound`,
      nodeInteractions: {
        req: { label: "A request", kicker: "Input", type: "request", tooltip: "Cleaned first: a path with .. or // is redirected, as before." },
        match: {
          label: "Does a route match?",
          kicker: "Router",
          type: "router",
          tooltip: "findHandler searches the tree, and decides what to answer when nothing matches.",
          body: md`
            ~~~go file=examples/go-router/go1.22/server.go lines=42-96 mark=82-93
            ~~~
          `,
        },
        handler: {
          label: "Your handler",
          kicker: "Your code",
          type: "handler",
          tooltip: "ServeHTTP stores the route and the wildcard values on the request before calling it.",
          body: md`
            ~~~go file=examples/go-router/go1.22/server.go lines=98-113 mark=110
            ~~~
          `,
        },
        allowed: {
          label: "405 Method Not Allowed",
          kicker: "Answer",
          status: "new",
          tooltip: "New in Go 1.22. The path matches a route with another method, and the Allow header lists them.",
          body: md`
            **The answer.** \`DELETE /posts/42\` gets 405 with \`Allow: GET, HEAD\`, because \`GET /posts/{id}\` matches the path. HEAD is listed because a GET route also serves HEAD.

            With \`/\` registered too, it gets whatever \`/\` returns. \`/\` has no method, so it matches. A 405 only happens when no route at all matches.

            Both answers were checked by running Go 1.22.
          `,
        },
        notfound: { label: "404 Not Found", kicker: "Answer", tooltip: "No route matches the path with any method, such as GET /users." },
        compat: {
          label: "GODEBUG=httpmuxgo121=1",
          kicker: "Escape hatch",
          tooltip: "Read once at startup. Every ServeMux method then runs the old code.",
          body: md`
            The doc comment lists what can break in old programs: a route like \`/{x}\` used to be a literal path, and some odd routes that used to be accepted now panic.

            ~~~go file=examples/go-router/go1.22/server.go lines=13-33 mark=20-33
            ~~~
          `,
        },
      },
      edgeInteractions: [
        ["req", "match"],
        ["match", "handler"],
        arrow("match", "allowed", "No route matches, but the path matches with another method.", "", [], { status: "new" }),
        ["match", "notfound"],
      ],
    },

    basics: {
      tab: "basics",
      parent: null,
      title: "An HTTP request in one minute",
      summary: "A request names a method and a path. A router picks the function that answers it.",
      story: md`
        Every page and API call starts as a [**request**](~request). Its first line names what the client wants, for example:

        ~~~text
        GET /posts/42 HTTP/1.1
        Host: blog.example.com
        ~~~

        [](#request)

        A server has many functions that can answer, one per kind of request. These are called [**handlers**](#handler). The **router** reads the method and the path, and picks the handler.

        [](#router)

        A [**route**](~route) is a rule the router matches against requests, such as \`GET /posts/{id}\`: the method GET, and a path where \`{id}\` stands for any one segment.

        The lesson draws each of these in its own color, in the pictures and in the text: [requests](~request), [routes](~route), [handlers](~handler), and the [router](~router).

        When you are ready, the lesson starts on the first tab.
      `,
      chart: `flowchart LR
  client["Browser or app<br><small>Sends the request</small>"]
  request["The request<br><small>Method: GET<br>Host: blog.example.com<br>Path: /posts/42</small>"]
  router["Router<br><small>Picks a handler<br>by method and path</small>"]
  handler["Handler<br><small>Your function<br>that writes the answer</small>"]
  response["The response<br><small>Status 200 and the post</small>"]
  client --> request
  request --> router
  router -->|"GET /posts/{id}"| handler
  handler --> response`,
      nodeInteractions: {
        client: { label: "Browser or app", kicker: "Client", tooltip: "Anything that sends HTTP: a browser, a phone app, or another server." },
        request: {
          label: "The request",
          kicker: "Data",
          type: "request",
          tooltip: "A method, a host, and a path, plus headers and sometimes a body.",
          body: md`
            - **Method:** what to do. GET reads, POST creates, PUT replaces, DELETE removes. HEAD is GET without the body.
            - **Host:** which site, since one server can serve several.
            - **Path:** which thing. It is split into **segments** at each slash, so \`/posts/42\` has two segments, \`posts\` and \`42\`.

            Headers and the body carry the rest, such as cookies and form data. The router ignores them.
          `,
        },
        router: {
          label: "Router",
          kicker: "This lesson",
          type: "router",
          tooltip: "In Go it is http.ServeMux. You register routes, and it picks one handler per request.",
          body: md`
            In Go you register each route with a handler:

            ~~~go
            mux := http.NewServeMux()
            mux.HandleFunc("GET /posts/{id}", getPost)
            http.ListenAndServe(":8080", mux)
            ~~~

            The lesson is about how ServeMux picks a route when several match, and what Go 1.22 changed.
          `,
        },
        handler: {
          label: "Handler",
          kicker: "Your code",
          type: "handler",
          tooltip: "A function that takes the request and writes the response.",
          body: md`
            ~~~go
            func getPost(w http.ResponseWriter, r *http.Request) {
                fmt.Fprintf(w, "post %s", r.PathValue("id"))
            }
            ~~~
          `,
        },
        response: { label: "The response", kicker: "Data", tooltip: "A status code, such as 200 OK or 404 Not Found, then headers and a body." },
      },
      edgeInteractions: [
        ["client", "request"],
        ["request", "router"],
        ["router", "handler"],
        ["handler", "response"],
      ],
    },
  },
};

packFile("examples/go-router/go1.21/server.go", `
H4sIAAAAAAAAA21TTW/UMBA9b37F015o0dYpRQhRiUMpLUWiULHlhBDyeiexWceObGc/hPrfGXs3
pUJcEsUz8+Z9OHWNufYhkaMlmuA7xKBqR6nWKfV1pLCmIFoPmfDBP4to/Qtx9kKcIsl2hsYHJE1w
PlGEcaCt7HpLsW79SfBD4uFfUVR1jS/O7kqvNY57/05F7TeQgbCiPs0gIy/CJnAtN3UCU54WQkzR
ybCKIKk01MCt0RcwuKFbUIhYmqahsJeRyZa997xoo70lNMbSObKueF7XrUl6WAjlO+ZqpWv5VS+s
X9SjxPr/VlQZ9dL3u2BanXB2evqmLGHWF0NiM6PAhbUo5YhAZXJZyHyLBN+wLsO6/RAUQfklwWRj
GT6nsNhB4t38/UlMO0t5yhpFLmY7OAUlHRYsxg9umR3PRn76eHn1eX5VFIrC7+b+/g4HypgT4ev1
JV6fveTcNOfS6vzxint7qVaypWJLtTc6v64No0to6ZaWLfXuyUcne7RmTfmsl0kjpmBcW+ZufUwn
sSdlGqNwZL1rKabj3Md3wWFjHMfSDI6L3bDF83nmeDtsjxk2KX30BPAYRxo3+6WzR4Sx9rua5Bw0
qVW5hnzzVNqDsA8hJlFN1jP4Fc7fgleJ7nvG/lFNTJNPeX4SKA0MuRZ6xo/DhmryUP2DfZCBtbRm
ud8hUED5/irvkmRZkBz6ASMWgJIX7WOqOW/+zQ4/2QiYfL7+fF7o5lU/Z6DMOPCNpHFF5sqs99Kj
uJHxLlBjtsUtHhipF1ceZZF4WuPCQ5Y2Vp2xM0yn1cOY+h/CTWqgCwQAAA==
`);
packFile("examples/go-router/go1.22/pattern.go", `
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
`);
packFile("examples/go-router/go1.22/request.go", `
H4sIAAAAAAAAA3VRTU8bMRQ8Z3/FiEsJAjvNjVRUohS1SFWLmrQXxMHrfbvrxmtvn72ECPHfazsg
Tj3ZsmfefDwpse49R3LUoGU/ILCWjqLsYxwl09+JQhSdh4r44t8FdP69WC7FAlF1p2g9I/YE5yMF
GAd6VMNoKcjOn7GfIrH4E0QlJX44uy9Ya1zCvrFC73dQTNjSGE+hQhLCjtNfBg0CR4kthDjCoHgb
QEr30FOCBl+GwU1DTRzQmLYlPuTIZovuJgntem8JrbG0Qg4WVlJ2JvZTLbQfklerXJcOWVtfy9eI
8j9dVHnslR/3bLo+YrlYnBeVZPtyiqnOIHBpLcp3AFMgfqCmuPkVCL5NwUwK7ifWBO0bgsnNPhDn
PdR7KHxafz4LcW8ps6zR5ELuI61BK4c6pfGTa3LluclvN1fX39fXJaIo/r5uNrf4efCcLKjGuA4q
MUbFId0TalR6qzoqjVSHjqt2chrHjJMX6hy3Kva/lZ3o2KmBECIn9vzlxFM1My0MVhdgMap44xp6
LMj5h/T88QKLjJkxxYldwgwq6p7CnbmvZs/V27tPMbjohLtMv6+eXz39A9QcKiClAgAA
`);
packFile("examples/go-router/go1.22/routing_index.go", `
H4sIAAAAAAAAA41V227bRhB9lr5iypdaqUIm7ptaP6RpWgRNL4Bb5CEwihU5ErdecondpWXV0L/3
zJDUxQHaGjBs7s7tnDkzWxR0W/uQuOWKNsE3FENZtJyKOqWuCL5Ptt3+aduKH/OtJ5PoR/9lpK1/
nV9f568ome2SNj5QqplanziSbYkfTdM5jsXWv5QYHPK/Yj4vCvq1dXu1dbaF7ckr1n5HJjDdc5eW
ZCIS0S7gToyanDJ453meUWPCfSQ2ZU1lD9PoNRi1fbPmEKmymw2HAY0Uq3l/R6Jd7R3TxjpekcCL
q6LY2lT367z0DWp1pt3iT7F2fl1MEIt/ZWQuwd/6bh/stk50/er6a82F4t/0CdTGnN44R3odKXDk
8MCV1vRHZPIbwLOA7/tQMpW+YrLC7wMH6cl6T4a+u/3+ZUx7x+LlbMltFFbQjNK0tAYm37eVEC98
fnj/9t0vt+8UaD6fd6a8N1tWxPO5bTq0m7LGpDrT4t/QiOm9QCLfJdvYv9GR0rcbJEtUceIyWd9K
NQoc1tSZhL62Su/E8NpEW5Kt2AiI5Cn0YBzhj9bHstH1U4YdugCcW/vArcQarQGtNL1i5T3V5oFh
NLSX2wQmYGSc4DaIFUBu59tKiou8bWCiNN+yBoBFI2cq0E/nmPPOx2jXbv92rAcXv4313qm4Gw9h
ggZjHfCmfceXpMUUesB4ms+QrzHdID4DHCHZsncmTBURclnl0qBjD8b1LDwZkQhvbURSdH1iS+Mp
OUrbYK5tNqdIuVr9gDLHsVsq3HtQ9vR6Sdk6O9DO964i6L/Su2M3ssIU60xr0X+LMtNoa7RMOoTD
TEIMf2BRZoRE8t/T4yFD6hFXFNgXrP7E+7tPdy/GVBpVBuFSCDzI1lDTu2QB1VWlCRVd2bZ0vbYy
BbCuPXUm1osB7Ue0w2uFKeyFQAxB6RhDQ2YtejvKdAg8ZV2eSyqwxpKl07fO3rObQjWm3Q+jic0z
n2mMSGdoDvPPVQDAZ0JAd1BEIvwgx6uXGA009rkKwB8M4CWl6nCrpJdCMjdd2qv8Jlok7aZvS9BT
PdKL8+QLMlU1ivYKVdJU6kKKsRthIAeB6Xao4GqRD8zgdoZo+YjxhkzXoStXp7Ol+C7mswOxA3Hq
sCG5P/b+5oZa6/RqdnnxH7J4OsBFfgUmSFkKQ7S6oYBVrDo9xdLoomq5voz4BNfV6L+iLDtoIRv6
As65sDc4i3cuRclxlJPD84o/weTukoWLq4kM8TygH8OjdJxAH6BZA0nKRD2Xnkyel/dv2ntx2t/j
/lOHpQZDLHNcgzoqtRmey2gaPq4+NTtODayiP91qoMst8VHWoKwCSBNvJda6rh7dCcMSFPGnssb+
l/GUR3aKsNStsBuGBtMnqfB2yWRaWTthhUu8Om01xRsW3bi/cMU7juns4Zg9YDG6xiL0rpGtfLYu
5Hsl8kl1/rN5fN+m+QwUfLBJjjcGUpyraux/aQY6kH6f5D5bBzb3o/A+V8mY5QarpWc5cAgZJcGF
Gp5LEMJTWS1JxWgPd+K7+7++WXbpKFX3jXg6bq+0hAV9pR8ac/GN3n9LQtSgbmESZautHuyGg93x
YPiG36R9VbHkGkFLIEjf7a8k2OL4tRu/AqceguQQJuX/A/P/slVCCgAA
`);
packFile("examples/go-router/go1.22/routing_tree.go", `
H4sIAAAAAAAAA41XTW/cNhA9e38Fu5d4A0VK3JsDH9zESQOkaQEn6CEICq40K7GWSJWkvN4G+e99
Q4pa7XrbxjAcSBrOx3szb5iiELeNsZ40VWJjTSecLQtNvmi87wtrBq90/Ye3RHlthPTirXniRG1e
5BcX+XPhZZ2JjbHCNyS08eSE0oIeZNe35IraPGMXZPM/Xb4oCvGrbnfBtlUatvtTrjFbIS2JO+p9
JqRDILG1+MZGXS6WOJ3n+VJ00t45QbJsRDnA1JngTOihW5N1olKbDdlYDCcb4n5EoG1jWhIb1dKl
4OrcZVHUyjfDOi9Nh1xbqWv8U6xbsy5SicV/AbJg369Mv7Oqbry4eH7xYwiF3K8HD2BdLq7bVoTP
TlhyZO+pCil9ciTMBtUpVG8GW5IoTUVCMbz3ZJmR9U5I8dPt62fO71riU60qSTsGBVyUUos1SjKD
rhh3hvP9u1c3H25vQp35ItYOl/woFLPSkUYqUlRUKqcMTqGWwOFGOg94fdmgRM7N0l8DOVh7w456
6UGlDogmUK0xPpZB0dHaSl02YNTEfBrjJoPR38SIpgcvWrqn9tGxjgBfNVla6qTSnFYwd6M9W5cG
eKAT1D0JR3UsbwyIjJt5tsvOoMVcj9I3qhRbpd1S9JZKqkiDADsAJUYVTA2tZ0zXsrzzFn8QPKTz
BkiNDZ6JGlF1ChXAYRP+KWSxLv6ePX19+FaU/LxFKyo0xUZZQOMtBsJE2Kec0e18vFzCEk/RF6ZC
V8FBE2KiATZSAYvkkF3JGjjBbQqIFuiRvKwp9PwiTtFiM+hSnAfyno49/QHNt4p5nDNp2chBFjNy
3sJoJc7n9pn4/CV9+Lo4U5tI9w9XYrnkF2cRdxu6WoaPuXgXuEnvRtxiPSMzQRnwGJxJ7m0ffYXs
yGVcMotFZTQlh5OnypDTT8ZOhjpJhqZB1nXDjRwcMVSJsYixNjE9fEcZLaoXl1ehvfON0tWrRrVV
wGWVB8e/BHCudfUb0DmfQ7V6KVqGQKs2YHBmyQ/Ii33i8duCf8d3wT91vd+FAP/revHtkEF9ir5/
P/+9LGpxtc9/TBWPGf8J6c8g0jN8YqwRoRCdo4Zjx6igjJsHWY408cDGw0LLjvLFEWox5GiB3JY/
31y/nlrs7c3H1BqCP4Bmc0TkPMsl7JffleRJ6hDwg2EJSMm/PN1OScImAB8RfRR8T24oinxo6ygT
o7IxTlHUzvAmY53yXF4wuo0257FT2MebSWImWU8CMaUbJ01CPSW2C97JdtzomM/eOOWxJGJKv2M9
a+xprCVWXW+H0ocNEmZ3AI2TV57OQ7GFEVsaR8FXQEmycFWltBVfLQ4iinMUvwt+SLFeHLrLBHaJ
upctCs6CQ6TMa7OVfRBKlgiW80qg0WdA+q1JAkozzliPLNXK4ZnQwXEMTjQPYJ+3DhOQpeZD++h5
+yTiUwsjS2jVnoo93qzj2V7AIzonKXI42SYIR+yQRc93C+3HOwOuYNxq47inq0HJBSB83/OoR0qv
OVx2zGh21M0p7D5kNwDL9SmOg9vAczrbYZWq6ejUSu5O9eP1x1MvVFTx1OhhOWDxqpYrcK10mJI1
lXKA46NsXHCJZZBU/+ggucgnfIfdVETlOGD45GxGdgEYaYhbWj7cAsdUH3K9V4r3uFO1u+xwv4c1
dR6X4HiHA8FduClpqPjIt0vYHbId2JxPCq4P8Xa1v2mNGoEKy0fq93SJ5MsjLX4dwMNNyPAsjumy
DMggyLjMu1m/bRuFz9IqB8UNN22Z9uoc99R4Y8mrUZPLfHyRw2hSrVXuZheHs6TnV4/g59o+4X8P
pewpaN3nF5dfViuB8LgmQgMQFsBgrEISkY3ETzkN63wNT7ttUuB/AJ+av+cZDQAA
`);
packFile("examples/go-router/go1.22/server.go", `
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
`);
