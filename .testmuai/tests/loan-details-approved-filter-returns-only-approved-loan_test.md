---
assurance:
  id: t-15
  base: sha256:c35c4e8a5016213d019251369176ebbe0cc7187084a7311ec37c473a91b6ce1c
---
# Loan Details Approved filter returns only Approved loan records and exposes record history and status

> Prove an administrator can use the Loan Details tab to filter existing loan files by Approved status and review their histories and current statuses.

## Step 1

Open https://core-wealth-hub.lovable.app/login and sign in to Core Wealth Hub with username Admin and password admin to reach the administrator dashboard in an environment seeded with at least one Approved loan record.

## Step 2 @verifies ac-19, ac-24

From the administrator dashboard, open the Loan Details tab, then assert the Loan Details view is available for reviewing existing loans and the current-status filter includes Approved as a selectable value.

## Step 3 @verifies ac-29

In the Loan Details view, apply the Approved status filter, then assert every displayed loan record shows current status Approved.

## Step 4 @verifies ac-26, ac-27

Open one loan record from the Approved results, then assert the loan file shows an application history and a current status.
