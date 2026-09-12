---
assurance:
  id: t-16
  base: sha256:a49b15363f436cd3beb26bc9b0693d979e5aa4af6148e433340c6d6fe2654871
---
# Loan Details Rejected filter returns only Rejected loan records and exposes record history and status

> Prove an administrator can use the Loan Details tab to filter existing loan files by Rejected status and review their histories and current statuses.

## Step 1

Open https://core-wealth-hub.lovable.app/login and sign in to Core Wealth Hub with username Admin and password admin to reach the administrator dashboard in an environment seeded with at least one Rejected loan record.

## Step 2 @verifies ac-19, ac-25

From the administrator dashboard, open the Loan Details tab, then assert the Loan Details view is available for reviewing existing loans and the current-status filter includes Rejected as a selectable value.

## Step 3 @verifies ac-30

In the Loan Details view, apply the Rejected status filter, then assert every displayed loan record shows current status Rejected.

## Step 4 @verifies ac-26, ac-27

Open one loan record from the Rejected results, then assert the loan file shows an application history and a current status.
