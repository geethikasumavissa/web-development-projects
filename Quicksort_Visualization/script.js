const barsElement = document.getElementById("bars");
const sizeSlider = document.getElementById("size-slider");
const speedSlider = document.getElementById("speed-slider");
const generateButton = document.getElementById("generate-button");
const sortButton = document.getElementById("sort-button");
const comparisonsElement = document.getElementById("comparisons");
const swapsElement = document.getElementById("swaps");
const statusElement = document.getElementById("status");

let values = [];
let comparisons = 0;
let swaps = 0;
let isSorting = false;

function randomValue() {
    return Math.floor(Math.random() * 86) + 12;
}

function generateArray() {
    const size = Number(sizeSlider.value);
    values = Array.from({ length: size }, randomValue);
    comparisons = 0;
    swaps = 0;

    updateStats();
    renderBars();
    setStatus("New array generated. Ready to sort.");
}

function renderBars(active = {}) {
    barsElement.innerHTML = "";

    values.forEach((value, index) => {
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height = `${value}%`;
        bar.title = String(value);

        if (active.sorted?.includes(index)) {
            bar.classList.add("sorted");
        }

        if (active.compare?.includes(index)) {
            bar.classList.add("compare");
        }

        if (active.pivot === index) {
            bar.classList.add("pivot");
        }

        barsElement.appendChild(bar);
    });
}

function updateStats() {
    comparisonsElement.textContent = comparisons;
    swapsElement.textContent = swaps;
}

function setStatus(message, type = "") {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`.trim();
}

function sleep() {
    const delay = 230 - Number(speedSlider.value);
    return new Promise((resolve) => setTimeout(resolve, delay));
}

async function swap(firstIndex, secondIndex, pivotIndex) {
    if (firstIndex === secondIndex) {
        return;
    }

    [values[firstIndex], values[secondIndex]] = [values[secondIndex], values[firstIndex]];
    swaps += 1;
    updateStats();
    renderBars({ compare: [firstIndex, secondIndex], pivot: pivotIndex });
    await sleep();
}

async function partition(low, high) {
    const pivotValue = values[high];
    let smallerIndex = low - 1;

    renderBars({ pivot: high });
    await sleep();

    for (let currentIndex = low; currentIndex < high; currentIndex += 1) {
        comparisons += 1;
        updateStats();
        renderBars({ compare: [currentIndex], pivot: high });
        await sleep();

        if (values[currentIndex] <= pivotValue) {
            smallerIndex += 1;
            await swap(smallerIndex, currentIndex, high);
        }
    }

    await swap(smallerIndex + 1, high, high);
    return smallerIndex + 1;
}

async function quickSort(low, high, sortedIndexes) {
    if (low > high) {
        return;
    }

    if (low === high) {
        sortedIndexes.add(low);
        renderBars({ sorted: [...sortedIndexes] });
        await sleep();
        return;
    }

    const pivotIndex = await partition(low, high);
    sortedIndexes.add(pivotIndex);
    renderBars({ sorted: [...sortedIndexes], pivot: pivotIndex });
    await sleep();

    await quickSort(low, pivotIndex - 1, sortedIndexes);
    await quickSort(pivotIndex + 1, high, sortedIndexes);
}

function setControlsDisabled(disabled) {
    isSorting = disabled;
    generateButton.disabled = disabled;
    sortButton.disabled = disabled;
    sizeSlider.disabled = disabled;
}

async function startSort() {
    if (isSorting) {
        return;
    }

    setControlsDisabled(true);
    comparisons = 0;
    swaps = 0;
    updateStats();
    setStatus("Sorting in progress...");

    await quickSort(0, values.length - 1, new Set());

    renderBars({ sorted: values.map((_, index) => index) });
    setStatus("Array sorted successfully.", "success");
    setControlsDisabled(false);
}

generateButton.addEventListener("click", generateArray);
sortButton.addEventListener("click", startSort);
sizeSlider.addEventListener("input", () => {
    if (!isSorting) {
        generateArray();
    }
});

generateArray();
