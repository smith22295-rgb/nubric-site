# Public website security

The public site is static HTML, CSS and browser-only demonstrations on GitHub
Pages. It contains no client database, application login, payment processing or
server-side execution. Client Desk and Card Studio records belong in their own
local workspaces and must never be added to this repository.

Every HTML document with a head includes an early Content Security Policy and
an explicit referrer policy. Scripts run from this site; optional, consent-based
Analytics can load the official Google tag. Inline executable scripts, event
handlers, eval, base-URL replacement, frames, plug-ins and workers are disabled.
Structured-data scripts have content hashes. Inline styles remain necessary for
the visual effects and page layouts. Contact forms use encrypted POST requests
to the approved FormSubmit endpoint, with its spam challenge and a honeypot.

Run `python3 _ops/security/verify.py` before publishing. GitHub Actions runs the
same checks on pushes and pull requests with read-only permissions and a pinned
official checkout action. It checks browser policies, structured-data hashes,
inquiry settings, common credential patterns and accidentally committed private
files. Git ignore rules are a second guard; they do not remove files already
committed. These checks are not a guarantee or a substitute for review.

When changing structured data, update the corresponding policy hash. Recheck
the browser console and interactive features before publishing. Keep analytics
opt-in, URL query/fragment redaction and inquiry-field exclusion intact.

Hosting limitation: a meta CSP cannot enforce `frame-ancestors`, and GitHub
Pages currently supplies neither X-Frame-Options nor custom Permissions-Policy
or X-Content-Type-Options headers for this site. Add those at a configurable edge
or host if the hosting setup changes. Do not add unsupported HTTP-only controls
as meta tags and claim they are enforced. HTTPS enforcement remains enabled.

Protect GitHub, the registrar, hosting and email accounts with MFA/passkeys and
appropriate recovery options. Keep domain verification in GitHub Pages and avoid
dangling DNS records when removing a deployment. Never store account passwords,
private keys or client credentials in public website files or browser code.
