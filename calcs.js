(function(){
  const r1 = (v) => Math.round(v * 10) / 10, r2 = (v) => Math.round(v * 100) / 100;
  const GCC = ['ARE', 'SAU', 'OMN', 'QAT', 'KWT', 'BHR'];
  const summarize = (rows, field, base, unitDiv, unitField) => {
    const out = [];
    for (const [iso, rs] of d3.group(rows, (d) => d.iso3)) {
      const latest = rs.reduce((a, b) => (+b.year > +a.year ? b : a));
      const b0 = rs.find((r) => r.year === base);
      const v = +latest[field], v0 = b0 ? +b0[field] : null;
      out.push({ key: iso, country: latest.country, group: latest.group, latest_year: +latest.year, latest: v, base: v0, [unitField]: r2(v / unitDiv), change_vs_2019_pct: v0 ? r1((v / v0 - 1) * 100) : null });
    }
    for (const [k, keep] of [['MENA', (r) => r.group !== 'Benchmark'], ['GCC', (r) => r.group === 'GCC']]) {
      const s = out.filter(keep).filter((r) => r.base != null), a = d3.sum(s, (r) => r.latest), b = d3.sum(s, (r) => r.base);
      out.push({ key: k, country: k, group: 'Aggregate', latest_year: d3.max(s, (r) => r.latest_year), latest: a, base: b, [unitField]: r2(a / unitDiv), change_vs_2019_pct: r1((a / b - 1) * 100) });
    }
    return out;
  };
  dash.calc('teu_summary', { inputs: ['teu'], title: 'Container throughput, latest vs 2019', description: 'Latest reported TEU per economy and its change since 2019; MENA and GCC totals sum economies reporting both years.', fn: (teu) => summarize(teu, 'teu_thousand', '2019', 1000, 'teu_latest_m') });
  dash.calc('air_summary', { inputs: ['air'], title: 'Air freight, latest vs 2019', description: 'Latest reported air freight per economy and its change since 2019; MENA and GCC totals sum economies reporting both years.', fn: (air) => summarize(air, 'air_freight_mn_tkm', '2019', 1000, 'air_latest_bn') });
  const LPI_F = ['import_dwell_days', 'export_dwell_days', 'port_turnaround_days', 'maritime_partner_economies', 'liner_services', 'aviation_partner_economies'];
  dash.calc('lpi_scope', {
    inputs: ['lpi'], title: 'LPI 2.0 medians by scope', description: 'Median of each LPI 2.0 measure across the economies in MENA, the GCC and all economies shown; one row per economy as well.',
    fn: (lpi) => {
      const ctry = lpi.filter((r) => !['MEA', 'HIC'].includes(r.iso3));
      const med = (rows) => Object.fromEntries(LPI_F.map((f) => [f, r1(d3.median(rows.filter((r) => r[f] !== null && r[f] !== ''), (r) => +r[f]))]));
      const rows = [
        { key: 'MENA', label: 'MENA median', ...med(lpi.filter((r) => r.group === 'GCC' || r.group === 'Other MENA')) },
        { key: 'GCC', label: 'GCC median', ...med(lpi.filter((r) => r.group === 'GCC')) },
        { key: 'All', label: 'Median of economies shown', ...med(ctry) }
      ];
      lpi.filter((r) => !['MEA', 'HIC'].includes(r.iso3)).forEach((r) => rows.push({ key: r.iso3, label: r.country, ...Object.fromEntries(LPI_F.map((f) => [f, r[f] === null || r[f] === '' ? null : +r[f]])) }));
      return rows;
    }
  });
  dash.calc('gii_scope', {
    inputs: ['gii'], title: 'Best GII rank by scope', description: 'Best-ranked economy in each scope and median score, Global Innovation Index 2025.',
    fn: (gii) => {
      const mk = (key, rows) => { const b = rows.reduce((a, c) => (+c.gii_rank_2025 < +a.gii_rank_2025 ? c : a)); return { key, best_rank: +b.gii_rank_2025, best_country: b.country, median_score: r1(d3.median(rows, (r) => +r.gii_score_2025)) }; };
      return [mk('World', gii), mk('MENA', gii.filter((r) => r.group !== 'Benchmark')), mk('GCC', gii.filter((r) => r.group === 'GCC'))].concat(gii.map((r) => mk(r.iso3, [r])));
    }
  });
  dash.calc('mletr_scope', {
    inputs: ['mletr'], title: 'eBL law adoption by scope', description: 'Number of jurisdictions with laws based on the UNCITRAL Model Law on Electronic Transferable Records, and the first year of adoption.',
    fn: (mletr) => {
      const mk = (key, rows) => ({ key, adopters: rows.length, first_year: rows.length ? d3.min(rows, (r) => +r.year) : null });
      const keys = ['ARE', 'SAU', 'OMN', 'QAT', 'KWT', 'BHR', 'IRQ', 'EGY', 'JOR', 'MAR', 'DZA', 'TUN', 'LBY', 'LBN', 'YEM', 'DJI'];
      return [mk('World', mletr), mk('MENA', mletr.filter((r) => r.region === 'MENA')), mk('GCC', mletr.filter((r) => GCC.includes(r.iso3)))].concat(keys.map((k) => mk(k, mletr.filter((r) => r.iso3 === k))));
    }
  });
  dash.calc('lsci_summary', {
    inputs: ['lsci'], title: 'Liner connectivity, latest quarter', description: 'Latest quarterly LSCI value and world rank per economy, with its 2019 average.',
    fn: (lsci) => Array.from(d3.group(lsci, (d) => d.iso3), ([iso, rs]) => {
      const last = rs.reduce((a, b) => (b.quarter > a.quarter ? b : a));
      const avg19 = d3.mean(rs.filter((r) => r.quarter.startsWith('2019')), (r) => +r.lsci);
      return { iso3: iso, country: last.country, group: last.group, quarter: last.quarter, lsci: +last.lsci, world_rank: +last.world_rank, lsci_2019_avg: r1(avg19), change_vs_2019_pct: r1((+last.lsci / avg19 - 1) * 100) };
    })
  });
  dash.calc('readiness', {
    inputs: ['lpi', 'gii'], title: 'Logistics innovation radar scores', description: 'Six capabilities scaled 0–100 against the best economy shown (see the methodology note on the page).',
    fn: (lpi, gii) => {
      const rows = lpi.filter((r) => !['MEA', 'HIC'].includes(r.iso3));
      const num = (r, f) => (r[f] === null || r[f] === '' ? null : +r[f]);
      const max = (f) => d3.max(rows, (r) => num(r, f)), min = (f) => d3.min(rows.filter((r) => num(r, f) > 0), (r) => num(r, f));
      const giiMax = d3.max(gii, (r) => +r.gii_score_2025);
      const out = [];
      rows.forEach((r) => {
        const g = gii.find((x) => x.iso3 === r.iso3);
        const s = {
          'Maritime reach': num(r, 'maritime_partner_economies') != null ? num(r, 'maritime_partner_economies') / max('maritime_partner_economies') * 100 : null,
          'Liner services': num(r, 'liner_services') ? Math.log10(1 + num(r, 'liner_services')) / Math.log10(1 + max('liner_services')) * 100 : null,
          'Port speed': num(r, 'port_turnaround_days') ? min('port_turnaround_days') / num(r, 'port_turnaround_days') * 100 : null,
          'Import clearance': num(r, 'import_dwell_days') ? min('import_dwell_days') / num(r, 'import_dwell_days') * 100 : null,
          'Air connectivity': num(r, 'aviation_partner_economies') != null ? num(r, 'aviation_partner_economies') / max('aviation_partner_economies') * 100 : null,
          'Innovation': g ? +g.gii_score_2025 / giiMax * 100 : null
        };
        Object.entries(s).forEach(([axis, v]) => out.push({ iso3: r.iso3, country: r.country, axis, score: v == null ? null : r1(v) }));
      });
      return out;
    }
  });
  dash.calc('gscpi_summary', {
    inputs: ['gscpi'], title: 'GSCPI latest and year-ago', description: 'Latest GSCPI reading and its change from the same month a year earlier.',
    fn: (gscpi) => { const last = gscpi[gscpi.length - 1]; const ago = gscpi.find((r) => r.month === (+last.month.slice(0, 4) - 1) + last.month.slice(4)); return [{ month: last.month, gscpi: +last.gscpi, gscpi_year_ago: +ago.gscpi, change_vs_year_ago: r2(+last.gscpi - +ago.gscpi) }]; }
  });
})();

