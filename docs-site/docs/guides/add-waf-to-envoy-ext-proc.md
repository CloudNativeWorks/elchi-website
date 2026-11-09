---
title: How to Add a WAF (OWASP Core Rule Set) to Envoy with ext_proc
description: Run the Elchi Shield sidecar next to Envoy, add its ext_proc HTTP filter ahead of the router, and enable the Coraza engine with the embedded OWASP Core Rule Set in a Shield policy, starting in detect mode and moving to block once the findings are clean.
sidebar_position: 2
tags: [guide]
---

To add a web application firewall to Envoy, run a WAF engine as an external processor and connect it through Envoy's `ext_proc` HTTP filter. In Elchi that engine is Shield (`elchi-shield`), a sidecar on each edge host that runs Coraza with the OWASP Core Rule Set (CRS) embedded in its binary. You enable the CRS in a Shield policy (`coraza: {include_owasp: true}`), deploy it in `detect` mode to see what it would block, tune out false positives, then switch the policy to `block`, where a match returns `403` before the request reaches the backend.

## When you need this

- You want CRS protection (SQL injection, XSS, command injection, path traversal, protocol abuse) in front of services behind Envoy.
- You want to roll a WAF out without blocking legitimate traffic on day one.
- You want different WAF strictness per host or per route, for example a higher paranoia level on a payments API and no inspection on a health check.
- You need the WAF to run on the edge host itself, with traffic never leaving the box for inspection.

## Steps

1. **Install Shield on the edge host.** The elchi-client installer installs `elchi-shield` by default, in the same run, as a hardened systemd service (`--no-shield` skips it). Hosts that run Envoy without elchi-client can use the [standalone Shield install](/installation/shield-standalone). See [The Bundled Shield Sidecar](/installation/client/shield-sidecar).
2. **Wire Envoy to Shield with `ext_proc`.** Envoy reaches Shield through the External Processor HTTP filter over a local Unix domain socket (`/run/elchi-shield/extproc.sock`) or loopback TCP. In Elchi, turning API Security on for a listener's HTTP connection manager adds the `elchi-shield` ext_proc filter at the head of the HTTP filter chain, ahead of the router. Set `use_remote_address` on the HTTP connection manager so Shield gets a client IP that cannot be forged. The full cluster and filter configuration is in [Wiring Shield into Envoy](/shield/envoy-wiring).
3. **Write a policy with the CRS in detect mode.** In **Shield → Policies**, create a policy for your host and enable the Coraza engine with `include_owasp: true`. Coraza inspects bodies, so set `inspect_request_body: true` and a `max_request_body_bytes` cap:

   ```yaml
   apiVersion: sentinel.elchi.io/v1
   kind: SecurityPolicy
   metadata:
     name: app-waf
   spec:
     defaults:
       mode: detect            # evaluate and record, never block
       fail_mode: fail_open
       inspect_request_body: true
       max_request_body_bytes: 1048576
     domains:
       - hosts: ["app.example.com"]
         routes:
           - match: { path_prefix: "/" }
             policy:
               engines:
                 coraza:
                   include_owasp: true
   ```

4. **Save to deploy.** Saving a policy queues a `SHIELD_DEPLOY` job that pushes the project's policy bundle to every connected edge. elchi-client validates the files with the local `elchi-shield validate` binary, writes them atomically, and Shield hot-reloads them. An invalid policy never replaces the last valid one. See [Deploying Policies to Edges](/shield/deployment).
5. **Send a test probe.** A request such as `curl -i "https://app.example.com/search?q=1%27%20UNION%20SELECT%20password%20FROM%20users--"` still returns the upstream's response in `detect` mode, and appears in [Security Events](/shield/ui/security-events) with action `detect`, engine `coraza` and the CRS rule that matched.
6. **Tune.** Watch Security Events on real traffic. Put rule ids that match legitimate requests into `exclude_rule_ids`, or add a narrower rule exception. Keep the paranoia level at the default (1) unless you have tuned for a higher one.
7. **Move to `shadow`, then `block`.** `shadow` evaluates as if blocking and records what would be blocked while still allowing the request. When that stream contains only traffic you want blocked, set `mode: block`. See [Modes & Fail Postures](/shield/policies/modes-and-postures).

## How it works

Each HTTP transaction is one `ext_proc` gRPC stream between Envoy and Shield. Envoy sends request headers; Shield switches the body mode to buffered only for routes whose policy inspects bodies, so routes without body inspection carry no body streaming cost. Shield resolves the host and route to a policy, runs header-phase engines, then body checks and body-phase engines such as Coraza, and answers allow, block (`403`) or continue.

Coraza runs the CRS with collaborative anomaly scoring: each matching rule adds to the transaction's score, and the request is blocked when the score crosses `inbound_anomaly_threshold` (CRS default 5). Shield forces `SecRuleEngine On` and expresses monitoring through the policy `mode`, so `detect` and `shadow` see the full detection trail without changing traffic. The CRS version is compiled into the Shield binary; Shield reports it on `/configz` and in its `build_info` metric.

There are two failure layers. Envoy's `failure_mode_allow: true` on the ext_proc filter lets traffic through uninspected if the sidecar is unreachable. Inside Shield, the policy's `fail_mode` decides what happens when an engine errors or times out. A confirmed block always wins over an error.

## Related docs

- [Coraza WAF (OWASP CRS)](/shield/engines/coraza-waf) - every field, paranoia levels, thresholds, CRS settings and rule exceptions.
- [Shield: API Security Overview](/shield/overview) - the other engines a policy can run next to the WAF.
- [How Shield Works](/shield/how-it-works) - the request pipeline and atomic hot reload.
- [Wiring Shield into Envoy](/shield/envoy-wiring) - the ext_proc cluster and filter.
- [Tutorial: Secure an API with Shield](/tutorials/secure-an-api-with-shield) - from API Discovery to an enforced policy.
- [Shield metrics, audit and health](/shield/observability) - the metric set and the ClickHouse audit sink.
