---
assurance:
  id: t-5
  base: sha256:933d5248c61555656a9a0900ddef1213ad73cad76405363508119f99bc84f446
---
# Authorized user opens a new personal loan application and submits the completed form for review

> Prove an authorized non-administrator user can open Loan Applications, start New Application, complete the required borrower, loan, income, and employment forms, and submit the application for review.

## Step 1

Open https://core-wealth-hub.lovable.app/login, sign in with username {{authorized_user_username}} and password {{authorized_user_password}}, and reach the dashboard.

## Step 2

From the dashboard, open the Loan Applications section, then assert a New Application action is shown.

## Step 3 @verifies ac-17, ac-10

From Loan Applications, choose New Application; on the personal loan application form, complete borrower details with {{borrower_name}}, requested loan amount {{loan_amount}}, loan tenure {{loan_tenure}}, income verification {{income_verification}}, and employment information {{employment_information}}, then submit the application for review.
