// controller.js
// Listens to the user, updates the model, asks the view to redraw.

import {
    state,
    slotsState,
    changeNests,
    setSpecies,
    setPearlEquipped,
    setPearlPercent,
    markFound,
    unmarkFound,
    resetState,
    getSaveData,
    loadSaveData,
    getSlotsSaveData,
    loadSlotsData,
    getSlotName,
    renameSlot,
    switchSlot
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
    infoBtn: document.getElementById("info-btn"),
    infoDialog: document.getElementById("info-dialog"),
    infoClose: document.getElementById("info-close"),
    slotTabs: document.querySelectorAll(".slot-tab"),
    slotName: document.getElementById("slot-name"),
    female: {
        checkbox: document.getElementById("female-equipped"),
        input: document.getElementById("female-pearl")
    },
    male: {
        checkbox: document.getElementById("male-equipped"),
        input: document.getElementById("male-pearl")
    }
};

// ---------- Browser storage (autosave of all slots) ----------

const saveToBrowser = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(getSlotsSaveData()));
    } catch (error) {
        console.warn("Could not save to the browser:", error);
    }
};

// Also reads the old single-hunt save, which becomes slot 1
const loadFromBrowser = () => {
    try {
        const text = localStorage.getItem(STORAGE_KEY);
        if (text) loadSlotsData(JSON.parse(text));
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

// ---------- Slots ----------

el.slotTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        switchSlot(Number(tab.dataset.slot));
        syncInputs();
        update();
    });
});

// While typing: rename the slot (the model trims and limits the name)
el.slotName.addEventListener("input", () => {
    renameSlot(slotsState.active, el.slotName.value);
    update();
});

// When leaving the box: show the cleaned-up name
el.slotName.addEventListener("change", syncInputs);

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

// ---------- Export / Import / Reset (current hunt only) ----------

el.exportBtn.addEventListener("click", () => {
    const hunt = { ...getSaveData(), name: getSlotName(slotsState.active) };
    const json = JSON.stringify(hunt, null, 2);
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
        if (data.name) renameSlot(slotsState.active, data.name);
        syncInputs();
        update();
    } catch (error) {
        alert("That file couldn't be loaded. Is it a JSON exported from this app?");
    }

    el.importFile.value = ""; // lets you pick the same file again later
});

el.resetBtn.addEventListener("click", () => {
    if (!confirm("Reset this hunt to zero?")) return;
    resetState();
    syncInputs();
    update();
});

// ---------- Info panel ----------

el.infoBtn.addEventListener("click", () => el.infoDialog.showModal());
el.infoClose.addEventListener("click", () => el.infoDialog.close());

// Click on the dark area outside the panel closes it.
// (Clicks inside the panel have a child as target, so they are ignored.)
el.infoDialog.addEventListener("click", (event) => {
    if (event.target === el.infoDialog) el.infoDialog.close();
});

// ---------- Startup ----------

populateSpecies();
loadFromBrowser();
syncInputs();
render();