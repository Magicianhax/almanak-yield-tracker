// Vault Configurations
const VAULT_CONFIGS = {
    usd: {
        name: 'AUTONOMOUS LIQUIDITY USD',
        address: '0xDCD0f5ab30856F28385F641580Bbd85f88349124',
        decimals: 18,
        symbol: 'aiUSD',
        priceFile: 'price.json',
        backupFile: 'price_backup.json'
    },
    plus: {
        name: 'AUTONOMOUS LIQUIDITY PLUS',
        address: '0x5a97B0B97197299456Af841F8605543b13b12eE3',
        decimals: 18,
        symbol: 'alpUSD',
        priceFile: 'priceplus.json',
        backupFile: null
    }
};

// Alchemy Configuration
const ALCHEMY_CONFIG = {
    apiKey: '7NIHnR1z49i2EqWeDdaRFUT5TiUU1S5G',
    network: 'eth-mainnet',
    baseUrl: 'https://eth-mainnet.g.alchemy.com/v2/'
};

// Price data from the JSON files
let priceHistoryUSD = [];
let priceHistoryPLUS = [];

// Load price history data with retry mechanism
async function loadPriceHistory(retryCount = 0) {
    const maxRetries = 3;
    
    try {
        console.log(`Fetching price history... (attempt ${retryCount + 1})`);
        
        // Add cache busting parameter and try multiple sources
        const cacheBuster = `?t=${Date.now()}`;
        let response;
        
        try {
            response = await fetch(`price.json${cacheBuster}`);
            if (!response.ok) {
                throw new Error(`price.json failed with status: ${response.status}`);
            }
        } catch (error) {
            console.log('Trying backup file...', error.message);
            response = await fetch(`price_backup.json${cacheBuster}`);
            if (!response.ok) {
                throw new Error(`Both price files failed`);
            }
        }
        
        const text = await response.text();
        console.log('Response text length:', text.length);
        
        if (text.length === 0) {
            throw new Error('Empty response received');
        }
        
        console.log('First 100 characters:', text.substring(0, 100));
        console.log('Last 100 characters:', text.substring(text.length - 100));
        
        priceHistoryUSD = JSON.parse(text);
        console.log('USD price history loaded successfully:', priceHistoryUSD.length, 'entries');
        
        if (priceHistoryUSD.length === 0) {
            throw new Error('USD price history is empty');
        }
        
        // Clear any previous error messages
        hideError();
        
    } catch (error) {
        console.error(`Error loading price history (attempt ${retryCount + 1}):`, error);
        
        if (retryCount < maxRetries - 1) {
            console.log(`Retrying in 1 second... (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => loadPriceHistory(retryCount + 1), 1000);
            return;
        }
        
        showError(`Failed to load price history data after ${maxRetries} attempts: ${error.message}`);
        
        // Fallback: use a minimal price history
        console.log('Using fallback price data...');
        priceHistoryUSD = [
            {
                "timestamp": 1749539255,
                "date": "2025-06-10T07:07:35.000Z",
                "pricePerShare": 1,
                "type": "deposit"
            },
            {
                "timestamp": 1756989167,
                "date": "2025-09-04T12:32:47.000Z", 
                "pricePerShare": 1.0190940943977502,
                "type": "redeem"
            }
        ];
        console.log('Fallback USD price history loaded with', priceHistoryUSD.length, 'entries');
        hideError(); // Hide error since we have fallback data
    }
}

// Load PLUS vault price history data
async function loadPricePlusHistory(retryCount = 0) {
    const maxRetries = 3;
    
    try {
        console.log(`Fetching PLUS price history... (attempt ${retryCount + 1})`);
        
        const cacheBuster = `?t=${Date.now()}`;
        const response = await fetch(`priceplus.json${cacheBuster}`);
        
        if (!response.ok) {
            throw new Error(`priceplus.json failed with status: ${response.status}`);
        }
        
        const text = await response.text();
        
        if (text.length === 0) {
            throw new Error('Empty PLUS price response received');
        }
        
        priceHistoryPLUS = JSON.parse(text);
        console.log('PLUS price history loaded successfully:', priceHistoryPLUS.length, 'entries');
        
        if (priceHistoryPLUS.length === 0) {
            throw new Error('PLUS price history is empty');
        }
        
    } catch (error) {
        console.error(`Error loading PLUS price history (attempt ${retryCount + 1}):`, error);
        
        if (retryCount < maxRetries - 1) {
            console.log(`Retrying PLUS in 1 second... (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => loadPricePlusHistory(retryCount + 1), 1000);
            return;
        }
        
        console.log('Using fallback PLUS price data...');
        priceHistoryPLUS = [
            {
                "timestamp": 1755705155,
                "date": "2025-08-20T15:52:35.000Z",
                "pricePerShare": 1,
                "type": "deposit"
            },
            {
                "timestamp": 1757021171,
                "date": "2025-09-04T21:26:11.000Z",
                "pricePerShare": 1.0026472152184105,
                "type": "redeem"
            }
        ];
        console.log('Fallback PLUS price history loaded with', priceHistoryPLUS.length, 'entries');
    }
}

// Initialize the application
async function init() {
    await Promise.all([
        loadPriceHistory(),
        loadPricePlusHistory()
    ]);
}

// Get current price from the latest entry for each vault
function getCurrentPrice(vaultType = 'usd') {
    const priceHistory = vaultType === 'usd' ? priceHistoryUSD : priceHistoryPLUS;
    if (priceHistory.length === 0) return 1;
    return priceHistory[priceHistory.length - 1].pricePerShare;
}

// Get price at specific timestamp for a specific vault
function getPriceAtTimestamp(timestamp, vaultType = 'usd') {
    const priceHistory = vaultType === 'usd' ? priceHistoryUSD : priceHistoryPLUS;
    if (priceHistory.length === 0) return 1;
    
    // Find the closest price entry to the given timestamp
    let closest = priceHistory[0];
    let minDiff = Math.abs(timestamp - closest.timestamp);
    
    for (let i = 1; i < priceHistory.length; i++) {
        const diff = Math.abs(timestamp - priceHistory[i].timestamp);
        if (diff < minDiff) {
            minDiff = diff;
            closest = priceHistory[i];
        }
    }
    
    return closest.pricePerShare;
}

// Fetch token balances for both vaults using Alchemy API
async function fetchTokenBalances(walletAddress) {
    try {
        const url = `${ALCHEMY_CONFIG.baseUrl}${ALCHEMY_CONFIG.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'alchemy_getTokenBalances',
                params: [walletAddress, [VAULT_CONFIGS.usd.address, VAULT_CONFIGS.plus.address]],
                id: 1
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        const tokenBalances = data.result.tokenBalances;
        const balances = {
            usd: 0,
            plus: 0
        };
        
        // Parse balances for both tokens
        tokenBalances.forEach((token, index) => {
            if (token.tokenBalance) {
                const balance = parseInt(token.tokenBalance, 16) / Math.pow(10, 18);
                if (index === 0) balances.usd = balance;
                if (index === 1) balances.plus = balance;
            }
        });
        
        return balances;
    } catch (error) {
        console.error('Error fetching token balances:', error);
        throw error;
    }
}

// Legacy function for backward compatibility
async function fetchTokenBalance(walletAddress) {
    const balances = await fetchTokenBalances(walletAddress);
    return balances.usd;
}

// Fetch transaction history for the token
async function fetchTransactionHistory(walletAddress) {
    try {
        const url = `${ALCHEMY_CONFIG.baseUrl}${ALCHEMY_CONFIG.apiKey}`;
        
        console.log('Fetching transaction history for address:', walletAddress);
        
        // Get incoming transfers (deposits)
        const incomingResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'alchemy_getAssetTransfers',
                params: [{
                    toAddress: walletAddress,
                    contractAddresses: [VAULT_CONFIGS.usd.address, VAULT_CONFIGS.plus.address],
                    category: ['erc20'],
                    withMetadata: true,
                    excludeZeroValue: true,
                    maxCount: '0x3e8' // 1000 in hex
                }],
                id: 1
            })
        });

        const incomingData = await incomingResponse.json();
        console.log('Incoming transfers response:', incomingData);
        
        if (incomingData.error) {
            throw new Error('Incoming transfers: ' + incomingData.error.message);
        }

        // Get outgoing transfers (withdrawals)
        const outgoingResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'alchemy_getAssetTransfers',
                params: [{
                    fromAddress: walletAddress,
                    contractAddresses: [VAULT_CONFIGS.usd.address, VAULT_CONFIGS.plus.address],
                    category: ['erc20'],
                    withMetadata: true,
                    excludeZeroValue: true,
                    maxCount: '0x3e8' // 1000 in hex
                }],
                id: 2
            })
        });

        const outgoingData = await outgoingResponse.json();
        console.log('Outgoing transfers response:', outgoingData);
        
        if (outgoingData.error) {
            throw new Error('Outgoing transfers: ' + outgoingData.error.message);
        }

        // Combine and sort all transfers by timestamp
        const allTransfers = [
            ...(incomingData.result?.transfers || []).map(tx => ({...tx, direction: 'incoming'})),
            ...(outgoingData.result?.transfers || []).map(tx => ({...tx, direction: 'outgoing'}))
        ];

        // Sort by timestamp
        allTransfers.sort((a, b) => {
            const timeA = new Date(a.metadata?.blockTimestamp || 0).getTime();
            const timeB = new Date(b.metadata?.blockTimestamp || 0).getTime();
            return timeA - timeB;
        });

        console.log('All transfers found:', allTransfers.length);
        return allTransfers;

    } catch (error) {
        console.error('Error fetching transaction history:', error);
        return [];
    }
}

// Calculate APY based on deposit and current/redeem price
function calculateAPY(depositPrice, currentPrice, daysHeld) {
    if (daysHeld <= 0) return 0;
    
    const priceRatio = currentPrice / depositPrice;
    const dailyReturn = Math.pow(priceRatio, 1 / daysHeld) - 1;
    const annualReturn = Math.pow(1 + dailyReturn, 365) - 1;
    
    return annualReturn * 100;
}

// Calculate yield for a specific position
function calculateYieldForPosition(amount, depositPrice, currentPrice) {
    const initialValue = amount * depositPrice;
    const currentValue = amount * currentPrice;
    return currentValue - initialValue;
}

// Identify which vault a transaction belongs to
function getVaultTypeFromAddress(address) {
    if (address.toLowerCase() === VAULT_CONFIGS.usd.address.toLowerCase()) {
        return 'usd';
    } else if (address.toLowerCase() === VAULT_CONFIGS.plus.address.toLowerCase()) {
        return 'plus';
    }
    return 'usd'; // Default fallback
}

// Process transaction history and calculate yields for both vaults
function processTransactionHistory(transactions, currentBalances) {
    console.log('Processing', transactions.length, 'transactions for yield calculation');
    
    // Separate transactions by vault
    const usdTransactions = [];
    const plusTransactions = [];
    
    for (const tx of transactions) {
        const vaultType = getVaultTypeFromAddress(tx.rawContract?.address || VAULT_CONFIGS.usd.address);
        if (vaultType === 'usd') {
            usdTransactions.push(tx);
        } else {
            plusTransactions.push(tx);
        }
    }
    
    console.log(`USD Vault: ${usdTransactions.length} transactions, PLUS Vault: ${plusTransactions.length} transactions`);
    
    // Process each vault separately
    const usdResults = processVaultTransactions(usdTransactions, currentBalances.usd, 'usd');
    const plusResults = processVaultTransactions(plusTransactions, currentBalances.plus, 'plus');
    
    return {
        usd: usdResults,
        plus: plusResults,
        combined: {
            totalYield: usdResults.totalYield + plusResults.totalYield,
            overallAPY: ((usdResults.totalYield + plusResults.totalYield) / 
                        (usdResults.totalInvested + plusResults.totalInvested)) * 100 || 0,
            positions: [...usdResults.positions, ...plusResults.positions]
        }
    };
}

// Process transactions for a specific vault
function processVaultTransactions(transactions, currentBalance, vaultType) {
    
    const positions = [];
    let totalDeposited = 0;
    let totalWithdrawn = 0;
    let weightedDepositPrice = 0;
    let totalYield = 0;
    
    const currentPrice = getCurrentPrice(vaultType);
    const currentTime = Date.now() / 1000;
    
    for (const tx of transactions) {
        if (!tx.metadata || !tx.metadata.blockTimestamp) {
            console.log('Skipping transaction without timestamp:', tx);
            continue;
        }
        
        const timestamp = new Date(tx.metadata.blockTimestamp).getTime() / 1000;
        const amount = parseFloat(tx.value || 0);
        const priceAtTime = getPriceAtTimestamp(timestamp, vaultType);
        
        console.log('Processing transaction:', {
            direction: tx.direction,
            amount,
            priceAtTime,
            timestamp: new Date(timestamp * 1000).toISOString()
        });
        
        if (tx.direction === 'incoming') {
            // This is a deposit (receiving tokens)
            positions.push({
                type: 'deposit',
                amount: amount,
                price: priceAtTime,
                timestamp: timestamp,
                date: new Date(timestamp * 1000).toLocaleDateString(),
                daysHeld: (currentTime - timestamp) / (24 * 60 * 60),
                vaultType: vaultType
            });
            
            totalDeposited += amount;
            weightedDepositPrice += amount * priceAtTime;
            
        } else if (tx.direction === 'outgoing') {
            // This is a withdrawal (sending tokens)
            positions.push({
                type: 'withdrawal',
                amount: amount,
                price: priceAtTime,
                timestamp: timestamp,
                date: new Date(timestamp * 1000).toLocaleDateString(),
                daysHeld: (currentTime - timestamp) / (24 * 60 * 60),
                vaultType: vaultType
            });
            
            totalWithdrawn += amount;
            
            // Calculate yield for withdrawn amount (if we have deposit history)
            if (totalDeposited > 0) {
                const avgDepositPrice = weightedDepositPrice / totalDeposited;
                const withdrawYield = calculateYieldForPosition(amount, avgDepositPrice, priceAtTime);
                totalYield += withdrawYield;
            }
        }
    }
    
    console.log('Transaction processing summary:', {
        totalDeposited,
        totalWithdrawn,
        currentBalance,
        positions: positions.length
    });
    
    // Calculate yield for remaining balance
    if (currentBalance > 0 && totalDeposited > 0) {
        const avgDepositPrice = weightedDepositPrice / totalDeposited;
        const remainingYield = calculateYieldForPosition(currentBalance, avgDepositPrice, currentPrice);
        totalYield += remainingYield;
        console.log('Remaining balance yield:', remainingYield);
    }
    
    // If no transaction history but user has a balance, calculate based on earliest price
    if (positions.length === 0 && currentBalance > 0) {
        console.log(`No ${vaultType.toUpperCase()} transaction history found, using fallback calculation`);
        const vaultPriceHistory = vaultType === 'usd' ? priceHistoryUSD : priceHistoryPLUS;
        const earliestPrice = vaultPriceHistory.length > 0 ? vaultPriceHistory[0].pricePerShare : 1;
        const fallbackYield = calculateYieldForPosition(currentBalance, earliestPrice, currentPrice);
        totalYield = fallbackYield;
        
        // Calculate APY from earliest date to now
        const earliestTime = vaultPriceHistory.length > 0 ? vaultPriceHistory[0].timestamp : currentTime;
        const daysHeld = (currentTime - earliestTime) / (24 * 60 * 60);
        const fallbackAPY = calculateAPY(earliestPrice, currentPrice, daysHeld);
        
        return {
            positions: [{
                type: 'estimated',
                amount: currentBalance,
                price: earliestPrice,
                timestamp: earliestTime,
                date: new Date(earliestTime * 1000).toLocaleDateString(),
                daysHeld: daysHeld,
                vaultType: vaultType
            }],
            totalYield: fallbackYield,
            overallAPY: fallbackAPY,
            avgDepositPrice: earliestPrice,
            totalInvested: currentBalance * earliestPrice
        };
    }
    
    // Calculate overall APY
    let overallAPY = 0;
    if (positions.length > 0 && totalDeposited > 0) {
        const avgDepositPrice = weightedDepositPrice / totalDeposited;
        const avgDaysHeld = positions.reduce((sum, pos) => sum + pos.daysHeld, 0) / positions.length;
        overallAPY = calculateAPY(avgDepositPrice, currentPrice, avgDaysHeld);
    }
    
    console.log('Final yield calculation:', {
        totalYield,
        overallAPY,
        avgDepositPrice: totalDeposited > 0 ? weightedDepositPrice / totalDeposited : 0
    });
    
    return {
        positions,
        totalYield,
        overallAPY,
        avgDepositPrice: totalDeposited > 0 ? weightedDepositPrice / totalDeposited : 0,
        totalInvested: totalDeposited * (totalDeposited > 0 ? weightedDepositPrice / totalDeposited : 0)
    };
}

// Format numbers for display
function formatNumber(num, decimals = 4) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Format currency
function formatCurrency(num, decimals = 2) {
    if (typeof num !== 'number' || isNaN(num)) return '$0.00';
    return '$' + formatNumber(num, decimals);
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error');
    
    // Create error content with retry option for price history errors
    if (message.includes('price history')) {
        errorDiv.innerHTML = `
            ${message}
            <br><br>
            <button class="btn" onclick="retryLoadPriceHistory()" style="margin-right: 10px;">Retry Loading Price History</button>
            <button class="btn" onclick="location.reload()">Reload Page</button>
        `;
    } else {
        errorDiv.innerHTML = `
            ${message}
            <br><br>
            <button class="btn" onclick="location.reload()">Reload Page</button>
        `;
    }
    
    errorDiv.style.display = 'block';
}

// Hide error message
function hideError() {
    const errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';
}

// Show loading state
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    hideError();
}

// Hide loading state
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Validate Ethereum address
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Update results display
function updateResults(analysis) {
    // Update USD Vault information
    const usdCurrentPrice = getCurrentPrice('usd');
    const usdData = analysis.usd;
    
    document.getElementById('usdBalance').textContent = formatNumber(usdData.positions.reduce((sum, p) => p.type !== 'withdrawal' ? sum + p.amount : sum, 0), 6) + ' aiUSD';
    document.getElementById('usdPrice').textContent = formatCurrency(usdCurrentPrice, 6);
    document.getElementById('usdYield').textContent = formatCurrency(usdData.totalYield, 4);
    
    // Update PLUS Vault information
    const plusCurrentPrice = getCurrentPrice('plus');
    const plusData = analysis.plus;
    
    document.getElementById('plusBalance').textContent = formatNumber(plusData.positions.reduce((sum, p) => p.type !== 'withdrawal' ? sum + p.amount : sum, 0), 6) + ' alpUSD';
    document.getElementById('plusPrice').textContent = formatCurrency(plusCurrentPrice, 6);
    document.getElementById('plusYield').textContent = formatCurrency(plusData.totalYield, 4);
    
    // Update Combined Totals
    const combinedData = analysis.combined;
    const totalUSDValue = (usdData.positions.reduce((sum, p) => p.type !== 'withdrawal' ? sum + p.amount : sum, 0) * usdCurrentPrice) + 
                          (plusData.positions.reduce((sum, p) => p.type !== 'withdrawal' ? sum + p.amount : sum, 0) * plusCurrentPrice);
    
    document.getElementById('combinedBalance').textContent = formatCurrency(totalUSDValue, 2);
    document.getElementById('combinedYield').textContent = formatCurrency(combinedData.totalYield, 4);
    
    // Show transaction history if available
    const allPositions = combinedData.positions;
    if (allPositions.length > 0) {
        const tableBody = document.getElementById('transactionTableBody');
        tableBody.innerHTML = '';
        
        // Sort positions by timestamp
        allPositions.sort((a, b) => a.timestamp - b.timestamp);
        
        allPositions.forEach(position => {
            const row = tableBody.insertRow();
            
            // Determine vault type based on position data
            const vaultType = position.vaultType || 'usd';
            const vaultName = vaultType === 'plus' ? 'PLUS' : 'USD';
            const tokenSymbol = vaultType === 'plus' ? 'alpUSD' : 'aiUSD';
            
            const currentPrice = getCurrentPrice(vaultType.toLowerCase());
            let yield = 0;
            
            if (position.type === 'deposit' || position.type === 'estimated') {
                yield = calculateYieldForPosition(position.amount, position.price, currentPrice);
            } else if (position.type === 'withdrawal') {
                // For withdrawals, show the yield that was realized at withdrawal time
                yield = calculateYieldForPosition(position.amount, position.price, position.price);
            }
            
            const typeColor = position.type === 'deposit' || position.type === 'estimated' ? '#008800' : 
                             position.type === 'withdrawal' ? '#cc0000' : '#996600';
            
            const vaultColor = vaultType === 'plus' ? '#0066cc' : '#006600';
            
            row.innerHTML = `
                <td>${position.date}</td>
                <td><span style="color: ${vaultColor}; font-weight: bold;">${vaultName}</span></td>
                <td><span style="color: ${typeColor};">${position.type}</span></td>
                <td>${formatNumber(position.amount, 4)} ${tokenSymbol}</td>
                <td>${formatCurrency(position.price, 6)}</td>
                <td>${formatCurrency(yield, 4)}</td>
                <td>${formatNumber(position.daysHeld, 1)}</td>
            `;
        });
        
        document.getElementById('transactionHistory').style.display = 'block';
    }
    
    document.getElementById('results').style.display = 'block';
}

// Main function to track balance and calculate yield
async function trackBalance() {
    const walletAddress = document.getElementById('walletAddress').value.trim();
    
    if (!walletAddress) {
        showError('Please enter a wallet address');
        return;
    }
    
    if (!isValidEthereumAddress(walletAddress)) {
        showError('Please enter a valid Ethereum address');
        return;
    }
    
    showLoading();
    
    try {
        // Fetch current balances for both vaults
        const balances = await fetchTokenBalances(walletAddress);
        
        // Fetch transaction history for both vaults
        const transactions = await fetchTransactionHistory(walletAddress);
        
        // Process transactions and calculate yields for both vaults
        const analysis = processTransactionHistory(transactions, balances);
        
        // Update UI with both vault data
        updateResults(analysis);
        
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError('Error: ' + error.message);
        console.error('Error tracking balance:', error);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    init();
    
    // Allow Enter key to trigger tracking
    document.getElementById('walletAddress').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            trackBalance();
        }
    });
});

// Manual retry function for price history
async function retryLoadPriceHistory() {
    priceHistory = []; // Clear existing data
    await loadPriceHistory();
}

// Make functions globally available
window.trackBalance = trackBalance;
window.retryLoadPriceHistory = retryLoadPriceHistory;
