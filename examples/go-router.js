// A PR-style explanation of the Go 1.22 ServeMux router: methods, wildcards, and "the more specific pattern wins".
// The change is proposal golang/go#61410, landed as about 20 commits by Jonathan Amsterdam in September 2023.
// Its code notes name files at the go1.21.0 and go1.22.0 tags, so join it from the root of a Go repo clone.
// It follows docs/rules.md: an overview first, the change side by side, processes instead of sentences, and arrow labels instead of arrow notes.

window.DIAGRAMS = {
  tabs: [
    { id: "overview", label: "Go 1.22 router", lesson: ["overview", "wins", "conflict", "tree", "outcomes"] },
    { id: "basics", label: "Basics" },
  ],
  views: {
    overview: {
      viewId: "overview",
      tab: "overview",
      parent: null,
      title: "What changed",
      summary: "Go 1.22's router can match the method and capture parts of the path.",
      story: md`
        **The change in one sentence:** Go 1.22's standard router understands patterns like \`GET /posts/{id}\`, so most servers no longer need a third-party router such as chi or gorilla/mux.

        The picture shows one request, \`GET /posts/42\`, in both versions. On the left, Go 1.21 matches only the path, so the handler checks the method and cuts the id out of the URL itself.

        [](#oldHandler)

        On the right, Go 1.22 matches the method and the path, and hands the handler the id.

        [](#newHandler)

        **The routes used in every step**, a small blog API:

        ~~~go
        mux.HandleFunc("GET /posts/{id}", getPost)
        mux.HandleFunc("GET /posts/new", newPostForm)
        mux.HandleFunc("GET /posts/{id}/comments", listComments)
        mux.HandleFunc("POST /posts", createPost)
        ~~~

        **What's ahead:**

        1. \`GET /posts/new\` matches two of these routes. Which one runs?
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
        oldReq: { label: "GET /posts/42", kicker: "Request", tooltip: "The same request on both sides.", weight: "background" },
        oldMux: {
          label: "ServeMux, Go 1.21",
          kicker: "Before",
          tooltip: "Tries the exact path, then the longest registered prefix that ends in a slash.",
          body: md`
            The whole matcher: look the path up in a map, and if that fails, walk the slash-ending patterns from longest to shortest. The method is never read.

            ~~~go file=go1.21.0:src/net/http/server.go lines=2375-2392 mark=2384-2390
            ~~~
          `,
        },
        oldHandler: {
          label: "Handler for /posts/",
          kicker: "Your code, before",
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
        newReq: { label: "GET /posts/42", kicker: "Request", tooltip: "The same request on both sides.", weight: "background" },
        newMux: {
          label: "ServeMux, Go 1.22",
          kicker: "After",
          status: "changed",
          weight: "key",
          tooltip: "Same type and API. Inside, a tree finds the route and an index checks new routes for conflicts.",
          body: md`
            The map and the sorted list are replaced by a tree, used to match requests, and an index, used to check each new route. The Go 1.21 router is kept for programs that need it.

            ~~~go file=go1.22.0:src/net/http/server.go lines=2432-2438 mark=2434-2435
            ~~~
          `,
        },
        newHandler: {
          label: "Handler for GET /posts/{id}",
          kicker: "Your code, after",
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

            ~~~go file=go1.22.0:src/net/http/request.go lines=1441-1446
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
      viewId: "wins",
      tab: "overview",
      parent: null,
      title: "Two routes match: the more specific wins",
      summary: "GET /posts/new matches GET /posts/new and GET /posts/{id}. The narrower one runs.",
      story: md`
        **This is the hard part.** The request \`GET /posts/new\` matches two routes: \`GET /posts/new\`, and \`GET /posts/{id}\` with \`id = new\`. Which one runs?

        It is natural to guess "the one registered first", as in many routers, or "the longest", as in Go 1.21. Neither is the rule. The rule is: **the more specific route wins**, meaning the one that matches a strict subset of the other's requests.

        The picture follows the request. Two routes match, so they are compared one part at a time.

        [](#compare)

        Registration order never decides, on purpose. Packages often register routes from \`init\` functions, which run in an order you do not control.
      `,
      chart: `flowchart LR
  req["Request<br><small>GET /posts/new</small>"]
  pNew["GET /posts/new<br><small>Matches</small>"]
  pId["GET /posts/{id}<br><small>Matches, with id = new</small>"]
  pComments["GET /posts/{id}/comments<br><small>Needs three segments</small>"]
  pPost["POST /posts<br><small>Other method, other path</small>"]
  compare["Compare the two<br><small>Method: the same, GET<br>Segment 1: the same, posts<br>Segment 2: new is narrower than {id}</small>"]
  winner["GET /posts/new runs<br><small>It matches a subset of<br>what GET /posts/{id} matches</small>"]
  req --> pNew
  req --> pId
  req -.->|no| pComments
  req -.->|no| pPost
  pNew --> compare
  pId --> compare
  compare --> winner`,
      nodeInteractions: {
        req: { label: "Request GET /posts/new", kicker: "Request", tooltip: "The request being routed." },
        pNew: { label: "Route GET /posts/new", kicker: "Route", tooltip: "Matches only the path /posts/new, for GET and HEAD." },
        pId: { label: "Route GET /posts/{id}", kicker: "Route", tooltip: "Matches any /posts/x, including /posts/new." },
        pComments: { label: "Route GET /posts/{id}/comments", kicker: "Route", tooltip: "Needs a third segment, so it does not match.", weight: "background" },
        pPost: { label: "Route POST /posts", kicker: "Route", tooltip: "Different method and path, so it does not match.", weight: "background" },
        compare: {
          label: "Compare the two",
          kicker: "The rule",
          weight: "key",
          tooltip: "Method, then each path segment. One part narrower and the rest the same means more specific.",
          body: md`
            Each part gives one of five answers: the same, more specific, more general, no overlap, or overlap with neither containing the other. Here the methods are the same, the first segments are the same, and the second segment decides: the literal \`new\` is narrower than the wildcard \`{id}\`.

            ~~~go file=go1.22.0:src/net/http/pattern.go lines=314-346 mark=335-340
            ~~~

            Then the answers are combined. "The same" changes nothing. One part more specific and another more general means the routes overlap, and neither wins. That case is the next step.

            ~~~go file=go1.22.0:src/net/http/pattern.go lines=356-379 mark=367-375
            ~~~
          `,
        },
        winner: {
          label: "GET /posts/new runs",
          kicker: "Result",
          weight: "key",
          tooltip: "Every request GET /posts/new matches, GET /posts/{id} matches too. So it is more specific.",
          body: md`
            Checked by running Go 1.22 with the four routes:

            ~~~text
            GET /posts/new  -> GET /posts/new
            GET /posts/42   -> GET /posts/{id}, id = "42"
            HEAD /posts/42  -> GET /posts/{id}, id = "42"
            ~~~

            HEAD reaches \`GET /posts/{id}\`, because a GET route also serves HEAD.
          `,
        },
      },
      edgeInteractions: [
        ["req", "pNew"],
        ["req", "pId"],
        ["req", "pComments"],
        ["req", "pPost"],
        ["pNew", "compare"],
        ["pId", "compare"],
        ["compare", "winner"],
      ],
    },

    conflict: {
      viewId: "conflict",
      tab: "overview",
      parent: null,
      title: "Neither wins: refused at startup",
      summary: "Adding /posts/new next to GET /posts/{id} makes the program panic when it registers the route.",
      story: md`
        Add one more route, \`/posts/new\` with no method, next to the four. Both \`/posts/new\` and \`GET /posts/{id}\` match the request \`GET /posts/new\`. \`/posts/new\` is narrower in its path but wider in its method, because it takes every method. \`GET /posts/{id}\` is the other way round. So neither is more specific, and there is no rule to pick one.

        The router does not guess. \`HandleFunc\` panics, so the server fails at startup, not on some request later.

        [](#boom)

        To find the route it clashes with, the router does not compare against every route. An index, filled as routes are registered, narrows them down first.

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
          tooltip: "The fifth route. It has no method, so it matches every method.",
          body: md`
            Registration parses the route, asks the index for candidates, and compares each one. Only then is the route added to the tree and the index.

            ~~~go file=go1.22.0:src/net/http/server.go lines=2737-2779 mark=2764-2774
            ~~~
          `,
        },
        indexData: {
          label: "The index",
          kicker: "Data",
          weight: "background",
          tooltip: "A map from a segment position and its literal to the routes that have it there.",
          body: md`
            For the four routes, the index holds these lists. A wildcard is stored under an empty literal. Routes ending in a slash or \`{name...}\` go in a separate list, which is empty here.

            | Key | Routes |
            | --- | --- |
            | 1, posts | all four |
            | 2, new | GET /posts/new |
            | 2, wildcard | GET /posts/{id}, GET /posts/{id}/comments |
            | 3, comments | GET /posts/{id}/comments |

            ~~~go file=go1.22.0:src/net/http/routing_index.go lines=9-46 mark=19,31-46
            ~~~
          `,
        },
        index: {
          label: "Look up candidates",
          kicker: "Index",
          tooltip: "Picks the literal position with the fewest routes, and returns those routes plus the wildcards there.",
          body: md`
            \`/posts/new\` has two literals. Segment 1, \`posts\`, has four routes. Segment 2, \`new\`, has one route with that literal and two with a wildcard there, so three. The index picks the smaller set: \`GET /posts/new\`, \`GET /posts/{id}\`, and \`GET /posts/{id}/comments\`. A route with a different literal there, such as \`/users/new\`, would never be compared.

            ~~~go file=go1.22.0:src/net/http/routing_index.go lines=89-115 mark=97-111
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

            ~~~go file=go1.22.0:src/net/http/pattern.go lines=216-238 mark=236-237
            ~~~

            The third candidate, \`GET /posts/{id}/comments\`, is never compared. The check stops at the first conflict.
          `,
        },
        boom: {
          label: "panic at startup",
          kicker: "Result",
          status: "problem",
          weight: "key",
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

            ~~~go file=go1.22.0:src/net/http/pattern.go lines=402-427 mark=420-422
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
      viewId: "tree",
      tab: "overview",
      parent: null,
      title: "Finding the route quickly",
      summary: "A tree of method, then path segments, tried literal first. GET /posts/new/comments takes the bold path.",
      story: md`
        Comparing every request with every route would be slow. So the router keeps the four routes in a tree: the method, then one level per path segment. Each route's handler sits where its path ends.

        Follow \`GET /posts/new/comments\`. At the second segment, the tree tries the literal \`new\` first.

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
            ~~~go file=go1.22.0:src/net/http/routing_tree.go lines=115-125
            ~~~
          `,
        },
        get: {
          label: "GET",
          kicker: "Level 2",
          weight: "key",
          tooltip: "The exact method first, then GET for a HEAD request, then routes with no method.",
          body: md`
            ~~~go file=go1.22.0:src/net/http/routing_tree.go lines=130-146 mark=134,138-143,145
            ~~~
          `,
        },
        post: { label: "POST", kicker: "Level 2", tooltip: "Only POST /posts lives here.", weight: "background" },
        posts: { label: "posts", kicker: "Segment 1", weight: "key", tooltip: "Two children: the literal new, and a wildcard." },
        postsPost: { label: "posts, under POST", kicker: "Leaf", tooltip: "The handler for POST /posts.", weight: "background" },
        tNew: {
          label: "new",
          kicker: "Literal",
          tooltip: "Tried first. It holds GET /posts/new, but has no comments below it, so this request fails here.",
          body: md`
            The three tries, in order: the literal, the single wildcard, then a \`{name...}\` wildcard. The comment on the first try is the argument from the story.

            ~~~go file=go1.22.0:src/net/http/routing_tree.go lines=166-197 mark=168-174,181-184
            ~~~
          `,
        },
        tId: { label: "{id}", kicker: "Wildcard", weight: "key", tooltip: "Tried after the literal fails. Takes new as the value of id." },
        tComments: { label: "comments", kicker: "Leaf", weight: "key", tooltip: "The match: GET /posts/{id}/comments, with id = new." },
      },
      edgeInteractions: [
        arrow("root", "get", "The request's method is GET.", "", [], { weight: "key" }),
        ["root", "post"],
        arrow("get", "posts", "Segment 1 is posts.", "", [], { weight: "key" }),
        ["post", "postsPost"],
        arrow("posts", "tNew", "Tried first: the literal new matches, but nothing below it matches comments."),
        arrow("posts", "tId", "Tried second: the wildcard takes new.", "", [], { weight: "key" }),
        arrow("tId", "tComments", "Segment 3 is comments: a match.", "", [], { weight: "key" }),
      ],
    },

    outcomes: {
      viewId: "outcomes",
      tab: "overview",
      parent: null,
      title: "What a request gets",
      summary: "A handler, a 405 that lists the allowed methods, or a 404.",
      story: md`
        When no route matches, Go 1.22 tells two cases apart. If the path matches a route with another method, the answer is **405 Method Not Allowed**, with an \`Allow\` header listing the methods. Otherwise it is 404, as before.

        With the four routes, \`GET /users\` gets 404, because no route has that path.

        [](#allowed)

        A few smaller changes came with the series. Paths are now unescaped one segment at a time, so \`%2F\` inside a segment no longer acts as a slash. And setting \`GODEBUG=httpmuxgo121=1\` brings back the whole Go 1.21 router.

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
        req: { label: "A request", kicker: "Input", tooltip: "Cleaned first: a path with .. or // is redirected, as before.", weight: "background" },
        match: {
          label: "Does a route match?",
          kicker: "Router",
          tooltip: "findHandler searches the tree, and decides what to answer when nothing matches.",
          body: md`
            ~~~go file=go1.22.0:src/net/http/server.go lines=2512-2566 mark=2552-2563
            ~~~
          `,
        },
        handler: {
          label: "Your handler",
          kicker: "Your code",
          tooltip: "ServeHTTP stores the route and the wildcard values on the request before calling it.",
          body: md`
            ~~~go file=go1.22.0:src/net/http/server.go lines=2669-2684 mark=2681
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
          weight: "background",
          tooltip: "Read once at startup. Every ServeMux method then runs the old code.",
          body: md`
            The doc comment lists what can break in old programs: a route like \`/{x}\` used to be a literal path, and some odd routes that used to be accepted now panic.

            ~~~go file=go1.22.0:src/net/http/server.go lines=2411-2431 mark=2418-2431
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
      viewId: "basics",
      tab: "basics",
      parent: null,
      title: "An HTTP request in one minute",
      summary: "A request names a method and a path. A router picks the function that answers it.",
      story: md`
        Every page and API call starts as a **request**. Its first line names what the client wants, for example:

        ~~~text
        GET /posts/42 HTTP/1.1
        Host: blog.example.com
        ~~~

        [](#request)

        A server has many functions that can answer, one per kind of request. These are called **handlers**. The **router** reads the method and the path, and picks the handler.

        [](#router)

        A route is a rule the router matches against requests, such as \`GET /posts/{id}\`: the method GET, and a path where \`{id}\` stands for any one segment.

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
        client: { label: "Browser or app", kicker: "Client", tooltip: "Anything that sends HTTP: a browser, a phone app, or another server.", weight: "background" },
        request: {
          label: "The request",
          kicker: "Data",
          weight: "key",
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
          weight: "key",
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
          tooltip: "A function that takes the request and writes the response.",
          body: md`
            ~~~go
            func getPost(w http.ResponseWriter, r *http.Request) {
                fmt.Fprintf(w, "post %s", r.PathValue("id"))
            }
            ~~~
          `,
        },
        response: { label: "The response", kicker: "Data", tooltip: "A status code, such as 200 OK or 404 Not Found, then headers and a body.", weight: "background" },
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
