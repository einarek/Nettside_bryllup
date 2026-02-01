export default class Score {
  score = 0;
  HIGH_SCORE_KEY = "highScore";

  constructor(ctx, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.scaleRatio = scaleRatio;
  }

  update(frameTimeDelta) {
    this.score += frameTimeDelta * 0.01;
  }

  reset() {
    this.score = 0;
  }

  setHighScore() {
    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    if (this.score > highScore) {
      localStorage.setItem(this.HIGH_SCORE_KEY, Math.floor(this.score));
    }
  }

  draw() {
    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY)) || 0;

    const fontSize = 20 * this.scaleRatio;
    this.ctx.font = `${fontSize}px serif`;
    this.ctx.fillStyle = "#525250";

    const y = 24 * this.scaleRatio;
    const padding = 12 * this.scaleRatio;

    const scorePadded = Math.floor(this.score).toString().padStart(6, "0");
    const highScorePadded = highScore.toString().padStart(6, "0");
    const hiText = `HI ${highScorePadded}`;

    // Measure widths so we can place text safely inside the canvas
    const scoreW = this.ctx.measureText(scorePadded).width;
    const hiW = this.ctx.measureText(hiText).width;

    // Right-align score with padding
    const scoreX = this.canvas.width - padding - scoreW;

    // Put HI to the left of the score with some gap
    const gap = 14 * this.scaleRatio;
    const hiX = Math.max(padding, scoreX - gap - hiW);

    this.ctx.fillText(hiText, hiX, y);
    this.ctx.fillText(scorePadded, scoreX, y);
  }

}
