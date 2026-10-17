// Shortened from oauth2.go in golang.org/x/oauth2 v0.37.0, for the notes in examples/oauth-pkce.js.
// Only the lines the notes show are kept, as Go wrote them. "// ..." marks each cut, so line numbers differ from the original.
// The whole file: https://github.com/golang/oauth2/blob/v0.37.0/oauth2.go

// Copyright 2014 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// Package oauth2 provides support for making
// OAuth2 authorized and authenticated HTTP requests,
// as specified in RFC 6749.
// It can additionally grant authorization with Bearer JWT.
package oauth2 // import "golang.org/x/oauth2"
// ...
// An AuthCodeOption is passed to Config.AuthCodeURL.
type AuthCodeOption interface {
	setValue(url.Values)
}

type setParam struct{ k, v string }

func (p setParam) setValue(m url.Values) { m.Set(p.k, p.v) }

// SetAuthURLParam builds an [AuthCodeOption] which passes key/value parameters
// to a provider's authorization endpoint.
func SetAuthURLParam(key, value string) AuthCodeOption {
	return setParam{key, value}
}

// AuthCodeURL returns a URL to OAuth 2.0 provider's consent page
// that asks for permissions for the required scopes explicitly.
//
// State is an opaque value used by the client to maintain state between the
// request and callback. The authorization server includes this value when
// redirecting the user agent back to the client.
//
// Opts may include [AccessTypeOnline] or [AccessTypeOffline], as well
// as [ApprovalForce].
//
// To protect against CSRF attacks, opts should include a PKCE challenge
// (S256ChallengeOption). Not all servers support PKCE. An alternative is to
// generate a random state parameter and verify it after exchange.
// See https://datatracker.ietf.org/doc/html/rfc6749#section-10.12 (predating
// PKCE), https://www.oauth.com/oauth2-servers/pkce/ and
// https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-09.html#name-cross-site-request-forgery (describing both approaches)
func (c *Config) AuthCodeURL(state string, opts ...AuthCodeOption) string {
	var buf strings.Builder
	buf.WriteString(c.Endpoint.AuthURL)
	v := url.Values{
		"response_type": {"code"},
		"client_id":     {c.ClientID},
	}
	if c.RedirectURL != "" {
		v.Set("redirect_uri", c.RedirectURL)
	}
	if len(c.Scopes) > 0 {
		v.Set("scope", strings.Join(c.Scopes, " "))
	}
	if state != "" {
		v.Set("state", state)
	}
	for _, opt := range opts {
		opt.setValue(v)
	}
	if strings.Contains(c.Endpoint.AuthURL, "?") {
		buf.WriteByte('&')
	} else {
		buf.WriteByte('?')
	}
	buf.WriteString(v.Encode())
	return buf.String()
}
// ...
// Exchange converts an authorization code into a token.
//
// It is used after a resource provider redirects the user back
// to the Redirect URI (the URL obtained from AuthCodeURL).
//
// The provided context optionally controls which HTTP client is used. See the [HTTPClient] variable.
//
// The code will be in the [http.Request.FormValue]("code"). Before
// calling Exchange, be sure to validate [http.Request.FormValue]("state") if you are
// using it to protect against CSRF attacks.
//
// If using PKCE to protect against CSRF attacks, opts should include a
// VerifierOption.
func (c *Config) Exchange(ctx context.Context, code string, opts ...AuthCodeOption) (*Token, error) {
	v := url.Values{
		"grant_type": {"authorization_code"},
		"code":       {code},
	}
	if c.RedirectURL != "" {
		v.Set("redirect_uri", c.RedirectURL)
	}
	for _, opt := range opts {
		opt.setValue(v)
	}
	return retrieveToken(ctx, c, v)
}
// ...
// tokenRefresher is a TokenSource that makes "grant_type=refresh_token"
// HTTP requests to renew a token using a RefreshToken.
type tokenRefresher struct {
	ctx          context.Context // used to get HTTP requests
	conf         *Config
	refreshToken string
}

// WARNING: Token is not safe for concurrent access, as it
// updates the tokenRefresher's refreshToken field.
// Within this package, it is used by reuseTokenSource which
// synchronizes calls to this method with its own mutex.
func (tf *tokenRefresher) Token() (*Token, error) {
	if tf.refreshToken == "" {
		return nil, errors.New("oauth2: token expired and refresh token is not set")
	}

	tk, err := retrieveToken(tf.ctx, tf.conf, url.Values{
		"grant_type":    {"refresh_token"},
		"refresh_token": {tf.refreshToken},
	})

	if err != nil {
		return nil, err
	}
	if tf.refreshToken != tk.RefreshToken {
		tf.refreshToken = tk.RefreshToken
	}
	return tk, nil
}

// reuseTokenSource is a TokenSource that holds a single token in memory
// and validates its expiry before each call to retrieve it with
// Token. If it's expired, it will be auto-refreshed using the
// new TokenSource.
type reuseTokenSource struct {
	new TokenSource // called when t is expired.

	mu sync.Mutex // guards t
	t  *Token

	expiryDelta time.Duration
}

// Token returns the current token if it's still valid, else will
// refresh the current token and return the new one.
func (s *reuseTokenSource) Token() (*Token, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.t.Valid() {
		return s.t, nil
	}
	t, err := s.new.Token()
	if err != nil {
		return nil, err
	}
	t.expiryDelta = s.expiryDelta
	s.t = t
	return t, nil
}
// ...
