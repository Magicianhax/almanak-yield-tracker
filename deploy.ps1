# Autonomous Liquidity Vault Tracker - Deployment Script for Windows
Write-Host "🚀 Deploying Autonomous Liquidity Vault Tracker to Vercel..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI version: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Check authentication
Write-Host "🔐 Checking Vercel authentication..." -ForegroundColor Blue
try {
    $user = vercel whoami
    Write-Host "✅ Logged in as: $user" -ForegroundColor Green
} catch {
    Write-Host "🔐 Please login to Vercel..." -ForegroundColor Yellow
    vercel login
}

# Deploy to production
Write-Host "📦 Deploying to production..." -ForegroundColor Blue
vercel --prod

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your site should be live at the URL shown above" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Update the domain in package.json and README.md"
Write-Host "  2. Configure custom domain if needed"
Write-Host "  3. Test the deployment thoroughly"
Write-Host "  4. Share your live site!"

