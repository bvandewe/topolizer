# GitHub Pages Setup

This repository is configured to automatically deploy to GitHub Pages on every push to the `main` branch.

## One-Time Setup Required

Before the first deployment, GitHub Pages must be enabled manually:

1. Go to [Repository Settings → Pages](https://github.com/bvandewe/topolizer/settings/pages)
2. Under "Build and deployment":
   - **Source**: Select **GitHub Actions**
3. Click **Save**

That's it! After this one-time setup, all future deployments will happen automatically.

## Accessing the Live Demo

Once deployed, the application will be available at:
**https://bvandewe.github.io/topolizer/**

## How It Works

The GitHub Actions workflow (`.github/workflows/docker-build-publish.yml`) automatically:

1. Builds the frontend on every push to `main`
2. Fixes asset paths for GitHub Pages
3. Uploads the built files
4. Deploys to GitHub Pages

No manual intervention needed after the initial setup!
