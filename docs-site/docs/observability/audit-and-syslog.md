---
title: Audit & Syslog Forwarding
description: Browse the immutable audit trail and forward audit events to a SIEM over RFC5424 syslog.
sidebar_position: 3
---

![An audit record — who changed what, with the field-level diff](/img/docs/audit-light.webp#gh-light-mode-only)
![An audit record — who changed what, with the field-level diff](/img/docs/audit-dark.webp#gh-dark-mode-only)

Every user action and configuration change is recorded in an immutable audit trail. Browse it under **Audit**, filter by date, action, user, or resource, and open any event for the full before/after detail.

## Forwarding to a SIEM

Forward audit events to an external collector under **Settings → Audit Forwarding**. Elchi speaks **RFC5424** over UDP, TCP, or TLS, and includes a connection test so you can validate the destination before enabling it.
