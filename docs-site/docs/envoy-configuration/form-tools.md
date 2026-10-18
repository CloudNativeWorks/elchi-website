---
title: In-Form Tools
description: Helpers built into the resource editor — the RE2 regex tester on safe_regex fields, the certificate inspector, random secret and session ticket key generators, and the Basic Auth SHA hash generator.
sidebar_position: 9
tags: [envoy]
---

Some Envoy fields are easy to get wrong by hand: a regex Envoy's RE2 engine refuses, a certificate chain in the wrong order, a weak HMAC secret, a session ticket key that is not exactly 80 bytes, a Basic Auth hash in the wrong format. The resource editor has small tools for these next to the fields they belong to.

All of them run **in your browser**: nothing you paste or generate is sent to the controller until you put it in the form and save.

Most tools open from a pill in the bar above a resource's field list, next to **Config Info**. The regex tester is a **Test** link inside the field itself.

| Tool | Where | Opens |
| --- | --- | --- |
| Regex tester | **Test** inside any `safe_regex` field | **Test regex** |
| Certificate inspector | **Inspect certificate** on a TLS Certificate or Certificate Validation Context secret | **Inspect certificate** |
| Secret generator | **Generate secret** on a Generic Secret and on the OAuth2 HTTP filter | **Generate secret** |
| Session ticket key generator | **Generate session ticket key** on a TLS Session Ticket Keys secret | **Generate session ticket key** |
| SHA hash generator | **User Hash Generator** on the Basic Auth filter and its per-route config | **SHA Hash Generator** |

## Regex tester

Every `safe_regex` field (route matchers, header and string matchers, `regex_rewrite`, …) has a **Test** link at its right edge. It opens **Test regex** with the field's current pattern:

- **Regex** — edit the pattern. It is first checked for what Google RE2 refuses: lookahead and lookbehind, atomic groups, conditionals, possessive quantifiers (`a++`), backreferences (`\1`, `\k<name>`), and `\G` / `\Z` (use `\z`). Those show as errors; constructs the browser can't reproduce exactly (such as the ungreedy `(?U)` flag or inline flags mid-pattern) show as notes.
- **Sample values, one per line** — each line is matched the way Envoy matches routes, headers and string matchers: against the **whole** value. A line reads **Matches the whole value**, **No match**, or *No match as Envoy compares it; part of it matches (from position N)* with the partial match highlighted. Capture groups are listed as `\1`, `\2`, ….
- **Rewrite with** (optional, for `regex_rewrite`) — a substitution such as `\1/instance/\2`; each sample shows its rewritten value.

**Use this regex** writes the edited pattern back into the field (it is disabled while the pattern is unchanged or has an RE2 error); **Close** discards it. The browser's regex engine stands in for RE2 after the checks above, so treat a pass as a strong hint, not a guarantee.

## Certificate inspector

On a **TLS Certificate** or **Certificate Validation Context** secret, **Inspect certificate** opens a panel where you paste:

- **Certificate chain (PEM)** — the chain as Envoy will serve it, leaf first, then each issuer.
- **Private key (PEM, optional)** — checked against the first certificate.

It reports whether the private key belongs to the first certificate (if not, Envoy will refuse the pair), whether the chain is in order (each certificate issued by the next), and warns when the first certificate is a CA (is the leaf missing?). For every certificate it shows the subject CN, its role (**leaf**, **intermediate** or **CA**), a validity verdict (*Valid for N more days*, *Expires in N days* when under 14 days, *Expired …*, or *Not valid yet*), and **Subject**, **Issuer** (marked self-signed when it equals the subject), **Names** (SANs), **Valid** (from → to), **Key**, **Signature** and **Serial**.

The inspector only reads what you paste; it does not fill the secret's fields.

## Secret generator

On a **Generic Secret** and on the **OAuth2** HTTP filter, **Generate secret** creates a random secret — for example the OAuth2 filter's HMAC and token secrets, or an API key:

1. Pick a **Length** (**32 bytes** or **64 bytes**) and an encoding (**Base64** or **Hex**).
2. Click **Generate secret** (then **Generate another** for a new one) and **Copy**.
3. Paste it into the secret as an **Inline string**.

The bytes come from the browser's cryptographically secure random generator.

## Session ticket key generator

On a **TLS Session Ticket Keys** secret, **Generate session ticket key** creates one key of exactly **80 bytes** of random data, the size Envoy requires. After **Generate key** you can **Download key file** (`session-ticket.key`) or **Copy as base64**.

In the form, pick **Inline bytes** and upload the key file, or put the file on the proxy host and use **Filename**. Don't use **Inline string**: it would store the text, not the 80 bytes.

The first key encrypts new tickets and every key can decrypt one, so to rotate, add the new key first and keep the old one after it for a while.

## SHA hash generator (Basic Auth)

On the **Basic Auth** HTTP filter (and its per-route override), **User Hash Generator** opens the **SHA Hash Generator**. Enter a **Username** and **Password** and click **Generate hash** to get one htpasswd line:

```text
username:{SHA}base64(SHA1(password))
```

Envoy's Basic Auth filter accepts only this SHA format. **Copy to clipboard**, then paste the line into the filter's **Users** field (for example as an inline string), one line per user. The password never leaves the browser.

## Related

- [Secrets](/envoy-configuration/resources/secrets) — the SDS secret types these tools fill in.
- [Filters](/envoy-configuration/resources/filters) — the OAuth2 and Basic Auth HTTP filters.
- [Routes](/envoy-configuration/resources/routes) — where most `safe_regex` matchers live.
