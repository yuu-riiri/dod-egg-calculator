// controller.js
// Listens to the user, updates the model, asks the view to redraw.

import {
    state,
    changeNests,
    setSpecies,
    setPearlEquipped,
    setPearlPercent,
    markFound,
    unmarkFound,
    resetState,
    getSaveData,
    loadSaveData
} from "./model.js";
import { populateSpecies, syncInputs, render } from "./view.js";

const STORAGE_KEY = "dod-egg-calculator";

// ---------- Elements ----------

const el = {
    nestMinus: document.getElementById("nest-minus"),
    nestPlus: document.getElementById("nest-plus"),
    speciesSelect: document.getElementById("species-select"),
    foundBtn: document.getElementById("found-btn"),
    exportBtn: document.getElementById("export-btn"),
    importBtn: document.getElementById("import-btn"),
    importFile: document.getElementById("import-file"),
    resetBtn: document.getElementById("reset-btn"),
    female: {
        checkbox: document.getElementById("female-equipped"),
        input: document.getElementById("female-pearl")
    },
    male: {
        checkbox: document.getElementById("male-equipped"),
        input: document.getElementById("male-pearl")
    }
};

// ---------- Browser storage (autosave) ----------

const saveToBrowser = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(getSaveData()));
    } catch (error) {
        console.warn("Could not save to the browser:", error);
    }
};

const loadFromBrowser = () => {
    try {
        const text = localStorage.getItem(STORAGE_KEY);
        if (text) loadSaveData(JSON.parse(text));
    } catch (error) {
        console.warn("Could not read the saved data:", error);
    }
};

// ---------- Shared helper ----------

// After any change: redraw and autosave
const update = () => {
    render();
    saveToBrowser();
};

// ---------- Nests, species, mutation found ----------

el.nestPlus.addEventListener("click", () => {
    changeNests(1);
    update();
});

el.nestMinus.addEventListener("click", () => {
    changeNests(-1);
    update();
});

el.speciesSelect.addEventListener("change", () => {
    setSpecies(el.speciesSelect.value);
    update();
});

el.foundBtn.addEventListener("click", () => {
    if (state.found) {
        unmarkFound();
    } else {
        markFound();
    }
    update();
});

// ---------- Pearls (same code for both parents) ----------

const setupParent = (parent) => {
    const { checkbox, input } = el[parent];

    checkbox.addEventListener("change", () => {
        setPearlEquipped(parent, checkbox.checked);
        update();
        if (checkbox.checked) input.focus();
    });

    // While typing: update the numbers, but don't rewrite the text box
    input.addEventListener("input", () => {
        setPearlPercent(parent, input.value);
        update();
    });

    // When leaving the box: show the corrected value (e.g. 50 -> 10)
    input.addEventListener("change", syncInputs);
};

setupParent("female");
setupParent("male");

// ---------- Export / Import / Reset ----------

el.exportBtn.addEventListener("click", () => {
    const json = JSON.stringify(getSaveData(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);

    link.href = URL.createObjectURL(blob);
    link.download = `dod-egg-calculator-${today}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
});

// The visible button opens the hidden file picker
el.importBtn.addEventListener("click", () => el.importFile.click());

el.importFile.addEventListener("change", async () => {
    const file = el.importFile.files[0];
    if (!file) return;

    try {
        const data = JSON.parse(await file.text());
        if (!loadSaveData(data)) throw new Error("Not a valid save file");
        syncInputs();
        update();
    } catch (error) {
        alert("That file couldn't be loaded. Is it a JSON exported from this app?");
    }

    el.importFile.value = ""; // lets you pick the same file again later
});

el.resetBtn.addEventListener("click", () => {
    if (!confirm("Reset everything to zero?")) return;
    resetState();
    syncInputs();
    update();
});

// ---------- Startup ----------

populateSpecies();
loadFromBrowser();
syncInputs();
render();