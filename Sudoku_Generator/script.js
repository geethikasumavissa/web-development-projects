const GRID_SIZE = 9;
const BOX_SIZE = 3;
const EMPTY = 0;
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const BLANKS_BY_DIFFICULTY = {
    easy: 38,
    medium: 46,
    hard: 52,
};

const boardElement = document.getElementById("board");
const difficultyElement = document.getElementById("difficulty");
const statusElement = document.getElementById("status");
const newPuzzleButton = document.getElementById("new-puzzle");
const checkPuzzleButton = document.getElementById("check-puzzle");
const solvePuzzleButton = document.getElementById("solve-puzzle");
const clearPuzzleButton = document.getElementById("clear-puzzle");

let puzzle = [];
let solution = [];

function createEmptyGrid() {
    return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(EMPTY));
}

function cloneGrid(grid) {
    return grid.map((row) => [...row]);
}

function shuffle(values) {
    const result = [...values];

    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function canPlace(grid, row, col, value) {
    for (let index = 0; index < GRID_SIZE; index += 1) {
        if (grid[row][index] === value || grid[index][col] === value) {
            return false;
        }
    }

    const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

    for (let r = boxRow; r < boxRow + BOX_SIZE; r += 1) {
        for (let c = boxCol; c < boxCol + BOX_SIZE; c += 1) {
            if (grid[r][c] === value) {
                return false;
            }
        }
    }

    return true;
}

function fillGrid(grid) {
    for (let row = 0; row < GRID_SIZE; row += 1) {
        for (let col = 0; col < GRID_SIZE; col += 1) {
            if (grid[row][col] !== EMPTY) {
                continue;
            }

            for (const value of shuffle(NUMBERS)) {
                if (canPlace(grid, row, col, value)) {
                    grid[row][col] = value;

                    if (fillGrid(grid)) {
                        return true;
                    }

                    grid[row][col] = EMPTY;
                }
            }

            return false;
        }
    }

    return true;
}

function getCandidates(grid, row, col) {
    return NUMBERS.filter((value) => canPlace(grid, row, col, value));
}

function findBestEmptyCell(grid) {
    let bestCell = null;
    let fewestCandidates = GRID_SIZE + 1;

    for (let row = 0; row < GRID_SIZE; row += 1) {
        for (let col = 0; col < GRID_SIZE; col += 1) {
            if (grid[row][col] !== EMPTY) {
                continue;
            }

            const candidates = getCandidates(grid, row, col);

            if (candidates.length < fewestCandidates) {
                bestCell = { row, col, candidates };
                fewestCandidates = candidates.length;
            }

            if (fewestCandidates === 0) {
                return bestCell;
            }
        }
    }

    return bestCell;
}

function countSolutions(grid, limit = 2) {
    const cell = findBestEmptyCell(grid);

    if (!cell) {
        return 1;
    }

    if (cell.candidates.length === 0) {
        return 0;
    }

    let count = 0;

    for (const value of cell.candidates) {
        grid[cell.row][cell.col] = value;
        count += countSolutions(grid, limit);
        grid[cell.row][cell.col] = EMPTY;

        if (count >= limit) {
            return count;
        }
    }

    return count;
}

function removeCells(grid, blanks) {
    const puzzleGrid = cloneGrid(grid);
    const cells = shuffle(Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => index));
    let removed = 0;

    for (const cell of cells) {
        if (removed >= blanks) {
            break;
        }

        const row = Math.floor(cell / GRID_SIZE);
        const col = cell % GRID_SIZE;
        const backup = puzzleGrid[row][col];

        puzzleGrid[row][col] = EMPTY;

        if (countSolutions(cloneGrid(puzzleGrid)) === 1) {
            removed += 1;
        } else {
            puzzleGrid[row][col] = backup;
        }
    }

    return puzzleGrid;
}

function generatePuzzle() {
    const completedGrid = createEmptyGrid();
    fillGrid(completedGrid);

    solution = cloneGrid(completedGrid);
    puzzle = removeCells(completedGrid, BLANKS_BY_DIFFICULTY[difficultyElement.value]);

    renderBoard();
    setStatus("New puzzle generated.");
}

