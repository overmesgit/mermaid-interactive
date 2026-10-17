// An explanation of OAuth 2.0 login, and of PKCE (RFC 7636): why a stolen login code is useless when the app keeps a verifier.
// It starts with a plain OAuth login, then the problem, then PKCE, then the same theft with PKCE.
// Every value and answer shown comes from one run of a small Go program: golang.org/x/oauth2 v0.37.0 as the app, against local test servers
// named app.example, login.example, and api.example. The program and its output are in examples/oauth-pkce/run/.
// The code notes show the library's PKCE code from examples/oauth-pkce/pkce.go.
// examples/oauth-pkce.packed.js is this file packed from the repo root, so the editor can show the code. Pack it again after editing this file.
// It follows explain/references/rules.md, and gives each kind of value one color: codes, tokens, verifiers, and challenges, in the diagrams and the text.
// Its sequence charts shade the messages that pass through the browser red, and the direct ones green, with rect.

window.DIAGRAMS = {
  types: { code: "Code", token: "Token", verifier: "Verifier", challenge: "Challenge" },
  tabs: [
    { id: "oauth", label: "OAuth and PKCE", lesson: ["oauth", "problem", "pkce", "attack"] },
    { id: "basics", label: "Basics" },
  ],
  views: {
    oauth: {
      tab: "oauth",
      parent: null,
      title: "How an OAuth login works",
      summary: "The code crosses the browser once. The tokens travel only on direct requests.",
      story: md`
        **The problem OAuth solves.** An app wants to read your data at another service, but it must never see your password there. Say ada uses a photo-printing app that wants her pictures from a photo service. If she typed her photo-service password into the app, the app could do anything with her account, for as long as the password works. With OAuth 2.0 she signs in at the photo service itself, and the app gets a key that opens only what she agreed to, for a limited time.

        **Four players.** In the run they are local test servers with made-up names:

        1. **Ada's browser.** It takes her to the sign-in page and back to the app.
        2. **The app**, \`app.example\`. It wants ada's data.
        3. **The login server**, \`login.example\`. The only place ada types her password. It gives out the [code](~code) and the [tokens](~token).
        4. **The API**, \`api.example\`. It holds ada's data, and answers calls that carry an [access token](~token).

        **Two paths.** Each message in the picture takes one of two paths, and the rest of the lesson depends on the difference:

        - **Through the browser**, the red band. A server answers with a redirect, an answer that tells the browser to open another address, and the browser opens it by itself. Any value rides inside that address, where the browser's history and, on a phone, other apps can see it.
        - **Direct**, the green band. The app sends its own request to a server, over HTTPS in real use. The browser never sees it, and nobody else can read it.

        **One login, without PKCE.** Ada opens the app's login link, and the app [sends her browser to the login server](#App->Browser "peek"). She signs in there. The login server [sends her browser back to the app](#Login->Browser) with a [code](~code) in the address. So the code is the one value that crosses the browser.

        On the direct path, the app [trades the code](#App->Login "peek") for [two tokens](#Login->App), an [access token](~token) and a [refresh token](~token). From then on, [every API call](#App->API) carries the access token, and the API answers with ada's data.

        **Why a code first, and not the tokens straight away?** Imagine a cloakroom with a crowded front counter and a quiet back window. Anything handed across the counter can be seen, or snatched, by someone in the crowd. Nobody overhears what is said at the back window. So the coat never goes across the crowd: the counter hands out a numbered ticket, and the coat is collected at the back window.

        | login | cloakroom |
        | --- | --- |
        | through the browser | across the crowded counter |
        | direct | at the back window |
        | [code](~code) | the ticket |
        | [tokens](~token) | the coat |

        One difference: a real coat is hung up before its ticket is given out. The login server makes the tokens only when the code comes back.

        **Code or token?** Both are random strings from the login server, so they are easy to mix up. Their jobs differ:

        | | [code](~code) | [access token](~token) |
        | --- | --- | --- |
        | in the run | \`kebUrZQWTL_-3VXPX_2HUQ\` | \`at_1KTuiveM4YrC1j_33md3Vn-_\` |
        | travels | through the browser, once | direct, on every API call |
        | used for | getting the tokens | reading ada's data |
        | works | once, for minutes | for an hour |

        So the browser carries only a ticket, and the key that opens ada's data stays on the direct path. When the access token runs out, the app sends the [refresh token](~token), also directly, and gets a new access token without asking ada to sign in again.

        **What's ahead:**

        1. The problem: for many apps, whoever holds the code gets the tokens.
        2. PKCE: the app keeps a secret, and shows it only at the back window.
        3. The same theft, with PKCE.

        **The original change.** PKCE is [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), from 2015, an addition to OAuth 2.0, which is [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749). [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700), the current security advice for OAuth 2.0, asks every app to use it. The code in this lesson is Go's [golang.org/x/oauth2](https://github.com/golang/oauth2), which added PKCE in [commit 55cd552](https://github.com/golang/oauth2/commit/55cd552), reviewed as [CL 463979](https://go-review.googlesource.com/c/oauth2/+/463979).

        New to words like \`client_id\` or \`state\`? The **Basics** tab lists them.
      `,
      chart: `sequenceDiagram
  autonumber
  participant Browser as Ada's browser
  participant App
  participant Login as Login server
  participant API
  rect rgba(185,28,28,0.07)
    Note over Browser,Login: Through the browser: other programs may see these
    Browser->>App: GET /login
    App-->>Browser: 302 to the login server
    Browser->>Login: GET /authorize?client_id=demo-app…
    Note over Login: Ada signs in, skipped in the run
    Login-->>Browser: 302 back to the app, with the code
    Browser->>App: GET /callback?code=kebUrZQW…
  end
  rect rgba(21,128,61,0.07)
    Note over App,API: Direct: only the app and the server see these
    App->>Login: POST /token with the code
    Login-->>App: 200, access and refresh tokens
    App->>API: GET /me, Bearer at_1KTuiveM…
    API-->>App: 200 {"user":"ada"}
  end`,
      nodeInteractions: {
        Browser: { label: "Ada's browser" },
        App: { label: "App" },
        Login: { label: "Login server" },
        API: { label: "API" },
      },
      edgeInteractions: [
        arrow("Browser", "App", "", "", [], { mermaidText: "GET /login" }),
        arrow("App", "Browser", "", md`
          The redirect from the run, one parameter per line:

          ~~~text
          302 Found
          Location: http://login.example/authorize
            ?client_id=demo-app
            &redirect_uri=http%3A%2F%2Fapp.example%2Fcallback
            &response_type=code
            &scope=profile
            &state=GumCaH3n7KfzLNlm
          ~~~

          \`client_id\` names the app, \`redirect_uri\` is where to send ada back, and \`response_type=code\` asks for a [code](~code). The **Basics** tab lists the others. The library builds the address:

          ~~~go
          url := conf.AuthCodeURL(state)
          ~~~
        `, [], { mermaidText: "302 to the login server", label: "The redirect to the login server" }),
        arrow("Browser", "Login", "", "", [], { mermaidText: "GET /authorize?client_id=" }),
        arrow("Login", "Browser", "", md`
          ~~~text
          302 Found
          Location: http://app.example/callback?code=kebUrZQWTL_-3VXPX_2HUQ&state=GumCaH3n7KfzLNlm
          ~~~

          The [code](~code) is now in an address, so it passes through the browser and stays in its history. That is why it is only a ticket: the test server takes it once, and RFC 6749 asks that a code stop working within minutes, 10 at most.
        `, [], { mermaidText: "302 back to the app, with the code", type: "code", label: "The redirect back, with the code" }),
        arrow("Browser", "App", "", "", [], { mermaidText: "GET /callback?code=", type: "code" }),
        arrow("App", "Login", "", md`
          The request from the run. It goes from the app straight to the login server, so the browser never sees it:

          ~~~text
          POST http://login.example/token
            grant_type=authorization_code
            client_id=demo-app
            code=kebUrZQWTL_-3VXPX_2HUQ
            redirect_uri=http://app.example/callback
          ~~~

          ~~~go
          tok, err := conf.Exchange(ctx, code)
          ~~~

          The only value in it that a stranger could not know is the [code](~code). \`client_id\` and \`redirect_uri\` were in the address in message 2, for anyone to read. Step 2 is about that.
        `, [], { mermaidText: "POST /token with the code", type: "code", label: "The app trades the code" }),
        arrow("Login", "App", "", md`
          ~~~text
          200 {"access_token":"at_1KTuiveM4YrC1j_33md3Vn-_",
               "token_type":"Bearer","expires_in":3600,
               "refresh_token":"rt_rJylD0bgwTLOr-54j3EDfTsp"}
          ~~~

          \`expires_in\` is in seconds, so the [access token](~token) works for an hour. The test server forgets the [code](~code) now, so it cannot be traded twice.
        `, [], { mermaidText: "200, access and refresh tokens", type: "token", label: "The tokens" }),
        arrow("App", "API", "", md`
          ~~~text
          GET http://api.example/me
            Authorization: Bearer at_1KTuiveM4YrC1j_33md3Vn-_

          200 {"user":"ada","email":"ada@mail.example"}
          ~~~

          "Bearer" means that whoever bears the token may use it. The API does not ask who sends it. That is why a [token](~token) is worth stealing, and why it never travels through the browser.
        `, [], { mermaidText: "GET /me, Bearer", type: "token", label: "An API call with the access token" }),
        arrow("API", "App", "", "", [], { mermaidText: "200 {" }),
      ],
    },

    problem: {
      tab: "oauth",
      parent: null,
      title: "The problem: a code anyone can trade",
      summary: "For an app with no secret of its own, whoever brings the code gets the tokens.",
      story: md`
        **The problem.** The [code](~code) crosses the browser, and for many apps the login server gives the [tokens](~token) to whoever brings it.

        **The theft, in the run.** The login starts as in step 1, and a test program plays the [attacker](#Thief). It catches [the redirect](#Browser->Thief) before the app gets it. Then, on the direct path, it [trades the code](#Thief->Login "peek") as the app would, and [gets ada's tokens](#Login->Thief). The [API answers](#API->Thief) as it would answer ada, because a token works for whoever holds it.

        The app never gets its code, and cannot tell. Ada sees a login that never finishes, and tries again. In the cloakroom, a pickpocket in the crowd took the ticket and reached the back window first.

        **How a code gets stolen in real life.** Picture the photo app on a phone. Its login ends by sending the browser to an address only that app should open, such as \`photos-app://callback?code=…\`. A phone lets each app claim the addresses it opens, and does not stop a second app from claiming the same one. So a game installed last week can claim it too, and the phone may hand the address, code and all, to the game. RFC 7636 was written for this attack.

        **Why the code alone is enough.** A website whose code runs on its own server can prove who it is when it trades the code. It sends a client secret, a password of its own, on the direct path, so a stolen code is no use without it. In the cloakroom, that is a staff badge shown at the back window. But an app on a phone, or one that runs only in the browser, cannot keep such a secret. Its files are on every user's device, so a secret inside them is one anyone can read. RFC 6749 calls these public clients. For them the code is the only proof, and the app in the run is one: \`demo-app\` has no secret.

        So the login server needs a second proof: one the real app has, and a thief who reads the browser cannot get. That is what PKCE adds.
      `,
      chart: `sequenceDiagram
  autonumber
  participant Browser as Ada's browser
  participant App
  participant Thief as Attacker
  participant Login as Login server
  participant API
  rect rgba(185,28,28,0.07)
    Note over Browser,Login: Through the browser
    Browser->>Login: GET /authorize?client_id=demo-app…
    Login-->>Browser: 302 back to the app, with the code
    Browser-->>Thief: The redirect reaches the attacker
  end
  rect rgba(21,128,61,0.07)
    Note over Thief,API: Direct
    Thief->>Login: POST /token with the code
    Login-->>Thief: 200, ada's tokens
    Thief->>API: GET /me, Bearer at_IZ8WUNSU…
    API-->>Thief: 200 {"user":"ada"}
  end`,
      nodeInteractions: {
        Browser: { label: "Ada's browser" },
        App: { label: "App" },
        Thief: {
          label: "Attacker",
          status: "problem",
          body: md`
            In the run, the test program played this part. It read the [code](~code) from the redirect, then sent its own requests, with the same public \`client_id\` and \`redirect_uri\` as the app.

            Ways a code is read on the way, which RFC 7636 and RFC 9700 describe:

            - Another app on the phone claims the same address. This is RFC 7636's first section.
            - The address stays in the browser history.
            - The next page the browser opens gets the address in the \`Referer\` header.
          `,
        },
        Login: { label: "Login server" },
        API: { label: "API" },
      },
      edgeInteractions: [
        arrow("Browser", "Login", "", "", [], { mermaidText: "GET /authorize?client_id=" }),
        arrow("Login", "Browser", "", "", [], { mermaidText: "302 back to the app, with the code", type: "code" }),
        arrow("Browser", "Thief", "", md`
          The address from the run, meant for the app:

          ~~~text
          http://app.example/callback?code=vdxNXxxoazUrmmvHVFM8wA&state=6UfOMWQu_jK8naxE
          ~~~
        `, [], { mermaidText: "The redirect reaches the attacker", type: "code", status: "problem", label: "The attacker gets the redirect" }),
        arrow("Thief", "Login", "", md`
          The same request the app would send, from the run:

          ~~~text
          POST http://login.example/token
            grant_type=authorization_code
            client_id=demo-app
            code=vdxNXxxoazUrmmvHVFM8wA
            redirect_uri=http://app.example/callback
          ~~~

          The login server cannot tell it from the app: the [code](~code) is valid, and the rest was public.
        `, [], { mermaidText: "POST /token with the code", type: "code", label: "The attacker trades the code" }),
        arrow("Login", "Thief", "", md`
          ~~~text
          200 {"access_token":"at_IZ8WUNSUSREZDp7EtyjX1oee",
               "token_type":"Bearer","expires_in":3600,
               "refresh_token":"rt_aGzmJkPQ0WF7sor-cfyJ2f70"}
          ~~~

          With the [refresh token](~token), the attacker can also get new access tokens after the hour.
        `, [], { mermaidText: "200, ada's tokens", type: "token", status: "problem", label: "Ada's tokens, to the attacker" }),
        arrow("Thief", "API", "", "", [], { mermaidText: "GET /me, Bearer", type: "token" }),
        arrow("API", "Thief", "", md`
          ~~~text
          GET http://api.example/me
            Authorization: Bearer at_IZ8WUNSUSREZDp7EtyjX1oee

          200 {"user":"ada","email":"ada@mail.example"}
          ~~~
        `, [], { mermaidText: "200 {", status: "problem", label: "Ada's data, to the attacker" }),
      ],
    },

    pkce: {
      tab: "oauth",
      parent: null,
      title: "PKCE: a secret shown only at the end",
      summary: "The app keeps a verifier, and sends only its fingerprint, the challenge, through the browser.",
      story: md`
        **The problem.** The login server needs a second proof that only the real app has. But at the start of a login, the app can reach the login server only through the browser, where a thief can read everything.

        **The login with PKCE** is the login from step 1 with two values added, a [verifier](~verifier) and a [challenge](~challenge):

        1. When ada opens the login link, the app [makes a verifier and its challenge](#App->App), and keeps the verifier.
        2. The [redirect to the login server](#App->Browser "peek") carries the [challenge](~challenge) in the address. The login server keeps it next to the [code](~code) it gives out.
        3. On the direct path, the app [sends the code and the verifier](#App->Login "peek"). This is the first time the [verifier](~verifier) leaves the app.
        4. The login server [checks](#Login->Login) that the SHA-256 of the verifier equals the stored challenge. It does, so the [tokens](~token) come back as in step 1.

        **Why it works, back in the cloakroom.** The cloakroom wants a second proof that only you have. It cannot be a password said at the counter, because the crowd hears it. So you tear a card in two. You keep one half, and the attendant pins the other half to your coat, where anyone can see it. To collect at the back window, you bring the ticket *and* your half, and the attendant checks that the halves fit. A pickpocket has your ticket and has seen the pinned half, and still gets nothing, because nobody can tear a card to fit a half they have only looked at.

        PKCE adds the two halves to the login:

        | login | cloakroom |
        | --- | --- |
        | [verifier](~verifier) | your half, which stays with you |
        | [challenge](~challenge) | the pinned half, which anyone can see |

        **So why send a challenge at all?** At the start, the login server has to learn which verifier to accept later. But then the app can reach it only through the browser, the crowded counter. Sending the verifier there would hand it to the same thief who later reads the code. So the app sends something that proves nothing on its own, the challenge, and shows the verifier only at the back window.

        **The tear is a hash.** A hash, here SHA-256, turns any text into a fingerprint of fixed length. The same text always gives the same fingerprint, one changed letter gives a completely different one, and nobody knows a way back from the fingerprint to the text, short of guessing. With the verifier from the run:

        | | |
        | --- | --- |
        | the [verifier](~verifier) | \`5GaqeckPYUeKxNU7pQKcH9Yo_Ikg4UnJ4_T3FT2_k70\` |
        | its SHA-256, the [challenge](~challenge) | \`JDmV6OQAwbr7BYI5n6ThWAdTqdvdhmqPKjye7m-Cbqw\` |
        | the verifier with its last letter changed | \`5GaqeckPYUeKxNU7pQKcH9Yo_Ikg4UnJ4_T3FT2_k71\` |
        | its SHA-256 | \`T5lhrBRH_P06bxBI6EABHPJu0qZqxWkv7bl0os6Sd70\` |

        One difference from the card: its halves are torn at once, but the app makes the verifier first and computes the challenge from it.

        So the two values that cross the browser, the challenge and the code, are no use without the one that never does.
      `,
      chart: `sequenceDiagram
  autonumber
  participant Browser as Ada's browser
  participant App
  participant Login as Login server
  participant API
  rect rgba(185,28,28,0.07)
    Note over Browser,Login: Through the browser
    Browser->>App: GET /login
    App->>App: Make a verifier and its challenge
    App-->>Browser: 302 to the login server, with the challenge
    Browser->>Login: GET /authorize?code_challenge=JDmV6OQA…
    Note over Login: Ada signs in. The challenge is stored
    Login-->>Browser: 302 back to the app, with the code
    Browser->>App: GET /callback?code=Gnhry3bj…
  end
  rect rgba(21,128,61,0.07)
    Note over App,API: Direct
    App->>Login: POST /token with the code and the verifier
    Login->>Login: SHA-256 of the verifier equals the challenge?
    Login-->>App: 200, access and refresh tokens
    App->>API: GET /me, Bearer at_-yMhlb_…
    API-->>App: 200 {"user":"ada"}
  end`,
      nodeInteractions: {
        Browser: { label: "Ada's browser" },
        App: { label: "App" },
        Login: { label: "Login server" },
        API: { label: "API" },
      },
      edgeInteractions: [
        arrow("Browser", "App", "", "", [], { mermaidText: "GET /login" }),
        arrow("App", "App", "", md`
          From the run:

          | | |
          | --- | --- |
          | [verifier](~verifier) | \`5GaqeckPYUeKxNU7pQKcH9Yo_Ikg4UnJ4_T3FT2_k70\` |
          | [challenge](~challenge) | \`JDmV6OQAwbr7BYI5n6ThWAdTqdvdhmqPKjye7m-Cbqw\` |

          The verifier is 32 random bytes, written as 43 URL-safe characters, and the challenge is their SHA-256:

          ~~~go file=examples/oauth-pkce/pkce.go lines=30-41 mark=36-40
          ~~~

          ~~~go file=examples/oauth-pkce/pkce.go lines=52-55
          ~~~

          The app keeps the verifier until ada comes back. In the run it is a field in memory, and a real app would keep it in her session.
        `, [], { mermaidText: "Make a verifier and its challenge", type: "verifier", status: "new", label: "The app makes a verifier" }),
        arrow("App", "Browser", "", md`
          The redirect from the run, one parameter per line. The two marked lines are what PKCE adds:

          ~~~text
          302 Found
          Location: http://login.example/authorize
            ?client_id=demo-app
            &code_challenge=JDmV6OQAwbr7BYI5n6ThWAdTqdvdhmqPKjye7m-Cbqw   ← new
            &code_challenge_method=S256                                   ← new
            &redirect_uri=http%3A%2F%2Fapp.example%2Fcallback
            &response_type=code
            &scope=profile
            &state=V8nyRUqtqXcHi0Hd
          ~~~

          One more option to the call from step 1 adds them:

          ~~~go
          url := conf.AuthCodeURL(state, oauth2.S256ChallengeOption(verifier))
          ~~~
        `, [], { mermaidText: "302 to the login server, with the challenge", type: "challenge", label: "The redirect, with the challenge" }),
        arrow("Browser", "Login", "", "", [], { mermaidText: "GET /authorize?code_challenge=", type: "challenge" }),
        arrow("Login", "Browser", "", "", [], { mermaidText: "302 back to the app, with the code", type: "code" }),
        arrow("Browser", "App", "", "", [], { mermaidText: "GET /callback?code=", type: "code" }),
        arrow("App", "Login", "", md`
          The request from the run. The last line is what PKCE adds:

          ~~~text
          POST http://login.example/token
            grant_type=authorization_code
            client_id=demo-app
            code=Gnhry3bju_X1lzKVMVju-Q
            redirect_uri=http://app.example/callback
            code_verifier=5GaqeckPYUeKxNU7pQKcH9Yo_Ikg4UnJ4_T3FT2_k70
          ~~~

          ~~~go
          tok, err := conf.Exchange(ctx, code, oauth2.VerifierOption(verifier))
          ~~~
        `, [], { mermaidText: "POST /token with the code and the verifier", type: "verifier", label: "The code and the verifier" }),
        arrow("Login", "Login", "", md`
          The login server's log from the run:

          ~~~text
          SHA-256 of the verifier, base64url = JDmV6OQAwbr7BYI5n6ThWAdTqdvdhmqPKjye7m-Cbqw
          equals the stored challenge
          ~~~

          A sketch of the test server's check. Real login servers do the same comparison:

          ~~~go
          sum := sha256.Sum256([]byte(r.PostForm.Get("code_verifier")))
          if base64.RawURLEncoding.EncodeToString(sum[:]) != stored.challenge {
              fail("code_verifier does not match the challenge")
          }
          ~~~
        `, [], { mermaidText: "SHA-256 of the verifier equals the challenge?", status: "new", label: "The login server checks the verifier" }),
        arrow("Login", "App", "", "", [], { mermaidText: "200, access and refresh tokens", type: "token" }),
        arrow("App", "API", "", "", [], { mermaidText: "GET /me, Bearer", type: "token" }),
        arrow("API", "App", "", "", [], { mermaidText: "200 {" }),
      ],
    },

    attack: {
      tab: "oauth",
      parent: null,
      title: "The same theft, with PKCE",
      summary: "The thief has the code and the challenge, and gets no tokens without the verifier.",
      story: md`
        **The theft from step 2, against the login from step 3.** The app [made a verifier](#App->App) and sent only the [challenge](~challenge) through the browser. The attacker [catches the redirect](#Browser->Thief) the same way as in step 2, so it has the [code](~code), and it saw the challenge in the login address.

        On the direct path, it tries what it can:

        1. **The code alone**, as in step 2. The [request](#Thief->Login "peek") is the one that got tokens before, and [the answer](#Login->Thief) is now 400, \`code_verifier required\`.
        2. **The code and a made-up verifier.** The login server [hashes it](#Login->Login) and gets some other fingerprint, so the answer is 400, \`code_verifier does not match the challenge\`.

        The API never hears from the attacker.

        **Why it cannot do better.** In the cloakroom, the pickpocket has your ticket and has looked at the pinned half, but cannot tear a card to fit it. A made-up verifier is a guess, and there are 2²⁵⁶ possible verifiers, a number with 78 digits. Working the verifier out of the challenge means running the hash backwards, which nobody knows how to do.

        **What PKCE does not stop.** A thief who can read the app's memory, or its direct requests, has the [verifier](~verifier) too. PKCE protects the code on its trip through the browser, and nothing else.

        **In one sentence:** the code crosses the browser, so it must be useless on its own, and PKCE makes it useless without a verifier that never crosses the browser.
      `,
      chart: `sequenceDiagram
  autonumber
  participant Browser as Ada's browser
  participant App
  participant Thief as Attacker
  participant Login as Login server
  participant API
  rect rgba(185,28,28,0.07)
    Note over Browser,Login: Through the browser
    Browser->>App: GET /login
    App->>App: Make a verifier and its challenge
    App-->>Browser: 302 to the login server, with the challenge
    Browser->>Login: GET /authorize?code_challenge=sQNF0y4E…
    Login-->>Browser: 302 back to the app, with the code
    Browser-->>Thief: The redirect reaches the attacker
  end
  rect rgba(21,128,61,0.07)
    Note over Thief,API: Direct
    Thief->>Login: POST /token with the code alone
    Login-->>Thief: 400 code_verifier required
    Thief->>Login: POST /token with the code and a made-up verifier
    Login->>Login: SHA-256 of the verifier equals the challenge?
    Login-->>Thief: 400 does not match the challenge
  end`,
      nodeInteractions: {
        Browser: { label: "Ada's browser" },
        App: { label: "App" },
        Thief: { label: "Attacker", status: "problem" },
        Login: { label: "Login server" },
        API: { label: "API" },
      },
      edgeInteractions: [
        arrow("Browser", "App", "", "", [], { mermaidText: "GET /login" }),
        arrow("App", "App", "", md`
          From the run. The app keeps the verifier, and the attacker never sees it:

          | | |
          | --- | --- |
          | [verifier](~verifier) | \`AZJCkiuJOhrtZASirNn4wv0VwACi0MCA0rijGBJjfWI\` |
          | [challenge](~challenge) | \`sQNF0y4Ez0bueQOw41mgxBNxBsY5-ZQ1llUxGC2mQgE\` |
        `, [], { mermaidText: "Make a verifier and its challenge", type: "verifier", label: "The app makes a verifier" }),
        arrow("App", "Browser", "", "", [], { mermaidText: "302 to the login server, with the challenge", type: "challenge" }),
        arrow("Browser", "Login", "", "", [], { mermaidText: "GET /authorize?code_challenge=", type: "challenge" }),
        arrow("Login", "Browser", "", "", [], { mermaidText: "302 back to the app, with the code", type: "code" }),
        arrow("Browser", "Thief", "", md`
          The address from the run, meant for the app:

          ~~~text
          http://app.example/callback?code=eILhYqxxutMqFjsf-anl3g&state=soXm32imDjA8GKZs
          ~~~
        `, [], { mermaidText: "The redirect reaches the attacker", type: "code", status: "problem", label: "The attacker gets the redirect" }),
        arrow("Thief", "Login", "", md`
          The same request that got tokens in step 2, from the run:

          ~~~text
          POST http://login.example/token
            grant_type=authorization_code
            client_id=demo-app
            code=eILhYqxxutMqFjsf-anl3g
            redirect_uri=http://app.example/callback
          ~~~
        `, [], { mermaidText: "POST /token with the code alone", type: "code", label: "The attacker trades the code alone" }),
        arrow("Login", "Thief", "", md`
          ~~~text
          400 {"error":"invalid_grant",
               "error_description":"code_verifier required"}
          ~~~

          The login carried a [challenge](~challenge), so the login server gives out tokens for this [code](~code) only with the [verifier](~verifier) that matches it. The error text is the test server's own. RFC 7636 asks for \`invalid_grant\` and leaves the description to the server.
        `, [], { mermaidText: "400 code_verifier required", status: "new", label: "No verifier, no tokens" }),
        arrow("Thief", "Login", "", md`
          The request from the run, with a verifier the attacker made up:

          ~~~text
          POST http://login.example/token
            grant_type=authorization_code
            client_id=demo-app
            code=eILhYqxxutMqFjsf-anl3g
            redirect_uri=http://app.example/callback
            code_verifier=NDX6LsfxPnm4Az9NSm4XBSq9Dj8EKZ3IibKTF7Onkps
          ~~~
        `, [], { mermaidText: "POST /token with the code and a made-up verifier", type: "verifier", label: "The attacker tries a made-up verifier" }),
        arrow("Login", "Login", "", md`
          The same check as in step 3, from the run:

          | | |
          | --- | --- |
          | the made-up [verifier](~verifier) | \`NDX6LsfxPnm4Az9NSm4XBSq9Dj8EKZ3IibKTF7Onkps\` |
          | its SHA-256 | \`UTu01g_vVmjboQsayNQosMdFb_noH6yaLUEjZf2z5kE\` |
          | the stored [challenge](~challenge) | \`sQNF0y4Ez0bueQOw41mgxBNxBsY5-ZQ1llUxGC2mQgE\` |
        `, [], { mermaidText: "SHA-256 of the verifier equals the challenge?", label: "The login server checks the verifier" }),
        arrow("Login", "Thief", "", "", [], { mermaidText: "400 does not match the challenge", status: "new" }),
      ],
    },

    basics: {
      tab: "basics",
      parent: null,
      title: "The words in this lesson",
      summary: "A code is traded once for tokens. The access token opens the API, and the refresh token gets a new one.",
      story: md`
        **Three values with different jobs.** The picture follows them through login 3 of the run, the one with PKCE, and an hour after it.

        The [code](#code) is traded once, on a direct request, for two tokens. The [access token](#access) goes on every API call, for an hour. After that, the app trades the [refresh token](#refresh) for a [new pair](#access2), again directly, and ada does not sign in again. The test server forgets the old refresh token when it gives out a new one, so a copied refresh token works only until the app uses it next.

        **The other words**, each with its value from the run:

        | word | what it is | in the run |
        | --- | --- | --- |
        | redirect | an answer, status \`302\`, that tells the browser to open the address in its \`Location\` header | \`302 Location: http://login.example/authorize?…\` |
        | \`client_id\` | the app's public name at the login server | \`demo-app\` |
        | client secret | the app's own password at the login server. Only an app that runs on its own server can keep one | none: \`demo-app\` runs on the user's device |
        | \`redirect_uri\` | where the login server sends the browser back to | \`http://app.example/callback\` |
        | \`scope\` | what the app asks to read | \`profile\` |
        | \`state\` | a random value the app checks when the browser comes back, so a login someone else started is refused | \`V8nyRUqtqXcHi0Hd\` |
        | Bearer | how a token is sent: whoever bears it may use it | \`Authorization: Bearer at_-yMhlb_…\` |
        | [verifier](~verifier) | PKCE: a random secret the app keeps for one login | \`5GaqeckPYUeKxNU7…\` |
        | [challenge](~challenge) | PKCE: the SHA-256 of the verifier, sent through the browser | \`JDmV6OQAwbr7BYI5…\` |

        When you are ready, the lesson starts on the first tab.
      `,
      chart: `flowchart LR
  code["Code<br><small>Gnhry3bju_X1lzKVMVju-Q<br>works once</small>"]
  access["Access token<br><small>at_-yMhlb_-6sWJW3x…<br>works for an hour</small>"]
  refresh["Refresh token<br><small>rt_amH6aIqZgQqgS…<br>works until used</small>"]
  api["API<br><small>200: ada's data</small>"]
  access2["New access token<br><small>at_pmmDFw5itde2B…</small>"]
  refresh2["New refresh token<br><small>rt_kvEYGaXaG9XGq…</small>"]
  code -->|"POST /token"| access
  code -->|"POST /token"| refresh
  access -->|"on every API call"| api
  refresh -->|"after the hour, POST /token"| access2
  refresh -->|"after the hour, POST /token"| refresh2`,
      nodeInteractions: {
        code: { label: "Code", type: "code" },
        access: { label: "Access token", type: "token" },
        refresh: { label: "Refresh token", type: "token" },
        api: { label: "API" },
        access2: { label: "New access token", type: "token" },
        refresh2: { label: "New refresh token", type: "token" },
      },
      edgeInteractions: [
        ["code", "access"],
        ["code", "refresh"],
        ["access", "api"],
        ["refresh", "access2"],
        ["refresh", "refresh2"],
      ],
    },
  },
};

