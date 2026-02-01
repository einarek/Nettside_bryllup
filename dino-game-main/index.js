import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getDatabase, ref, push, query, orderByChild, limitToLast, get } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

import Player from "./Player.js";
import Ground from "./Ground.js";
import CactiController from "./CactiController.js";
import Score from "./Score.js";

const firebaseConfig = {
  apiKey: "AIzaSyCS76udSJAebNHNaNTcvGVOdvLnU_1LJiI",
  authDomain: "kartnettside.firebaseapp.com",
  databaseURL: "https://kartnettside-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kartnettside",
  storageBucket: "kartnettside.firebasestorage.app",
  messagingSenderId: "495949813180",
  appId: "1:495949813180:web:9f74f5c0e9dfef1f03c7b9",
  measurementId: "G-W7JZWMQ4ZY"
  };
const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getDatabase(fbApp);

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GAME_SPEED_START = 1; // 1.0
const GAME_SPEED_INCREMENT = 0.00001;

const GAME_WIDTH = 1200;
const GAME_HEIGHT = 300;
const PLAYER_WIDTH = 90 ; //58
const PLAYER_HEIGHT = 120 ; //62
const MAX_JUMP_HEIGHT = GAME_HEIGHT;
const MIN_JUMP_HEIGHT = 150;
const GROUND_WIDTH = 2400;
const GROUND_HEIGHT = 24;
const GROUND_AND_CACTUS_SPEED = 0.5;

const skinFolder = localStorage.getItem("selectedSkin") || "charA";

// Helper to build URLs relative to THIS file (index.js)
function assetUrl(file) {
  // file example: "images/ground.png"
  return new URL(`./${skinFolder}/${file}`, import.meta.url).href;
}

const CACTI_CONFIG = [
  { width: 48, height: 90, image: assetUrl("images/cactus_1.png") },
  { width: 98, height: 80, image: assetUrl("images/cactus_2.png") },
  { width: 68, height: 70, image: assetUrl("images/cactus_3.png") },
];





function getFinalScoreValue() {
  // Score is stored as a float that increases; show rounded integer like the scoreboard.
  return Math.floor(score.score);
}

function showGameOverPanel() {
  const panel = document.getElementById("gameOverPanel");
  const finalScoreEl = document.getElementById("finalScore");
  const nameInput = document.getElementById("playerName");

  if (!panel || !finalScoreEl || !nameInput) return;

  finalScoreEl.textContent = getFinalScoreValue().toString();
  panel.hidden = false;
  nameInput.focus();
}

function hideGameOverPanel() {
  const panel = document.getElementById("gameOverPanel");
  if (panel) panel.hidden = true;
}


//Game Objects
let player = null;
let ground = null;
let cactiController = null;
let score = null;

let scaleRatio = null;
let previousTime = null;
let gameSpeed = GAME_SPEED_START;
let gameOver = false;
let hasAddedEventListenersForRestart = false;
let waitingToStart = true;

function createSprites() {
  const playerWidthInGame = PLAYER_WIDTH * scaleRatio;
  const playerHeightInGame = PLAYER_HEIGHT * scaleRatio;
  const minJumpHeightInGame = MIN_JUMP_HEIGHT * scaleRatio;
  const maxJumpHeightInGame = MAX_JUMP_HEIGHT * scaleRatio;

  const groundWidthInGame = GROUND_WIDTH * scaleRatio;
  const groundHeightInGame = GROUND_HEIGHT * scaleRatio;

  player = new Player(
    ctx,
    playerWidthInGame,
    playerHeightInGame,
    minJumpHeightInGame,
    maxJumpHeightInGame,
    scaleRatio,
    {
      standing: assetUrl("images/dino_jump.png"),
      run1: assetUrl("images/dino_run_1.png"),
      run2: assetUrl("images/dino_run_2.png"),
    }
  );

  ground = new Ground(
    ctx,
    groundWidthInGame,
    groundHeightInGame,
    GROUND_AND_CACTUS_SPEED,
    scaleRatio,
    {
      ground: assetUrl("images/ground.png"),
    }
  );



  const cactiImages = CACTI_CONFIG.map((cactus) => {
    const image = new Image();
    image.src = cactus.image;
    return {
      image: image,
      width: cactus.width * scaleRatio,
      height: cactus.height * scaleRatio,
    };
  });

  cactiController = new CactiController(
    ctx,
    cactiImages,
    scaleRatio,
    GROUND_AND_CACTUS_SPEED
  );

  score = new Score(ctx, scaleRatio);
}

function setScreen() {
  scaleRatio = getScaleRatio();
  canvas.width = GAME_WIDTH * scaleRatio;
  canvas.height = GAME_HEIGHT * scaleRatio;
  createSprites();
}

