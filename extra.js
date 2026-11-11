(function(){
  const S = window.SCP;
  const el$ = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const isoName = (iso, fb) => S.n(iso, fb);
  S.SECTIONS = [
    { id: 'kpis', en: 'Headline indicators', ar: 'المؤشرات الرئيسية', k: 'kpi teu air turnaround gii ebl wci' },
    { id: 'insights', en: 'Key insights', ar: 'أبرز النتائج', k: 'insight findings' },
    { id: 'pulse', en: '2026 trade and air cargo pulse', ar: 'نبض التجارة والشحن الجوي 2026', k: 'wto iata forecast 2026 air cargo trade outlook' },
    { id: 'ports', en: 'Port efficiency map (CPPI 2025)', ar: 'خريطة كفاءة الموانئ', k: 'cppi port efficiency map salalah tanger hamad' },
    { id: 'index', en: 'MENA Logistics Innovation Index', ar: 'مؤشر الابتكار اللوجستي', k: 'index mlii composite weights' },
    { id: 'profile', en: 'Country profile', ar: 'ملف الدولة', k: 'profile country' },
    { id: 'compare', en: 'Compare economies', ar: 'مقارنة الاقتصادات', k: 'compare benchmark' },
    { id: 'performance', en: 'Logistics performance league (LPI 2.0)', ar: 'ترتيب الأداء اللوجستي', k: 'lpi dwell turnaround partners' },
    { id: 'teu-trend', en: 'Container gateways (TEU)', ar: 'بوابات الحاويات', k: 'teu container throughput' },
    { id: 'connectivity', en: 'Liner shipping connectivity (LSCI)', ar: 'الربط الملاحي', k: 'lsci unctad connectivity liner' },
    { id: 'digital-trade', en: 'Digital trade and blockchain readiness', ar: 'التجارة الرقمية والبلوك تشين', k: 'blockchain ebl mletr digital bill of lading uncitral' },
    { id: 'innovation', en: 'Innovation capacity (GII)', ar: 'القدرة على الابتكار', k: 'gii wipo innovation' },
    { id: 'air-cargo', en: 'Air cargo hubs', ar: 'مراكز الشحن الجوي', k: 'air cargo freight icao' },
    { id: 'pressure', en: 'Global supply chain pressure (GSCPI)', ar: 'ضغط سلاسل الإمداد', k: 'gscpi pressure new york fed' },
    { id: 'freight', en: 'Container freight rates (WCI)', ar: 'أسعار شحن الحاويات', k: 'wci drewry freight rate' },
    { id: 'cite', en: 'Cite this dashboard and data dictionary', ar: 'الاستشهاد وقاموس البيانات', k: 'cite citation reference data dictionary sources methodology' }
  ];

  // Search
  dash.draw('search-results', (box) => {
    box.replaceChildren();
    const q = (S.q || '').trim().toLowerCase(); if (q.length < 1) return;
    const out = [];
    const lpi = dash.data('lpi'), cppi = dash.data('cppi');
    if (lpi.status === 'ok') lpi.data.filter((r) => !['MEA', 'HIC'].includes(r.iso3)).forEach((r) => { const nm = (r.country + ' ' + (S.AR[r.iso3] || '') + ' ' + r.iso3).toLowerCase(); if (nm.includes(q)) out.push({ t: 'c', iso: r.iso3, label: isoName(r.iso3, r.country), sub: r.group }); });
    if (cppi.status === 'ok') cppi.data.forEach((r) => { if ((r.port + ' ' + r.locode).toLowerCase().includes(q)) out.push({ t: 'p', iso: r.iso3, port: r.port, label: r.port, sub: isoName(r.iso3, r.country) + ' · CPPI #' + r.rank_2025 }); });
    S.SECTIONS.forEach((s) => { if ((s.en + ' ' + s.ar + ' ' + s.k).toLowerCase().includes(q)) out.push({ t: 's', id: s.id, label: S.lang === 'ar' ? s.ar : s.en }); });
    if (!out.length) { box.append(el$('div', 'sx-res', S.t('No matches'))); return; }
    out.slice(0, 12).forEach((o) => {
      const b = el$('button', 'sx-res'); b.type = 'button';
      const tag = el$('span', 'sx-tag' + (o.t === 'p' ? ' p' : o.t === 's' ? ' s' : ''), S.t(o.t === 'c' ? 'Country' : o.t === 'p' ? 'Port' : 'Section'));
      b.append(tag, document.createTextNode(o.label));
      if (o.sub) b.append(el$('small', null, o.sub));
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => {
        if (o.t === 'c') { if (S.isMena(lpi.data.find((r) => r.iso3 === o.iso).group)) S.setScope(o.iso); else S.addCompare(o.iso); S.go('overview'); }
        else if (o.t === 'p') { S.port = o.port; if (S.isMena(cppi.data.find((r) => r.port === o.port).group)) S.setScope(o.iso); else { dash.draw('map'); dash.draw('cppi-rank'); } S.go('ports'); }
        else S.go(o.id);
        S.q = ''; document.querySelectorAll('[data-search]').forEach((i) => { i.value = ''; }); dash.draw('search-results');
      });
      if (o.t === 'c' && o.iso !== S.focus()) { const c = el$('span', 'sx-tag s', S.t('+ Compare')); c.style.cursor = 'pointer'; c.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); S.addCompare(o.iso); S.go('compare'); }); b.append(c); }
      box.append(b);
    });
  });

  // Compare
  dash.draw('cmp-add', (sel) => {
    const d = dash.data('lpi'); const rows = d.status === 'ok' ? d.data.filter((r) => !['MEA', 'HIC'].includes(r.iso3) && !S.compare.includes(r.iso3) && r.iso3 !== S.focus()) : [];
    sel.replaceChildren(new Option(S.t('Add economy…'), ''), ...rows.sort((a, b) => d3.ascending(isoName(a.iso3, a.country), isoName(b.iso3, b.country))).map((r) => new Option(isoName(r.iso3, r.country), r.iso3)));
    sel.value = ''; sel.disabled = S.compare.length >= 3; sel.onchange = () => { S.addCompare(sel.value); };
  });
  dash.draw('cmp-chips', (el) => {
    el.replaceChildren();
    const mk = (iso, fixed, color) => { const c = el$('span', 'sx-cchip'); const sw = el$('i', 'sx-sw'); sw.style.background = color; sw.style.color = color; c.append(sw, document.createTextNode(S.cname(iso))); if (!fixed) { const x = el$('button', null, '×'); x.type = 'button'; x.setAttribute('aria-label', 'Remove ' + S.cname(iso)); x.addEventListener('click', () => S.rmCompare(iso)); c.append(x); } return c; };
    el.append(mk(S.focus(), true, '#2dd4bf'), mk(S.bench, true, '#38bdf8'));
    S.compare.filter((x) => x !== S.focus()).forEach((iso, i) => el.append(mk(iso, false, ['#fbbf24', '#f472b6', '#a3e635'][i])));
  });
  dash.draw('cmp-grid', (el) => {
    el.replaceChildren();
    if (!S.ok('lpi', 'teu_summary', 'lsci_summary', 'gii', 'cppi_country', 'mlii', 'mletr')) return;
    const ecs = [S.focus(), S.bench].concat(S.compare.filter((x) => x !== S.focus() && x !== S.bench));
    const get = (id, iso, f) => { const r = dash.data(id).data.find((x) => (x.iso3 || x.key) === iso); return r ? r[f] : null; };
    const lpiV = (iso, f) => { const r = dash.data('lpi').data.find((x) => x.iso3 === iso); return r && r[f] !== null && r[f] !== '' ? +r[f] : null; };
    const rows = [
      ['MENA Logistics Innovation Index', (iso) => get('mlii', iso, 'mlii_equal'), d3.format('.1f'), 'high'],
      ['Best port · CPPI 2025 world rank', (iso) => get('cppi_country', iso, 'best_rank'), (v) => '#' + v, 'low'],
      ['Port turnaround (days)', (iso) => lpiV(iso, 'port_turnaround_days'), d3.format('.1f'), 'low'],
      ['Container import dwell (days)', (iso) => lpiV(iso, 'import_dwell_days'), d3.format('.1f'), 'low'],
      ['Maritime partner economies', (iso) => lpiV(iso, 'maritime_partner_economies'), d3.format('.0f'), 'high'],
      ['Liner connectivity (LSCI, latest)', (iso) => get('lsci_summary', iso, 'lsci'), d3.format('.0f'), 'high'],
      ['Container throughput (k TEU, latest)', (iso) => get('teu_summary', iso, 'latest'), d3.format(',.0f'), 'high'],
      ['Change in TEU since 2019', (iso) => get('teu_summary', iso, 'change_vs_2019_pct'), S.pct, 'high'],
      ['Global Innovation Index rank', (iso) => { const r = dash.data('gii').data.find((x) => x.iso3 === iso); return r ? +r.gii_rank_2025 : null; }, (v) => '#' + v, 'low'],
      ['eBL law (UNCITRAL MLETR)', (iso) => (dash.data('mletr').data.some((m) => m.iso3 === iso) ? 1 : 0), (v) => (v ? '✓' : '—'), 'high']
    ];
    const grid = el$('div', 'sx-cmp'); grid.style.setProperty('--n', ecs.length);
    const h = el$('div', 'sx-cmp-row h'); h.append(el$('span', null, '')); ecs.forEach((iso) => h.append(el$('span', null, S.cname(iso)))); grid.append(h);
    rows.forEach(([label, fn, fmt, better]) => {
      const vals = ecs.map(fn), ok = vals.filter((v) => v != null), best = ok.length ? (better === 'low' ? d3.min(ok) : d3.max(ok)) : null;
      const row = el$('div', 'sx-cmp-row'); row.append(el$('span', null, label));
      vals.forEach((v) => { const c = el$('span', v != null && v === best && ok.length > 1 ? 'sx-cmp-best' : null, v == null ? '—' : fmt(v)); row.append(c); });
      grid.append(row);
    });
    el.append(grid);
  });

  // Port efficiency map
  const MAPM = {
    mlii: { en: 'Logistics Innovation Index', get: (iso) => { const r = S.row('mlii', iso, 'iso3'); return r ? r.mlii_equal : null; }, hi: true, fmt: d3.format('.1f') },
    lpi: { en: 'Port turnaround (days)', get: (iso) => { const d = dash.data('lpi'); const r = d.status === 'ok' && d.data.find((x) => x.iso3 === iso); return r && r.port_turnaround_days != null && r.port_turnaround_days !== '' ? +r.port_turnaround_days : null; }, hi: false, fmt: d3.format('.1f') },
    lsci: { en: 'Liner connectivity (LSCI)', get: (iso) => { const r = S.row('lsci_summary', iso, 'iso3'); return r ? r.lsci : null; }, hi: true, fmt: d3.format('.0f') },
    gii: { en: 'Innovation (GII score)', get: (iso) => { const r = S.row('gii', iso, 'iso3'); return r ? +r.gii_score_2025 : null; }, hi: true, fmt: d3.format('.1f') },
    teu: { en: 'TEU change since 2019 (%)', get: (iso) => { const r = S.row('teu_summary', iso); return r ? r.change_vs_2019_pct : null; }, hi: true, fmt: S.pct }
  };
  S.mapScale = () => {
    const M = MAPM[S.mapMetric]; const ld = dash.data('lpi'); const isos = ld.status === 'ok' ? ld.data.filter((r) => S.isMena(r.group)).map((r) => r.iso3) : [];
    const vals = isos.map(M.get).filter((v) => v != null);
    const sc = d3.scaleSequential(d3.interpolateRgbBasis(['#312e81', '#6d28d9', '#0ea5e9', '#2dd4bf', '#bef264'])).domain(M.hi ? d3.extent(vals) : d3.extent(vals).reverse());
    return { M, sc, ext: d3.extent(vals) };
  };
  dash.draw('map-legend', (el) => {
    el.replaceChildren(); const { M, sc, ext } = S.mapScale(); if (ext[0] == null) return;
    const W = Math.min(300, Math.max(200, el.clientWidth)), svg = d3.select(el).append('svg').attr('width', W).attr('height', 34).attr('role', 'img').attr('aria-label', 'Map colour legend');
    const id = 'mlg' + (++S.uid), g = svg.append('defs').append('linearGradient').attr('id', id);
    d3.range(0, 1.01, 0.25).forEach((t) => g.append('stop').attr('offset', t * 100 + '%').attr('stop-color', sc(ext[0] + (ext[1] - ext[0]) * (M.hi ? t : t))));
    svg.append('rect').attr('x', 0).attr('y', 4).attr('width', W).attr('height', 10).attr('rx', 5).style('fill', `url(#${id})`);
    svg.append('text').attr('class', 'sx-lbl').attr('x', 0).attr('y', 28).text(M.fmt(ext[0]));
    svg.append('text').attr('class', 'sx-lbl').attr('x', W).attr('y', 28).attr('text-anchor', 'end').text(M.fmt(ext[1]));
  });
  dash.draw('map', (el) => {
    if (!S.ok('geo', 'cppi')) return S.fail(el, 'geo', 'cppi');
    el.replaceChildren();
    const geo = dash.data('geo').data, ports = dash.data('cppi').data.filter((r) => r.lat !== null && r.lat !== '' && r.cppi_2025 !== null && r.cppi_2025 !== '');
    const W = Math.max(300, el.clientWidth), H = Math.max(320, Math.min(560, W * 0.55)), go = S.anim('map');
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Map of MENA economies coloured by the selected indicator, with container ports sized by ship calls and coloured by CPPI 2025 score');
    S.glow(svg, 'pmg');
    const mena = { type: 'FeatureCollection', features: geo.features.filter((f) => f.properties.iso3) };
    const proj = d3.geoMercator().fitExtent([[12, 12], [W - 12, H - 12]], mena), path = d3.geoPath(proj);
    const { M, sc } = S.mapScale();
    const tip = S.tip(el);
    const g = svg.append('g');
    const inS = (iso) => (S.scope === 'GCC' ? S.GCC.includes(iso) : S.isCountry() ? iso === S.scope : true);
    const cs = g.selectAll('path').data(geo.features).join('path').attr('d', path)
      .style('fill', (f) => { if (!f.properties.iso3) return 'var(--track)'; const v = M.get(f.properties.iso3); return v == null ? 'var(--track)' : sc(v); })
      .style('fill-opacity', (f) => (!f.properties.iso3 ? 1 : inS(f.properties.iso3) ? 0.85 : 0.25))
      .style('stroke', (f) => (S.isCountry() && f.properties.iso3 === S.scope ? '#fbbf24' : 'var(--line)')).style('stroke-width', (f) => (S.isCountry() && f.properties.iso3 === S.scope ? 2 : 0.6))
      .style('cursor', (f) => (f.properties.iso3 ? 'pointer' : 'default'))
      .on('pointermove', (ev, f) => { if (!f.properties.iso3) return; const [mx, my] = d3.pointer(ev, el); const v = M.get(f.properties.iso3); S.showTip(el, tip, mx, my, S.cname(f.properties.iso3), [[M.en, v == null ? 'n/a' : M.fmt(v)]]); })
      .on('pointerleave', () => { tip.style.opacity = 0; })
      .on('click', (ev, f) => { if (f.properties.iso3) S.setScope(f.properties.iso3); });
    if (go) cs.style('opacity', 0).transition().delay((f) => { const c = path.centroid(f); return isFinite(c[0]) ? (c[0] / W) * 900 : 0; }).duration(700).style('opacity', 1);
    const pc = d3.scaleLinear().domain([-120, 0, 70, 145]).range(['#fb7185', '#fbbf24', '#2dd4bf', '#a3e635']).clamp(true);
    const r = d3.scaleSqrt().domain([0, d3.max(ports, (p) => +p.calls_2025)]).range([3, 16]);
    const pg = svg.append('g'), labs = [];
    ports.sort((a, b) => +b.calls_2025 - +a.calls_2025).forEach((p, i) => {
      const xy = proj([+p.lon, +p.lat]); if (!xy) return;
      const on = inS(p.iso3), sel = S.port === p.port, gg = pg.append('g').attr('transform', `translate(${xy[0]},${xy[1]})`).style('opacity', on ? 1 : 0.35).style('cursor', 'pointer');
      if ((+p.rank_2025 <= 25 || sel) && S.motion) gg.append('circle').attr('r', r(+p.calls_2025)).attr('class', 'sx-pulse').style('fill', 'none').style('stroke', sel ? '#fbbf24' : pc(+p.cppi_2025)).style('stroke-width', 2).style('animation-delay', (i % 7) * 0.3 + 's');
      const c = gg.append('circle').style('fill', pc(+p.cppi_2025)).style('fill-opacity', 0.85).style('stroke', sel ? '#fbbf24' : 'var(--bg)').style('stroke-width', sel ? 2.5 : 1).attr('filter', 'url(#pmg)');
      if (go) c.attr('r', 0).transition().delay(700 + i * 40).duration(700).ease(d3.easeBackOut).attr('r', r(+p.calls_2025)); else c.attr('r', r(+p.calls_2025));
      if (+p.rank_2025 <= 25 || sel) labs.push({ gg, x: xy[0], y: xy[1], rr: r(+p.calls_2025), t: p.port + ' #' + p.rank_2025, pri: sel ? -1 : +p.rank_2025 });
      if (false) gg.append('text').attr('class', 'sx-lbl').attr('x', r(+p.calls_2025) + 4).attr('dy', '0.35em').style('fill', 'var(--ink)').style('font-weight', 600).style('paint-order', 'stroke').style('stroke', 'var(--bg)').style('stroke-width', 3).text(p.port + ' #' + p.rank_2025);
      gg.on('pointermove', (ev) => { const [mx, my] = d3.pointer(ev, el); S.showTip(el, tip, mx, my, p.port + ' · ' + S.cname(p.iso3), [['CPPI 2025 score', d3.format('.1f')(+p.cppi_2025), pc(+p.cppi_2025)], ['World rank (of 400+)', '#' + p.rank_2025], ['Ship calls in sample', d3.format(',')(+p.calls_2025)], [M.en, (() => { const v = M.get(p.iso3); return v == null ? 'n/a' : M.fmt(v); })()]]); }).on('pointerleave', () => { tip.style.opacity = 0; })
        .on('click', () => { S.port = p.port; dash.draw('map'); dash.draw('cppi-rank'); });
    });
    const boxes = [];
    labs.sort((a, b) => a.pri - b.pri).forEach((L) => {
      const t = L.gg.append('text').attr('class', 'sx-lbl').attr('dy', '0.35em').style('fill', 'var(--ink)').style('font-weight', 600).style('paint-order', 'stroke').style('stroke', 'var(--bg)').style('stroke-width', 3).text(L.t);
      const w = t.node().getComputedTextLength(), h = 14;
      const tries = [[L.rr + 4, 0, 'start'], [-L.rr - 4, 0, 'end'], [0, -L.rr - 9, 'middle'], [0, L.rr + 10, 'middle']];
      const fit = tries.find(([dx, dy, a]) => { const x0 = L.x + dx - (a === 'end' ? w : a === 'middle' ? w / 2 : 0), y0 = L.y + dy - h / 2; const b = [x0 - 2, y0 - 1, x0 + w + 2, y0 + h + 1]; if (b[0] < 0 || b[2] > W || b[1] < 0 || b[3] > H) return false; if (boxes.some((o) => !(b[2] < o[0] || b[0] > o[2] || b[3] < o[1] || b[1] > o[3]))) return false; boxes.push(b); return true; });
      if (!fit) { t.remove(); return; }
      t.attr('x', fit[0]).attr('y', fit[1]).attr('text-anchor', fit[2]);
    });
  });
  dash.draw('cppi-rank', (el) => {
    if (!S.ok('cppi')) return S.fail(el, 'cppi');
    el.replaceChildren();
    let rows = dash.data('cppi').data.filter((r) => r.cppi_2025 !== null && r.cppi_2025 !== '' && (S.isMena(r.group) ? (S.scope === 'GCC' ? r.group === 'GCC' : S.isCountry() ? r.iso3 === S.scope : true) : +r.rank_2025 <= 10 || r.iso3 === S.bench)).map((r) => ({ ...r, v: +r.cppi_2025, rk: +r.rank_2025 })).sort((a, b) => a.rk - b.rk).slice(0, 26);
    const W = Math.max(300, el.clientWidth), rh = 22, H = rows.length * rh + 30, go = S.anim('cppi-rank');
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Container ports ranked by CPPI 2025 score');
    const lw = Math.ceil(S.measure(svg, rows.map((r) => r.port + '  ' + r.iso3))) + 16, vw = 64;
    const x = d3.scaleLinear().domain([Math.min(0, d3.min(rows, (r) => r.v)), 150]).range([lw, W - vw]);
    svg.append('line').attr('x1', x(0)).attr('x2', x(0)).attr('y1', 0).attr('y2', H - 24).style('stroke', 'var(--line)');
    svg.append('g').attr('transform', `translate(0,${H - 22})`).call(d3.axisBottom(x).ticks(5).tickSize(-(H - 26))).call((g) => g.select('.domain').remove()).selectAll('line').style('stroke', 'var(--line)');
    const pc = d3.scaleLinear().domain([-120, 0, 70, 145]).range(['#fb7185', '#fbbf24', '#2dd4bf', '#a3e635']).clamp(true);
    const tip = S.tip(el);
    rows.forEach((r, i) => {
      const yy = i * rh + rh / 2, sel = S.port === r.port, bench = !S.isMena(r.group);
      const g = svg.append('g');
      const t = g.append('text').attr('class', 'sx-lbl').attr('x', lw - 10).attr('y', yy).attr('dy', '0.35em').attr('text-anchor', 'end').style('fill', sel ? '#fbbf24' : bench ? '#7dd3fc' : 'var(--ink2)').style('font-weight', sel ? 700 : null);
      t.append('tspan').text(r.port); t.append('tspan').style('fill', 'var(--mute)').text('  ' + r.iso3);
      const ln = g.append('line').attr('x1', x(0)).attr('y1', yy).attr('y2', yy).style('stroke', pc(r.v)).style('stroke-width', 3).style('opacity', 0.55);
      const c = g.append('circle').attr('cy', yy).attr('r', 6).style('fill', pc(r.v)).style('stroke', sel ? '#fbbf24' : 'none').style('stroke-width', 2);
      g.append('text').attr('class', 'sx-lbl').attr('x', W - vw + 8).attr('y', yy).attr('dy', '0.35em').style('fill', 'var(--ink)').style('font-weight', 600).text('#' + r.rk);
      if (go) { ln.attr('x2', x(0)).transition().delay(i * 40).duration(900).attr('x2', x(r.v)); c.attr('cx', x(0)).transition().delay(i * 40).duration(900).attr('cx', x(r.v)); } else { ln.attr('x2', x(r.v)); c.attr('cx', x(r.v)); }
      g.append('rect').attr('x', 0).attr('y', yy - rh / 2).attr('width', W).attr('height', rh).style('fill', 'transparent').style('cursor', 'pointer')
        .on('pointermove', (ev) => { const [, py] = d3.pointer(ev, el); S.showTip(el, tip, x(r.v) * el.clientWidth / W, py, r.port + ' · ' + S.cname(r.iso3), [['CPPI 2025', d3.format('.1f')(r.v), pc(r.v)], ['World rank', '#' + r.rk], ['CPPI 2024', r.cppi_2024 == null || r.cppi_2024 === '' ? 'n/a' : d3.format('.0f')(+r.cppi_2024)], ['CPPI 2020', r.cppi_2020 == null || r.cppi_2020 === '' ? 'n/a' : d3.format('.0f')(+r.cppi_2020)]]); })
        .on('pointerleave', () => { tip.style.opacity = 0; }).on('click', () => { S.port = r.port; dash.draw('map'); dash.draw('cppi-rank'); });
    });
  });

  // 2026 pulse
  dash.draw('wto-bars', (el) => {
    if (!S.ok('wto')) return S.fail(el, 'wto');
    el.replaceChildren();
    const rows = dash.data('wto').data.filter((r) => r.measure !== 'World GDP'), ms = Array.from(new Set(rows.map((r) => r.measure))), yrs = ['2025', '2026', '2027'];
    const W = Math.max(280, el.clientWidth), H = 236, m = { t: 30, r: 10, b: 40, l: 10 }, go = S.anim('wto');
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'WTO trade volume growth, 2025 actual and 2026 to 2027 forecasts');
    const x0 = d3.scaleBand().domain(ms).range([m.l, W - m.r]).padding(0.18), x1 = d3.scaleBand().domain(yrs).range([0, x0.bandwidth()]).padding(0.12);
    const y = d3.scaleLinear().domain([0, 7.5]).range([H - m.b, m.t]);
    const col = { 2025: '#64748b', 2026: '#2dd4bf', 2027: '#a78bfa' };
    ms.forEach((ms_) => {
      svg.append('text').attr('class', 'sx-lbl').attr('x', x0(ms_) + x0.bandwidth() / 2).attr('y', H - 6).attr('text-anchor', 'middle').style('fill', 'var(--ink2)').style('font-weight', 600).text(S.t(ms_));
      yrs.forEach((yr, j) => {
        const r = rows.find((d) => d.measure === ms_ && d.year === yr); if (!r) return;
        const v = +r.growth_pct, xx = x0(ms_) + x1(yr);
        const b = svg.append('rect').attr('x', xx).attr('width', x1.bandwidth()).attr('rx', 6).style('fill', col[yr]).style('fill-opacity', r.status === 'Forecast' ? 0.85 : 0.5).style('stroke', r.status === 'Forecast' ? col[yr] : 'none').style('stroke-dasharray', '3 2');
        const t = svg.append('text').attr('class', 'sx-lbl').attr('x', xx + x1.bandwidth() / 2).attr('text-anchor', 'middle').style('fill', 'var(--ink)').style('font-weight', 700).text(d3.format('.1f')(v) + '%');
        svg.append('text').attr('class', 'sx-lbl').attr('x', xx + x1.bandwidth() / 2).attr('y', y(0) + 12).attr('text-anchor', 'middle').style('font-size', '10px').text(yr);
        if (go) { b.attr('y', y(0)).attr('height', 0).transition().delay(j * 150).duration(1000).ease(d3.easeCubicOut).attr('y', y(v)).attr('height', y(0) - y(v)); t.attr('y', y(0) - 4).style('opacity', 0).transition().delay(j * 150).duration(1000).attr('y', y(v) - 6).style('opacity', 1); }
        else { b.attr('y', y(v)).attr('height', y(0) - y(v)); t.attr('y', y(v) - 6); }
      });
    });
    const lg = svg.append('g').attr('transform', `translate(${m.l + 4},10)`);
    [['2025 ' + S.t('Actual'), '#64748b'], ['2026 ' + S.t('Forecast'), '#2dd4bf'], ['2027 ' + S.t('Forecast'), '#a78bfa']].forEach(([t, c], i) => { const g = lg.append('g').attr('transform', `translate(${i * 110},0)`); g.append('rect').attr('width', 10).attr('height', 10).attr('y', -6).attr('rx', 3).style('fill', c); g.append('text').attr('class', 'sx-lbl').attr('x', 14).attr('dy', '0.3em').text(t); });
  });
  dash.draw('iata-bars', (el) => {
    if (!S.ok('iata')) return S.fail(el, 'iata');
    el.replaceChildren();
    const rows = dash.data('iata').data.map((r) => ({ m: S.parse(r.month), v: +r.ctk_yoy_pct }));
    const W = Math.max(280, el.clientWidth), H = 220, m = { t: 20, r: 10, b: 26, l: 34 }, go = S.anim('iata');
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Global air cargo demand growth by month in 2026');
    const x = d3.scaleBand().domain(rows.map((r) => +r.m)).range([m.l, W - m.r]).padding(0.25);
    const y = d3.scaleLinear().domain([Math.min(-6, d3.min(rows, (r) => r.v)), Math.max(12, d3.max(rows, (r) => r.v))]).nice().range([H - m.b, m.t]);
    svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat((d) => d + '%').tickSize(-(W - m.l - m.r))).call((g) => g.select('.domain').remove()).selectAll('line').style('stroke', 'var(--line)');
    svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0)).style('stroke', 'var(--mute)');
    const defs = svg.append('defs'); [['ia', '#38bdf8', '#2dd4bf'], ['ib', '#fb7185', '#f472b6']].forEach(([id, a, b]) => { const g = defs.append('linearGradient').attr('id', id).attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1); g.append('stop').attr('offset', '0%').attr('stop-color', a); g.append('stop').attr('offset', '100%').attr('stop-color', b); });
    const tip = S.tip(el);
    rows.forEach((r, i) => {
      const xx = x(+r.m), up = r.v >= 0;
      svg.append('text').attr('class', 'sx-lbl').attr('x', xx + x.bandwidth() / 2).attr('y', H - 8).attr('text-anchor', 'middle').text(d3.utcFormat('%b')(r.m));
      const b = svg.append('rect').attr('x', xx).attr('width', x.bandwidth()).attr('rx', 4).style('fill', up ? 'url(#ia)' : 'url(#ib)');
      const t = svg.append('text').attr('class', 'sx-lbl').attr('x', xx + x.bandwidth() / 2).attr('text-anchor', 'middle').style('fill', 'var(--ink)').style('font-weight', 600).style('font-size', '10px').text(d3.format('+.1f')(r.v));
      const yv = up ? y(r.v) : y(0), hv = Math.abs(y(r.v) - y(0)), ty = up ? y(r.v) - 4 : y(r.v) + 11;
      if (go) { b.attr('y', y(0)).attr('height', 0).transition().delay(i * 90).duration(800).ease(d3.easeCubicOut).attr('y', yv).attr('height', hv); t.style('opacity', 0).attr('y', ty).transition().delay(i * 90 + 500).duration(400).style('opacity', 1); }
      else { b.attr('y', yv).attr('height', hv); t.attr('y', ty); }
      svg.append('rect').attr('x', xx).attr('y', m.t).attr('width', x.bandwidth()).attr('height', H - m.t - m.b).style('fill', 'transparent')
        .on('pointermove', (ev) => { const [mx, my] = d3.pointer(ev, el); S.showTip(el, tip, mx, my, d3.utcFormat('%B %Y')(r.m), [['Air cargo demand (CTK), y/y', d3.format('+.1f')(r.v) + '%', up ? '#2dd4bf' : '#fb7185']]); })
        .on('pointerleave', () => { tip.style.opacity = 0; });
    });
  });

  // Composite index with weight sliders
  const COMP = ['port_efficiency', 'logistics_speed', 'liner_connectivity', 'air_connectivity', 'innovation', 'ebl_law'];
  const COMP_L = { port_efficiency: 'Port efficiency', logistics_speed: 'Logistics speed', liner_connectivity: 'Liner connectivity', air_connectivity: 'Air connectivity', innovation: 'Innovation', ebl_law: 'eBL law' };
  const COMP_C = { port_efficiency: '#2dd4bf', logistics_speed: '#38bdf8', liner_connectivity: '#818cf8', air_connectivity: '#f472b6', innovation: '#fbbf24', ebl_law: '#a3e635' };
  dash.draw('wlab', (el) => { const k = el.dataset.k; const tot = d3.sum(COMP, (c) => S.w[c]) || 1; el.textContent = d3.format('.0f')(S.w[k] / tot * 100) + '%'; });
  dash.draw('mlii', (el) => {
    if (!S.ok('mlii')) return S.fail(el, 'mlii');
    el.replaceChildren();
    const data = dash.data('mlii').data.filter((r) => (S.scope === 'GCC' ? r.group !== 'Other MENA' : true));
    const rows = data.map((r) => { const av = COMP.filter((c) => r[c] != null), tw = d3.sum(av, (c) => S.w[c]) || 1; const parts = av.map((c) => ({ c, v: r[c] * S.w[c] / tw })); return { ...r, parts, score: d3.sum(parts, (p) => p.v) }; }).sort((a, b) => b.score - a.score);
    const W = Math.max(300, el.clientWidth), rh = 24, H = rows.length * rh + 40, go = S.anim('mlii');
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'MENA Logistics Innovation Index scores with component contributions');
    const lw = Math.ceil(S.measure(svg, rows.map((r) => (rows.indexOf(r) + 1) + '. ' + S.n(r.iso3, r.country)))) + 14, vw = 46;
    const x = d3.scaleLinear().domain([0, 100]).range([lw, W - vw]);
    const tip = S.tip(el);
    rows.forEach((r, i) => {
      const yy = i * rh + 4, sel = S.isCountry() && r.iso3 === S.scope, bench = r.group === 'Benchmark';
      svg.append('text').attr('class', 'sx-lbl').attr('x', lw - 8).attr('y', yy + rh / 2).attr('dy', '0.35em').attr('text-anchor', 'end').style('fill', sel ? '#fbbf24' : bench ? '#7dd3fc' : 'var(--ink2)').style('font-weight', sel ? 700 : null).text((i + 1) + '. ' + S.n(r.iso3, r.country));
      let cx = x(0);
      r.parts.forEach((p, k) => {
        const w = x(p.v) - x(0), seg = svg.append('rect').attr('y', yy + 4).attr('height', rh - 9).style('fill', COMP_C[p.c]).style('opacity', S.isCountry() && !sel && !bench ? 0.45 : 0.92);
        if (go) seg.attr('x', x(0)).attr('width', 0).transition().delay(i * 40 + k * 60).duration(900).ease(d3.easeCubicOut).attr('x', cx).attr('width', Math.max(0, w)); else seg.attr('x', cx).attr('width', Math.max(0, w));
        cx += w;
      });
      svg.append('text').attr('class', 'sx-lbl').attr('x', x(r.score) + 6).attr('y', yy + rh / 2).attr('dy', '0.35em').style('fill', 'var(--ink)').style('font-weight', 700).text(d3.format('.1f')(r.score));
      svg.append('rect').attr('x', 0).attr('y', yy).attr('width', W).attr('height', rh).style('fill', 'transparent').style('cursor', 'pointer')
        .on('pointermove', (ev) => { const [, py] = d3.pointer(ev, el); S.showTip(el, tip, x(r.score) * el.clientWidth / W, py, S.n(r.iso3, r.country) + ' · ' + d3.format('.1f')(r.score), COMP.map((c) => [S.t(COMP_L[c]), r[c] == null ? 'n/a' : d3.format('.0f')(r[c]), COMP_C[c]])); })
        .on('pointerleave', () => { tip.style.opacity = 0; }).on('click', () => { if (S.isMena(r.group)) S.setScope(r.iso3); });
    });
    const lg = svg.append('g').attr('transform', `translate(${lw},${H - 12})`); let ox = 0;
    COMP.forEach((c) => { const g = lg.append('g').attr('transform', `translate(${ox},0)`); g.append('rect').attr('width', 10).attr('height', 10).attr('y', -7).attr('rx', 2).style('fill', COMP_C[c]); const t = g.append('text').attr('class', 'sx-lbl').attr('x', 14).attr('dy', '0.2em').text(S.t(COMP_L[c])); ox += 22 + t.node().getComputedTextLength(); });
  });

  // Country profile
  dash.draw('profile-name', (el) => { el.textContent = S.cname(S.focus()); });
  dash.draw('profile', (el) => {
    el.replaceChildren();
    if (!S.ok('lpi', 'teu_summary', 'air_summary', 'lsci_summary', 'gii', 'cppi_country', 'mlii', 'mletr')) return;
    const iso = S.focus(), menaN = dash.data('lpi').data.filter((r) => S.isMena(r.group));
    const rankOf = (vals, v, better) => { const ok = vals.filter((x) => x != null); if (v == null) return null; return 1 + ok.filter((x) => (better === 'low' ? x < v : x > v)).length; };
    const lp = (f) => menaN.map((r) => (r[f] === null || r[f] === '' ? null : +r[f])), lv = (f) => { const r = menaN.find((x) => x.iso3 === iso); return r && r[f] !== null && r[f] !== '' ? +r[f] : null; };
    const mli = S.row('mlii', iso, 'iso3'), cp = S.row('cppi_country', iso, 'iso3'), te = S.row('teu_summary', iso), ai = S.row('air_summary', iso), ls = S.row('lsci_summary', iso, 'iso3'), gi = S.row('gii', iso, 'iso3');
    const law = dash.data('mletr').data.find((m) => m.iso3 === iso);
    const menaMl = dash.data('mlii').data.filter((r) => S.isMena(r.group));
    const tiles = [
      ['Logistics Innovation Index', mli ? d3.format('.1f')(mli.mlii_equal) : '—', mli ? 'MENA rank ' + rankOf(menaMl.map((r) => r.mlii_equal), mli.mlii_equal, 'high') + ' of ' + menaMl.length : '', mli ? mli.mlii_equal : 0, ['mlii', 'mlii_equal', 'iso3=' + iso]],
      ['Best container port (CPPI 2025)', cp ? '#' + cp.best_rank : '—', cp ? cp.best_port + ' · score ' + d3.format('.1f')(cp.best_score) : 'No port ranked', cp ? Math.max(0, 100 - cp.best_rank / 4) : 0, ['cppi_country', 'best_rank', 'iso3=' + iso]],
      ['Port turnaround (days)', lv('port_turnaround_days') != null ? d3.format('.1f')(lv('port_turnaround_days')) : '—', 'MENA rank ' + (rankOf(lp('port_turnaround_days'), lv('port_turnaround_days'), 'low') || '—'), lv('port_turnaround_days') ? Math.min(100, 50 / lv('port_turnaround_days')) : 0, ['lpi', 'port_turnaround_days', 'iso3=' + iso]],
      ['Container import dwell (days)', lv('import_dwell_days') != null ? d3.format('.1f')(lv('import_dwell_days')) : '—', 'MENA rank ' + (rankOf(lp('import_dwell_days'), lv('import_dwell_days'), 'low') || '—'), lv('import_dwell_days') ? Math.min(100, 200 / lv('import_dwell_days')) : 0, ['lpi', 'import_dwell_days', 'iso3=' + iso]],
      ['Maritime partner economies', lv('maritime_partner_economies') != null ? d3.format('.0f')(lv('maritime_partner_economies')) : '—', 'MENA rank ' + (rankOf(lp('maritime_partner_economies'), lv('maritime_partner_economies'), 'high') || '—'), (lv('maritime_partner_economies') || 0) / 97 * 100, ['lpi', 'maritime_partner_economies', 'iso3=' + iso]],
      ['Container throughput (k TEU)', te ? d3.format(',.0f')(te.latest) : '—', te ? te.latest_year + (te.change_vs_2019_pct != null ? ' · ' + S.pct(te.change_vs_2019_pct) + ' vs 2019' : '') : 'Not reported', te ? Math.min(100, Math.sqrt(te.latest / 23467) * 100) : 0, ['teu_summary', 'latest', 'key=' + iso]],
      ['Air freight (mn ton-km)', ai ? d3.format(',.0f')(ai.latest) : '—', ai ? ai.latest_year + (ai.change_vs_2019_pct != null ? ' · ' + S.pct(ai.change_vs_2019_pct) + ' vs 2019' : '') : 'Not reported', ai ? Math.min(100, Math.sqrt(ai.latest / 13926) * 100) : 0, ['air_summary', 'latest', 'key=' + iso]],
      ['Liner connectivity (LSCI)', ls ? d3.format('.0f')(ls.lsci) : '—', ls ? ls.quarter + ' · world rank #' + ls.world_rank : '', ls ? Math.min(100, ls.lsci / 3.3) : 0, ['lsci_summary', 'lsci', 'iso3=' + iso]],
      ['Global Innovation Index', gi ? '#' + gi.gii_rank_2025 : '—', gi ? 'score ' + gi.gii_score_2025 + ' of 100' : 'Not ranked in 2025', gi ? +gi.gii_score_2025 / 66 * 100 : 0, ['gii', 'gii_rank_2025', 'iso3=' + iso]],
      ['eBL law (UNCITRAL MLETR)', law ? '✓ ' + law.year : 'Not yet', law ? law.jurisdiction : 'No enactment reported', law ? 100 : 4, null]
    ];
    const grid = el$('div', 'sx-tiles'), go = S.anim('profile');
    tiles.forEach(([l, v, r, pct, mark], i) => {
      const t = el$('div', 'sx-tile'); const vv = el$('div', 'v', v);
      if (mark) { vv.dataset.source = mark[0]; vv.dataset.field = mark[1]; vv.dataset.where = mark[2]; }
      const bar = el$('div', 'bar'), fill = el$('i'); bar.append(fill);
      t.append(el$('div', 'l', l), vv, el$('div', 'r', r), bar);
      const w = Math.max(2, Math.min(100, pct)) + '%';
      if (go) { t.style.opacity = 0; t.style.transform = 'translateY(10px)'; t.style.transition = `all .6s ${i * 0.05}s cubic-bezier(.2,.7,.2,1)`; requestAnimationFrame(() => requestAnimationFrame(() => { t.style.opacity = 1; t.style.transform = 'none'; fill.style.width = w; })); } else fill.style.width = w;
      grid.append(t);
    });
    el.append(grid);
  });
  S.profileText = () => {
    const iso = S.focus(), name = S.cname(iso), cp = S.row('cppi_country', iso, 'iso3'), mli = S.row('mlii', iso, 'iso3'), ls = S.row('lsci_summary', iso, 'iso3'), gi = S.row('gii', iso, 'iso3'), te = S.row('teu_summary', iso);
    return [name + ' — MENA Supply Chain & Logistics Innovation Pulse',
      mli ? 'Logistics Innovation Index (equal weights): ' + mli.mlii_equal : '',
      cp ? 'Best container port: ' + cp.best_port + ', CPPI 2025 world rank #' + cp.best_rank : '',
      te ? 'Container throughput: ' + d3.format(',.0f')(te.latest) + 'k TEU (' + te.latest_year + ')' : '',
      ls ? 'Liner connectivity (LSCI ' + ls.quarter + '): ' + ls.lsci + ', world rank #' + ls.world_rank : '',
      gi ? 'Global Innovation Index 2025: rank #' + gi.gii_rank_2025 : '',
      'Sources: World Bank (LPI 2.0, CPPI 2025, WDI), UNCTAD, WIPO, UNCITRAL.'].filter(Boolean).join('\n');
  };
  S.copyBtn('[data-copy-profile]', () => S.profileText());
  S.copyBtn('[data-copy-cite]', () => { const c = document.querySelector('.sx-cite.en'); const a = document.querySelector('.sx-cite.ar'); return (S.lang === 'ar' && a ? a : c) ? (S.lang === 'ar' && a ? a : c).textContent : ''; });

  // Insight cards
  dash.draw('insights', (el) => {
    el.replaceChildren();
    if (!S.ok('cppi_country', 'teu_summary', 'gii', 'iata', 'wto', 'mlii', 'cppi')) return;
    const cards = [], AR = S.lang === 'ar';
    const mk = (k, c, parts) => { const d = el$('div', 'sx-ins'); d.style.setProperty('--c', c); d.append(el$('span', 'k', k)); const p = el$('div'); parts.forEach((x) => { if (typeof x === 'string') p.append(document.createTextNode(x)); else { const b = el$('b', null, x.t); if (x.s) { b.dataset.source = x.s; b.dataset.field = x.f; if (x.w) b.dataset.where = x.w; } p.append(b); } }); d.append(p); cards.push(d); };
    const cc = dash.data('cppi_country').data.filter((r) => S.isMena(r.group)).sort((a, b) => a.best_rank - b.best_rank);
    if (cc[0]) { const rk = { t: '#' + cc[0].best_rank, s: 'cppi_country', f: 'best_rank', w: 'iso3=' + cc[0].iso3 }; mk(AR ? 'كفاءة الموانئ' : 'Port efficiency', '#2dd4bf', AR ? ['ميناء ', { t: cc[0].best_port }, ' (' + S.cname(cc[0].iso3) + ') في المرتبة ', rk, ' عالمياً بين أكفأ موانئ الحاويات في مؤشر CPPI 2025.'] : [{ t: cc[0].best_port }, ' (' + S.cname(cc[0].iso3) + ') is the world\'s ', rk, ' most efficient container port in the CPPI 2025.']); }
    const top25 = dash.data('cppi').data.filter((r) => S.isMena(r.group) && r.rank_2025 !== null && r.rank_2025 !== '' && +r.rank_2025 <= 25).length;
    mk(AR ? 'قوة إقليمية' : 'Regional strength', '#38bdf8', AR ? ['تضم المنطقة ', { t: String(top25) }, ' موانئ ضمن أفضل 25 ميناءً عالمياً في مؤشر CPPI 2025، الذي يرتّب أكثر من 400 ميناء حسب زمن بقاء السفن.'] : ['MENA has ', { t: String(top25) }, ' ports in the global top 25 of the CPPI 2025, which ranks over 400 ports by vessel time in port.']);
    const tg = dash.data('teu_summary').data.filter((r) => S.isMena(r.group) && r.change_vs_2019_pct != null && r.latest > 1000).sort((a, b) => b.change_vs_2019_pct - a.change_vs_2019_pct)[0];
    if (tg) { const v = { t: S.pct(tg.change_vs_2019_pct), s: 'teu_summary', f: 'change_vs_2019_pct', w: 'key=' + tg.key }; mk(AR ? 'البوابة الأسرع نمواً' : 'Fastest-growing gateway', '#a78bfa', AR ? ['ارتفعت إنتاجية حاويات ' + S.cname(tg.key) + ' بنسبة ', v, ' منذ 2019، وهي الأسرع بين اقتصادات المنطقة التي تتجاوز مليون حاوية نمطية.'] : [S.cname(tg.key) + '\'s container throughput is up ', v, ' since 2019, the fastest among MENA economies handling over 1 million TEU.']); }
    const ml = dash.data('mlii').data.filter((r) => S.isMena(r.group)).sort((a, b) => b.mlii_equal - a.mlii_equal)[0];
    if (ml) { const v = { t: d3.format('.1f')(ml.mlii_equal), s: 'mlii', f: 'mlii_equal', w: 'iso3=' + ml.iso3 }; mk(AR ? 'رائد الابتكار' : 'Innovation leader', '#fbbf24', AR ? ['تتصدر ' + S.cname(ml.iso3) + ' المنطقة في مؤشر الابتكار اللوجستي بدرجة ', v, '، بجمعها بين أداء الموانئ والربط والابتكار وقانون السند الإلكتروني.'] : [S.cname(ml.iso3) + ' leads MENA on the Logistics Innovation Index at ', v, ', combining port performance, connectivity, innovation and eBL law.']); }
    const wt = dash.data('wto').data.find((r) => r.measure === 'Merchandise trade volume' && r.year === '2026');
    if (wt) { const v = { t: d3.format('.1f')(+wt.growth_pct) + '%', s: 'wto', f: 'growth_pct', w: 'measure=Merchandise trade volume&year=2026' }; mk(AR ? 'آفاق 2026' : '2026 outlook', '#a3e635', AR ? ['رفعت منظمة التجارة العالمية توقعها لنمو حجم تجارة السلع العالمية في 2026 إلى ', v, ' في أحدث تقاريرها.'] : ['The WTO raised its 2026 forecast for world merchandise trade volume growth to ', v, ' in its latest outlook.']); }
    const ia = dash.data('iata').data, last = ia[ia.length - 1];
    if (last) { const n = { t: String(ia.filter((r) => +r.ctk_yoy_pct > 0).length) }, v = { t: d3.format('+.1f')(+last.ctk_yoy_pct) + '%', s: 'iata', f: 'ctk_yoy_pct', w: 'month=' + last.month }; mk(AR ? 'الشحن الجوي' : 'Air cargo', '#f472b6', AR ? ['نما الطلب العالمي على الشحن الجوي في ', n, ' من ' + ia.length + ' أشهر في 2026، وارتفع ', v, ' على أساس سنوي في آخر شهر متاح.'] : ['Global air cargo demand grew in ', n, ' of ' + ia.length + ' months of 2026, and rose ', v, ' year on year in ' + d3.utcFormat('%B')(S.parse(last.month)) + '.']); }
    cards.forEach((c) => el.append(c));
  });
})();
