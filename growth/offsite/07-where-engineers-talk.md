# Where engineers talk (and the rules for showing up there)

Status: **nothing posted**. Rules were checked 2026-11-09. Reddit blocks automated reads, so the subreddit rules
below come from archived snapshots and mirrors. **Re-read each sidebar before posting.**

General rule for every venue: participate first, disclose affiliation every time ("I work on Elchi"), and lead with
something useful on its own (a write-up, a config snippet, a lesson learned) rather than a product announcement. Most
of these communities remove link-drops from new accounts.

## Reddit

| Subreddit | Fit | Self-promotion rule (as observed) | Best format |
|---|---|---|---|
| r/kubernetes | High (Helm install, Envoy on k8s) | Runs a recurring **"Periodic Weekly: Show off your new tools and projects"** thread. Product posts outside it are commonly removed | Post Elchi in the weekly thread. Standalone posts only for technical write-ups (e.g. article (a)) |
| r/devops | High | AutoModerator **"Weekly Self Promotion Thread"** exists (2026). Self-promotion falls under a numbered rule ("Rule 4" in a 2026 post). Community tolerance for vendor posts is low | Weekly thread. The article as a discussion post ("how do you manage Envoy config at scale?") |
| r/sre | Medium | Smaller and strict about vendor content. Check the sidebar | Discussion or experience post only |
| r/netsec | Low for product, medium for research | Strict: technical research only, no product announcements | Only if there is genuine research (e.g. a CRS-on-APIs false-positive analysis) |
| r/selfhosted | Low (enterprise product, one free node) | Allows "I built" posts with flair, but expects open source or genuinely self-hostable free use. The private repo will draw criticism | Skip until the source is public |
| r/envoyproxy | Check whether it exists or is active | - | - |

Draft opener for the r/kubernetes / r/devops weekly threads:

```text
Elchi — a self-hosted control plane + UI for Envoy fleets (VMs and k8s).
Typed editors generated from Envoy's protobufs, validation in the editor and on
the server, draft → publish over xDS, several Envoy versions side by side, and an
edge agent that runs Envoy on Linux hosts. Optional add-ons: ext_proc WAF with the
OWASP CRS, API discovery from access logs, GSLB.
Free tier = 1 managed edge node. Helm: https://www.elchi.io/docs/getting-started/quickstart
Disclosure: I work on it. Feedback on the config workflow very welcome.
```

## Hacker News: Show HN

