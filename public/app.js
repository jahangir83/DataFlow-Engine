let aborter = null;

const $ = (id) => document.getElementById(id);

const statusEl = $("status");
const logEl = $("log");
const queryKeyEl = $("queryKey");
const campaignIdEl = $("campaignId");
const productIdEl = $("productId");
const limitEl = $("limit");
const maxLinesEl = $("maxLines");
const filterEl = $("filter");
const autoScrollEl = $("autoScroll");
const openRawEl = $("openRaw");
const mode = $("mode");

const campaignIdWrap = $("campaignIdWrap");
const productIdWrap = $("productIdWrap");

const rowsEl = $("rows");
const bytesEl = $("bytes");

let ring = [];
let rows = 0;
let bytes = 0;

function setStatus(text) {
  statusEl.textContent = text;
}

function uiToggle() {
  const key = queryKeyEl.value;
  if (key === "SalesCampaignVariant") {
    campaignIdWrap.style.display = "";
    productIdWrap.style.display = "none";
  } else {
    campaignIdWrap.style.display = "none";
    productIdWrap.style.display = "";
  }
  updateRawLink();
}

function buildUrl() {
  const key = queryKeyEl.value;
  const modeValue = mode.value;
  const params = new URLSearchParams();
  params.set("queryKey", key);

  if (key === "SalesCampaignVariant") {
    params.set("campaignId", campaignIdEl.value || "");
  } else {
    params.set("productId", productIdEl.value || "");
    params.set("limit", String(limitEl.value || "1000"));
    params.set("mode", modeValue);
  }

  return `/export/stream?${params.toString()}`;
}

function updateRawLink() {
  openRawEl.href = buildUrl();
}

function render() {
  const filter = (filterEl.value || "").trim().toLowerCase();
  const view = filter
    ? ring.filter((x) => x.toLowerCase().includes(filter))
    : ring;

  // Parse and render event lines with prefixes
  const lines = view.map((line) => {
    try {
      const obj = JSON.parse(line);
      if (obj && obj.event) {
        if (obj.event === "start") return `[START] Query: ${obj.queryKey}`;
        if (obj.event === "empty") return `[EMPTY] No rows found`;
        if (obj.event === "end") return `[END] Rows: ${obj.rows}`;
      }
    } catch {}
    return line;
  });

  logEl.textContent = lines.join("\n") + (lines.length ? "\n" : "");

  if (autoScrollEl.checked) {
    logEl.scrollTop = logEl.scrollHeight;
  }
}

function clearLog() {
  ring = [];
  rows = 0;
  bytes = 0;
  rowsEl.textContent = "0";
  bytesEl.textContent = "0";
  render();
}

function pushLine(line) {
  ring.push(line);
  const maxLines = Number(maxLinesEl.value || 5000);
  if (ring.length > maxLines) ring.splice(0, ring.length - maxLines);
}

async function start() {
  debugger;
  stop();
  updateRawLink();

  const url = buildUrl();
  aborter = new AbortController();

  setStatus("Connecting");

  try {
    const res = await fetch(url, { signal: aborter.signal });
    if (!res.ok || !res.body) {
      setStatus("Failed");
      pushLine(`ERROR: HTTP ${res.status}`);
      render();
      return;
    }

    setStatus("Streaming");
    debugger;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      bytes += value.byteLength;
      bytesEl.textContent = String(bytes);

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        // Parse event lines for row count and empty event
        let isEvent = false;
        try {
          const obj = JSON.parse(t);
          if (obj && obj.event) {
            isEvent = true;
            if (obj.event === "end" && typeof obj.rows === "number") {
              rowsEl.textContent = String(obj.rows);
            }
            if (obj.event === "empty") {
              // Show 'No rows found' in log (handled in render)
            }
          }
        } catch {}
        if (!isEvent) {
          rows += 1;
          rowsEl.textContent = String(rows);
        }
        pushLine(t);
      }

      render();
    }

    if (buffer.trim()) {
      rows += 1;
      rowsEl.textContent = String(rows);
      pushLine(buffer.trim());
      render();
    }

    setStatus("Done");
  } catch (e) {
    if (String(e).includes("AbortError")) {
      setStatus("Stopped");
      return;
    }
    setStatus("Error");
    pushLine("ERROR: " + (e?.message || String(e)));
    render();
  }
}

function stop() {
  if (aborter) aborter.abort();
  aborter = null;
}

$("start").onclick = start;
$("stop").onclick = stop;
$("clear").onclick = clearLog;

filterEl.addEventListener("input", render);
queryKeyEl.addEventListener("change", uiToggle);
campaignIdEl.addEventListener("input", updateRawLink);
productIdEl.addEventListener("input", updateRawLink);
limitEl.addEventListener("input", updateRawLink);

uiToggle();
setStatus("Idle");
