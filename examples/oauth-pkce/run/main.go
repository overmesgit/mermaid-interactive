// A real run of OAuth 2.0 login with PKCE, for the values in examples/oauth-pkce.js.
// Three local servers: the app (app.example), the login server (login.example), and the API (api.example).
// A transport maps those names to 127.0.0.1, so URLs read like real ones.
// Scenarios: a normal login with PKCE, a token refresh, and a stolen code with and without PKCE.
// Run it with `go run .` in this folder. Each run makes new random values. output.txt is the run the lesson shows.
package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"golang.org/x/oauth2"
)

var hosts = map[string]string{} // name -> 127.0.0.1:port

func serve(name string, h http.Handler) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		panic(err)
	}
	hosts[name] = ln.Addr().String()
	go http.Serve(ln, h)
}

// One transport for everyone: it dials the local port behind a name.
var transport = &http.Transport{
	DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
		host, _, _ := net.SplitHostPort(addr)
		return (&net.Dialer{}).DialContext(ctx, network, hosts[host])
	},
}

func random(n int) string {
	b := make([]byte, n)
	rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}

func say(format string, a ...any) { fmt.Printf(format+"\n", a...) }

// ---------------- Login server ----------------

type grant struct {
	clientID, redirectURI, challenge, method, user string
}

type loginServer struct {
	mu      sync.Mutex
	codes   map[string]grant
	refresh map[string]string // refresh token -> user
	access  map[string]string // access token -> user
}

func (s *loginServer) authorize(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	say("  [login.example] GET /authorize")
	for _, k := range []string{"response_type", "client_id", "redirect_uri", "scope", "state", "code_challenge", "code_challenge_method"} {
		if q.Get(k) != "" {
			say("      %s = %s", k, q.Get(k))
		}
	}
	// The sign-in page is skipped: the user "ada" is taken as signed in and agreeing.
	code := random(16)
	s.mu.Lock()
	s.codes[code] = grant{q.Get("client_id"), q.Get("redirect_uri"), q.Get("code_challenge"), q.Get("code_challenge_method"), "ada"}
	s.mu.Unlock()
	if q.Get("code_challenge") != "" {
		say("      stores code %s with challenge %s", code, q.Get("code_challenge"))
	} else {
		say("      stores code %s with no challenge", code)
	}
	to := q.Get("redirect_uri") + "?" + url.Values{"code": {code}, "state": {q.Get("state")}}.Encode()
	http.Redirect(w, r, to, http.StatusFound)
}

func (s *loginServer) fail(w http.ResponseWriter, desc string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	body := fmt.Sprintf(`{"error":"invalid_grant","error_description":%q}`, desc)
	say("      -> 400 %s", body)
	io.WriteString(w, body)
}

func (s *loginServer) issue(w http.ResponseWriter, user string) {
	at, rt := "at_"+random(18), "rt_"+random(18)
	s.access[at], s.refresh[rt] = user, user
	body := fmt.Sprintf(`{"access_token":%q,"token_type":"Bearer","expires_in":3600,"refresh_token":%q}`, at, rt)
	say("      -> 200 %s", body)
	w.Header().Set("Content-Type", "application/json")
	io.WriteString(w, body)
}

