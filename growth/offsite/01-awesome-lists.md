# Awesome lists (GitHub)

Status: **not submitted**. Drafts only. One PR per list, opened by the user.

Researched 2026-11-09 by reading each list's README and CONTRIBUTING on GitHub
(`gh api repos/<owner>/<repo>/readme`, `.../contents/CONTRIBUTING.md`).

## Eligibility reality check (read first)

Every Elchi source repository that matters is **private** today
(`gh api orgs/CloudNativeWorks/repos`, 2026-11-09):

| Repo | Visibility |
|---|---|
| `elchi` (UI), `elchi-backend`, `elchi-client`, `elchi-shield`, `elchi-collector`, `elchi-helm`, `elchi-os` | private |
| `elchi-archive` (release binaries, installers), `elchi-proto`, `versioned-go-control-plane`, `elchi-website` | public |

Consequences:

- Lists that require an **OSI-licensed public repository** reject Elchi until the
  `elchi` repo (or another canonical repo) is public. This includes
  `rootsongjc/awesome-cloud-native` (below). The `oss` tag on awesome-devops is also not allowed.
- The stale `awesome.ecosyste.ms` entry still describes `github.com/cloudnativeworks/elchi`
  as Apache-2.0 with 0 stars (last synced 2026-05-11, when the repo was public).
  The link is now a 404 for everyone else.
- The public `elchi-archive` repo has **no description, homepage, topics, README or
  license** (`gh api repos/CloudNativeWorks/elchi-archive`). Fix that before
  submitting anything, because reviewers click through to it. See README.md, "Prerequisite fixes".

## Targets, in priority order

