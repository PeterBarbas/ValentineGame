/**
 * ═══════════════════════════════════════════════════════════
 *  Rescue Your Valentine! – A single-level 2D platformer
 *  HTML5 Canvas + vanilla JS  ·  Valentine's Day Edition
 * ═══════════════════════════════════════════════════════════
 */

"use strict";

// ── Canvas & context ──────────────────────────────────────
const canvas  = document.getElementById("gameCanvas");
const ctx     = canvas.getContext("2d");

// Virtual (logical) resolution – all game logic uses these
const CW = 960;
const CH = 540;

// Resize canvas to fill window, compute uniform scale factor
let canvasScale = 1;
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  canvasScale = Math.min(winW / CW, winH / CH);
  const drawW = CW * canvasScale;
  const drawH = CH * canvasScale;
  canvas.width  = drawW * dpr;
  canvas.height = drawH * dpr;
  canvas.style.width  = drawW + "px";
  canvas.style.height = drawH + "px";
  ctx.setTransform(canvasScale * dpr, 0, 0, canvasScale * dpr, 0, 0);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ── DOM refs ──────────────────────────────────────────────
const winOverlay      = document.getElementById("win-overlay");
const playAgainBtn    = document.getElementById("play-again-btn");
const startOverlay    = document.getElementById("start-overlay");
const startBtn        = document.getElementById("start-btn");
const startFaces      = document.getElementById("start-faces");
const yesBtn          = document.getElementById("yes-btn");
const noBtn           = document.getElementById("no-btn");
const fireworksCanvas = document.getElementById("fireworksCanvas");
const fireworksCtx    = fireworksCanvas.getContext("2d");
const fireworksOverlay = document.getElementById("fireworks-overlay");

// ── Dodge "No" button ────────────────────────────────────
{
  let dodgeCount = 0;
  const dodge = () => {
    dodgeCount++;
    const parent = noBtn.parentElement;
    const rect = parent.getBoundingClientRect();
    // Random position within the modal bounds
    const maxX = rect.width - noBtn.offsetWidth - 10;
    const maxY = 120;
    const rx = Math.random() * maxX;
    const ry = -40 + Math.random() * maxY;
    noBtn.style.position = "absolute";
    noBtn.style.left = rx + "px";
    noBtn.style.top = ry + "px";
    // Shrink after a few dodges
    if (dodgeCount > 3) {
      const scale = Math.max(0.5, 1 - (dodgeCount - 3) * 0.1);
      noBtn.style.transform = `scale(${scale})`;
    }
    // Eventually disappear
    if (dodgeCount > 7) {
      noBtn.style.opacity = "0";
      noBtn.style.pointerEvents = "none";
    }
  };
  noBtn.addEventListener("mouseenter", dodge);
  noBtn.addEventListener("touchstart", (e) => { e.preventDefault(); dodge(); });
}

// ── Fireworks system ─────────────────────────────────────
const fireworks = {
  particles: [],
  rockets: [],
  running: false,
  animId: null,

  start() {
    this.running = true;
    this.particles = [];
    this.rockets = [];
    fireworksCanvas.classList.remove("hidden");
    fireworksOverlay.classList.remove("hidden");
    this.resize();
    this.scheduleRocket();
    this.loop();
  },

  stop() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    fireworksCanvas.classList.add("hidden");
    fireworksOverlay.classList.add("hidden");
  },

  resize() {
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
  },

  scheduleRocket() {
    if (!this.running) return;
    const delay = 200 + Math.random() * 600;
    setTimeout(() => {
      if (!this.running) return;
      this.launchRocket();
      this.scheduleRocket();
    }, delay);
  },

  launchRocket() {
    const x = fireworksCanvas.width * (0.15 + Math.random() * 0.7);
    const targetY = fireworksCanvas.height * (0.1 + Math.random() * 0.35);
    this.rockets.push({
      x, y: fireworksCanvas.height,
      targetY, speed: 400 + Math.random() * 300,
      hue: Math.random() * 360,
    });
  },

  explode(x, y, hue) {
    const count = 60 + Math.floor(Math.random() * 40);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = 80 + Math.random() * 200;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.6 + Math.random() * 0.8,
        hue: hue + (Math.random() - 0.5) * 30,
        size: 2 + Math.random() * 3,
      });
    }
  },

  loop() {
    if (!this.running) return;
    const dt = 1 / 60;
    const W = fireworksCanvas.width;
    const H = fireworksCanvas.height;
    fireworksCtx.clearRect(0, 0, W, H);

    // Update & draw rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.y -= r.speed * dt;
      // Trail
      fireworksCtx.fillStyle = `hsla(${r.hue}, 100%, 70%, 0.8)`;
      fireworksCtx.fillRect(r.x - 1.5, r.y, 3, 8);
      if (r.y <= r.targetY) {
        this.explode(r.x, r.y, r.hue);
        this.rockets.splice(i, 1);
      }
    }

    // Update & draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += 120 * dt; // gravity
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      fireworksCtx.globalAlpha = p.life;
      fireworksCtx.fillStyle = `hsl(${p.hue}, 100%, ${50 + p.life * 30}%)`;
      fireworksCtx.beginPath();
      fireworksCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      fireworksCtx.fill();
    }
    fireworksCtx.globalAlpha = 1;

    this.animId = requestAnimationFrame(() => this.loop());
  }
};

