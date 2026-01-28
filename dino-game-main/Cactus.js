export default class Cactus {
  constructor(ctx, x, y, width, height, image) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;
  }

  update(speed, gameSpeed, frameTimeDelta, scaleRatio) {
    this.x -= speed * gameSpeed * frameTimeDelta * scaleRatio;
  }

  draw() {
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  collideWith(sprite) {
    const adjustBy = 1.4;

    const spriteLeft = sprite.x;
    const spriteRight = sprite.x + sprite.width / adjustBy;
    const spriteTop = sprite.y;
    const spriteBottom = sprite.y + sprite.height / adjustBy;

    const cactusLeft = this.x;
    const cactusRight = this.x + this.width / adjustBy;
    const cactusTop = this.y;
    const cactusBottom = this.y + this.height / adjustBy;

    return (
      spriteLeft < cactusRight &&
      spriteRight > cactusLeft &&
      spriteTop < cactusBottom &&
      spriteBottom > cactusTop
    );
  }

}
