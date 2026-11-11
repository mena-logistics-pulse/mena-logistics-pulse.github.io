(function(){
  const S = window.SCP;
  const set = (el, txt) => { el.textContent = txt; };
  const fm = d3.format(',.1f'), f2 = d3.format(',.2f');

  // Hero sentence (always MENA)
  dash.draw('lede-teu', (el) => { const r = S.row('teu_summary', 'MENA'); set(el, r ? f2(r.teu_latest_m) : '—'); });
  dash.draw('lede-teu-d', (el) => { const r = S.row('teu_summary', 'MENA'); set(el, r ? S.pct(r.change_vs_2019_pct) : '—'); });
  dash.draw('lede-tat', (el) => { const r = S.row('lpi_scope', 'MENA'); set(el, r ? fm(r.port_turnaround_days) : '—'); });
  dash.draw('lede-ebl', (el) => { const r = S.row('mletr_scope', 'MENA'); set(el, r ? String(r.adopters) : '—'); });

  dash.draw('scope-name', (el) => set(el, S.scopeLabel()));
  dash.draw('country', (sel) => {
    const d = dash.data('lpi');
    const rows = d.status === 'ok' ? d.data.filter((r) => S.isMena(r.group)).sort((a, b) => d3.ascending(a.country, b.country)) : [];
    sel.replaceChildren(new Option(S.t('Country…'), ''), ...rows.map((r) => new Option(S.n(r.iso3, r.country), r.iso3)));
    sel.value = S.isCountry() ? S.scope : ''; sel.onchange = () => S.setScope(sel.value || 'MENA');
  });

  // Radar
  dash.draw('radar-name', (el) => set(el, S.cname(S.focus())));
  dash.draw('radar', (el) => {
    if (!S.ok('readiness')) return S.fail(el, 'lpi', 'gii');
    el.replaceChildren();
    const data = dash.data('readiness').data, foc = S.focus();
    const axes = Array.from(new Set(data.map((r) => r.axis)));
    const get = (iso) => axes.map((a) => { const r = data.find((x) => x.iso3 === iso && x.axis === a); return r && r.score != null ? r.score : 0; });
    const A = get(foc), B = get(S.bench), CMP = S.compare.filter((x) => x !== foc).map((iso, i) => ({ iso, v: get(iso), c: ['#fbbf24', '#f472b6', '#a3e635'][i] }));
    const W = Math.min(Math.max(260, el.clientWidth), 380), H = W + 24, C = W / 2, R = W / 2 - 52;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `-48 0 ${W + 96} ${H}`).attr('role', 'img').attr('aria-label', 'Radar of six logistics capabilities for ' + S.cname(foc) + ' compared with ' + S.cname(S.bench));
    S.glow(svg, 'rdg');
    const defs = svg.select('defs'), gr = defs.append('radialGradient').attr('id', 'rdf');
    gr.append('stop').attr('offset', '0%').attr('stop-color', '#2dd4bf').attr('stop-opacity', 0.15); gr.append('stop').attr('offset', '100%').attr('stop-color', '#a78bfa').attr('stop-opacity', 0.55);
    const ang = (i) => -Math.PI / 2 + i * 2 * Math.PI / axes.length;
    const pt = (i, v) => [C + Math.cos(ang(i)) * R * v / 100, C + Math.sin(ang(i)) * R * v / 100];
    const g = svg.append('g');
    [25, 50, 75, 100].forEach((v) => g.append('polygon').attr('points', axes.map((a, i) => pt(i, v).join(',')).join(' ')).style('fill', 'none').style('stroke', 'var(--line)'));
    axes.forEach((a, i) => {
      const [x, y] = pt(i, 100); g.append('line').attr('x1', C).attr('y1', C).attr('x2', x).attr('y2', y).style('stroke', 'var(--line)');
      const [lx, ly] = pt(i, 122);
      g.append('text').attr('class', 'sx-lbl').attr('x', lx).attr('y', ly).attr('dy', '0.35em').attr('text-anchor', Math.abs(lx - C) < 8 ? 'middle' : lx > C ? 'start' : 'end').style('fill', 'var(--ink2)').text(S.t(a));
    });
    const poly = (vals) => vals.map((v, i) => pt(i, v).join(',')).join(' ');
    const b = g.append('polygon').style('fill', 'none').style('stroke', '#38bdf8').style('stroke-width', 1.5).style('stroke-dasharray', '4 4');
    const a = g.append('polygon').style('fill', 'url(#rdf)').style('stroke', '#2dd4bf').style('stroke-width', 2.2).attr('filter', 'url(#rdg)');
    const dots = g.append('g');
    const go = S.anim('radar');
    const tween = (sel, vals, delay) => { if (!go) { sel.attr('points', poly(vals)); return; } sel.attr('points', poly(vals.map(() => 0))).transition().delay(delay).duration(1400).ease(d3.easeBackOut.overshoot(1.1)).attrTween('points', () => (t) => poly(vals.map((v) => v * t))); };
    tween(b, B, 200);
    CMP.forEach((cp, k) => tween(g.append('polygon').style('fill', cp.c).style('fill-opacity', 0.08).style('stroke', cp.c).style('stroke-width', 1.8), cp.v, 350 + k * 100));
    tween(a, A, 500);
    A.forEach((v, i) => { const c = dots.append('circle').attr('r', 3.5).style('fill', '#2dd4bf'); const [x, y] = pt(i, v); if (go) c.attr('cx', C).attr('cy', C).transition().delay(500).duration(1400).ease(d3.easeBackOut.overshoot(1.1)).attr('cx', x).attr('cy', y); else c.attr('cx', x).attr('cy', y); });
    const tip = S.tip(el);
    axes.forEach((ax, i) => {
      const [x, y] = pt(i, 100);
      g.append('line').attr('x1', C).attr('y1', C).attr('x2', x).attr('y2', y).style('stroke', 'transparent').style('stroke-width', 26).style('cursor', 'pointer')
        .on('pointermove', (ev) => { const [mx, my] = d3.pointer(ev, el); S.showTip(el, tip, mx, my, ax, [[S.cname(foc), d3.format('.0f')(A[i]), '#2dd4bf'], [S.cname(S.bench), d3.format('.0f')(B[i]), '#38bdf8']].concat(CMP.map((cp) => [S.cname(cp.iso), d3.format('.0f')(cp.v[i]), cp.c]))); })
        .on('pointerleave', () => { tip.style.opacity = 0; });
    });
    const lg = svg.append('g').attr('transform', `translate(${C},${H - 8})`).attr('text-anchor', 'middle');
    lg.append('text').attr('class', 'sx-lbl').style('fill', '#2dd4bf').attr('x', -60).text('● ' + S.cname(foc));
    lg.append('text').attr('class', 'sx-lbl').style('fill', '#38bdf8').attr('x', 70).text('┄ ' + S.cname(S.bench));
  });

  // KPI cards
  const kv = (el, key, v, fmt) => { if (v == null) { set(el, '—'); return; } S.countUp(el, key, v, fmt); };
  const where = (el, k) => { el.dataset.where = 'key=' + k; };
  dash.draw('k-teu-scope', (el) => set(el, S.scope === 'World' ? 'World' : S.scopeLabel()));
  dash.draw('k-teu', (el) => { const k = S.key('teu'); where(el, k); const r = S.row('teu_summary', k); kv(el, 'kteu', r && r.teu_latest_m, f2); });
  dash.draw('k-teu-d', (el) => { const k = S.key('teu'); where(el, k); const r = S.row('teu_summary', k); if (!r || r.change_vs_2019_pct == null) { set(el, '—'); return; } set(el, S.pct(r.change_vs_2019_pct)); S.chip(el, r.change_vs_2019_pct, true); });
  dash.draw('sp-teu', (el) => { const d = dash.data('teu'); if (d.status !== 'ok') { el.replaceChildren(); return; } const k = S.key('teu'); const rs = d.data.filter((r) => (k === 'MENA' ? S.isMena(r.group) : k === 'GCC' ? r.group === 'GCC' : r.iso3 === k)); const by = d3.rollup(rs, (v) => d3.sum(v, (r) => +r.teu_thousand), (r) => +r.year); S.spark(el, Array.from(by).sort((a, b) => a[0] - b[0]).filter(([y]) => y <= 2024).map(([, v]) => v), '#2dd4bf', 'spteu'); });
  dash.draw('k-air-scope', (el) => set(el, S.scope === 'World' ? 'World' : S.scopeLabel()));
  dash.draw('k-air', (el) => { const k = S.key('air'); where(el, k); const r = S.row('air_summary', k); kv(el, 'kair', r && r.air_latest_bn, f2); });
  dash.draw('k-air-d', (el) => { const k = S.key('air'); where(el, k); const r = S.row('air_summary', k); if (!r || r.change_vs_2019_pct == null) { set(el, '—'); return; } set(el, S.pct(r.change_vs_2019_pct)); S.chip(el, r.change_vs_2019_pct, true); });
  dash.draw('sp-air', (el) => { const d = dash.data('air'); if (d.status !== 'ok') { el.replaceChildren(); return; } const k = S.key('air'); const rs = d.data.filter((r) => (k === 'MENA' ? S.isMena(r.group) : k === 'GCC' ? r.group === 'GCC' : r.iso3 === k)); const by = d3.rollup(rs, (v) => d3.sum(v, (r) => +r.air_freight_mn_tkm), (r) => +r.year); S.spark(el, Array.from(by).sort((a, b) => a[0] - b[0]).map(([, v]) => v), '#38bdf8', 'spair'); });
  dash.draw('k-tat-scope', (el) => set(el, S.scope === 'World' ? 'all economies shown' : S.scopeLabel()));
  dash.draw('k-tat', (el) => { const k = S.key('lpi'); where(el, k); const r = S.row('lpi_scope', k); kv(el, 'ktat', r && r.port_turnaround_days, d3.format('.1f')); });
  dash.draw('k-tat-d', (el) => { const k = S.key('lpi'); where(el, k); const r = S.row('lpi_scope', k); set(el, r && r.import_dwell_days != null ? d3.format('.1f')(r.import_dwell_days) : '—'); });
  dash.draw('k-gii', (el) => { const k = S.key('gii'); where(el, k); const r = S.row('gii_scope', k); kv(el, 'kgii', r && r.best_rank, d3.format('d')); });
  dash.draw('k-gii-d', (el) => { const k = S.key('gii'); where(el, k); const r = S.row('gii_scope', k); set(el, r ? r.best_country : 'Not ranked'); });
  dash.draw('k-ebl', (el) => { const k = S.key('mletr'); where(el, k); const r = S.row('mletr_scope', k); kv(el, 'kebl', r ? r.adopters : null, d3.format('d')); });
  dash.draw('k-ebl-d', (el) => { const k = S.key('mletr'); where(el, k); const r = S.row('mletr_scope', k); set(el, r && r.first_year ? 'since ' + r.first_year : 'not yet adopted'); });
  dash.draw('sp-ebl', (el) => {
    el.replaceChildren(); if (!S.ok('mletr')) return;
    const rows = dash.data('mletr').data.slice().sort((a, b) => +a.year - +b.year), W = Math.max(120, el.clientWidth), H = 36, step = W / rows.length;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Adopting jurisdictions in order of adoption');
    const inS = (r) => S.scope === 'World' || (S.scope === 'GCC' ? S.GCC.includes(r.iso3) : S.isCountry() ? r.iso3 === S.scope : r.region === 'MENA');
    const c = svg.selectAll('circle').data(rows).join('circle').attr('cx', (d, i) => i * step + step / 2).attr('cy', H / 2).style('fill', (d) => (inS(d) ? '#a3e635' : 'rgba(148,163,195,.35)'));
    if (S.anim('spebl')) c.attr('r', 0).transition().delay((d, i) => 200 + i * 80).duration(600).ease(d3.easeBackOut).attr('r', (d) => (inS(d) ? 6 : 4)); else c.attr('r', (d) => (inS(d) ? 6 : 4));
  });
  const wciRow = () => S.row('wci', 'WCI composite', 'route');
  dash.draw('k-wci', (el) => { const r = wciRow(); kv(el, 'kw', r && +r.usd_per_feu, (v) => '$' + d3.format(',.0f')(v)); });
  dash.draw('k-wci-d', (el) => { const r = wciRow(); if (!r) { set(el, '—'); return; } const v = +r.week_on_week_pct; set(el, S.pct(v)); S.chip(el, v, false); });
  dash.draw('k-wci-date', (el) => { const r = wciRow(); set(el, r ? d3.utcFormat('%-d %b %Y')(S.parse(r.assessed)) : '—'); });
  dash.draw('sp-wci', (el) => {
    el.replaceChildren(); if (!S.ok('wci')) return;
    const rows = dash.data('wci').data.map((r) => +r.usd_per_feu), W = Math.max(120, el.clientWidth), H = 36, bw = W / rows.length;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Spot rates by lane');
    const y = d3.scaleLinear().domain([0, d3.max(rows)]).range([0, H - 2]);
    const b = svg.selectAll('rect').data(rows).join('rect').attr('x', (d, i) => i * bw + 3).attr('width', bw - 6).attr('rx', 3).style('fill', (d, i) => (i ? 'rgba(244,114,182,.5)' : '#f472b6'));
    if (S.anim('spw')) b.attr('y', H).attr('height', 0).transition().delay((d, i) => 300 + i * 90).duration(900).attr('y', (d) => H - y(d)).attr('height', (d) => y(d)); else b.attr('y', (d) => H - y(d)).attr('height', (d) => y(d));
  });

  // 01 League (lollipop, animated re-rank)
  dash.draw('league', (el) => {
    if (!S.ok('lpi')) return S.fail(el, 'lpi');
    const M = S.METRICS[S.metric], f = S.metric, all = dash.data('lpi').data;
    const ref = all.find((r) => r.iso3 === 'MEA');
    let rows = all.filter((r) => !['MEA', 'HIC'].includes(r.iso3) && r[f] !== null && r[f] !== '' && (S.scope === 'GCC' ? r.group !== 'Other MENA' : true));
    rows = rows.map((r) => ({ ...r, v: +r[f] })).sort((a, b) => (M.better === 'low' ? a.v - b.v : b.v - a.v));
    const W = Math.max(300, el.clientWidth), rh = 24, H = rows.length * rh + 34, go = S.anim('league');
    let svg = d3.select(el).select('svg');
    if (svg.empty()) { el.replaceChildren(); svg = d3.select(el).append('svg').attr('role', 'img'); svg.append('g').attr('class', 'ax'); svg.append('line').attr('class', 'ref'); svg.append('text').attr('class', 'reft sx-lbl'); svg.append('g').attr('class', 'rows'); S.tip(el); }
    svg.attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('aria-label', M.label + ' by economy, ranked best to worst');
    const lw = Math.ceil(S.measure(svg, rows.map((r) => r.country))) + 14, vw = 52;
    const x = d3.scaleLinear().domain([0, d3.max(rows, (r) => r.v) * 1.05]).nice().range([lw, W - vw]);
    svg.select('.ax').attr('transform', `translate(0,${H - 22})`).call(d3.axisBottom(x).ticks(Math.max(2, Math.floor((W - lw) / 80))).tickSize(-(H - 30))).call((g) => g.select('.domain').remove()).selectAll('line').style('stroke', 'var(--line)');
    const rv = ref && ref[f] !== '' && ref[f] != null ? +ref[f] : null;
    svg.select('.ref').attr('y1', 4).attr('y2', H - 22).style('stroke', '#fbbf24').style('stroke-dasharray', '4 4').style('opacity', rv == null ? 0 : 0.8).transition().duration(go ? 900 : 0).attr('x1', rv == null ? lw : x(rv)).attr('x2', rv == null ? lw : x(rv));
    svg.select('.reft').attr('y', H - 26).style('fill', '#fbbf24').attr('text-anchor', 'start').style('opacity', rv == null ? 0 : 1).text(rv == null ? '' : S.t('MENA region') + ' ' + M.fmt(rv)).transition().duration(go ? 900 : 0).attr('x', rv == null ? lw : Math.min(x(rv) + 4, W - 110));
    const tip = el.querySelector('.sx-tip');
    const g = svg.select('.rows').selectAll('g.r').data(rows, (r) => r.iso3).join((en) => { const e = en.append('g').attr('class', 'r').attr('transform', (r, i) => `translate(0,${i * rh + 4})`).style('opacity', 0); e.append('text').attr('class', 'sx-lbl nm').attr('dy', '0.35em'); e.append('line').attr('class', 'st'); e.append('circle').attr('class', 'hd').attr('r', 6); e.append('text').attr('class', 'sx-lbl vl').attr('dy', '0.35em'); e.append('rect').attr('class', 'hit').style('fill', 'transparent'); return e; }, (up) => up, (ex) => ex.transition().duration(400).style('opacity', 0).remove());
    g.transition().duration(go ? 900 : 0).delay((r, i) => (go ? i * 25 : 0)).attr('transform', (r, i) => `translate(0,${i * rh + rh / 2})`).style('opacity', (r) => (S.isCountry() && r.iso3 !== S.scope && S.isMena(r.group) ? 0.45 : 1));
    g.select('.nm').attr('x', lw - 10).attr('text-anchor', 'end').style('fill', (r) => (S.isCountry() && r.iso3 === S.scope ? '#fbbf24' : r.iso3 === S.bench ? '#38bdf8' : r.group === 'Benchmark' ? '#7dd3fc' : 'var(--ink2)')).style('font-weight', (r) => ((S.isCountry() && r.iso3 === S.scope) || r.iso3 === S.bench ? 700 : null)).text((r) => S.n(r.iso3, r.country));
    g.select('.st').attr('x1', lw).attr('y1', 0).attr('y2', 0).style('stroke', (r) => S.colorOf(r)).style('stroke-width', 3).style('opacity', 0.5).transition().duration(go ? 1000 : 0).attr('x2', (r) => x(r.v));
    g.select('.hd').style('fill', (r) => S.colorOf(r)).attr('filter', null).transition().duration(go ? 1000 : 0).attr('cx', (r) => x(r.v)).attr('cy', 0);
    g.select('.vl').style('fill', 'var(--ink)').text((r) => M.fmt(r.v)).transition().duration(go ? 1000 : 0).attr('x', (r) => x(r.v) + 10);
    g.select('.hit').attr('x', 0).attr('y', -rh / 2).attr('width', W).attr('height', rh).style('cursor', (r) => (S.isMena(r.group) ? 'pointer' : 'default'))
      .on('pointermove', (ev, r) => { const [, py] = d3.pointer(ev, el); S.showTip(el, tip, x(r.v) * el.clientWidth / W, py, S.n(r.iso3, r.country), [[M.label, M.fmt(r.v) + ' ' + M.unit, S.colorOf(r)], ['Group', r.group]]); })
      .on('pointerleave', () => { tip.style.opacity = 0; }).on('click', (ev, r) => { if (S.isMena(r.group)) S.setScope(r.iso3); });
  });

  // 02 TEU lines
  const teuSeries = () => {
    const d = dash.data('teu'); if (d.status !== 'ok') return [];
    let rows = d.data.filter((r) => S.inScope(r) && r.group !== 'Benchmark');
    if (S.scope === 'World') rows = d.data.filter((r) => S.isMena(r.group));
    const latest = d3.rollup(rows, (v) => d3.max(v, (r) => +r.teu_thousand), (r) => r.iso3);
    let isos = Array.from(latest).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k);
    if (S.isCountry() && !isos.includes(S.scope)) isos = [S.scope].concat(isos.slice(0, 5));
    return isos.map((iso, i) => { const rs = d.data.filter((r) => r.iso3 === iso).sort((a, b) => +a.year - +b.year); return { label: S.n(iso, rs.length ? rs[0].country : iso), iso, color: S.isCountry() && iso === S.scope ? S.HI : S.SERIES[i % S.SERIES.length], width: S.isCountry() && iso === S.scope ? 3.2 : 2.2, values: rs.map((r) => ({ x: new Date(Date.UTC(+r.year, 0, 1)), y: +r.teu_thousand })) }; });
  };
  dash.draw('teu-legend', (el) => { el.replaceChildren(); teuSeries().forEach((s) => { const sp = document.createElement('span'); const sw = document.createElement('i'); sw.className = 'sx-sw'; sw.style.background = s.color; sw.style.color = s.color; sp.append(sw, document.createTextNode(s.label)); el.append(sp); }); });
  dash.draw('teu-lines', (el) => {
    if (!S.ok('teu')) return S.fail(el, 'teu');
    S.lines(el, teuSeries(), { height: 250, animate: S.anim('teu-lines'), aria: 'Container port traffic by economy, 2015 to 2024', yFmt: d3.format('~s'), xFmt: d3.utcFormat('%Y'), tipTitle: d3.utcFormat('%Y'), tipFmt: (d) => d3.format(',.0f')(d.y) + 'k TEU' });
  });

  // 03 TEU growth bars
  dash.draw('teu-bars', (el) => {
    if (!S.ok('teu_summary')) return S.fail(el, 'teu');
    el.replaceChildren();
    let rows = dash.data('teu_summary').data.filter((r) => S.isMena(r.group) && r.change_vs_2019_pct != null && (S.scope === 'GCC' ? r.group === 'GCC' : true)).sort((a, b) => b.latest - a.latest);
    const W = Math.max(300, el.clientWidth), rh = 26, H = rows.length * rh + 6, go = S.anim('teu-bars');
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Latest container throughput and change since 2019 by economy');
    const defs = svg.append('defs'); const gg = defs.append('linearGradient').attr('id', 'tbg'); gg.append('stop').attr('offset', '0%').attr('stop-color', '#0ea5e9'); gg.append('stop').attr('offset', '100%').attr('stop-color', '#2dd4bf');
    const lw = Math.ceil(S.measure(svg, rows.map((r) => S.n(r.key, r.country)))) + 12, vw = Math.ceil(S.measure(svg, ['23,467k  +24.8%'])) + 14;
    const x = d3.scaleSqrt().domain([0, d3.max(rows, (r) => r.latest)]).range([0, W - lw - vw]);
    const tip = S.tip(el);
    rows.forEach((r, i) => {
      const yy = i * rh + 3, sel = S.isCountry() && r.key === S.scope, dim = S.isCountry() && !sel;
      const g = svg.append('g').style('opacity', dim ? 0.4 : 1).style('cursor', 'pointer');
      g.append('text').attr('class', 'sx-lbl').attr('x', lw - 8).attr('y', yy + rh / 2).attr('dy', '0.35em').attr('text-anchor', 'end').style('fill', sel ? '#fbbf24' : 'var(--ink2)').style('font-weight', sel ? 700 : null).text(S.n(r.key, r.country));
      const b = g.append('rect').attr('x', lw).attr('y', yy + 5).attr('height', rh - 12).attr('rx', 6).style('fill', sel ? '#fbbf24' : 'url(#tbg)');
      const t = g.append('text').attr('class', 'sx-lbl').attr('y', yy + rh / 2).attr('dy', '0.35em').style('font-weight', 600);
      t.append('tspan').style('fill', 'var(--ink)').text(d3.format(',.0f')(r.latest) + 'k  ');
      t.append('tspan').style('fill', r.change_vs_2019_pct >= 0 ? '#a3e635' : '#fb7185').text(S.pct(r.change_vs_2019_pct));
      if (go) { b.attr('width', 0).transition().delay(i * 60).duration(1100).ease(d3.easeCubicOut).attr('width', Math.max(2, x(r.latest))); t.attr('x', lw + 6).style('opacity', 0).transition().delay(i * 60).duration(1100).ease(d3.easeCubicOut).attr('x', lw + Math.max(2, x(r.latest)) + 8).style('opacity', 1); }
      else { b.attr('width', Math.max(2, x(r.latest))); t.attr('x', lw + Math.max(2, x(r.latest)) + 8); }
      g.append('rect').attr('x', 0).attr('y', yy).attr('width', W).attr('height', rh).style('fill', 'transparent')
        .on('pointermove', (ev) => { const [, py] = d3.pointer(ev, el); S.showTip(el, tip, el.clientWidth * 0.4, py, S.n(r.key, r.country), [['Latest year', String(r.latest_year)], ['Throughput', d3.format(',.0f')(r.latest) + 'k TEU'], ['2019', d3.format(',.0f')(r.base) + 'k TEU'], ['Change', S.pct(r.change_vs_2019_pct)]]); })
        .on('pointerleave', () => { tip.style.opacity = 0; }).on('click', () => S.setScope(r.key));
    });
  });

  // 04 LSCI heat grid
  dash.draw('lsci-heat', (el) => {
    if (!S.ok('lsci', 'lsci_summary')) return S.fail(el, 'lsci');
    el.replaceChildren();
    const data = dash.data('lsci').data, sum = dash.data('lsci_summary').data;
    let ctry = sum.filter((r) => (S.scope === 'GCC' ? r.group === 'GCC' || r.group === 'Benchmark' : true)).sort((a, b) => b.lsci - a.lsci);
    const qs = Array.from(new Set(data.map((r) => r.quarter))).sort();
    const W = Math.max(320, el.clientWidth), rh = 22, top = 22;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('role', 'img').attr('aria-label', 'Heat grid of liner shipping connectivity by economy and quarter');
    const lw = Math.ceil(S.measure(svg, ctry.map((r) => S.n(r.iso3, r.country)))) + 12, rw = 74;
    const cw = Math.max(4, (W - lw - rw) / qs.length), H = ctry.length * rh + top + 6;
    svg.attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
    const col = d3.scaleSequentialLog(d3.interpolateRgbBasis(['#1e1b4b', '#5b21b6', '#0ea5e9', '#2dd4bf', '#d9f99d'])).domain([20, 1350]).clamp(true);
    qs.forEach((q, j) => { if (q.endsWith('Q1')) svg.append('text').attr('class', 'sx-lbl').attr('x', lw + j * cw).attr('y', 12).text(q.slice(0, 4)); });
    const tip = S.tip(el), go = S.anim('heat');
    ctry.forEach((c, i) => {
      const y = top + i * rh, sel = S.isCountry() && c.iso3 === S.scope;
      svg.append('text').attr('class', 'sx-lbl').attr('x', lw - 8).attr('y', y + rh / 2).attr('dy', '0.35em').attr('text-anchor', 'end').style('fill', sel ? '#fbbf24' : c.group === 'Benchmark' ? '#7dd3fc' : 'var(--ink2)').style('font-weight', sel ? 700 : null).text(S.n(c.iso3, c.country));
      const rows = data.filter((r) => r.iso3 === c.iso3);
      const cells = svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (r) => lw + qs.indexOf(r.quarter) * cw + 0.5).attr('y', y + 2).attr('width', cw - 1).attr('height', rh - 4).attr('rx', 2).style('fill', (r) => col(+r.lsci))
        .on('pointermove', (ev, r) => { const [mx, my] = d3.pointer(ev, el); S.showTip(el, tip, mx, my, S.n(c.iso3, c.country) + ' · ' + r.quarter, [['LSCI', d3.format('.1f')(+r.lsci), col(+r.lsci)], ['World rank', r.world_rank]]); })
        .on('pointerleave', () => { tip.style.opacity = 0; });
      if (go) cells.style('opacity', 0).transition().delay((r) => qs.indexOf(r.quarter) * 35 + i * 15).duration(400).style('opacity', 1);
      if (sel) svg.append('rect').attr('x', lw - 2).attr('y', y).attr('width', qs.length * cw + 3).attr('height', rh).attr('rx', 4).style('fill', 'none').style('stroke', '#fbbf24').style('stroke-width', 1.5);
      const t = svg.append('text').attr('class', 'sx-lbl').attr('x', W - rw + 8).attr('y', y + rh / 2).attr('dy', '0.35em').style('font-variant-numeric', 'tabular-nums');
      t.append('tspan').style('fill', 'var(--ink)').style('font-weight', 600).text(d3.format('.0f')(c.lsci));
      t.append('tspan').style('fill', 'var(--mute)').text('  #' + c.world_rank);
    });
  });

  // 05 MLETR timeline
  dash.draw('mletr', (el) => {
    if (!S.ok('mletr')) return S.fail(el, 'mletr');
    el.replaceChildren();
    const rows = dash.data('mletr').data.map((r) => ({ ...r, y: +r.year })).sort((a, b) => a.y - b.y);
    const W = Math.max(300, el.clientWidth), by = d3.group(rows, (r) => r.y), maxN = d3.max(Array.from(by.values()), (v) => v.length);
    const rowH = 22, H = 70 + maxN * rowH;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Timeline of jurisdictions adopting the UNCITRAL Model Law on Electronic Transferable Records');
    S.glow(svg, 'mlg');
    const x = d3.scalePoint().domain(d3.range(2017, 2027)).range([24, W - 24]), base = H - 30;
    const ln = svg.append('line').attr('x1', x(2017)).attr('y1', base).attr('y2', base).style('stroke', 'url(#mlgr)').style('stroke-width', 3);
    const gr = svg.select('defs').append('linearGradient').attr('id', 'mlgr'); gr.append('stop').attr('offset', '0%').attr('stop-color', '#2dd4bf'); gr.append('stop').attr('offset', '100%').attr('stop-color', '#a3e635');
    const go = S.anim('mletr');
    if (go) ln.attr('x2', x(2017)).transition().duration(1600).ease(d3.easeCubicInOut).attr('x2', x(2026)); else ln.attr('x2', x(2026));
    d3.range(2017, 2027).forEach((yr) => svg.append('text').attr('class', 'sx-lbl').attr('x', x(yr)).attr('y', base + 18).attr('text-anchor', 'middle').text(W > 560 ? String(yr) : "'" + String(yr).slice(2)));
    svg.append('circle').attr('cx', x(2017)).attr('cy', base).attr('r', 5).style('fill', '#2dd4bf');
    const inS = (r) => (S.scope === 'GCC' ? S.GCC.includes(r.iso3) : S.isCountry() ? r.iso3 === S.scope : r.region === 'MENA');
    const tip = S.tip(el);
    for (const [yr, rs] of by) {
      rs.forEach((r, k) => {
        const cx = x(yr), cy = base - 18 - k * rowH, hi = inS(r);
        const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);
        if (hi && S.motion) g.append('circle').attr('r', 6).attr('class', 'sx-pulse').style('fill', 'none').style('stroke', '#fbbf24').style('stroke-width', 2);
        const c = g.append('circle').style('fill', hi ? '#fbbf24' : '#2dd4bf').style('opacity', hi ? 1 : 0.75).attr('filter', hi ? 'url(#mlg)' : null);
        if (go) c.attr('r', 0).transition().delay(300 + (yr - 2017) * 160 + k * 60).duration(600).ease(d3.easeBackOut).attr('r', hi ? 6.5 : 5); else c.attr('r', hi ? 6.5 : 5);
        g.append('rect').attr('x', -10).attr('y', -10).attr('width', 20).attr('height', 20).style('fill', 'transparent').style('cursor', 'pointer')
          .on('pointermove', (ev) => { const [mx, my] = d3.pointer(ev, el); S.showTip(el, tip, mx, my, r.jurisdiction, [['Year', String(r.year)], ['Region', r.region]].concat(r.note ? [['Note', r.note]] : [])); })
          .on('pointerleave', () => { tip.style.opacity = 0; });
        if (hi) g.append('text').attr('class', 'sx-lbl').attr('x', yr > 2022 ? -10 : 10).attr('text-anchor', yr > 2022 ? 'end' : 'start').attr('dy', '0.35em').style('fill', '#fbbf24').style('font-weight', 600).text(S.lang === 'ar' && S.AR[r.iso3] ? S.AR[r.iso3] : r.jurisdiction.replace(' (UAE)', ''));
      });
    }
    const lg = svg.append('g').attr('transform', 'translate(24,14)');
    [['#fbbf24', S.t('In selected scope')], ['#2dd4bf', S.t('Elsewhere')]].forEach(([c, t], i) => { const g = lg.append('g').attr('transform', `translate(${i * 130},0)`); g.append('circle').attr('r', 5).style('fill', c); g.append('text').attr('class', 'sx-lbl').attr('x', 10).attr('dy', '0.35em').text(t); });
  });

  // 06 GII bars
  dash.draw('gii-bars', (el) => {
    if (!S.ok('gii')) return S.fail(el, 'gii');
    el.replaceChildren();
    const rows = dash.data('gii').data.filter((r) => (S.scope === 'GCC' ? r.group !== 'Other MENA' : true)).map((r) => ({ ...r, v: +r.gii_score_2025 })).sort((a, b) => b.v - a.v);
    const W = Math.max(300, el.clientWidth), rh = 22, H = rows.length * rh + 6, go = S.anim('gii');
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Global Innovation Index 2025 scores');
    const defs = svg.append('defs');
    [['gm', '#fbbf24', '#fb923c'], ['gb', '#0ea5e9', '#38bdf8']].forEach(([id, a, b]) => { const g = defs.append('linearGradient').attr('id', id); g.append('stop').attr('offset', '0%').attr('stop-color', a); g.append('stop').attr('offset', '100%').attr('stop-color', b); });
    const lw = Math.ceil(S.measure(svg, rows.map((r) => S.n(r.iso3, r.country)))) + 12, vw = 70;
    const x = d3.scaleLinear().domain([0, 70]).range([0, W - lw - vw]);
    rows.forEach((r, i) => {
      const yy = i * rh + 3, sel = S.isCountry() && r.iso3 === S.scope;
      svg.append('text').attr('class', 'sx-lbl').attr('x', lw - 8).attr('y', yy + rh / 2).attr('dy', '0.35em').attr('text-anchor', 'end').style('fill', sel ? '#fbbf24' : r.group === 'Benchmark' ? '#7dd3fc' : 'var(--ink2)').style('font-weight', sel ? 700 : null).text(S.n(r.iso3, r.country));
      const b = svg.append('rect').attr('x', lw).attr('y', yy + 4).attr('height', rh - 9).attr('rx', 5).style('fill', r.group === 'Benchmark' ? 'url(#gb)' : 'url(#gm)').style('opacity', S.isCountry() && !sel && r.group !== 'Benchmark' ? 0.45 : 1);
      const t = svg.append('text').attr('class', 'sx-lbl').attr('y', yy + rh / 2).attr('dy', '0.35em');
      t.append('tspan').style('fill', 'var(--ink)').style('font-weight', 600).text(d3.format('.1f')(r.v));
      t.append('tspan').style('fill', 'var(--mute)').text('  #' + r.gii_rank_2025);
      if (go) { b.attr('width', 0).transition().delay(i * 50).duration(1000).ease(d3.easeCubicOut).attr('width', x(r.v)); t.attr('x', lw + 6).style('opacity', 0).transition().delay(i * 50).duration(1000).ease(d3.easeCubicOut).attr('x', lw + x(r.v) + 8).style('opacity', 1); }
      else { b.attr('width', x(r.v)); t.attr('x', lw + x(r.v) + 8); }
    });
  });

  // 07 Air cargo dumbbell (log)
  dash.draw('air-bars', (el) => {
    if (!S.ok('air_summary')) return S.fail(el, 'air');
    el.replaceChildren();
    const rows = dash.data('air_summary').data.filter((r) => S.isMena(r.group) && r.base && r.latest > 0 && (S.scope === 'GCC' ? r.group === 'GCC' : true)).sort((a, b) => b.latest - a.latest);
    const W = Math.max(300, el.clientWidth), rh = 26, H = rows.length * rh + 30, go = S.anim('air');
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Air freight by economy, 2019 and 2023');
    S.glow(svg, 'ag');
    const lw = Math.ceil(S.measure(svg, rows.map((r) => S.n(r.key, r.country)))) + 12, vw = 60;
    const x = d3.scaleLog().domain([5, 20000]).range([lw, W - vw]).clamp(true);
    svg.append('g').attr('transform', `translate(0,${H - 22})`).call(d3.axisBottom(x).tickValues([10, 100, 1000, 10000]).tickFormat(d3.format('~s')).tickSize(-(H - 26))).call((g) => g.select('.domain').remove()).selectAll('line').style('stroke', 'var(--line)');
    const tip = S.tip(el);
    rows.forEach((r, i) => {
      const yy = i * rh + rh / 2, a = x(r.base), b = x(r.latest), up = r.latest >= r.base, col = S.isCountry() && r.key === S.scope ? '#fbbf24' : up ? '#2dd4bf' : '#f472b6';
      const g = svg.append('g').style('opacity', S.isCountry() && r.key !== S.scope ? 0.45 : 1);
      g.append('text').attr('class', 'sx-lbl').attr('x', lw - 10).attr('y', yy).attr('dy', '0.35em').attr('text-anchor', 'end').style('fill', 'var(--ink2)').text(S.n(r.key, r.country));
      const ln = g.append('line').attr('x1', a).attr('y1', yy).attr('y2', yy).style('stroke', col).style('stroke-width', 3).style('opacity', 0.5);
      g.append('circle').attr('cx', a).attr('cy', yy).attr('r', 5).style('fill', 'var(--bg)').style('stroke', 'var(--mute)').style('stroke-width', 1.5);
      const dot = g.append('circle').attr('cy', yy).attr('r', 6).style('fill', col).attr('filter', 'url(#ag)');
      g.append('text').attr('class', 'sx-lbl').attr('x', W - vw + 8).attr('y', yy).attr('dy', '0.35em').style('fill', col).style('font-weight', 600).text(S.pct(r.change_vs_2019_pct));
      if (go) { ln.attr('x2', a).transition().delay(300 + i * 60).duration(1100).attr('x2', b); dot.attr('cx', a).transition().delay(300 + i * 60).duration(1100).attr('cx', b); } else { ln.attr('x2', b); dot.attr('cx', b); }
      g.append('rect').attr('x', 0).attr('y', yy - rh / 2).attr('width', W).attr('height', rh).style('fill', 'transparent')
        .on('pointermove', (ev) => { const [, py] = d3.pointer(ev, el); S.showTip(el, tip, Math.max(a, b) * el.clientWidth / W, py, S.n(r.key, r.country), [['2019', d3.format(',.0f')(r.base) + ' mn t-km'], [String(r.latest_year), d3.format(',.0f')(r.latest) + ' mn t-km'], ['Change', S.pct(r.change_vs_2019_pct)]]); })
        .on('pointerleave', () => { tip.style.opacity = 0; });
    });
  });

  // 08 GSCPI warm/cool area
  dash.draw('gscpi-chart', (el) => {
    if (!S.ok('gscpi')) return S.fail(el, 'gscpi');
    el.replaceChildren();
    const vals = dash.data('gscpi').data.map((r) => ({ x: S.parse(r.month), y: +r.gscpi }));
    const W = Math.max(280, el.clientWidth), H = 240, id = 'gs' + (++S.uid), go = S.anim('gscpi');
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Global Supply Chain Pressure Index since 2019');
    S.glow(svg, id + 'f');
    const y = d3.scaleLinear().domain([Math.min(-2, d3.min(vals, (d) => d.y)), d3.max(vals, (d) => d.y)]).nice();
    const m = { t: 10, r: 12, b: 24, l: Math.ceil(S.measure(svg, y.ticks(5).map(d3.format('.0f')))) + 10 };
    const x = d3.scaleUtc().domain(d3.extent(vals, (d) => d.x)).range([m.l, W - m.r]); y.range([H - m.b, m.t]);
    svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.0f')).tickSize(-(W - m.l - m.r))).call((g) => g.select('.domain').remove());
    svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(Math.max(2, Math.floor((W - m.l) / 80))).tickFormat(d3.utcFormat('%Y')).tickSizeOuter(0));
    const defs = svg.select('defs');
    defs.append('clipPath').attr('id', id + 'u').append('rect').attr('x', 0).attr('y', 0).attr('width', W).attr('height', y(0));
    defs.append('clipPath').attr('id', id + 'd').append('rect').attr('x', 0).attr('y', y(0)).attr('width', W).attr('height', H);
    const gw = defs.append('linearGradient').attr('id', id + 'w').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1); gw.append('stop').attr('offset', '0%').attr('stop-color', '#f472b6').attr('stop-opacity', 0.6); gw.append('stop').attr('offset', '100%').attr('stop-color', '#fb7185').attr('stop-opacity', 0.05);
    const gc = defs.append('linearGradient').attr('id', id + 'c').attr('x1', 0).attr('x2', 0).attr('y1', 1).attr('y2', 0); gc.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.55); gc.append('stop').attr('offset', '100%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.05);
    const ar = d3.area().x((d) => x(d.x)).y0(y(0)).y1((d) => y(d.y)).curve(d3.curveMonotoneX);
    const au = svg.append('path').attr('d', ar(vals)).attr('clip-path', `url(#${id}u)`).style('fill', `url(#${id}w)`);
    const ad = svg.append('path').attr('d', ar(vals)).attr('clip-path', `url(#${id}d)`).style('fill', `url(#${id}c)`);
    svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0)).style('stroke', 'var(--mute)');
    const lp = svg.append('path').attr('d', d3.line().x((d) => x(d.x)).y((d) => y(d.y)).curve(d3.curveMonotoneX)(vals)).style('fill', 'none').style('stroke', '#f9a8d4').style('stroke-width', 2.2).attr('filter', `url(#${id}f)`);
    const last = vals[vals.length - 1];
    svg.append('circle').attr('cx', x(last.x)).attr('cy', y(last.y)).attr('r', 4.5).style('fill', '#f472b6');
    if (go) { S.drawIn(lp, 1800); [au, ad].forEach((p) => p.style('opacity', 0).transition().delay(600).duration(1200).style('opacity', 1)); }
    const tip = S.tip(el), guide = svg.append('line').style('stroke', 'var(--mute)').style('opacity', 0).attr('y1', m.t).attr('y2', H - m.b);
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).style('fill', 'transparent')
      .on('pointermove', (ev) => { const [px, py] = d3.pointer(ev); const i = d3.bisectCenter(vals.map((d) => +d.x), +x.invert(px)), d = vals[i]; guide.attr('x1', x(d.x)).attr('x2', x(d.x)).style('opacity', 1); const k = el.clientWidth / W; S.showTip(el, tip, x(d.x) * k, py * k, S.fMonth(d.x), [['GSCPI', d3.format('+.2f')(d.y), d.y > 0 ? '#f472b6' : '#38bdf8']]); })
      .on('pointerleave', () => { tip.style.opacity = 0; guide.style('opacity', 0); });
  });

  // 09 WCI bars
  dash.draw('wci-bars', (el) => {
    if (!S.ok('wci')) return S.fail(el, 'wci');
    el.replaceChildren();
    const rows = dash.data('wci').data.map((r) => ({ ...r, v: +r.usd_per_feu })).sort((a, b) => b.v - a.v);
    const W = Math.max(280, el.clientWidth), rh = 38, H = rows.length * rh + 6, go = S.anim('wci');
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Drewry WCI spot rates by route');
    const defs = svg.append('defs');
    [['wa', '#a78bfa', '#38bdf8'], ['wb', '#f472b6', '#a78bfa']].forEach(([id, a, b]) => { const g = defs.append('linearGradient').attr('id', id); g.append('stop').attr('offset', '0%').attr('stop-color', a); g.append('stop').attr('offset', '100%').attr('stop-color', b); });
    const vw = Math.ceil(S.measure(svg, ['$10,000 (-3%)'])) + 10, x = d3.scaleLinear().domain([0, d3.max(rows, (r) => r.v)]).range([0, W - vw]);
    rows.forEach((r, i) => {
      const yy = i * rh + 3, comp = r.route === 'WCI composite';
      svg.append('text').attr('class', 'sx-lbl').attr('x', 0).attr('y', yy + 10).style('fill', comp ? '#f9a8d4' : 'var(--ink2)').style('font-weight', comp ? 700 : 500).text(r.route);
      svg.append('rect').attr('x', 0).attr('y', yy + 17).attr('height', 12).attr('width', W - vw).attr('rx', 6).style('fill', 'rgba(255,255,255,.05)');
      const b = svg.append('rect').attr('x', 0).attr('y', yy + 17).attr('height', 12).attr('rx', 6).style('fill', comp ? 'url(#wb)' : 'url(#wa)');
      const t = svg.append('text').attr('class', 'sx-lbl').attr('y', yy + 23).attr('dy', '0.35em').style('fill', 'var(--ink)').style('font-weight', 600).text('$' + d3.format(',')(r.v) + ' (' + S.pct(+r.week_on_week_pct).replace('.0%', '%') + ')');
      if (go) { b.attr('width', 0).transition().delay(i * 120).duration(1200).ease(d3.easeCubicOut).attr('width', x(r.v)); t.attr('x', 6).style('opacity', 0).transition().delay(i * 120).duration(1200).ease(d3.easeCubicOut).attr('x', x(r.v) + 8).style('opacity', 1); }
      else { b.attr('width', x(r.v)); t.attr('x', x(r.v) + 8); }
    });
  });
})();
