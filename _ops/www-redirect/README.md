# Nubric www redirect

This is a separate, static Cloudflare Pages project. It forwards www page links
to the matching HTTPS address on nubric.dev. It contains no Functions, account
credentials, environment variables or GitHub account integration.

- Project: `nubric-www-redirect`
- Pages hostname: `nubric-www-redirect.pages.dev`
- Custom hostname: `www.nubric.dev`
- Plan: Free; only static redirects are deployed.
- DNS provider: GoDaddy (`ns51.domaincontrol.com`, `ns52.domaincontrol.com`).
- Main site: GitHub Pages at `nubric.dev`; Google Workspace email stays separate.

## Publish an update

1. Keep `_redirects` and `index.html` at the ZIP root.
2. In Cloudflare Workers & Pages, choose **nubric-www-redirect**, then create a
   production deployment using Direct Upload. Upload only these two files.
3. Verify HTTPS and 301 Location headers on the Pages hostname, including nested
   paths and query strings. The destination hostname must always be nubric.dev.
4. Verify `www.nubric.dev` after publishing. Do not change root, email or nameservers.

This `_ops` folder is an operational backup excluded by the default GitHub Pages
Jekyll build. Do not copy the redirect rules into the main site's publish root.

## DNS and recovery

The intended DNS record is **CNAME www → nubric-www-redirect.pages.dev**. Register
the custom hostname in this Pages project before setting that record. Do not add
root-domain forwarding or migrate nameservers for this redirect-only setup.

To recover a failed deployment, select an earlier working production deployment
in this Pages project. Check custom-domain status and the www CNAME before changing
anything else. If reverting to GoDaddy forwarding is necessary, remove only the
www CNAME and recreate **subdomain www → https://nubric.dev, Permanent (301)**.
That earlier GoDaddy configuration forwarded the homepage but returned 404 for
individual page links, so it is only a limited fallback. Neither recovery path
requires changing the root domain or Google Workspace DNS records.

Cloudflare Pages documentation:
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/pages/configuration/redirects/
- https://developers.cloudflare.com/pages/functions/pricing/#static-asset-requests
