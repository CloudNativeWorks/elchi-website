---
title: OpenAPI Validation
description: Positive security — validate every request against an OpenAPI 3.x contract and block anything the spec doesn't declare.
sidebar_position: 12
tags: [shield, engine]
---

The `openapi` engine is Shield's **positive-security** engine: instead of denying known-bad patterns like a WAF, it validates every request against an **OpenAPI 3.x contract** and blocks anything the spec doesn't declare — shadow endpoints, undeclared parameters, malformed payloads. It is **request-only**, and its phase depends on configuration: **header phase** when `validate_request_body` is off, **body phase** when it's on.

## When to use it

- APIs with a maintained OpenAPI 3.x contract — enforce it at the edge so only conforming requests reach the service.
- Kill shadow/zombie endpoints: any path or operation absent from the spec is blocked.
- Defense in depth with the [Coraza WAF](/shield/engines/coraza-waf): the WAF denies known-bad, the contract allows known-good.

## Configuration

| Field | Type | Required | Default | Purpose |
|---|---|---|---|---|
| `spec_file` | string | **yes** | — | Path to the OpenAPI 3.x document. |
| `validate_request_body` | bool | no | `false` | Validate the request body against the schema (implies body inspection). |
| `reject_undeclared_path` | bool | no | `false` | **Currently a no-op** — the flag is accepted but not read. An undeclared path is *always* blocked regardless of its value (see below). Leave it unset. |

## Example

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-openapi
spec:
  defaults:
    mode: block
    fail_mode: fail_close   # malformed/non-conforming requests fail closed
    inspect_request_body: true
    max_request_body_bytes: 1048576   # 1 MiB (needed for validate_request_body)

  domains:
    - hosts: ["contract.example.com"]
      routes:
        - match:
            path_prefix: "/v1/"
          policy:
            mode: block
            engines:
              openapi:
                spec_file: "/etc/elchi/elchi-shield/openapi/api.yaml"
                validate_request_body: true     # forces body buffering
                # reject_undeclared_path: omit it — undeclared paths block regardless
```

## How it decides

1. **Resolve the operation against the spec.** A path not in the contract is **blocked with `openapi.undeclared_path`** — always. `reject_undeclared_path` has no effect on this: the flag is stored but never read, so undeclared paths are denied whether it is set or not. Positive security means undeclared is denied, period.
2. **A spec-resolution error also blocks** (`openapi.invalid`) — the engine is **fail-closed** on its own contract; a broken spec never silently admits traffic.
3. **Validate the request.** With `validate_request_body: true`, parameters **and** the body are validated against the schema. With it off, only params/headers/query/security are validated (validating the body would falsely reject a required-body operation whose body wasn't buffered).
4. Any violation ⇒ block **`openapi.invalid`** (severity Medium / 403).

Block reasons use **only structural spec fields** (type, parameter name) — never the submitted value — so PII and secrets can't leak into the audit log.

## Envoy prerequisites

- With `validate_request_body: true` the engine moves to the body phase: the policy must enable body inspection (`inspect_request_body: true` and a `max_request_body_bytes` cap — see [body inspection](/shield/policies/body-inspection)). Header-only validation needs no body wiring.
- No source-IP or fingerprint requirements. General setup: [Envoy wiring](/shield/envoy-wiring).

## Verify

A request matching the contract passes:

```bash
curl -i http://contract.example.com/v1/users/42
# HTTP/1.1 200 OK
```

An undeclared path is blocked:

```bash
curl -i http://contract.example.com/v1/internal-debug
# HTTP/1.1 403 Forbidden        <- openapi.undeclared_path
```

A schema-violating body is blocked (with `validate_request_body: true`):

```bash
curl -i http://contract.example.com/v1/users \
  -H 'Content-Type: application/json' \
  -d '{"age": "not-a-number"}'
# HTTP/1.1 403 Forbidden        <- openapi.invalid
```

## Gotchas

:::warning
**The spec must cover ALL legitimate routes.** Positive security blocks every undeclared path — an incomplete contract blocks real traffic. Roll out in `detect` mode first (see [Modes & Fail Postures](/shield/policies/modes-and-postures)), watch `detections_total` for legitimate endpoints missing from the spec, and only then enforce.
:::

- With `validate_request_body: false`, **body schema violations are not caught** — only parameters, headers, query, and security requirements are validated.
- A spec-resolution error blocks (`openapi.invalid`) — the engine fails closed on its own contract, independent of the policy fail posture for internal errors.
- Block reasons never include submitted values — expect structural reasons only (parameter name, expected type) in the audit stream.

Related engines: [Coraza WAF](/shield/engines/coraza-waf) (negative security counterpart), [GraphQL](/shield/engines/graphql).
