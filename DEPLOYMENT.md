# GitHub Pages Deployment Configuration

This repository supports both custom domain and repository-based GitHub Pages deployment.

## Configuration

### For Custom Domain Deployment

1. **Update CNAME file**: Edit `apps/robin-noguier/public/CNAME` with your custom domain
2. **Configure deployment**: The deployment workflow is already configured for custom domain with `VITE_BASE_PATH: '/'`
3. **GitHub Pages settings**: In your repository settings, set your custom domain in the GitHub Pages section

### For Repository-Based Deployment (username.github.io/portfolio)

1. **Update deployment workflow**: Change the environment variable in `.github/workflows/deploy.yml`:
   ```yaml
   env:
     VITE_BASE_PATH: '/portfolio/'
   ```
2. **Remove CNAME file**: Delete or rename `apps/robin-noguier/public/CNAME`

## How It Works

The Vite configuration uses the `VITE_BASE_PATH` environment variable to determine the base path for asset URLs:

- **Custom domain**: `VITE_BASE_PATH='/'` → Assets served from `yourdomain.com/assets/`
- **Repository-based**: `VITE_BASE_PATH='/portfolio/'` → Assets served from `username.github.io/portfolio/assets/`

## Testing Locally

You can test both configurations locally:

```bash
# Test custom domain build
VITE_BASE_PATH='/' pnpm build --filter=robin-noguier

# Test repository-based build  
VITE_BASE_PATH='/portfolio/' pnpm build --filter=robin-noguier
```