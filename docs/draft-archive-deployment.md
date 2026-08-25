# Draft archive gateway deployment

The PWA sends immutable draft-state documents to the Worker in `worker/`. The browser never receives a PAT, GitHub App private key, OAuth client secret, or installation token. GitHub OAuth verifies the operator, the Worker returns an eight-hour origin-bound session token to the open PWA tab, and a short-lived GitHub App installation token performs each atomic repository commit.

## Required configuration

Deploy the Worker and configure these environment values:

- `APP_ORIGIN`: exact production PWA origin, with no trailing slash.
- `ALLOWED_GITHUB_LOGINS`: comma-separated GitHub logins permitted to archive.
- `GITHUB_OAUTH_CLIENT_ID` and secret `GITHUB_OAUTH_CLIENT_SECRET`. These can be
  the client credentials of the same GitHub App used for repository writes; a
  separate OAuth App is not required.
- `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, and secret `GITHUB_APP_PRIVATE_KEY`.
- Secret `SESSION_SIGNING_SECRET`, generated with at least 32 random bytes.
- `GITHUB_REPOSITORY_OWNER`, `GITHUB_REPOSITORY_NAME`, and `GITHUB_ARCHIVE_BRANCH` (normally `main`).

The GitHub App should be installed only on this repository and granted only `Contents: read and write`. Its OAuth callback URL is `https://<worker-host>/auth/callback`.

After deployment, set the public Worker URL in `archive-config.js`. That URL is not a credential. Leave it blank in environments where archival must remain disabled.

## Archive contract

Each write creates, in one Git commit:

- an immutable JSON state under `draft-archive/<year>/<mocks|actual>/<draft-id>/`;
- an immutable lightweight index event under `draft-archive/index/<year>/`; and
- the aggregate `draft-archive/index.json`.

Archive names include a server-generated suffix and are checked for existence before commit. A request ID makes retries idempotent. Ref conflicts are retried against the latest index, and archive files are never force-updated. The client treats offline, authentication, and GitHub failures as non-blocking; local autosave and **Export Draft State** remain independent.