// Populate start screen with the two face images kissing
{
  // Floating hearts above the faces
  const heartEmojis = ["\u2764\uFE0F", "\uD83D\uDC95", "\uD83D\uDC96", "\u2764\uFE0F", "\uD83D\uDC97", "\uD83D\uDC93", "\uD83D\uDC95", "\uD83D\uDC96"];
  for (const emoji of heartEmojis) {
    const h = document.createElement("span");
    h.className = "start-heart";
    h.textContent = emoji;
    startFaces.appendChild(h);
  }

  const imgL = document.createElement("img");
  imgL.src = "player.png";
  imgL.alt = "Player";
  const heart = document.createElement("span");
  heart.className = "kiss-heart";
  heart.textContent = "\u2764\uFE0F";
  const imgR = document.createElement("img");
  imgR.src = "princess.jpg";
  imgR.alt = "Valentine";
  startFaces.append(imgL, heart, imgR);
}

// ── Constants ─────────────────────────────────────────────
const TILE           = 32;
const GRAVITY        = 1800;
const PLAYER_SPEED   = 280;
const JUMP_VELOCITY  = -800;
const COYOTE_TIME    = 0.08;
const JUMP_BUFFER    = 0.1;
const LEVEL_WIDTH    = 4800;
const GROUND_Y       = CH - TILE * 2;

// ── Preload face images ──────────────────────────────────
const playerFaceImg   = new Image();
playerFaceImg.src     = "player.png";
const princessFaceImg = new Image();
princessFaceImg.src   = "princess.jpg";

