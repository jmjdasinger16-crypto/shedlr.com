# BAM Training deployment

The training workspace is a separate view linked from the existing owner dashboard. It uses the same signed owner session as Business. A training invite does not grant access to any part of the Business dashboard. Rep data lives in the existing `shedlr-leads` D1 database, in new `bam_training_*` tables.

## Check locally

Run these from the repository root. The test provisions an in-memory D1 database and does not contact live services.

```sh
npm ci
npm test
npx wrangler deploy --dry-run --config worker/wrangler.jsonc
```

## Publish with authorization

Run these from the checkout containing this feature with authorized Cloudflare access. The migration is additive and can be safely rerun. Configure the offer privately: never add the real promo or handoff values to the repository or a GitHub comment.

```sh
npx wrangler d1 execute shedlr-leads --remote --file worker/migration_bam_training.sql --config worker/wrangler.jsonc
npx wrangler secret put BAM_TRAINING_OFFER --config worker/wrangler.jsonc
```

At the secret prompt, paste one line of JSON in this shape, substituting the approved amount, promo code, and both handoff email addresses. Do not add renewal terms to the secret; reps are instructed to check the terms at checkout.

```json
{"price":"$000","code":"REPLACE_ME","handoffs":["first@example.com","second@example.com"]}
```

Deploy the Worker before publishing the frontend through the repository's existing deployment path. The frontend links do not work against an older Worker.

```sh
npx wrangler deploy --config worker/wrangler.jsonc
```

## Smoke test

- **Business:** Sign in at `/admin.html` as the owner. The usual Business dashboard should still open first. Select **BAM Training** and return using **Back to Business**, without a separate owner login.
- **Rep access:** Create an invite using a controlled test email, then use it from `/connect` in a separate browser window. Save a checkpoint, gameplan, and sample Hitlist business. Sign out and back in to verify they stayed saved. Verify that the test rep cannot load the team view. Disable the test rep when finished.
- **Activity and handoff:** Refresh the owner roster and confirm checkpoint, sign-in, Hitlist, and activity tracking. Verify Step 5 shows the approved offer and both handoff recipients. No emails are sent by creating an invite or saving a blocker.

If the frontend must be rolled back, revert or redeploy the previous frontend release. If the Worker must also be rolled back, restore its previous version. Leave the additive database tables in place to preserve rep progress.
