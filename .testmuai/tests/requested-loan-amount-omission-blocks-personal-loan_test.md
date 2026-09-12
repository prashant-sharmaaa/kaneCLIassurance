---
assurance:
  id: t-7
  base: sha256:26826c499d416ff4e78a9b1c14e36007e8ea78073497731f0d74089928091351
---
# Requested loan amount omission blocks personal loan application submission

> Prove the application cannot be successfully submitted when the requested loan amount is left out while the other required field groups are provided.

## Step 1

Open https://core-wealth-hub.lovable.app/login, sign in with username Admin and password admin, and reach the dashboard.

## Step 2 @verifies ac-10

From the dashboard, open the Loan Applications section, then assert a New Application action is shown.

## Step 3 @verifies ac-12

From Loan Applications, choose New Application; on the personal loan application form, enter borrower details with {{borrower_name}}, leave the requested loan amount empty, enter loan tenure {{loan_tenure}}, income verification {{income_verification}}, and employment information {{employment_information}}, then attempt to submit for review and assert the application is not submitted successfully.
