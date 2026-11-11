(function(){
  const S = window.SCP = window.SCP || {};
  S.scope = 'MENA'; S.metric = 'port_turnaround_days'; S.seen = {}; S.uid = 0;
  S.bench = 'SGP'; S.compare = []; S.lang = 'en'; S.q = ''; S.port = null; S.mapMetric = 'mlii';
  S.W0 = { port_efficiency: 15, logistics_speed: 15, liner_connectivity: 15, air_connectivity: 15, innovation: 15, ebl_law: 15 };
  S.w = Object.assign({}, S.W0);
  S.AR = { ARE: 'الإمارات', SAU: 'السعودية', OMN: 'عُمان', QAT: 'قطر', KWT: 'الكويت', BHR: 'البحرين', IRQ: 'العراق', EGY: 'مصر', JOR: 'الأردن', MAR: 'المغرب', DZA: 'الجزائر', TUN: 'تونس', LBY: 'ليبيا', LBN: 'لبنان', YEM: 'اليمن', DJI: 'جيبوتي', SGP: 'سنغافورة', NLD: 'هولندا', CHN: 'الصين', USA: 'الولايات المتحدة', CHE: 'سويسرا', HKG: 'هونغ كونغ', JPN: 'اليابان', MEA: 'منطقة الشرق الأوسط وشمال أفريقيا', HIC: 'الاقتصادات مرتفعة الدخل', WLD: 'العالم', MENA: 'الشرق الأوسط وشمال أفريقيا', GCC: 'دول الخليج', World: 'العالم' };
  S.TX = {
    'In selected scope': 'ضمن النطاق المحدد', 'Elsewhere': 'خارج النطاق', 'MENA region': 'منطقة MENA', 'Country…': 'الدولة…', 'Add economy…': 'أضف اقتصاداً…',
    'Maritime reach': 'الوصول البحري', 'Liner services': 'خطوط الشحن', 'Port speed': 'سرعة الميناء', 'Import clearance': 'سرعة التخليص', 'Air connectivity': 'الربط الجوي', 'Innovation': 'الابتكار',
    'Port efficiency': 'كفاءة الموانئ', 'Logistics speed': 'سرعة اللوجستيات', 'Liner connectivity': 'الربط الملاحي', 'eBL law': 'قانون السند الإلكتروني',
    'Country': 'دولة', 'Port': 'ميناء', 'Section': 'قسم', 'No matches': 'لا توجد نتائج', '+ Compare': '+ قارن',
    'Merchandise trade volume': 'حجم تجارة السلع', 'Commercial services trade volume': 'حجم تجارة الخدمات', 'World GDP': 'الناتج العالمي', 'Actual': 'فعلي', 'Forecast': 'توقع'
  };
  S.t = (s) => (S.lang === 'ar' && S.TX[s]) || s;
  S.n = (iso, fallback) => (S.lang === 'ar' && S.AR[iso]) || fallback || iso;
  S.motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: no-preference)').matches : false;
  S.GCC = ['ARE', 'SAU', 'OMN', 'QAT', 'KWT', 'BHR'];
  S.GROUP_COL = { GCC: '#2dd4bf', 'Other MENA': '#a78bfa', Benchmark: '#38bdf8', Aggregate: '#93a4c3' };
  S.HI = '#fbbf24';
  S.SERIES = ['#2dd4bf', '#38bdf8', '#a78bfa', '#f472b6', '#fbbf24', '#a3e635', '#fb923c', '#fb7185'];
  S.METRICS = {
    port_turnaround_days: { label: 'Port turnaround time', unit: 'days', better: 'low', fmt: d3.format('.1f') },
    import_dwell_days: { label: 'Container import dwell time', unit: 'days', better: 'low', fmt: d3.format('.1f') },
    export_dwell_days: { label: 'Container export dwell time', unit: 'days', better: 'low', fmt: d3.format('.1f') },
    maritime_partner_economies: { label: 'Maritime partner economies', unit: 'economies', better: 'high', fmt: d3.format('.0f') },
    liner_services: { label: 'Liner services', unit: 'services', better: 'high', fmt: d3.format('.1f') },
    aviation_partner_economies: { label: 'Aviation partner economies', unit: 'economies', better: 'high', fmt: d3.format('.1f') }
  };
  S.parse = d3.utcParse('%Y-%m-%d');
  S.fMonth = d3.utcFormat('%b %Y');
  S.pct = (v) => (v > 0 ? '+' : '') + d3.format('.1f')(v) + '%';
  S.isCountry = () => !['World', 'MENA', 'GCC'].includes(S.scope);
  S.isMena = (g) => g === 'GCC' || g === 'Other MENA';
  S.inScope = (r) => S.scope === 'World' ? true : S.scope === 'GCC' ? r.group === 'GCC' : S.isMena(r.group);
  S.key = (kind) => S.scope !== 'World' ? S.scope : ({ teu: 'WLD', air: 'WLD', lpi: 'All', gii: 'World', mletr: 'World' })[kind];
  S.focus = () => (S.isCountry() ? S.scope : 'ARE');
  S.row = (id, k, f) => { const d = dash.data(id); return d.status === 'ok' ? d.data.find((r) => r[f || 'key'] === k) : null; };
  S.cname = (iso) => { const d = dash.data('lpi'); const r = d.status === 'ok' && d.data.find((x) => x.iso3 === iso); return S.n(iso, r ? r.country : iso); };
  S.scopeLabel = () => (S.isCountry() ? S.cname(S.scope) : S.n(S.scope, S.scope));
  S.colorOf = (r) => (S.isCountry() && (r.iso3 || r.key) === S.scope ? S.HI : S.GROUP_COL[r.group] || '#93a4c3');
  S.ok = (...ids) => ids.every((id) => dash.data(id).status === 'ok');
  S.fail = (el, ...ids) => {
    el.replaceChildren();
    if (ids.some((id) => ['error', 'missing'].includes(dash.data(id).status))) { const d = document.createElement('div'); d.className = 'sx-fail'; d.textContent = 'Failed to load'; el.append(d); } else el.textContent = '—';
  };
  S.chip = (el, v, goodUp, eps) => { el.classList.remove('sx-up', 'sx-dn', 'sx-fl'); if (v == null) return; el.classList.add(Math.abs(v) < (eps ?? 1) ? 'sx-fl' : (v > 0) === goodUp ? 'sx-up' : 'sx-dn'); };
  S.countUp = (el, key, to, fmt) => {
    const from = S.seen[key]; S.seen[key] = to;
    if (!S.motion || from === to) { el.textContent = fmt(to); return; }
    const start = from == null ? 0 : from, t0 = performance.now(), dur = 1400;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(k < 1 ? start + (to - start) * e : to); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  S.drawIn = (sel, dur, delay) => {
    if (!S.motion) return;
    sel.each(function () { const L = this.getTotalLength ? this.getTotalLength() : 0; d3.select(this).attr('stroke-dasharray', L + ' ' + L).attr('stroke-dashoffset', L).transition().delay(delay || 0).duration(dur || 1600).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0).on('end', function () { d3.select(this).attr('stroke-dasharray', null); }); });
  };
  S.anim = (key) => { const k = key + '|' + S.scope + '|' + S.metric; const go = S.motion && S.seen['a:' + key] !== k; S.seen['a:' + key] = k; return go; };
  S.ALL = () => Array.from(document.querySelectorAll('[data-draw]')).map((e) => e.dataset.draw).filter((v, i, a) => a.indexOf(v) === i);
  S.redrawAll = () => S.ALL().forEach((n) => dash.draw(n));
  S.redrawScope = () => ['profile', 'profile-name', 'cmp-chips', 'cmp-add', 'map', 'cppi-rank', 'insights', 'cmp-grid', 'mlii', 'scope-name', 'country', 'radar-name', 'radar', 'k-teu-scope', 'k-teu', 'k-teu-d', 'sp-teu', 'k-air-scope', 'k-air', 'k-air-d', 'sp-air', 'k-tat-scope', 'k-tat', 'k-tat-d', 'k-gii', 'k-gii-d', 'k-ebl', 'k-ebl-d', 'sp-ebl', 'league', 'teu-legend', 'teu-lines', 'teu-bars', 'lsci-heat', 'mletr', 'gii-bars', 'air-bars'].forEach((n) => dash.draw(n));
  S.setScope = (s) => { S.scope = s; document.querySelectorAll('[data-scope]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scope === s))); S.redrawScope(); };
  document.querySelectorAll('[data-scope]').forEach((b) => b.addEventListener('click', () => S.setScope(b.dataset.scope)));
  document.querySelectorAll('[data-metric]').forEach((b) => b.addEventListener('click', () => { S.metric = b.dataset.metric; document.querySelectorAll('[data-metric]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); dash.draw('league'); }));

  const root = () => document.querySelector('.sx');
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
    S.lang = b.dataset.lang; const r = root(); if (r) r.classList.toggle('ar', S.lang === 'ar');
    document.querySelectorAll('[data-lang]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.lang === S.lang)));
    S.redrawAll();
  }));
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', () => {
    const r = root(); if (!r) return; const on = !r.classList.contains('light'); r.classList.toggle('light', on); b.setAttribute('aria-pressed', String(on)); S.redrawAll();
  }));
  document.querySelectorAll('[data-bench]').forEach((s) => s.addEventListener('change', () => { S.bench = s.value; ['radar', 'league', 'cmp-grid', 'cmp-chips', 'cmp-add', 'profile', 'radar-bench'].forEach((n) => dash.draw(n)); }));
  document.querySelectorAll('[data-search]').forEach((inp) => {
    inp.addEventListener('input', () => { S.q = inp.value; dash.draw('search-results'); });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Escape') { inp.value = ''; S.q = ''; dash.draw('search-results'); } if (e.key === 'Enter') { const f = document.querySelector('.sx-res'); if (f) f.click(); } });
    inp.addEventListener('blur', () => setTimeout(() => { if (document.activeElement && document.activeElement.classList.contains('sx-res')) return; S.q = ''; dash.draw('search-results'); }, 200));
  });
  document.querySelectorAll('[data-mapm]').forEach((b) => b.addEventListener('click', () => { S.mapMetric = b.dataset.mapm; document.querySelectorAll('[data-mapm]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); dash.draw('map'); dash.draw('map-legend'); }));
  document.querySelectorAll('[data-w]').forEach((inp) => inp.addEventListener('input', () => { S.w[inp.dataset.w] = +inp.value; dash.draw('wlab'); dash.draw('mlii'); }));
  document.querySelectorAll('[data-wreset]').forEach((b) => b.addEventListener('click', () => { S.w = Object.assign({}, S.W0); document.querySelectorAll('[data-w]').forEach((inp) => { inp.value = S.W0[inp.dataset.w]; }); dash.draw('wlab'); dash.draw('mlii'); }));
  S.go = (id) => { const t = document.getElementById(id); if (t) t.scrollIntoView({ behavior: S.motion ? 'smooth' : 'auto', block: 'start' }); };
  S.addCompare = (iso) => { if (!iso || S.compare.includes(iso) || iso === S.focus()) return; S.compare = S.compare.concat(iso).slice(-3); ['cmp-chips', 'cmp-add', 'cmp-grid', 'radar'].forEach((n) => dash.draw(n)); };
  S.rmCompare = (iso) => { S.compare = S.compare.filter((x) => x !== iso); ['cmp-chips', 'cmp-add', 'cmp-grid', 'radar'].forEach((n) => dash.draw(n)); };
  S.copyBtn = (sel, textFn) => document.querySelectorAll(sel).forEach((b) => b.addEventListener('click', () => { const t = textFn(); try { navigator.clipboard.writeText(t).then(() => { b.classList.add('copied'); setTimeout(() => b.classList.remove('copied'), 1800); }, () => {}); } catch (e) {} }));
  S.tip = (el) => { const t = document.createElement('div'); t.className = 'sx-tip'; el.append(t); return t; };
  S.showTip = (el, tip, x, y, title, rows) => {
    tip.replaceChildren();
    const h = document.createElement('div'); h.className = 't'; h.textContent = title; tip.append(h);
    rows.forEach(([k, v, c]) => { const r = document.createElement('div'); r.className = 'r'; const a = document.createElement('span'); if (c) { const sw = document.createElement('i'); sw.className = 'sx-sw'; sw.style.cssText = 'width:8px;height:8px;margin-right:6px;background:' + c + ';color:' + c; a.append(sw); } a.append(document.createTextNode(k)); const b = document.createElement('span'); b.textContent = v; r.append(a, b); tip.append(r); });
    const w = el.clientWidth, tw = tip.offsetWidth || 180;
    tip.style.left = Math.min(Math.max(0, x + 14), w - tw) + 'px'; tip.style.top = Math.max(0, y - 12) + 'px'; tip.style.opacity = 1;
  };
  S.measure = (svg, labels) => { const t = svg.append('text').attr('class', 'sx-lbl'); let w = 0; labels.forEach((s) => { t.text(s); w = Math.max(w, t.node().getComputedTextLength()); }); t.remove(); return w; };
  S.glow = (svg, id) => { const f = svg.append('defs').append('filter').attr('id', id).attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%'); f.append('feGaussianBlur').attr('stdDeviation', 3).attr('result', 'b'); const m = f.append('feMerge'); m.append('feMergeNode').attr('in', 'b'); m.append('feMergeNode').attr('in', 'SourceGraphic'); };
  S.lines = (el, series, o) => {
    el.replaceChildren();
    const W = Math.max(280, el.clientWidth), H = o.height, id = 'g' + (++S.uid);
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', o.aria);
    S.glow(svg, id);
    const all = series.flatMap((s) => s.values); if (!all.length) return;
    const x = d3.scaleUtc().domain(o.xDomain || d3.extent(all, (d) => d.x));
    const y = d3.scaleLinear().domain([Math.min(o.yFloor ?? 0, d3.min(all, (d) => d.y)), d3.max(all, (d) => d.y)]).nice();
    const m = { t: 10, r: 12, b: 24, l: Math.ceil(S.measure(svg, y.ticks(5).map(o.yFmt))) + 10 };
    x.range([m.l, W - m.r]); y.range([H - m.b, m.t]);
    svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(o.yFmt).tickSize(-(W - m.l - m.r))).call((g) => g.select('.domain').remove());
    svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(Math.max(2, Math.floor((W - m.l) / 80))).tickFormat(o.xFmt).tickSizeOuter(0));
    const line = d3.line().x((d) => x(d.x)).y((d) => y(d.y)).defined((d) => d.y != null);
    const paths = svg.append('g').selectAll('path').data(series).join('path').attr('d', (s) => line(s.values)).style('fill', 'none').style('stroke', (s) => s.color).style('stroke-width', (s) => s.width || 2.2).style('stroke-linecap', 'round').attr('filter', `url(#${id})`);
    svg.append('g').selectAll('circle').data(series.filter((s) => s.values.length)).join('circle').attr('cx', (s) => x(s.values[s.values.length - 1].x)).attr('cy', (s) => y(s.values[s.values.length - 1].y)).attr('r', 3.5).style('fill', (s) => s.color);
    if (o.animate) S.drawIn(paths, 1800);
    const tip = S.tip(el), xs = Array.from(new Set(all.map((d) => +d.x))).sort((a, b) => a - b);
    const guide = svg.append('line').style('stroke', 'rgba(234,241,251,.4)').style('opacity', 0).attr('y1', m.t).attr('y2', H - m.b), dots = svg.append('g');
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).style('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [px, py] = d3.pointer(ev), xv = xs[d3.bisectCenter(xs, +x.invert(px))];
        guide.attr('x1', x(xv)).attr('x2', x(xv)).style('opacity', 1);
        const rows = series.map((s) => [s, s.values.find((d) => +d.x === xv)]).filter(([, d]) => d && d.y != null);
        dots.selectAll('circle').data(rows).join('circle').attr('r', 4.5).attr('cx', x(xv)).attr('cy', ([, d]) => y(d.y)).style('fill', ([s]) => s.color).style('stroke', '#070d22').style('stroke-width', 2);
        const k = el.clientWidth / W;
        S.showTip(el, tip, x(xv) * k, py * k, o.tipTitle(new Date(xv)), rows.sort((a, b) => b[1].y - a[1].y).map(([s, d]) => [s.label, o.tipFmt(d), s.color]));
      })
      .on('pointerleave', () => { tip.style.opacity = 0; guide.style('opacity', 0); dots.selectAll('circle').remove(); });
  };
  S.spark = (el, vals, color, key) => {
    el.replaceChildren(); if (vals.length < 2) return;
    const W = Math.max(120, el.clientWidth), H = 36, id = 'sp' + (++S.uid);
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'none').attr('role', 'img').attr('aria-label', 'Trend');
    const x = d3.scaleLinear().domain([0, vals.length - 1]).range([2, W - 2]), y = d3.scaleLinear().domain(d3.extent(vals)).range([H - 3, 3]);
    const g = svg.append('defs').append('linearGradient').attr('id', id).attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
    g.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.35); g.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0);
    svg.append('path').attr('d', d3.area().x((d, i) => x(i)).y0(H).y1((d) => y(d))(vals)).style('fill', `url(#${id})`);
    const p = svg.append('path').attr('d', d3.line().x((d, i) => x(i)).y((d) => y(d))(vals)).style('fill', 'none').style('stroke', color).style('stroke-width', 2).attr('vector-effect', 'non-scaling-stroke');
    svg.append('circle').attr('cx', x(vals.length - 1)).attr('cy', y(vals[vals.length - 1])).attr('r', 3).style('fill', color);
    if (S.anim(key)) S.drawIn(p, 1400, 300);
  };
})();
