const canvas = document.getElementById("game-board");
const context = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const statusElement = document.getElementById("status");
const overlayElement = document.getElementById("overlay");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const restartButton = document.getElementById("restart-button");

const TILE_COUNT = 20;
const TILE_SIZE = canvas.width / TILE_COUNT;
const GAME_SPEED = 120;

const DIRECTIONS = {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
};

let snake;
let food;
let direction;
let nextDirection;
let score;
let gameTimer;
let isRunning;
let isGameOver;

function resetGame() {
    snake = [
        { x: 9, y: 10 },
        { x: 8, y: 10 },
        { x: 7, y: 10 },
    ];
    direction = DIRECTIONS.right;
    nextDirection = DIRECTIONS.right;
    score = 0;
    isRunning = false;
    isGameOver = false;
    food = createFood();

    clearInterval(gameTimer);
    updateScore();
    setStatus("Eat the red food. Avoid walls and your own tail.");
    showOverlay("Snake", "Press Start or Space");
    drawGame();
}

function startGame() {
    if (isRunning) {
        return;
    }

    if (isGameOver) {
        resetGame();
    }

    isRunning = true;
    hideOverlay();
    setStatus("Use arrow keys or WASD to move.", "success");
    clearInterval(gameTimer);
    gameTimer = setInterval(tick, GAME_SPEED);
}

function pauseGame() {
    if (!isRunning || isGameOver) {
        return;
    }

    isRunning = false;
    clearInterval(gameTimer);
    showOverlay("Paused", "Press Space to continue");
    setStatus("Paused.");
}

function tick() {
    direction = nextDirection;

    const head = snake[0];
    const nextHead = {
        x: head.x + direction.x,
        y: head.y + direction.y,
    };

    if (hitsWall(nextHead) || hitsSnake(nextHead)) {
        endGame();
        return;
    }

    snake.unshift(nextHead);

    if (nextHead.x === food.x && nextHead.y === food.y) {
        score += 10;
        food = createFood();
        updateScore();
    } else {
        snake.pop();
    }

    drawGame();
}

function hitsWall(position) {
    return position.x < 0 || position.x >= TILE_COUNT || position.y < 0 || position.y >= TILE_COUNT;
}

function hitsSnake(position) {
    return snake.some((segment) => segment.x === position.x && segment.y === position.y);
}

function createFood() {
    let newFood;

    do {
        newFood = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT),
        };
    } while (snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y));

    return newFood;
}

function changeDirection(name) {
    const selectedDirection = DIRECTIONS[name];

    if (!selectedDirection) {
        return;
    }

    const isReverse =
        selectedDirection.x + direction.x === 0 &&
        selectedDirection.y + direction.y === 0;

    if (!isReverse) {
        nextDirection = selectedDirection;
    }
}

function drawGame() {
    context.fillStyle = "#f8fbf9";
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawFood();
    drawSnake();
}

function drawGrid() {
    context.strokeStyle = "#d8e3de";
    context.lineWidth = 1;

    for (let index = 1; index < TILE_COUNT; index += 1) {
        const position = index * TILE_SIZE;

        context.beginPath();
        context.moveTo(position, 0);
        context.lineTo(position, canvas.height);
        context.stroke();

        context.beginPath();
        context.moveTo(0, position);
        context.lineTo(canvas.width, position);
        context.stroke();
    }
}

function drawSnake() {
    snake.forEach((segment, index) => {
        context.fillStyle = index === 0 ? "#0f5138" : "#176b4d";
        context.fillRect(
            segment.x * TILE_SIZE + 2,
            segment.y * TILE_SIZE + 2,
            TILE_SIZE - 4,
            TILE_SIZE - 4
        );
    });
}

function drawFood() {
    const centerX = food.x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = food.y * TILE_SIZE + TILE_SIZE / 2;

    context.fillStyle = "#d93535";
    context.beginPath();
    context.arc(centerX, centerY, TILE_SIZE * 0.34, 0, Math.PI * 2);
    context.fill();
}

function endGame() {
    isRunning = false;
    isGameOver = true;
    clearInterval(gameTimer);
    drawGame();
    showOverlay("Game Over", `Final score: ${score}`);
    setStatus("Collision detected. Press Restart or Space to play again.", "danger");
}

function updateScore() {
    scoreElement.textContent = score;
}

function showOverlay(title, message) {
    overlayElement.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
    overlayElement.classList.remove("hidden");
}

function hideOverlay() {
    overlayElement.classList.add("hidden");
}

function setStatus(message, type = "") {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`.trim();
}

document.addEventListener("keydown", (event) => {
    const keyMap = {
        ArrowUp: "up",
        w: "up",
        W: "up",
        ArrowRight: "right",
        d: "right",
        D: "right",
        ArrowDown: "down",
        s: "down",
        S: "down",
        ArrowLeft: "left",
        a: "left",
        A: "left",
    };

    if (event.code === "Space") {
        event.preventDefault();
        if (isRunning) {
            pauseGame();
        } else {
            startGame();
        }
        return;
    }

    if (keyMap[event.key]) {
        event.preventDefault();
        changeDirection(keyMap[event.key]);
    }
});

document.querySelectorAll("[data-direction]").forEach((button) => {
    button.addEventListener("click", () => {
        changeDirection(button.dataset.direction);
        startGame();
    });
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", pauseGame);
restartButton.addEventListener("click", () => {
    resetGame();
    startGame();
});

resetGame();
