// 1. VERİ ÇEKME FONKSİYONLARI
async function getLivePrices() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT","BNBUSDT"]');
        if (!response.ok) throw new Error("API Hatası");
        return await response.json();
    } catch (error) {
        console.error("Fiyat hatası:", error);
        return [];
    }
}

async function fetchLiveNews() {
    try {
        const rssUrl = encodeURIComponent('https://news.google.com/rss/search?q=kripto+ekonomi&hl=tr&gl=TR&ceid=TR:tr');
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        const data = await response.json();
        return (data.status === 'ok' && data.items) ? data.items : [];
    } catch (error) {
        return [{ title: "Haberler şu an yüklenemiyor." }];
    }
}

// 2. CÜZDAN AYARLARI
let assets = [
    { id: 0, name: "Bitcoin", symbol: "BTC", balance: 0.25 },
    { id: 1, name: "Ethereum", symbol: "ETH", balance: 1.50 },
    { id: 2, name: "Binance Coin", symbol: "BNB", balance: 10.0 }
];

let currentPrices = [];

// 3. EKRANI GÜNCELLEME
function updateUI() {
    const list = document.getElementById("assets-list");
    if (!list) return;

    let total = 0;
    let html = "";

    assets.forEach(asset => {
        const priceData = currentPrices.find(p => p.symbol === asset.symbol + "USDT");
        const price = priceData ? parseFloat(priceData.price) : 0;
        total += asset.balance * price;

        html += `
        <div class="asset-card" onclick="window.showChart('${asset.symbol}')">
            <div>
                <strong>${asset.name}</strong> (${asset.symbol})
                <span class="info-icon" onclick="event.stopPropagation(); window.openDetails('${asset.symbol}')">ⓘ</span>
                <br><small class="price-tag">$${price.toLocaleString()}</small>
            </div>
            <div class="controls">
                <input type="number" id="qty-${asset.id}" value="0.1" step="0.01" onclick="event.stopPropagation()">
                <div class="btn-group">
                    <button class="btn-buy" onclick="event.stopPropagation(); window.handleTrade(${asset.id}, 'buy')">AL</button>
                    <button class="btn-sell" onclick="event.stopPropagation(); window.handleTrade(${asset.id}, 'sell')">SAT</button>
                </div>
            </div>
        </div>`;
    });

    list.innerHTML = html;

    let totalDiv = document.querySelector(".total-balance");
    if (!totalDiv) {
        document.querySelector("header").insertAdjacentHTML('afterend', '<div class="total-balance"></div>');
        totalDiv = document.querySelector(".total-balance");
    }
    totalDiv.innerHTML = `<h2>Toplam Portföy <span>$${total.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span></h2>`;
}

// 4. ETKİLEŞİM FONKSİYONLARI
window.handleTrade = (id, type) => {
    const qty = parseFloat(document.getElementById(`qty-${id}`).value);
    if (type === 'buy') assets[id].balance += qty;
    else if (assets[id].balance >= qty) assets[id].balance -= qty;

    const log = document.getElementById("activity-log");
    const li = document.createElement("li");
    li.innerText = `${new Date().toLocaleTimeString()}: ${assets[id].symbol} ${type === 'buy' ? 'ALINDI' : 'SATILDI'} (${qty})`;
    log.prepend(li);
    updateUI();
};

window.openDetails = (symbol) => {
    window.open(`details.html?coin=${symbol.toLowerCase()}`, '_blank');
};

window.showChart = (symbol) => {
    if (typeof TradingView !== 'undefined') {
        new TradingView.widget({
            "width": "100%", "height": 650, "symbol": `BINANCE:${symbol}USDT`,
            "interval": "D", "theme": "dark", "style": "1", "locale": "tr",
            "container_id": "tradingview_chart"
        });
    }
};

// 5. BAŞLATICI
async function init() {
    const news = await fetchLiveNews();
    const ticker = document.getElementById("ticker-wrap");
    if (ticker && news.length) {
        ticker.innerHTML = news.map(n => `<div class="ticker-item">📢 ${n.title}</div>`).join('');
    }

    const refresh = async () => {
        currentPrices = await getLivePrices();
        updateUI();
        const status = document.getElementById("status-text");
        if (status) status.innerText = `CANLI • ${new Date().toLocaleTimeString()}`;
    };

    refresh();
    setInterval(refresh, 5000); // 5 saniyede bir güncelle
    window.showChart('BTC');
}


const visitorForm = document.getElementById('visitor-form');
const visitorList = document.getElementById('display-visitors');

// Sayfa açıldığında eski ziyaretçileri yükle
window.addEventListener('load', showVisitors);

if (visitorForm) {
    visitorForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('visitor-name').value;
        const date = new Date().toLocaleString(); // Otomatik tarih ve saat

        const visitorData = { name, date };

        // Mevcut listeyi al veya boş liste oluştur
        let visitors = JSON.parse(localStorage.getItem('my_visitors')) || [];
        
        // Yeni ziyaretçiyi listeye ekle
        visitors.push(visitorData);
        
        // Hafızaya geri kaydet
        localStorage.setItem('my_visitors', JSON.stringify(visitors));

        document.getElementById('visitor-name').value = ''; // Kutuyu temizle
        showVisitors(); // Listeyi güncelle
    });
}

function showVisitors() {
    const visitors = JSON.parse(localStorage.getItem('my_visitors')) || [];
    visitorList.innerHTML = ''; // Önce temizle

    visitors.forEach(v => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${v.name}</strong> <span class="visit-date">${v.date}</span>`;
        visitorList.appendChild(li);
    });
}
// Listeyi Sıfırlama Butonu İşlemi
const clearBtn = document.getElementById('clear-visitors');

if (clearBtn) {
    clearBtn.addEventListener('click', function() {
        if (confirm("Tüm ziyaretçi listesini silmek istediğine emin misin?")) {
            // Hafızadaki ziyaretçi verisini tamamen siler
            localStorage.removeItem('wallet_visitors');
            
            // Ekrandaki listeyi anında temizlemek için fonksiyonu tekrar çağır
            loadVisitors();
            
            alert("Liste başarıyla sıfırlandı.");
        }
    });
}

window.onload = init;