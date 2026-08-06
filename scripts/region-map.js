let REGION_SVG_DOCUMENT = null;
let REGION_SVG_PATHS = [];

/* =========================================================
   HELPERS
   ========================================================= */

function selectorContainsRegion(selectElement, regionName) {
  if (!selectElement || !regionName) return false;

  return Array.from(selectElement.options).some(
    option => option.value === regionName
  );
}

function updateSelectedRegionLabel(regionName) {
  const selectedName =
    document.getElementById("region-map-selected-name");

  if (selectedName) {
    selectedName.textContent =
      regionName || "No region selected";
  }
}

/* =========================================================
   SVG HIGHLIGHT
   ========================================================= */

function highlightSelectedSvgRegion(regionName) {
  REGION_SVG_PATHS.forEach(path => {
    const isSelected =
      path.dataset.regionName === regionName;

    path.classList.toggle(
      "is-selected",
      isSelected
    );

    path.setAttribute(
      "aria-selected",
      String(isSelected)
    );
  });

  updateSelectedRegionLabel(regionName);
}

/* =========================================================
   CHANGE REGION FROM THE MAP
   ========================================================= */

function selectRegionFromSvg(regionName) {
  const regionSelect =
    document.getElementById("cid-region");

  if (!regionSelect || !regionName) return;

  if (!selectorContainsRegion(regionSelect, regionName)) {
    console.warn(
      `Region "${regionName}" is not available in the region selector.`
    );

    return;
  }

  if (regionSelect.value !== regionName) {
    regionSelect.value = regionName;

    regionSelect.dispatchEvent(
      new Event("change", {
        bubbles: true
      })
    );
  }

  highlightSelectedSvgRegion(regionName);
}

/* =========================================================
   CONNECT SVG REGIONS
   ========================================================= */

function connectSvgRegions() {
  const svgObject =
    document.getElementById("region-svg-object");

  if (!svgObject) return;

  REGION_SVG_DOCUMENT =
    svgObject.contentDocument;

  if (!REGION_SVG_DOCUMENT) {
    console.warn(
      "The Mediterranean regions SVG could not be accessed."
    );

    return;
  }

  REGION_SVG_PATHS = Array.from(
    REGION_SVG_DOCUMENT.querySelectorAll(".region")
  );

  REGION_SVG_PATHS.forEach(path => {
    const regionName =
      path.dataset.regionName;

    if (!regionName) return;

    path.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      selectRegionFromSvg(regionName);
    });

    path.addEventListener("keydown", event => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        event.stopPropagation();

        selectRegionFromSvg(regionName);
      }
    });
  });

  refreshSvgRegionSelection();
}

/* =========================================================
   CONNECT REGION SELECTOR
   ========================================================= */

function connectRegionSelector() {
  const regionSelect =
    document.getElementById("cid-region");

  if (!regionSelect) return;

  regionSelect.addEventListener("change", () => {
    highlightSelectedSvgRegion(
      regionSelect.value
    );
  });
}

/* =========================================================
   REFRESH
   ========================================================= */

function refreshSvgRegionSelection() {
  const regionSelect =
    document.getElementById("cid-region");

  if (!regionSelect?.value) return;

  highlightSelectedSvgRegion(
    regionSelect.value
  );
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

window.addEventListener("DOMContentLoaded", () => {
  const svgObject =
    document.getElementById("region-svg-object");

  if (svgObject) {
    svgObject.addEventListener(
      "load",
      connectSvgRegions
    );

    if (svgObject.contentDocument) {
      connectSvgRegions();
    }
  }

  connectRegionSelector();

  window.setTimeout(() => {
    refreshSvgRegionSelection();
  }, 0);
});
