---
assurance:
  id: t-12
  base: sha256:e1d134c45ae4f5b421ba8a8ff8d434d3e2584cddcbf7e510c267a4d0bbe77c03
---
# Global search by application ID returns only the matching loan record and exposes record history and status

> Prove an administrator can find an existing loan file from the global search bar using application ID and review its history and current status.

## Step 1

Open https://core-wealth-hub.lovable.app/login and sign in to Core Wealth Hub with username Admin and password admin to reach the administrator dashboard.

## Step 2 @verifies ac-18, ac-21, ac-32

From the administrator dashboard, use the global search bar to search for application ID {{loan_application_id}}, then assert the global search returns only loan records with application ID {{loan_application_id}}.

## Step 3 @verifies ac-26, ac-27

Open the loan record returned for application ID {{loan_application_id}}, then assert the loan file shows an application history and a current status.
