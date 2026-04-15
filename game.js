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

// --- Translations ---
let rulesLang = "en";

const RULES = {
  en: {
    title: "How to Play",
    sections: [
      {
        heading: "Objective",
        body: '<p>Be the first player to complete the required number of <strong>sequences</strong> (5 chips in a row).</p><ul><li>2-player game: complete <strong>2 sequences</strong> to win</li><li>3-player game: complete <strong>1 sequence</strong> to win</li></ul>'
      },
      {
        heading: "Turns",
        body: '<p>Players take turns placing chips on the board. Click <strong>Next Turn</strong> to pass the turn to the next player.</p>'
      },
      {
        heading: "Placing Chips",
        body: '<p>With <strong>Place</strong> mode active, click any empty cell to put your chip there. You cannot place on a cell that already has a chip or on a FREE space.</p>'
      },
      {
        heading: "Removing Chips",
        body: '<p>Switch to <strong>Remove</strong> mode to remove an opponent\'s chip from the board. You cannot remove chips that are part of a completed sequence or chips on FREE spaces. Removing does not end your turn.</p>'
      },
      {
        heading: "The Board & Cards",
        body: '<p>The 10x10 board is made up of cells, each representing a card from a standard 52-card deck plus 4 Jacks (2 one-eyed, 2 two-eyed). Each regular card appears exactly twice on the board (e.g. there are two 10 of Spades cells). The four corner cells are <strong>FREE</strong> spaces — they belong to everyone and count toward any sequence.</p>'
      },
      {
        heading: "The Dealer & Dealing",
        body: '<p>The dealer shuffles the deck and deals a hand of cards to each player. The number of cards dealt depends on the number of players:</p><ul><li><strong>2 players</strong> — 7 cards each</li><li><strong>3–4 players</strong> — 6 cards each</li><li><strong>6 players</strong> — 5 cards each</li><li><strong>8–9 players</strong> — 4 cards each</li><li><strong>10–12 players</strong> — 3 cards each</li></ul><p>On your turn, you play a card from your hand to place a chip on the matching board cell, then draw a replacement card from the deck. If the deck runs out, the discard pile is reshuffled to form a new draw pile.</p>'
      },
      {
        heading: "Jack Cards",
        body: '<p>Jacks are special cards that are not on the board:</p><ul><li><strong>One-Eyed Jack</strong> (Jack of Spades ♠, Jack of Clubs ♣) — Remove one opponent\'s chip from the board. You cannot remove a chip that is part of a completed sequence.</li><li><strong>Two-Eyed Jack</strong> (Jack of Hearts ♥, Jack of Diamonds ♦) — Wild card. Place a chip on <strong>any</strong> open space on the board, even if that card is not in your hand.</li></ul>'
      },
      {
        heading: "Penalty — Coaching",
        body: '<p>If a player gives a move hint or coaches another team (e.g. suggesting where to place or remove a chip), that player is penalized. Their hand is <strong>reduced by 1 card</strong> for the remainder of the game. Multiple offenses result in further card reductions.</p>'
      },
      {
        heading: "Digital Version Note",
        body: '<p>In this digital version, the card-hand and dealer mechanics are not enforced by the code. Players may place a chip on <strong>any</strong> open cell and use <strong>Place/Remove</strong> modes freely. To play with proper rules, designate a dealer, deal cards, and honor the hand system manually — play only on cells that match a card in your hand.</p>'
      },
      {
        heading: "Sequences",
        body: '<p>A sequence is <strong>5 or more chips in a row</strong> — horizontally, vertically, or diagonally. Corner <strong>FREE</strong> spaces count as part of a sequence for every player. Once a sequence is completed, those chips are locked and cannot be removed.</p>'
      }
    ]
  },
  id: {
    title: "Cara Bermain",
    sections: [
      {
        heading: "Tujuan",
        body: '<p>Jadilah pemain pertama yang menyelesaikan jumlah <strong>sequence</strong> yang ditentukan (5 chip berjajar).</p><ul><li>Permainan 2 pemain: selesaikan <strong>2 sequence</strong> untuk menang</li><li>Permainan 3 pemain: selesaikan <strong>1 sequence</strong> untuk menang</li></ul>'
      },
      {
        heading: "Giliran",
        body: '<p>Pemain menggilir menaruh chip di papan. Klik <strong>Next Turn</strong> untuk mengoper giliran ke pemain berikutnya.</p>'
      },
      {
        heading: "Menaruh Chip",
        body: '<p>Dengan mode <strong>Place</strong> aktif, klik sel kosong mana saja untuk menaruh chip Anda. Anda tidak bisa menaruh di sel yang sudah ada chip atau di ruang FREE.</p>'
      },
      {
        heading: "Menghapus Chip",
        body: '<p>Alihkan ke mode <strong>Remove</strong> untuk menghapus chip lawan dari papan. Anda tidak bisa menghapus chip yang bagian dari sequence yang sudah selesai atau chip di ruang FREE. Menghapus tidak mengakhiri giliran Anda.</p>'
      },
      {
        heading: "Papan & Kartu",
        body: '<p>Papan 10x10 terdiri dari sel-sel, yang masing-masing merepresentasikan kartu dari dek standar 52 kartu ditambah 4 Jack (2 one-eyed, 2 two-eyed). Setiap kartu biasa muncul tepat dua kali di papan (misalnya ada dua sel 10 of Spades). Empat sel pojok adalah ruang <strong>FREE</strong> — milik semua pemain dan berlaku untuk setiap sequence.</p>'
      },
      {
        heading: "Dealer & Pembagian",
        body: '<p>Dealer mengocok dek dan membagikan tangan kartu ke setiap pemain. Jumlah kartu yang dibagikan tergantung jumlah pemain:</p><ul><li><strong>2 pemain</strong> — 7 kartu per pemain</li><li><strong>3–4 pemain</strong> — 6 kartu per pemain</li><li><strong>6 pemain</strong> — 5 kartu per pemain</li><li><strong>8–9 pemain</strong> — 4 kartu per pemain</li><li><strong>10–12 pemain</strong> — 3 kartu per pemain</li></ul><p>Saat giliran Anda, mainkan kartu dari tangan Anda untuk menaruh chip di sel papan yang sesuai, lalu ambil kartu pengganti dari dek. Jika dek habis, tumpukan buangan dikocok ulang menjadi dek baru.</p>'
      },
      {
        heading: "Kartu Jack",
        body: '<p>Jack adalah kartu khusus yang tidak ada di papan:</p><ul><li><strong>One-Eyed Jack</strong> (Jack of Spades ♠, Jack of Clubs ♣) — Hapus satu chip lawan dari papan. Anda tidak bisa menghapus chip yang bagian dari sequence yang sudah selesai.</li><li><strong>Two-Eyed Jack</strong> (Jack of Hearts ♥, Jack of Diamonds ♦) — Kartu wild. Taruh chip di <strong>sel mana saja</strong> yang kosong di papan, meskipun kartu tersebut tidak ada di tangan Anda.</li></ul>'
      },
      {
        heading: "Hukuman — Melatih",
        body: '<p>Jika seorang pemain memberikan petunjuk gerakan atau melatih tim lain (misalnya menyarankan di mana menaruh atau menghapus chip), pemain tersebut dikenakan hukuman. Tangan mereka <strong>dikurangi 1 kartu</strong> selama sisa permainan. Pelanggaran berulang mengakibatkan pengurangan kartu lebih lanjut.</p>'
      },
      {
        heading: "Catatan Versi Digital",
        body: '<p>Dalam versi digital ini, mekanik tangan kartu dan dealer tidak diterapkan oleh kode. Pemain boleh menaruh chip di <strong>sel mana saja</strong> yang kosong dan menggunakan mode <strong>Place/Remove</strong> dengan bebas. Untuk bermain dengan aturan lengkap, tunjuk dealer, bagikan kartu, dan patuhi sistem tangan secara manual — mainkan hanya di sel yang sesuai dengan kartu di tangan Anda.</p>'
      },
      {
        heading: "Sequence",
        body: '<p>Sequence adalah <strong>5 chip atau lebih berjajar</strong> — horizontal, vertikal, atau diagonal. Ruang <strong>FREE</strong> di pojok berlaku sebagai bagian dari sequence untuk semua pemain. Setelah sequence selesai, chip-chip tersebut terkunci dan tidak bisa dihapus.</p>'
      }
    ]
  }
};

function renderRules() {
  const lang = RULES[rulesLang];
  document.getElementById("rules-title").textContent = lang.title;
  const body = document.getElementById("rules-body");
  body.innerHTML = lang.sections.map(s =>
    `<h3>${s.heading}</h3>${s.body}`
  ).join("");
}

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

  // Rules modal
  const modal = document.getElementById("rules-modal");
  const langBtn = document.getElementById("btn-lang");

  renderRules();
  langBtn.classList.add("active");

  document.getElementById("btn-rules").addEventListener("click", () => {
    renderRules();
    modal.classList.add("open");
  });
  document.getElementById("btn-close-rules").addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });

  langBtn.addEventListener("click", () => {
    rulesLang = rulesLang === "en" ? "id" : "en";
    langBtn.textContent = rulesLang === "en" ? "ID" : "EN";
    renderRules();
  });
}

document.addEventListener("DOMContentLoaded", init);