// ── Heart drawing helper ─────────────────────────────────
function drawHeart(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const s = size;
  ctx.moveTo(cx, cy + s * 0.3);
  ctx.bezierCurveTo(cx, cy - s * 0.2, cx - s * 0.6, cy - s * 0.4, cx - s * 0.6, cy);
  ctx.bezierCurveTo(cx - s * 0.6, cy + s * 0.4, cx, cy + s * 0.6, cx, cy + s * 0.8);
  ctx.bezierCurveTo(cx, cy + s * 0.6, cx + s * 0.6, cy + s * 0.4, cx + s * 0.6, cy);
  ctx.bezierCurveTo(cx + s * 0.6, cy - s * 0.4, cx, cy - s * 0.2, cx, cy + s * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draw an image clipped to a circle. */
function drawCircleFace(ctx, img, cx, cy, radius, flipped) {
  if (!img.complete || img.naturalWidth === 0) return false;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (flipped) {
    ctx.translate(cx, cy);
    ctx.scale(-1, 1);
    ctx.translate(-cx, -cy);
  }
  const aspect = img.naturalWidth / img.naturalHeight;
  let sw, sh, sxOff, syOff;
  if (aspect > 1) {
    sh = img.naturalHeight;
    sw = sh;
    sxOff = (img.naturalWidth - sw) / 2;
    syOff = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw;
    sxOff = 0;
    syOff = (img.naturalHeight - sh) * 0.3;
  }
  ctx.drawImage(img, sxOff, syOff, sw, sh,
                cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
  return true;
}

// ── Input state ───────────────────────────────────────────
const keys = {};
window.addEventListener("keydown", e => { keys[e.code] = true;  if (["Space","ArrowUp","ArrowDown"].includes(e.code)) e.preventDefault(); });
window.addEventListener("keyup",   e => { keys[e.code] = false; });

// ═══════════════════════════════════════════════════════════
//  FLOATING HEART PARTICLES
// ═══════════════════════════════════════════════════════════

class HeartParticles {
  constructor() {
    this.hearts = [];
    for (let i = 0; i < 35; i++) {
      this.hearts.push(this.spawn(Math.random() * LEVEL_WIDTH));
    }
  }

  spawn(x) {
    return {
      x: x,
      y: Math.random() * CH * 0.75,
      size: 6 + Math.random() * 12,
      speed: 15 + Math.random() * 25,
      drift: (Math.random() - 0.5) * 20,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.15 + Math.random() * 0.25,
      hue: Math.random() > 0.5 ? "#ff6b8a" : "#ff4d6d",
    };
  }

  update(dt) {
    for (const h of this.hearts) {
      h.y -= h.speed * dt;
      h.x += Math.sin(h.phase) * h.drift * dt;
      h.phase += dt * 1.5;
      if (h.y < -20) {
        Object.assign(h, this.spawn(h.x));
        h.y = CH + 10;
      }
    }
  }

  draw(ctx, cam) {
    for (const h of this.hearts) {
      const sx = h.x - cam * 0.6;
      ctx.globalAlpha = h.alpha;
      drawHeart(ctx, sx, h.y, h.size, h.hue);
    }
    ctx.globalAlpha = 1;
  }
}

// ═══════════════════════════════════════════════════════════
//  LEVEL DEFINITION
// ═══════════════════════════════════════════════════════════

class Level {
  constructor() {
    this.platforms = [];
    this.pits      = [];
    this.hazards   = [];
    this.princess  = null;
    this.build();
  }

  build() {
    this.pits = [
      { xStart: 640,  xEnd: 800  },
      { xStart: 1600, xEnd: 1760 },
      { xStart: 2800, xEnd: 2990 },
    ];

    let cursor = 0;
    for (const pit of this.pits) {
      if (pit.xStart > cursor) {
        this.platforms.push({
          x: cursor, y: GROUND_Y, w: pit.xStart - cursor, h: TILE * 2,
          color: "#c2607e"  // rose-pink ground
        });
      }
      cursor = pit.xEnd;
    }
    if (cursor < LEVEL_WIDTH) {
      this.platforms.push({
        x: cursor, y: GROUND_Y, w: LEVEL_WIDTH - cursor, h: TILE * 2,
        color: "#c2607e"
      });
    }

    const floats = [
      { x: 300,  y: 360, w: 160, h: 20 },
      { x: 680,  y: 340, w: 120, h: 20 },
      { x: 1100, y: 320, w: 180, h: 20 },
      { x: 1640, y: 330, w: 120, h: 20 },
      { x: 2100, y: 300, w: 200, h: 20 },
      { x: 2500, y: 350, w: 140, h: 20 },
      { x: 2850, y: 310, w: 140, h: 20 },
      { x: 3200, y: 360, w: 160, h: 20 },
      { x: 3600, y: 320, w: 140, h: 20 },
    ];
    for (const f of floats) {
      this.platforms.push({ ...f, color: "#d4829a" });
    }

    // Castle end-platform
    this.platforms.push({
      x: 4300, y: GROUND_Y - 96, w: 260, h: 96 + TILE * 2,
      color: "#b35580", isCastle: true
    });

    // Hazards (broken-heart enemies)
    this.hazards.push(new Hazard(440, GROUND_Y - 28, 28, 28, 440, 620, 120, true));
    this.hazards.push(new Hazard(2100, 300 - 28, 28, 28, 2100, 2270, 100, true));
    this.hazards.push(new Hazard(2600, GROUND_Y - 28, 28, 28, 2580, 2780, 140, true));

    this.princess = new Princess(4400, GROUND_Y - 96 - 48);
  }

  isOverPit(x, y, w, h) {
    const bottom = y + h;
    if (bottom < GROUND_Y + 4) return false;
    for (const pit of this.pits) {
      const inPit = x + w > pit.xStart && x < pit.xEnd;
      if (inPit && bottom >= CH) return true;
    }
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
//  HAZARD (broken heart enemies)
// ═══════════════════════════════════════════════════════════

class Hazard {
  constructor(x, y, w, h, minX, maxX, speed, horizontal) {
    this.x = x;  this.y = y;
    this.w = w;  this.h = h;
    this.minBound = minX;
    this.maxBound = maxX;
    this.speed    = speed;
    this.dir      = 1;
    this.horizontal = horizontal;
    this.phase = 0;
  }

  update(dt) {
    if (this.horizontal) {
      this.x += this.speed * this.dir * dt;
      if (this.x <= this.minBound)         { this.x = this.minBound; this.dir = 1;  }
      if (this.x + this.w >= this.maxBound) { this.x = this.maxBound - this.w; this.dir = -1; }
    } else {
      this.y += this.speed * this.dir * dt;
      if (this.y <= this.minBound)         { this.y = this.minBound; this.dir = 1;  }
      if (this.y + this.h >= this.maxBound) { this.y = this.maxBound - this.h; this.dir = -1; }
    }
    this.phase += dt * 3;
  }

  draw(ctx, cam) {
    const sx = this.x - cam;
    const sy = this.y;
    const cx = sx + this.w / 2;
    const cy = sy + this.h / 2;
    const pulse = 1 + Math.sin(this.phase * 2) * 0.1;

    // Draw a broken heart
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);

    // Left half (dark red)
    ctx.fillStyle = "#8b0000";
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(0, -4, -14, -12, -14, -2);
    ctx.bezierCurveTo(-14, 6, 0, 12, 0, 18);
    ctx.closePath();
    ctx.fill();

    // Right half (slightly offset — "broken")
    ctx.fillStyle = "#a00";
    ctx.beginPath();
    ctx.moveTo(2, 5);
    ctx.bezierCurveTo(2, -3, 16, -11, 16, -1);
    ctx.bezierCurveTo(16, 7, 2, 13, 2, 19);
    ctx.closePath();
    ctx.fill();

    // Crack line
    ctx.strokeStyle = "#300";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(2, 2);
    ctx.lineTo(-1, 8);
    ctx.lineTo(1, 16);
    ctx.stroke();

    ctx.restore();

    // Angry eyes
    const eyeY = sy + 8;
    ctx.fillStyle = "#ff0";
    ctx.fillRect(sx + 5, eyeY, 5, 4);
    ctx.fillRect(sx + this.w - 10, eyeY, 5, 4);
    ctx.fillStyle = "#000";
    ctx.fillRect(sx + 6 + (this.dir > 0 ? 1 : 0), eyeY + 1, 2, 2);
    ctx.fillRect(sx + this.w - 9 + (this.dir > 0 ? 1 : 0), eyeY + 1, 2, 2);
  }

  collides(rx, ry, rw, rh) {
    return rx < this.x + this.w &&
           rx + rw > this.x &&
           ry < this.y + this.h &&
           ry + rh > this.y;
  }
}

// ═══════════════════════════════════════════════════════════
//  PRINCESS
// ═══════════════════════════════════════════════════════════

class Princess {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 28;
    this.h = 48;
    this.bobPhase = 0;
  }

  update(dt) {
    this.bobPhase += dt * 2.5;
  }

  draw(ctx, cam) {
    const sx = this.x - cam;
    const bob = Math.sin(this.bobPhase) * 2;
    const sy = this.y + bob;

    // Dress (red Valentine dress)
    ctx.fillStyle = "#e63956";
    ctx.beginPath();
    ctx.moveTo(sx + 4,  sy + 16);
    ctx.lineTo(sx + this.w - 4, sy + 16);
    ctx.lineTo(sx + this.w + 2, sy + this.h);
    ctx.lineTo(sx - 2,  sy + this.h);
    ctx.closePath();
    ctx.fill();

    // Dress highlight
    ctx.fillStyle = "#ff6b8a";
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy + 20);
    ctx.lineTo(sx + this.w - 8, sy + 20);
    ctx.lineTo(sx + this.w - 4, sy + this.h - 4);
    ctx.lineTo(sx + 4, sy + this.h - 4);
    ctx.closePath();
    ctx.fill();

    // Small heart on dress
    drawHeart(ctx, sx + this.w / 2, sy + 30, 6, "#fff");

    // Bobblehead
    const headRadius = 30;
    const headCX = sx + this.w / 2;
    const headCY = sy - 8;
    const drawn = drawCircleFace(ctx, princessFaceImg, headCX, headCY, headRadius, false);
    if (!drawn) {
      ctx.fillStyle = "#ffe0bd";
      ctx.beginPath();
      ctx.arc(headCX, headCY, headRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Heart-shaped border via pink glow
    ctx.strokeStyle = "#ff4d6d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(headCX, headCY, headRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Crown with hearts instead of points
    const crownY = headCY - headRadius;
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(headCX - 12, crownY - 8, 24, 10);
    drawHeart(ctx, headCX - 8, crownY - 12, 7, "#ff4d6d");
    drawHeart(ctx, headCX,     crownY - 15, 8, "#e63946");
    drawHeart(ctx, headCX + 8, crownY - 12, 7, "#ff4d6d");
  }

  collides(rx, ry, rw, rh) {
    return rx < this.x + this.w &&
           rx + rw > this.x &&
           ry < this.y + this.h &&
           ry + rh > this.y;
  }
}

// ═══════════════════════════════════════════════════════════
//  PLAYER
// ═══════════════════════════════════════════════════════════

class Player {
  constructor(x, y) {
    this.spawnX = x;
    this.spawnY = y;
    this.reset();
  }

  reset() {
    this.x  = this.spawnX;
    this.y  = this.spawnY;
    this.w  = 26;
    this.h  = 36;
    this.vx = 0;
    this.vy = 0;
    this.onGround    = false;
    this.coyoteTimer = 0;
    this.jumpBuffer  = 0;
    this.facingRight  = true;
    this.walkPhase    = 0;
  }

  update(dt, level) {
    let moveDir = 0;
    if (keys["ArrowLeft"]  || keys["KeyA"]) moveDir -= 1;
    if (keys["ArrowRight"] || keys["KeyD"]) moveDir += 1;
    this.vx = moveDir * PLAYER_SPEED;
    if (moveDir !== 0) this.facingRight = moveDir > 0;
    if (moveDir !== 0 && this.onGround) this.walkPhase += dt * 12;

    const jumpPressed = keys["Space"] || keys["ArrowUp"] || keys["KeyW"];
    if (jumpPressed) {
      this.jumpBuffer = JUMP_BUFFER;
    } else {
      this.jumpBuffer -= dt;
    }

    if (this.onGround) {
      this.coyoteTimer = COYOTE_TIME;
    } else {
      this.coyoteTimer -= dt;
    }

    if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
      this.vy = JUMP_VELOCITY;
      this.jumpBuffer  = 0;
      this.coyoteTimer = 0;
      this.onGround    = false;
    }

    if (!jumpPressed && this.vy < 0) {
      this.vy *= 0.92;
    }

    this.vy += GRAVITY * dt;
    if (this.vy > 900) this.vy = 900;

    this.x += this.vx * dt;
    this.resolveCollisionsX(level);

    this.y += this.vy * dt;
    this.onGround = false;
    this.resolveCollisionsY(level);

    if (this.x < 0) this.x = 0;
    if (this.x + this.w > LEVEL_WIDTH) this.x = LEVEL_WIDTH - this.w;
  }

  resolveCollisionsX(level) {
    for (const p of level.platforms) {
      if (this.overlaps(p)) {
        if (this.vx > 0) this.x = p.x - this.w;
        else if (this.vx < 0) this.x = p.x + p.w;
        this.vx = 0;
      }
    }
  }

  resolveCollisionsY(level) {
    for (const p of level.platforms) {
      if (this.overlaps(p)) {
        if (this.vy > 0) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.onGround = true;
        } else if (this.vy < 0) {
          this.y = p.y + p.h;
          this.vy = 0;
        }
      }
    }
  }

  overlaps(rect) {
    return this.x < rect.x + rect.w &&
           this.x + this.w > rect.x &&
           this.y < rect.y + rect.h &&
           this.y + this.h > rect.y;
  }

  draw(ctx, cam) {
    const sx = this.x - cam;
    const sy = this.y;
    const bob = this.onGround ? Math.abs(Math.sin(this.walkPhase)) * 2 : 0;

    // Body (Valentine suit — dark red)
    ctx.fillStyle = "#8b1a2b";
    ctx.fillRect(sx, sy + 10 - bob, this.w, this.h - 10 + bob);

    // Shirt (white dress shirt)
    ctx.fillStyle = "#fff";
    ctx.fillRect(sx + 2, sy + 10 - bob, this.w - 4, 12);

    // Tiny heart on chest
    drawHeart(ctx, sx + this.w / 2, sy + 16 - bob, 5, "#e63946");

    // Bobblehead
    const headRadius = 28;
    const headCX = sx + this.w / 2;
    const headCY = sy - 10 - bob;
    const drawn = drawCircleFace(ctx, playerFaceImg, headCX, headCY, headRadius, !this.facingRight);
    if (!drawn) {
      ctx.fillStyle = "#ffe0bd";
      ctx.beginPath();
      ctx.arc(headCX, headCY, headRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#c44";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(headCX, headCY, headRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Feet
    ctx.fillStyle = "#4a1520";
    ctx.fillRect(sx + 1, sy + this.h + bob - 1, 9, 5);
    ctx.fillRect(sx + this.w - 10, sy + this.h + bob - 1, 9, 5);
  }
}

// ═══════════════════════════════════════════════════════════
//  DECORATIONS (Valentine-themed)
// ═══════════════════════════════════════════════════════════

class Decorations {
  constructor() {
    this.clouds = [];
    this.roses  = [];
    this.hills  = [];

    // Pink/white heart-shaped clouds
    for (let i = 0; i < 18; i++) {
      this.clouds.push({
        x: i * 300 + Math.random() * 150,
        y: 30 + Math.random() * 100,
        size: 20 + Math.random() * 25,
        isHeart: Math.random() > 0.4,
      });
    }
    // Rose bushes along the ground
    for (let i = 0; i < 25; i++) {
      this.roses.push({
        x: i * 200 + Math.random() * 120,
        y: GROUND_Y - 8 - Math.random() * 8,
        w: 30 + Math.random() * 40,
        h: 12 + Math.random() * 10,
        hasFlower: Math.random() > 0.3,
      });
    }
    // Soft rolling hills (parallax)
    for (let i = 0; i < 8; i++) {
      this.hills.push({
        x: i * 650 + Math.random() * 200,
        w: 250 + Math.random() * 150,
        h: 60 + Math.random() * 60,
      });
    }
  }

  draw(ctx, cam) {
    // Soft pink hills (parallax 0.3)
    ctx.fillStyle = "#e8a0b8";
    for (const h of this.hills) {
      const sx = h.x - cam * 0.3;
      ctx.beginPath();
      ctx.ellipse(sx + h.w / 2, GROUND_Y, h.w / 2, h.h, 0, Math.PI, 0);
      ctx.fill();
    }

    // Clouds — some are heart-shaped
    for (const c of this.clouds) {
      const sx = c.x - cam * 0.2;
      if (c.isHeart) {
        ctx.globalAlpha = 0.6;
        drawHeart(ctx, sx, c.y, c.size, "rgba(255,255,255,0.8)");
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = "rgba(255,230,240,0.7)";
        ctx.beginPath();
        ctx.ellipse(sx, c.y, c.size, c.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(sx + c.size * 0.6, c.y + 3, c.size * 0.7, c.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Rose bushes
    for (const r of this.roses) {
      const sx = r.x - cam;
      // Bush body
      ctx.fillStyle = "#6b8f3c";
      ctx.beginPath();
      ctx.ellipse(sx + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Rose flower on top
      if (r.hasFlower) {
        drawHeart(ctx, sx + r.w / 2, r.y - 2, 8, "#e63946");
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  UI (Valentine HUD)
// ═══════════════════════════════════════════════════════════

class UI {
  constructor() {
    this.deaths = 0;
    this.flashTimer = 0;
  }

  triggerFlash() {
    this.flashTimer = 0.6;
    this.deaths++;
  }

  update(dt) {
    if (this.flashTimer > 0) this.flashTimer -= dt;
  }

  draw(ctx) {
    // Death flash (pink tint)
    if (this.flashTimer > 0) {
      const alpha = Math.min(this.flashTimer / 0.3, 1);
      ctx.save();
      ctx.fillStyle = `rgba(180, 40, 80, ${alpha * 0.3})`;
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Heartbroken! Try again...", CW / 2, CH / 2 - 20);
      ctx.restore();
    }

    // HUD bar
    ctx.save();
    ctx.fillStyle = "rgba(120,20,50,0.6)";
    ctx.fillRect(8, 8, 310, 30);
    // Heart icon
    drawHeart(ctx, 24, 22, 10, "#ff4d6d");
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Find your Valentine!", 38, 28);
    ctx.fillStyle = "#ffb3c6";
    ctx.font = "14px sans-serif";
    ctx.fillText(`Heartbreaks: ${this.deaths}`, 210, 28);
    ctx.restore();

    // Controls hint
    ctx.save();
    ctx.fillStyle = "rgba(120,20,50,0.4)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Arrow keys / WASD to move  |  Space / Up / W to jump  |  R to restart", CW / 2, CH - 8);
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════
//  CASTLE DRAWING (Valentine tower)
// ═══════════════════════════════════════════════════════════

function drawCastle(ctx, cam) {
  const cx = 4300 - cam;
  const cy = GROUND_Y - 96;

  // Main tower (deep rose)
  ctx.fillStyle = "#9e4466";
  ctx.fillRect(cx, cy, 260, 96);

  // Lighter base
  ctx.fillStyle = "#7a3050";
  ctx.fillRect(cx, cy + 70, 260, 26);

  // Heart-shaped battlements
  for (let i = 0; i < 6; i++) {
    drawHeart(ctx, cx + 22 + i * 44, cy - 10, 16, "#e63946");
  }

  // Door (heart-shaped arch)
  ctx.fillStyle = "#4a1525";
  ctx.fillRect(cx + 105, cy + 40, 50, 56);
  // Heart arch above door
  drawHeart(ctx, cx + 130, cy + 30, 20, "#4a1525");

  // Heart windows (glowing)
  drawHeart(ctx, cx + 50,  cy + 32, 14, "#ffb3c6");
  drawHeart(ctx, cx + 210, cy + 32, 14, "#ffb3c6");

  // Flagpole with heart flag
  ctx.fillStyle = "#666";
  ctx.fillRect(cx + 128, cy - 50, 3, 40);
  drawHeart(ctx, cx + 140, cy - 42, 14, "#ff4d6d");
}

// ═══════════════════════════════════════════════════════════
//  GAME (main controller)
// ═══════════════════════════════════════════════════════════

class Game {
  constructor() {
    this.level       = new Level();
    this.player      = new Player(80, GROUND_Y - 36);
    this.decorations = new Decorations();
    this.hearts      = new HeartParticles();
    this.ui          = new UI();
    this.camera      = 0;
    this.won         = false;
    this.started     = false;

    this.fixedDt     = 1 / 120;
    this.accumulator = 0;
    this.lastTime    = performance.now();

    yesBtn.addEventListener("click", () => this.sayYes());
    playAgainBtn.addEventListener("click", () => this.restart());
    startBtn.addEventListener("click", () => this.start());

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  start() {
    this.started = true;
    startOverlay.classList.add("hidden");
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  restart() {
    fireworks.stop();
    this.player.reset();
    this.ui.deaths = 0;
    this.ui.flashTimer = 0;
    this.won = false;
    this.camera = 0;

    this.level.hazards = [];
    this.level.hazards.push(new Hazard(440, GROUND_Y - 28, 28, 28, 440, 620, 120, true));
    this.level.hazards.push(new Hazard(2100, 300 - 28, 28, 28, 2100, 2270, 100, true));
    this.level.hazards.push(new Hazard(2600, GROUND_Y - 28, 28, 28, 2580, 2780, 140, true));

    winOverlay.classList.add("hidden");
  }

  loop(now) {
    const frameDt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (this.started && !this.won) {
      if (keys["KeyR"]) {
        keys["KeyR"] = false;
        this.die();
      }

      this.accumulator += frameDt;
      while (this.accumulator >= this.fixedDt) {
        this.fixedUpdate(this.fixedDt);
        this.accumulator -= this.fixedDt;
      }
    }

    this.hearts.update(frameDt);
    this.ui.update(frameDt);
    this.updateCamera();
    this.draw();
    requestAnimationFrame(this.loop);
  }

  fixedUpdate(dt) {
    this.player.update(dt, this.level);
    for (const h of this.level.hazards) h.update(dt);
    this.level.princess.update(dt);

    if (this.player.y > CH + 60) {
      this.die();
      return;
    }

    for (const h of this.level.hazards) {
      if (h.collides(this.player.x, this.player.y, this.player.w, this.player.h)) {
        this.die();
        return;
      }
    }

    if (this.level.princess.collides(this.player.x, this.player.y, this.player.w, this.player.h)) {
      this.win();
    }
  }

  die() {
    this.player.reset();
    this.ui.triggerFlash();
  }

  win() {
    this.won = true;
    // Reset the No button state
    noBtn.style.position = "";
    noBtn.style.left = "";
    noBtn.style.top = "";
    noBtn.style.transform = "";
    noBtn.style.opacity = "";
    noBtn.style.pointerEvents = "";
    winOverlay.classList.remove("hidden");
  }

  sayYes() {
    winOverlay.classList.add("hidden");
    fireworks.resize();
    fireworks.start();
  }

  updateCamera() {
    const targetCam = this.player.x - CW / 3;
    this.camera += (targetCam - this.camera) * 0.1;
    if (this.camera < 0) this.camera = 0;
    if (this.camera > LEVEL_WIDTH - CW) this.camera = LEVEL_WIDTH - CW;
  }

  draw() {
    const cam = this.camera;

    // Valentine sky gradient (pink → rose → warm)
    const grad = ctx.createLinearGradient(0, 0, 0, CH);
    grad.addColorStop(0,   "#2b0a1e");
    grad.addColorStop(0.3, "#5c1a3a");
    grad.addColorStop(0.6, "#c44a6e");
    grad.addColorStop(1,   "#f4a0b8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);

    // Decorations
    this.decorations.draw(ctx, cam);

    // Floating hearts
    this.hearts.draw(ctx, cam);

    // Platforms
    for (const p of this.level.platforms) {
      const sx = p.x - cam;
      if (sx + p.w < -50 || sx > CW + 50) continue;

      if (p.isCastle) {
        drawCastle(ctx, cam);
      } else if (p.h <= 20) {
        // Floating platform (pink with hearts)
        ctx.fillStyle = p.color;
        ctx.fillRect(sx, p.y, p.w, p.h);
        ctx.fillStyle = "#e8a0b8";
        ctx.fillRect(sx, p.y, p.w, 4);
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(sx, p.y + p.h - 3, p.w, 3);
        // Tiny heart decoration on platform
        drawHeart(ctx, sx + p.w / 2, p.y - 3, 5, "rgba(255,77,109,0.5)");
      } else {
        // Ground — rose garden top
        ctx.fillStyle = "#d4607e";
        ctx.fillRect(sx, p.y, p.w, 6);
        ctx.fillStyle = p.color;
        ctx.fillRect(sx, p.y + 6, p.w, p.h - 6);
        // Heart pattern in ground
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        for (let tx = 0; tx < p.w; tx += TILE * 2) {
          drawHeart(ctx, sx + tx + TILE, p.y + TILE, 10, "rgba(255,255,255,0.04)");
        }
      }
    }

    // Pits (dark with broken heart warning)
    for (const pit of this.level.pits) {
      const sx = pit.xStart - cam;
      const pw = pit.xEnd - pit.xStart;
      ctx.fillStyle = "#1a0a12";
      ctx.fillRect(sx, GROUND_Y, pw, CH - GROUND_Y);
      // Warning hearts along edge
      ctx.fillStyle = "#8b0000";
      ctx.fillRect(sx, GROUND_Y - 2, pw, 3);
      for (let hx = 0; hx < pw; hx += 30) {
        drawHeart(ctx, sx + hx + 15, GROUND_Y - 4, 6, "#8b0000");
      }
    }

    // Hazards
    for (const h of this.level.hazards) h.draw(ctx, cam);

    // Princess
    this.level.princess.draw(ctx, cam);

    // Player
    this.player.draw(ctx, cam);

    // HUD
    this.ui.draw(ctx);
  }
}

// ═══════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════

const game = new Game();