func (s *loginServer) token(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	say("  [login.example] POST /token")
	for _, k := range []string{"grant_type", "client_id", "code", "redirect_uri", "code_verifier", "refresh_token"} {
		if r.PostForm.Get(k) != "" {
			say("      %s = %s", k, r.PostForm.Get(k))
		}
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	switch r.PostForm.Get("grant_type") {
	case "authorization_code":
		code := r.PostForm.Get("code")
		g, ok := s.codes[code]
		if !ok {
			s.fail(w, "unknown or used code")
			return
		}
		if g.clientID != r.PostForm.Get("client_id") || g.redirectURI != r.PostForm.Get("redirect_uri") {
			s.fail(w, "client or redirect_uri does not match")
			return
		}
		if g.challenge != "" {
			v := r.PostForm.Get("code_verifier")
			if v == "" {
				s.fail(w, "code_verifier required")
				return
			}
			sum := sha256.Sum256([]byte(v))
			got := base64.RawURLEncoding.EncodeToString(sum[:])
			say("      SHA-256 of the verifier, base64url = %s", got)
			if got != g.challenge {
				say("      does not equal the stored challenge %s", g.challenge)
				s.fail(w, "code_verifier does not match the challenge")
				return
			}
			say("      equals the stored challenge")
		}
		delete(s.codes, code) // A code works once.
		s.issue(w, g.user)
	case "refresh_token":
		rt := r.PostForm.Get("refresh_token")
		user, ok := s.refresh[rt]
		if !ok {
			s.fail(w, "unknown refresh token")
			return
		}
		delete(s.refresh, rt) // Rotation: the old refresh token stops working.
		s.issue(w, user)
	default:
		s.fail(w, "unsupported grant_type")
	}
}

// ---------------- API ----------------

func api(login *loginServer) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		say("  [api.example] GET %s  Authorization: %s", r.URL.Path, auth)
		login.mu.Lock()
		user, ok := login.access[strings.TrimPrefix(auth, "Bearer ")]
		login.mu.Unlock()
		if !ok {
			say("      -> 401")
			http.Error(w, `{"error":"invalid_token"}`, http.StatusUnauthorized)
			return
		}
		body := fmt.Sprintf(`{"user":%q,"email":"%s@mail.example"}`, user, user)
		say("      -> 200 %s", body)
		io.WriteString(w, body)
	})
}

// ---------------- App ----------------

type app struct {
	conf     *oauth2.Config
	pkce     bool
	verifier string // kept on the app's side between /login and /callback
	state    string
	token    *oauth2.Token
}

func (a *app) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /login", func(w http.ResponseWriter, r *http.Request) {
		say("  [app.example] GET /login")
		a.state = random(12)
		var to string
		if a.pkce {
			a.verifier = oauth2.GenerateVerifier()
			say("      verifier  = %s  (kept by the app, never sent here)", a.verifier)
			say("      challenge = %s  (S256 of the verifier)", oauth2.S256ChallengeFromVerifier(a.verifier))
			to = a.conf.AuthCodeURL(a.state, oauth2.S256ChallengeOption(a.verifier))
		} else {
			to = a.conf.AuthCodeURL(a.state)
		}
		say("      -> 302 Location: %s", to)
		http.Redirect(w, r, to, http.StatusFound)
	})
	mux.HandleFunc("GET /callback", func(w http.ResponseWriter, r *http.Request) {
		say("  [app.example] GET /callback?%s", r.URL.RawQuery)
		if r.URL.Query().Get("state") != a.state {
			http.Error(w, "bad state", 400)
			return
		}
		ctx := context.WithValue(r.Context(), oauth2.HTTPClient, &http.Client{Transport: transport})
		var opts []oauth2.AuthCodeOption
		if a.pkce {
			opts = append(opts, oauth2.VerifierOption(a.verifier))
		}
		tok, err := a.conf.Exchange(ctx, r.URL.Query().Get("code"), opts...)
		if err != nil {
			say("      Exchange error: %v", err)
			http.Error(w, err.Error(), 500)
			return
		}
		a.token = tok
		say("      Exchange gave access %s, refresh %s, expires %s", tok.AccessToken, tok.RefreshToken, tok.Expiry.Format(time.TimeOnly))
		io.WriteString(w, "signed in")
	})
	return mux
}

func newApp(pkce bool) *app {
	return &app{pkce: pkce, conf: &oauth2.Config{
		ClientID:    "demo-app",
		Endpoint:    oauth2.Endpoint{AuthURL: "http://login.example/authorize", TokenURL: "http://login.example/token", AuthStyle: oauth2.AuthStyleInParams},
		RedirectURL: "http://app.example/callback",
		Scopes:      []string{"profile"},
	}}
}

// ---------------- Browser and attacker ----------------

// The browser follows no redirect by itself, so each hop is printed.
var browser = &http.Client{Transport: transport, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}

func get(u string) *http.Response {
	resp, err := browser.Get(u)
	if err != nil {
		panic(err)
	}
	return resp
}

