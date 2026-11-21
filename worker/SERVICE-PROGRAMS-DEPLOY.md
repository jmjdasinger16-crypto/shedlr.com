# Service program catalog rollout

`worker/src/category-programs.mjs` defines order and admin category IDs, legacy per-lead values, category labels, landing URLs, and the BAM scenarios. `npm run build:programs` regenerates the new landing pages, public catalog, order category options, admin/client labels and sitemap. Commit those outputs with taxonomy changes. `npm test` checks that they are current and exercises Worker validation against a local D1 database.

## Release and smoke test

1. Merge the approved change and roll out both the Cloudflare Worker and the Railway frontend. Deploy the Worker before directing traffic to the new pages: the previous Worker rejects the new category IDs at checkout. On an authenticated PowerShell terminal, from the repository root:
   ```powershell
   git switch main
   git pull --ff-only origin main
   npx wrangler deploy --config .\worker\wrangler.jsonc
   ```
2. Open [Industry programs](https://shedlr.com/leads/programs.html). Follow Fencing, Irrigation and Flooring through to the order form and verify that the correct category is selected. Use a test environment for payment tests; don’t submit a live order as a smoke test.
3. Sign in to the BAM workspace with an authorized rep test account. Verify the grouped picker, copyable inquiry, roleplay and link in one new niche. Check the admin category filter and a client display label.

No database migration or Stripe configuration change is required. Existing category IDs and legacy landing-page URLs remain valid. New categories use the existing default legacy per-lead field; the Growth Plan still uses its existing shared Stripe checkout.
