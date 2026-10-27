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

// Everything the app needs to remember
export const state = {
    species: "Flame Stalker",
    nests: 0,
    femaleEquipped: false,
    femalePearl: PEARL_MIN, // percent as typed by the user (e.g. 1.9 = 1.9%)
    maleEquipped: false,
    malePearl: PEARL_MIN
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