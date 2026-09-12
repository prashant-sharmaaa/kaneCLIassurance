---
assurance:
  id: t-8
  base: sha256:d9f962496c624ac2ac4e285a196baf47087b39671e7c3c86b801516aae8d8721
---
# Loan tenure omission blocks personal loan application submission

> Prove the application cannot be successfully submitted when loan tenure is left out while the other required field groups are provided.

## Step 1

Open https://core-wealth-hub.lovable.app/login, sign in with username Admin and password admin, and reach the dashboard.

## Step 2 @verifies ac-10

From the dashboard, open the Loan Applications section, then assert a New Application action is shown.

## Step 3 @verifies ac-13

From Loan Applications, choose New Application; on the personal loan application form, enter borrower details with {{borrower_name}}, requested loan amount {{loan_amount}}, leave loan tenure empty, enter income verification {{income_verification}}, and employment information {{employment_information}}, then attempt to submit for review and assert the application is not submitted successfully.
