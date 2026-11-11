# MENA Supply Chain & Logistics Innovation Pulse

An open-data dashboard on supply chain, logistics, port efficiency, shipping connectivity, digital trade (electronic bills of lading / blockchain readiness) and innovation across the Middle East & North Africa (MENA) and the GCC, benchmarked against global leaders.

**Live dashboard:** https://spssbusproject-sys.github.io/mena-logistics-pulse/

Created by **Dr. Mohammad A. K. Al-Smairat**, Associate Professor of Supply Chain & Quality Management, Hamdan Bin Mohammad Smart University (HBMSU), Dubai, UAE.

## What it shows
- Headline indicators: container throughput, air cargo, port turnaround, innovation rank, eBL legal readiness, container spot rates
- 2026 pulse: WTO trade outlook and IATA monthly air cargo demand
- Port efficiency map and ranking (World Bank–S&P Global CPPI 2025)
- MENA Logistics Innovation Index with adjustable weights
- Country profiles, side-by-side comparison with a chosen benchmark (Singapore, Netherlands, China, USA)
- LPI 2.0 league table, TEU trends, UNCTAD liner connectivity heat map, UNCITRAL MLETR adoption timeline, WIPO GII, GSCPI and Drewry WCI
- Search, English / Arabic (RTL) toggle, light / dark theme

## Data sources
| File | Source |
|---|---|
| `lpi.csv` | World Bank Logistics Performance Indicators 2.0 (2024 data, 2025 release) |
| `cppi.csv` | World Bank & S&P Global Market Intelligence, Container Port Performance Index 2025 |
| `teu.csv`, `air.csv` | World Bank WDI (IS.SHP.GOOD.TU, IS.AIR.GOOD.MT.K1) |
| `lsci.csv` | UNCTADstat Liner Shipping Connectivity Index (quarterly) |
| `gii.csv` | WIPO Global Innovation Index 2025 |
| `mletr.csv` | UNCITRAL status of the Model Law on Electronic Transferable Records |
| `wto.csv` | WTO Global Trade Outlook |
| `iata.csv` | IATA Air Cargo Market Analysis (2026 monthly) |
| `gscpi.csv` | Federal Reserve Bank of New York, Global Supply Chain Pressure Index |
| `wci.csv` | Drewry World Container Index |
| `geo.json` | Natural Earth country outlines (via world-atlas) |

Each source's own terms of use apply to its data. The MENA Logistics Innovation Index is calculated in `calcs.js` (methodology on the page).

## Updating the data
Replace the CSV files in `data/` with newer versions using the same column names, then commit. The page recalculates everything on load.

## Run locally
```
python3 -m http.server
```
then open http://localhost:8000

## How to cite
Al-Smairat, M. A. K. (2026). *MENA Supply Chain & Logistics Innovation Pulse* [Open-data dashboard]. https://spssbusproject-sys.github.io/mena-logistics-pulse/
