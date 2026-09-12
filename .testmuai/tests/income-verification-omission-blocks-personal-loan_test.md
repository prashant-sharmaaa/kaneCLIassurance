---
assurance:
  id: t-9
  base: sha256:ed55ba70c8c9537f25f8d87bf8caf3649db85751a6e465821438d96078d415c2
---
# Income verification omission blocks personal loan application submission

> Prove the application cannot be successfully submitted when income verification is left out while the other required field groups are provided.

## Step 1

Open https://core-wealth-hub.lovable.app/login, sign in with username Admin and password admin, and reach the dashboard.

## Step 2 @verifies ac-10

From the dashboard, open the Loan Applications section, then assert a New Application action is shown.

## Step 3 @verifies ac-14

From Loan Applications, choose New Application; on the personal loan application form, enter borrower details with {{borrower_name}}, requested loan amount {{loan_amount}}, loan tenure {{loan_tenure}}, leave income verification empty, enter employment information {{employment_information}}, then attempt to submit for review and assert the application is not submitted successfully.
