// Board layout from sequence-board.md
const BOARD_LAYOUT = [
  [
    "FREE",
    "10 of Spades",
    "Queen of Spades",
    "King of Spades",
    "Ace of Spades",
    "2 of Diamonds",
    "3 of Diamonds",
    "4 of Diamonds",
    "5 of Diamonds",
    "FREE"
  ],
  [
    "9 of Spades",
    "10 of Hearts",
    "9 of Hearts",
    "8 of Hearts",
    "7 of Hearts",
    "6 of Hearts",
    "5 of Hearts",
    "4 of Hearts",
    "3 of Hearts",
    "6 of Diamonds"
  ],
  [
    "8 of Spades",
    "Queen of Hearts",
    "7 of Diamonds",
    "8 of Diamonds",
    "9 of Diamonds",
    "10 of Diamonds",
    "Queen of Diamonds",
    "King of Diamonds",
    "2 of Hearts",
    "7 of Diamonds"
  ],
  [
    "7 of Spades",
    "King of Hearts",
    "6 of Diamonds",
    "2 of Clubs",
    "5 of Hearts",
    "4 of Hearts",
    "Ace of Hearts",
    "Ace of Diamonds",
    "2 of Spades",
    "8 of Diamonds"
  ],
  [
    "6 of Spades",
    "Ace of Hearts",
    "5 of Diamonds",
    "3 of Clubs",
    "6 of Hearts",
    "3 of Hearts",
    "King of Hearts",
    "Ace of Clubs",
    "3 of Spades",
    "9 of Diamonds"
  ],
  [
    "5 of Spades",
    "2 of Clubs",
    "4 of Diamonds",
    "4 of Clubs",
    "7 of Hearts",
    "2 of Hearts",
    "Queen of Hearts",
    "King of Clubs",
    "4 of Spades",
    "10 of Diamonds"
  ],
  [
    "4 of Spades",
    "3 of Clubs",
    "3 of Diamonds",
    "5 of Clubs",
    "8 of Hearts",
    "9 of Hearts",
    "10 of Hearts",
    "Queen of Clubs",
    "5 of Spades",
    "Queen of Diamonds"
  ],
  [
    "3 of Spades",
    "4 of Clubs",
    "2 of Diamonds",
    "6 of Clubs",
    "7 of Clubs",
    "8 of Clubs",
    "9 of Clubs",
    "10 of Clubs",
    "6 of Spades",
    "King of Diamonds"
  ],
  [
    "2 of Spades",
    "5 of Clubs",
    "Ace of Spades",
    "King of Spades",
    "Queen of Spades",
    "10 of Spades",
    "9 of Spades",
    "8 of Spades",
    "7 of Spades",
    "Ace of Diamonds"
  ],
  [
    "FREE",
    "6 of Clubs",
    "7 of Clubs",
    "8 of Clubs",
    "9 of Clubs",
    "10 of Clubs",
    "Queen of Clubs",
    "King of Clubs",
    "Ace of Clubs",
    "FREE"
  ]
];

const SUIT_SYMBOLS = { Spades: "\u2660", Hearts: "\u2665", Diamonds: "\u2666", Clubs: "\u2663" };
const SUIT_COLORS = { Spades: "black", Hearts: "red", Diamonds: "red", Clubs: "black" };

function parseCard(str) {
  if (str === "FREE") return null;
  const parts = str.split(" of ");
  return { rank: parts[0], suit: parts[1] };
}

function formatCard(str) {
  const card = parseCard(str);
  if (!card) return { html: "\u2605", cssClass: "free" };
  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];
  return {
    html: `<span class="rank">${card.rank}</span><span class="suit">${symbol}</span>`,
    cssClass: color
  };
}

// Game state
const state = {
  board: [],        // 10x10 of { card: string, chip: null|1|2|3 }
  currentPlayer: 0,
  numPlayers: 2,
  sequences: [0, 0, 0],
  mode: "place",   // "place" or "remove"
  phase: "playing", // "playing" or "gameOver"
  completedSequences: [] // [{ cells: [[r,c],...], player: 0|1|2 }]
};

const PLAYER_COLORS = ["p1", "p2", "p3"];
const PLAYER_NAMES = ["Blue", "Green", "Red"];
const SEQ_TO_WIN = { 2: 2, 3: 1 };

function initBoard() {
  state.board = BOARD_LAYOUT.map(row =>
    row.map(card => ({ card, chip: null }))
  );
  state.currentPlayer = 0;
  state.sequences = [0, 0, 0];
  state.mode = "place";
  state.phase = "playing";
  state.completedSequences = [];
}

// --- Rendering ---

function renderBoard() {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const cell = state.board[r][c];
      const div = document.createElement("div");
      div.className = "cell";
      div.dataset.row = r;
      div.dataset.col = c;

      const { html, cssClass } = formatCard(cell.card);
      const label = document.createElement("span");
      label.className = "card-label " + cssClass;
      label.innerHTML = html;
      div.appendChild(label);

      if (cell.chip) {
        div.classList.add("has-chip");
        const chip = document.createElement("span");
        chip.className = "chip " + PLAYER_COLORS[cell.chip - 1];
        div.appendChild(chip);
      }

      if (cell.card === "FREE") {
        div.classList.add("free");
      }

      // Show persistent glow on cells that are part of a completed sequence
      for (const seq of state.completedSequences) {
        if (seq.cells.some(([sr, sc]) => sr === r && sc === c)) {
          div.classList.add("sequence", PLAYER_COLORS[seq.player]);
          break;
        }
      }

      div.addEventListener("click", () => onCellClick(r, c));
      boardEl.appendChild(div);
    }
  }
}

