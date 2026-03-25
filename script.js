import { getLivePrices, fetchLiveNews } from './api.js';

const initialData = `[
    { "id": 0, "name": "Bitcoin", "symbol": "BTC", "balance": 0.25 },
    { "id": 1, "name": "Ethereum", "symbol": "ETH", "balance": 1.50 },
    { "id": 2, "name": "BNB", "symbol": "BNB", "balance": 10.0 }
]`;

class CryptoWallet {
    constructor(jsonData) {
        this.assets = JSON.parse(jsonData);
        this.logs = [];
        this.currentPrices = [];
        this.prevPrices = {};
    }

    refreshPrices(prices) {
        this.currentPrices.forEach(p => this.prevPrices[p.symbol] = p.price);
        this.currentPrices = prices;
        this.updateUI();
    }

    calculateTotal() {
        const total = this.assets.reduce((sum, asset) => {
            const priceData = this.currentPrices.find(p => p.symbol === `${asset.symbol}USDT`);
            const price = priceData ? parseFloat(priceData.price) : 0;
            return sum + (asset.balance * price);
        }, 0);
        return total.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    }

    updateUI() {
        const list = document.querySelector("#assets-list");
        
        if (!document.querySelector(".total-balance")) {
            document.querySelector("header").insertAdjacentHTML('afterend', '<div class="total-balance"></div>');
        }
        document.querySelector(".total-balance").innerHTML = `<h2>Toplam Portföy Değeri <span>$${this.calculateTotal()}</span></h2>`;

        list.innerHTML = this.assets.map((coin) => {
            const { id, name, symbol, balance } = coin;
            const pair = `${symbol}USDT`;
            const priceData = this.currentPrices.find(p => p.symbol === pair);
            const currentPrice = priceData ? parseFloat(priceData.price).toFixed(2) : "0.00";
            
            let colorClass = "";
            if (this.prevPrices[pair]) {
                if (parseFloat(currentPrice) > parseFloat(this.prevPrices[pair])) colorClass = "price-up";
                else if (parseFloat(currentPrice) < parseFloat(this.prevPrices[pair])) colorClass = "price-down";
            }

            return `
                <div class="asset-card ${colorClass}" onclick="window.showChart('${symbol}')">
                    <div>
                        <strong>${name}</strong> (${symbol})<br>
                        <small>
                            <span class="price-tag">$${currentPrice}</span> | 
                            <span class="balance-tag">Bakiye: ${balance.toFixed(4)}</span>
                        </small>
                    </div>
                    <div class="controls">
                        <input type="number" id="input-${id}" value="0.1" step="0.01" onclick="event.stopPropagation()">
                        <div class="btn-group">
                            <button class="btn-buy" onclick="event.stopPropagation(); window.handleTrade(${id}, 'buy')">AL</button>
                            <button class="btn-sell" onclick="event.stopPropagation(); window.handleTrade(${id}, 'sell')">SAT</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Trade Fonksiyonu (Hem AL hem SAT)
    trade(id, type) {
        const input = document.querySelector(`#input-${id}`);
        const amount = parseFloat(input.value);
        const asset = this.assets[id];

        if (isNaN(amount) || amount <= 0) return;

        if (type === 'buy') {
            asset.balance += amount;
            this.logs.push(`🟢 ${new Date().toLocaleTimeString()}: ${amount} ${asset.symbol} alındı.`);
        } else if (type === 'sell') {
            if (asset.balance >= amount) {
                asset.balance -= amount;
                this.logs.push(`🔴 ${new Date().toLocaleTimeString()}: ${amount} ${asset.symbol} satıldı.`);
            } else {
                alert("Yetersiz bakiye!");
                return;
            }
        }
        this.renderLogs();
        this.updateUI();
    }

    renderLogs() {
        document.querySelector("#activity-log").innerHTML = this.logs.map(log => `<li>${log}</li>`).reverse().join('');
    }
}

const wallet = new CryptoWallet(initialData);
window.handleTrade = (id, type) => wallet.trade(id, type);

window.showChart = (symbol) => {
    new TradingView.widget({
        "width": "100%",
        "height": 600,
        "symbol": `BINANCE:${symbol}USDT`,
        "interval": "D",
        "theme": "light",
        "style": "1",
        "locale": "tr",
        "container_id": "tradingview_chart",
        "autosize": false
    });
};

async function init() {
    const news = await fetchLiveNews();
    if(news.length > 0) {
        document.querySelector("#ticker-wrap").innerHTML = news.map(n => `<div class="ticker-item">📢 ${n.title.split(' - ')[0]}</div>`).join('');
    }
    const updatePrices = async () => {
        const prices = await getLivePrices();
        wallet.refreshPrices(prices);
        document.querySelector("#status-text").innerText = `PİYASA CANLI • ${new Date().toLocaleTimeString()}`;
    };
    updatePrices();
    setInterval(updatePrices, 1500);
    window.showChart('BTC');
}

window.onload = init;