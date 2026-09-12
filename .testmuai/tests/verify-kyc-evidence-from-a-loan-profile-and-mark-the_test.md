---
assurance:
  id: t-3
  base: sha256:e46dab8b4c7717dcbedebcd5d90753a9c358ae5eae4509fe48ac5fbdb3517fde
---
# Verify KYC evidence from a loan profile and mark the applicant as Verified

> Prove that an administrator can open a specific loan profile, access the KYC Verification tab, review or upload the required KYC evidence, and update the KYC status to Verified.

## Step 1

Open https://core-wealth-hub.lovable.app/login in the browser and sign in with username `Admin` and password `admin` to reach the authenticated Core Wealth Hub portal.

## Step 2 @verifies ac-5

Within the authenticated Core Wealth Hub portal, open loan profile {{kyc_ready_loan_profile}} and go to its KYC Verification tab, then assert the KYC Verification tab is shown for that loan profile.

## Step 3 @verifies ac-6, ac-7

On the KYC Verification tab for {{kyc_ready_loan_profile}}, review the submitted KYC evidence, then assert government-issued identification (ID/Passport) and proof of address are both present in the KYC evidence shown for the applicant.

## Step 4 @verifies ac-4

On the same KYC Verification tab for {{kyc_ready_loan_profile}}, update the KYC status to Verified, then assert the KYC status reads "Verified".
