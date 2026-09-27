# CitizenPulse — Official Records Ingestion Service

Fetches official government records (MPLADS works, sanctions, completion
status, utilisation) into CitizenPulse using **Scrapling** as the fetching
engine — because government portals are bot-protected, session-heavy ASP.NET
apps, and Scrapling brings browser-realistic fingerprints, adaptive selectors
and fast extraction. Fresher, more complete official data → sharper
cross-referencing and dispute detection on the dashboard.

- Upstream: https://github.com/D4Vinci/Scrapling (BSD-3-Clause)
- Port: 3010

## Run

```bash
pip install -r requirements.txt
python main.py
```

## Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health` | Engine status (Scrapling version, source URL) |
| `GET /ingest/mplads?c=nagpur&mode=auto` | Works ledger — live scrape with fixture fallback |
| `GET /probe` | Genuine live Scrapling fetch (proof the engine works) |

`mode=live` forces the real mplads.gov.in fetch; `mode=fixture` uses the
cached portal snapshot (for networks where the portal is unreachable);
`mode=auto` tries live first.
