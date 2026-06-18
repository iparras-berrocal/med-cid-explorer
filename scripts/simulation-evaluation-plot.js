let SIM_EVAL_DATA = null;

const EVAL_CID_LABELS = {
  SST: "SST",
  SBT: "SBT",
  Nmonth_sst_p99: "NM SST>P99",
  Nmonth_sst_p01: "NM SST<P1",
  NMONTH_T20m: "NM T₂₀ₘ >25°C",
  SSS: "SSS",
  MLD: "MLDₘₐₓ",
  SI: "SI",
  Nmonth_ws_p99: "NMτ>P99",
  CUIfav: "CUI"
};

const RATING_STROKES = {
  Reference: "#000000",
  Good: "#1b7837",
  Acceptable: "#fdae61",
  Bad: "#d7191c",
  "Not rated": "#777777"
};

function fmtEval(v) {
  if (v === null || v === undefined || !isFinite(v)) return "NA";
  return Number(v).toFixed(2);
}

function setupSimulationEvaluationControls() {
  const cidSelect = document.getElementById("eval-cid");
  const regionSelect = document.getElementById("eval-region");

  if (!cidSelect || !regionSelect || !SIM_EVAL_DATA) return;

  cidSelect.innerHTML = "";
  regionSelect.innerHTML = "";

  const cids = Object.keys(SIM_EVAL_DATA);

  cids.forEach(cid => {
    const option = document.createElement("option");
    option.value = cid;
    option.textContent = EVAL_CID_LABELS[cid] || cid;
    cidSelect.appendChild(option);
  });

  const firstCid = cids[0];
  const regions = Object.keys(SIM_EVAL_DATA[firstCid] || {});

  regions.forEach(region => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = region;
    regionSelect.appendChild(option);
  });

  cidSelect.addEventListener("change", () => {
    updateEvaluationRegions();
    drawSimulationEvaluationPlot();
  });

  regionSelect.addEventListener("change", drawSimulationEvaluationPlot);

  updateEvaluationRegions();
  drawSimulationEvaluationPlot();
}

function updateEvaluationRegions() {
  const cidSelect = document.getElementById("eval-cid");
  const regionSelect = document.getElementById("eval-region");

  const cid = cidSelect.value;
  const currentRegion = regionSelect.value;

  regionSelect.innerHTML = "";

  const regions = Object.keys(SIM_EVAL_DATA[cid] || {});

  regions.forEach(region => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = region;
    regionSelect.appendChild(option);
  });

  if (regions.includes(currentRegion)) {
    regionSelect.value = currentRegion;
  }
}

