(function () {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = 640;
  const H = 300;
  canvas.width = W;
  canvas.height = H;

  const BUGS = ['🐛', '🐞', '🦗', '🕷️'];

  // State
  let state = 'idle';
  let score, lives, bugs, frame, animId;

  // Player
  const player = { x: W / 2, w: 80, h: 12, y: H - 28, speed: 7 };
  const keys = { left: false, right: false };

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keys.left  = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === ' ') {
      // Only prevent scroll when game section is visible
      const section = document.getElementById('game');
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) e.preventDefault();
      if (state !== 'playing') startGame();
    }
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keys.left  = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  });

  // Mobile buttons
  function bindBtn(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', e => { e.preventDefault(); keys[key] = true; }, { passive: false });
    el.addEventListener('touchend',   e => { e.preventDefault(); keys[key] = false; }, { passive: false });
    el.addEventListener('mousedown',  () => keys[key] = true);
    el.addEventListener('mouseup',    () => keys[key] = false);
    el.addEventListener('mouseleave', () => keys[key] = false);
  }
  bindBtn('btn-left',  'left');
  bindBtn('btn-right', 'right');

  // Tap or click canvas to start
  canvas.addEventListener('click',    () => { if (state !== 'playing') startGame(); });
  canvas.addEventListener('touchend', e => { e.preventDefault(); if (state !== 'playing') startGame(); }, { passive: false });

  function startGame() {
    score = 0;
    lives = 3;
    bugs  = [];
    frame = 0;
    state = 'playing';
    player.x = W / 2;
    setScore(0);
    setLives(3);
    document.getElementById('game-hint').style.visibility = 'hidden';
    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  function loop() {
    frame++;

    // Move player
    if (keys.left)  player.x = Math.max(player.w / 2,     player.x - player.speed);
    if (keys.right) player.x = Math.min(W - player.w / 2, player.x + player.speed);

    // Spawn rate decreases as score grows (faster spawning)
    const interval = Math.max(50 - Math.floor(score / 3), 18);
    if (frame % interval === 0) spawnBug();

    // Update bugs
    const surviving = [];
    for (const bug of bugs) {
      bug.y += bug.speed;

      const px = player.x - player.w / 2;
      const caught =
        bug.y + 14 >= player.y &&
        bug.y - 14 <= player.y + player.h &&
        bug.x + 14 >= px &&
        bug.x - 14 <= px + player.w;

      if (caught) {
        score++;
        setScore(score);
        spawnCatchEffect(bug.x, bug.y);
        continue;
      }

      if (bug.y > H + 20) {
        lives--;
        setLives(lives);
        if (lives <= 0) { gameOver(); return; }
        continue;
      }

      surviving.push(bug);
    }
    bugs = surviving;

    draw();
    animId = requestAnimationFrame(loop);
  }

  // Catch effects (small flashes)
  const effects = [];
  function spawnCatchEffect(x, y) {
    effects.push({ x, y, life: 1 });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = 40; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 40; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Catch effects
    for (let i = effects.length - 1; i >= 0; i--) {
      const ef = effects[i];
      ctx.save();
      ctx.globalAlpha = ef.life;
      ctx.fillStyle = '#a78bfa';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+1', ef.x, ef.y - (1 - ef.life) * 24);
      ctx.restore();
      ef.life -= 0.06;
      if (ef.life <= 0) effects.splice(i, 1);
    }

    // Player bar
    ctx.save();
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur = 18;
    const grad = ctx.createLinearGradient(player.x - player.w / 2, 0, player.x + player.w / 2, 0);
    grad.addColorStop(0, '#7c3aed');
    grad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = grad;
    roundRect(ctx, player.x - player.w / 2, player.y, player.w, player.h, 6);
    ctx.fill();
    ctx.restore();

    // Bugs
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const bug of bugs) {
      ctx.fillText(bug.emoji, bug.x, bug.y);
    }

    // Idle overlay
    if (state === 'idle') {
      drawOverlay('🐛  Debug Mode', 'Press Space or tap to start');
    }
  }

  function gameOver() {
    state = 'gameover';
    cancelAnimationFrame(animId);
    draw();

    ctx.fillStyle = 'rgba(8, 8, 8, 0.78)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#f0f0f0';
    ctx.font = 'bold 2rem Inter, sans-serif';
    ctx.fillText('Shipped to Production 💀', W / 2, H / 2 - 34);

    ctx.fillStyle = '#a78bfa';
    ctx.font = '600 1.1rem Inter, sans-serif';
    ctx.fillText(`Bugs caught: ${score}`, W / 2, H / 2 + 8);

    ctx.fillStyle = '#666';
    ctx.font = '0.88rem Inter, sans-serif';
    ctx.fillText('Press Space or tap to try again', W / 2, H / 2 + 44);

    const hint = document.getElementById('game-hint');
    hint.textContent = 'Press Space to try again';
    hint.style.visibility = 'visible';
  }

  function drawOverlay(title, sub) {
    ctx.fillStyle = 'rgba(8, 8, 8, 0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f0f0f0';
    ctx.font = 'bold 1.9rem Inter, sans-serif';
    ctx.fillText(title, W / 2, H / 2 - 18);
    ctx.fillStyle = '#666';
    ctx.font = '0.9rem Inter, sans-serif';
    ctx.fillText(sub, W / 2, H / 2 + 18);
  }

  function spawnBug() {
    bugs.push({
      x: 20 + Math.random() * (W - 40),
      y: -22,
      speed: 1.6 + score * 0.035 + Math.random() * 1.2,
      emoji: BUGS[Math.floor(Math.random() * BUGS.length)]
    });
  }

  function setScore(n) {
    document.getElementById('game-score').textContent = n;
  }

  function setLives(n) {
    document.getElementById('game-lives').textContent =
      '♥ '.repeat(Math.max(n, 0)).trim() || '—';
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Draw idle screen on load
  draw();
})();
