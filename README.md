# checkout-service

A tiny payments/checkout service. It exists as the **target codebase** that
**Rewynd** grounds incidents against — when a stack trace is posted in Slack,
Rewynd fetches `src/checkout/payments.ts` from this repo and diffs it against the
era of the past fix.

## The story in the git history
- **Commit 1** — the service before the fix: `charge()` calls the gateway
  directly, so a transient gateway timeout surfaces as `ETIMEDOUT`.
- **Commit 2 (@trish, "PR #482")** — the fix: wraps the call in an
  exponential-backoff retry (3 attempts) and a 15s timeout. That guard lives at
  **`src/checkout/payments.ts:42`** — the line the demo stack trace points at.

Current `main` still has the guard → Rewynd reports **MATCH (the fix still applies)**.

## The demo trace
Paste this into `#incident-response` (it points at `payments.ts:42`):

```
Error: connect ETIMEDOUT 10.0.3.14:443
    at PaymentGateway.charge (src/checkout/payments.ts:42:15)
    at Checkout.process (src/checkout/index.ts:9:12)
    at OrderService.submit (src/orders/service.ts:9:12)
```

## Optional: show a DRIFTED verdict
To demo the "the old fix no longer applies" case, remove the retry guard on
`main` (make `charge()` call `this.gateway.charge(order, key)` directly again)
and commit it, then point Rewynd's fix-era reference at the commit that *added*
the guard (via a commit/PR link in the seeded resolution). Rewynd will then diff
the drifted current code against the fix era and report **DRIFTED**.
