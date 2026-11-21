# BAM Workflow deployment

The BAM Workflow workspace is available at `/bam-portal`; existing `/bam-training` links still work. The owner view uses the same signed owner session as Business. A BAM invite does not grant access to the Business dashboard. Rep data remains in the existing `shedlr-leads` D1 database in the `bam_training_*` tables.

## Check locally

Run these from the repository root. The test provisions an in-memory D1 database and does not contact live services.

```sh
npm ci
npm test
npx wrangler deploy --dry-run --config worker/wrangler.jsonc
```

## Publish with authorization

Use a checkout containing this feature with authorized Cloudflare access. The $199 offer and `EARNOURBUSINESS` code are built into the workflow. If D1 has never been set up for BAM, apply the original migration once. The portal name and `/bam-portal` alias do not require a migration.

```sh
npx wrangler d1 execute shedlr-leads --remote --file worker/migration_bam_training.sql --config worker/wrangler.jsonc
```

Deploy the Worker before relying on the daily link counter or simplified handoff checkpoint. The new sign-in URL uses the existing API and sessions.

```sh
npx wrangler deploy --config worker/wrangler.jsonc
```

## Smoke test

- **Business:** Sign in at `/admin.html` as the owner. The usual Business dashboard should still open first. Select **BAM Workflow** and return using **Back to Business**, without a separate owner login.
- **Rep access:** Create an invite using a controlled test email, then use it from `/bam-portal` in a separate browser window. Save a checkpoint, gameplan, and sample Hitlist business. Open `/bam-training` in another tab and verify the same session and saved progress. Verify the test rep cannot load the team view. Disable the test rep when finished.
- **Outreach:** Choose a supported niche and city, copy a search query and first text, and verify the call script uses the saved market. Copy the correct landing-page and $199 promo messages in Step 4, then record a practice link and check the business appears in the Hitlist.
- **Handoff:** In Step 5, verify the email draft names both Lead Acquisition recipients and includes business name, industry, and jobs discussed. Do not send a practice email. Confirm that the handoff checkpoint logs rep progress without changing the Hitlist.
- **Progress:** The updated workflow keeps previously saved markets and Hitlists. Reps confirm the four new actions as they work them; older lesson answers do not count as completed actions. No additional D1 migration is needed if the original BAM migration ran. Deploy the updated Worker before relying on the updated frontend.

If the frontend must be rolled back, revert or redeploy the previous frontend release. If the Worker must also be rolled back, restore its previous version. Leave the additive database tables in place to preserve rep progress.
