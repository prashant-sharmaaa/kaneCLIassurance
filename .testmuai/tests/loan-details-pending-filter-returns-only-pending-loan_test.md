---
assurance:
  id: t-11
  base: sha256:8e4d4a38d780e5586d72eb43c4aad63067f9f8d8e7af126c43e8b6dabc59b901
---
# Loan Details Pending filter returns only Pending loan records and exposes record history and status

> Prove an administrator can use the Loan Details tab to filter existing loan files by Pending status and review their histories and current statuses.

## Step 1

Open https://core-wealth-hub.lovable.app/login and sign in to Core Wealth Hub with username Admin and password admin to reach the administrator dashboard in an environment seeded with at least one Pending loan record.

## Step 2 @verifies ac-19, ac-23

From the administrator dashboard, open the Loan Details tab, then assert the Loan Details view is available for reviewing existing loans and the current-status filter includes Pending as a selectable value.

## Step 3 @verifies ac-28

In the Loan Details view, apply the Pending status filter, then assert every displayed loan record shows current status Pending.

## Step 4 @verifies ac-26, ac-27

Open one loan record from the Pending results, then assert the loan file shows an application history and a current status.
