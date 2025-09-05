# Autonomous Liquidity Vault Tracker

A web application to track your balance and calculate yield earnings across both AUTONOMOUS LIQUIDITY USD and PLUS vaults on the Ethereum blockchain.

## 🚀 Features

- **Dual Vault Support**: Track both USD and PLUS vaults simultaneously
- **Real-time Balance Tracking**: Get current balances from Ethereum blockchain
- **Yield Calculation**: Calculate earnings based on historical price data
- **Transaction History**: View detailed transaction history with yield calculations
- **Combined Portfolio View**: See total performance across both vaults
- **Responsive Design**: Works on desktop and mobile devices
- **Token Support**: aiUSD and alpUSD vault tokens

## 📊 Supported Vaults

- **AUTONOMOUS LIQUIDITY USD Vault (aiUSD)**: `0xDCD0f5ab30856F28385F641580Bbd85f88349124`
- **AUTONOMOUS LIQUIDITY PLUS Vault (alpUSD)**: `0x5a97B0B97197299456Af841F8605543b13b12eE3`

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Blockchain API**: Alchemy API for Ethereum data
- **Price Data**: Historical price feeds from JSON files
- **Deployment**: Vercel static hosting

## 📁 Project Structure

```
├── index.html          # Main application page
├── app.js             # Core application logic
├── price.json         # USD vault historical prices
├── priceplus.json     # PLUS vault historical prices
├── vercel.json        # Vercel deployment configuration
├── package.json       # Project metadata
├── .vercelignore      # Files to exclude from deployment
└── README.md          # This file
```

## 🚀 Deployment to Vercel

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket

### Method 1: GitHub Integration (Recommended)

1. **Connect Repository**:
   ```bash
   # Push your code to GitHub
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/autonomous-liquidity-vault-tracker.git
   git push -u origin main
   ```

2. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it as a static site
   - Click "Deploy"

### Method 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   # Login to Vercel
   vercel login
   
   # Deploy to production
   vercel --prod
   ```

### Method 3: Drag & Drop

1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag and drop your project folder
3. Vercel will automatically deploy

## ⚙️ Configuration

### Environment Variables

No environment variables are required for basic deployment. The Alchemy API key is included in the frontend code for this demo application.

> **Note**: For production use, consider moving sensitive API keys to environment variables and using a backend proxy.

### Custom Domain

1. Go to your project dashboard on Vercel
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Configure DNS records as instructed

## 🧪 Local Development

```bash
# Start local development server
python -m http.server 8000

# Or using Node.js
npx serve .

# Or using PHP
php -S localhost:8000
```

Visit `http://localhost:8000` to view the application.

## 📱 Usage

1. **Enter Wallet Address**: Input any Ethereum wallet address
2. **View Vault Data**: See balances and yields for both vaults
3. **Check Transaction History**: Review detailed transaction history
4. **Monitor Portfolio**: Track combined performance across vaults

## 🔧 Customization

### Adding New Vaults

1. Update `VAULT_CONFIGS` in `app.js`
2. Add corresponding price history JSON file
3. Update UI sections in `index.html`
4. Modify `updateResults()` function

### Styling

- Modify CSS in `index.html` `<style>` section
- Currently uses white high-contrast theme
- Responsive design with mobile breakpoints

## 📊 API Integration

### Alchemy API

The application uses Alchemy's enhanced APIs:
- `alchemy_getTokenBalances`: Fetch token balances
- `alchemy_getAssetTransfers`: Get transaction history

### Rate Limiting

- Built-in retry logic with exponential backoff
- Handles API rate limits gracefully
- Falls back to cached/backup data when needed

## 🐛 Troubleshooting

### Common Issues

1. **Price Data Loading Errors**:
   - Check if JSON files are accessible
   - Verify file format and structure
   - Look for CORS issues in browser console

2. **API Errors**:
   - Verify Alchemy API key is valid
   - Check network connectivity
   - Monitor API rate limits

3. **Deployment Issues**:
   - Ensure all files are committed to Git
   - Check `.vercelignore` for excluded files
   - Verify `vercel.json` configuration

### Debug Mode

Open browser developer tools to see detailed console logs for:
- API requests and responses
- Price data loading
- Transaction processing
- Error details

## 📄 License

MIT License - feel free to use and modify for your projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the browser console for error messages
- Verify wallet address format
- Ensure stable internet connection
- Contact the development team

---

**Built with ❤️ for the DeFi community**