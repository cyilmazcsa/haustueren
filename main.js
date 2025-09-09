import { state, $, $$ } from './state.js';
import { render } from './render.js';

function bindOptionGroup(containerSel, key){
  const box = $(containerSel);
  box.addEventListener('click', e=>{
    const el = e.target instanceof HTMLElement ? e.target.closest('.opt') : null;
    if(!el) return;
    $$('.opt', box).forEach(x=>x.classList.remove('active'));
    el.classList.add('active');
    state[key] = el.dataset.v;
    render();
  });
}

bindOptionGroup('#frameForm','frameForm');
bindOptionGroup('#opening','openDirection');
bindOptionGroup('#doorForm','doorForm');
bindOptionGroup('#model','model');

$('#manufacturer').onchange = e=>{state.manufacturer=e.target.value; render();};
$('#series').onchange = e=>{state.series=e.target.value; render();};
$('#colOut').onchange = e=>{state.outHex=e.target.value; if(state.inSame) $('#colIn').value='same'; render();};
$('#inDifferent').onchange = e=>{
  state.inSame = e.target.value==='no';
  $('#colIn').disabled = state.inSame;
  if(state.inSame) $('#colIn').value='same';
  render();
};
$('#colIn').onchange = e=>{
  const v=e.target.value; if(v!=='same'){state.inHex=v;}
  render();
};
$('#width').oninput = e=>{state.width = Math.max(900, Number(e.target.value||0));};
$('#height').oninput = e=>{state.height = Math.max(2000, Number(e.target.value||0));};
$('#width').onchange = ()=>render();
$('#height').onchange = ()=>render();

$('#viewSelect').onchange = e=>{state.view=e.target.value; syncViewSeg(); render();};
$('#viewSeg').addEventListener('click',e=>{
  const b = e.target instanceof HTMLElement ? e.target.closest('button') : null;
  if(!b) return;
  state.view=b.dataset.v; syncViewSeg(); $('#viewSelect').value=state.view; render();
});
$('#viewSeg2').addEventListener('click',e=>{
  const b = e.target instanceof HTMLElement ? e.target.closest('button') : null;
  if(!b) return;
  state.view=b.dataset.v; syncViewSeg(); $('#viewSelect').value=state.view; render();
});
function syncViewSeg(){
  $$('#viewSeg button, #viewSeg2 button').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.v===state.view);
  });
}
$('#toggleTheme').onclick = ()=>{state.theme = state.theme==='Tag'?'Abend':'Tag'; $('#toggleTheme').textContent = state.theme==='Tag'?'Abendmodus':'Tagmodus'; render();};

const presets = {
  modernAnth: ()=>{ state.frameForm='Modern'; state.doorForm='Ohne Seitenteile ohne Oberlicht'; state.outHex='#383E42'; state.model='Istanbul'; },
  klassikWhite: ()=>{ state.frameForm='Klassik'; state.doorForm='Ohne Seitenteil mit Oberlicht'; state.outHex='#F2F2F2'; state.model='Bursa'; },
  woodTop: ()=>{ state.frameForm='Elegant'; state.doorForm='Seitenteil links & rechts mit Oberlicht'; state.outHex='#6B3E2E'; state.model='Konya'; },
  elegantDb: ()=>{ state.frameForm='Elegant'; state.doorForm='Seitenteil rechts ohne Oberlicht'; state.outHex='#6E6B63'; state.model='Kayseri'; },
};
$$('[data-preset]').forEach(b=> b.addEventListener('click', ()=>{
  presets[b.dataset.preset]();
  $$('#frameForm .opt').forEach(x=>x.classList.toggle('active', x.dataset.v===state.frameForm));
  $$('#doorForm .opt').forEach(x=>x.classList.toggle('active', x.dataset.v===state.doorForm));
  $$('#model .opt').forEach(x=>x.classList.toggle('active', x.dataset.v===state.model));
  $('#colOut').value = state.outHex;
  render();
}));

render();
