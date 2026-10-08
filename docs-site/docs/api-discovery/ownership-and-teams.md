---
title: Ownership & Teams
description: Assign teams, owners, criticality, data classes and tags to discovered endpoints with ordered rules and per-endpoint overrides, review PII-based suggestions, see per-team risk on the Teams tab, and export the catalog as CSV.
sidebar_position: 12
tags: [api-discovery]
---

A finding is only useful when it reaches the team that owns the endpoint. **Ownership** attaches organisational metadata to the inventory — team, owner, criticality, data classes and tags — through ordered **rules** plus per-endpoint **overrides**, and the **Teams** tab turns it into a per-team risk view. Rules are managed under **Settings → API Discovery**; the endpoint detail page shows the effective ownership of each row.

## Rules

A rule has a **match** and a **set**:

| | Fields |
|---|---|
| **Match** (all criteria ANDed) | `listener_name`, `host` (label-boundary rule, as for spec scopes), `path_prefixes` (segment boundaries), `methods` |
| **Set** | `team`, `owner`, `criticality` (`critical` \| `high` \| `medium` \| `low`), `data_classes` (`personal`, `national_id`, `financial`, `health`, `special_category`, `credentials`), `tags` |

Rules are evaluated by **priority** (then creation time). For team, owner, criticality and data classes the **first non-empty value wins**; tags are the **union** of every matching rule. Rules can be reordered. Up to 200 rules per project.

Before saving, a **preview** shows how many confirmed endpoints a rule would match and how many of those already get a team or owner from a rule that resolves earlier (or from an override) — where the new rule would not take effect.

## Overrides

An override sets ownership for one endpoint: a present value replaces the rule result, an explicit empty value clears it, and an absent value inherits. Overrides made on literal rows that were later [merged into a learned template](/api-discovery/path-normalization#learned-templating) carry over to the template; an override set directly on the template wins. Overrides whose endpoint was deleted are listed as **orphaned**. Up to 20 000 overrides per project.

## Suggestions

The endpoint's ownership card offers data-class **suggestions** — never applied automatically — from the endpoint's **active** findings:

| Active finding | Suggested data class |
|---|---|
| PII `email`, `phone` | personal |
| PII `ssn`, `tr_national_id` | personal + national_id |
| PII `credit_card`, `iban` | financial |
| `credential_in_query`, `basic_auth_plaintext` | credentials |

## The Teams tab

Per team (plus a *no team* row): endpoint count, distribution by **active** risk score, criticality and data-class mix, unauthenticated writes, PII endpoints and categories, owners and endpoints without an owner, the maximum active risk and the riskiest endpoints. The same list filters work here.

## Filters and CSV export

The endpoint list, the path-grouped view, the Teams tab and the export accept ownership filters — `team`, `owner`, `criticality`, `tag`, `data_class` (OR within a filter, AND across filters), plus *unowned* and *no team*.

**Export CSV** writes the confirmed rows matching the current filters (up to 50 000) with the columns `method, path, listener, host, protocol, team, owner, criticality, data_classes, tags, active_risk_score, active_exposure_score, last_seen, active_flags, pii_categories` (active) and `id`. Cell values are escaped against CSV injection.

## Permissions

Reading ownership is open to every project member; creating, editing, reordering and deleting rules and overrides requires the Admin or Owner role.

## Related

- [Exploring Endpoints](/api-discovery/endpoints) — where the ownership card and filters live.
- [OpenAPI Specs & Coverage](/api-discovery/specs-and-coverage) — the same host / path scoping rules.
