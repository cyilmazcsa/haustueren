import { state, $, parseDoorForm } from './state.js';

const fmtEUR = n => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n);

const PRICE_TABLE = {
  base: { PREMIUM: 2899, EXCLUSIV: 3299 },
  frameForm: { Elegant: 0, Modern: 68.47, Klassik: 111.94 },
  doorForm: {
    "Ohne Seitenteile ohne Oberlicht": 0,
    "Seitenteil links ohne Oberlicht": 390,
    "Seitenteil rechts ohne Oberlicht": 390,
    "Seitenteil links & rechts ohne Oberlicht": 780,
    "Ohne Seitenteil mit Oberlicht": 350,
    "Seitenteil links mit Oberlicht": 740,
    "Seitenteil rechts mit Oberlicht": 740,
    "Seitenteil links & rechts mit Oberlicht": 1130,
  },
  model: { Bursa: 150 },
  color: {
    '#383E42': 0,
    '#F2F2F2': 0,
    '#1F2326': 0,
    '#6E6B63': 180,
    '#6B3E2E': 240,
  },
  insideDifferent: 60,
  sizeSurcharge(width,height){ let s=0; if(width>1300) s+=200; else if(width>1100) s+=80; if(height>2300) s+=220; else if(height>2200) s+=120; return s; }
};

function calcPrice(st){
  let total = PRICE_TABLE.base[st.series];
  total += PRICE_TABLE.frameForm[st.frameForm];
  total += PRICE_TABLE.doorForm[st.doorForm];
  total += PRICE_TABLE.color[st.outHex] || 0;
  if(!st.inSame){
    total += PRICE_TABLE.insideDifferent + (PRICE_TABLE.color[st.inHex]||0)/2;
  }
  total += PRICE_TABLE.model[st.model] || 0;
  total += PRICE_TABLE.sizeSurcharge(st.width, st.height);
  const items = [];
  items.push(['Grundpreis '+st.series, PRICE_TABLE.base[st.series]]);
  const rf = PRICE_TABLE.frameForm[st.frameForm]; if(rf) items.push(['Rahmenform: '+st.frameForm, rf]);
  const df = PRICE_TABLE.doorForm[st.doorForm]; if(df) items.push(['Türform', df]);
  const oc = PRICE_TABLE.color[st.outHex]||0; if(oc) items.push(['Außenfarbe', oc]);
  if(!st.inSame){ items.push(['Innenfarbe', PRICE_TABLE.insideDifferent + (PRICE_TABLE.color[st.inHex]||0)/2]); }
  const md = PRICE_TABLE.model[st.model]||0; if(md) items.push(['Modell: '+st.model, md]);
  const sz = PRICE_TABLE.sizeSurcharge(st.width, st.height); if(sz) items.push(['Größenaufschlag', sz]);
  return { total, breakdown: items };
}

function renderDIN(k) {
  const isL = /links/.test(k), isIn = /innen/.test(k);
  const pivotX = isL ? 30 : 70;
  const arc = isIn ? `A 40 40 0 0 ${isL ? 1 : 0}` : `A 40 40 0 0 ${isL ? 0 : 1}`;
  const arcPath = `M ${pivotX} 30 ${arc} ${isL ? 70 : 30} 70`;
  return `
  <svg viewBox="0 0 100 100" width="120" height="90">
    <rect x="6" y="6" width="88" height="88" fill="#fafafa" stroke="#475569" stroke-width="2"/>
    <line x1="${pivotX}" y1="30" x2="${pivotX}" y2="70" stroke="#111" stroke-width="3"/>
    <path d="${arcPath}" stroke="#111" stroke-dasharray="4" stroke-width="2" fill="none"/>
    ${[0.2,0.5,0.8].map(t=>`<circle cx="${pivotX}" cy="${30+(70-30)*t}" r="2.3" fill="#111"/>`).join('')}
  </svg>`;
}

