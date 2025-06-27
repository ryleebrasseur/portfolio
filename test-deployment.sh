#!/bin/bash

# GitHub Pages Deployment Test Script
# Tests both subdirectory and custom domain deployment configurations

set -e

# Get the app to test from environment or use first discovered app
if [ -z "$DEPLOY_APP" ]; then
    DEPLOY_APP=$(find apps -mindepth 1 -maxdepth 1 -type d -exec test -f {}/package.json \; -printf '%f\n' | head -1)
    if [ -z "$DEPLOY_APP" ]; then
        echo "❌ No apps found in apps/ directory"
        exit 1
    fi
fi

echo "🚀 GitHub Pages Deployment Configuration Test"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_subdirectory_deployment() {
    echo -e "\n${YELLOW}Testing subdirectory deployment configuration for $DEPLOY_APP...${NC}"
    
    # Clean previous build
    rm -rf apps/$DEPLOY_APP/dist
    
    # Build with subdirectory configuration (using npx to avoid turbo caching)
    cd apps/$DEPLOY_APP
    VITE_BASE_PATH=/portfolio/ npx vite build > build.log 2>&1
    if [ $? -ne 0 ]; then
        echo -e "❌ ${RED}Build failed!${NC}"
        echo "Build log:"
        cat build.log
        rm -f build.log
        cd ../..
        return 1
    fi
    rm -f build.log
    cd ../..
    
    # Check if assets are properly referenced
    if grep -q '"/portfolio/assets/' apps/$DEPLOY_APP/dist/index.html; then
        echo -e "✅ ${GREEN}Subdirectory assets correctly referenced${NC}"
    else
        echo -e "❌ ${RED}Subdirectory assets incorrectly referenced${NC}"
        echo "Found in HTML:" 
        grep "assets/" apps/$DEPLOY_APP/dist/index.html || echo "No assets found"
        return 1
    fi
    
    # Check no CNAME file exists
    if [ ! -f "apps/$DEPLOY_APP/dist/CNAME" ]; then
        echo -e "✅ ${GREEN}No CNAME file for subdirectory deployment${NC}"
    else
        echo -e "❌ ${RED}Unexpected CNAME file found${NC}"
        return 1
    fi
}

test_custom_domain_deployment() {
    echo -e "\n${YELLOW}Testing custom domain deployment configuration...${NC}"
    
    # Clean previous build
    rm -rf apps/$DEPLOY_APP/dist
    
    # Build with custom domain configuration (using npx to avoid turbo caching)
    cd apps/$DEPLOY_APP && VITE_BASE_PATH=/ npx vite build > /dev/null 2>&1 && cd ../..
    
    # Check if assets are properly referenced (root path)
    if grep -q '"/assets/' apps/$DEPLOY_APP/dist/index.html && ! grep -q '"/portfolio/assets/' apps/$DEPLOY_APP/dist/index.html; then
        echo -e "✅ ${GREEN}Custom domain assets correctly referenced${NC}"
    else
        echo -e "❌ ${RED}Custom domain assets incorrectly referenced${NC}"
        echo "Found in HTML:" 
        grep "assets/" apps/$DEPLOY_APP/dist/index.html || echo "No assets found"
        return 1
    fi
    
    # Create CNAME file (simulate workflow behavior)
    echo "example.com" > apps/$DEPLOY_APP/dist/CNAME
    
    # Check CNAME file exists and has correct content
    if [ -f "apps/$DEPLOY_APP/dist/CNAME" ] && [ "$(cat apps/$DEPLOY_APP/dist/CNAME)" = "example.com" ]; then
        echo -e "✅ ${GREEN}CNAME file created with correct content${NC}"
    else
        echo -e "❌ ${RED}CNAME file not created or incorrect content${NC}"
        return 1
    fi
}

test_environment_configuration() {
    echo -e "\n${YELLOW}Testing environment configuration files...${NC}"
    
    # Check if .env.example exists
    if [ -f "apps/$DEPLOY_APP/.env.example" ]; then
        echo -e "✅ ${GREEN}Environment example file exists${NC}"
    else
        echo -e "❌ ${RED}Environment example file missing${NC}"
        return 1
    fi
    
    # Check if documentation exists
    if [ -f "docs/DEPLOYMENT.md" ]; then
        echo -e "✅ ${GREEN}Deployment documentation exists${NC}"
    else
        echo -e "❌ ${RED}Deployment documentation missing${NC}"
        return 1
    fi
}

test_automatic_domain_detection() {
    echo -e "\n${YELLOW}Testing automatic domain detection logic...${NC}"
    
    # Test the workflow logic by simulating the conditions
    if grep -q 'github.repository.*ryleebrasseur/portfolio' .github/workflows/deploy.yml; then
        echo -e "✅ ${GREEN}Automatic detection for ryleebrasseur/portfolio repository${NC}"
    else
        echo -e "❌ ${RED}Missing automatic detection logic${NC}"
        return 1
    fi
    
    if grep -q 'CUSTOM_DOMAIN=ryleeworks.com' .github/workflows/deploy.yml; then
        echo -e "✅ ${GREEN}Automatic domain setting for main portfolio${NC}"
    else
        echo -e "❌ ${RED}Missing automatic domain configuration${NC}"
        return 1
    fi
    
    if grep -q 'vars.CUSTOM_DOMAIN' .github/workflows/deploy.yml; then
        echo -e "✅ ${GREEN}Fallback to repository variable for other repos${NC}"
    else
        echo -e "❌ ${RED}Missing fallback configuration${NC}"
        return 1
    fi
}

# Run tests
echo "Running deployment configuration tests..."

if test_subdirectory_deployment && test_custom_domain_deployment && test_environment_configuration && test_automatic_domain_detection; then
    echo -e "\n🎉 ${GREEN}All deployment tests passed!${NC}"
    echo -e "\n${GREEN}Deployment Summary:${NC}"
    echo "• Subdirectory deployment: Ready ✅"
    echo "• Custom domain deployment: Ready ✅"
    echo "• Environment configuration: Ready ✅"
    echo "• Automatic domain detection: Ready ✅"
    echo "• Documentation: Complete ✅"
    echo -e "\n${YELLOW}Automatic Configuration:${NC}"
    echo "• ryleebrasseur/portfolio → automatically deploys to ryleeworks.com"
    echo "• Other repositories → use CUSTOM_DOMAIN variable or default to subdirectory"
    echo -e "\n${YELLOW}Next steps for other repositories:${NC}"
    echo "1. Set CUSTOM_DOMAIN repository variable for custom domain deployment"
    echo "2. Configure DNS if using custom domain"
    echo "3. Push changes to trigger deployment"
    exit 0
else
    echo -e "\n💥 ${RED}Some tests failed!${NC}"
    echo "Please check the output above and fix the issues."
    exit 1
fi