Rules (https://news.ycombinator.com/showhn.html, read 2026-11-09): "Show HN is for something you've made that other
people can play with". "Off topic: blog posts, sign-up pages, newsletters, lists, and other reading material." "Make it
easy to try … avoid requiring accounts or email addresses." Minor releases don't qualify. You must be around to answer.

- Elchi qualifies on substance (it can be installed and run for free). But "try it" means installing a stack, and
  closed source will be raised in the comments. Best timing: **after the `elchi` repo is public**, or with a recorded
  demo plus a one-command evaluation install (kind/single VM).
- Title draft: `Show HN: Elchi – a control plane and UI for Envoy proxy fleets`
- First comment: the maker comment from `05-product-directories.md`, made plainer and more technical (HN dislikes
  marketing tone).

## Slack

| Workspace | How to join | Channels | Rules |
|---|---|---|---|
| **Envoy** (`envoyproxy.slack.com`) | Invite via https://www.envoyproxy.io/slack (linked from the envoy README) | Answer user questions about xDS, control planes and ext_proc where you have real expertise. Find the users/help channel after joining | Support there is best-effort and community-run. Do not post promos. Link docs only when they answer the question asked |
| **CNCF** (`cloud-native.slack.com`) | https://slack.cncf.io | `#envoy`-related and project channels; `#kubernetes-users`-style help channels; check for a promotion or show-and-tell channel before sharing a product | CNCF Slack guidelines (github.com/cncf/foundation, `policies-guidance/slack-guidelines.md`): no unsolicited DMs offering services, "Spamming channels with unsolicited or frequent messages is not allowed", keep messages on topic for the channel. Jobs go in `#jobs`; no announcement channel is designated |
| **Kubernetes** (`kubernetes.slack.com`) | https://slack.k8s.io | Help channels only | Same: no unsolicited promotion |

Mailing lists: `envoy-users` (general user discussion) and `envoy-announce` (announcements only, maintainer-driven, so do
not post there). A useful, non-promotional thread in `envoy-users` about a real control-plane lesson is acceptable.

Envoy community meeting: twice a month, Tuesday 9am PT. Anyone can propose an agenda item in the public minutes. A
short demo of a novel ext_proc pattern *might* fit. Product pitches won't.

## Conferences and CFPs (verified dates)

| Event | Date / place | CFP status (2026-11-09) | Notes |
|---|---|---|---|
| **KubeCon + CloudNativeCon Europe 2027** | 15–18 March 2027, Barcelona | **Closed** (closed 11 October 2026, 23:59 CEST; notifications 7 December) | Official CFP page: "Avoid sales or marketing pitches." Talks that discuss "unlicensed or potentially closed-source technologies are almost always rejected." Relevant tracks: Connectivity (L4/L7, service mesh, load balancing), Security. Max 3 proposals per speaker |
| CNCF-hosted co-located events (Europe 2027) | 15 March 2027 (day 0), Barcelona | Opened 2 September 2026; dates per event vary. Third-party aggregators list some closing in Oct–Nov 2026. **Check https://events.linuxfoundation.org/kubecon-cloudnativecon-europe/co-located-events/ today**, since some may still be open | An EnvoyCon or networking-themed co-located day would be the best fit if one is announced |
| **KubeCon + CloudNativeCon North America 2027** | 8–11 November 2027, New Orleans (aggregator listings; official save-the-date) | Not yet open. By analogy with 2026 (co-located CFP opened 6 May 2026), expect spring 2027. **Inference, not confirmed** | Same vendor-neutral rules |
| **EnvoyCon** | 2026 editions: Virtual EnvoyCon (7 May 2026, CFP closed 8 March 2026) and a Virtual EnvoyCon 10-Year Anniversary edition (14 October 2026) | No 2027 EnvoyCon CFP found | Watch the Envoy Slack and `envoy-announce` |

What gets accepted, given those rules: a **vendor-neutral technical talk** where Elchi is at most the context. For example:
- "Running the OWASP CRS behind Envoy's ext_proc: buffering, fail modes and false positives on JSON APIs" (article (b)).
- "Zero-dropped-request Envoy version upgrades for VM fleets: hot restart plus xDS, measured" (the e2e harness has
  evidence of 0 dropped requests. Present the method and the measurement, not the product).
The "closed-source technologies are almost always rejected" line means a public repo materially improves CFP odds.

## Other places worth a profile (low effort)

- **dev.to / Medium / Hashnode:** where articles (a) and (b) go (see the drafts).
- **CNCF community groups** (https://community.cncf.io): local meetups often look for speakers. Vendor-neutral talks only.
- **YouTube:** the existing channel. Link each article to the matching tutorial video, and each video description to the matching docs page.

## Sources

- r/devops and r/kubernetes weekly-thread evidence: reddit.sentinel-team.org snapshots (2026-04 to 06) and Reddit mirrors (search results, 2026-11-09)
- Show HN rules: https://news.ycombinator.com/showhn.html
- Envoy community: https://github.com/envoyproxy/envoy (README "Contact")
- KubeCon EU 2027 CFP: https://events.linuxfoundation.org/kubecon-cloudnativecon-europe/program/cfp/
- EnvoyCon 2026: https://sessionize.com/virtual-envoycon-2026 , https://community2.cncf.io/events/details/cncf-virtual-project-events-hosted-by-cncf-presents-virtual-envoycon-10-year-anniversary-edition/
- CNCF Slack guidelines: https://github.com/cncf/foundation/blob/main/policies-guidance/slack-guidelines.md
- KubeCon NA 2027 dates: https://www.beri.net/events/kubecon-cloudnativecon-na-2027 (aggregator; confirm on events.linuxfoundation.org)
