(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[{id:`btc`,name:`Bitcoin`,symbol:`BTC`,price:64231.5,change24:2.4,change7:12.1,cap:`1.2T`,color:`#F7931A`},{id:`eth`,name:`Ethereum`,symbol:`ETH`,price:3452.12,change24:-1.2,change7:5.4,cap:`415B`,color:`#627EEA`},{id:`sol`,name:`Solana`,symbol:`SOL`,price:142.33,change24:8.5,change7:22.4,cap:`63B`,color:`#14F195`},{id:`xrp`,name:`XRP`,symbol:`XRP`,price:.62,change24:.5,change7:-2.1,cap:`34B`,color:`#23292F`},{id:`ada`,name:`Cardano`,symbol:`ADA`,price:.45,change24:-2.3,change7:-8.4,cap:`16B`,color:`#0033AD`},{id:`avax`,name:`Avalanche`,symbol:`AVAX`,price:54.21,change24:4.2,change7:15.6,cap:`20B`,color:`#E84142`},{id:`dot`,name:`Polkadot`,symbol:`DOT`,price:9.12,change24:1.1,change7:4.2,cap:`13B`,color:`#E6007A`},{id:`doge`,name:`Dogecoin`,symbol:`DOGE`,price:.16,change24:12.1,change7:35.2,cap:`23B`,color:`#C2A633`},{id:`matic`,name:`Polygon`,symbol:`MATIC`,price:.98,change24:-.4,change7:2.1,cap:`9B`,color:`#8247E5`},{id:`link`,name:`Chainlink`,symbol:`LINK`,price:18.45,change24:3.2,change7:10.4,cap:`10B`,color:`#2A5ADA`}],t=[];function n(){e.forEach(e=>{let t=(Math.random()-.5)*.002;e.price*=1+t}),r(),a()}function r(){let t=document.getElementById(`prices-body`);if(!t)return;let n=document.getElementById(`coin-search`).value.toLowerCase();t.innerHTML=e.filter(e=>e.name.toLowerCase().includes(n)||e.symbol.toLowerCase().includes(n)).map(e=>`
                <tr>
                    <td><span class="fav-star">★</span></td>
                    <td>
                        <div class="coin-info">
                            <div class="coin-icon" style="background: ${e.color}20; color: ${e.color}">${e.symbol[0]}</div>
                            <div>
                                <div style="font-weight: 600;">${e.name}</div>
                                <div style="color: var(--text-muted); font-size: 0.8rem;">${e.symbol}</div>
                            </div>
                        </div>
                    </td>
                    <td class="text-right"><b>$${e.price.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</b></td>
                    <td class="text-right ${e.change24>=0?`accent-green`:`up`}" style="color: ${e.change24>=0?`var(--accent-green)`:`#ff3e3e`}">
                        ${e.change24>=0?`+`:``}${e.change24}%
                    </td>
                    <td class="text-right" style="color: ${e.change7>=0?`var(--accent-green)`:`#ff3e3e`}">
                        ${e.change7>=0?`+`:``}${e.change7}%
                    </td>
                    <td class="text-right">$${e.cap}</td>
                    <td class="text-center">
                        <canvas class="sparkline" height="40" width="100" data-color="${e.change7>=0?`#00A86B`:`#ff3e3e`}" data-coin-id="${e.id}"></canvas>
                    </td>
                    <td class="text-right">
                        <button class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.85rem;" onclick="openBuyModal('${e.symbol}')">Buy</button>
                    </td>
                </tr>
            `).join(``),o()}function i(){let e=document.getElementById(`active-investments-container`);if(e){if(t.length===0){e.innerHTML=`
                    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--bg-secondary); border: 2px dashed var(--card-border);">
                        <p style="color: var(--text-muted);">No active investments found. Start your first investment today.</p>
                    </div>
                `;return}e.innerHTML=t.map(e=>`
                <div class="stat-card" style="border-left: 4px solid var(--accent-green);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                        <span style="font-weight: 700;">${e.planName}</span>
                        <span class="apy-badge">ACTIVE</span>
                    </div>
                    <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">$${e.amount.toLocaleString()}</div>
                    <p style="color: var(--text-muted); font-size: 0.8rem;">Earning $${(e.amount*e.roi/100).toFixed(2)} daily</p>
                    <div style="margin-top: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.5rem;">
                            <span>Progress</span><span>${e.daysLeft} days left</span>
                        </div>
                        <div style="background: rgba(0,0,0,0.05); height: 6px; border-radius: 3px; overflow: hidden;">
                            <div style="background: var(--accent-green); width: ${(e.duration-e.daysLeft)/e.duration*100}%; height: 100%;"></div>
                        </div>
                    </div>
                </div>
            `).join(``)}}function a(){let t=document.getElementById(`price-ticker`);t&&(t.innerHTML=[...e,...e].map(e=>`
                <div class="ticker-item">
                    <span class="symbol">${e.symbol}</span>
                    <span class="price">$${e.price.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                    <span class="change ${e.change24>=0?`up`:`down`}">
                        ${e.change24>=0?`▲`:`▼`}${Math.abs(e.change24)}%
                    </span>
                </div>
            `).join(``))}function o(){document.querySelectorAll(`.sparkline`).forEach(t=>{let n=t.getContext(`2d`),r=t.dataset.color,i=t.dataset.coinId,a=e.find(e=>e.id===i);if(!a)return;n.clearRect(0,0,t.width,t.height),n.beginPath(),n.strokeStyle=r,n.lineWidth=2;let o=t.width/9,s=a.change7>=0?1:-1;n.moveTo(0,t.height/2);for(let e=1;e<10;e++){let r=e*o,i=(Math.random()-.5)*10,a=t.height/2-e/10*s*15+i;n.lineTo(r,Math.max(5,Math.min(35,a)))}n.stroke()})}function s(){let e=localStorage.getItem(`theme`),t=window.matchMedia(`(prefers-color-scheme: dark)`).matches;(e===`dark`||!e&&t)&&(document.body.classList.add(`dark-mode`),c(!0))}function c(e){let t=document.getElementById(`theme-icon`),n=document.getElementById(`footer-logo`);e?(t.innerHTML=`<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`,n&&(n.style.filter=`brightness(0) invert(1)`)):(t.innerHTML=`
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                `,n&&(n.style.filter=`none`))}s();function l(){t=t.map(e=>{let t=e.amount*(e.roi/100);return{...e,earned:e.earned+t/24}}),document.getElementById(`investments`).classList.contains(`active`)&&i()}setInterval(l,2400);var u=document.createElement(`style`);u.innerHTML=`
            @keyframes toastIn { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
            @keyframes toastOut { to { opacity: 0; transform: translateX(50px); } }
        `,document.head.appendChild(u);function d(){let e=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&e.target.classList.add(`visible`)})},{threshold:.1});document.querySelectorAll(`section > div, .feature-card, .stat-card, .price-table-wrap`).forEach(t=>{t.classList.add(`reveal`),e.observe(t)})}document.getElementById(`faq-search`)?.addEventListener(`input`,e=>{let t=e.target.value.toLowerCase();document.querySelectorAll(`.faq-item`).forEach(e=>{let n=e.innerText.toLowerCase();e.style.display=n.includes(t)?`block`:`none`})});function f(){let e=document.getElementById(`alpha-chart`);if(!e)return;let t=e.getContext(`2d`),n=window.devicePixelRatio||1,r=e.getBoundingClientRect();e.width=r.width*n,e.height=r.height*n,t.scale(n,n);let i=r.width,a=r.height,o=[],s=64200;for(let e=0;e<80;e++)s+=(Math.random()-.48)*150,o.push(s);let c=Math.min(...o)-100,l=Math.max(...o)+100;function u(e){return a-(e-c)/(l-c)*(a-40)-20}t.strokeStyle=`rgba(0,0,0,0.1)`,t.lineWidth=1;for(let e=0;e<6;e++){let n=20+e*((a-40)/5);t.beginPath(),t.moveTo(0,n),t.lineTo(i,n),t.stroke();let r=l-e*((l-c)/5);t.fillStyle=`rgba(0,0,0,0.6)`,t.font=`11px sans-serif`,t.fillText(`$`+r.toFixed(0),8,n-5)}t.beginPath(),t.strokeStyle=`#00A86B`,t.lineWidth=3,o.forEach((e,n)=>{let r=n/79*i,a=u(e);n===0?t.moveTo(r,a):t.lineTo(r,a)}),t.stroke(),t.lineTo(i,a),t.lineTo(0,a),t.closePath(),t.fillStyle=`rgba(0, 168, 107, 0.02)`,t.fill();let d=i,f=u(o[o.length-1]);t.beginPath(),t.arc(d-2,f,4,0,Math.PI*2),t.fillStyle=`#00A86B`,t.fill(),p()}function p(){let e=document.getElementById(`order-book-asks`),t=document.getElementById(`order-book-bids`);if(!e||!t)return;let n=``,r=``,i=64231.5;for(let e=8;e>=1;e--){let t=(i+e*12.5).toFixed(2),r=(Math.random()*2+.1).toFixed(4),a=(t*r).toFixed(2),o=Math.random()*60+10;n+=`<div class="order-book-row">
                    <span style="color:#ff3e3e;">$${t}</span>
                    <span class="text-right">${r}</span>
                    <span class="text-right" style="color:var(--text-muted);">${a}</span>
                    <div class="depth-bar" style="background:#ff3e3e; width:${o}%;"></div>
                </div>`}for(let e=1;e<=8;e++){let t=(i-e*11.3).toFixed(2),n=(Math.random()*2+.1).toFixed(4),a=(t*n).toFixed(2),o=Math.random()*60+10;r+=`<div class="order-book-row">
                    <span style="color:#00A86B;">$${t}</span>
                    <span class="text-right">${n}</span>
                    <span class="text-right" style="color:var(--text-muted);">${a}</span>
                    <div class="depth-bar" style="background:#00A86B; width:${o}%;"></div>
                </div>`}e.innerHTML=n,t.innerHTML=r}function m(){h(),g()}function h(){let e=document.getElementById(`allocation-chart`);if(!e)return;let t=e.getContext(`2d`),n=e.width,r=e.height,i=n/2,a=r/2,o=Math.min(n,r)/2-10,s=o*.6,c=[{pct:.65,color:`#F7931A`,label:`BTC`},{pct:.25,color:`#627EEA`,label:`ETH`},{pct:.1,color:`#00A86B`,label:`Stables`}],l=-Math.PI/2;c.forEach(e=>{let n=l+e.pct*Math.PI*2;t.beginPath(),t.arc(i,a,o,l,n),t.arc(i,a,s,n,l,!0),t.closePath(),t.fillStyle=e.color,t.fill(),t.strokeStyle=`var(--bg-primary)`,t.lineWidth=2,t.stroke(),l=n}),t.fillStyle=`var(--text-main)`,t.font=`bold 18px sans-serif`,t.textAlign=`center`,t.textBaseline=`middle`,t.fillText(`$24,831`,i,a-8),t.font=`12px sans-serif`,t.fillStyle=`var(--text-muted)`,t.fillText(`Total Value`,i,a+14)}function g(){let e=document.getElementById(`performance-chart`);if(!e)return;let t=e.getContext(`2d`),n=window.devicePixelRatio||1,r=e.getBoundingClientRect();e.width=r.width*n,e.height=300*n,t.scale(n,n);let i=r.width,a=[],o=22e3;for(let e=0;e<30;e++)o+=(Math.random()-.4)*500,a.push(o);let s=Math.min(...a)-500,c=Math.max(...a)+500;function l(e){return 270-(e-s)/(c-s)*240}t.strokeStyle=`rgba(0,0,0,0.1)`,t.lineWidth=1;for(let e=0;e<5;e++){let n=30+240/4*e;t.beginPath(),t.moveTo(40,n),t.lineTo(i,n),t.stroke();let r=c-e*((c-s)/4);t.fillStyle=`rgba(0,0,0,0.6)`,t.font=`10px sans-serif`,t.fillText(`$`+(r/1e3).toFixed(1)+`k`,2,n+4)}t.beginPath(),t.strokeStyle=`var(--accent-green)`,t.lineWidth=2.5,a.forEach((e,n)=>{let r=40+n/29*(i-50),a=l(e);n===0?t.moveTo(r,a):t.lineTo(r,a)}),t.stroke();let u=40+29/29*(i-50);t.lineTo(u,270),t.lineTo(40,270),t.closePath(),t.fillStyle=`rgba(0, 168, 107, 0.02)`,t.fill();let d=a[a.length-1],f=l(d);t.beginPath(),t.arc(u,f,5,0,Math.PI*2),t.fillStyle=`var(--accent-green)`,t.fill(),t.strokeStyle=`var(--bg-primary)`,t.lineWidth=2,t.stroke()}window.onload=()=>{r(),a(),setInterval(n,2500),typeof f==`function`&&f(),typeof m==`function`&&m(),d();let e=document.getElementById(`coin-search`);e&&e.addEventListener(`input`,r),console.log(`Goalign Platform Initialized Successfully.`)};