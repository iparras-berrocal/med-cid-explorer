let REGION_SVG_DOCUMENT = null;
let REGION_SVG_PATHS = [];


/* =========================================================
   SHOW ONLY SELECTED REGION
   ========================================================= */

function highlightSelectedSvgRegion(regionName) {

  REGION_SVG_PATHS.forEach(path => {

    const isSelected =
      path.dataset.regionName === regionName;

    if (isSelected) {

      /* Selected region */
      path.style.display = "";

      path.classList.add(
        "is-selected"
      );

      path.setAttribute(
        "aria-selected",
        "true"
      );

    } else {

      /* Completely hide every other region */
      path.style.display = "none";

      path.classList.remove(
        "is-selected"
      );

      path.setAttribute(
        "aria-selected",
        "false"
      );
    }

  });


  const selectedName =
    document.getElementById(
      "region-map-selected-name"
    );

  if (selectedName) {

    selectedName.textContent =
      regionName ||
      "No region selected";

  }
}


/* =========================================================
   LOAD SVG
   ========================================================= */

function connectSvgRegions() {

  const svgObject =
    document.getElementById(
      "region-svg-object"
    );

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
    REGION_SVG_DOCUMENT.querySelectorAll(
      ".region"
    )
  );


  /*
    The map is display-only.
  */

  REGION_SVG_PATHS.forEach(path => {

    path.style.pointerEvents =
      "none";

    path.removeAttribute(
      "tabindex"
    );

    /*
      Hide everything initially.
    */

    path.style.display =
      "none";

  });


  refreshSvgRegionSelection();
}


/* =========================================================
   MAIN REGION SELECTOR
   ========================================================= */

function connectRegionSelector() {

  const regionSelect =
    document.getElementById(
      "cid-region"
    );

  if (!regionSelect) return;


  regionSelect.addEventListener(
    "change",
    () => {

      highlightSelectedSvgRegion(
        regionSelect.value
      );

    }
  );
}


/* =========================================================
   REFRESH
   ========================================================= */

function refreshSvgRegionSelection() {

  const regionSelect =
    document.getElementById(
      "cid-region"
    );

  if (!regionSelect?.value) return;


  highlightSelectedSvgRegion(
    regionSelect.value
  );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

window.addEventListener(
  "DOMContentLoaded",
  () => {

    const svgObject =
      document.getElementById(
        "region-svg-object"
      );


    if (svgObject) {

      svgObject.addEventListener(
        "load",
        connectSvgRegions
      );


      if (
        svgObject.contentDocument
      ) {

        connectSvgRegions();

      }
    }


    connectRegionSelector();


    window.setTimeout(
      () => {

        refreshSvgRegionSelection();

      },
      0
    );

  }
);
