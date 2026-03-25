export async function getLivePrices() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT","BNBUSDT"]');
        if (!response.ok) throw new Error("API Hatası");
        return await response.json();
    } catch (error) {
        console.error("Fiyat çekme hatası:", error);
        return [];
    }
}

export async function fetchLiveNews() {
    try {
        const rssUrl = encodeURIComponent('https://news.google.com/rss/search?q=kripto+ekonomi&hl=tr&gl=TR&ceid=TR:tr');
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        const data = await response.json();
        
        if (data.status !== 'ok' || !data.items) {
            return [{ title: "Canlı haber akışı şu an güncelleniyor..." }];
        }
        return data.items;
    } catch (error) {
        console.error("Haber Hatası:", error);
        return [{ title: "Haber servisine şu an ulaşılamıyor." }];
    }
}