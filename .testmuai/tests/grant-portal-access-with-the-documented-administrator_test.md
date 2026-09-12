---
assurance:
  id: t-2
  base: sha256:b0edd24f04950e17a25f09b151f77c6b42143bfa4bedb4aaaaa33e6ca91ff88a
---
# Grant portal access with the documented administrator credentials

> Prove that the documented Core Wealth Hub login URL accepts the provided admin username and password and grants authenticated portal access.

## Step 1 @verifies ac-1

Open https://core-wealth-hub.lovable.app/login in the browser and reach the Core Wealth Hub login page, then assert the Core Wealth Hub login surface is shown at that URL.

## Step 2 @verifies ac-2

On the Core Wealth Hub login page, submit username `Admin` and password `admin`, then assert the browser leaves the public login form and shows the authenticated Core Wealth Hub portal.