function renderModel(name,x,y,w,h){
  const g = (xx,yy,ww,hh,r=6)=>`<g><rect x="${xx}" y="${yy}" width="${ww}" height="${hh}" rx="${r}" fill="#e8f2f6" stroke="#9fb8c4"/><rect x="${xx}" y="${yy}" width="${ww}" height="${hh}" rx="${r}" fill="#a8c5d1" opacity=".55"/></g>`;
  const d = (xx,yy,ww,hh,r=4)=>`<rect x="${xx}" y="${yy}" width="${ww}" height="${hh}" rx="${r}" fill="#11111115" stroke="#00000020"/>`;
  const pad = Math.min(w,h)*.06;
  switch(name){
    case 'Istanbul':{const gw=Math.min(80,w*.12), gap=gw*.6, total=gw*3+gap*2, start=x+(w-total)/2, gy=y+pad, gh=h-pad*2; return [0,1,2].map(i=>g(start+i*(gw+gap),gy,gw,gh)).join('');}
    case 'Ankara':{const gw=Math.min(70,w*.1), gx=x+w*.68; return g(gx,y+pad,gw,h-2*pad);}
    case 'Izmir':{const s=Math.min(100,w*.18), gap=s*.35, total=s*3+gap*2, x0=x+(w-total)/2, y0=y+h*.22; return [0,1,2].map(i=>g(x0+i*(s+gap),y0,s,s)).concat([0,1].map(i=>g(x0+(s+gap)/2+i*(s+gap),y0+s+gap,s,s))).join('');}
    case 'Bursa':{const ww=w*.7,hh=h*.42,xx=x+(w-ww)/2,yy=y+pad; return g(xx,yy+hh*.25,ww,hh*.75,16)+`<path d="M ${xx} ${yy+hh*.25} A ${ww/2} ${hh/2} 0 0 1 ${xx+ww} ${yy+hh*.25}" stroke="#00000020" fill="none" stroke-width="8"/>`;}
    case 'Antalya':{const gw=Math.min(60,w*.08), gx=x+w*.12; return g(gx,y+pad,gw,h-2*pad)+d(x+w*.48,y+pad,8,h-2*pad);}
    case 'Konya':{const ww=w*.6,hh=h*.28,xx=x+(w-ww)/2,gp=h*.06,y1=y+pad,y2=y1+hh+gp; return g(xx,y1,ww,hh,10)+g(xx,y2,ww,hh,10);}
    case 'Adana':{const s=Math.min(120,w*.18); return d(x+w*.15,y+h*.65,w*.7,10)+g(x+w*.6,y+pad,s,s);}
    case 'Gaziantep':{const ww=Math.min(90,w*.12); let out=g(x+(w-ww)/2,y+pad,ww,h*.7); for(let i=0;i<4;i++){const yy=y+h*.75+i*18; out+=d(x+w*.18,yy,w*.64,8);} return out;}
    case 'Kayseri':{const gw=Math.min(50,w*.07), gp=gw*.5, total=gw*4+gp*3, xx=x+w-(w*.12+total), yy=y+pad, hh=h-2*pad; return [0,1,2,3].map(i=>g(xx+i*(gw+gp),yy,gw,hh)).join('');}
    case 'Trabzon':{const ww=w*.5,hh=h*.5,xx=x+(w-ww)/2,yy=y+(h-hh)/2-h*.08; return g(xx,yy,ww,hh,12)+d(x+w*.15,yy+hh+20,w*.7,10);}
  }
  return '';
}

