export const state = {
  manufacturer: 'Hersteller A',
  series: 'PREMIUM',
  frameForm: 'Elegant',
  openDirection: 'DIN links nach innen öffnend',
  doorForm: 'Ohne Seitenteile ohne Oberlicht',
  model: 'Istanbul',
  outHex: '#383E42',
  inSame: true,
  inHex: '#F2F2F2',
  width: 1180,
  height: 2180,
  view: 'Außen',
  theme: 'Tag'
};

export const $ = (s, p = document) => p.querySelector(s);
export const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));

export function parseDoorForm(s) {
  const both = /links & rechts/.test(s);
  return {
    left: both || /links/.test(s),
    right: both || /rechts/.test(s),
    transom: /Oberlicht/.test(s)
  };
}
