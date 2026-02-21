const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const restartBtn = document.getElementById('restart');

const state = {
  gravity: 0.34,
  flap: -6.2,
  speed: 2.15,
  gap: 160,
  pipeDistance: 240,
  bird: {
    x: 100,
    y: canvas.height / 2,
    w: 34,
    h: 24,
    vy: 0,
    tilt: 0,
  },
  pipes: [],
  score: 0,
  best: Number(localStorage.getItem('flappyBest') || 0),
  running: true,
  started: false,
  gameOver: false,
};

bestEl.textContent = String(state.best);

function randomPipeY() {
  const margin = 70;
  const maxTop = canvas.height - state.gap - margin;
  return Math.floor(Math.random() * (maxTop - margin + 1)) + margin;
}

function spawnPipe(x) {
  state.pipes.push({
    x,
    top: randomPipeY(),
    w: 62,
    passed: false,
  });
}

function reset() {
  state.bird.y = canvas.height / 2;
  state.bird.vy = 0;
  state.bird.tilt = 0;
  state.pipes = [];
  state.score = 0;
  state.started = false;
  state.gameOver = false;
  scoreEl.textContent = '0';

  const firstX = canvas.width + 80;
  spawnPipe(firstX);
  spawnPipe(firstX + state.pipeDistance);
}

function flap() {
  if (state.gameOver) return;
  state.started = true;
  state.bird.vy = state.flap;
}

function update() {
  if (!state.running) return;

  if (state.started && !state.gameOver) {
    state.bird.vy += state.gravity;
    state.bird.y += state.bird.vy;
    state.bird.tilt = Math.max(-0.45, Math.min(1.2, state.bird.vy * 0.08));

    for (const pipe of state.pipes) {
      pipe.x -= state.speed;

      const inX = state.bird.x + state.bird.w > pipe.x && state.bird.x < pipe.x + pipe.w;
      const hitTop = state.bird.y < pipe.top;
      const hitBottom = state.bird.y + state.bird.h > pipe.top + state.gap;

      if (inX && (hitTop || hitBottom)) {
        state.gameOver = true;
      }

      if (!pipe.passed && pipe.x + pipe.w < state.bird.x) {
        pipe.passed = true;
        state.score += 1;
        scoreEl.textContent = String(state.score);
      }
    }

    state.pipes = state.pipes.filter((pipe) => pipe.x + pipe.w > -20);

    if (state.pipes.length && state.pipes[state.pipes.length - 1].x < canvas.width - state.pipeDistance) {
      spawnPipe(canvas.width + 40);
    }

    if (state.bird.y + state.bird.h >= canvas.height - 2 || state.bird.y <= 0) {
      state.gameOver = true;
    }

    if (state.gameOver) {
      state.best = Math.max(state.best, state.score);
      localStorage.setItem('flappyBest', String(state.best));
      bestEl.textContent = String(state.best);
    }
  }
}

function drawBird() {
  const { x, y, w, h, tilt } = state.bird;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(tilt);

  ctx.fillStyle = '#ffd84d';
  ctx.strokeStyle = '#ae7e00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ff8e42';
  ctx.beginPath();
  ctx.moveTo(w / 2 - 2, -3);
  ctx.lineTo(w / 2 + 12, 2);
  ctx.lineTo(w / 2 - 2, 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(5, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPipe(pipe) {
  const bottomY = pipe.top + state.gap;

  ctx.fillStyle = '#2f9f44';
  ctx.strokeStyle = '#1f6f2d';
  ctx.lineWidth = 2;

  ctx.fillRect(pipe.x, 0, pipe.w, pipe.top);
  ctx.strokeRect(pipe.x, 0, pipe.w, pipe.top);

  ctx.fillRect(pipe.x - 6, pipe.top - 16, pipe.w + 12, 16);
  ctx.strokeRect(pipe.x - 6, pipe.top - 16, pipe.w + 12, 16);

  const bottomH = canvas.height - bottomY;
  ctx.fillRect(pipe.x, bottomY, pipe.w, bottomH);
  ctx.strokeRect(pipe.x, bottomY, pipe.w, bottomH);

  ctx.fillRect(pipe.x - 6, bottomY, pipe.w + 12, 16);
  ctx.strokeRect(pipe.x - 6, bottomY, pipe.w + 12, 16);
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for (let i = 0; i < 5; i += 1) {
    const y = 50 + i * 40;
    ctx.fillRect(20 + i * 75, y, 50, 8);
  }

  for (const pipe of state.pipes) drawPipe(pipe);
  drawBird();

  if (!state.started && !state.gameOver) {
    drawBanner('Tap Space / Click to start');
  }

  if (state.gameOver) {
    drawBanner('Game Over - Press Restart');
  }
}

function drawBanner(text) {
  const w = 300;
  const h = 52;
  const x = (canvas.width - w) / 2;
  const y = 90;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, y + 33);
}

function loop() {
  update();
  drawScene();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    flap();
  }
});

canvas.addEventListener('pointerdown', flap);
restartBtn.addEventListener('click', reset);

reset();
loop();
