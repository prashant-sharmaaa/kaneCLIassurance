---
assurance:
  id: t-1
  base: sha256:7873cc67a70e66e5d4974ebb1505ddf80100ca89449a8250bb854f2552668913
---
# Block portal access when the administrator password is incorrect

> Prove that an incorrect administrator password does not grant authenticated portal access to the secure Core Wealth Hub portal.

## Step 1 @verifies ac-1

Open https://core-wealth-hub.lovable.app/login in the browser and reach the Core Wealth Hub login page, then assert the Core Wealth Hub login surface is shown at that URL.

## Step 2 @verifies ac-3

On the Core Wealth Hub login page, submit username `Admin` with password `wrong-password`, then assert the authenticated Core Wealth Hub portal is not shown and the browser remains on the unauthenticated login surface.