function getInputValue(input) {
    const value = Number(input.value);
    return Number.isInteger(value) && value >= 1 && value <= 9 ? value : EMPTY;
}

function renderBoard(showSolution = false) {
    boardElement.innerHTML = "";

    for (let row = 0; row < GRID_SIZE; row += 1) {
        for (let col = 0; col < GRID_SIZE; col += 1) {
            const cell = document.createElement("input");
            const value = showSolution ? solution[row][col] : puzzle[row][col];
            const isGiven = puzzle[row][col] !== EMPTY;

            cell.className = "cell";
            cell.type = "text";
            cell.inputMode = "numeric";
            cell.maxLength = 1;
            cell.autocomplete = "off";
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.value = value || "";
            cell.setAttribute("aria-label", `Row ${row + 1}, column ${col + 1}`);

            if (isGiven || showSolution) {
                cell.readOnly = true;
                cell.classList.add("given");
            }

            cell.addEventListener("input", handleCellInput);
            cell.addEventListener("keydown", handleCellNavigation);
            boardElement.appendChild(cell);
        }
    }
}

function handleCellInput(event) {
    const input = event.target;
    const cleaned = input.value.replace(/[^1-9]/g, "").slice(-1);

    input.value = cleaned;
    input.classList.remove("invalid", "correct");
    setStatus("");
}

function handleCellNavigation(event) {
    const arrowKeys = {
        ArrowUp: [-1, 0],
        ArrowRight: [0, 1],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
    };

    if (!arrowKeys[event.key]) {
        return;
    }

    event.preventDefault();

    const row = Number(event.target.dataset.row);
    const col = Number(event.target.dataset.col);
    const [rowStep, colStep] = arrowKeys[event.key];
    const nextRow = Math.min(Math.max(row + rowStep, 0), GRID_SIZE - 1);
    const nextCol = Math.min(Math.max(col + colStep, 0), GRID_SIZE - 1);
    const nextCell = boardElement.querySelector(`[data-row="${nextRow}"][data-col="${nextCol}"]`);

    nextCell?.focus();
}

function setStatus(message, type = "") {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`.trim();
}

function getCurrentGrid() {
    const currentGrid = cloneGrid(puzzle);
    const cells = boardElement.querySelectorAll(".cell");

    cells.forEach((cell) => {
        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);

        if (puzzle[row][col] === EMPTY) {
            currentGrid[row][col] = getInputValue(cell);
        }
    });

    return currentGrid;
}

function checkPuzzle() {
    const cells = boardElement.querySelectorAll(".cell");
    let hasEmptyCells = false;
    let hasMistakes = false;

    cells.forEach((cell) => {
        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);
        const value = getInputValue(cell);

        cell.classList.remove("invalid", "correct");

        if (puzzle[row][col] !== EMPTY) {
            return;
        }

        if (value === EMPTY) {
            hasEmptyCells = true;
            return;
        }

        if (value === solution[row][col]) {
            cell.classList.add("correct");
        } else {
            cell.classList.add("invalid");
            hasMistakes = true;
        }
    });

    if (hasMistakes) {
        setStatus("Some numbers need another look.", "error");
    } else if (hasEmptyCells) {
        setStatus("So far, so good. Keep going.");
    } else {
        setStatus("Solved perfectly.", "success");
    }
}

function clearEntries() {
    boardElement.querySelectorAll(".cell:not(.given)").forEach((cell) => {
        cell.value = "";
        cell.classList.remove("invalid", "correct");
    });

    setStatus("Your entries were cleared.");
}

newPuzzleButton.addEventListener("click", generatePuzzle);
checkPuzzleButton.addEventListener("click", checkPuzzle);
solvePuzzleButton.addEventListener("click", () => {
    renderBoard(true);
    setStatus("Solution shown.", "success");
});
clearPuzzleButton.addEventListener("click", clearEntries);
difficultyElement.addEventListener("change", generatePuzzle);

generatePuzzle();
