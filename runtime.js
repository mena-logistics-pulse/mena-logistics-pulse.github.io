/* Minimal standalone runtime: loads the open-data files and provides dash.data / dash.calc / dash.draw. */
(function(){
  const FILES = { teu:'teu.csv', air:'air.csv', lpi:'lpi.csv', lsci:'lsci.csv', gii:'gii.csv', mletr:'mletr.csv', gscpi:'gscpi.csv', wci:'wci.csv', cppi:'cppi.csv', iata:'iata.csv', wto:'wto.csv', geo:'geo.json' };
  const raw = {}, calcs = {}, draws = {}, cache = {};
  let ready = false;
  function data(id){
    if (raw[id]) return raw[id];
    if (calcs[id]) {
      if (!ready) return { status:'loading', data:[] };
      if (!cache[id]) {
        const ins = calcs[id].inputs.map(data);
        if (ins.some(d => d.status !== 'ok')) return { status: ins.some(d => d.status === 'error') ? 'error' : 'loading', data:[] };
        try { cache[id] = { status:'ok', data: calcs[id].fn(...ins.map(d => d.data)) }; }
        catch (e) { console.error('calc', id, e); cache[id] = { status:'error', data:[] }; }
      }
      return cache[id];
    }
    return { status: ready ? 'missing' : 'loading', data:[] };
  }
  function run(name){
    if (!draws[name]) return;
    document.querySelectorAll('[data-draw="'+name+'"]').forEach(el => { try { draws[name](el); } catch (e) { console.error('draw', name, e); } });
  }
  window.dash = {
    colors: ['#2dd4bf','#38bdf8','#a78bfa','#f472b6','#fbbf24','#fb7185','#a3e635','#fb923c'],
    data, calc: (n, o) => { calcs[n] = o; },
    draw: (n, fn) => { if (fn) { draws[n] = fn; if (ready) run(n); } else run(n); }
  };
  Promise.all(Object.entries(FILES).map(([id, url]) =>
    (url.endsWith('.json') ? d3.json(url) : d3.csv(url))
      .then(d => { raw[id] = { status:'ok', data: url.endsWith('.json') ? d : Array.from(d) }; })
      .catch(e => { console.error('load', id, e); raw[id] = { status:'error', data:[] }; })
  )).then(() => { ready = true; Object.keys(draws).forEach(run); });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => Object.keys(draws).forEach(run), 250); });
})();