(function(){
  const r1 = (v) => Math.round(v * 10) / 10;
  dash.calc('cppi_country', {
    inputs: ['cppi'], title: 'Best container port per economy (CPPI 2025)', description: 'For each economy, its best-ranked port in the CPPI 2025, that port\'s score and the number of its ports ranked.',
    fn: (cppi) => Array.from(d3.group(cppi.filter((r) => r.cppi_2025 !== null && r.cppi_2025 !== ''), (r) => r.iso3), ([iso, rs]) => {
      const b = rs.reduce((a, c) => (+c.rank_2025 < +a.rank_2025 ? c : a));
      return { iso3: iso, country: b.country, group: b.group, best_port: b.port, best_rank: +b.rank_2025, best_score: +b.cppi_2025, ports_ranked: rs.length, top25_ports: rs.filter((r) => +r.rank_2025 <= 25).length };
    })
  });
  dash.calc('mlii', {
    inputs: ['lpi', 'gii', 'lsci', 'mletr', 'cppi'], title: 'MENA Logistics Innovation Index (equal weights)',
    description: 'Six components scaled 0–100 across the economies shown (port efficiency, logistics speed, liner connectivity, air connectivity, innovation, eBL law) and their equal-weight average; missing components are left out of the average.',
    fn: (lpi, gii, lsci, mletr, cppi) => {
      const ec = lpi.filter((r) => !['MEA', 'HIC'].includes(r.iso3));
      const num = (v) => (v === null || v === '' || v === undefined ? null : +v);
      const best = d3.rollup(cppi.filter((r) => num(r.cppi_2025) != null), (v) => d3.max(v, (r) => +r.cppi_2025), (r) => r.iso3);
      const lastL = d3.rollup(lsci, (v) => +v.reduce((a, b) => (b.quarter > a.quarter ? b : a)).lsci, (r) => r.iso3);
      const scale = (vals, v, inv) => { const ok = vals.filter((x) => x != null); const lo = d3.min(ok), hi = d3.max(ok); if (v == null || hi === lo) return null; const s = (v - lo) / (hi - lo) * 100; return r1(inv ? 100 - s : s); };
      const raw = ec.map((r) => {
        const g = gii.find((x) => x.iso3 === r.iso3);
        return { iso3: r.iso3, country: r.country, group: r.group,
          port: best.has(r.iso3) ? best.get(r.iso3) : null,
          speed: num(r.port_turnaround_days) != null && num(r.import_dwell_days) != null ? (num(r.port_turnaround_days) + num(r.import_dwell_days) / 4) : null,
          conn: lastL.has(r.iso3) ? Math.log10(lastL.get(r.iso3)) : null,
          air: num(r.aviation_partner_economies),
          innov: g ? +g.gii_score_2025 : null,
          law: mletr.some((m) => m.iso3 === r.iso3) ? 1 : 0 };
      });
      const col = (k) => raw.map((x) => x[k]);
      const out = raw.map((x) => {
        const c = { port_efficiency: scale(col('port'), x.port), logistics_speed: scale(col('speed'), x.speed, true), liner_connectivity: scale(col('conn'), x.conn), air_connectivity: scale(col('air'), x.air), innovation: scale(col('innov'), x.innov), ebl_law: x.law * 100 };
        const vals = Object.values(c).filter((v) => v != null);
        return { iso3: x.iso3, country: x.country, group: x.group, ...c, mlii_equal: r1(d3.mean(vals)) };
      });
      const ranked = out.slice().sort((a, b) => b.mlii_equal - a.mlii_equal);
      return out.map((o) => ({ ...o, rank_equal: ranked.indexOf(o) + 1 }));
    }
  });
})();
