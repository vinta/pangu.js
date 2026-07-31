# Publish runs as a single job, version guard retained

The publish workflow briefly split building and publishing: a credential-free pack job (checkout, `npm ci`, build, tarball, artifact upload) and a publish job that held `id-token: write`, downloaded the tarball, and published — its in-file comment documented the contract ("this is the only job holding id-token, so it installs nothing, checks out nothing, and runs no scripts"). That shape keeps build-time code out of the OIDC token's scope, and it is what security reviews recommend.

The decision collapses publish back into one job that checks out, installs with `--ignore-scripts`, builds, and publishes with provenance, with `id-token: write` in scope throughout. Three reasons. First, the split never defends the front door: anyone able to push a `v*` tag ships a legitimate-looking release through either shape, and for a solo-maintainer repo the tag push is the realistic compromise path. Second, the threat the split does close — a compromised devDependency exfiltrating the short-lived, package-scoped OIDC token during the build — is exotic next to the upkeep it costs: two jobs, an artifact handoff, and upload/download action pins to maintain. Third, the protections that pay rent all survive the collapse: the fail-fast tag↔`package.json` version check runs before anything installs (mis-tagging is the failure that actually happens, and a wrong version published to npm is unrecoverable), plus `persist-credentials: false`, `npm ci --ignore-scripts`, and `npm publish --provenance`. pangu.py made the same decision the same day (its ADR 0002), so both repos publish through the same shape.

Alternatives rejected:

- Keeping the split: it worked, but it maintains ceremony against a threat the front door dwarfs.
- A plain single job without the version check: saves a few lines and reinstates the one publish failure with a track record.

## Consequences

- Build-time code (devDependencies executed by `npm run build`) runs while the job can mint the npm OIDC token. Accepted for a solo maintainer; revisit if the repo gains a second committer or the dependency tree grows.
- Security reviews will flag this shape again; this ADR is the standing answer, to be re-litigated only with new facts.
- The version check reads `package.json` only. The hardcoded `this.version` in `src/shared/index.ts` stays in sync through `npm run bump-version`, which rewrites both.
