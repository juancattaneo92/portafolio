(function () {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const BUGS = ['🐛', '🐞', '🦗', '🕷️'];

  // Dynamic dimensions — recalculated on resize
  let W, H, bugFont, playerW, playerH, playerSpeed, playerY;

  function resizeCanvas() {
    W = Math.floor(canvas.getBoundingClientRect().width);
    H = Math.floor(W * (300 / 640));
    canvas.width  = W;
    canvas.height = H;

    // Scale all game elements to canvas size
    bugFont     = Math.max(28, Math.floor(W * 0.055));
    playerW     = Math.max(70, Math.floor(W * 0.18));
    playerH     = Math.max(10, Math.floor(H * 0.042));
    playerSpeed = Math.max(6,  Math.floor(W * 0.018));
    playerY     = H - Math.floor(H * 0.12);

    player.w     = playerW;
    player.h     = playerH;
    player.y     = playerY;
    player.speed = playerSpeed;
    if (!player.x || player.x > W) player.x = W / 2;
  }

  // State
  let state = 'idle';
  let score, lives, bugs, frame, animId;
  let totalCaught = 0;
  const effects = [];

  const cta = '— <em>drop me a message and let me know your score!</em>';

  function bugMessages(n) {
    if (n === 0)  return `Haven't played yet? Go catch some bugs —<br>Come back and let me know your score!`;
    if (n < 5)    return `<strong>${n} bug${n > 1 ? 's' : ''} caught.</strong> Still in QA. Keep going ${cta}`;
    if (n < 15)   return `<strong>${n} bugs caught.</strong> Getting warmer. PR almost ready ${cta}`;
    if (n < 30)   return `<strong>${n} bugs caught.</strong> Merge approved ✅ ${cta}`;
    if (n < 50)   return `<strong>${n} bugs caught.</strong> You ship clean code 🚀 ${cta}`;
    if (n < 80)   return `<strong>${n} bugs caught.</strong> Senior engineer behavior 👀 ${cta}`;
    return        `<strong>${n} bugs caught.</strong> Are you even human? 🤖 ${cta}`;
  }

  function updateBugScoreCard() {
    const el   = document.getElementById('bug-score-text');
    const card = document.getElementById('bug-score-card');
    const btn  = document.getElementById('bug-score-btn');
    if (!el) return;
    el.innerHTML = bugMessages(totalCaught);
    if (totalCaught > 0) {
      card.classList.add('has-score');
      if (btn) btn.style.display = 'none'; // hide "Play now" once they've played
    }
  }

  // Player
  const player = { x: 0, w: 0, h: 0, y: 0, speed: 0 };
  const keys = { left: false, right: false };

  // Initial size
  resizeCanvas();

  // Re-size on window resize
  window.addEventListener('resize', () => {
    resizeCanvas();
    if (state === 'idle') draw();
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keys.left  = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === ' ') {
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

    const press = (e) => {
      e.preventDefault();
      e.stopPropagation();
      keys[key] = true;
      el.classList.add('pressed');
      if (state !== 'playing') startGame();
    };
    const release = (e) => {
      e.preventDefault();
      e.stopPropagation();
      keys[key] = false;
      el.classList.remove('pressed');
    };

    el.addEventListener('touchstart',  press,   { passive: false });
    el.addEventListener('touchend',    release, { passive: false });
    el.addEventListener('touchcancel', release, { passive: false });
    el.addEventListener('mousedown',   press);
    el.addEventListener('mouseup',     release);
    el.addEventListener('mouseleave',  release);
  }
  bindBtn('btn-left',  'left');
  bindBtn('btn-right', 'right');

  // Tap / click canvas to start
  canvas.addEventListener('click',    () => { if (state !== 'playing') startGame(); });
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (state !== 'playing') startGame();
  }, { passive: false });

  function startGame() {
    score  = 0;
    lives  = 3;
    bugs   = [];
    frame  = 0;
    state  = 'playing';
    player.x = W / 2;
    effects.length = 0;
    setScore(0);
    setLives(3);
    document.getElementById('game-hint').style.visibility = 'hidden';
    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  function loop() {
    frame++;

    if (keys.left)  player.x = Math.max(player.w / 2,     player.x - player.speed);
    if (keys.right) player.x = Math.min(W - player.w / 2, player.x + player.speed);

    // Spawn interval shortens as score climbs
    const interval = Math.max(50 - Math.floor(score / 3), 18);
    if (frame % interval === 0) spawnBug();

    // Update bugs
    const surviving = [];
    for (const bug of bugs) {
      bug.y += bug.speed;

      const px = player.x - player.w / 2;
      const caught =
        bug.y + bugFont * 0.6 >= player.y &&
        bug.y - bugFont * 0.6 <= player.y + player.h &&
        bug.x + bugFont * 0.6 >= px &&
        bug.x - bugFont * 0.6 <= px + player.w;

      if (caught) {
        score++;
        totalCaught++;
        setScore(score);
        updateBugScoreCard();
        effects.push({ x: bug.x, y: bug.y, life: 1 });
        continue;
      }

      if (bug.y > H + bugFont) {
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

  function spawnBug() {
    const margin = bugFont;
    bugs.push({
      x:     margin + Math.random() * (W - margin * 2),
      y:     -bugFont,
      speed: Math.max(1.5, 1.2 + score * 0.035 + Math.random() * 1.4),
      emoji: BUGS[Math.floor(Math.random() * BUGS.length)]
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Subtle grid
    const gridStep = Math.floor(W / 16);
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = gridStep; x < W; x += gridStep) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = gridStep; y < H; y += gridStep) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // +1 catch effects
    for (let i = effects.length - 1; i >= 0; i--) {
      const ef = effects[i];
      ctx.save();
      ctx.globalAlpha = ef.life;
      ctx.fillStyle = '#a78bfa';
      ctx.font = `bold ${Math.floor(bugFont * 0.6)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('+1', ef.x, ef.y - (1 - ef.life) * 28);
      ctx.restore();
      ef.life -= 0.055;
      if (ef.life <= 0) effects.splice(i, 1);
    }

    // Player bar
    ctx.save();
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur  = Math.floor(playerW * 0.2);
    const grad = ctx.createLinearGradient(player.x - player.w / 2, 0, player.x + player.w / 2, 0);
    grad.addColorStop(0, '#7c3aed');
    grad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = grad;
    roundRect(ctx, player.x - player.w / 2, player.y, player.w, player.h, player.h / 2);
    ctx.fill();
    ctx.restore();

    // Bugs
    ctx.font = `${bugFont}px serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    for (const bug of bugs) {
      ctx.fillText(bug.emoji, bug.x, bug.y);
    }

    if (state === 'idle') drawOverlay('🐛  Debug Mode', 'Tap or press Space to start');
  }

  function gameOver() {
    state = 'gameover';
    cancelAnimationFrame(animId);
    draw();

    ctx.fillStyle = 'rgba(8,8,8,0.78)';
    ctx.fillRect(0, 0, W, H);

    const titleSize = Math.max(18, Math.floor(W * 0.045));
    const subSize   = Math.max(13, Math.floor(W * 0.028));

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#f0f0f0';
    ctx.font = `bold ${titleSize}px Inter, sans-serif`;
    ctx.fillText('Shipped to Production 💀', W / 2, H / 2 - titleSize * 1.4);

    ctx.fillStyle = '#a78bfa';
    ctx.font = `${subSize * 1.1}px Inter, sans-serif`;
    ctx.fillText(`Bugs caught: ${score}`, W / 2, H / 2 + subSize * 0.2);

    ctx.fillStyle = '#666';
    ctx.font = `${subSize}px Inter, sans-serif`;
    ctx.fillText('Tap or press Space to try again', W / 2, H / 2 + subSize * 2.2);

    const hint = document.getElementById('game-hint');
    hint.textContent = 'Press Space to try again';
    hint.style.visibility = 'visible';
  }

  function drawOverlay(title, sub) {
    ctx.fillStyle = 'rgba(8,8,8,0.72)';
    ctx.fillRect(0, 0, W, H);

    const titleSize = Math.max(18, Math.floor(W * 0.042));
    const subSize   = Math.max(12, Math.floor(W * 0.025));

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f0f0f0';
    ctx.font = `bold ${titleSize}px Inter, sans-serif`;
    ctx.fillText(title, W / 2, H / 2 - titleSize);
    ctx.fillStyle = '#666';
    ctx.font = `${subSize}px Inter, sans-serif`;
    ctx.fillText(sub, W / 2, H / 2 + subSize * 0.4);
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

  // Draw initial idle screen
  draw();
})();
