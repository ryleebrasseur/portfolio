# GitHub Pages Deployment Configuration

This repository supports both custom domain and repository-based GitHub Pages deployment.

## Current Configuration

The deployment is currently configured for **custom domain** deployment with:
- `VITE_BASE_PATH: '/'` in `.github/workflows/deploy.yml`
- `CNAME` file in `apps/robin-noguier/public/CNAME`

## For Custom Domain Deployment (Current Setup)

1. **Update CNAME file**: Edit `apps/robin-noguier/public/CNAME` with your actual custom domain (replace `your-custom-domain.com`)
2. **GitHub Pages settings**: In your repository settings → Pages, set your custom domain
3. **DNS configuration**: Point your domain to GitHub Pages (see [GitHub's custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site))

The deployment workflow is already configured correctly with `VITE_BASE_PATH: '/'` for custom domain deployment.

## To Switch to Repository-Based Deployment (username.github.io/portfolio)

If you want to use repository-based deployment instead:

1. **Update deployment workflow**: Change the environment variable in `.github/workflows/deploy.yml`:
   ```yaml
   env:
     VITE_BASE_PATH: '/portfolio/'
   ```
2. **Remove CNAME file**: Delete `apps/robin-noguier/public/CNAME`
3. **GitHub Pages settings**: In repository settings → Pages, set source to "Deploy from a branch"

## How It Works

The Vite configuration uses the `VITE_BASE_PATH` environment variable to determine the base path for asset URLs:

- **Custom domain**: `VITE_BASE_PATH='/'` → Assets served from `yourdomain.com/assets/`
- **Repository-based**: `VITE_BASE_PATH='/portfolio/'` → Assets served from `username.github.io/portfolio/assets/`

## Testing Locally

You can test both configurations locally:

```bash
# Test custom domain build
cd apps/robin-noguier
VITE_BASE_PATH='/' pnpm exec vite build

# Test repository-based build  
cd apps/robin-noguier
VITE_BASE_PATH='/portfolio/' pnpm exec vite build
```

## Troubleshooting

- **Assets not loading**: Check that the `VITE_BASE_PATH` matches your deployment type
- **Custom domain not working**: Verify DNS configuration and GitHub Pages settings
- **Build cache issues**: Clear Turbo cache with `pnpm clean` if needed