packFile("examples/oauth-pkce/pkce.go", `
H4sIAAAAAAAAA6VV32/bRgx+tv4KznuxAFvK7CwFPOQhc9yiaNMGdtqXIAjOEmVpke60u5MTN8j/
PvIk+VccbMX8Yvt4/Eh+/MgLQ5ioMsMYHlOVIyRaFVA+RBgsFWQSlioXchkovQyfQiUqmw5hdRKM
3gUnfUiUBpsiSGXR8G18EkWZo6lvDhzOXybwwhBu6F6S5TiG1NrSjMNwmdm0WgSRKsI6SoMfLnK1
CJsgYZOLxxiU6Vpny9TC8GQ4cpAfFFyQk9ImgIs8B2c2oNGgXmHsQn8zCCqhTDMDRlU6QohUjEB/
l2qFWlL1izUI+HN+OTB2nSN75VmEkjxtKixEQsKCClCVjLlQrvrzx8n0y3zqqgo8rxTRg1hSJFeE
52VFqbSFntfpRnpdWhVqIePu9q9JxfD3Mz5ASflkRMBCGDw75SOJNqx03vV8z4uUNA6Is56kIs9R
LvETrqH+nEOXLfdRa+oeXL1CYihmh1dX7wtnazy+o86SDPUWe+OxakwuI6LnA0rUwm5cYNkcGCLy
+tNkWnPcusEjdRtGQ1CRRWoQ9YPpUIVE0wqE+pGoPFeP3D+SRYEyFjaj6pny2fsJvDsbnfFlvn9B
WkWTbiOYVFV5zG1qU4mdQlFEKQgnkuyHw9sIkgCq3BLzx1BKYQxBWAW3EyWTbBmw0iZU1bfZ5zsg
5Pb8ElckFrbeMbIr9XZOzd104GvJce/6QDXvIk6fqBNkPwYXRUTNjXpAuYPa0t0ABl5SyehVM3o+
GKu5rmevQ77d2XTy9epq+uVyelkLmgWsKltWllshwFSZFQtaAHVXQFbFYttUSm6BDqlqKIk0Ujxy
HA0HrqVg8O+KhIwBOGr3D3nWKKR0GLXKSd0DJ/wasNQqriJGPB01iETzwIgE21roFoUH4aAc0p7E
gq47a9cLSUdYTUNJlgxt4nZYrKIwtUUe6iRiMf1qMGIiB6fBb16HXWB8DoV4wN7t3WJtsU8F+l4n
S+C+D6g1m5miYIYi7rGD/4c7/+UcZJYz351SyCzq0SE5vngdjbbSsqk6mIlHqmvaTHzgfuCNmrsS
a0DvxU3Yfquhhnljum5baba6gI+2lbKS+ZrbR5CvJf0fBdjobD+l3nZoXPY+7GfBZDTFG7TXQovi
+WEMB4umD6vxppCXpva94XlPb9JmzRyjYbPNIKZrK557fsb2d0+96Bxyu0KuNSZkbnR1dGLpWURN
u0AZky14zzse3kzvNSXbOaR9z+qp134wrwr6alS2cfP9n9MLgd2O7/xjrDU9qBl5iy/HE++CPa4Y
a5euHTH9n73IQjxG4E+rKdr35Jk7fNDG0OUY3f6ubdw+av/eP7/Ps0u02nWJhwE5wyqyz3AYtb9D
bdN4gnAV98pDFJ+n4rvIK+wVQNswcL+Nz4UWwRxt7/gj3ocyOAzsH3U5vMw6+QfkOai68QkAAA==
`);
