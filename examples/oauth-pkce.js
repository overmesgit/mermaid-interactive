// An explanation of OAuth 2.0 login with PKCE (RFC 7636): why a stolen login code is useless when the app keeps a verifier.
// Every value and answer shown comes from one run of a small Go program: golang.org/x/oauth2 v0.37.0 as the app, against local test servers
// named app.example, login.example, and api.example. The program and its output are in examples/oauth-pkce/run/.
// The code notes show the library's PKCE code, cut to the lines they show, in examples/oauth-pkce/.
// examples/oauth-pkce.packed.js is this file packed from the repo root, so the editor can show the code. Pack it again after editing this file.
// It follows docs/rules.md, and gives each kind of value one color: verifiers, challenges, codes, and tokens, in the diagrams and the text.
// Its sequence charts use box, rect, alt, and autonumber, so it also tests how the page handles them.

window.DIAGRAMS = {
  types: { verifier: "Verifier", challenge: "Challenge", code: "Code", token: "Token" },
  tabs: [
    { id: "overview", label: "PKCE login", lesson: ["overview", "halves", "login", "attack", "refresh"] },
    { id: "basics", label: "Basics" },
  ],
  views: {
    overview: {
      tab: "overview",
      parent: null,
      title: "A stolen code",
      summary: "With PKCE, the login code alone gets nothing, because only the app has the verifier.",
      story: md`
        **The common belief:** the login [code](~code) is the secret. When you sign in with another site, the login server sends your browser back to the app with a code in the address, and the app trades the code for [tokens](~token). So whoever holds the code can get the tokens.

        Without PKCE, that belief is right, and that is the problem. The code travels in an address, through the browser, where other programs can sometimes read it. An app on a phone, or a page in a browser, has no password of its own to add, because anything shipped to every user can be read. The app in the run is set up the same way, with no secret.

        **The change in one sentence:** with PKCE, the app makes a secret, the [verifier](~verifier), for each login, and the login server gives tokens only to whoever shows the code *and* that verifier.

        The picture shows the same theft twice, run against a local test server. On the left, the app does not use PKCE, and the [stolen code](#w1) gets tokens.

        [](#w3)

        On the right, the app uses PKCE. The [login server](#p2) also asks for the verifier, and the thief does not have it.

        [](#p3)

        **What's ahead:**

        1. The verifier: half of a key that never leaves the app.
        2. One login, message by message, with the real values.
        3. A stolen code, with and without PKCE.
        4. An hour later: new tokens without the verifier.

        **The original change.** PKCE is [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), from 2015. Its first section is this exact attack, on phones. [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700), the current security advice for OAuth 2.0, asks every app to use it. The code in this lesson is Go's [golang.org/x/oauth2](https://github.com/golang/oauth2), which added PKCE in [commit 55cd552](https://github.com/golang/oauth2/commit/55cd552), reviewed as [CL 463979](https://go-review.googlesource.com/c/oauth2/+/463979).

        New to logins like this? The **Basics** tab shows what a redirect is and what a token is for.
      `,
      chart: `flowchart LR
  subgraph without["Without PKCE"]
    direction TB
    w1["The attacker has the code<br><small>4WMGIwCn9npDIvi_3BuNag</small>"]
    w2["Login server<br><small>Is the code valid? Yes</small>"]
    w3["200: tokens for ada<br><small>The API then returns ada's data</small>"]
    w1 -->|"POST /token: the code"| w2
    w2 --> w3
  end
  subgraph with["With PKCE"]
    direction TB
    p1["The attacker has the code<br><small>LdPK2dsvptARabRgdc2snA</small>"]
    p2["Login server<br><small>Is the code valid? Yes.<br>Where is the verifier?</small>"]
    p3["400: invalid_grant<br><small>code_verifier required</small>"]
    p1 -->|"POST /token: the code"| p2
    p2 --> p3
  end
  without ~~~ with`,
      nodeInteractions: {
        w1: {
          label: "The attacker has the code",
          kicker: "Without PKCE",
          type: "code",
          tooltip: "Taken from the redirect back to the app. Step 3 shows how.",
          body: md`
            A code works only once, but it is all the login server asks for. In the run, the app asked for a login with no challenge:

            ~~~text
            GET http://login.example/authorize?client_id=demo-app
              &redirect_uri=http%3A%2F%2Fapp.example%2Fcallback
              &response_type=code&scope=profile&state=E0HmqrPT9pDQUQxi
            ~~~

            and the login server answered with this address, which the attacker read:

            ~~~text
            http://app.example/callback?code=4WMGIwCn9npDIvi_3BuNag&state=E0HmqrPT9pDQUQxi
            ~~~
          `,
        },
        w2: { label: "Login server, without PKCE", kicker: "Without PKCE", tooltip: "The login had no challenge, so the code is all it checks." },
        w3: {
          label: "200: tokens for ada",
          kicker: "Result",
          type: "token",
          status: "problem",
          tooltip: "The attacker now acts as ada, until the tokens are revoked.",
          body: md`
            What the attacker got, from the run:

            ~~~text
            POST http://login.example/token
              grant_type=authorization_code
              client_id=demo-app
              code=4WMGIwCn9npDIvi_3BuNag
              redirect_uri=http://app.example/callback

            200 {"access_token":"at_RZTyN07gXWiB9ZTkLItVjbtd",
                 "token_type":"Bearer","expires_in":3600,
                 "refresh_token":"rt_5tOtkWbABEztJj5TcV5lTlI-"}

            GET http://api.example/me
              Authorization: Bearer at_RZTyN07gXWiB9ZTkLItVjbtd

            200 {"user":"ada","email":"ada@mail.example"}
            ~~~

            Everything in the request is public: the app's \`client_id\` and its \`redirect_uri\` are in every login address.
          `,
        },
        p1: {
          label: "The attacker has the code",
          kicker: "With PKCE",
          type: "code",
          tooltip: "Taken the same way. This time the login carried a challenge.",
        },
        p2: {
          label: "Login server, with PKCE",
          kicker: "With PKCE",
          status: "changed",
          tooltip: "The login carried a challenge, so the code is given out only with the verifier that matches it.",
          body: md`
            When the app asked for this login, it sent a [challenge](~challenge), \`0FomuDot7MmuGO212kKMNuy_4V5jcSfcQyqhE5hqlz0\`. The login server stored it next to the code. Now it asks for the [verifier](~verifier) behind that challenge, and the request has none. Step 2 shows how a verifier and a challenge fit.
          `,
        },
        p3: {
          label: "400: invalid_grant",
          kicker: "Result",
          status: "new",
          tooltip: "No tokens. A guessed verifier fails too.",
          body: md`
            Both tries from the run:

            ~~~text
            POST /token  code=LdPK2dsvptARabRgdc2snA
            400 {"error":"invalid_grant",
                 "error_description":"code_verifier required"}

            POST /token  code=LdPK2dsvptARabRgdc2snA
                         code_verifier=9ctDqaRR_NIfat_rFhM18G7zYhN2HqdpHvb7h_mFYJE
            400 {"error":"invalid_grant",
                 "error_description":"code_verifier does not match the challenge"}
            ~~~

            The error text is the test server's own. RFC 7636 asks for \`invalid_grant\` and leaves the description to the server.
          `,
        },
      },
      edgeInteractions: [
        ["w1", "w2"],
        ["w2", "w3"],
        ["p1", "p2"],
        ["p2", "p3"],
      ],
    },

    halves: {
      tab: "overview",
      parent: null,
      title: "The verifier: half of a key",
      summary: "The app keeps a random verifier, and sends only its SHA-256, the challenge. The code works only with the verifier.",
      story: md`
        **This is the key idea.** The code still travels in the open. PKCE makes it useless alone.

        **Imagine a cloakroom.** You hand in your coat and get a numbered ticket. Whoever brings the ticket gets the coat, so a pickpocket who takes your ticket takes your coat.

        Now imagine a cloakroom that wants more. Before you hand in the coat, you tear a card in two. You keep one half, and the attendant pins the other half to your coat. To collect, you bring the ticket *and* your half, and the attendant checks that the two halves fit. A pickpocket with your ticket gets nothing. Anyone can look at the half on the coat, but nobody can tear a card to fit it.

        **A login is that cloakroom:**

        | login | cloakroom |
        | --- | --- |
        | [verifier](~verifier) | your half of the card, which stays with you |
        | [challenge](~challenge) | the half pinned to the coat, which anyone can see |
        | [code](~code) | the ticket |
        | [tokens](~token) | the coat |

        One difference: the two halves of a card are torn at once. Here the app makes the [verifier](#verifier) first, 32 random bytes, and computes the [challenge](#challenge) from it with SHA-256. SHA-256 works in one direction only. Anyone can check that a verifier gives a challenge, but nobody can work the verifier back out of the challenge in any practical time.

        **Who holds what, and when.** At the start of a login, the app makes both, keeps the verifier, and sends the challenge in the login address. The [login server](#stored) stores the challenge with the code it gives out. At the end, the app sends the code and the verifier straight to the login server, and [the check](#check) is one line: SHA-256 of the verifier must equal the stored challenge.

        | value | made | travels | seen by |
        | --- | --- | --- | --- |
        | [verifier](~verifier) | by the app, at the start | at the end, straight to the login server | the app, then the login server |
        | [challenge](~challenge) | by the app, from the verifier | in an address, through the browser | anyone who reads the address |
        | [code](~code) | by the login server, after you sign in | in an address, through the browser | anyone who reads the address |
        | [tokens](~token) | by the login server, after the check | straight to the app | the app |

        So the two values that travel in the open, the challenge and the code, are no use without the one that does not.
      `,
      chart: `flowchart TB
  verifier["Verifier<br><small>KanMk1f5-TSoC1q7…<br>Only the app has it</small>"]
  challenge["Challenge<br><small>6WuKI4zP-XcJSYVG…<br>Travels in an address</small>"]
  stored["Login server stores the challenge<br><small>next to the code it gives out</small>"]
  code["Code<br><small>sWuxbESy452V4Do8wQh55Q<br>Travels in an address</small>"]
  check["Login server checks<br><small>SHA-256 of the verifier<br>equals the stored challenge?</small>"]
  tokens["Tokens<br><small>at_sMgrcK4p…, rt_JoAwPqvH…<br>Straight to the app</small>"]
  verifier -->|"1. SHA-256, in the app"| challenge
  challenge -->|"2. GET /authorize, through the browser"| stored
  stored -->|"3. after you sign in, back through the browser"| code
  code -->|"4. POST /token"| check
  verifier -->|"4. POST /token, straight to the login server"| check
  check -->|"5. equal"| tokens`,
      nodeInteractions: {
        verifier: {
          label: "Verifier",
          kicker: "Value",
          type: "verifier",
          tooltip: "A random secret, new for each login. The app keeps it until the code exchange.",
          body: md`
            32 random bytes, written as 43 characters of base64url, the URL-safe alphabet. The verifier from the run:

            ~~~text
            KanMk1f5-TSoC1q7Kjn9r63DH5ARo5wM_Gzjohwyh7w
            ~~~

            ~~~go file=examples/oauth-pkce/pkce.go lines=23-41 mark=36-40
            ~~~
          `,
          facts: [["Length", "43 characters"], ["Lives", "One login"]],
        },
        challenge: {
          label: "Challenge",
          kicker: "Value",
          type: "challenge",
          tooltip: "SHA-256 of the verifier. Safe to show, because it cannot be turned back into the verifier.",
          body: md`
            ~~~text
            6WuKI4zP-XcJSYVGkJAFVJp4xUEvDKRIkCIBrvgl7RQ
            ~~~

            The same SHA-256 that Python's \`hashlib\` gives for the verifier above. The library also gives RFC 7636's own example: \`dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk\` becomes \`E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM\`.

            ~~~go file=examples/oauth-pkce/pkce.go lines=49-55
            ~~~

            RFC 7636 also allows \`plain\`, where the challenge is the verifier itself. That protects nothing if the address is read, so this library's option makes only S256.
          `,
        },
        code: { label: "Code", kicker: "Value", type: "code", tooltip: "The login server's answer to a sign-in. Works once, and only with the verifier." },
        stored: {
          label: "Login server stores the challenge",
          kicker: "Login server",
          tooltip: "The login server remembers the challenge until the code comes back.",
          body: md`
            From the run, as the login server logged it:

            ~~~text
            GET /authorize
              code_challenge = 6WuKI4zP-XcJSYVGkJAFVJp4xUEvDKRIkCIBrvgl7RQ
              code_challenge_method = S256
            stores code sWuxbESy452V4Do8wQh55Q with challenge 6WuKI4zP-XcJSYVGkJAFVJp4xUEvDKRIkCIBrvgl7RQ
            ~~~
          `,
        },
        check: {
          label: "Login server checks",
          kicker: "Login server",
          tooltip: "Hash the verifier it was sent, and compare with the challenge stored for this code.",
          body: md`
            A sketch of the test server's check. Real login servers do the same comparison:

            ~~~go
            sum := sha256.Sum256([]byte(r.PostForm.Get("code_verifier")))
            if base64.RawURLEncoding.EncodeToString(sum[:]) != stored.challenge {
                fail("code_verifier does not match the challenge")
            }
            ~~~
          `,
        },
        tokens: { label: "Tokens", kicker: "Value", type: "token", tooltip: "An access token for the API, and a refresh token for new access tokens. Step 5 uses the second." },
      },
      edgeInteractions: [
        ["verifier", "challenge"],
        ["challenge", "stored"],
        ["stored", "code"],
        ["code", "check"],
        ["verifier", "check"],
        ["check", "tokens"],
      ],
    },

    login: {
      tab: "overview",
      parent: null,
      title: "One login, message by message",
      summary: "The browser carries the challenge and the code. The verifier goes straight from the app to the login server.",
      story: md`
        The run, one message per arrow. On the left is the client side: your browser and the app. On the right is the provider: its login server and the API. Each arrow that carries a value has that value's color.

        **At the start, once per login.** You open the app's login link. The app [makes a verifier and its challenge](#App->App), and keeps the verifier until you come back.

        It then [sends your browser to the login server](#App->Browser "peek"), with the challenge in the address. Your browser [asks for the login page](#Browser->Login) with that address.

        **After you sign in.** The run skips the sign-in page and takes the user ada as signed in. The login server [sends your browser back to the app](#Login->Browser) with a code, and your browser follows. Both the challenge and the code went through the browser.

        **Back on the app, from server to server.** The app [sends the code and the verifier](#App->Login "peek") straight to the login server. The browser never sees this request.

        [](#Login->Login)

        The two match, so the login server [answers with the tokens](#Login->App). The code is now used up.

        **On every API call after that.** The app [sends the access token](#App->API), and the API answers with ada's data.
      `,
      chart: `sequenceDiagram
  autonumber
  box rgb(248,250,252) Client side
    participant Browser
    participant App
  end
  box rgb(240,249,255) Provider side
    participant Login as Login server
    participant API
  end
  Browser->>App: GET /login
  App->>App: Make a verifier and its challenge
  App-->>Browser: 302 to the login server, with the challenge
  Browser->>Login: GET /authorize?code_challenge=6WuKI4zP…
  Note over Login: Sign-in page, skipped in the run
  Login-->>Browser: 302 back to the app, with the code
  Browser->>App: GET /callback?code=sWuxbESy…
  App->>Login: POST /token with the code and the verifier
  Login->>Login: SHA-256 of the verifier equals the challenge?
  Login-->>App: 200, access and refresh tokens
  App->>API: GET /me, Bearer at_sMgrcK4p…
  API-->>App: 200 {"user":"ada"}`,
      nodeInteractions: {
        Browser: { label: "Browser", kicker: "Client side", tooltip: "Carries every message between the app and the login server that you can see in the address bar." },
        App: { label: "App", kicker: "Client side", tooltip: "The app you sign in to. It holds the verifier, then the tokens." },
        Login: { label: "Login server", kicker: "Provider", tooltip: "Signs you in, stores the challenge, and gives out the code and the tokens." },
        API: { label: "API", kicker: "Provider", tooltip: "Answers calls that carry a valid access token." },
      },
      edgeInteractions: [
        arrow("Browser", "App", "You start the login.", "", [], { mermaidText: "GET /login" }),
        arrow("App", "App", "A new verifier for this login, and its SHA-256.", md`
          From the run:

          | | |
          | --- | --- |
          | [verifier](~verifier) | \`KanMk1f5-TSoC1q7Kjn9r63DH5ARo5wM_Gzjohwyh7w\` |
          | [challenge](~challenge) | \`6WuKI4zP-XcJSYVGkJAFVJp4xUEvDKRIkCIBrvgl7RQ\` |

          ~~~go
          verifier := oauth2.GenerateVerifier()
          ~~~

          The app keeps the verifier where your next request can find it. In the run it is a field in memory, and a real app would use your session. Step 2 shows how both are made.
        `, [], { mermaidText: "Make a verifier and its challenge", type: "verifier", label: "The app makes a verifier" }),
        arrow("App", "Browser", "A redirect to the login page. The challenge is in the address.", md`
          The address from the run, one parameter per line:

          ~~~text
          http://login.example/authorize
            ?client_id=demo-app
            &code_challenge=6WuKI4zP-XcJSYVGkJAFVJp4xUEvDKRIkCIBrvgl7RQ
            &code_challenge_method=S256
            &redirect_uri=http%3A%2F%2Fapp.example%2Fcallback
            &response_type=code
            &scope=profile
            &state=_8gZZuuMASqNHPe-
          ~~~

          \`AuthCodeURL\` builds it. \`S256ChallengeOption\` is one more option that adds two parameters:

          ~~~go
          url := conf.AuthCodeURL(state, oauth2.S256ChallengeOption(verifier))
          ~~~

          ~~~go file=examples/oauth-pkce/oauth2.go lines=30-72 mark=62-64
          ~~~

          ~~~go file=examples/oauth-pkce/pkce.go lines=57-72 mark=60-64,69-72
          ~~~

          \`state\` is a second random value with another job: the app checks it when you come back, so a login someone else started is refused.
        `, [], { mermaidText: "302 to the login server, with the challenge", type: "challenge" }),
        arrow("Browser", "Login", "The login server reads the challenge and keeps it.", "", [
          ["code_challenge", "6WuKI4zP-XcJSYVGkJAFVJp4xUEvDKRIkCIBrvgl7RQ"],
          ["code_challenge_method", "S256"],
          ["client_id", "demo-app"],
        ], { mermaidText: "GET /authorize?code_challenge=", type: "challenge" }),
        arrow("Login", "Browser", "A redirect back to the app. The code is in the address.", md`
          From the run:

          ~~~text
          http://app.example/callback?code=sWuxbESy452V4Do8wQh55Q&state=_8gZZuuMASqNHPe-
          ~~~

          The address goes through your browser, its history, and whatever else on the device can read it. Step 4 is what happens when the wrong program reads it.
        `, [], { mermaidText: "302 back to the app, with the code", type: "code" }),
        arrow("Browser", "App", "The browser brings the code to the app.", "", [], { mermaidText: "GET /callback?code=", type: "code" }),
        arrow("App", "Login", "Server to server: the code, and the verifier kept since message 2.", md`
          The request from the run:

          ~~~text
          POST http://login.example/token
            grant_type=authorization_code
            client_id=demo-app
            code=sWuxbESy452V4Do8wQh55Q
            redirect_uri=http://app.example/callback
            code_verifier=KanMk1f5-TSoC1q7Kjn9r63DH5ARo5wM_Gzjohwyh7w
          ~~~

          \`VerifierOption\` adds the last line:

          ~~~go
          tok, err := conf.Exchange(ctx, code, oauth2.VerifierOption(verifier))
          ~~~

          ~~~go file=examples/oauth-pkce/oauth2.go lines=74-99 mark=95-97
          ~~~

          ~~~go file=examples/oauth-pkce/pkce.go lines=43-47
          ~~~
        `, [], { mermaidText: "POST /token with the code and the verifier", type: "verifier" }),
        arrow("Login", "Login", "Hash the verifier, and compare.", md`
          The login server's log from the run:

          ~~~text
          SHA-256 of the verifier, base64url = 6WuKI4zP-XcJSYVGkJAFVJp4xUEvDKRIkCIBrvgl7RQ
          equals the stored challenge
          ~~~
        `, [], { mermaidText: "SHA-256 of the verifier equals the challenge?", label: "The login server checks the verifier" }),
        arrow("Login", "App", "The tokens. The code no longer works.", md`
          ~~~text
          200 {"access_token":"at_sMgrcK4pVh9BTbKG-URL0XB_",
               "token_type":"Bearer","expires_in":3600,
               "refresh_token":"rt_JoAwPqvHsQ44rgPfcf41mjdr"}
          ~~~

          The [access token](~token) opens the API for an hour. The [refresh token](~token) gets a new one after that, in step 5.
        `, [], { mermaidText: "200, access and refresh tokens", type: "token" }),
        arrow("App", "API", "Every API call carries the access token.", md`
          ~~~text
          GET http://api.example/me
            Authorization: Bearer at_sMgrcK4pVh9BTbKG-URL0XB_
          ~~~

          \`conf.Client(ctx, tok)\` gives an \`http.Client\` that adds this header to every request.
        `, [], { mermaidText: "GET /me, Bearer", type: "token" }),
        arrow("API", "App", "ada's data.", "", [], { mermaidText: "200 {" }),
      ],
    },

    attack: {
      tab: "overview",
      parent: null,
      title: "A stolen code, with and without PKCE",
      summary: "The attacker catches the redirect back to the app. Without PKCE that is enough. With PKCE the login server wants the verifier.",
      story: md`
        **How a code gets stolen.** The [attacker](#Thief) does not break into anything. On a phone, an app tells the system which addresses it opens, and two apps can claim the same one. A harmful app that claims the real app's address gets the redirect, and the code in it. That is the attack RFC 7636 was written for. A code can also leak from the browser history, or to the next page the browser opens.

        The shaded part is what the attacker does. It splits into the two cases from the first step. The run caught each redirect in the test program, so [the app](#App) never got either code.

        **Without PKCE.** The login asked for no challenge, so the login server checks only the code. The [code is valid](#Login->Thief), and the attacker gets ada's tokens. With them, the [API](#API->Thief) answers as it would answer ada.

        **With PKCE.** The same request now gets 400, \`code_verifier required\`. A made-up verifier gets 400 too, \`code_verifier does not match the challenge\`, because its SHA-256 is a different value. The challenge was in the login address for anyone to read, but it cannot be turned back into the verifier, and 32 random bytes are far too many to guess.

        **What PKCE does not stop.** A thief who can read the app's memory or its traffic to the login server has the verifier too. PKCE protects the code on its way through the browser, and nothing else.
      `,
      chart: `sequenceDiagram
  box rgb(248,250,252) Client side
    participant Browser
    participant App
  end
  box rgb(254,242,242) Attacker
    participant Thief as Attacker
  end
  box rgb(240,249,255) Provider side
    participant Login as Login server
    participant API
  end
  Browser->>Login: GET /authorize
  Login-->>Browser: 302 back to the app, with the code
  rect rgba(185,28,28,0.08)
    Browser-->>Thief: The redirect reaches the attacker
    alt Without PKCE
      Thief->>Login: POST /token with the code
      Login-->>Thief: 200, ada's tokens
      Thief->>API: GET /me with ada's token
      API-->>Thief: 200, ada's data
    else With PKCE
      Thief->>Login: POST /token with the code, no verifier
      Login-->>Thief: 400 code_verifier required
      Thief->>Login: POST /token with the code and a guessed verifier
      Login-->>Thief: 400 does not match the challenge
    end
  end`,
      nodeInteractions: {
        Browser: { label: "Browser", kicker: "Client side", tooltip: "Follows the redirect, as always." },
        App: {
          label: "App",
          kicker: "Client side",
          tooltip: "Waits for a redirect that never comes.",
          body: md`
            The app did nothing wrong, and cannot tell a thief took the code. You see a login that never finishes, and try again. Without PKCE, the attacker is now signed in as you.
          `,
        },
        Thief: {
          label: "Attacker",
          kicker: "Attacker",
          status: "problem",
          tooltip: "Another program that gets the redirect meant for the app.",
          body: md`
            In the run, the test program played this part: it read the code from the redirect, then sent its own requests, with the same public \`client_id\` and \`redirect_uri\` as the app.

            Ways a code is read on the way, which RFC 7636 and RFC 9700 describe:

            - Another app on the phone claims the same address. This is RFC 7636's first section.
            - The address stays in the browser history.
            - The next page the browser opens gets the address in the \`Referer\` header.
          `,
        },
        Login: { label: "Login server", kicker: "Provider", tooltip: "The same server in both cases. What changes is whether the login carried a challenge." },
        API: { label: "API", kicker: "Provider", tooltip: "Trusts any valid access token. It cannot tell who sends it." },
      },
      edgeInteractions: [
        arrow("Browser", "Login", "The login starts as usual.", "", [], { mermaidText: "GET /authorize" }),
        arrow("Login", "Browser", "The code is in the address.", "", [], { mermaidText: "302 back to the app, with the code", type: "code" }),
        arrow("Browser", "Thief", "The attacker gets the redirect instead of the app.", "", [], { mermaidText: "The redirect reaches the attacker", type: "code", status: "problem" }),
        arrow("Thief", "Login", "The attacker trades the code, as the app would.", "", [], { mermaidText: "POST /token with the code", type: "code" }),
        arrow("Login", "Thief", "The code is all the login server checks, so the attacker gets tokens.", md`
          From the run:

          ~~~text
          200 {"access_token":"at_RZTyN07gXWiB9ZTkLItVjbtd",
               "token_type":"Bearer","expires_in":3600,
               "refresh_token":"rt_5tOtkWbABEztJj5TcV5lTlI-"}
          ~~~
        `, [], { mermaidText: "200, ada's tokens", type: "token", status: "problem" }),
        arrow("Thief", "API", "The stolen access token works like ada's own.", "", [], { mermaidText: "GET /me with ada's token", type: "token" }),
        arrow("API", "Thief", "The API cannot tell the difference.", md`
          ~~~text
          GET http://api.example/me
            Authorization: Bearer at_RZTyN07gXWiB9ZTkLItVjbtd

          200 {"user":"ada","email":"ada@mail.example"}
          ~~~
        `, [], { mermaidText: "200, ada's data", status: "problem" }),
        arrow("Thief", "Login", "Same code, same request. The login carried a challenge this time.", "", [], { mermaidText: "POST /token with the code, no verifier", type: "code" }),
        arrow("Login", "Thief", "No verifier, no tokens.", "", [], { mermaidText: "400 code_verifier required", status: "new" }),
        arrow("Thief", "Login", "A random verifier, as a guess.", "", [], { mermaidText: "POST /token with the code and a guessed verifier", type: "verifier" }),
        arrow("Login", "Thief", "SHA-256 of the guess is uCiSnFZ5…, not the stored 0FomuDot….", "", [], { mermaidText: "400 does not match the challenge", status: "new" }),
      ],
    },

    refresh: {
      tab: "overview",
      parent: null,
      title: "An hour later: the refresh",
      summary: "When the access token runs out, the app trades the refresh token for new tokens. No verifier is needed, because no code travels.",
      story: md`
        The [access token](~token) from the login lasts an hour. The run then set its expiry an hour back, to see what the library does.

        **Before each call**, the library [checks the access token's expiry](#App->App) itself, so the API never sees an expired token.

        **Then the shaded part.** The app [sends the refresh token](#App->Login "peek") straight to the login server, and gets new tokens back, and the call goes on with the new access token.

        No [verifier](~verifier) is involved. PKCE protects the [code](~code), because the code travels through the browser. The refresh token never does: it goes only between the app and the login server, like the verifier. So after the login, the refresh token is the secret the app has to keep.

        **The old refresh token stops working.** The test server gives a new refresh token each time and forgets the old one, a practice called rotation. So a refresh token copied from the app works only until the app uses it next. The run tried the old one again, and the [login server](#Login) refused it.
      `,
      chart: `sequenceDiagram
  box rgb(248,250,252) Client side
    participant App
  end
  box rgb(240,249,255) Provider side
    participant Login as Login server
    participant API
  end
  App->>App: Before the call: the access token has expired
  rect rgba(3,105,161,0.08)
    App->>Login: POST /token with the refresh token
    Login-->>App: 200, a new access token and a new refresh token
  end
  App->>API: GET /me, Bearer at_s8Tzx7g9…
  API-->>App: 200 {"user":"ada"}
  App->>Login: POST /token with the old refresh token
  Login-->>App: 400 unknown refresh token`,
      nodeInteractions: {
        App: { label: "App", kicker: "Client side", tooltip: "Holds the refresh token, and must keep it secret." },
        Login: {
          label: "Login server",
          kicker: "Provider",
          tooltip: "Gives new tokens for a refresh token it knows, and forgets the old one.",
          body: md`
            The last two messages, from the run:

            ~~~text
            POST /token  grant_type=refresh_token
                         refresh_token=rt_JoAwPqvHsQ44rgPfcf41mjdr
            400 {"error":"invalid_grant","error_description":"unknown refresh token"}
            ~~~

            The library returns it as an error: \`oauth2: "invalid_grant" "unknown refresh token"\`. Not every server rotates refresh tokens. For apps that cannot keep a secret of their own, RFC 9700 asks servers to rotate them, or to tie them to the app in another way.
          `,
        },
        API: { label: "API", kicker: "Provider", tooltip: "Sees only valid access tokens." },
      },
      edgeInteractions: [
        arrow("App", "App", "The library checks the expiry before each request.", md`
          \`Config.Client\` wraps the token in a source that checks it before every request. A token counts as expired 10 seconds early, so it does not run out on the way.

          ~~~go file=examples/oauth-pkce/oauth2.go lines=132-160 mark=150-153
          ~~~
        `, [], { mermaidText: "Before the call: the access token has expired", type: "token", label: "The library checks the expiry" }),
        arrow("App", "Login", "Server to server, like the code exchange. No verifier.", md`
          The request and the answer, from the run:

          ~~~text
          POST http://login.example/token
            grant_type=refresh_token
            client_id=demo-app
            refresh_token=rt_JoAwPqvHsQ44rgPfcf41mjdr

          200 {"access_token":"at_s8Tzx7g926k6dB2wQYtTRVI9",
               "token_type":"Bearer","expires_in":3600,
               "refresh_token":"rt_RJGGB6nshRKM59eTxANBATvO"}
          ~~~

          The library keeps the new refresh token when the server sends one:

          ~~~go file=examples/oauth-pkce/oauth2.go lines=100-130 mark=118-121,126-128
          ~~~
        `, [], { mermaidText: "POST /token with the refresh token", type: "token" }),
        arrow("Login", "App", "New tokens. The old refresh token stops working.", "", [], { mermaidText: "200, a new access token", type: "token" }),
        arrow("App", "API", "The call goes on with the new access token.", "", [], { mermaidText: "GET /me, Bearer", type: "token" }),
        arrow("API", "App", "ada's data, as before.", "", [], { mermaidText: "200 {" }),
        arrow("App", "Login", "The run sent the first refresh token again.", "", [], { mermaidText: "POST /token with the old refresh token", type: "token" }),
        arrow("Login", "App", "Rotation: the old refresh token is gone.", "", [], { mermaidText: "400 unknown refresh token", status: "new" }),
      ],
    },

    basics: {
      tab: "basics",
      parent: null,
      title: "Redirects and tokens in one minute",
      summary: "A redirect sends the browser to another address. A token is what the app shows the API instead of your password.",
      story: md`
        A login like this involves three parties: the **app** you want to use, a **login server** that knows you, and an **API** that holds your data. The app never sees your password. Two things make that work.

        **A redirect** is a server's way of saying "go there instead". It answers with status \`302\` and a \`Location\` address, and the browser opens that address by itself.

        [](#redirect)

        So the app can send you to the login server, and the login server can send you back, each time with a few values in the address. Anything in an address can end up in places you do not control, such as the browser history or another app. That is why the lesson cares which values travel this way.

        **A token** is a long random string that stands for "this app may read ada's profile, for the next hour". The app puts it in each call to the API, and the API checks it.

        [](#apiCall)

        An access token works for anyone who holds it, like a key card. So it travels only between the app and the servers, never in an address.

        The lesson draws four kinds of value in their own colors, in the pictures and in the text: [verifiers](~verifier), [challenges](~challenge), [codes](~code), and [tokens](~token).

        When you are ready, the lesson starts on the first tab.
      `,
      chart: `flowchart LR
  subgraph redirectPart["A redirect"]
    direction TB
    app["The app<br><small>Wants you signed in</small>"]
    redirect["302 Found<br><small>Location: http://login.example/authorize?…</small>"]
    browser["Your browser<br><small>Opens the new address by itself</small>"]
    login["Login server<br><small>Shows its sign-in page</small>"]
    app --> redirect
    redirect --> browser
    browser --> login
  end
  subgraph tokenPart["A token"]
    direction TB
    app2["The app<br><small>Holds the access token</small>"]
    apiCall["GET /me<br><small>Authorization: Bearer at_sMgrcK4p…</small>"]
    api["API<br><small>Checks the token</small>"]
    data["ada's data<br><small>Or 401 for a bad token</small>"]
    app2 --> apiCall
    apiCall --> api
    api --> data
  end
  redirectPart ~~~ tokenPart`,
      nodeInteractions: {
        app: { label: "The app", kicker: "Client", tooltip: "Any program you sign in to: a website, or an app on your phone." },
        redirect: {
          label: "302 Found",
          kicker: "Redirect",
          tooltip: "An answer that sends the browser to the address in Location.",
          body: md`
            The whole answer is short. From the run, before the login address:

            ~~~text
            HTTP/1.1 302 Found
            Location: http://login.example/authorize?client_id=demo-app&...
            ~~~

            The browser follows it at once. The values in the address, such as \`client_id\`, are visible to the browser and anything that can read its addresses.
          `,
        },
        browser: { label: "Your browser", kicker: "Client", tooltip: "Follows each redirect without asking you." },
        login: { label: "Login server", kicker: "Provider", tooltip: "Where you type your password. The app never sees it." },
        app2: { label: "The app", kicker: "Client", tooltip: "Got the token at the end of the login." },
        apiCall: {
          label: "GET /me",
          kicker: "API call",
          type: "token",
          tooltip: "The access token goes in the Authorization header of every call.",
          body: md`
            From the run:

            ~~~text
            GET http://api.example/me
            Authorization: Bearer at_sMgrcK4pVh9BTbKG-URL0XB_
            ~~~

            "Bearer" means: whoever bears this token may use it. The API does not ask who you are. That is why a stolen token is as good as the real one, and why the lesson is about keeping the way to get tokens safe.
          `,
        },
        api: { label: "API", kicker: "Provider", tooltip: "Looks the token up, or checks its signature, before answering." },
        data: { label: "ada's data", kicker: "Answer", tooltip: "200 {\"user\":\"ada\",\"email\":\"ada@mail.example\"} in the run." },
      },
      edgeInteractions: [
        ["app", "redirect"],
        ["redirect", "browser"],
        ["browser", "login"],
        ["app2", "apiCall"],
        ["apiCall", "api"],
        ["api", "data"],
      ],
    },
  },
};
