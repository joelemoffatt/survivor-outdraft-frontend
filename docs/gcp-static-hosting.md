# Firebase Hosting

This frontend is an Expo web export, and Firebase Hosting is the right deploy target when you need SPA routing that behaves like a web app instead of a bucket listing.

Use this setup when you want static hosting on Firebase:

- Firebase Hosting as the frontend origin
- SPA rewrites so all routes fall back to index.html
- A deploy workflow that uploads the dist/ output from expo export -p web

## What gets deployed

The frontend builds to static files in dist/.

Firebase Hosting serves those files and rewrites route hits to index.html so Expo Router can boot on deep links without the bucket XML behavior.

## One-time Firebase setup

Set these variables first:

```bash
export GCP_PROJECT_ID="project-3a4e8cbe-52bf-4e46-9e9"
export EXPO_PUBLIC_API_BASE_URL="https://survivor-outdraft-backend-620492727914.us-central1.run.app/api"
export GCP_SERVICE_ACCOUNT="github-actions-deployer@project-3a4e8cbe-52bf-4e46-9e9.iam.gserviceaccount.com"
```

Initialize Firebase Hosting for the project if it has not been created yet:

```bash
brew install firebase-cli
firebase login
firebase use "$GCP_PROJECT_ID"
firebase projects:addfirebase "$GCP_PROJECT_ID"
firebase hosting:sites:list --project "$GCP_PROJECT_ID"
```

If `firebase hosting:sites:list` returns no sites, create one:

```bash
firebase hosting:sites:create "$GCP_PROJECT_ID" --project "$GCP_PROJECT_ID"
```

This repository already includes `firebase.json` with SPA rewrites, so `firebase init hosting` is optional unless you want to re-generate config interactively.

Choose these answers during init if you still run it:

- Use the existing project: yes
- Public directory: dist
- Configure as a single-page app: yes
- Set up automatic builds and deploys with GitHub: no

## GitHub Actions secrets

Create these repository secrets:

| Secret Name | Copy/Paste Value |
| --- | --- |
| GCP_PROJECT_ID | project-3a4e8cbe-52bf-4e46-9e9 |
| GCP_WORKLOAD_IDENTITY_PROVIDER | projects/620492727914/locations/global/workloadIdentityPools/github-pool/providers/github-provider |
| GCP_SERVICE_ACCOUNT | github-actions-deployer@project-3a4e8cbe-52bf-4e46-9e9.iam.gserviceaccount.com |
| EXPO_PUBLIC_API_BASE_URL | https://survivor-outdraft-backend-620492727914.us-central1.run.app/api |

Update the Workload Identity Provider condition to trust this frontend repo:

```bash
gcloud iam workload-identity-pools providers update-oidc github-provider \
	--project="project-3a4e8cbe-52bf-4e46-9e9" \
	--location="global" \
	--workload-identity-pool="github-pool" \
	--attribute-condition="assertion.repository=='joelemoffatt/survivor-outdraft-frontend'"
```

Bind the deploy service account to this frontend repo principal:

```bash
gcloud iam service-accounts add-iam-policy-binding "github-actions-deployer@project-3a4e8cbe-52bf-4e46-9e9.iam.gserviceaccount.com" \
	--project="project-3a4e8cbe-52bf-4e46-9e9" \
	--role="roles/iam.workloadIdentityUser" \
	--member="principalSet://iam.googleapis.com/projects/620492727914/locations/global/workloadIdentityPools/github-pool/attribute.repository/joelemoffatt/survivor-outdraft-frontend"
```

## Local build

```bash
cd survivor-outdraft-frontend
npm ci
npm run web:export
```

## Deploy flow

The CI job should:

1. install dependencies
2. export the web app with EXPO_PUBLIC_API_BASE_URL set
3. authenticate to Google Cloud using Workload Identity Federation
4. deploy dist/ to Firebase Hosting

## Notes

- Firebase Hosting is not your old bucket origin; it manages the hosting layer for you.
- The files still come from dist/, but the deploy target is Firebase Hosting, not a manually managed Cloud Storage bucket.
- Keep backend API URLs out of the frontend source and provide them through EXPO_PUBLIC_API_BASE_URL at build time.