---
assurance:
  id: t-14
  base: sha256:636ba7fd79e1e72d0198e10c6764a6aeb6bd6269ed941c0835984d948a303029
---
# Global search by phone number returns only matching loan records and exposes record history and status

> Prove an administrator can find an existing loan file from the global search bar using phone number and review its history and current status.

## Step 1

Open https://core-wealth-hub.lovable.app/login and sign in to Core Wealth Hub with username Admin and password admin to reach the administrator dashboard.

## Step 2 @verifies ac-18, ac-22, ac-33

From the administrator dashboard, use the global search bar to search for phone number {{loan_phone_number}}, then assert the global search returns only loan records that match the entered phone number.

## Step 3 @verifies ac-26, ac-27

Open one loan record from the results for phone number {{loan_phone_number}}, then assert the loan file shows an application history and a current status.
