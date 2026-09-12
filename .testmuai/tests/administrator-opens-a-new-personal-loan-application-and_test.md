---
assurance:
  id: t-4
  base: sha256:acbd2d6907a84d99fd8129c9d1edeb4e0a1a8c581e8de390cebb06e906dca655
---
# Administrator opens a new personal loan application and submits the completed form for review

> Prove an administrator can open Loan Applications, start New Application, complete the required borrower, loan, income, and employment forms, and submit the application for review.

## Step 1

Open https://core-wealth-hub.lovable.app/login, sign in with username Admin and password admin, and reach the dashboard.

## Step 2

From the dashboard, open the Loan Applications section, then assert a New Application action is shown.

## Step 3 @verifies ac-16, ac-10

From Loan Applications, choose New Application; on the personal loan application form, complete borrower details with {{borrower_name}}, requested loan amount {{loan_amount}}, loan tenure {{loan_tenure}}, income verification {{income_verification}}, and employment information {{employment_information}}, then submit the application for review.
