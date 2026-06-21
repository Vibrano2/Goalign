(function() {
    // --- Data & State ---
    const coins = [
            { id: 'btc', name: 'Bitcoin', symbol: 'BTC', price: 73588.00, change24: 2.4, change7: 12.1, cap: '1.4T', color: '#F7931A' },
            { id: 'eth', name: 'Ethereum', symbol: 'ETH', price: 2265.60, change24: 1.9, change7: 5.4, cap: '272B', color: '#627EEA' },
            { id: 'sol', name: 'Solana', symbol: 'SOL', price: 93.45, change24: 8.5, change7: 22.4, cap: '41B', color: '#14F195' },
            { id: 'xrp', name: 'XRP', symbol: 'XRP', price: 1.48, change24: 0.5, change7: -2.1, cap: '81B', color: '#23292F' },
            { id: 'ada', name: 'Cardano', symbol: 'ADA', price: 0.2654, change24: -2.3, change7: -8.4, cap: '9B', color: '#0033AD' },
            { id: 'avax', name: 'Avalanche', symbol: 'AVAX', price: 10.43, change24: 4.2, change7: 15.6, cap: '4B', color: '#E84142' },
            { id: 'dot', name: 'Polkadot', symbol: 'DOT', price: 1.54, change24: 1.1, change7: 4.2, cap: '2B', color: '#E6007A' },
            { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', price: 0.101, change24: 12.1, change7: 35.2, cap: '14B', color: '#C2A633' },
            { id: 'matic', name: 'Polygon', symbol: 'MATIC', price: 0.098, change24: -0.4, change7: 2.1, cap: '0.9B', color: '#8247E5' },
            { id: 'link', name: 'Chainlink', symbol: 'LINK', price: 9.77, change24: 3.2, change7: 10.4, cap: '5.8B', color: '#2A5ADA' }
        ];

        const investPortfolios = [
            { id: 1, name: 'VIP 0 Public Plan', roi: 2.0, duration: 7, min: 50, color: '#f7931a', monthly: 45, type: 'high', category: 'hot', vipLevel: 0 },
            { id: 2, name: 'VIP 1 Standard', roi: 2.5, duration: 14, min: 50, color: '#627eea', monthly: 85, type: 'med', category: 'hot', vipLevel: 1 },
            { id: 3, name: 'VIP 2 Premium', roi: 3.2, duration: 30, min: 500, color: '#26a17b', monthly: 15, type: 'low', category: 'hot', vipLevel: 2 },
            { id: 4, name: 'VIP 3 Elite', roi: 4.5, duration: 21, min: 3000, color: '#ff007a', monthly: 120, type: 'high', category: 'hot', vipLevel: 3 },
            { id: 5, name: 'VIP 4 Pro', roi: 5.2, duration: 10, min: 5000, color: '#14f195', monthly: 75, type: 'med', category: 'hot', vipLevel: 4 },
            { id: 6, name: 'VIP 5 Whale', roi: 6.8, duration: 15, min: 10000, color: '#e6007a', monthly: 40, type: 'low', category: 'hot', vipLevel: 5 },
            { id: 7, name: 'VIP 6 Institutional', roi: 8.5, duration: 365, min: 50000, color: '#2a5ada', monthly: 300, type: 'high', category: 'hot', vipLevel: 6 },
            { id: 8, name: 'VIP 7 Sovereign', roi: 12.0, duration: 365, min: 100000, color: '#B87333', monthly: 450, type: 'high', category: 'hot', vipLevel: 7 },
            { id: 9, name: 'VIP 8 Consensus', roi: 25.0, duration: 365, min: 3000000, color: '#FFD700', monthly: 900, type: 'high', category: 'hot', vipLevel: 8 },
            { id: 10, name: 'Arb Quantify X', roi: 1.5, duration: 1, min: 100, color: '#2a5ada', monthly: 45, type: 'med', category: 'quantify', vipLevel: 0 },
            { id: 11, name: 'USDT Pledge Core', roi: 0.8, duration: 90, min: 1000, color: '#26a17b', monthly: 24, type: 'low', category: 'pledge', vipLevel: 0 }
        ];

        let investActiveMainTab = 'hot';
        let investActiveVipFilter = 'all';

        const vipPackages = [
            { id: 'v1', level: 1, name: 'V1', dl: 100, ml: 3000, days: 60, price: 50, theme: 'vip-v1' },
            { id: 'v2', level: 2, name: 'V2', dl: 1000, ml: 30000, days: 60, price: 500, theme: 'vip-v2' },
            { id: 'v3', level: 3, name: 'V3', dl: 30000, ml: 450000, days: 90, price: 3000, theme: 'vip-v3' },
            { id: 'v4', level: 4, name: 'V4', dl: 80000, ml: 950000, days: 90, price: 5000, theme: 'vip-v4' },
            { id: 'v5', level: 5, name: 'V5', dl: 150000, ml: 2500000, days: 365, price: 10000, theme: 'vip-v5' },
            { id: 'v6', level: 6, name: 'V6', dl: 300000, ml: 4500000, days: 365, price: 50000, theme: 'vip-v6' },
            { id: 'v7', level: 7, name: 'V7', dl: 500000, ml: 8000000, days: 365, price: 100000, theme: 'vip-v7' },
            { id: 'v8', level: 8, name: 'V8', dl: 1000000, ml: 20000000, days: 365, price: 3000000, theme: 'vip-v8' }
        ];
        let selectedVipPackageId = 'v1';
        let currentUserVipLevel = 0;

        let userBalance = 15420.50;
        let todayTransferredAmount = 0;
        let monthlyTransferredAmount = 0;

        let activeInvestments = [];
        let transactions = [
            { id: 1, type: 'Deposit', asset: 'USD', amount: 5000, date: '2024-03-10', status: 'Completed' },
            { id: 2, type: 'Buy', asset: 'BTC', amount: 0.05, date: '2024-03-11', status: 'Completed' }
        ];

        // --- P2P Marketplace Data ---
        let p2pActiveType = 'buy';
        let p2pActiveFiat = 'USD';
        let p2pActiveAsset = 'USDT';

        const fiatSymbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'CAD': 'CA$',
            'AED': 'AED ',
            'TRY': '₺',
            'BRL': 'R$',
            'INR': '₹',
            'PKR': '₨',
            'PHP': '₱',
            'MYR': 'RM',
            'VND': '₫',
            'NGN': '₦',
            'KES': 'KSh',
            'ZAR': 'R',
            'XOF': 'CFA'
        };

        const p2pAds = [
            // USD
            { id: 1, user: 'CryptoKing', orders: 1240, rate: 98.5, type: 'buy', asset: 'USDT', fiat: 'USD', price: 1.01, limitMin: 100, limitMax: 5000, payments: ['Bank Transfer', 'Zelle'] },
            { id: 2, user: 'FastNode', orders: 850, rate: 99.2, type: 'buy', asset: 'USDT', fiat: 'USD', price: 1.02, limitMin: 50, limitMax: 2000, payments: ['PayPal', 'Cash App'] },
            { id: 3, user: 'WhaleHunter', orders: 50, rate: 100, type: 'buy', asset: 'BTC', fiat: 'USD', price: 73850, limitMin: 10000, limitMax: 1000000, payments: ['Wire Transfer'] },
            { id: 29, user: 'DollarMaster', orders: 320, rate: 97.1, type: 'sell', asset: 'USDT', fiat: 'USD', price: 0.99, limitMin: 200, limitMax: 8000, payments: ['Venmo', 'Bank Transfer'] },
            // EUR
            { id: 4, user: 'EuroTrader', orders: 420, rate: 95.8, type: 'buy', asset: 'BTC', fiat: 'EUR', price: 67845.50, limitMin: 500, limitMax: 10000, payments: ['SEPA', 'Revolut'] },
            { id: 30, user: 'BerlinBull', orders: 215, rate: 98.0, type: 'buy', asset: 'USDT', fiat: 'EUR', price: 0.93, limitMin: 100, limitMax: 5000, payments: ['SEPA', 'Wise'] },
            // GBP
            { id: 5, user: 'LondonBull', orders: 1100, rate: 97.4, type: 'sell', asset: 'ETH', fiat: 'GBP', price: 1785.12, limitMin: 200, limitMax: 15000, payments: ['Faster Payments', 'Bank Transfer'] },
            { id: 31, user: 'LiverpoolEx', orders: 640, rate: 99.5, type: 'buy', asset: 'USDT', fiat: 'GBP', price: 0.80, limitMin: 150, limitMax: 6000, payments: ['Monzo', 'Barclays'] },
            // CAD
            { id: 9, user: 'MapleWhale', orders: 390, rate: 98.3, type: 'buy', asset: 'USDT', fiat: 'CAD', price: 1.37, limitMin: 100, limitMax: 5000, payments: ['Interac e-Transfer', 'Bank Transfer'] },
            { id: 10, user: 'OttawaFX',  orders: 210, rate: 96.7, type: 'sell', asset: 'BTC', fiat: 'CAD', price: 99500, limitMin: 1000, limitMax: 50000, payments: ['Interac e-Transfer'] },
            // AED
            { id: 11, user: 'DubaiWhale', orders: 560, rate: 99.1, type: 'buy', asset: 'USDT', fiat: 'AED', price: 3.68, limitMin: 500, limitMax: 100000, payments: ['Bank Transfer', 'Cash in Person'] },
            { id: 12, user: 'ABUDhabi_Ex', orders: 310, rate: 97.8, type: 'buy', asset: 'BTC', fiat: 'AED', price: 270200, limitMin: 1000, limitMax: 500000, payments: ['Bank Transfer'] },
            // TRY
            { id: 13, user: 'IstanbulFX', orders: 870, rate: 94.5, type: 'buy', asset: 'USDT', fiat: 'TRY', price: 32.10, limitMin: 5000, limitMax: 500000, payments: ['Ziraat Bank', 'Papara'] },
            { id: 14, user: 'AnkaraTrader', orders: 420, rate: 97.2, type: 'sell', asset: 'ETH', fiat: 'TRY', price: 72550, limitMin: 10000, limitMax: 2000000, payments: ['Garanti', 'Enpara'] },
            // BRL
            { id: 15, user: 'SaoPauloFX', orders: 1100, rate: 98.8, type: 'buy', asset: 'USDT', fiat: 'BRL', price: 5.05, limitMin: 500, limitMax: 50000, payments: ['PIX', 'TED'] },
            { id: 16, user: 'Rio_Crypto', orders: 640, rate: 96.4, type: 'sell', asset: 'BTC', fiat: 'BRL', price: 368500, limitMin: 1000, limitMax: 200000, payments: ['PIX'] },
            // INR
            { id: 7, user: 'IndiCoin', orders: 1500, rate: 96.2, type: 'buy', asset: 'USDT', fiat: 'INR', price: 88.50, limitMin: 5000, limitMax: 200000, payments: ['UPI', 'IMPS'] },
            { id: 32, user: 'MumbaiEx', orders: 870, rate: 99.0, type: 'sell', asset: 'ETH', fiat: 'INR', price: 188500, limitMin: 10000, limitMax: 1500000, payments: ['UPI', 'NEFT'] },
            // PKR
            { id: 17, user: 'KarachiKing', orders: 770, rate: 95.5, type: 'buy', asset: 'USDT', fiat: 'PKR', price: 280.40, limitMin: 10000, limitMax: 1000000, payments: ['Easypaisa', 'JazzCash'] },
            { id: 18, user: 'LahoreFX', orders: 440, rate: 97.3, type: 'sell', asset: 'BTC', fiat: 'PKR', price: 20650000, limitMin: 50000, limitMax: 5000000, payments: ['Bank Transfer', 'Easypaisa'] },
            // PHP
            { id: 19, user: 'ManilaCoin', orders: 920, rate: 98.0, type: 'buy', asset: 'USDT', fiat: 'PHP', price: 57.80, limitMin: 5000, limitMax: 300000, payments: ['GCash', 'Maya'] },
            { id: 20, user: 'CebuTrader', orders: 380, rate: 95.2, type: 'sell', asset: 'ETH', fiat: 'PHP', price: 127200, limitMin: 5000, limitMax: 500000, payments: ['BDO', 'GCash'] },
            // MYR
            { id: 21, user: 'KLWhale', orders: 660, rate: 97.7, type: 'buy', asset: 'USDT', fiat: 'MYR', price: 4.71, limitMin: 500, limitMax: 50000, payments: ['DuitNow', 'Maybank'] },
            { id: 22, user: 'PenangFX', orders: 310, rate: 96.0, type: 'sell', asset: 'BTC', fiat: 'MYR', price: 346500, limitMin: 2000, limitMax: 200000, payments: ['Bank Transfer', 'DuitNow'] },
            // VND
            { id: 23, user: 'HanoiEx', orders: 1250, rate: 99.3, type: 'buy', asset: 'USDT', fiat: 'VND', price: 25400, limitMin: 500000, limitMax: 100000000, payments: ['ViettelPay', 'MoMo'] },
            { id: 24, user: 'SaigonFX', orders: 780, rate: 97.1, type: 'sell', asset: 'ETH', fiat: 'VND', price: 56850000, limitMin: 2000000, limitMax: 500000000, payments: ['Vietcombank', 'MoMo'] },
            // NGN
            { id: 6, user: 'NaijaTech', orders: 3100, rate: 99.8, type: 'buy', asset: 'USDT', fiat: 'NGN', price: 1450, limitMin: 10000, limitMax: 5000000, payments: ['Opay', 'Kuda', 'GTBank'] },
            { id: 33, user: 'LagosWhale', orders: 980, rate: 98.5, type: 'sell', asset: 'BTC', fiat: 'NGN', price: 110500000, limitMin: 100000, limitMax: 50000000, payments: ['Opay', 'Kuda'] },
            // KES
            { id: 25, user: 'NairobiEx', orders: 860, rate: 97.5, type: 'buy', asset: 'USDT', fiat: 'KES', price: 130.50, limitMin: 5000, limitMax: 500000, payments: ['M-Pesa', 'Equity Bank'] },
            { id: 26, user: 'MombasaFX', orders: 430, rate: 95.9, type: 'sell', asset: 'ETH', fiat: 'KES', price: 305500, limitMin: 10000, limitMax: 2000000, payments: ['M-Pesa'] },
            // ZAR
            { id: 27, user: 'JohannesburgFX', orders: 720, rate: 98.1, type: 'buy', asset: 'USDT', fiat: 'ZAR', price: 18.80, limitMin: 1000, limitMax: 100000, payments: ['FNB EFT', 'Capitec Pay'] },
            { id: 28, user: 'CapeTownWhale', orders: 350, rate: 96.5, type: 'sell', asset: 'BTC', fiat: 'ZAR', price: 1385000, limitMin: 5000, limitMax: 1000000, payments: ['Standard Bank', 'FNB EFT'] },
            // XOF
            { id: 8, user: 'SahelXchange', orders: 540, rate: 94.5, type: 'sell', asset: 'USDT', fiat: 'XOF', price: 615, limitMin: 25000, limitMax: 1000000, payments: ['Orange Money', 'Wave'] },
            { id: 34, user: 'AbidjanFX', orders: 280, rate: 96.8, type: 'buy', asset: 'USDT', fiat: 'XOF', price: 612, limitMin: 10000, limitMax: 500000, payments: ['Wave', 'Moov Money'] }
        ];

        // --- Router Logic ---
        window.navigate = function(pageId) {
            const sections = document.querySelectorAll('#app-router > section');
            sections.forEach(s => s.classList.remove('active'));

            let targetPage = pageId;
            let showVipView = false;
            
            if (pageId === 'vip') {
                targetPage = 'invest';
                showVipView = true;
            }

            const target = document.getElementById(targetPage);
            if (target) {
                target.classList.add('active');
                window.scrollTo(0, 0);

                // Content triggers
                if (targetPage === 'invest') {
                    if (showVipView) {
                        document.getElementById('invest-content-area').style.display = 'none';
                        document.getElementById('vip-packages-view').style.display = 'block';
                        renderVipPackages();
                    } else {
                        document.getElementById('invest-content-area').style.display = 'block';
                        document.getElementById('vip-packages-view').style.display = 'none';
                        renderInvest();
                    }
                }
                if (targetPage === 'investments') renderActiveInvestments();
                if (targetPage === 'portfolio') {
                    renderTransactions();
                    setTimeout(() => {
                        drawAllocationChart();
                        drawPerformanceChart();
                        drawBalanceHistoryChart();
                    }, 100);
                }
                if (targetPage === 'crypto') updateExchangeRate();
                if (targetPage === 'p2p') renderP2PAds();
                if (targetPage === 'alpha') {
                    setTimeout(() => initAlpha(), 100);
                    setTimeout(() => drawDepthChart(), 100);
                }
            }

            document.querySelectorAll('.nav-links a, .bottom-nav-item').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('onclick')?.includes(targetPage) || link.dataset.page === targetPage) {
                    link.classList.add('active');
                }
            });
        }

        // --- Price Simulation ---
        function updatePrices() {
            coins.forEach(coin => {
                const fluctuation = (Math.random() - 0.5) * 0.002; // 0.2% max change
                coin.price *= (1 + fluctuation);
            });
            renderPrices();
            renderTicker();
            renderHomeMarket();
        }

        window.renderPrices = function() {
            const tbody = document.getElementById('prices-body');
            if (!tbody) return;

            const searchTerm = document.getElementById('coin-search').value.toLowerCase();
            const filtered = coins.filter(c => c.name.toLowerCase().includes(searchTerm) || c.symbol.toLowerCase().includes(searchTerm));

            tbody.innerHTML = filtered.map(coin => `
                <tr>
                    <td><span class="fav-star"><i class="fa-solid fa-star"></i></span></td>
                    <td>
                        <div class="coin-info">
                            <div class="coin-icon" style="background: ${coin.color}20; color: ${coin.color}">${coin.symbol[0]}</div>
                            <div>
                                <div style="font-weight: 600;">${coin.name}</div>
                                <div style="color: var(--text-muted); font-size: 0.8rem;">${coin.symbol}</div>
                            </div>
                        </div>
                    </td>
                    <td class="text-right"><b>$${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></td>
                    <td class="text-right ${coin.change24 >= 0 ? 'accent-green' : 'up'}" style="color: ${coin.change24 >= 0 ? 'var(--accent-green)' : '#ff3e3e'}">
                        ${coin.change24 >= 0 ? '+' : ''}${coin.change24}%
                    </td>
                    <td class="text-right" style="color: ${coin.change7 >= 0 ? 'var(--accent-green)' : '#ff3e3e'}">
                        ${coin.change7 >= 0 ? '+' : ''}${coin.change7}%
                    </td>
                    <td class="text-right">$${coin.cap}</td>
                    <td class="text-center">
                        <canvas class="sparkline" height="40" width="100" data-color="${coin.change7 >= 0 ? '#00A86B' : '#ff3e3e'}" data-coin-id="${coin.id}"></canvas>
                    </td>
                    <td class="text-right">
                        <button class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.85rem;" onclick="openBuyModal('${coin.symbol}')">Buy</button>
                    </td>
                </tr>
            `).join('');

            drawSparklines();
        }

        window.switchMarketTab = function(element, exchange) {
            // Update UI tabs
            const tabs = document.querySelectorAll('.filter-tab');
            tabs.forEach(t => t.classList.remove('active'));
            element.classList.add('active');

            // Simulate loading / refresh
            const list = document.getElementById('home-market-list');
            if (list) {
                list.style.opacity = '0.5';
                list.style.pointerEvents = 'none';
                
                setTimeout(() => {
                    // Re-shuffle or slightly modify prices for effect
                    coins.forEach(coin => {
                        coin.price *= (1 + (Math.random() - 0.5) * 0.001);
                    });
                    renderHomeMarket();
                    list.style.opacity = '1';
                    list.style.pointerEvents = 'auto';
                }, 300);
            }
        }

        function renderHomeMarket() {
            const list = document.getElementById('home-market-list');
            if (!list) {
                console.warn('renderHomeMarket: #home-market-list not found');
                return;
            }
            console.log('renderHomeMarket: Found container, populating...');

            // Take top 4 coins
            const topCoins = coins.slice(0, 4);
            list.innerHTML = topCoins.map(coin => `
                <div class="market-list-item" onclick="navigate('prices')">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: ${coin.color}20; color: ${coin.color}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">${coin.symbol[0]}</div>
                        <div>
                            <div style="font-weight: 700; font-size: 1rem;">${coin.symbol} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">/ USDT</span></div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Vol ${(Math.random() * 5 + 1).toFixed(1)}M</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; font-size: 1.1rem;">$${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div style="font-size: 0.85rem; color: ${coin.change24 >= 0 ? 'var(--accent-green)' : '#ff3e3e'}; font-weight: 600;">
                            ${coin.change24 >= 0 ? '+' : ''}${coin.change24}%
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function initActivityFeed() {
            const feed = document.getElementById('home-activity-feed');
            if (!feed) {
                console.warn('initActivityFeed: #home-activity-feed not found');
                return;
            }
            console.log('initActivityFeed: Found container, populating...');

            const actions = ['Bought', 'Invested in', 'Upgraded to VIP', 'Pledged'];
            const targets = ['BTC Binary Trading', 'ETH Smart Yielding', 'VIP 3 Package', 'USDT Quantify', 'Solana Speedster'];
            
            let html = '';
            // Generate 15 fake activity items for the infinite scroll
            for(let i=0; i<15; i++) {
                const userNum = Math.floor(100 + Math.random() * 900);
                const action = actions[Math.floor(Math.random() * actions.length)];
                const target = targets[Math.floor(Math.random() * targets.length)];
                const amount = (Math.floor(Math.random() * 100) * 50) + 50;
                const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));

                html += `
                    <div class="activity-feed-item" style="padding: 1rem 1.25rem; border-radius: 12px; margin-bottom: 0.75rem; background: var(--card-bg); border: 1px solid var(--card-border); transition: transform 0.2s ease;">
                        <div style="background: ${amount > 3000 ? 'var(--accent-green-light)' : 'rgba(235, 169, 107, 0.15)'}; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${amount > 3000 ? 'white' : '#EBA96B'}; font-weight: 800; flex-shrink: 0; font-size: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">${letter}</div>
                        <div style="flex: 1; margin-left: 1rem;">
                            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; margin-bottom: 0.15rem;">User ***${userNum}</div>
                            <div style="font-size: 0.9rem; font-weight: 600;">${action} <span style="color: var(--accent-green); font-weight: 800;">${target}</span></div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 800; font-size: 1rem; color: var(--text-main); font-family: 'JetBrains Mono';">$${amount.toLocaleString()}</div>
                            <div style="color: var(--text-muted); font-size: 0.7rem; font-weight: 600;">Just now</div>
                        </div>
                    </div>
                `;
            }
            feed.innerHTML = html + html;
        }

        // --- Investment Logic ---
        window.switchInvestTab = function(element, tab) {
            investActiveMainTab = tab;
            document.querySelectorAll('#invest-main-tabs .filter-tab').forEach(el => {
                el.classList.remove('active');
                el.style.borderBottom = 'none';
            });
            element.classList.add('active');
            element.style.borderBottom = '2px solid var(--accent-green)';

            const vipFilter = document.getElementById('vip-filter-container');
            if (vipFilter) {
                vipFilter.style.display = tab === 'hot' ? 'block' : 'none';
            }
            renderInvest();
        }

        window.filterByVip = function(element, vip) {
            investActiveVipFilter = vip;
            document.querySelectorAll('.vip-sub-tab').forEach(el => el.classList.remove('active'));
            element.classList.add('active');
            renderInvest();
        }

        window.renderInvest = function(tab = null) {
            if (tab) investActiveMainTab = tab;
            
            const container = document.getElementById('invest-container');
            if (!container) return;

            const filterId = investActiveVipFilter.toString().toLowerCase();
            console.log(`[V2.1] Rendering - Tab: ${investActiveMainTab}, Filter: ${filterId}`);

            // Base category filter
            let filtered = investPortfolios.filter(p => p.category === investActiveMainTab);

            // Strict VIP filtering
            if (filterId !== 'all') {
                const targetVip = parseInt(filterId.replace('vip', ''));
                if (!isNaN(targetVip)) {
                    filtered = filtered.filter(p => parseInt(p.vipLevel) === targetVip);
                }
            }

            if (filtered.length === 0) {
                const levelDisplay = filterId === 'all' ? 'this category' : 'VIP Level ' + filterId.replace('vip', '');
                container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-muted); background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--item-border); width: 100%;">
                    <div style="font-size: 1.5rem; margin-bottom: 1rem;">📭 No Plans Found</div>
                    <p>No investment products currently available for ${levelDisplay}.</p>
                </div>`;
                return;
            }

            container.innerHTML = filtered.map(portfolio => `
                <div class="portfolio-card fade-in" style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--card-radius); padding: 2rem; display: flex; flex-direction: column; height: 100%; transition: all 0.3s var(--ease-standard); cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem;">
                        <div>
                            <h3 style="font-size: 1.15rem; font-weight: 800; line-height: 1.2; margin-bottom: 0.25rem;">${portfolio.name}</h3>
                            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Consensus Portfolio</div>
                        </div>
                        <span style="font-size: 0.65rem; padding: 0.25rem 0.6rem; background: ${portfolio.color}15; color: ${portfolio.color}; border-radius: 4px; font-weight: 800;">VIP ${portfolio.vipLevel}+</span>
                    </div>
                    
                    <div style="display: flex; gap: 2.5rem; margin-bottom: 2.5rem;">
                        <div>
                            <div style="font-size: 2.25rem; font-weight: 800; color: var(--accent-green); font-family: 'JetBrains Mono', monospace; letter-spacing: -0.05em;">${portfolio.roi}%</div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase;">Est. Daily ROI</div>
                        </div>
                        <div>
                            <div style="font-size: 2.25rem; font-weight: 800; font-family: 'JetBrains Mono', monospace; letter-spacing: -0.05em;">${portfolio.duration}d</div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase;">Duration</div>
                        </div>
                    </div>

                    <div style="margin-top: auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">Min. <span style="font-family: 'JetBrains Mono';">$${portfolio.min.toLocaleString()}</span></span>
                            <span style="font-size: 0.75rem; font-weight: 600; color: var(--accent-green);">+${portfolio.monthly}% Monthly</span>
                        </div>
                        <div style="background: var(--bg-secondary); height: 6px; border-radius: 100px; overflow: hidden; margin-bottom: 1.5rem;">
                            <div style="background: linear-gradient(90deg, var(--accent-green), ${portfolio.color}); width: ${Math.min(portfolio.monthly * 0.8, 100)}%; height: 100%; border-radius: 100px;"></div>
                        </div>
                        <button class="btn btn-primary" style="width: 100%; padding: 0.85rem; border-radius: 12px; font-weight: 800;" onclick="openBuyModal(null, ${portfolio.id})">Participate Now</button>
                    </div>
                </div>
            `).join('');

            // Draw sparklines for each portfolio
            filtered.forEach(portfolio => {
                const canvas = document.getElementById(`portfolio-sparkline-${portfolio.id}`);
                if (canvas) drawPortfolioSparkline(canvas, portfolio.color);
            });
        }

        function drawPortfolioSparkline(canvas, color) {
            const ctx = canvas.getContext('2d');
            const data = Array.from({ length: 20 }, () => Math.random() * 40 + 10);
            const w = canvas.width = canvas.offsetWidth;
            const h = canvas.height = canvas.offsetHeight;

            ctx.clearRect(0, 0, w, h);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            data.forEach((val, i) => {
                const x = (i / (data.length - 1)) * w;
                const y = h - (val / 60) * h;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
        }

        window.renderVipPackages = function() {
            const container = document.getElementById('vip-packages-list');
            if (!container) return;

            container.innerHTML = vipPackages.map(pkg => `
                <div class="vip-card-new ${pkg.id === selectedVipPackageId ? 'active' : ''}" onclick="selectVipPackage('${pkg.id}')" style="background: var(--bg-secondary); border: 1px solid ${pkg.id === selectedVipPackageId ? '#007AFF' : 'var(--card-border)'}; border-radius: 12px; padding: 1.2rem; cursor: pointer; transition: all 0.2s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div class="vip-badge-icon ${pkg.theme}" style="padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: 800; font-size: 0.9rem;">${pkg.name}</div>
                            <div>
                                <div style="font-weight: 600;">$${pkg.price.toLocaleString()} USDT</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted);">${pkg.days} Days Validity</div>
                            </div>
                        </div>
                        <div style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid ${pkg.id === selectedVipPackageId ? '#007AFF' : 'var(--card-border)'}; display: flex; align-items: center; justify-content: center;">
                            ${pkg.id === selectedVipPackageId ? '<div style="width: 10px; height: 100px; background: #007AFF; border-radius: 50%;"></div>' : ''}
                        </div>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('vip-balance-display').innerText = userBalance.toLocaleString(undefined, { minimumFractionDigits: 2 });
        }

        window.selectVipPackage = function(id) {
            selectedVipPackageId = id;
            renderVipPackages();
        }

        window.processVipUpgrade = function() {
            const pkg = vipPackages.find(p => p.id === selectedVipPackageId);
            const password = document.getElementById('vip-safe-password').value;

            if (!password) {
                showToast('Error', 'Please enter your safe password');
                return;
            }

            if (userBalance < pkg.price) {
                showToast('Error', 'Insufficient balance for this upgrade');
                return;
            }

            // Simulate success
            showToast('Success', `Successfully upgraded to ${pkg.name}!`);
            userBalance -= pkg.price;
            currentUserVipLevel = pkg.level;
            document.getElementById('vip-safe-password').value = '';
            
            // Update Mine Section UI
            updateMineSection();
            
            // Re-render
            renderVipPackages();
            
            // Update UI elsewhere if needed
            setTimeout(() => {
                navigate('invest'); // Go back to products
            }, 1000);
        }



        window.processTransfer = function() {
            const amount = parseFloat(document.getElementById('transfer-amount').value);
            const recipient = document.getElementById('transfer-recipient').value;
            const password = document.getElementById('transfer-safe-password').value;

            if (isNaN(amount) || amount <= 0) {
                showToast('Error', 'Please enter a valid amount');
                return;
            }

            if (!recipient) {
                showToast('Error', 'Please enter a recipient');
                return;
            }

            if (!password) {
                showToast('Error', 'Please enter your safe password');
                return;
            }

            const currentVip = vipPackages.find(p => p.level === currentUserVipLevel) || { dl: 10, ml: 100 }; // Default low limits for VIP0

            if (todayTransferredAmount + amount > currentVip.dl) {
                showToast('Limit Exceeded', `Daily transfer limit for VIP ${currentUserVipLevel} is $${currentVip.dl.toLocaleString()}`);
                return;
            }

            if (userBalance < amount) {
                showToast('Error', 'Insufficient balance');
                return;
            }

            // Execute transfer
            userBalance -= amount;
            todayTransferredAmount += amount;
            monthlyTransferredAmount += amount;
            
            showToast('Success', `Successfully transferred $${amount.toLocaleString()} to ${recipient}`);
            recordTransaction('Transfer', 'USDT', amount);
            
            // Update Mine Section
            updateMineSection();
            
            // Reset wizard
            setTimeout(() => {
                navigate('home');
                // Potential reset of transfer inputs here
            }, 1500);
        }

        function updateMineSection() {
            const vipLevelEl = document.getElementById('mine-vip-level');
            const totalAssetsEl = document.getElementById('mine-total-assets');
            const welcomeVipEl = document.getElementById('welcome-vip-level');
            const headerBalanceEl = document.getElementById('header-user-balance');
            const transferBalanceEl = document.getElementById('transfer-balance-display');

            if (vipLevelEl) vipLevelEl.innerText = `UID: 10482937 | VIP ${currentUserVipLevel}`;
            if (totalAssetsEl) totalAssetsEl.innerHTML = `<span style="font-family: 'JetBrains Mono', monospace;">${userBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
            if (welcomeVipEl) welcomeVipEl.innerText = `VIP ${currentUserVipLevel}`;
            if (headerBalanceEl) headerBalanceEl.innerHTML = `<span style="font-family: 'JetBrains Mono', monospace; font-weight: 800;">$${userBalance.toLocaleString()}</span>`;
            if (transferBalanceEl) transferBalanceEl.innerHTML = `<span style="font-family: 'JetBrains Mono', monospace;">${userBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
        }

        window.initiateWithdrawal = function() {
            // Simplified withdrawal wizard or direct prompt
            const amount = prompt("Enter withdrawal amount (USDT):");
            if (!amount) return;
            
            const pass = prompt("Enter Safe Password:");
            if (!pass) return;

            const currentVip = vipPackages.find(p => p.level === currentUserVipLevel) || { dl: 10, ml: 100 };
            
            if (parseFloat(amount) > userBalance) {
                showToast('Error', 'Insufficient balance');
                return;
            }

            // Simulate withdrawal delay
            showToast('Processing', 'Verifying transaction on blockchain...');
            setTimeout(() => {
                userBalance -= parseFloat(amount);
                showToast('Success', `Withdrawal of $${amount} successful`);
                recordTransaction('Withdrawal', 'USDT', parseFloat(amount));
                updateMineSection();
            }, 2000);
        }

        function showPortfolioDetail(portfolioId) {
            console.log('Viewing detail for portfolio:', portfolioId);
        }

        function initiateDeposit() {
            showToast('System', 'Initializing secure blockchain gateway...');
            setTimeout(() => {
                openBuyModal('USDT'); // Reuse buy modal for deposit simulation
            }, 1000);
        }

        function renderActiveInvestments() {
            const container = document.getElementById('active-investments-container');
            if (!container) return;

            if (activeInvestments.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 5rem; background: var(--bg-secondary); border: 2px dashed var(--card-border); border-radius: 20px;">
                        <div style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.3;"><i class="fa-solid fa-chart-line"></i></div>
                        <p style="color: var(--text-muted); font-weight: 700;">No active consensus portfolios found.</p>
                        <button class="btn btn-ghost btn-sm" style="margin-top: 1rem;" onclick="navigate('invest')">Browse Portfolios</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = activeInvestments.map(inv => `
                <div class="stat-card" style="border: 1px solid var(--card-border); background: var(--card-bg); padding: 1.5rem; border-radius: 16px; border-left: 4px solid var(--accent-green);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <div>
                            <span style="font-weight: 800; font-size: 1rem; display: block; margin-bottom: 0.15rem;">${inv.planName}</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">PORTFOLIO ID: ${inv.id.toString().slice(-6)}</span>
                        </div>
                        <span class="apy-badge" style="background: var(--accent-green-light); color: white; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 800; font-size: 0.65rem;">ACTIVE</span>
                    </div>
                    <div style="font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; font-family: 'JetBrains Mono'; letter-spacing: -0.05em; color: var(--text-main);">$${inv.amount.toLocaleString()}</div>
                    <p style="color: var(--accent-green); font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 0.4rem;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        Accruing $${(inv.amount * inv.roi / 100).toFixed(2)} / Day
                    </p>
                    <div style="margin-top: 2rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.6rem; font-weight: 700; color: var(--text-muted);">
                            <span>Maturation Progress</span><span>${inv.daysLeft}d left</span>
                        </div>
                        <div style="background: var(--bg-secondary); height: 8px; border-radius: 4px; overflow: hidden; border: 1px solid var(--card-border);">
                            <div style="background: linear-gradient(90deg, var(--accent-green), #00F2FE); width: ${(inv.duration - inv.daysLeft) / inv.duration * 100}%; height: 100%; border-radius: 4px;"></div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function renderTicker() {
            const ticker = document.getElementById('price-ticker');
            if (!ticker) return;

            const items = [...coins, ...coins].map(coin => `
                <div class="ticker-item" style="padding: 0 1.5rem; border-right: 1px solid var(--item-border);">
                    <span class="symbol" style="font-weight: 800; color: var(--text-main); font-size: 0.85rem;">${coin.symbol}</span>
                    <span class="price" style="font-family: 'JetBrains Mono', monospace; font-weight: 700;">$${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span class="change ${coin.change24 >= 0 ? 'up' : 'down'}" style="font-weight: 800; font-size: 0.75rem;">
                        ${coin.change24 >= 0 ? '<i class="fa-solid fa-caret-up"></i>' : '<i class="fa-solid fa-caret-down"></i>'}${Math.abs(coin.change24)}%
                    </span>
                </div>
            `).join('');
            ticker.innerHTML = items;
        }

        function drawSparklines() {
            document.querySelectorAll('.sparkline').forEach(canvas => {
                const ctx = canvas.getContext('2d');
                const color = canvas.dataset.color;
                const coinId = canvas.dataset.coinId;
                const coin = coins.find(c => c.id === coinId);
                if (!coin) return;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;

                const points = 10;
                const step = canvas.width / (points - 1);
                const trend = coin.change7 >= 0 ? 1 : -1;

                ctx.moveTo(0, canvas.height / 2);
                for (let i = 1; i < points; i++) {
                    const x = i * step;
                    // Create a trend based on change7
                    const noise = (Math.random() - 0.5) * 10;
                    const trendY = (canvas.height / 2) - (trend * (i / points) * 15) + noise;
                    ctx.lineTo(x, Math.max(5, Math.min(35, trendY)));
                }
                ctx.stroke();
            });
        }


        // --- Theme Management ---
        function initTheme() {
            const savedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
                document.body.classList.add('dark-mode');
                updateThemeIcon(true);
            }
        }

        window.toggleTheme = function() {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);

            // Force redraw of charts if on specific pages
            if (currentPage === 'home' || currentPage === 'stocks' || currentPage === 'portfolio') {
                setTimeout(() => navigate(currentPage), 10);
            }
        }

        function updateThemeIcon(isDark) {
            const icon = document.getElementById('theme-icon');
            const footerLogo = document.getElementById('footer-logo');

            if (isDark) {
                // Moon Icon
                icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
                if (footerLogo) footerLogo.style.filter = 'brightness(0) invert(1)';
            } else {
                // Sun Icon
                icon.innerHTML = `
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                `;
                if (footerLogo) footerLogo.style.filter = 'none';
            }
        }

        // Initialize theme on load
        initTheme();

        // --- Exchange Logic ---
        function getExchangeRate(from, to) {
            const rates = {
                'USD': 1,
                'EUR': 1.08,
                'BTC': coins.find(c => c.symbol === 'BTC').price,
                'ETH': coins.find(c => c.symbol === 'ETH').price,
                'SOL': coins.find(c => c.symbol === 'SOL').price
            };
            return rates[from] / rates[to];
        }

        window.updateExchangeRate = function() {
            const fromAssetEl = document.getElementById('exchange-from-asset');
            const toAssetEl = document.getElementById('exchange-to-asset');
            const fromAmountEl = document.getElementById('exchange-from-amount');
            const toInput = document.getElementById('exchange-to-amount');
            const rateDisplay = document.getElementById('exchange-rate-display');

            if (!fromAssetEl || !toAssetEl || !fromAmountEl || !toInput || !rateDisplay) return;

            const fromAsset = fromAssetEl.value;
            const toAsset = toAssetEl.value;
            const fromAmount = parseFloat(fromAmountEl.value) || 0;

            if (fromAsset === toAsset) {
                toInput.value = fromAmount.toFixed(2);
                rateDisplay.textContent = `1 ${fromAsset} = 1 ${toAsset}`;
                return;
            }

            const rate = getExchangeRate(fromAsset, toAsset);
            const toAmount = fromAmount * rate;

            toInput.value = toAsset === 'USD' || toAsset === 'EUR' ? toAmount.toFixed(2) : toAmount.toFixed(8);

            const inverseRate = 1 / rate;
            rateDisplay.textContent = `1 ${toAsset} ≈ ${inverseRate.toLocaleString(undefined, { maximumFractionDigits: toAsset === 'BTC' ? 8 : 2 })} ${fromAsset}`;
        }

        window.swapAssets = function() {
            const fromSelect = document.getElementById('exchange-from-asset');
            const toSelect = document.getElementById('exchange-to-asset');
            const temp = fromSelect.value;
            fromSelect.value = toSelect.value;
            toSelect.value = temp;
            updateExchangeRate();
        }

        window.processExchange = function() {
            const fromAmount = parseFloat(document.getElementById('exchange-from-amount').value);
            const fromAsset = document.getElementById('exchange-from-asset').value;
            const toAmount = document.getElementById('exchange-to-amount').value;
            const toAsset = document.getElementById('exchange-to-asset').value;

            if (fromAmount <= 0) {
                showToast('Error', 'Please enter a valid amount', 'error');
                return;
            }

            showToast('Success', `Exchanged ${fromAmount} ${fromAsset} for ${toAmount} ${toAsset}`, 'success');
            recordTransaction('Exchange', `${fromAsset} → ${toAsset}`, fromAmount);
        }

        // --- P2P Logic ---
        window.setP2PType = function(type) {
            p2pActiveType = type;
            const buyBtn = document.getElementById('p2p-buy-btn');
            const sellBtn = document.getElementById('p2p-sell-btn');

            if (type === 'buy') {
                buyBtn.classList.replace('btn-ghost', 'btn-primary');
                sellBtn.classList.replace('btn-primary', 'btn-ghost');
            } else {
                sellBtn.classList.replace('btn-ghost', 'btn-primary');
                buyBtn.classList.replace('btn-primary', 'btn-ghost');
            }
            renderP2PAds();
        }

        window.setP2PFiat = function(fiat) {
            p2pActiveFiat = fiat;
            renderP2PAds();
        }

        window.filterP2P = function(asset, el) {
            p2pActiveAsset = asset;
            document.querySelectorAll('#p2p .filter-tab').forEach(tab => tab.classList.remove('active'));
            el.classList.add('active');
            renderP2PAds();
        }

        // renderP2PAds and initiateP2PTrade are defined in the Batch 3 section below

        // --- Modals ---
        window.toggleModal = function(modalId) {
            const modal = document.getElementById(`${modalId}-modal`);
            if (modal.classList.contains('active')) {
                modal.classList.remove('active');
            } else {
                modal.classList.add('active');
            }
        }

        let isLoginMode = true;
        window.toggleAuthMode = function(mode = null) {
            if (mode === 'login') isLoginMode = true;
            else if (mode === 'signup') isLoginMode = false;
            else isLoginMode = !isLoginMode;

            const title = document.getElementById('auth-title');
            const btn = document.getElementById('auth-submit-btn');
            const toggleLink = document.getElementById('auth-toggle-link');

            if (title) title.textContent = isLoginMode ? 'Welcome Back' : 'Create Account';
            if (btn) btn.textContent = isLoginMode ? 'Sign In' : 'Create Account';
            if (toggleLink) toggleLink.innerHTML = isLoginMode ? 'Don\'t have an account? <span style="color: var(--accent-green); cursor: pointer;">Sign up</span>' : 'Already have an account? <span style="color: var(--accent-green); cursor: pointer;">Sign in</span>';
        }

        window.openAuth = function(mode = 'login') {
            window.toggleAuthMode(mode);
            window.toggleModal('auth');
        }

        let selectedPlanId = null;
        window.openBuyModal = function(symbol, planId = null) {
            selectedPlanId = planId;
            if (planId) {
                const plan = investPortfolios.find(p => p.id === planId);
                document.getElementById('buy-coin-name').textContent = `${plan.name} Investment`;
                document.getElementById('spend-amount').value = plan.min;
                document.getElementById('buy-receive-amt').textContent = `Daily ROI: ${plan.roi}%`;
            } else {
                const coin = coins.find(c => c.symbol === symbol) || { name: symbol, symbol: symbol, price: 100 };
                document.getElementById('buy-coin-name').textContent = coin.name;
                document.getElementById('buy-receive-amt').textContent = `${(100 / coin.price).toFixed(6)} ${coin.symbol}`;
                document.getElementById('spend-amount').value = 100;
            }
            toggleModal('buy');
        }

        window.confirmPurchase = function() {
            const amount = parseFloat(document.getElementById('spend-amount').value);

            if (selectedPlanId) {
                const plan = investPortfolios.find(p => p.id === selectedPlanId);
                if (amount < plan.min) {
                    showToast('Error', `Minimum investment for this plan is $${plan.min}`, 'error');
                    return;
                }

                const newInv = {
                    id: Date.now(),
                    planId: plan.id,
                    planName: plan.name,
                    amount: amount,
                    roi: plan.roi,
                    duration: plan.duration,
                    daysLeft: plan.duration,
                    earned: 0,
                    startDate: new Date()
                };

                activeInvestments.push(newInv);
                userBalance -= amount;
                recordTransaction('Investment', 'USD', amount);
                showToast('Success', `Invested $${amount} in ${plan.name} portfolio!`, 'success');
                navigate('investments');
            } else {
                showToast('Success', 'Purchase order submitted successfully!', 'success');
            }

            toggleModal('buy');
        }

        function recordTransaction(type, asset, amount) {
            transactions.unshift({
                id: Date.now(),
                type: type,
                asset: asset,
                amount: amount,
                date: new Date().toISOString().split('T')[0],
                status: 'Completed'
            });
            if (document.getElementById('portfolio').classList.contains('active')) {
                renderTransactions();
            }
        }

        function renderTransactions() {
            const container = document.getElementById('recent-activity-body');
            if (!container) return;

            container.innerHTML = transactions.map(tx => `
                <div style="display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--card-border);">
                    <div>
                        <div style="font-weight: 600;">${tx.type} ${tx.asset}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${tx.date}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700;">${tx.type === 'Withdrawal' || tx.type === 'Investment' ? '-' : '+'}${tx.amount.toLocaleString()}</div>
                        <div style="font-size: 0.7rem; color: var(--accent-green);">${tx.status}</div>
                    </div>
                </div>
            `).join('');
        }

        window.updatePlanFilter = function(el, filter) {
            document.querySelectorAll('#invest .filter-tab').forEach(tab => tab.classList.remove('active'));
            el.classList.add('active');
            
            const investTitle = document.getElementById('invest-title');
            const investSubtitle = document.getElementById('invest-subtitle');
            
            if (filter === 'vip') {
                document.getElementById('invest-container').style.display = 'none';
                document.getElementById('vip-packages-view').style.display = 'block';
                if(investTitle) investTitle.style.display = 'none';
                if(investSubtitle) investSubtitle.style.display = 'none';
                renderVipPackages();
                document.getElementById('vip-balance-display').innerText = userBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else {
                document.getElementById('invest-container').style.display = 'grid';
                document.getElementById('vip-packages-view').style.display = 'none';
                if(investTitle) investTitle.style.display = 'block';
                if(investSubtitle) investSubtitle.style.display = 'block';
                renderInvest(filter);
            }
        }

        window.selectVipPackage = function(id) {
            selectedVipPackageId = id;
            renderVipPackages();
        }

        function renderVipPackages() {
            const container = document.getElementById('vip-packages-list');
            if (!container) return;

            container.innerHTML = vipPackages.map(pkg => `
                <div class="vip-card ${pkg.theme} ${selectedVipPackageId === pkg.id ? 'selected' : ''}" onclick="selectVipPackage('${pkg.id}')">
                    <div class="vip-card-content">
                        <div class="vip-card-rank">
                            ${pkg.name} <span>View details</span>
                        </div>
                        <div class="vip-card-details">
                            Daily transfer limit: ${pkg.dl.toLocaleString()}<br>
                            Monthly transfer limit: ${pkg.ml.toLocaleString()}<br>
                            valid date: ${pkg.days}
                        </div>
                    </div>
                    <div class="vip-card-price-area">
                        ${pkg.price > 0 ? `<div class="vip-card-price">$${pkg.price.toLocaleString()}<span>.00</span></div>` : ''}
                        <div class="vip-card-radio"></div>
                    </div>
                </div>
            `).join('');
        }



        // --- Simulated Growth Engine ---
        function simulateGrowth() {
            activeInvestments = activeInvestments.map(inv => {
                const dailyEarned = inv.amount * (inv.roi / 100);
                return {
                    ...inv,
                    earned: inv.earned + dailyEarned / 24, // Increment every simulated hour
                    // Every 2.4 seconds is 1 hour in our simulation for demo purposes
                };
            });
            if (document.getElementById('investments').classList.contains('active')) {
                renderActiveInvestments();
            }
        }
        setInterval(simulateGrowth, 2400);

        // --- Toast System ---
        window.showToast = function(title, message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = 'feature-card';
            toast.style.cssText = `
                width: 300px;
                padding: 1rem;
                border-left: 4px solid ${type === 'success' ? 'var(--accent-green-light)' : 'var(--accent-green)'};
                background: var(--bg-secondary);
                backdrop-filter: blur(20px);
                animation: toastIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
                margin-bottom: 10px;
                opacity: 0;
            `;

            toast.innerHTML = `
                <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 0.2rem;">${title}</div>
                <div style="color: var(--text-muted); font-size: 0.8rem;">${message}</div>
            `;

            container.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'toastOut 0.4s ease-in forwards';
                setTimeout(() => toast.remove(), 400);
            }, 4500);
        }

        // Add toast animations to style
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes toastIn { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
            @keyframes toastOut { to { opacity: 0; transform: translateX(50px); } }
        `;
        document.head.appendChild(style);

        // --- Set Intersection Observer for Animations ---
        function initReveal() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { threshold: 0.1 });

            // Automatically target cards and sections for reveal
            document.querySelectorAll('section > div, .feature-card, .stat-card, .price-table-wrap, .reveal, .reveal-right').forEach(el => {
                if (!el.classList.contains('reveal') && !el.classList.contains('reveal-right')) {
                    el.classList.add('reveal');
                }
                observer.observe(el);
            });

            // --- Mouse Parallax Motion ---
            const heroBg = document.querySelector('.hero-premium-bg');
            const floatingCard = document.getElementById('hero-mini-chart');
            
            if (heroBg && floatingCard) {
                heroBg.addEventListener('mousemove', (e) => {
                    const rect = heroBg.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const percentX = (x - centerX) / centerX;
                    const percentY = (y - centerY) / centerY;
                    
                    const tiltX = percentY * 10; // Max 10deg
                    const tiltY = percentX * 10; // Max 10deg
                    
                    floatingCard.style.transform = `perspective(1000px) rotateX(${-tiltX}deg) rotateY(${tiltY}deg) translateY(${Math.sin(Date.now()/1000)*10}px)`;
                });
                
                heroBg.addEventListener('mouseleave', () => {
                    floatingCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
                });
            }
        }

        // --- Cards & FAQ Logic ---
        window.setCardColor = function(color, el) {
            const card = document.getElementById('main-debit-card');
            card.className = `debit-card ${color}`;
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
            el.classList.add('active');
            showToast('Customization', `Card color set to ${color}`);
        }

        window.toggleFaq = function(el) {
            el.classList.toggle('active');
            const icon = el.querySelector('span:last-child');
            icon.innerText = el.classList.contains('active') ? '-' : '+';
        }

        // FAQ Search Logic
        document.getElementById('faq-search')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('.faq-item').forEach(item => {
                const text = item.innerText.toLowerCase();
                item.style.display = text.includes(q) ? 'block' : 'none';
            });
        });

        // --- Transfer Wizard ---
        window.nextStep = function(section, stepNum) {
            // Hide all steps in this section
            let i = 1;
            while (true) {
                const el = document.getElementById(`${section}-step-${i}`);
                if (!el) break;
                el.style.display = 'none';
                i++;
            }
            const target = document.getElementById(`${section}-step-${stepNum}`);
            if (target) target.style.display = 'block';

            // Update step dots
            document.querySelectorAll(`#${section} .step-dot`).forEach((dot, idx) => {
                dot.classList.toggle('active', idx < stepNum);
                if (idx < stepNum) {
                    dot.style.borderColor = 'var(--accent-green)';
                    dot.style.color = 'var(--accent-green)';
                } else {
                    dot.style.borderColor = 'var(--card-border)';
                    dot.style.color = 'var(--text-muted)';
                }
            });

            // Special logic for review step
            if (section === 'transfer' && stepNum === 3) {
                const amount = document.getElementById('transfer-amount').value;
                const recipient = document.getElementById('transfer-recipient').value;
                const reviewAmount = document.getElementById('review-amount');
                const reviewRecipient = document.getElementById('review-recipient');
                
                if (reviewAmount) reviewAmount.innerText = `${parseFloat(amount).toLocaleString()} USDT`;
                if (reviewRecipient) reviewRecipient.innerText = recipient || '---';
            }
        }



        // --- Alpha Trading Chart ---
        function initAlpha() {
            const canvas = document.getElementById('alpha-chart');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            const W = rect.width;
            const H = rect.height;

            // Generate price data
            const points = 80;
            const data = [];
            let price = 64200;
            for (let i = 0; i < points; i++) {
                price += (Math.random() - 0.48) * 150;
                data.push(price);
            }
            const min = Math.min(...data) - 100;
            const max = Math.max(...data) + 100;

            function toY(val) { return H - ((val - min) / (max - min)) * (H - 40) - 20; }

            // Grid lines
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                const y = 20 + i * ((H - 40) / 5);
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(W, y);
                ctx.stroke();

                // Price labels
                const val = max - i * ((max - min) / 5);
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.font = '11px sans-serif';
                ctx.fillText('$' + val.toFixed(0), 8, y - 5);
            }

            // Price line
            ctx.beginPath();
            ctx.strokeStyle = '#00A86B';
            ctx.lineWidth = 3;
            data.forEach((val, i) => {
                const x = (i / (points - 1)) * W;
                const y = toY(val);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Flat fill
            ctx.lineTo(W, H);
            ctx.lineTo(0, H);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 168, 107, 0.02)';
            ctx.fill();

            // Crosshair dot at last price
            const lastX = W;
            const lastY = toY(data[data.length - 1]);
            ctx.beginPath();
            ctx.arc(lastX - 2, lastY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#00A86B';
            ctx.fill();

            // Order Book
            renderOrderBook();
        }

        function renderOrderBook() {
            const asksDiv = document.getElementById('order-book-asks');
            const bidsDiv = document.getElementById('order-book-bids');
            if (!asksDiv || !bidsDiv) return;

            let askHTML = '';
            let bidHTML = '';
            let basePrice = 64231.50;

            for (let i = 8; i >= 1; i--) {
                const price = (basePrice + i * 12.5).toFixed(2);
                const size = (Math.random() * 2 + 0.1).toFixed(4);
                const total = (price * size).toFixed(2);
                const width = Math.random() * 60 + 10;
                askHTML += `<div class="order-book-row">
                    <span style="color:#ff3e3e;">$${price}</span>
                    <span class="text-right">${size}</span>
                    <span class="text-right" style="color:var(--text-muted);">${total}</span>
                    <div class="depth-bar" style="background:#ff3e3e; width:${width}%;"></div>
                </div>`;
            }

            for (let i = 1; i <= 8; i++) {
                const price = (basePrice - i * 11.3).toFixed(2);
                const size = (Math.random() * 2 + 0.1).toFixed(4);
                const total = (price * size).toFixed(2);
                const width = Math.random() * 60 + 10;
                bidHTML += `<div class="order-book-row">
                    <span style="color:#00A86B;">$${price}</span>
                    <span class="text-right">${size}</span>
                    <span class="text-right" style="color:var(--text-muted);">${total}</span>
                    <div class="depth-bar" style="background:#00A86B; width:${width}%;"></div>
                </div>`;
            }

            asksDiv.innerHTML = askHTML;
            bidsDiv.innerHTML = bidHTML;
        }

        // --- Portfolio Charts ---
        function initPortfolio() {
            drawAllocationChart();
            drawPerformanceChart();
        }

        function drawAllocationChart() {
            const canvas = document.getElementById('allocation-chart');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const W = canvas.width;
            const H = canvas.height;
            const cx = W / 2;
            const cy = H / 2;
            const radius = Math.min(W, H) / 2 - 10;
            const innerRadius = radius * 0.6;

            const slices = [
                { pct: 0.65, color: '#F7931A', label: 'BTC' },
                { pct: 0.25, color: '#627EEA', label: 'ETH' },
                { pct: 0.10, color: '#00A86B', label: 'Stables' },
            ];

            let startAngle = -Math.PI / 2;
            slices.forEach(slice => {
                const endAngle = startAngle + slice.pct * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, startAngle, endAngle);
                ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
                ctx.closePath();
                ctx.fillStyle = slice.color;
                ctx.fill();
                // Add high contrast border between slices
                ctx.strokeStyle = 'var(--bg-primary)';
                ctx.lineWidth = 2;
                ctx.stroke();
                startAngle = endAngle;
            });

            // Center text
            ctx.fillStyle = 'var(--text-main)';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$24,831', cx, cy - 8);
            ctx.font = '12px sans-serif';
            ctx.fillStyle = 'var(--text-muted)';
            ctx.fillText('Total Value', cx, cy + 14);
        }

        function drawPerformanceChart() {
            const canvas = document.getElementById('performance-chart');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = 300 * dpr;
            ctx.scale(dpr, dpr);
            const W = rect.width;
            const H = 300;

            // Generate performance data (30 days)
            const days = 30;
            const data = [];
            let value = 22000;
            for (let i = 0; i < days; i++) {
                value += (Math.random() - 0.4) * 500;
                data.push(value);
            }
            const min = Math.min(...data) - 500;
            const max = Math.max(...data) + 500;

            function toY(val) { return H - 30 - ((val - min) / (max - min)) * (H - 60); }

            // Grid
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const y = 30 + i * ((H - 60) / 4);
                ctx.beginPath();
                ctx.moveTo(40, y);
                ctx.lineTo(W, y);
                ctx.stroke();
                const val = max - i * ((max - min) / 4);
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.font = '10px sans-serif';
                ctx.fillText('$' + (val / 1000).toFixed(1) + 'k', 2, y + 4);
            }

            // Line
            ctx.beginPath();
            ctx.strokeStyle = 'var(--accent-green)';
            ctx.lineWidth = 2.5;
            data.forEach((val, i) => {
                const x = 40 + (i / (days - 1)) * (W - 50);
                const y = toY(val);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Flat fill
            const lastX = 40 + ((days - 1) / (days - 1)) * (W - 50);
            ctx.lineTo(lastX, H - 30);
            ctx.lineTo(40, H - 30);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 168, 107, 0.02)';
            ctx.fill();

            // Current value label
            const lastVal = data[data.length - 1];
            const lastY = toY(lastVal);
            ctx.beginPath();
            ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'var(--accent-green)';
            ctx.fill();
            ctx.strokeStyle = 'var(--bg-primary)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        window.onload = () => {
            console.log('DOM Loaded. Starting Goalign Initialization...');
            // Core UI state
            renderPrices();
            renderTicker();
            renderHomeMarket();
            initActivityFeed();
            updateMineSection(); // Initialize balance and VIP display

            // Interaction engines
            setInterval(updatePrices, 2500);

            // Chart engines
            if (typeof initAlpha === 'function') initAlpha();
            if (typeof initPortfolio === 'function') initPortfolio();

            // Motion engine
            initReveal();

            // Search listener
            const searchInput = document.getElementById('coin-search');
            if (searchInput) searchInput.addEventListener('input', renderPrices);

            // NEW FEATURE INITIALIZERS
            renderNotifications();
            renderNewsFeed();
            renderSessions();
            renderReferral();
            checkOnboarding();

            // Draw chart on portfolio page load
            const portfolioEl = document.getElementById('portfolio');
            if (portfolioEl) {
                const observer = new MutationObserver(() => {
                    if (portfolioEl.classList.contains('active')) drawBalanceHistoryChart();
                });
                observer.observe(portfolioEl, { attributes: true, attributeFilter: ['class'] });
            }

            // Draw depth chart in alpha section
            setTimeout(() => {
                if (typeof drawDepthChart === 'function') drawDepthChart();
            }, 500);

            console.log('Goalign Platform V3.0 — All Features Initialized.');
        };