function drawSimulationEvaluationPlot() {
  const container = document.getElementById("simulation-evaluation-plot");
  const cid = document.getElementById("eval-cid")?.value;
  const region = document.getElementById("eval-region")?.value;

  if (!container || !cid || !region || !SIM_EVAL_DATA) return;

  const data = SIM_EVAL_DATA?.[cid]?.[region];

  container.innerHTML = "";

  if (!data || !data.points || data.points.length === 0) {
    container.innerHTML = "<p>No simulation evaluation data available.</p>";
    return;
  }

  const w = 900;
  const h = 520;
  const margin = { top: 50, right: 42, bottom: 82, left: 92 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  const ref = data.reference || {};
  const points = data.points.filter(p =>
    p.x !== null && p.y !== null && isFinite(p.x) && isFinite(p.y)
  );

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);

  if (isFinite(ref.x)) xs.push(ref.x);
  if (isFinite(ref.y)) ys.push(ref.y);

  if (isFinite(ref.x) && isFinite(ref.expert_tol_x)) {
    xs.push(ref.x - ref.expert_tol_x, ref.x + ref.expert_tol_x);
  }
  if (isFinite(ref.y) && isFinite(ref.expert_tol_y)) {
    ys.push(ref.y - ref.expert_tol_y, ref.y + ref.expert_tol_y);
  }
  if (isFinite(ref.x) && isFinite(ref.x_se)) {
    xs.push(ref.x - 4 * ref.x_se, ref.x + 4 * ref.x_se);
  }
  if (isFinite(ref.y) && isFinite(ref.y_se)) {
    ys.push(ref.y - 4 * ref.y_se, ref.y + 4 * ref.y_se);
  }

  let xMin = Math.min(...xs);
  let xMax = Math.max(...xs);
  let yMin = Math.min(...ys);
  let yMax = Math.max(...ys);

  const xPad = (xMax - xMin || 1) * 0.08;
  const yPad = (yMax - yMin || 1) * 0.12;

  xMin -= xPad;
  xMax += xPad;
  yMin -= yPad;
  yMax += yPad;

  const xScale = x => margin.left + ((x - xMin) / (xMax - xMin)) * innerW;
  const yScale = y => margin.top + innerH - ((y - yMin) / (yMax - yMin)) * innerH;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", w);
  svg.setAttribute("height", h);
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.style.maxWidth = "100%";
  svg.style.height = "auto";
  container.appendChild(svg);

  function add(name, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.appendChild(el);
    return el;
  }

  function title(el, text) {
    const t = document.createElementNS("http://www.w3.org/2000/svg", "title");
    t.textContent = text;
    el.appendChild(t);
  }

  function drawBox(cx, cy, dx, dy, fill, stroke, opacity) {
    if (![cx, cy, dx, dy].every(v => v !== null && isFinite(v))) return;

    add("rect", {
      x: xScale(cx - dx),
      y: yScale(cy + dy),
      width: xScale(cx + dx) - xScale(cx - dx),
      height: yScale(cy - dy) - yScale(cy + dy),
      fill,
      stroke,
      "stroke-width": 1,
      opacity
    });
  }

  // Expert tolerance box
  drawBox(
    ref.x,
    ref.y,
    ref.expert_tol_x,
    ref.expert_tol_y,
    "#A8D5A2",
    "#A8D5A2",
    0.35
  );

  // 4SE box
  if (isFinite(ref.x_se) && isFinite(ref.y_se)) {
    drawBox(
      ref.x,
      ref.y,
      4 * ref.x_se,
      4 * ref.y_se,
      "#4C8F5A",
      "#4C8F5A",
      0.55
    );
  }

  // Grid and axes
  const ticks = 5;

  for (let i = 0; i <= ticks; i++) {
    const xv = xMin + (i / ticks) * (xMax - xMin);
    const x = xScale(xv);

    add("line", {
      x1: x,
      y1: margin.top,
      x2: x,
      y2: margin.top + innerH,
      stroke: "#edf2f7",
      "stroke-width": 1
    });

    add("text", {
      x,
      y: margin.top + innerH + 24,
      "text-anchor": "middle",
      "font-size": 11,
      fill: "#5b6b7f"
    }).textContent = fmtEval(xv);
  }

  for (let i = 0; i <= ticks; i++) {
    const yv = yMin + (i / ticks) * (yMax - yMin);
    const y = yScale(yv);

    add("line", {
      x1: margin.left,
      y1: y,
      x2: margin.left + innerW,
      y2: y,
      stroke: "#edf2f7",
      "stroke-width": 1
    });

    add("text", {
      x: margin.left - 12,
      y: y + 4,
      "text-anchor": "end",
      "font-size": 11,
      fill: "#5b6b7f"
    }).textContent = fmtEval(yv);
  }

  add("line", {
    x1: margin.left,
    y1: margin.top + innerH,
    x2: margin.left + innerW,
    y2: margin.top + innerH,
    stroke: "#102033",
    "stroke-width": 1
  });

  add("line", {
    x1: margin.left,
    y1: margin.top,
    x2: margin.left,
    y2: margin.top + innerH,
    stroke: "#102033",
    "stroke-width": 1
  });

  // Reference crosshair
  if (isFinite(ref.x)) {
    add("line", {
      x1: xScale(ref.x),
      y1: margin.top,
      x2: xScale(ref.x),
      y2: margin.top + innerH,
      stroke: "#102033",
      "stroke-width": 1,
      "stroke-dasharray": "5 4"
    });
  }

  if (isFinite(ref.y)) {
    add("line", {
      x1: margin.left,
      y1: yScale(ref.y),
      x2: margin.left + innerW,
      y2: yScale(ref.y),
      stroke: "#102033",
      "stroke-width": 1,
      "stroke-dasharray": "5 4"
    });
  }

  // Points
  points.forEach(p => {
    const r = p.is_reference ? 6.5 : 5;
    const stroke = RATING_STROKES[p.rating] || "#555555";
    const strokeWidth = p.is_reference ? 1.4 : 1.1;

    const point = add("circle", {
      cx: xScale(p.x),
      cy: yScale(p.y),
      r,
      fill: p.color || "#808080",
      stroke,
      "stroke-width": strokeWidth,
      cursor: "pointer"
    });

    title(
      point,
      `${p.label || p.key}
Rating: ${p.rating || "NA"}
X: ${fmtEval(p.x)}
Y: ${fmtEval(p.y)}
p-value: ${fmtEval(p.pvalue)}
stderr: ${fmtEval(p.stderr)}`
    );

    point.addEventListener("mouseenter", () => {
      point.setAttribute("r", r + 2);
    });

    point.addEventListener("mouseleave", () => {
      point.setAttribute("r", r);
    });
  });

  // Titles and labels
  add("text", {
    x: margin.left,
    y: 24,
    "font-size": 18,
    "font-weight": 700,
    fill: "#102033"
  }).textContent = `${data.label || EVAL_CID_LABELS[cid] || cid} · ${region}`;

  add("text", {
    x: margin.left,
    y: 43,
    "font-size": 12,
    fill: "#5b6b7f"
  }).textContent = `Reference: ${ref.label || ref.key || "reference"} · shaded boxes: expert tolerance and 4SE`;

  add("text", {
    x: margin.left + innerW / 2,
    y: h - 24,
    "text-anchor": "middle",
    "font-size": 13,
    fill: "#102033"
  }).textContent = data.x_label || "Mean at GWL1";

  const yLabel = add("text", {
    x: 22,
    y: margin.top + innerH / 2,
    "text-anchor": "middle",
    "font-size": 13,
    fill: "#102033",
    transform: `rotate(-90 22 ${margin.top + innerH / 2})`
  });

  yLabel.textContent = data.y_label || "Trend";

  // Rating legend
  const legendX = margin.left + innerW - 230;
  let legendY = margin.top + 12;

  [
    ["Reference", "#000000"],
    ["Good", "#1b7837"],
    ["Acceptable", "#fdae61"],
    ["Bad", "#d7191c"]
  ].forEach(([label, stroke]) => {
    add("circle", {
      cx: legendX,
      cy: legendY,
      r: 5,
      fill: "white",
      stroke,
      "stroke-width": 2
    });

    add("text", {
      x: legendX + 14,
      y: legendY + 4,
      "font-size": 12,
      fill: "#5b6b7f"
    }).textContent = label;

    legendY += 18;
  });
}

fetch("images/webtool_simulation_evaluation.json")
  .then(r => r.json())
  .then(data => {
    SIM_EVAL_DATA = data;
    setupSimulationEvaluationControls();
  })
  .catch(error => {
    const container = document.getElementById("simulation-evaluation-plot");
    if (container) {
      container.innerHTML =
        `<p style="color:red;">Could not load simulation evaluation data: ${error}</p>`;
    }
  });