function renderPlayers() {
  const container = document.getElementById("players");
  container.innerHTML = "";
  for (let i = 0; i < state.numPlayers; i++) {
    const div = document.createElement("div");
    div.className = "player-info";
    if (i === state.currentPlayer && state.phase === "playing") {
      div.classList.add("current");
    }
    div.innerHTML = `
      <span class="chip-indicator ${PLAYER_COLORS[i]}"></span>
      ${PLAYER_NAMES[i]}: ${state.sequences[i]} seq
    `;
    container.appendChild(div);
  }
}

function updateModeButtons() {
  const placeBtn = document.getElementById("btn-place");
  const removeBtn = document.getElementById("btn-remove");
  placeBtn.classList.toggle("active", state.mode === "place");
  removeBtn.classList.toggle("active", state.mode === "remove");
  removeBtn.classList.toggle("remove-mode", state.mode === "remove");
  placeBtn.classList.toggle("remove-mode", false);
}

function render() {
  renderBoard();
  renderPlayers();
  updateModeButtons();
}

// --- Game Logic ---

function isCellInSequence(r, c) {
  return state.completedSequences.some(seq =>
    seq.cells.some(([sr, sc]) => sr === r && sc === c)
  );
}

function onCellClick(r, c) {
  if (state.phase === "gameOver") return;

  const cell = state.board[r][c];

  if (state.mode === "place") {
    if (cell.card === "FREE" && cell.chip === null) {
      // Free spaces: don't place chips, they count for everyone automatically
      return;
    }
    if (cell.chip !== null) return; // already occupied
    cell.chip = state.currentPlayer + 1;
  } else {
    // Remove mode
    if (cell.chip === null) return;
    if (cell.card === "FREE") return; // can't remove free
    // Can't remove a chip that's part of a completed sequence
    if (isCellInSequence(r, c)) return;
    cell.chip = null;
    render();
    return; // no sequence check on removal
  }

  checkSequencesAt(r, c);
  render();

  if (state.phase === "gameOver") {
    announceWinner();
  }
}

// Check for sequences passing through a specific cell (the newly placed chip)
function checkSequencesAt(r, c) {
  const player = state.currentPlayer;
  const chipVal = player + 1;
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  let newSequences = 0;

  for (const [dr, dc] of dirs) {
    // Extend in both directions from (r, c)
    const cells = [[r, c]];

    // Extend forward
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) {
      const nCell = state.board[nr][nc];
      if (nCell.chip === chipVal || nCell.card === "FREE") {
        cells.push([nr, nc]);
        nr += dr;
        nc += dc;
      } else break;
    }

    // Extend backward
    nr = r - dr; nc = c - dc;
    while (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) {
      const nCell = state.board[nr][nc];
      if (nCell.chip === chipVal || nCell.card === "FREE") {
        cells.unshift([nr, nc]);
        nr -= dr;
        nc -= dc;
      } else break;
    }

    if (cells.length >= 5) {
      newSequences++;
      state.completedSequences.push({ cells, player });
    }
  }

  if (newSequences > 0) {
    state.sequences[player] += newSequences;
    const needed = SEQ_TO_WIN[state.numPlayers];
    if (state.sequences[player] >= needed) {
      state.phase = "gameOver";
    }
  }
}

function announceWinner() {
  const player = state.currentPlayer;
  setTimeout(() => {
    alert(`${PLAYER_NAMES[player]} wins with ${state.sequences[player]} sequence(s)!`);
  }, 100);
}

function nextTurn() {
  if (state.phase === "gameOver") return;
  state.currentPlayer = (state.currentPlayer + 1) % state.numPlayers;
  state.mode = "place";
  render();
}

function resetGame() {
  initBoard();
  render();
}

function setPlayerCount(n) {
  state.numPlayers = n;
  document.getElementById("btn-2p").classList.toggle("active", n === 2);
  document.getElementById("btn-3p").classList.toggle("active", n === 3);
  resetGame();
}

// --- Init ---

function init() {
  initBoard();
  render();

  document.getElementById("btn-place").addEventListener("click", () => {
    state.mode = "place";
    updateModeButtons();
  });

  document.getElementById("btn-remove").addEventListener("click", () => {
    state.mode = "remove";
    updateModeButtons();
  });

  document.getElementById("btn-next").addEventListener("click", nextTurn);
  document.getElementById("btn-reset").addEventListener("click", () => {
    if (confirm("Reset the game?")) resetGame();
  });

  document.getElementById("btn-2p").addEventListener("click", () => setPlayerCount(2));
  document.getElementById("btn-3p").addEventListener("click", () => setPlayerCount(3));
}

document.addEventListener("DOMContentLoaded", init);