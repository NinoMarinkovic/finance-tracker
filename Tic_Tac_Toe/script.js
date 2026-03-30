// Select all the boxes and buttons
let boxes = [...document.querySelectorAll(".box")];
let resetBtn = document.querySelector("#reset");
let newGameBtn = document.querySelector("#new-btn");
let msgContainer = document.querySelector(".msg-container");
let msg = document.querySelector("#msg");
let score1Text = document.querySelector("#score1");
let score2Text = document.querySelector("#score2");
let plopSound = new Audio('plop.mp3');
let victorySound = new Audio('victory.mp3');
let resetSound = new Audio('reset.mp3');

// Define the winning patterns for tic-tac-toe
const winPatterns = [
  [0, 1, 2],
  [0, 3, 6],
  [0, 4, 8],
  [1, 4, 7],
  [2, 5, 8],
  [2, 4, 6],
  [3, 4, 5],
  [6, 7, 8],
];

// Game variables
let humanPlayer = Math.random() < 0.5 ? "X" : "O";
let aiPlayer = humanPlayer === "X" ? "O" : "X";
let currentTurn = "X"; // X always starts
let gameActive = true;

// Score variables (persist across games)
let scoreHuman = 0;
let scoreAI = 0;

// SINGLE SOURCE OF TRUTH: board[] array holds all game state
let board = ["", "", "", "", "", "", "", "", ""];

// Render the board array to the DOM
const renderBoard = () => {
  boxes.forEach((box, i) => {
    if (board[i] === "O") {
      box.innerHTML = `<i class="fa-solid fa-cookie"></i>`;
      box.style.color = 'rgb(83, 71, 55)';
      box.disabled = true;
    } else if (board[i] === "X") {
      box.innerHTML = `<i class="fa-solid fa-mug-saucer"></i>`;
      box.style.color = 'rgb(83, 71, 55)';
      box.disabled = true;
    } else {
      box.innerHTML = "";
      box.disabled = !gameActive;
    }
  });
};

// Add click event listeners to each box
boxes.forEach((box, i) => {
  box.addEventListener("click", function () {
    if (!gameActive) return;
    if (board[i] !== "") return;
    if (currentTurn !== humanPlayer) return;

    plopSound.currentTime = 0;
    plopSound.play();

    board[i] = humanPlayer;
    renderBoard();

    if (checkWinner()) return;

    currentTurn = aiPlayer;

    setTimeout(() => {
      if (gameActive) makeBestMove();
    }, 500);
  });
});

// Function to disable all boxes
const disableBoxes = () => {
  for (let box of boxes) {
    box.disabled = true;
  }
};

// Function to show the winner message
const showWinner = (winner) => {
  if (winner === "Draw") {
    msg.innerText = "Unentschieden!";
  } else if (winner === humanPlayer) {
    msg.innerText = `Glückwunsch, Du hast gewonnen! (${humanPlayer})`;
    scoreHuman++;
    score1Text.innerText = scoreHuman;
  } else {
    msg.innerText = `Die KI hat gewonnen! (${aiPlayer})`;
    scoreAI++;
    score2Text.innerText = scoreAI;
  }
  msgContainer.classList.remove("hide");
  disableBoxes();
  victorySound.play();
  gameActive = false;
};

// Check for a winner using the board[] array
const checkWinner = () => {
  for (let pattern of winPatterns) {
    let val1 = board[pattern[0]];
    let val2 = board[pattern[1]];
    let val3 = board[pattern[2]];

    if (val1 !== "" && val1 === val2 && val2 === val3) {
      boxes[pattern[0]].classList.add("winner-highlight");
      boxes[pattern[1]].classList.add("winner-highlight");
      boxes[pattern[2]].classList.add("winner-highlight");
      showWinner(val1);
      return true;
    }
  }
  if (board.every((cell) => cell !== "")) {
    showWinner("Draw");
    return true;
  }
  return false;
};

// Minimax: check if a player has won — reads from board[]
const checkWin = (player) => {
  for (let pattern of winPatterns) {
    if (
      board[pattern[0]] === player &&
      board[pattern[1]] === player &&
      board[pattern[2]] === player
    ) {
      return true;
    }
  }
  return false;
};

// Get all available (empty) moves from board[]
const getAvailableMoves = () => {
  let moves = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === "") moves.push(i);
  }
  return moves;
};

// Minimax simulation: operates entirely on board[], never touches the DOM
const minimax = (depth, isMaximizing) => {
  if (checkWin(aiPlayer)) return 10 - depth;
  if (checkWin(humanPlayer)) return depth - 10;
  if (board.every((cell) => cell !== "")) return 0;

  let moves = getAvailableMoves();
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (let i of moves) {
    board[i] = isMaximizing ? aiPlayer : humanPlayer;
    let score = minimax(depth + 1, !isMaximizing);
    board[i] = ""; // undo move
    bestScore = isMaximizing
      ? Math.max(bestScore, score)
      : Math.min(bestScore, score);
  }
  return bestScore;
};

// Find and execute the best AI move
const makeBestMove = () => {
  let bestScore = -Infinity;
  let move;

  for (let i of getAvailableMoves()) {
    board[i] = aiPlayer;
    let score = minimax(0, false);
    board[i] = ""; // undo move
    if (score > bestScore) {
      bestScore = score;
      move = i;
    }
  }

  if (move !== undefined) {
    plopSound.currentTime = 0;
    plopSound.play();
    board[move] = aiPlayer;
    renderBoard();

    if (checkWinner()) return;
    currentTurn = humanPlayer;
  }
};

// Reset / New game
const resetGame = () => {
  humanPlayer = Math.random() < 0.5 ? "X" : "O";
  aiPlayer = humanPlayer === "X" ? "O" : "X";
  currentTurn = "X";
  gameActive = true;

  // Reset the single source of truth
  board = ["", "", "", "", "", "", "", "", ""];
  renderBoard();

  // Clear winner highlights
  boxes.forEach((box) => box.classList.remove("winner-highlight"));

  resetSound.play();
  msgContainer.classList.add("hide");

  // If AI is X, it goes first
  if (currentTurn === aiPlayer) {
    setTimeout(makeBestMove, 500);
  }
};

newGameBtn.addEventListener("click", resetGame);
resetBtn.addEventListener("click", resetGame);

// Start game on page load