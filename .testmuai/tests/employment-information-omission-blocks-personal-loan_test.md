---
assurance:
  id: t-10
  base: sha256:03304a85c7d6199b8c2f2d2dec80b1e37ae7b971be7a6c56164d8781dff49278
---
# Employment information omission blocks personal loan application submission

> Prove the application cannot be successfully submitted when employment information is left out while the other required field groups are provided.

## Step 1

Open https://core-wealth-hub.lovable.app/login, sign in with username Admin and password admin, and reach the dashboard.

## Step 2 @verifies ac-10

From the dashboard, open the Loan Applications section, then assert a New Application action is shown.

## Step 3 @verifies ac-15

From Loan Applications, choose New Application; on the personal loan application form, enter borrower details with {{borrower_name}}, requested loan amount {{loan_amount}}, loan tenure {{loan_tenure}}, income verification {{income_verification}}, leave employment information empty, then attempt to submit for review and assert the application is not submitted successfully.
