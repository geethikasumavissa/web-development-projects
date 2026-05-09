const boardElement = document.getElementById("board");
const cells = [...document.querySelectorAll(".cell")];
const turnIndicator = document.getElementById("turnIndicator");
const scoreXElement = document.getElementById("scoreX");
const scoreOElement = document.getElementById("scoreO");
const scoreDrawElement = document.getElementById("scoreDraw");
const restartButton = document.getElementById("restartButton");
const resetScoreButton = document.getElementById("resetScoreButton");
const themeToggle = document.getElementById("themeToggle");
const soundToggle = document.getElementById("soundToggle");
const resultModal = document.getElementById("resultModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalIcon = document.getElementById("modalIcon");
const modalRestartButton = document.getElementById("modalRestartButton");
const winningLine = document.getElementById("winningLine");

const winningPatterns = [
    { combo: [0, 1, 2], line: "row-1" },
    { combo: [3, 4, 5], line: "row-2" },
    { combo: [6, 7, 8], line: "row-3" },
    { combo: [0, 3, 6], line: "col-1" },
    { combo: [1, 4, 7], line: "col-2" },
    { combo: [2, 5, 8], line: "col-3" },
    { combo: [0, 4, 8], line: "diag-1" },
    { combo: [2, 4, 6], line: "diag-2" },
];

const game = {
    board: Array(9).fill(""),
    currentPlayer: "X",
    isGameOver: false,
    scores: {
        X: 0,
        O: 0,
        draw: 0,
    },
};

// Small Web Audio effects keep the project asset-free and framework-free.
function playTone(frequency, duration, type = "sine", volume = 0.08) {
    if (!soundToggle.checked) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.stop(context.currentTime + duration);
}

function playClickSound() {
    playTone(game.currentPlayer === "X" ? 420 : 560, 0.12, "triangle", 0.06);
}

function playWinSound() {
    if (!soundToggle.checked) return;
    [520, 660, 820].forEach((note, index) => {
        setTimeout(() => playTone(note, 0.16, "sine", 0.08), index * 110);
    });
}

function playDrawSound() {
    playTone(260, 0.18, "sawtooth", 0.05);
}

function handleCellClick(event) {
    const cell = event.currentTarget;
    const index = Number(cell.dataset.index);

    if (game.board[index] || game.isGameOver) return;
    makeMove(index);
}

function makeMove(index) {
    game.board[index] = game.currentPlayer;

    const cell = cells[index];
    cell.textContent = game.currentPlayer;
    cell.classList.add(game.currentPlayer.toLowerCase(), "played");
    cell.setAttribute("aria-label", `Cell ${index + 1}, ${game.currentPlayer}`);
    playClickSound();

    const winningResult = getWinningResult();

    if (winningResult) {
        finishRoundWithWinner(winningResult);
        return;
    }

    if (game.board.every(Boolean)) {
        finishRoundWithDraw();
        return;
    }

    switchPlayer();
}

function switchPlayer() {
    game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
    updateTurnIndicator();
}

function updateTurnIndicator() {
    turnIndicator.textContent = `Player ${game.currentPlayer}'s turn`;
    turnIndicator.style.borderColor = game.currentPlayer === "X"
        ? "rgba(37, 99, 235, 0.42)"
        : "rgba(219, 39, 119, 0.42)";
}

function getWinningResult() {
    return winningPatterns.find(({ combo }) => {
        const [a, b, c] = combo;
        return game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c];
    });
}

function finishRoundWithWinner(result) {
    game.isGameOver = true;
    game.scores[game.currentPlayer] += 1;
    updateScoreboard();
    highlightWinningCells(result.combo);
    drawWinningLine(result.line);
    playWinSound();
    showResultModal(`Player ${game.currentPlayer} Wins!`, `A clean three-in-a-row for Player ${game.currentPlayer}.`, game.currentPlayer);
}

function finishRoundWithDraw() {
    game.isGameOver = true;
    game.scores.draw += 1;
    updateScoreboard();
    playDrawSound();
    showResultModal("It's a Draw!", "Every cell is filled and nobody claimed the line.", "draw");
}

function highlightWinningCells(combo) {
    combo.forEach((index) => cells[index].classList.add("winner"));
}

function drawWinningLine(lineType) {
    const boardSize = boardElement.offsetWidth;
    const cellStep = boardSize / 3;
    const positions = {
        "row-1": { x: boardSize * 0.07, y: cellStep * 0.5, rotation: 0, width: boardSize * 0.86 },
        "row-2": { x: boardSize * 0.07, y: cellStep * 1.5, rotation: 0, width: boardSize * 0.86 },
        "row-3": { x: boardSize * 0.07, y: cellStep * 2.5, rotation: 0, width: boardSize * 0.86 },
        "col-1": { x: cellStep * 0.5, y: cellStep * 1.5, rotation: 90, width: boardSize * 0.86 },
        "col-2": { x: cellStep * 1.5, y: cellStep * 1.5, rotation: 90, width: boardSize * 0.86 },
        "col-3": { x: cellStep * 2.5, y: cellStep * 1.5, rotation: 90, width: boardSize * 0.86 },
        "diag-1": { x: boardSize * 0.5, y: boardSize * 0.5, rotation: 45, width: boardSize * 1.14 },
        "diag-2": { x: boardSize * 0.5, y: boardSize * 0.5, rotation: -45, width: boardSize * 1.14 },
    };

    const line = positions[lineType];
    winningLine.style.left = `${line.x}px`;
    winningLine.style.top = `${line.y}px`;
    winningLine.style.transform = lineType.startsWith("row")
        ? `translateY(-50%) rotate(${line.rotation}deg)`
        : `translate(-50%, -50%) rotate(${line.rotation}deg)`;
    winningLine.classList.add("show");

    requestAnimationFrame(() => {
        winningLine.style.width = `${line.width}px`;
    });
}

function showResultModal(title, message, winner) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalIcon.textContent = winner === "draw" ? "=" : winner;
    resultModal.classList.add("show");
    resultModal.setAttribute("aria-hidden", "false");
}

function hideResultModal() {
    resultModal.classList.remove("show");
    resultModal.setAttribute("aria-hidden", "true");
}

function updateScoreboard() {
    scoreXElement.textContent = game.scores.X;
    scoreOElement.textContent = game.scores.O;
    scoreDrawElement.textContent = game.scores.draw;
}

function restartGame() {
    game.board = Array(9).fill("");
    game.currentPlayer = "X";
    game.isGameOver = false;

    cells.forEach((cell, index) => {
        cell.textContent = "";
        cell.className = "cell";
        cell.setAttribute("aria-label", `Cell ${index + 1}`);
    });

    winningLine.classList.remove("show");
    winningLine.style.width = "0";
    hideResultModal();
    updateTurnIndicator();
}

function resetScoreboard() {
    game.scores = { X: 0, O: 0, draw: 0 };
    updateScoreboard();
    restartGame();
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    themeToggle.querySelector(".theme-icon").textContent = document.body.classList.contains("dark") ? "L" : "D";
}

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
restartButton.addEventListener("click", restartGame);
resetScoreButton.addEventListener("click", resetScoreboard);
modalRestartButton.addEventListener("click", restartGame);
themeToggle.addEventListener("click", toggleTheme);

resultModal.addEventListener("click", (event) => {
    if (event.target === resultModal) {
        hideResultModal();
    }
});

updateScoreboard();
updateTurnIndicator();
