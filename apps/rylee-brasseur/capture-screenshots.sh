#!/bin/bash

# Script to capture portfolio screenshots
echo "📸 Capturing portfolio screenshots..."

# Run only the chromium tests to speed things up
pnpm exec playwright test e2e/screenshots/capture-portfolio-states.spec.ts --project=chromium

echo "✅ Screenshot capture complete!"
echo "📁 Screenshots saved in: ./screenshots/"
echo ""
echo "Available screenshots:"
ls -1 screenshots/*.png 2>/dev/null | sort