// ============================================================
// CHATBOT ENGINE (Front-loaded for reliability)
// ============================================================
(function() {
    let chatOpen = false;
    let chatHistory = [];

    const responses = [
        { keywords: ['vip', 'membership', 'tier', 'upgrade'],
          reply: '🌟 <b>VIP Tiers</b> unlock exclusive investment plans and higher daily limits:<br>VIP 1 – $50 · VIP 2 – $500 · VIP 3 – $3,000 · VIP 4 – $5,000 · VIP 5 – $10,000+<br><br>Visit the <b>Invest</b> section to upgrade your membership.' },
        { keywords: ['invest', 'plan', 'portfolio', 'roi', 'return'],
          reply: '📈 Goalign offers <b>institutional-grade</b> investment plans with daily ROI from <b>2%–25%</b>.<br><br>Go to <b>Invest → Hot Plans</b> and select a plan that matches your VIP level to get started.' },
        { keywords: ['deposit', 'recharge', 'fund', 'add money', 'topup'],
          reply: '💳 You can deposit funds via <b>P2P trading</b>, bank transfer, or crypto. Click <b>Recharge</b> on the home screen or navigate to the <b>P2P</b> section to buy USDT.' },
        { keywords: ['withdraw', 'cash out', 'payout', 'withdrawal'],
          reply: '💰 Withdrawals are processed within <b>24 hours</b>. Click the <b>Withdraw</b> button on the home screen. Limits depend on your VIP tier.' },
        { keywords: ['p2p', 'peer', 'trade', 'buy crypto'],
          reply: '🤝 Our <b>P2P Marketplace</b> lets you buy and sell crypto directly with other users at competitive rates. Choose your fiat currency, select an offer, and start trading in minutes.' },
        { keywords: ['fee', 'commission', 'charge', 'cost'],
          reply: '💡 Goalign charges a competitive <b>0.1% maker/taker fee</b> on trades. VIP members enjoy reduced fees and priority settlement.' },
        { keywords: ['security', 'safe', 'secure', 'hack', 'protect'],
          reply: '🔐 <b>Your funds are safe.</b> We use 256-bit encryption, 2FA, and cold storage for 98% of assets. Our platform is regulated and carries institutional insurance.' },
        { keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'greet'],
          reply: '👋 Hello! I\'m <b>Goalign AI</b>, your personal crypto & investment assistant. How can I help you today?' },
        { keywords: ['thank', 'thanks', 'great', 'awesome', 'perfect'],
          reply: '😊 You\'re welcome! Is there anything else I can help you with?' },
        { keywords: ['support', 'help', 'contact', 'agent', 'human'],
          reply: '🎧 Need a human agent? Our <b>24/7 support team</b> is ready to help. You can also visit the <b>Help Center</b> section for FAQs and guides.' },
        { keywords: ['earn', 'staking', 'yield', 'passive'],
          reply: '💎 The <b>Earn</b> section offers high-yield staking products with APY starting from <b>8%</b>. Perfect for long-term holders who want passive income.' },
    ];

    function smartReply(text) {
        const lower = text.toLowerCase();
        
        // Dynamic price checks
        if (lower.includes('btc') || lower.includes('bitcoin')) {
            const btc = coins.find(c => c.id === 'btc');
            return `📊 <b>BTC / USD</b> is currently trading at <b>$${btc.price.toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2})}</b> with a 24h change of <span style="color:#14F195">+2.4%</span>.<br><br>Check the <b>Prices</b> tab for live market data.`;
        }
        if (lower.includes('eth') || lower.includes('ethereum')) {
            const eth = coins.find(c => c.id === 'eth');
            return `📊 <b>ETH / USD</b> is currently at <b>$${eth.price.toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2})}</b>. Visit the <b>Prices</b> section for full market depth.`;
        }

        for (const r of responses) {
            if (r.keywords.some(k => lower.includes(k))) {
                return typeof r.reply === 'function' ? r.reply() : r.reply;
            }
        }
        return `🤔 That's a great question! For detailed help on <i>"${text}"</i>, please visit our <b>Help Center</b> or ask our live support team. I'm continuously learning to serve you better!`;
    }

    function appendMessage(role, html) {
        const container = document.getElementById('chatbot-messages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = `chat-msg ${role}`;
        if (role === 'bot') {
            div.innerHTML = `<div class="bot-avatar">AI</div><div class="chat-bubble">${html}</div>`;
        } else {
            div.innerHTML = `<div class="chat-bubble">${html}</div>`;
        }
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function showTyping() {
        const container = document.getElementById('chatbot-messages');
        if (!container) return null;
        const div = document.createElement('div');
        div.className = 'chat-msg bot';
        div.id = 'chat-typing-indicator';
        div.innerHTML = `<div class="bot-avatar">AI</div><div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return div;
    }

    function initChatbot() {
        setTimeout(() => {
            appendMessage('bot', '👋 Hi! I\'m <b>Goalign AI</b>, your personal crypto & investment expert!<br><br>Ask me about VIP plans, investments, deposits, or live prices. I\'m here to help!');
        }, 600);

        const input = document.getElementById('chatbot-input');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') window.sendChatMessage();
            });
        }
    }

    window.toggleChatbot = function() {
        const panel = document.getElementById('chatbot-panel');
        const badge = document.querySelector('#chatbot-fab .chat-badge');
        if (!panel) return;
        chatOpen = !chatOpen;
        panel.classList.toggle('open', chatOpen);
        if (badge) badge.style.display = chatOpen ? 'none' : 'flex';
        if (chatOpen && chatHistory.length === 0) {
            initChatbot();
        }
        if (chatOpen) {
            setTimeout(() => {
                const input = document.getElementById('chatbot-input');
                if (input) input.focus();
            }, 350);
        }
    };

    window.sendChatMessage = function() {
        const input = document.getElementById('chatbot-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        input.value = '';

        appendMessage('user', text);
        chatHistory.push({ role: 'user', text });

        const typingEl = showTyping();
        const delay = 700 + Math.random() * 600;

        setTimeout(() => {
            if (typingEl) typingEl.remove();
            const reply = smartReply(text);
            appendMessage('bot', reply);
            chatHistory.push({ role: 'bot', text: reply });
        }, delay);
    };

    window.sendQuickReply = function(text) {
        const panel = document.getElementById('chatbot-panel');
        if (!panel || !panel.classList.contains('open')) {
            window.toggleChatbot();
            setTimeout(() => window.sendQuickReply(text), 400);
            return;
        }
        const input = document.getElementById('chatbot-input');
        if (input) input.value = text;
        window.sendChatMessage();
    };
})();

// Explicit Window Bindings (Immediate)
// These were redundant or causing ReferenceErrors because the functions are already bound to window or defined differently.
// Removed to restore script execution.

// ============================================================
// BATCH 1: NOTIFICATIONS CENTER
// ============================================================
const notifications = [
    { id: 1, icon: '📈', title: 'BTC surged 4.2%', body: 'Bitcoin crossed $67,000 — your alert triggered.', time: '2m ago', read: false },
    { id: 2, icon: '✅', title: 'Investment Active', body: 'VIP 2 Premium plan is now accruing returns.', time: '1h ago', read: false },
    { id: 3, icon: '💸', title: 'Transfer Completed', body: '$500 USDT successfully sent to peer @FastNode.', time: '3h ago', read: false },
    { id: 4, icon: '🎉', title: 'Welcome to Goalign', body: 'Your account is verified. Explore the platform!', time: '1d ago', read: false },
    { id: 5, icon: '🔐', title: 'Security Alert', body: 'New device login detected. Review sessions.', time: '2d ago', read: true },
    { id: 6, icon: '📰', title: 'Market Update', body: 'ETH 2.0 upgrade coming — check the news feed.', time: '3d ago', read: true },
];

window.showToast = function(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast-notif';
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const icon = icons[type] || 'ℹ️';
    
    toast.innerHTML = `
        <div style="font-size: 1.5rem;">${icon}</div>
        <div>
            <div style="font-weight: 800; font-size: 0.9rem; color: #FFFFFF;">${title}</div>
            <div style="font-size: 0.8rem; color: rgba(255,255,255,0.7);">${message}</div>
        </div>
        <div class="toast-progress" id="toast-prog"></div>
    `;
    
    document.body.appendChild(toast);
    
    const prog = toast.querySelector('#toast-prog');
    prog.style.transition = 'width 3s linear';
    setTimeout(() => prog.style.width = '0%', 10);

    setTimeout(() => {
        toast.style.animation = 'toastPop 0.4s var(--ease-spring) reverse forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};

window.pushNotification = function(title, body, icon = '🔔', type = 'info') {
    const newNotif = {
        id: Date.now(),
        icon,
        title,
        body,
        time: 'Just now',
        read: false
    };
    notifications.unshift(newNotif);
    if (notifications.length > 50) notifications.pop();
    renderNotifications();
    showToast(title, body, type);
};

function renderNotifications() {
    const list = document.getElementById('notif-list');
    if (!list) return;
    const unread = notifications.filter(n => !n.read);
    const badge = document.getElementById('notif-badge');
    if (badge) {
        badge.textContent = unread.length;
        badge.style.display = unread.length > 0 ? 'flex' : 'none';
        badge.classList.add('pulse'); // Add pulsing effect to badge
    }
    list.innerHTML = notifications.map(n => `
        <div onclick="readNotification(${n.id})" class="notif-item" style="padding: 1.1rem 1.5rem; display: flex; gap: 1rem; align-items: flex-start; cursor: pointer; background: ${n.read ? 'transparent' : 'rgba(0,168,107,0.05)'}; border-bottom: 1px solid var(--card-border); transition: all 0.2s;">
            <div style="font-size: 1.5rem; flex-shrink: 0;">${n.icon}</div>
            <div style="flex: 1;">
                <div style="font-weight: ${n.read ? '600' : '800'}; font-size: 0.9rem; margin-bottom: 0.2rem; color: var(--text-main);">${n.title}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">${n.body}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.3rem; font-weight: 600;">${n.time}</div>
            </div>
            ${!n.read ? '<div style="width: 8px; height: 8px; background: var(--accent-green); border-radius: 50%; flex-shrink: 0; margin-top: 4px; box-shadow: 0 0 8px var(--accent-green);"></div>' : ''}
        </div>
    `).join('');
}

window.toggleNotifications = function() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const isOpen = panel.style.display === 'flex';
    panel.style.display = isOpen ? 'none' : 'flex';
    panel.style.flexDirection = 'column';
    if (!isOpen) {
        renderNotifications();
        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', closeNotifOnOutside, { once: true });
        }, 10);
    }
};

function closeNotifOnOutside(e) {
    const panel = document.getElementById('notif-panel');
    const btn = document.getElementById('notif-btn');
    if (panel && !panel.contains(e.target) && !btn?.contains(e.target)) {
        panel.style.display = 'none';
    }
}

window.readNotification = function(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif) notif.read = true;
    renderNotifications();
};

window.markAllRead = function() {
    notifications.forEach(n => n.read = true);
    renderNotifications();
    showToast('Notifications', 'All notifications marked as read', 'success');
};

// ============================================================
// BATCH 1: COMMAND PALETTE (Ctrl+K)
// ============================================================
const searchItems = [
    { label: 'Home', icon: '🏠', action: () => navigate('home') },
    { label: 'Market Prices', icon: '📊', action: () => navigate('prices') },
    { label: 'P2P Marketplace', icon: '🤝', action: () => navigate('p2p') },
    { label: 'Crypto Exchange', icon: '💱', action: () => navigate('crypto') },
    { label: 'Stocks', icon: '📈', action: () => navigate('stocks') },
    { label: 'Earn / Staking', icon: '💎', action: () => navigate('earn') },
    { label: 'Invest Portfolios', icon: '💰', action: () => navigate('invest') },
    { label: 'Debit Cards', icon: '💳', action: () => navigate('cards') },
    { label: 'My Portfolio', icon: '📂', action: () => navigate('portfolio') },
    { label: 'Transfer Funds', icon: '↔️', action: () => navigate('transfer') },
    { label: 'VIP Packages', icon: '👑', action: () => navigate('vip') },
    { label: 'My Account / Mine', icon: '👤', action: () => navigate('mine') },
    { label: 'Alpha Trading', icon: '⚡', action: () => navigate('alpha') },
    { label: 'Bitcoin (BTC)', icon: '₿', action: () => navigate('prices') },
    { label: 'Ethereum (ETH)', icon: '🔷', action: () => navigate('prices') },
    { label: 'Solana (SOL)', icon: '◎', action: () => navigate('prices') },
    { label: 'Invest in BTC Portfolio', icon: '🚀', action: () => { navigate('invest'); } },
    { label: 'Dark Mode Toggle', icon: '🌙', action: () => toggleTheme() },
    { label: 'Help / FAQs', icon: '❓', action: () => navigate('support') },
    { label: 'News Feed', icon: '📰', action: () => navigate('home') },
];

let searchIndex = -1;

window.toggleSearchPalette = function() {
    const palette = document.getElementById('search-palette');
    if (!palette) return;
    const isOpen = palette.style.display === 'flex';
    if (isOpen) {
        closeSearchPalette();
    } else {
        palette.style.display = 'flex';
        const input = document.getElementById('search-input');
        if (input) { 
            input.value = ''; 
            input.focus(); 
        }
        searchIndex = -1;
        runSearch('');
    }
};

window.closeSearchPalette = function(e) {
    if (e && e.target !== document.getElementById('search-palette')) return;
    const palette = document.getElementById('search-palette');
    if (palette) palette.style.display = 'none';
};

window.runSearch = function(query) {
    const results = document.getElementById('search-results');
    if (!results) return;
    const q = query.toLowerCase().trim();
    const matches = q === '' ? searchItems.slice(0, 8) :
        searchItems.filter(item => item.label.toLowerCase().includes(q));
    if (matches.length === 0) {
        results.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No results for "${query}"</div>`;
        return;
    }
    results.innerHTML = matches.map((item, i) => `
        <div onclick="searchSelect(${i})" class="search-item ${i === searchIndex ? 'active' : ''}" style="padding: 0.85rem 1.25rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; cursor: pointer; margin-bottom: 2px; transition: all 0.15s;">
            <span style="font-size: 1.2rem; width: 32px; text-align: center;">${item.icon}</span>
            <span style="font-weight: 600; font-size: 0.95rem;">${item.label}</span>
            <span style="margin-left: auto; font-size: 0.75rem; color: var(--text-muted); background: var(--bg-secondary); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--card-border);">↵</span>
        </div>
    `).join('');
    // Store for click handler
    window._searchMatches = matches;
};

window.searchSelect = function(idx) {
    const matches = window._searchMatches || searchItems;
    if (matches[idx]) {
        matches[idx].action();
        const palette = document.getElementById('search-palette');
        if (palette) palette.style.display = 'none';
    }
};

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
    const palette = document.getElementById('search-palette');
    const isSearchOpen = palette && palette.style.display === 'flex';

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        window.toggleSearchPalette();
    }
    
    if (isSearchOpen) {
        const matches = window._searchMatches || [];
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            searchIndex = (searchIndex + 1) % matches.length;
            runSearch(document.getElementById('search-input').value);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            searchIndex = (searchIndex - 1 + matches.length) % matches.length;
            runSearch(document.getElementById('search-input').value);
        } else if (e.key === 'Enter' && searchIndex > -1) {
            e.preventDefault();
            searchSelect(searchIndex);
        }
    }

    if (e.key === 'Escape') {
        if (isSearchOpen) palette.style.display = 'none';
        const panel = document.getElementById('notif-panel');
        if (panel) panel.style.display = 'none';
    }
});