| # | List | Stars / last push | Fit | Eligible today? |
|---|---|---|---|---|
| 1 | [wmariuss/awesome-devops](https://github.com/wmariuss/awesome-devops) | ~4.4k / 2026-11-09 | "API Gateway" section already lists Envoy and Envoy-based gateways | **Yes**, via the "no repository" route (site domain must be at least 6 months old; `elchi.io` was registered 2024-06-12) |
| 2 | [Kami-no/awesome-envoy](https://github.com/Kami-no/awesome-envoy) | 0 / 2020-09-11 | The only Envoy-specific awesome list (it is what ecosyste.ms indexes for "envoy") | Yes (no rules file), but the maintainer looks inactive, so a merge is unlikely. It costs little to open |
| 3 | [rootsongjc/awesome-cloud-native](https://github.com/rootsongjc/awesome-cloud-native) | ~2.6k / 2026-11-09 | "API Gateways & Proxies" lists Envoy-based control planes | **No.** It needs a public OSI-licensed canonical repo. The draft is ready for when `elchi` is public |
| - | 0xInfection/Awesome-WAF | ~7.7k | A catalogue of WAF *fingerprints and evasion*: an entry needs block-page headers and source, so it is offensive-research oriented | Not recommended |
| - | awesome-sysadmin, awesome-selfhosted | - | FOSS-only | Blocked until source is public |

---

## 1. wmariuss/awesome-devops

**Rules (from CONTRIBUTING.md, verbatim points):**
- "is established: an open source tool needs a public repository with an open source license, at least 100 stars and 6 months of history; **a tool without a repository needs a website on a domain at least 6 months old**"
- "has an official link, without tracking parameters"
- Format: `- [Name](https://example.com/) - What the tool does, in one sentence. \`tag\``
- Tags: `oss`, `free`, `paid`, `self-hosted`. "Commercial product you can install yourself" = `paid` `self-hosted`, and Elchi also has a free tier (one managed client without a license), so add `free`.
- "Add one tool per pull request." A bot plus an AI reviewer check format, link, maturity and whether the description matches the project.
- Descriptions: no marketing words ("best", "blazing fast").

**Where:** `## API Gateway`, described as "*API Gateway, Service Proxy and Service Management tools.*" The section is
not alphabetical, so append the line at the end, after `Traefik`.

**Line to add:**

```markdown
- [Elchi](https://www.elchi.io/) - Control plane and web UI for Envoy proxy fleets, with typed xDS editors, versioned publishing and an edge agent that runs Envoy on hosts. `free` `paid` `self-hosted`
```

**PR title:** `Add Elchi to API Gateway`

**PR body:**

```markdown
Adds Elchi (https://www.elchi.io/) to the API Gateway section.

Elchi is a self-hosted control plane for Envoy. It serves xDS (ADS) to Envoy
proxies from typed editors generated from Envoy's protobuf definitions, keeps
edits as drafts until they are published, and runs several Envoy versions side
by side. A small edge agent installs and runs Envoy on Linux hosts.

- Docs: https://www.elchi.io/docs/
- Releases (public): https://github.com/CloudNativeWorks/elchi-archive/releases
- Pricing tags: free tier (one managed edge node without a license), paid
  enterprise license, self-hosted. The source repositories are not public, so
  the entry uses the website link and no `oss` tag.
- Domain registered 2024-06-12 (more than 6 months old).

Disclosure: I work on Elchi.
```

---

## 2. Kami-no/awesome-envoy

**Rules:** none published (no CONTRIBUTING, no PR template). The existing format is
`* [name](url) - description;`, with a trailing semicolon. Relevant section:
`# xDS`, which already lists control-plane implementations (go-control-plane, xds-relay, sample control planes).

**Line to add** (append to the `# xDS` list):

```markdown
* [Elchi](https://www.elchi.io/) - Control plane with a web UI for Envoy fleets: typed xDS editors generated from Envoy's protos, draft/publish workflow, several Envoy versions side by side;
```

Alternative if the maintainer prefers a new heading, placed before `## Benchmarks`:

```markdown
## Management UIs

* [Elchi](https://www.elchi.io/) - Control plane with a web UI for Envoy fleets: typed xDS editors generated from Envoy's protos, draft/publish workflow, several Envoy versions side by side;
```

**PR title:** `Add Elchi (Envoy control plane with UI) to xDS`

**PR body:**

```markdown
Adds Elchi, an xDS control plane for Envoy with a web UI.

- Serves listeners, routes, clusters, endpoints and secrets to Envoy over ADS;
  the editor forms are generated from each Envoy version's protobuf definitions.
- Draft -> publish workflow with server-side validation before anything is pushed.
- Several Envoy versions can be served side by side; a registry routes each
  proxy to a control plane that speaks its version.

Docs: https://www.elchi.io/docs/
Releases: https://github.com/CloudNativeWorks/elchi-archive/releases

Disclosure: I work on Elchi.
```

Note: the last commit to this list was in 2020. Open the PR, but expect no response.
The ecosyste.ms index reads this file, so a merge would still help.

---

## 3. rootsongjc/awesome-cloud-native (BLOCKED: needs a public repo)

**Rules (CONTRIBUTING.md):**
- "**Open source license.** The repository must carry an OSI-approved license"
- "**Canonical repository.** Link to the upstream project itself"
- "Use the project name in lowercase … as the link text … and point directly to the canonical repository."
- Alphabetical order inside the section. Run `go test ./...` before the PR and **paste the commands you ran into the PR body**.
- "Vendor-affiliated is fine" as long as the artifact itself is open source.

**Ready-to-use line (only after `github.com/CloudNativeWorks/elchi` is public with its Apache-2.0 LICENSE).**
In `## API Gateways & Proxies`, it goes alphabetically between `easegress` and `emissary-gateway`:

```markdown
- [elchi](https://github.com/CloudNativeWorks/elchi) - Web UI and control plane for managing Envoy proxy fleets over xDS, with multi-version support and an edge agent.
```

**PR title:** `Add elchi to API Gateways & Proxies`

**PR body:**

```markdown
Adds elchi (https://github.com/CloudNativeWorks/elchi, Apache-2.0), a web UI and
xDS control plane for Envoy proxy fleets.

Category rationale: the section already lists Envoy control planes and gateways;
elchi manages Envoy configuration (LDS/RDS/CDS/EDS/SDS) for proxies on VMs and
Kubernetes.

Checks run:
    go test ./...

Disclosure: I work on elchi.
```

Before submitting, re-check: the repo must be public, carry the LICENSE file, and
have pushes within 2 years (the list's status checker flags older ones).
