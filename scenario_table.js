// Shared renderer for the precomputed scenario table.
//
// This file performs NO computation and calls NO API. It loads
// data/scenario_lookup.json, the artifact written by
// 02_analysis/scripts/model/build_lookup.py, and displays what is in it. If the file is
// absent or unreadable, it says so: an empty table presented as a result would be worse
// than an error message.
(function () {
  "use strict";

  const SCENARIOS = ["A", "B", "C"];
  const SECTOR_LABELS = {
    labour: "Labour and real income",
    ai_profitability: "AI profitability",
    energy: "Energy and compute cost",
    public_finance: "Public finance",
    political_stability: "Political stability",
    overall: "Overall (scenario rule)",
  };
  const SCENARIO_TITLES = {
    A: "A - controlled diffusion",
    B: "B - income crisis",
    C: "C - systemic instability",
  };

  function candidatePaths() {
    // Same file, three plausible bases: site root, a subdirectory, or a repo-relative path.
    return ["data/scenario_lookup.json", "../data/scenario_lookup.json",
            "05_website/data/scenario_lookup.json"];
  }

  async function loadLookup() {
    let lastError = null;
    for (const path of candidatePaths()) {
      try {
        const response = await fetch(path, { cache: "no-store" });
        if (!response.ok) { lastError = new Error(path + " -> HTTP " + response.status); continue; }
        const data = await response.json();
        if (!data || !data.data) { lastError = new Error(path + " has no data block"); continue; }
        return { payload: data, source: path };
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("scenario_lookup.json not found");
  }

  function fmt(value, digits) {
    if (value === null || value === undefined || value === "") { return "-"; }
    return Number(value).toFixed(digits === undefined ? 3 : digits);
  }

  function confidenceOf(block) {
    return block && block.confidence ? block.confidence : "low";
  }

  function buildTable(payload, horizon) {
    const frame = payload.data[String(horizon)];
    if (!frame) { return '<p class="warning">No computed frame for horizon ' + horizon + ".</p>"; }
    const order = ["overall", "labour", "ai_profitability", "energy", "public_finance",
                   "political_stability"];
    let html = '<table class="scenario-table"><caption>Conditional probability that a '
      + "draw's simulated state at " + frame.label + " (t = " + horizon + " years) satisfies "
      + "the region named for that scenario. Not a forecast.</caption><thead><tr>"
      + "<th>Sector</th>" + SCENARIOS.map(function (s) {
        return '<th title="' + SCENARIO_TITLES[s] + '">' + s + "</th>";
      }).join("") + "<th>95% interval (overall row)</th></tr></thead><tbody>";
    order.forEach(function (sector) {
      const block = frame.sectors[sector];
      if (!block) { return; }
      const overallRow = sector === "overall" ? ' class="overall"' : "";
      const intervals = SCENARIOS.map(function (s) {
        if (!block[s]) { return "-"; }
        return s + " " + fmt(block[s].ci_low) + " to " + fmt(block[s].ci_high);
      }).join("  ");
      html += "<tr" + overallRow + "><td>" + (SECTOR_LABELS[sector] || sector) + "</td>"
        + SCENARIOS.map(function (s) {
          return "<td>" + (block[s] ? fmt(block[s].probability) : "-") + "</td>";
        }).join("")
        + "<td>" + (sector === "overall" ? intervals : "") + "</td></tr>";
    });
    html += "</tbody></table>";
    if (frame.summary) {
      html += '<p class="provenance">mean diffusion share ' + fmt(frame.summary.diffusion_share_mean)
        + ", mean income wedge " + fmt(frame.summary.income_wedge_mean)
        + ", mean accumulated stress " + fmt(frame.summary.instability_mean) + "</p>";
    }
    return html;
  }

  function provenanceLine(payload) {
    return "generated " + payload.generated_at
      + " | model_params_hash " + payload.model_params_hash
      + (payload.model_code_hash ? " | model_code_hash " + payload.model_code_hash : "")
      + " | seed " + payload.seed
      + " | N = " + payload.n_draws
      + " | reference year " + payload.reference_year;
  }

  function mount(mountId, options) {
    const mountEl = document.getElementById(mountId);
    if (!mountEl) { return; }
    mountEl.innerHTML = '<p class="provenance">Loading ' + "data/scenario_lookup.json" + " ...</p>";
    loadLookup().then(function (result) {
      const payload = result.payload;
      const horizons = payload.horizons && payload.horizons.length
        ? payload.horizons : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const start = options && options.defaultHorizon && horizons.indexOf(options.defaultHorizon) >= 0
        ? options.defaultHorizon : horizons[Math.floor(horizons.length / 2)];
      const labels = payload.horizon_labels || {};
      const selector = '<div class="selector-row"><label for="' + mountId + '-horizon">'
        + "<strong>Horizon</strong> (years after " + payload.reference_year + ")</label>"
        + '<select id="' + mountId + '-horizon">'
        + horizons.map(function (h) {
          return '<option value="' + h + '"' + (h === start ? " selected" : "") + ">"
            + h + " years" + (labels[String(h)] ? " (" + labels[String(h)] + ")" : "") + "</option>";
        }).join("") + "</select></div>";
      const banner = '<div class="callout callout-style-default callout-important">'
        + '<div class="callout-body"><p><strong>' + payload.disclaimer + "</strong></p>"
        + "<p>" + (payload.interpretation || "") + "</p>"
        + '<p class="provenance">' + provenanceLine(payload) + "</p>"
        + (payload.parameter_placeholders
          ? '<p class="provenance">WARNING: ' + payload.placeholder_note + "</p>" : "")
        + "</div></div>";
      mountEl.innerHTML = banner + selector + '<div id="' + mountId + '-table"></div>';
      const select = document.getElementById(mountId + "-horizon");
      const table = document.getElementById(mountId + "-table");
      // Keep the horizon in a variable rather than reading it back off the <select>:
      // buildTable(lookup, undefined) would otherwise render "no frame" in any host where
      // select.value does not reflect the selected option (measured in the DOM stub test).
      let current = String(start);
      const render = function () { table.innerHTML = buildTable(payload, current); };
      select.addEventListener("change", function () { current = String(select.value); render(); });
      render();
    }).catch(function (error) {
      mountEl.innerHTML = '<div class="callout callout-style-default callout-warning">'
        + '<div class="callout-body"><p>No precomputed lookup table was found, so no '
        + "probability is shown. Generate it with</p><pre><code>python "
        + "02_analysis/scripts/model/build_lookup.py</code></pre><p>Technical detail: "
        + String(error) + "</p></div></div>";
    });
  }

  window.ScenarioStudy = { mount: mount, loadLookup: loadLookup };
})();