// ============================================================
// BATCH 1: WATCHLIST (FAVORITES)
// ============================================================
let watchlist = JSON.parse(localStorage.getItem('goalign_watchlist') || '[]');
let priceFilter = 'all'; // 'all' or 'watchlist'

window.toggleWatchlist = function(coinId, el) {
    if (watchlist.includes(coinId)) {
        watchlist = watchlist.filter(id => id !== coinId);
        el.style.color = 'var(--text-muted)';
    } else {
        watchlist.push(coinId);
        el.style.color = 'var(--premium-gold, #EBA96B)';
        showToast('Watchlist', `Added to your watchlist`, 'success');
    }
    localStorage.setItem('goalign_watchlist', JSON.stringify(watchlist));
};

window.setPriceFilter = function(filter, el) {
    priceFilter = filter;
    document.querySelectorAll('#prices .filter-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    renderPrices();
};

// Override renderPrices to support watchlist filter and favorites
const _origRenderPrices = window.renderPrices;
window.renderPrices = function() {
    const tbody = document.getElementById('prices-body');
    if (!tbody) return;

    const searchTerm = (document.getElementById('coin-search')?.value || '').toLowerCase();
    let filtered = coins.filter(c => c.name.toLowerCase().includes(searchTerm) || c.symbol.toLowerCase().includes(searchTerm));
    if (priceFilter === 'watchlist') filtered = filtered.filter(c => watchlist.includes(c.id));

    tbody.innerHTML = filtered.map(coin => `
        <tr class="${watchlist.includes(coin.id) ? 'fav-row' : ''}">
            <td>
                <span class="fav-star" onclick="toggleWatchlist('${coin.id}', this)" style="cursor:pointer; color: ${watchlist.includes(coin.id) ? 'var(--premium-gold,#EBA96B)' : 'var(--text-muted)'}; font-size: 1.1rem; transition: color 0.2s;">
                    <i class="fa-solid fa-star"></i>
                </span>
            </td>
            <td>
                <div class="coin-info">
                    <div class="coin-icon" style="background: ${coin.color}20; color: ${coin.color}">${coin.symbol[0]}</div>
                    <div>
                        <div style="font-weight: 600;">${coin.name}</div>
                        <div style="color: var(--text-muted); font-size: 0.8rem;">${coin.symbol}</div>
                    </div>
                </div>
            </td>
            <td class="text-right price-cell" id="price-${coin.id}"><b>$${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></td>
            <td class="text-right" style="color: ${coin.change24 >= 0 ? 'var(--accent-green)' : '#ff3e3e'}">
                ${coin.change24 >= 0 ? '+' : ''}${coin.change24}%
            </td>
            <td class="text-right" style="color: ${coin.change7 >= 0 ? 'var(--accent-green)' : '#ff3e3e'}">
                ${coin.change7 >= 0 ? '+' : ''}${coin.change7}%
            </td>
            <td class="text-right">$${coin.cap}</td>
            <td class="text-center">
                <canvas class="sparkline" height="40" width="100" data-color="${coin.change7 >= 0 ? '#00A86B' : '#ff3e3e'}" data-coin-id="${coin.id}"></canvas>
            </td>
            <td class="text-right" style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
                <button class="btn btn-ghost btn-sm" title="Set Alert" onclick="openAlertModal('${coin.symbol}', ${coin.price.toFixed(2)})" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">🔔</button>
                <button class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.85rem;" onclick="openBuyModal('${coin.symbol}')">Buy</button>
            </td>
        </tr>
    `).join('');

    if (priceFilter === 'watchlist' && filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 3rem; color: var(--text-muted);">⭐ Star coins to add them to your watchlist</td></tr>`;
    }
    drawSparklines();
};

// ============================================================
// BATCH 2: PORTFOLIO PERFORMANCE CHART (ENHANCED)
// ============================================================
function drawBalanceHistoryChart() {
    const canvas = document.getElementById('balance-history-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = 200;
    const labels = ['Oct','Nov','Dec','Jan','Feb','Mar'];
    const data = [12000, 13500, 11800, 16200, 14800, 17420];
    const min = Math.min(...data) - 1000;
    const max = Math.max(...data) + 1000;
    const toY = v => H - 30 - ((v - min) / (max - min)) * (H - 50);
    const toX = i => 50 + (i / (data.length - 1)) * (W - 60);

    // Grid Lines
    ctx.strokeStyle = 'rgba(128,128,128,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const y = 20 + i * ((H - 50) / 4);
        ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(W, y); ctx.stroke();
        ctx.fillStyle = 'var(--text-muted)'; ctx.font = `10px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText('$' + ((max - i * (max - min) / 4) / 1000).toFixed(0) + 'k', 44, y + 4);
    }

    // Area Fill (Aurora Gradient)
    const fillGrad = ctx.createLinearGradient(0, 0, 0, H);
    fillGrad.addColorStop(0, 'rgba(0,168,107,0.15)');
    fillGrad.addColorStop(1, 'rgba(0,168,107,0)');
    
    ctx.beginPath();
    data.forEach((v, i) => { const x = toX(i), y = toY(v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.lineTo(toX(data.length - 1), H - 30);
    ctx.lineTo(toX(0), H - 30);
    ctx.closePath();
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Main Line (Glow effect)
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0,168,107,0.3)';
    ctx.beginPath();
    data.forEach((v, i) => { const x = toX(i), y = toY(v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
    lineGrad.addColorStop(0, '#627EEA'); lineGrad.addColorStop(1, '#00A86B');
    ctx.strokeStyle = lineGrad; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.shadowBlur = 0; // Reset

    // Data Points
    labels.forEach((lbl, i) => {
        ctx.fillStyle = 'var(--text-muted)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(lbl, toX(i), H - 8);
        const x = toX(i), y = toY(data[i]);
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#00A86B'; ctx.fill();
        ctx.strokeStyle = 'var(--bg-primary)'; ctx.lineWidth = 2; ctx.stroke();
    });
}

function drawAllocationChart() {
    const canvas = document.getElementById('allocation-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 250;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const data = [65, 25, 10]; // BTC, ETH, Stables
    const colors = ['#EBA96B', '#627EEA', '#00A86B'];
    let startAngle = -Math.PI / 2;

    data.forEach((val, i) => {
        const sliceAngle = (val / 100) * (Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(size / 2, size / 2);
        ctx.arc(size / 2, size / 2, size / 2.5, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        
        const grad = ctx.createRadialGradient(size/2, size/2, 10, size/2, size/2, size/2);
        grad.addColorStop(0, colors[i] + '40');
        grad.addColorStop(1, colors[i]);
        ctx.fillStyle = grad;
        ctx.fill();
        
        startAngle += sliceAngle;
    });

    // Inner hole (Doughnut)
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/4, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--bg-secondary)';
    ctx.fill();
}

function drawPerformanceChart() {
    const canvas = document.getElementById('performance-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 300 * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = 300;

    const data = [0.1, 0.4, 0.2, 0.8, 0.6, 0.95, 1.2]; // PnL multipliers
    const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    
    ctx.beginPath();
    ctx.strokeStyle = 'var(--accent-green)';
    ctx.lineWidth = 3;
    data.forEach((v, i) => {
        const x = (i / (data.length - 1)) * (W - 40) + 20;
        const y = H - 50 - (v / 1.5) * (H - 100);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Bars
    data.forEach((v, i) => {
        const x = (i / (data.length - 1)) * (W - 40) + 20;
        const barH = (v / 1.5) * (H - 100);
        const grad = ctx.createLinearGradient(0, H - 50, 0, H - 50 - barH);
        grad.addColorStop(0, 'rgba(0,168,107,0.05)');
        grad.addColorStop(1, 'rgba(0,168,107,0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(x - 10, H - 50 - barH, 20, barH);
        
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x, H - 20);
    });
}

function initAlpha() {
    const canvas = document.getElementById('alpha-chart');
    if (!canvas) return;
    const update = () => {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentNode.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const W = rect.width;
        const H = rect.height;

        ctx.clearRect(0, 0, W, H);
        ctx.beginPath();
        ctx.strokeStyle = '#627EEA';
        ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
            const x = (i / 19) * W;
            const y = H/2 + Math.sin(Date.now()/500 + i/2) * 50;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        requestAnimationFrame(update);
    };
    update();
}

// ============================================================
// BATCH 2: YIELD CALCULATOR
// ============================================================
window.toggleYieldCalc = function() {
    const modal = document.getElementById('yield-calc-modal');
    if (modal) modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
};

window.calculateYield = function() {
    const amount = parseFloat(document.getElementById('yc-amount')?.value) || 0;
    const roi = parseFloat(document.getElementById('yc-roi')?.value) || 0;
    const duration = parseFloat(document.getElementById('yc-days')?.value) || 0;
    const totalYield = amount * (roi / 100) * duration;
    const daily = amount * (roi / 100);
    const el = document.getElementById('yc-result');
    if (el) el.innerHTML = `
        <div style="text-align:center; padding: 1.5rem 0;">
            <div style="font-size: 2.5rem; font-weight: 900; color: var(--accent-green); font-family:'JetBrains Mono';">+$${totalYield.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            <div style="color:var(--text-muted); margin-top:0.5rem;">Estimated Yield over ${duration} days</div>
            <div style="margin-top:1rem; font-size:0.9rem;">Daily: <b>$${daily.toFixed(2)}</b> | Total return: <b>${(roi * duration).toFixed(1)}%</b></div>
        </div>`;
};

// ============================================================
// BATCH 2: TAX REPORT CSV EXPORT
// ============================================================
window.exportTransactionsCSV = function() {
    if (!transactions || transactions.length === 0) {
        showToast('Export', 'No transactions to export', 'info');
        return;
    }
    const headers = ['ID', 'Type', 'Asset', 'Amount', 'Date', 'Status'];
    const rows = transactions.map(t => [t.id, t.type, t.asset, t.amount, t.date, t.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'goalign_transactions.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('Export', 'Tax report downloaded as CSV', 'success');
    pushNotification('Tax Report Exported', 'Your transaction history is ready: goalign_transactions.csv', '📑', 'success');
};

// ============================================================
// BATCH 3: POST A TRADE (P2P)
// ============================================================
window.togglePostTrade = function() {
    const modal = document.getElementById('post-trade-modal');
    if (modal) modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
};

window.submitPostTrade = function() {
    const type = document.getElementById('pt-type')?.value || 'buy';
    const asset = document.getElementById('pt-asset')?.value || 'USDT';
    const fiat = document.getElementById('pt-fiat')?.value || 'USD';
    const price = parseFloat(document.getElementById('pt-price')?.value) || 1;
    const min = parseFloat(document.getElementById('pt-min')?.value) || 100;
    const max = parseFloat(document.getElementById('pt-max')?.value) || 1000;
    const payment = document.getElementById('pt-payment')?.value || 'Bank Transfer';

    const newAd = {
        id: Date.now(),
        user: 'You (UID:10482937)',
        orders: 0,
        rate: 100,
        type, asset, fiat, price,
        limitMin: min, limitMax: max,
        payments: [payment]
    };
    p2pAds.unshift(newAd);
    window.togglePostTrade();
    renderP2PAds();
    showToast('P2P', 'Your ad has been posted!', 'success');
};

// ============================================================
// BATCH 3: TRADE CHAT
// ============================================================
let tradeChatTimer = null;
let tradeChatCountdown = 900; // 15 minutes

window.openTradeChat = function(adId) {
    const ad = p2pAds.find(a => a.id === adId) || { user: 'Trader', asset: 'USDT' };
    const modal = document.getElementById('trade-chat-modal');
    if (!modal) return;
    document.getElementById('trade-chat-title').textContent = `Trade with ${ad.user}`;
    document.getElementById('trade-chat-messages').innerHTML = `
        <div class="chat-msg bot"><div class="chat-bubble" style="background:var(--bg-secondary);color:var(--text-main);border:1px solid var(--card-border);">🤝 Trade initiated! Funds are secured in escrow. Please complete payment within 15 minutes.</div></div>
        <div class="chat-msg bot"><div class="chat-bubble" style="background:var(--bg-secondary);color:var(--text-main);border:1px solid var(--card-border);">💬 ${ad.user}: Hello! Please send payment to my account and click "Payment Sent".</div></div>
    `;
    modal.style.display = 'flex';
    tradeChatCountdown = 900;
    if (tradeChatTimer) clearInterval(tradeChatTimer);
    tradeChatTimer = setInterval(() => {
        tradeChatCountdown--;
        const el = document.getElementById('trade-timer');
        if (el) {
            const m = Math.floor(tradeChatCountdown / 60).toString().padStart(2,'0');
            const s = (tradeChatCountdown % 60).toString().padStart(2,'0');
            el.textContent = `${m}:${s}`;
            el.style.color = tradeChatCountdown < 120 ? '#ff3e3e' : 'var(--accent-green)';
        }
        if (tradeChatCountdown <= 0) {
            clearInterval(tradeChatTimer);
            showToast('Trade Expired', 'Payment window closed. Trade cancelled.', 'error');
            window.closeTradeChat();
        }
    }, 1000);
};

window.closeTradeChat = function() {
    const modal = document.getElementById('trade-chat-modal');
    if (modal) modal.style.display = 'none';
    if (tradeChatTimer) { clearInterval(tradeChatTimer); tradeChatTimer = null; }
};

window.sendTradeMessage = function() {
    const input = document.getElementById('trade-chat-input');
    if (!input?.value.trim()) return;
    const container = document.getElementById('trade-chat-messages');
    const msg = input.value.trim();
    container.innerHTML += `<div class="chat-msg user"><div class="chat-bubble">${msg}</div></div>`;
    input.value = '';
    container.scrollTop = container.scrollHeight;
    setTimeout(() => {
        const replies = ['Payment received, releasing crypto now! ✅', 'Please send to the account ending in 4521.', 'I can confirm the amount. Please proceed.', 'Great, escrow will release in 2 minutes.'];
        container.innerHTML += `<div class="chat-msg bot"><div class="chat-bubble" style="background:var(--bg-secondary);color:var(--text-main);border:1px solid var(--card-border);">${replies[Math.floor(Math.random() * replies.length)]}</div></div>`;
        container.scrollTop = container.scrollHeight;
    }, 1200);
};

window.markTradePaid = function() {
    showToast('Payment Sent', 'Notifying seller... Waiting for confirmation.', 'info');
    setTimeout(() => {
        showToast('Trade Complete! 🎉', 'Crypto released from escrow to your wallet.', 'success');
        pushNotification('Trade Completed', 'Successfully received USDT from P2P trade.', '🤝', 'success');
        window.closeTradeChat();
    }, 3000);
};

// Badge helper
function getRepBadge(orders) {
    if (orders >= 3000) return '<span style="background:linear-gradient(135deg,#a8edea,#fed6e3);color:#333;padding:1px 6px;border-radius:4px;font-size:0.6rem;font-weight:800;margin-left:4px;">💎 DIAMOND</span>';
    if (orders >= 1000) return '<span style="background:linear-gradient(135deg,#e0e0e0,#a0a0a0);color:#fff;padding:1px 6px;border-radius:4px;font-size:0.6rem;font-weight:800;margin-left:4px;">🥈 PLATINUM</span>';
    if (orders >= 500) return '<span style="background:linear-gradient(135deg,#f7971e,#ffd200);color:#333;padding:1px 6px;border-radius:4px;font-size:0.6rem;font-weight:800;margin-left:4px;">🥇 GOLD</span>';
    return '';
}

// Patch P2P render to include badges and trade chat
const _origRenderP2PAds = renderP2PAds;
function renderP2PAds() {
    const list = document.getElementById('p2p-ads-list');
    if (!list) return;

    const filtered = p2pAds.filter(ad => ad.type === p2pActiveType && ad.asset === p2pActiveAsset && ad.fiat === p2pActiveFiat);

    if (filtered.length === 0) {
        list.innerHTML = `<div style="padding: 3rem; text-align: center; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--card-border);">
            <p style="color: var(--text-muted);">No advertisements found for ${p2pActiveAsset} in ${p2pActiveFiat}.</p>
        </div>`;
        return;
    }

    const symbol = fiatSymbols[p2pActiveFiat] || '';
    list.innerHTML = filtered.map(ad => `
        <div class="market-list-item" style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 0.8fr; align-items: center; padding: 1.5rem; border-radius: 16px;">
            <div>
                <div style="font-weight: 800; font-size: 1.1rem; display: flex; align-items: center; gap: 0.6rem; color: var(--text-main);">
                    ${ad.user}${getRepBadge(ad.orders)}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem; font-weight: 600;">
                    ${ad.orders} orders | <span style="color: var(--text-main);">${ad.rate}% completion</span>
                </div>
            </div>
            <div>
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; margin-bottom: 0.25rem;">Price</div>
                <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent-green); font-family: 'JetBrains Mono', monospace;">${symbol}${ad.price.toLocaleString()}</div>
            </div>
            <div>
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; margin-bottom: 0.25rem;">Limit / Available</div>
                <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-main);">${symbol}${ad.limitMin.toLocaleString()} - ${symbol}${ad.limitMax.toLocaleString()}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem; display: flex; gap: 0.5rem;">
                    ${ad.payments.map(p => `<span style="background: var(--bg-secondary); padding: 1px 6px; border-radius: 4px; border: 1px solid var(--card-border);">${p}</span>`).join('')}
                </div>
            </div>
            <div style="text-align: right;">
                <button class="btn ${ad.type === 'buy' ? 'btn-primary' : 'btn-ghost'}"
                    style="width: 100%; border-radius: 10px; font-weight: 800; padding: 0.75rem;"
                    onclick="initiateP2PTrade(${ad.id})">
                    ${ad.type === 'buy' ? 'Buy ' + ad.asset : 'Sell ' + ad.asset}
                </button>
            </div>
        </div>
    `).join('');
}

// Patch initiateP2PTrade to open chat
window.initiateP2PTrade = function(adId) {
    const ad = p2pAds.find(a => a.id === adId);
    if (!ad) return;
    showToast('Escrow', 'Securing funds in escrow...', 'info');
    setTimeout(() => {
        openTradeChat(adId);
    }, 1000);
};

// ============================================================
// BATCH 4: 2FA SIMULATION
// ============================================================
let pendingAuthAction = null;
const MOCK_OTP = '248163';

window.show2FA = function(action) {
    pendingAuthAction = action;
    const modal = document.getElementById('otp-modal');
    if (modal) { modal.style.display = 'flex'; document.getElementById('otp-input')?.focus(); }
};

window.verify2FA = function() {
    const entered = document.getElementById('otp-input')?.value;
    if (entered === MOCK_OTP) {
        const modal = document.getElementById('otp-modal');
        if (modal) modal.style.display = 'none';
        showToast('2FA Verified ✅', 'Identity confirmed. Proceeding...', 'success');
        if (typeof pendingAuthAction === 'function') pendingAuthAction();
    } else {
        showToast('2FA Failed', `Invalid code. Try: ${MOCK_OTP}`, 'error');
    }
};

// ============================================================
// BATCH 4: SESSION MANAGEMENT
// ============================================================
const mockSessions = [
    { id: 1, device: 'Chrome / Windows 11', location: 'New York, US', ip: '192.168.1.1', time: 'Active now', current: true },
    { id: 2, device: 'Safari / iPhone 15', location: 'Lagos, NG', ip: '10.0.0.55', time: '2 hours ago', current: false },
    { id: 3, device: 'Firefox / MacOS', location: 'London, UK', ip: '185.92.220.3', time: '1 day ago', current: false },
];

function renderSessions() {
    const container = document.getElementById('sessions-list');
    if (!container) return;
    container.innerHTML = mockSessions.map(s => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--card-border);">
            <div style="display: flex; gap: 1rem; align-items: center;">
                <i class="fa-solid ${s.device.includes('iPhone') ? 'fa-mobile-screen' : 'fa-desktop'}" style="color:var(--accent-green); font-size: 1.3rem;"></i>
                <div>
                    <div style="font-weight: 700; font-size: 0.9rem;">${s.device}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${s.location} • ${s.ip} • ${s.time}</div>
                </div>
            </div>
            ${s.current ? '<span style="font-size:0.7rem;padding:2px 8px;background:rgba(0,168,107,0.1);color:var(--accent-green);border-radius:100px;font-weight:800;">CURRENT</span>'
            : `<button onclick="revokeSession(${s.id})" class="btn btn-ghost btn-sm" style="padding:0.3rem 0.8rem;font-size:0.8rem;color:#ff3e3e;border-color:#ff3e3e;">Revoke</button>`}
        </div>
    `).join('');
}

