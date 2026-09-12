---
assurance:
  id: t-13
  base: sha256:3b4b323064bcec76d80d68a26e94265f401bab968cfd5403525df2b535b34369
---
# Global search by applicant name returns only matching loan records and exposes record history and status

> Prove an administrator can find an existing loan file from the global search bar using applicant name and review its history and current status.

## Step 1

Open https://core-wealth-hub.lovable.app/login and sign in to Core Wealth Hub with username Admin and password admin to reach the administrator dashboard.

## Step 2 @verifies ac-18, ac-20, ac-31

From the administrator dashboard, use the global search bar to search for applicant name {{loan_applicant_name}}, then assert the global search returns only loan records that match the entered applicant name.

## Step 3 @verifies ac-26, ac-27

Open one loan record from the results for applicant name {{loan_applicant_name}}, then assert the loan file shows an application history and a current status.
