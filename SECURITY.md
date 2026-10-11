# Security Policy

## Reporting a vulnerability
Do not publish secrets, access tokens, private learner information, or exploitable details in a public issue. Contact the repository owner privately through GitHub's supported security reporting mechanism when available.

## Security expectations
- Never commit credentials, private URLs, or real personal data.
- Use least-privilege access and environment/managed secret storage.
- Review and update dependencies.
- Validate untrusted input at application boundaries.
- Enforce authorization on the server for private learner data; hiding UI controls is not authorization.
- Minimize personal data and document retention, export, and deletion.
- Avoid logging tokens, sensitive request bodies, or private learning history.
- Treat AI output and external source content as untrusted until reviewed.
- Test account/data isolation before collecting production learner data.

This repository is in foundation phase; application-specific reporting timelines and supported release versions will be defined before production launch.
