const cryptoData = `[
    { "name": "Bitcoin", "symbol": "BTC", "balance": 0.25 },
    { "name": "Ethereum", "symbol": "ETH", "balance": 1.50 },
    { "name": "BNB", "symbol": "BNB", "balance": 10.0 }
]`;

class CryptoWallet {
    constructor(jsonString) {
        this.assets = JSON.parse(jsonString);
        this.logs = [];
    }

    assert(condition, message) {
        if (!condition) throw new Error(`Assertion Failed: ${message}`);
    }

    trade(index, action) {
        try {
            const { assets } = this;
            const asset = assets[index];
            const amountInput = document.getElementById(`amount-${index}`);
            const amount = parseFloat(amountInput.value);

            this.assert(!isNaN(amount) && amount > 0, "Please enter a valid amount!");
            this.assert(asset !== undefined, "Asset not found!");
            
            if (action === 'SELL') {
                this.assert(asset.balance >= amount, `Insufficient balance!`);
                asset.balance -= amount;
                this.logs.push(`✘ Sold: ${amount} ${asset.symbol}`);
            } else {
                asset.balance += amount;
                this.logs.push(`✔ Bought: ${amount} ${asset.symbol}`);
            }
            this.updateUI();
        } catch (error) {
            alert(error.message);
        }
    }

    updateUI() {
        const list = document.getElementById("assets-list");
        list.innerHTML = this.assets.map((coin, i) => {
            const { name, symbol, balance } = coin;
            return `
                <div class="asset-card">
                    <span><strong>${name}</strong> (${symbol}): ${balance.toFixed(3)}</span>
                    <div class="controls">
                        <input type="number" id="amount-${i}" value="0.1" step="0.1">
                        <button class="btn-buy" onclick="wallet.trade(${i}, 'BUY')">BUY</button>
                        <button class="btn-sell" onclick="wallet.trade(${i}, 'SELL')">SELL</button>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById("activity-log").innerHTML = this.logs
            .map(msg => `<li>${msg}</li>`).reverse().join('');
    }
}

const wallet = new CryptoWallet(cryptoData);
wallet.updateUI();