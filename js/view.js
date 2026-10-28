// view.js
// Reads the model and draws it on the page. No math, no saving.

import {
    SPECIES,
    state,
    slotsState,
    getTotalEggs,
    getEggChance,
    getCumulativeChance,
    getAverageEggs,
    getEggsToAverage,
    getPearlRarity
} from "./model.js";

// ---------- Elements (looked up once) ----------

const el = {
    speciesSelect: document.getElementById("species-select"),
    nestCount: document.getElementById("nest-count"),
    totalEggs: document.getElementById("total-eggs"),
    eggChance: document.getElementById("egg-chance"),
    cumulativeChance: document.getElementById("cumulative-chance"),
    message: document.getElementById("eggs-message"),
    eggSprite: document.getElementById("egg-sprite"),
    childPanel: document.getElementById("child-panel"),
    foundBtn: document.getElementById("found-btn"),
    foundMessage: document.getElementById("found-message"),
    slotTabs: document.querySelectorAll(".slot-tab"),
    slotName: document.getElementById("slot-name"),

    female: {
        sprite: document.getElementById("female-sprite"),
        checkbox: document.getElementById("female-equipped"),
        input: document.getElementById("female-pearl"),
        icon: document.getElementById("female-pearl-icon")
    },
    male: {
        sprite: document.getElementById("male-sprite"),
        checkbox: document.getElementById("male-equipped"),
        input: document.getElementById("male-pearl"),
        icon: document.getElementById("male-pearl-icon")
    }
};

// ---------- Formatting helpers ----------

// "Blitz Striker" -> "blitz-striker" (used by the CSS art hooks)
const toSlug = (name) => name.toLowerCase().replace(/\s+/g, "-");

// 0.005 -> "0.5%", 0.00554 -> "0.554%", 0.005095 -> "0.5095%"
// toFixed(4) rounds, Number() drops the trailing zeros.
const formatChance = (chance) => `${Number((chance * 100).toFixed(3))}%`;

// 4.876926 -> "4.88%"
const formatCumulative = (percent) => `${percent.toFixed(2)}%`;

// ---------- Pieces of the screen ----------

const renderMessage = () => {
    const left = getEggsToAverage();

    if (state.found || getTotalEggs() === 0) {
        el.message.textContent = "";
    } else if (left > 0) {
        el.message.textContent =
            `About ${left} more eggs to reach the average (pure luck, no guarantee).`;
    } else {
        el.message.textContent = "You're past the average. RNG is being rough!";
    }
};

const renderFound = () => {
    el.childPanel.dataset.found = state.found ? "yes" : "no";
    el.foundBtn.textContent = state.found ? "Undo" : "I got the mutation!";
    el.foundMessage.hidden = !state.found;

    if (state.found) {
        el.foundMessage.textContent =
            `Found after ${state.foundAtEggs} eggs (the average is about ${Math.round(getAverageEggs())}).`;
    }
};

// Writes each tab's name and marks the open slot.
// The name box is not touched here (see syncInputs).
const renderSlots = () => {
    el.slotTabs.forEach((tab, index) => {
        tab.textContent = slotsState.names[index];
        tab.dataset.active = index === slotsState.active ? "yes" : "no";
    });
};

// Updates one parent: sprite species, checkbox state, pearl icon.
// Does NOT touch the text input's value (see syncInputs).
const renderParent = (parent, equipped, percent) => {
    const parts = el[parent];

    parts.sprite.dataset.species = toSlug(state.species);
    parts.checkbox.checked = equipped;
    parts.input.disabled = !equipped;

    if (parts.icon) {
        parts.icon.dataset.state = equipped ? "on" : "off";
        if (equipped) {
            parts.icon.dataset.rarity = getPearlRarity(percent).slug;
        } else {
            delete parts.icon.dataset.rarity;
        }
    }
};

// ---------- Public functions ----------

// Fills the species <select>. Call once at startup.
export const populateSpecies = () => {
    el.speciesSelect.innerHTML = "";
    for (const name of Object.keys(SPECIES)) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = `${name} (${SPECIES[name]} eggs per nest)`;
        el.speciesSelect.appendChild(option);
    }
};

// Copies the saved values into the form controls.
// Call at startup and after loading a file, NOT while the user is typing.
export const syncInputs = () => {
    el.speciesSelect.value = state.species;
    el.female.input.value = String(state.femalePearl).replace(".", ",");
    el.male.input.value = String(state.malePearl).replace(".", ",");
    el.slotName.value = slotsState.names[slotsState.active];
};

// Redraws everything that depends on the model. Safe to call as often as you like.
export const render = () => {
    el.nestCount.textContent = state.nests;
    el.totalEggs.textContent = getTotalEggs();
    const chance = getEggChance();
    el.eggChance.textContent = `${formatChance(chance)} (1 in ${Math.round(1 / chance)})`;
    el.cumulativeChance.textContent = formatCumulative(getCumulativeChance());

    renderParent("female", state.femaleEquipped, state.femalePearl);
    renderParent("male", state.maleEquipped, state.malePearl);
    renderMessage();
    renderFound();
    renderSlots();
};