setScreen();
//Use setTimeout on Safari mobile rotation otherwise works fine on desktop
window.addEventListener("resize", () => setTimeout(setScreen, 500));

if (screen.orientation) {
  screen.orientation.addEventListener("change", setScreen);
}

function getScaleRatio() {
  const screenHeight = Math.min(
    window.innerHeight,
    document.documentElement.clientHeight
  );

  const screenWidth = Math.min(
    window.innerWidth,
    document.documentElement.clientWidth
  );

  //window is wider than the game width
  let ratio;
  if (screenWidth / screenHeight < GAME_WIDTH / GAME_HEIGHT) {
    ratio = screenWidth / GAME_WIDTH;
  } else {
    ratio = screenHeight / GAME_HEIGHT;
  }
  const isPhone = window.innerWidth <= 700;
  return isPhone ? ratio : Math.min(1, ratio);

}

function showGameOver() {
  const fontSize = 70 * scaleRatio;
  ctx.font = `${fontSize}px Verdana`;
  ctx.fillStyle = "grey";
  const x = canvas.width / 4.5;
  const y = canvas.height / 2;
  ctx.fillText("GAME OVER", x, y);
}

function setupGameReset() {
  if (!hasAddedEventListenersForRestart) {
    hasAddedEventListenersForRestart = true;

    setTimeout(() => {
    const restartHandler = (e) => {
      // If user is typing their name, do NOT restart
      const active = document.activeElement;
      if (active && (active.id === "playerName" || active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
        return;
      }

      // Only restart on Space (prevents "A", "B", etc. from restarting)
      if (e.type === "keyup" && e.code !== "Space") return;

      reset();
    };

    window.addEventListener("keyup", restartHandler, { once: true });
    window.addEventListener("touchstart", restartHandler, { once: true });
  }, 1000);

  }
}

function reset() {
  hasAddedEventListenersForRestart = false;
  gameOver = false;
  waitingToStart = false;
  hideGameOverPanel();
  ground.reset();
  cactiController.reset();
  score.reset();
  gameSpeed = GAME_SPEED_START;
}

function showStartGameText() {
  const fontSize = 40 * scaleRatio;
  ctx.font = `${fontSize}px Verdana`;
  ctx.fillStyle = "grey";
  const x = canvas.width / 14;
  const y = canvas.height / 2;
  ctx.fillText("Tap Screen or Press Space To Start", x, y);
}

function updateGameSpeed(frameTimeDelta) {
  gameSpeed += frameTimeDelta * GAME_SPEED_INCREMENT;
}

function clearScreen() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop(currentTime) {
  if (previousTime === null) {
    previousTime = currentTime;
    requestAnimationFrame(gameLoop);
    return;
  }
  const frameTimeDelta = currentTime - previousTime;
  previousTime = currentTime;

  clearScreen();

  if (!gameOver && !waitingToStart) {
    //Update game objects
    ground.update(gameSpeed, frameTimeDelta);
    cactiController.update(gameSpeed, frameTimeDelta);
    player.update(gameSpeed, frameTimeDelta);
    score.update(frameTimeDelta);
    updateGameSpeed(frameTimeDelta);
  }

  if (!gameOver && cactiController.collideWith(player)) {
    gameOver = true;
    setupGameReset();
    score.setHighScore();
    showGameOverPanel();
  }

  //Draw game objects
  ground.draw();
  cactiController.draw();
  player.draw();
  score.draw();

  if (gameOver) {
    showGameOver();
  }

  if (waitingToStart) {
    showStartGameText();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

function isTypingInInput() {
  const active = document.activeElement;
  return !!active && (active.id === "playerName" || active.tagName === "INPUT" || active.tagName === "TEXTAREA");
}

function startIfWaiting(e) {
  // Don’t start/reset if user is typing a name
  if (isTypingInInput()) return;

  // Only start on Space for keyboard
  if (e.type === "keyup" && e.code !== "Space") return;

  // Start the game (do NOT reset score etc. unless you want that)
  waitingToStart = false;
}
window.addEventListener("keyup", startIfWaiting);
window.addEventListener("touchstart", startIfWaiting, { passive: true });


function finalScoreInt() {
  return Math.floor(score.score);
}

function onReady(fn) {
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

onReady(() => {
  // Submit score
  const form = document.getElementById("nameForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = (document.getElementById("playerName")?.value || "").trim();
      if (!name) return;

      const user = auth.currentUser;
      if (!user) {
        alert("Du må være logget inn for å sende inn score.");
        return;
      }

      const entry = { name, score: Number(finalScoreInt()), ts: Date.now() };
      await push(ref(db, "leaderboard"), entry);

      window.location.href = "leaderboard.html";
    });
  }

  // Play again button
  const playAgainBtn = document.getElementById("playAgainBtn");
  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", () => reset());
  }
});

