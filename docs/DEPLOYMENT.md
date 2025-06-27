# GitHub Pages Deployment Configuration

This document explains how to configure the portfolio for deployment to GitHub Pages with automated domain detection and support for both subdirectory and custom domain scenarios.

## Overview

The deployment system supports automatic configuration based on the repository:

1. **Main Portfolio (`ryleebrasseur/portfolio`)**: Automatically deploys to `https://ryleeworks.com`
2. **Other Repositories**: Deploy to subdirectory by default (`https://username.github.io/repository-name/`)
3. **Custom Domain Override**: Can be configured for other repositories via repository variables

## Automatic Domain Detection

### Main Portfolio Repository

For the `ryleebrasseur/portfolio` repository, the deployment workflow automatically:

- Sets `CUSTOM_DOMAIN=ryleeworks.com`
- Uses `VITE_BASE_PATH=/` for root path deployment
- Creates CNAME file for custom domain
- No manual configuration required

### Other Repositories

For other repositories using this workflow:

- Defaults to subdirectory deployment
- Uses `VITE_BASE_PATH=/portfolio/`
- Can be overridden with `CUSTOM_DOMAIN` repository variable

## Configuration

### Environment Variables

The deployment behavior is controlled by environment variables:

#### `VITE_BASE_PATH`

- **For subdirectory deployment**: `/portfolio/`
- **For custom domain**: `/`
- **Default**: `/portfolio/`

#### `CUSTOM_DOMAIN` (GitHub repository variable)

**Note**: This is only needed for repositories other than `ryleebrasseur/portfolio`, which automatically uses `ryleeworks.com`.

- **For subdirectory deployment**: Leave empty or not set
- **For custom domain**: Set to your domain name (e.g., `example.com`)

### GitHub Repository Configuration

#### Main Portfolio (`ryleebrasseur/portfolio`)

No configuration needed! The workflow automatically:

- Detects the repository name
- Sets `CUSTOM_DOMAIN=ryleeworks.com`
- Configures for custom domain deployment

#### Other Repositories

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

1. **Detects repository and sets domain**:
   - For `ryleebrasseur/portfolio`: automatically sets `CUSTOM_DOMAIN=ryleeworks.com`
   - For other repositories: uses `vars.CUSTOM_DOMAIN` or defaults to subdirectory
2. **Sets appropriate base path**:
   - If custom domain is detected/configured: uses `VITE_BASE_PATH=/`
   - If no custom domain: uses `VITE_BASE_PATH=/portfolio/`
3. **Builds the application** with the correct configuration
4. **Creates CNAME file** when deploying to a custom domain
5. **Deploys to GitHub Pages**

## Troubleshooting

### Common Issues

1. **Assets not loading after custom domain setup**

   - For main portfolio: This should work automatically with `ryleeworks.com`
   - For other repositories: Ensure the `CUSTOM_DOMAIN` repository variable is set correctly
   - Check that the CNAME file is being created in the deployment

2. **404 errors on custom domain**

   - Verify your domain's DNS is pointing to GitHub Pages
   - Check that the CNAME file contains the correct domain

3. **Subdirectory deployment broken for other repositories**

   - Ensure `CUSTOM_DOMAIN` repository variable is empty or not set
   - Verify the base path is set to `/portfolio/`

4. **Main portfolio not deploying to ryleeworks.com**
   - Check that the repository name is exactly `ryleebrasseur/portfolio`
   - Verify the workflow logs show "Auto-detected repository: ryleebrasseur/portfolio"

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