// The browser opens /login and follows redirects. If steal is set, the redirect back to the app
// is taken by the attacker instead, as when another app on the phone claims the same redirect address.
func login(steal func(code string)) {
	say("[browser] GET http://app.example/login")
	resp := get("http://app.example/login")
	loc := resp.Header.Get("Location")
	say("[browser] follows to login.example")
	resp = get(loc)
	loc = resp.Header.Get("Location")
	say("[browser] login.example answered 302 Location: %s", loc)
	if steal != nil {
		u, _ := url.Parse(loc)
		say("[attacker] reads the redirect, so the app never gets it")
		steal(u.Query().Get("code"))
		return
	}
	resp = get(loc)
	b, _ := io.ReadAll(resp.Body)
	say("[browser] app answered %d %s", resp.StatusCode, b)
}

func attackerExchange(code string, verifier string) {
	form := url.Values{"grant_type": {"authorization_code"}, "client_id": {"demo-app"}, "code": {code}, "redirect_uri": {"http://app.example/callback"}}
	if verifier != "" {
		form.Set("code_verifier", verifier)
	}
	say("[attacker] POST http://login.example/token with the stolen code%s", map[bool]string{true: " and a guessed verifier", false: ""}[verifier != ""])
	resp, err := (&http.Client{Transport: transport}).PostForm("http://login.example/token", form)
	if err != nil {
		panic(err)
	}
	b, _ := io.ReadAll(resp.Body)
	say("[attacker] got %d %s", resp.StatusCode, b)
	if resp.StatusCode == 200 {
		var t struct {
			AccessToken string `json:"access_token"`
		}
		json.Unmarshal(b, &t)
		req, _ := http.NewRequest("GET", "http://api.example/me", nil)
		req.Header.Set("Authorization", "Bearer "+t.AccessToken)
		r2, _ := (&http.Client{Transport: transport}).Do(req)
		b2, _ := io.ReadAll(r2.Body)
		say("[attacker] the API answered %d %s", r2.StatusCode, b2)
	}
}

func main() {
	login1 := &loginServer{codes: map[string]grant{}, refresh: map[string]string{}, access: map[string]string{}}
	lmux := http.NewServeMux()
	lmux.HandleFunc("GET /authorize", login1.authorize)
	lmux.HandleFunc("POST /token", login1.token)
	serve("login.example", lmux)
	serve("api.example", api(login1))
	var current *app
	serve("app.example", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { current.routes().ServeHTTP(w, r) }))

	say("===== 1. Login with PKCE =====")
	current = newApp(true)
	login(nil)

	say("\n===== 2. The app calls the API =====")
	ctx := context.WithValue(context.Background(), oauth2.HTTPClient, &http.Client{Transport: transport})
	client := current.conf.Client(ctx, current.token)
	resp, err := client.Get("http://api.example/me")
	if err != nil {
		panic(err)
	}
	b, _ := io.ReadAll(resp.Body)
	say("[app] API answered %d %s", resp.StatusCode, b)

	say("\n===== 3. An hour later: the access token has expired =====")
	old := *current.token
	expired := old
	expired.Expiry = time.Now().Add(-time.Minute) // as if the hour had passed
	client = current.conf.Client(ctx, &expired)
	resp, err = client.Get("http://api.example/me")
	if err != nil {
		panic(err)
	}
	b, _ = io.ReadAll(resp.Body)
	say("[app] API answered %d %s", resp.StatusCode, b)
	say("[app] the old refresh token %s used again:", old.RefreshToken)
	stale := old
	stale.AccessToken, stale.Expiry = "", time.Now().Add(-time.Minute)
	_, err = current.conf.TokenSource(ctx, &stale).Token()
	say("      %v", err)

	say("\n===== 4. Stolen code, app WITHOUT PKCE =====")
	current = newApp(false)
	login(func(code string) { attackerExchange(code, "") })

	say("\n===== 5. Stolen code, app WITH PKCE =====")
	current = newApp(true)
	login(func(code string) {
		attackerExchange(code, "")
		attackerExchange(code, oauth2.GenerateVerifier())
		say("[attacker] the challenge %s was in the address, but SHA-256 cannot be run backwards to get the verifier", oauth2.S256ChallengeFromVerifier(current.verifier))
	})
}
