# Public prototype operations record

- Source repository: `sepehr-ad/haris-family` (private)
- Source commit: `cf51de2412bb947b5f80b5961457895961bbd076`
- Source tag: `unreleased`
- Build date (UTC): `2026-11-25`
- Host/provider: GitHub Pages
- Account holder: `sepehr-ad`
- Public origin: `https://sepehr-ad.github.io/nextsafe-app/`
- Relay origin: none
- TLS: GitHub Pages managed HTTPS
- CORS allowlist: none; the static core has no relay configured
- Data held by this build: static files only; suspicious message text is processed in browser memory
- Retention/log policy: no application analytics or message API; GitHub may retain infrastructure logs under its terms
- Backup/rollback: rerun a reviewed source tag or redeploy the preceding tag
- Deployment: private source tag -> gated workflow -> force-updated public artifact branch
- Deletion: disable Pages and delete the public artifact repository
- File manifest: `SHA256SUMS`; its own SHA-256 is the release artifact checksum
