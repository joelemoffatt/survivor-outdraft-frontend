# Google Cloud Static Hosting

This frontend is an Expo web export, so the correct Google Cloud target is a Cloud Storage bucket used as the static asset origin.

Use this setup when you want static hosting on GCP:

- Cloud Storage bucket for the exported web files
- Optional Cloud CDN and HTTPS Load Balancer if you need a custom domain and HTTPS
- A deploy workflow that uploads the dist/ output from expo export -p web

## What gets deployed

The frontend builds to static files in dist/.

Because the app uses Expo Router, direct route hits need a fallback. The deploy process copies index.html to 404.html so the SPA can bootstrap from deep links.

## One-time Google Cloud setup

Set these variables first:

```bash
export GCP_PROJECT_ID="project-3a4e8cbe-52bf-4e46-9e9"
export GCP_REGION="us-central1"
export FRONTEND_BUCKET="survivor-outdraft-frontend"
export EXPO_PUBLIC_API_BASE_URL="https://survivor-outdraft-backend-620492727914.us-central1.run.app/api"
export GCP_WORKLOAD_IDENTITY_PROVIDER="projects/.../locations/global/workloadIdentityPools/.../providers/..."
export GCP_SERVICE_ACCOUNT="github-actions-deployer@project-3a4e8cbe-52bf-4e46-9e9.iam.gserviceaccount.com"
```

Create the bucket and enable website behavior:

```bash
gcloud config set project "$GCP_PROJECT_ID"
gsutil mb -l "$GCP_REGION" -b on "gs://$FRONTEND_BUCKET"
gsutil web set -m index.html -e 404.html "gs://$FRONTEND_BUCKET"
```

If the bucket should be publicly readable, grant object viewer access:

```bash
gsutil iam ch allUsers:objectViewer "gs://$FRONTEND_BUCKET"
```

Grant the GitHub Actions deploy service account write access to the bucket:

```bash
gsutil iam ch "serviceAccount:$GCP_SERVICE_ACCOUNT:objectAdmin" "gs://$FRONTEND_BUCKET"
```

If you want production HTTPS with a custom domain, put a load balancer and Cloud CDN in front of the bucket. The bucket website endpoint itself is not the final production layer for a custom domain.

## GitHub Actions secrets

Create these repository secrets:

| Secret Name | Copy/Paste Value |
| --- | --- |
| GCP_PROJECT_ID | project-3a4e8cbe-52bf-4e46-9e9 |
| GCP_BUCKET_NAME | survivor-outdraft-frontend |
| GCP_WORKLOAD_IDENTITY_PROVIDER | projects/.../locations/global/workloadIdentityPools/.../providers/... |
| GCP_SERVICE_ACCOUNT | github-actions-deployer@project-3a4e8cbe-52bf-4e46-9e9.iam.gserviceaccount.com |
| EXPO_PUBLIC_API_BASE_URL | https://survivor-outdraft-backend-620492727914.us-central1.run.app/api |
| GCP_REGION | us-central1 |

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
4. sync dist/ to the Cloud Storage bucket
5. copy index.html to 404.html in the bucket

## Notes

- Use the Cloud Storage bucket as the static origin.
- Use Cloud CDN and HTTPS Load Balancer if you need production-grade HTTPS and a custom domain.
- Keep backend API URLs out of the frontend source and provide them through EXPO_PUBLIC_API_BASE_URL at build time.