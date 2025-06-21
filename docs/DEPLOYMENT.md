# GitHub Pages Deployment Configuration

This document explains how to configure the portfolio for deployment to GitHub Pages with support for both subdirectory and custom domain scenarios.

## Overview

The deployment system supports two main scenarios:

1. **GitHub Pages Subdirectory**: Deploys to `https://username.github.io/repository-name/`
2. **Custom Domain**: Deploys to your custom domain (e.g., `https://yourdomain.com`)

## Configuration

### Environment Variables

The deployment behavior is controlled by environment variables:

#### `VITE_BASE_PATH`

- **For subdirectory deployment**: `/portfolio/`
- **For custom domain**: `/`
- **Default**: `/portfolio/`

#### `CUSTOM_DOMAIN` (GitHub repository variable)

- **For subdirectory deployment**: Leave empty
- **For custom domain**: Set to your domain name (e.g., `example.com`)

### GitHub Repository Configuration

1. **For subdirectory deployment** (default):

   - No additional configuration needed
   - The workflow will automatically use `/portfolio/` as the base path

2. **For custom domain deployment**:
   - Set the `CUSTOM_DOMAIN` repository variable in GitHub:
     - Go to your repository settings
     - Navigate to "Secrets and variables" → "Actions"
     - Add a new repository variable named `CUSTOM_DOMAIN`
     - Set the value to your domain name (e.g., `example.com`)

### Local Development

For local development, the environment is automatically configured to use root path (`/`) via `.env.local`.

## Deployment Process

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

1. **Detects deployment type** based on the `CUSTOM_DOMAIN` variable
2. **Sets appropriate base path**:
   - If `CUSTOM_DOMAIN` is set: uses `VITE_BASE_PATH=/`
   - If `CUSTOM_DOMAIN` is empty: uses `VITE_BASE_PATH=/portfolio/`
3. **Builds the application** with the correct configuration
4. **Creates CNAME file** when deploying to a custom domain
5. **Deploys to GitHub Pages**

## Troubleshooting

### Common Issues

1. **Assets not loading after custom domain setup**

   - Ensure the `CUSTOM_DOMAIN` repository variable is set correctly
   - Check that the CNAME file is being created in the deployment

2. **404 errors on custom domain**

   - Verify your domain's DNS is pointing to GitHub Pages
   - Check that the CNAME file contains the correct domain

3. **Subdirectory deployment broken**
   - Ensure `CUSTOM_DOMAIN` repository variable is empty or not set
   - Verify the base path is set to `/portfolio/`

### Manual Build Testing

You can test the build locally with different configurations:

```bash
# Test custom domain build
VITE_BASE_PATH=/ pnpm build --filter=robin-noguier

# Test subdirectory build
VITE_BASE_PATH=/portfolio/ pnpm build --filter=robin-noguier
```

## Migration Guide

### From Subdirectory to Custom Domain

1. Set up your custom domain in GitHub Pages settings
2. Add the `CUSTOM_DOMAIN` repository variable
3. The next deployment will automatically configure for custom domain

### From Custom Domain to Subdirectory

1. Remove the custom domain from GitHub Pages settings
2. Remove or clear the `CUSTOM_DOMAIN` repository variable
3. The next deployment will automatically configure for subdirectory

## Security Considerations

- Environment variables are handled securely through GitHub Actions
- No sensitive information is exposed in the build output
- CNAME files are only created when explicitly configured

## Support

If you encounter issues:

1. Check the GitHub Actions logs for deployment details
2. Verify your DNS configuration for custom domains
3. Ensure repository variables are set correctly
