# Shopora Authentication

Shopora owns browser authentication. MongoDB `AuthUser.uid` is the stable internal user ID and existing values are preserved so commerce records are never orphaned.

## Local

```text
email/username + password
        ->
MongoDB AuthUser
        ->
bcrypt.compare
        ->
Shopora session
        ->
Access JWT + Refresh Session
```

Passwords are hashed with bcrypt (12 rounds for new accounts) and never decrypted. OAuth-only users have no fake password.

## Google

```text
Google OAuth
        ->
authorization code + state + PKCE
        ->
Shopora backend
        ->
verified Google identity
        ->
MongoDB AuthUser
        ->
Shopora JWT session
```

## GitHub

```text
GitHub OAuth
        ->
authorization code + state + PKCE
        ->
Shopora backend
        ->
verified GitHub identity/email
        ->
MongoDB AuthUser
        ->
Shopora JWT session
```

GitHub receives only `read:user` and `user:email`. Provider access tokens are discarded after identity lookup.

## Protected API

```text
HttpOnly access JWT
        ->
requireAuth
        ->
req.user
        ->
protected resource
```

The access JWT defaults to 15 minutes. The refresh session defaults to seven days, is stored in MongoDB only as a SHA-256 token hash, rotates on refresh, and can be revoked by logout. Tokens are never stored in localStorage.

Provider identities link by provider account ID. Linking by email occurs only when the provider confirms that email is verified. Names and usernames are not linking evidence.

During rollout, `ENABLE_LEGACY_FIREBASE_AUTH=true` allows existing Firebase bearer tokens only after Shopora JWT verification is attempted. Disable it after migration verification.