window.revokeSession = function(id) {
    const idx = mockSessions.findIndex(s => s.id === id);
    if (idx > -1) mockSessions.splice(idx, 1);
    renderSessions();
    showToast('Session Revoked', 'Device has been logged out', 'success');
};

// ============================================================
// BATCH 4: REFERRAL SYSTEM
// ============================================================
const referralCode = 'GOALIGN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
let referralEarnings = 147.50;

function renderReferral() {
    const el = document.getElementById('referral-section');
    if (!el) return;
    const link = `https://goalign.app/ref/${referralCode}`;
    el.innerHTML = `
        <div style="background:var(--bg-secondary);padding:2rem;border-radius:16px;border:1px solid var(--card-border);">
            <h3 style="margin-bottom:0.5rem;">🎁 Referral Program</h3>
            <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:1.5rem;">Earn 10% commission on every friend's investment</p>
            <div style="background:var(--bg-primary);padding:1rem;border-radius:12px;border:1px solid var(--card-border);margin-bottom:1rem;">
                <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.4rem;">YOUR REFERRAL CODE</div>
                <div style="font-weight:900;font-size:1.3rem;font-family:'JetBrains Mono';color:var(--accent-green);letter-spacing:0.1em;">${referralCode}</div>
            </div>
            <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem;">
                <input readonly value="${link}" style="flex:1;background:var(--bg-primary);border:1px solid var(--card-border);border-radius:8px;padding:0.6rem 1rem;color:var(--text-main);font-size:0.8rem;" onclick="this.select()"/>
                <button class="btn btn-primary btn-sm" onclick="navigator.clipboard?.writeText('${link}');showToast('Copied!','Link copied to clipboard','success')">Copy</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div style="background:var(--bg-primary);padding:1rem;border-radius:12px;text-align:center;">
                    <div style="font-size:1.5rem;font-weight:800;color:var(--accent-green);">$${referralEarnings.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);">Total Earned</div>
                </div>
                <div style="background:var(--bg-primary);padding:1rem;border-radius:12px;text-align:center;">
                    <div style="font-size:1.5rem;font-weight:800;">3</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);">Friends Referred</div>
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// BATCH 5: LIVE PRICE POLLING (CoinGecko + Fallback)
// ============================================================
async function fetchLivePrices() {
    try {
        const ids = 'bitcoin,ethereum,solana,ripple,cardano,avalanche-2,polkadot,dogecoin,matic-network,chainlink';
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        const map = {
            'bitcoin': 'btc', 'ethereum': 'eth', 'solana': 'sol', 'ripple': 'xrp',
            'cardano': 'ada', 'avalanche-2': 'avax', 'polkadot': 'dot',
            'dogecoin': 'doge', 'matic-network': 'matic', 'chainlink': 'link'
        };
        Object.entries(data).forEach(([apiId, vals]) => {
            const coinId = map[apiId];
            const coin = coins.find(c => c.id === coinId);
            if (coin && vals.usd) {
                const oldPrice = coin.price;
                coin.price = vals.usd;
                coin.change24 = parseFloat((vals.usd_24h_change || 0).toFixed(2));
                flashPriceCell(coin.id, coin.price > oldPrice);
            }
        });
        renderTicker();
        renderHomeMarket();
        if (document.getElementById('prices')?.classList.contains('active')) renderPrices();
    } catch (e) {
        // Fallback to jitter simulation (already handled by updatePrices)
    }
}

function flashPriceCell(coinId, isUp) {
    const cell = document.getElementById(`price-${coinId}`);
    if (!cell) return;
    cell.style.transition = 'background 0.3s';
    cell.style.background = isUp ? 'rgba(0,168,107,0.2)' : 'rgba(255,62,62,0.2)';
    setTimeout(() => cell.style.background = 'transparent', 800);
}

// Live data polling (every 30s)
fetchLivePrices();
setInterval(fetchLivePrices, 30000);

// ============================================================
// BATCH 5: NEWS FEED WIDGET
// ============================================================
const newsArticles = [
    { title: 'Bitcoin Hits New ATH Amid Institutional Inflows', summary: 'Major institutions including BlackRock and Fidelity report record BTC purchases this quarter.', tag: 'BTC', time: '5m ago', color: '#F7931A', emoji: '₿' },
    { title: 'Ethereum Dencun Upgrade Slashes Layer-2 Fees', summary: 'Transaction fees on Arbitrum and Optimism have dropped by over 90% following the Dencun network upgrade.', tag: 'ETH', time: '1h ago', color: '#627EEA', emoji: '🔷' },
    { title: 'Solana DeFi TVL Surpasses $8B Milestone', summary: 'Solana\'s DeFi ecosystem continues explosive growth, with total value locked reaching new highs.', tag: 'SOL', time: '3h ago', color: '#14F195', emoji: '◎' },
    { title: 'SEC Approves Spot Ethereum ETF Applications', summary: 'The SEC has greenlit multiple spot ETH ETF applications, marking a major milestone for crypto adoption.', tag: 'ETH', time: '6h ago', color: '#627EEA', emoji: '🔷' },
    { title: 'XRP Legal Victory: Ripple Wins Against SEC', summary: 'A federal court has ruled in favor of Ripple, setting precedent for crypto regulatory clarity.', tag: 'XRP', time: '1d ago', color: '#23292F', emoji: '💧' },
    { title: 'Dogecoin Surges 18% on Musk Partnership Rumors', summary: 'DOGE saw explosive gains amid reports of a new DOGE-based payments integration at X (formerly Twitter).', tag: 'DOGE', time: '2d ago', color: '#C2A633', emoji: '🐕' },
];

function renderNewsFeed() {
    const container = document.getElementById('news-feed');
    if (!container) {
        console.warn('renderNewsFeed: #news-feed not found');
        return;
    }
    console.log('renderNewsFeed: Found container, populating...');
    container.innerHTML = newsArticles.map(article => `
        <div style="background:var(--card-bg);border:1px solid var(--card-border);border-radius:16px;padding:1.25rem;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--card-shadow)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'" onclick="showToast('${article.tag} News','${article.title}','info')">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
                        <span style="background:${article.color}20;color:${article.color};padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:800;">${article.tag}</span>
                        <span style="font-size:0.75rem;color:var(--text-muted);">${article.time}</span>
                    </div>
                    <div style="font-weight:700;font-size:0.95rem;line-height:1.4;margin-bottom:0.4rem;">${article.title}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);line-height:1.5;">${article.summary}</div>
                </div>
                <div style="width:48px;height:48px;border-radius:12px;background:${article.color}20;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">${article.emoji}</div>
            </div>
        </div>
    `).join('');
}

// ============================================================
// BATCH 5: STOP-LOSS / TAKE-PROFIT ALERTS
// ============================================================
let priceAlerts = [];

window.openAlertModal = function(symbol, currentPrice) {
    const modal = document.getElementById('alert-modal');
    if (!modal) return;
    document.getElementById('alert-coin-name').textContent = symbol;
    document.getElementById('alert-current-price').textContent = `$${parseFloat(currentPrice).toFixed(2)}`;
    document.getElementById('alert-price-input').value = parseFloat(currentPrice).toFixed(2);
    modal.style.display = 'flex';
};

window.closeAlertModal = function() {
    const modal = document.getElementById('alert-modal');
    if (modal) modal.style.display = 'none';
};

window.saveAlert = function() {
    const symbol = document.getElementById('alert-coin-name')?.textContent;
    const price = parseFloat(document.getElementById('alert-price-input')?.value);
    const type = document.getElementById('alert-type')?.value;
    if (!symbol || isNaN(price)) return;
    priceAlerts.push({ symbol, price, type, id: Date.now() });
    window.closeAlertModal();
    showToast('Alert Set 🔔', `${type === 'above' ? 'Take-profit' : 'Stop-loss'} at $${price.toLocaleString()} for ${symbol}`, 'success');
};

// Monitor alerts
setInterval(() => {
    priceAlerts.forEach((alert, i) => {
        const coin = coins.find(c => c.symbol === alert.symbol);
        if (!coin) return;
        const hit = (alert.type === 'above' && coin.price >= alert.price) || (alert.type === 'below' && coin.price <= alert.price);
        if (hit) {
            pushNotification(`🚨 Alert: ${alert.symbol}`, `${alert.type === 'above' ? 'Take-profit' : 'Stop-loss'} triggered at $${coin.price.toFixed(2)}`, '🚨', 'warning');
            priceAlerts.splice(i, 1);
        }
    });
}, 5000);

// ============================================================
// BATCH 5: ORDER BOOK DEPTH CHART
// ============================================================
function drawDepthChart() {
    const canvas = document.getElementById('depth-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 120 * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = 120;
    const mid = W / 2;

    const bidData = [0, 2, 5, 12, 22, 38, 62, 90, 128, 175];
    const askData = [0, 3, 7, 14, 25, 40, 65, 95, 132, 180];
    const maxVal = Math.max(...bidData, ...askData);

    // Bid area (left, green)
    ctx.beginPath();
    ctx.moveTo(mid, H - 10);
    bidData.forEach((v, i) => {
        const x = mid - (i / (bidData.length - 1)) * (mid - 10);
        const y = H - 10 - (v / maxVal) * (H - 20);
        ctx.lineTo(x, y);
    });
    ctx.lineTo(10, H - 10);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,168,107,0.2)';
    ctx.fill();
    ctx.strokeStyle = '#00A86B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    bidData.forEach((v, i) => {
        const x = mid - (i / (bidData.length - 1)) * (mid - 10);
        const y = H - 10 - (v / maxVal) * (H - 20);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Ask area (right, red)
    ctx.beginPath();
    ctx.moveTo(mid, H - 10);
    askData.forEach((v, i) => {
        const x = mid + (i / (askData.length - 1)) * (W - mid - 10);
        const y = H - 10 - (v / maxVal) * (H - 20);
        ctx.lineTo(x, y);
    });
    ctx.lineTo(W - 10, H - 10);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,62,62,0.2)';
    ctx.fill();
    ctx.strokeStyle = '#ff3e3e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    askData.forEach((v, i) => {
        const x = mid + (i / (askData.length - 1)) * (W - mid - 10);
        const y = H - 10 - (v / maxVal) * (H - 20);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Center line
    ctx.strokeStyle = 'var(--accent-green)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(mid, 0); ctx.lineTo(mid, H); ctx.stroke();
    ctx.setLineDash([]);
}

// ============================================================
// BATCH 5: ONBOARDING WIZARD
// ============================================================
window.onboardStep = function(step) {
    for (let i = 1; i <= 3; i++) {
        const el = document.getElementById(`onboarding-step-${i}`);
        if (el) el.style.display = i === step ? 'block' : 'none';
    }
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`ob-dot-${i}`);
        if (dot) dot.style.background = i === step ? 'var(--accent-green)' : 'var(--card-border)';
    }
};

window.skipOnboarding = function() {
    localStorage.setItem('goalign_onboarded', '1');
    const modal = document.getElementById('onboarding-modal');
    if (modal) modal.style.display = 'none';
};

function checkOnboarding() {
    if (!localStorage.getItem('goalign_onboarded')) {
        const modal = document.getElementById('onboarding-modal');
        if (modal) {
            modal.style.display = 'flex';
            onboardStep(1);
            pushNotification('Welcome Agent', 'Ready to start your financial journey? Follow the guide!', '👋', 'info');
        }
    }
}

// EXTENDED WINDOW BINDINGS
// Redundant bindings removed. Functions are already attached to window.
window.toggleNotifications = window.toggleNotifications;
window.markAllRead = window.markAllRead;
window.readNotification = window.readNotification;
window.toggleSearchPalette = window.toggleSearchPalette;
window.closeSearchPalette = window.closeSearchPalette;
window.runSearch = window.runSearch;
window.searchSelect = window.searchSelect;
window.toggleWatchlist = window.toggleWatchlist;
window.setPriceFilter = window.setPriceFilter;
window.toggleYieldCalc = window.toggleYieldCalc;
window.calculateYield = window.calculateYield;
window.exportTransactionsCSV = window.exportTransactionsCSV;
window.togglePostTrade = window.togglePostTrade;
window.submitPostTrade = window.submitPostTrade;
window.openTradeChat = window.openTradeChat;
window.closeTradeChat = window.closeTradeChat;
window.sendTradeMessage = window.sendTradeMessage;
window.markTradePaid = window.markTradePaid;
window.show2FA = window.show2FA;
window.verify2FA = window.verify2FA;
window.revokeSession = window.revokeSession;
window.openAlertModal = window.openAlertModal;
window.closeAlertModal = window.closeAlertModal;
window.saveAlert = window.saveAlert;
window.onboardStep = window.onboardStep;
window.skipOnboarding = window.skipOnboarding;
window.submitPostTrade = window.submitPostTrade;
window.drawDepthChart = drawDepthChart;

// End of app.js
})();

