#!/bin/bash

# Autonomous Liquidity Vault Tracker - Deployment Script
echo "🚀 Deploying Autonomous Liquidity Vault Tracker to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
vercel whoami || vercel login

# Deploy to production
echo "📦 Deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your site should be live at the URL shown above"
echo ""
echo "📋 Next steps:"
echo "  1. Update the domain in package.json and README.md"
echo "  2. Configure custom domain if needed"
echo "  3. Test the deployment thoroughly"
echo "  4. Share your live site!"

