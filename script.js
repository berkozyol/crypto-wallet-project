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
    }

    refreshPrices(prices) {
        this.currentPrices = prices;
        this.updateUI();
    }

    updateUI() {
        const list = document.querySelector("#assets-list");
        list.innerHTML = this.assets.map((coin) => {
            const { id, name, symbol, balance } = coin;
            const priceData = this.currentPrices.find(p => p.symbol === `${symbol}USDT`);
            const currentPrice = priceData?.price ? parseFloat(priceData.price).toFixed(2) : "---";

            return `
                <div class="asset-card" onclick="window.showChart('${symbol}')">
                    <div>
                        <strong>${name}</strong> (${symbol})<br>
                        <small>$${currentPrice} | Bakiye: ${balance.toFixed(3)}</small>
                    </div>
                    <div class="controls">
                        <input type="number" id="input-${id}" value="0.1" step="0.1" onclick="event.stopPropagation()">
                        <button onclick="event.stopPropagation(); window.handleTrade(${id})">AL</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    trade(id) {
        const input = document.querySelector(`#input-${id}`);
        const amount = parseFloat(input.value);
        if (amount > 0) {
            this.assets[id].balance += amount;
            this.logs.push(`✔ ${new Date().toLocaleTimeString()}: ${amount} ${this.assets[id].symbol} eklendi.`);
            this.renderLogs();
            this.updateUI();
        }
    }

    renderLogs() {
        document.querySelector("#activity-log").innerHTML = this.logs.map(log => `<li>${log}</li>`).reverse().join('');
    }
}

const wallet = new CryptoWallet(initialData);
window.handleTrade = (id) => wallet.trade(id);

// TradingView Widget Fonksiyonu
window.showChart = (symbol) => {
    new TradingView.widget({
        "autosize": true,
        "symbol": `BINANCE:${symbol}USDT`,
        "interval": "60",
        "timezone": "Etc/UTC",
        "theme": "light",
        "style": "1",
        "locale": "tr",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "container_id": "tradingview_chart"
    });
};

// Başlangıç İşlemleri
async function init() {
    // Haberleri Çek
    const news = await fetchLiveNews();
    const tickerWrap = document.querySelector("#ticker-wrap");
    if(news.length > 0) {
        tickerWrap.innerHTML = news.map(n => `<div class="ticker-item">📢 ${n.title.split(' - ')[0]}</div>`).join('');
    }

    // İlk Fiyatları Çek ve Döngüyü Başlat
    const updatePrices = async () => {
        const prices = await getLivePrices();
        wallet.refreshPrices(prices);
        document.querySelector("#status-text").innerText = `CANLI • ${new Date().toLocaleTimeString()}`;
    };

    updatePrices();
    setInterval(updatePrices, 1000); // 1 saniyede bir fiyat güncelle
    window.showChart('BTC'); // Başlangıç grafiği
}

window.onload = init;