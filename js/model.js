// model.js
// Data + math only. No DOM code here.

// Eggs laid per nest, depending on the dragon species
export const SPECIES = {
    "Flame Stalker": 3,
    "Blitz Striker": 2,
    "Brood Watcher": 2,
    "Acid Spitter": 5,
    "Biolumin": 5,
    "Inferno Ravager": 3,
    "Shadow Scale": 3
};

// 0.5% base chance per egg
const BASE_MUTATION_CHANCE = 0.005;

// Pearl limits (percent)
export const PEARL_MIN = 1;
export const PEARL_MAX = 10;

// Pearl rarity tiers. Each tier covers everything up to its "max" percent.
// Order matters: lowest tier first.
export const PEARL_RARITIES = [
    { name: "Common",    slug: "common",    max: 6.9 },
    { name: "Uncommon",  slug: "uncommon",  max: 7.9 },
    { name: "Rare",      slug: "rare",      max: 8.9 },
    { name: "Exotic",    slug: "exotic",    max: 9.9 },
    { name: "Legendary", slug: "legendary", max: 10 }
];

// Returns the tier object for a pearl percent (e.g. 8.9 -> Rare)
export const getPearlRarity = (percent) => {
    const tier = PEARL_RARITIES.find((rarity) => percent <= rarity.max);
    return tier ?? PEARL_RARITIES[PEARL_RARITIES.length - 1];
};

// Everything the app needs to remember
export const state = {
    species: "Flame Stalker",
    nests: 0,
    femaleEquipped: false,
    femalePearl: PEARL_MIN, // percent as typed by the user (e.g. 1.9 = 1.9%)
    maleEquipped: false,
    malePearl: PEARL_MIN,
    found: false,           // did the user get the mutation?
    foundAtEggs: null       // how many eggs it took (null until found)
};

// ---------- Helpers ----------

// Accepts numbers or strings with a comma or a dot ("1,9" or "1.9").
// Invalid input falls back to min.
const toNumber = (value, min, max) => {
    const number = Number(String(value).replace(",", "."));
    if (Number.isNaN(number)) return min;
    return Math.min(Math.max(number, min), max);
};

// Rounds to 1 decimal (8.94 -> 8.9)
const roundToOneDecimal = (number) => Math.round(number * 10) / 10;

// ---------- Setters ----------

export const setNests = (amount) => {
    state.nests = Math.floor(toNumber(amount, 0, 9999));
};

export const changeNests = (delta) => {
    setNests(state.nests + delta);
};

export const setSpecies = (name) => {
    if (name in SPECIES) {
        state.species = name;
    }
};

// parent: "female" or "male"
export const setPearlEquipped = (parent, equipped) => {
    if (parent === "female") state.femaleEquipped = Boolean(equipped);
    if (parent === "male") state.maleEquipped = Boolean(equipped);
};

// parent: "female" or "male", percent: 1 to 10 (decimals allowed)
export const setPearlPercent = (parent, percent) => {
    const value = roundToOneDecimal(toNumber(percent, PEARL_MIN, PEARL_MAX));
    if (parent === "female") state.femalePearl = value;
    if (parent === "male") state.malePearl = value;
};

// ---------- Mutation found ----------

export const markFound = () => {
    state.found = true;
    state.foundAtEggs = state.nests * SPECIES[state.species];
};

export const unmarkFound = () => {
    state.found = false;
    state.foundAtEggs = null;
};

// ---------- Calculations ----------

// Nests -> eggs (the user can't edit eggs directly)
export const getTotalEggs = () => {
    return state.nests * SPECIES[state.species];
};

// A pearl only counts if the parent has it equipped
const getPearlBonus = (equipped, percent) => {
    return equipped ? percent / 100 : 0;
};

// P = P_base * (1 + femaleBonus + maleBonus)
export const getEggChance = () => {
    const female = getPearlBonus(state.femaleEquipped, state.femalePearl);
    const male = getPearlBonus(state.maleEquipped, state.malePearl);
    return BASE_MUTATION_CHANCE * (1 + female + male);
};

// Cumulative % = (1 - (1 - P)^eggs) * 100
export const getCumulativeChance = () => {
    const p = getEggChance();
    return (1 - Math.pow(1 - p, getTotalEggs())) * 100;
};

// Statistical average = 1 / P (eggs needed on average)
export const getAverageEggs = () => {
    return 1 / getEggChance();
};

// Positive = eggs left until the average. Zero or negative = already past it.
export const getEggsToAverage = () => {
    return Math.ceil(getAverageEggs() - getTotalEggs());
};

// ---------- Save / load / reset ----------

export const resetState = () => {
    state.species = "Flame Stalker";
    state.nests = 0;
    state.femaleEquipped = false;
    state.femalePearl = PEARL_MIN;
    state.maleEquipped = false;
    state.malePearl = PEARL_MIN;
    state.found = false;
    state.foundAtEggs = null;
};

// A plain copy of the state, ready to become JSON
export const getSaveData = () => ({
    app: "dod-egg-calculator",
    version: 1,
    ...state
});

// Loads saved data through the setters, so bad values get fixed or ignored.
// Returns false if the data isn't an object.
export const loadSaveData = (data) => {
    if (typeof data !== "object" || data === null) return false;

    resetState();
    setSpecies(data.species);
    setNests(data.nests);
    setPearlEquipped("female", data.femaleEquipped);
    setPearlPercent("female", data.femalePearl);
    setPearlEquipped("male", data.maleEquipped);
    setPearlPercent("male", data.malePearl);

    if (data.found === true) {
        state.found = true;
        state.foundAtEggs = Math.max(0, Math.floor(Number(data.foundAtEggs)) || 0);
    }
    return true;
};