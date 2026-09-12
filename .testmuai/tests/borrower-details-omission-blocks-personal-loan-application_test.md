---
assurance:
  id: t-6
  base: sha256:389553c43ff822bfc6e01cf8afd5e97b35e91e2e997bca730b46f8fc88fe2577
---
# Borrower details omission blocks personal loan application submission

> Prove the application cannot be successfully submitted when borrower details are left out while the other required field groups are provided.

## Step 1

Open https://core-wealth-hub.lovable.app/login, sign in with username Admin and password admin, and reach the dashboard.

## Step 2 @verifies ac-10

From the dashboard, open the Loan Applications section, then assert a New Application action is shown.

## Step 3 @verifies ac-11

From Loan Applications, choose New Application; on the personal loan application form, leave borrower details empty while entering requested loan amount {{loan_amount}}, loan tenure {{loan_tenure}}, income verification {{income_verification}}, and employment information {{employment_information}}, then attempt to submit for review and assert the application is not submitted successfully.
