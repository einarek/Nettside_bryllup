

// -----------------------
// Firebase (RTDB) setup
// -----------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

const app = initializeApp({
  apiKey: "AIzaSyCS76udSJAebNHNaNTcvGVOdvLnU_1LJiI",
  authDomain: "kartnettside.firebaseapp.com",
  databaseURL: "https://kartnettside-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kartnettside",
  storageBucket: "kartnettside.firebasestorage.app",
  messagingSenderId: "495949813180",
  appId: "1:495949813180:web:9f74f5c0e9dfef1f03c7b9",
  measurementId: "G-W7JZWMQ4ZY"
});
const db = getDatabase(app);

// Dedicated RTDB path (keeps it separate from any other game leaderboard)
const LB_PATH = "memory_leaderboard";

// -----------------------
// Image pool (30 images)
// -----------------------
const IMAGE_POOL = Array.from({ length: 8 }, (_, i) => {
  const n = i + 1;
  return new URL(`Images/memory/${n}.jpg`, document.baseURI).href;
});



// -----------------------
// DOM
// -----------------------
const boardEl = document.getElementById("board");
const timeTextEl = document.getElementById("timeText");
const movesTextEl = document.getElementById("movesText");
const pairsTextEl = document.getElementById("pairsText");

const restartBtn = document.getElementById("restartBtn");
const restartBtn2 = document.getElementById("restartBtn2");

// Game over panel (your snippet)
const gameOverPanel = document.getElementById("gameOverPanel");
const finalTimeEl = document.getElementById("finalTime");
const finalMovesEl = document.getElementById("finalMoves");
const playAgainBtn = document.getElementById("playAgainBtn");
const nameForm = document.getElementById("nameForm");
const playerNameEl = document.getElementById("playerName");




// -----------------------
// Game state
// -----------------------
let cards = [];
let firstPick = null;
let secondPick = null;
let lockBoard = false;

let started = false;
let startTs = 0;
let timerRaf = 0;

let moves = 0;
let matchedPairs = 0;

// -----------------------
// Helpers
// -----------------------
function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatTime(ms){
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}.${tenths}`;
}

function nowMs(){
  return performance.now();
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// -----------------------
// Timer
// -----------------------
function setStarted(){
  if (started) return;
  started = true;
  startTs = nowMs();
  tickTimer();
}

function tickTimer(){
  if (!started) return;
  const elapsed = nowMs() - startTs;
  timeTextEl.textContent = formatTime(elapsed);
  timerRaf = requestAnimationFrame(tickTimer);
}

function stopTimer(){
  if (timerRaf) cancelAnimationFrame(timerRaf);
  timerRaf = 0;
}

function resetUI(){
  timeTextEl.textContent = "00:00.0";
  movesTextEl.textContent = "0";
  pairsTextEl.textContent = "0/8";
}

// -----------------------
// Deck / board
// -----------------------
function buildDeck(){
  // pick 8 unique images randomly from the pool of 30
  const picks = shuffle([...IMAGE_POOL]).slice(0, 8);

  const deck = [];
  for (let i = 0; i < picks.length; i++){
    const img = picks[i];
    deck.push({ pairId: i, img });
    deck.push({ pairId: i, img });
  }
  return shuffle(deck);
}


function renderBoard(deck){
  boardEl.innerHTML = "";
  cards = [];

  deck.forEach((c, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.setAttribute("aria-label", "Kort");
    btn.dataset.pairId = String(c.pairId);
    btn.dataset.index = String(idx);

    btn.innerHTML = `
      <div class="card-face card-back">?</div>
      <div class="card-face card-front">
        <img src="${c.img}" alt="Memory bilde"
        style="width:100%;height:100%;object-fit:cover;display:block;background:#ffd6d6;"
        onload="console.log('IMG OK:', this.src)"
        onerror="console.error('IMG FAIL:', this.src); this.style.background='#ff0000';">



      </div>
    `;

    btn.addEventListener("click", () => onCardClick(btn));
    boardEl.appendChild(btn);
    cards.push(btn);
  });
}

function setMoves(n){
  moves = n;
  movesTextEl.textContent = String(moves);
}

function setPairs(n){
  matchedPairs = n;
  pairsTextEl.textContent = `${matchedPairs}/8`;
}

function flip(card){
  card.classList.add("is-flipped");
  card.disabled = true;
}

function unflip(card){
  card.classList.remove("is-flipped");
  card.disabled = false;
}


function markMatched(a,b){
  a.classList.add("is-matched");
  b.classList.add("is-matched");
  a.disabled = true;
  b.disabled = true;
}

function getElapsedMs(){
  if (!started) return 0;
  return Math.max(0, Math.round(nowMs() - startTs));
}

// -----------------------
// Gameplay
// -----------------------
function onCardClick(card){
  if (lockBoard) return;
  if (card.classList.contains("is-flipped")) return;

  setStarted();
  flip(card);

  if (!firstPick){
    firstPick = card;
    return;
  }

  secondPick = card;
  lockBoard = true;
  setMoves(moves + 1);

  const same = firstPick.dataset.pairId === secondPick.dataset.pairId;

  if (same){
    markMatched(firstPick, secondPick);
    setPairs(matchedPairs + 1);

    firstPick = null;
    secondPick = null;
    lockBoard = false;

    if (matchedPairs === 8){
      onWin();
    }
    return;
  }

  setTimeout(() => {
    unflip(firstPick);
    unflip(secondPick);
    firstPick = null;
    secondPick = null;
    lockBoard = false;
  }, 700);
}

// -----------------------
// Game over panel
// -----------------------
function openGameOver(){
  stopTimer();
  nameForm.hidden = false;
  playerNameEl.focus();
}

function closeGameOver(){
  nameForm.hidden = true;
}


function onWin(){
  openGameOver();
}

function resetGameState(){
  firstPick = null;
  secondPick = null;
  lockBoard = false;

  started = false;
  startTs = 0;
  stopTimer();

  setMoves(0);
  setPairs(0);
  resetUI();
  closeGameOver();
}

function newGame(){
  resetGameState();
  const deck = buildDeck();
  renderBoard(deck);
}

async function submitScore(name){
  if (!name) return;

  const entry = {
    name,
    timeMs: getElapsedMs(),
    moves,
    createdAt: Date.now()
  };

  const listRef = ref(db, LB_PATH);
  const newRef = push(listRef);
  await set(newRef, entry);
}



// -----------------------
// Wire up events
// -----------------------
restartBtn?.addEventListener("click", newGame);
restartBtn2?.addEventListener("click", newGame);
playAgainBtn?.addEventListener("click", newGame);

nameForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = playerNameEl.value.trim();

  try{
    await submitScore(name);
    playerNameEl.value = "";
    closeGameOver();
  }catch(err){
    console.error("Submit error:", err);
    alert("Kunne ikke lagre score. Sjekk Console (F12).");
  }
});

// Start first game
newGame();



