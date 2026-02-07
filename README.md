Stream Exporter

A structured Node.js + Express + Postgres streaming project that exports large datasets safely using backpressure.

Run

1. Copy env
   cp .env.example .env

2. Install
   npm i

3. Dev
   npm run dev

Endpoint

Direct streaming as NDJSON
GET http://localhost:3000/export/stream?key=orders&from=2025-01-01&to=2026-01-01&limit=20000

File cache mode (DB to file then stream file)
GET http://localhost:3000/export/stream?key=orders&from=2025-01-01&to=2026-01-01&limit=20000&mode=file

Frontend viewer
Open examples/web-viewer.html and click Start