export function render(){
  const scene = $('#sceneBox');
  const {left,right,transom} = parseDoorForm(state.doorForm);
  const FRAME=48, GAP=5, SIDE=330, TRANS=360;
  const sideL = left?SIDE:0, sideR = right?SIDE:0, transH = transom?TRANS:0;
  const leafW = Math.max(700, state.width - sideL - sideR);
  const leafH = Math.max(1800, state.height - transH);
  const totalW = sideL+leafW+sideR, totalH=leafH+transH;
  const sc=0.86, fT=FRAME*sc, gap=GAP*sc, sideL2=sideL*sc, sideR2=sideR*sc, trans2=transH*sc, leafW2=leafW*sc, leafH2=leafH*sc,
 tW=totalW*sc, tH=totalH*sc;
  const offX=220, offY=140, viewW=tW+fT*3+560, viewH=tH+fT*3+260;
  const night = state.theme==='Abend';
  const hingeLeft = /links/.test(state.openDirection);
  const frameRx = state.frameForm==='Elegant'?18:state.frameForm==='Modern'?0:8;
  const doorColor = state.view==='Außen' ? state.outHex : (state.inSame? state.outHex : state.inHex);
  document.body.classList.toggle('dark', night);

  const { total: price, breakdown } = calcPrice(state);

  const wallGrad = night?`url(#wallNight)`:`url(#wallDay)`;
  const lampFill = night? '#ffdf7a':'#ffd54f';
  const glassTop = night? '#dfe8f1':'#e9f4fb';
  const glassMid = night? '#9fb6c7':'#bdd2de';
  const glassBot = night? '#7b97a8':'#a2bbc8';

  scene.innerHTML = `
  <svg viewBox="0 0 ${viewW} ${viewH}" style="width:100%;height:100%">
    <defs>
      <linearGradient id="wallDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f7f8f9"/><stop offset="100%" stop-color="#e9edf0"/></linearGradient>
      <linearGradient id="wallNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1f2937"/><stop offset="100%" stop-color="#111827"/></linearGradient>
      <linearGradient id="pave" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${night?'#5d646d':'#c9ced3'}"/><stop offset="100%" stop-color="${night?'#4a5159':'#aaafb6'}"/></linearGradient>
      <pattern id="tiles" width="42" height="26" patternUnits="userSpaceOnUse"><rect width="42" height="26" fill="url(#pave)"/><path d="M0 0 H42 M0 13 H42 M21 0 V26" stroke="${night?'#222831':'#80858b'}" opacity=".35"/></pattern>
      <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#8a8d92"/><stop offset="50%" stop-color="#cdd1d6"/><stop offset="100%" stop-color="#6b6e73"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${glassTop}"/><stop offset="60%" stop-color="${glassMid}"/><stop offset="100%" stop-color="${glassBot}"/></linearGradient>
      <linearGradient id="terra" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#cc7a49"/><stop offset="100%" stop-color="#70442a"/></linearGradient>
      <linearGradient id="mat" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${night?'#111':'#404040'}"/><stop offset="100%" stop-color="${night?'#000':'#222'}"/></linearGradient>
      <filter id="ds"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity="${night?0.45:0.25}"/></filter>
    </defs>

    <rect x="0" y="0" width="${viewW}" height="${viewH}" fill="${wallGrad}"/>
    <rect x="0" y="${offY + tH + fT*1.6}" width="${viewW}" height="140" fill="url(#tiles)"/>
    <g filter="url(#ds)">
      <rect x="${offX-50}" y="${offY + tH + fT*1.1}" width="${tW + fT*2 + 100}" height="18" rx="4" fill="${night?'#707880':'#b9bec4'}"/>
      <rect x="${offX-60}" y="${offY + tH + fT*1.1 + 18}" width="${tW + fT*2 + 120}" height="12" rx="3" fill="${night?'#5b626a':'#9fa5ab'}"/>
    </g>

    <!-- Hausnummer + Lampe + Briefkasten + Matte -->
    <g>
      <rect x="${offX-90}" y="${offY+10}" width="38" height="38" rx="6" fill="${night?'#0b0f14':'#111'}"/>
      <text x="${offX-71}" y="${offY+36}" text-anchor="middle" font-size="20" fill="${night?'#cbd5e1':'#fff'}" font-family="ui-sans-serif">27</text>
      <g filter="url(#ds)" transform="translate(${offX + tW + fT + 30}, ${offY + 40})">
        <rect x="-8" y="-8" width="16" height="32" rx="4" fill="${night?'#0b0f14':'#111'}"/>
        <rect x="-22" y="22" width="44" height="10" rx="5" fill="${lampFill}"/>
      </g>
      <g filter="url(#ds)" transform="translate(${offX - 110}, ${offY + 160})">
        <rect x="0" y="0" width="70" height="50" rx="8" fill="${night?'#5f6b75':'#7b8790'}"/>
        <rect x="8" y="12" width="54" height="8" rx="4" fill="${night?'#c7d0d6':'#cbd5db'}"/>
        <rect x="8" y="30" width="40" height="6" rx="3" fill="${night?'#44515c':'#5b6b75'}"/>
      </g>
      <rect x="${offX + fT + 20}" y="${offY + tH + fT*1.05 + 4}" width="${leafW2*0.6}" height="18" rx="4" fill="url(#mat)"/>
    </g>

    <!-- Pflanze -->
    <g transform="translate(${offX + tW + fT*2 + 110}, ${offY + tH + fT*1.05})">
      <ellipse cx="0" cy="6" rx="44" ry="12" fill="#000" opacity="${night?0.35:0.25}"/>
      <g filter="url(#ds)">
        <ellipse cx="0" cy="-128" rx="52" ry="18" fill="#5a3a28" opacity="${night?0.45:0.35}"/>
        <rect x="-50" y="-144" width="100" height="100" rx="16" fill="url(#terra)"/>
        <ellipse cx="0" cy="-144" rx="48" ry="12" fill="#e1b08a"/>
        <ellipse cx="0" cy="-144" rx="44" ry="10" fill="#4a3b2f"/>
      </g>
      ${Array.from({length:14}).map((_,i)=>{const a=-Math.PI/2+(i-6)*0.18, len=160+Math.sin(i)*26, x2=Math.cos(a)*len, y2=Math.sin(a)*len; return `<path d="M0 -140 Q ${x2*.25} ${-140+y2*.25} ${x2} ${-140+y2}" stroke="${night?'#2a5f3e':'#2f6e44'}" stroke-width="5" fill="none" stroke-linecap="round"/>`;}).join('')}
      ${Array.from({length:34}).map((_,i)=>{const ang=i/34*6.2831, x=Math.cos(ang)*70, y=-170+Math.sin(ang)*52; const c = (i%2?(night?'#3a9a6f':'#46b07a') : (night?'#267b55':'#2e8a57')); return `<ellipse cx="${x}" cy="${y}" rx="14" ry="24" fill="${c}" opacity=".98"/>`;}).join('')}
    </g>

    <!-- Rahmen & Füllungen -->
    <g filter="url(#ds)">
      <rect x="${offX+fT/2}" y="${offY+fT/2}" width="${tW+fT}" height="${tH+fT}" rx="${frameRx}" fill="${night?'#e5e7eb':'#f8f8f8'}" stroke="${night?'#9aa3ad':'#c8c8c8'}" stroke-width="${fT}" />
      ${trans2>0? `<g><rect x="${offX+fT}" y="${offY+fT}" width="${tW}" height="${trans2}" fill="url(#metal)"/><rect x="${offX+fT+10}" y="${offY+fT+10}" width="${tW-20}" height="${trans2-20}" rx="6" fill="url(#glass)"/></g>`:''}
      ${sideL2>0? `<g><rect x="${offX+fT}" y="${offY+fT+trans2}" width="${sideL2}" height="${leafH2}" fill="url(#metal)"/><rect x="${offX+fT+10}" y="${offY+fT+trans2+10}" width="${sideL2-20}" height="${leafH2-20}" rx="6" fill="url(#glass)"/></g>`:''}
      ${sideR2>0? `<g><rect x="${offX+fT+sideL2+leafW2}" y="${offY+fT+trans2}" width="${sideR2}" height="${leafH2}" fill="url(#metal)"/><rect x="${offX+fT+sideL2+leafW2+10}" y="${offY+fT+trans2+10}" width="${sideR2-20}" height="${leafH2-20}" rx="6" fill="url(#glass)"/></g>`:''}
      <rect x="${offX+fT+sideL2+gap}" y="${offY+fT+trans2+gap}" width="${leafW2-gap*2}" height="${leafH2-gap*2}" rx="${Math.max(2,frameRx-8)}" fill="${doorColor}"/>
      ${renderModel(state.model, offX+fT+sideL2+gap, offY+fT+trans2+gap, leafW2-gap*2, leafH2-gap*2)}
      ${[0.18,0.5,0.82].map(p=>{const hw=18*sc,hh=8*sc,y=offY+fT+trans2+gap+(leafH2-gap*2)*p-hh/2,x=hingeLeft?offX+fT+sideL2+gap-hw:offX+fT+sideL2+gap+(leafW2-gap*2);return `<rect x="${x}" y="${y}" width="${hw}" height="${hh}" rx="2" fill="url(#metal)"/>`;}).join('')}
      ${(()=>{const barLen=Math.min(130,(leafH2-gap*2)*0.22),thk=8,cy=offY+fT+trans2+gap+(leafH2-gap*2)*0.55,isRight=!hingeLeft,x=isRight?offX+fT+sideL2+gap+(leafW2-gap*2)-24:offX+fT+sideL2+gap+24;return `<rect x="${x-thk/2}" y="${cy-barLen/2}" width="${thk}" height="${barLen}" rx="${thk/2}" fill="url(#metal)"/><circle cx="${x}" cy="${cy}" r="10" fill="${night?'#0f172a':'#1a1a1a'}"/>`;})()}
    </g>

    <!-- Öffnungsrichtung (Planansicht klein) -->
    <g transform="translate(${offX + tW + fT + 140}, ${offY + 12}) scale(.9)">
      ${renderDIN(state.openDirection)}
    </g>
  </svg>`;

  // Summary UI
  $('#priceValue').textContent = fmtEUR(price);
  const sum = $('#summaryGrid'); sum.innerHTML = '';
  const pb = $('#priceBreakdown');
  pb.innerHTML = breakdown.map(([l,a])=>`<div><span>${l}</span><span>${fmtEUR(a)}</span></div>`).join('');
  const outColorName = $('#colOut').selectedOptions[0].textContent;
  const inColorName = state.inSame ? 'gleich Außen' : $('#colIn').selectedOptions[0].textContent;
  const rows = [
    ['Hersteller', state.manufacturer],
    ['Serie', state.series],
    ['Rahmenform', state.frameForm],
    ['Öffnungsrichtung', state.openDirection],
    ['Türform', state.doorForm],
    ['Modell', state.model],
    ['Außenfarbe', outColorName],
    ['Innenfarbe', inColorName],
    ['Breite', state.width + ' mm'],
    ['Höhe', state.height + ' mm'],
  ];
  rows.forEach(([l,v])=>{
    const d=document.createElement('div'); d.innerHTML=`<div class="muted" style="font-size:12px">${l}</div><div style="font-weight:600">${v}</div>`;
    sum.appendChild(d);
  });
  $('#modeLabel').textContent = state.theme==='Tag'?'Tageslicht-Szene':'Abendmodus mit Beleuchtung';
}
