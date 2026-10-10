/* ============================================
   V3 首屏粒子交互 - 多彩几何粒子场
   ============================================ */

(function() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let mouse = { x: -9999, y: -9999, active: false };
  let clickRipple = null;
  let wordParticles = [];
  let currentWord = null;
  let animId;

  // 多彩几何配色
  const colors = [
    '#4361EE', '#FF6B35', '#06D6A0', '#7B2CBF',
    '#F72585', '#FFD166', '#00B4D8', '#EF476F'
  ];

  const words = ['创造', '探索', '连接', '想象', '实现', '玩'];

  function resize() {
    width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * (canvas.offsetHeight);
    }

    reset() {
      this.x = Math.random() * canvas.offsetWidth;
      this.y = Math.random() * canvas.offsetHeight;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.size = Math.random() * 4 + 2;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.shape = Math.random() > 0.5 ? 'circle' : 'square';
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.02;
      this.baseX = this.x;
      this.baseY = this.y;
    }

    update() {
      // 鼠标交互
      if (mouse.active) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 150;

        if (dist < maxDist && dist > 0) {
          const force = (maxDist - dist) / maxDist;
          const angle = Math.atan2(dy, dx);
          this.vx += Math.cos(angle) * force * 0.8;
          this.vy += Math.sin(angle) * force * 0.8;
        }
      }

      // 点击涟漪
      if (clickRipple) {
        const dx = this.x - clickRipple.x;
        const dy = this.y - clickRipple.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs(dist - clickRipple.radius) < 30) {
          const angle = Math.atan2(dy, dx);
          this.vx += Math.cos(angle) * 3;
          this.vy += Math.sin(angle) * 3;
        }
      }

      // 速度衰减
      this.vx *= 0.96;
      this.vy *= 0.96;

      // 基础漂移
      this.vx += (Math.random() - 0.5) * 0.05;
      this.vy += (Math.random() - 0.5) * 0.05;

      // 限制速度
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 3) {
        this.vx = (this.vx / speed) * 3;
        this.vy = (this.vy / speed) * 3;
      }

      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotSpeed;

      // 边界
      if (this.x < -20) this.x = canvas.offsetWidth + 20;
      if (this.x > canvas.offsetWidth + 20) this.x = -20;
      if (this.y < -20) this.y = canvas.offsetHeight + 20;
      if (this.y > canvas.offsetHeight + 20) this.y = -20;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.7;

      if (this.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
      }
      ctx.restore();
    }
  }

  // 文字粒子（点击时显示词）
  class WordParticle {
    constructor(x, y, targetX, targetY, color) {
      this.x = x;
      this.y = y;
      this.targetX = targetX;
      this.targetY = targetY;
      this.vx = (Math.random() - 0.5) * 10;
      this.vy = (Math.random() - 0.5) * 10;
      this.size = Math.random() * 3 + 2;
      this.color = color;
      this.life = 1;
      this.phase = 'explode'; // explode -> gather -> hold -> fade
      this.holdTimer = 0;
    }

    update() {
      if (this.phase === 'explode') {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        if (Math.abs(this.vx) < 0.5 && Math.abs(this.vy) < 0.5) {
          this.phase = 'gather';
        }
      } else if (this.phase === 'gather') {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        this.x += dx * 0.08;
        this.y += dy * 0.08;
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
          this.phase = 'hold';
        }
      } else if (this.phase === 'hold') {
        this.holdTimer++;
        this.x += (Math.random() - 0.5) * 0.5;
        this.y += (Math.random() - 0.5) * 0.5;
        if (this.holdTimer > 120) {
          this.phase = 'fade';
        }
      } else if (this.phase === 'fade') {
        this.life -= 0.015;
        this.y -= 0.5;
      }
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.life * 0.9;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function init() {
    resize();
    const count = window.innerWidth < 768 ? 80 : 180;
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    // 粒子间连线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / 100) * 0.15;
          ctx.strokeStyle = particles[i].color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    gradient.addColorStop(0, '#f8f9ff');
    gradient.addColorStop(0.5, '#fff8f5');
    gradient.addColorStop(1, '#f5fffb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    drawConnections();

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    // 文字粒子
    wordParticles = wordParticles.filter(wp => wp.life > 0);
    wordParticles.forEach(wp => {
      wp.update();
      wp.draw();
    });

    // 点击涟漪
    if (clickRipple) {
      clickRipple.radius += 8;
      ctx.save();
      ctx.globalAlpha = 1 - clickRipple.radius / 300;
      ctx.strokeStyle = clickRipple.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(clickRipple.x, clickRipple.y, clickRipple.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (clickRipple.radius > 300) clickRipple = null;
    }

    animId = requestAnimationFrame(animate);
  }

  function spawnWord(x, y, word) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const fontSize = 80;
    const charWidth = fontSize * 0.8;
    const startX = x - (word.length * charWidth) / 2;
    const startY = y - fontSize / 2;

    // 为每个字生成粒子
    for (let ci = 0; ci < word.length; ci++) {
      const charTargetX = startX + ci * charWidth + charWidth / 2;
      const charTargetY = startY + fontSize / 2;
      for (let i = 0; i < 25; i++) {
        const tx = charTargetX + (Math.random() - 0.5) * charWidth * 0.8;
        const ty = charTargetY + (Math.random() - 0.5) * fontSize * 0.8;
        wordParticles.push(new WordParticle(x, y, tx, ty, color));
      }
    }
  }

  // 事件
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const color = colors[Math.floor(Math.random() * colors.length)];
    clickRipple = { x, y, radius: 0, color };
    const word = words[Math.floor(Math.random() * words.length)];
    spawnWord(x, y, word);
  });

  // 触摸支持
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - rect.left;
    mouse.y = e.touches[0].clientY - rect.top;
    mouse.active = true;
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    mouse.active = false;
    const rect = canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const color = colors[Math.floor(Math.random() * colors.length)];
    clickRipple = { x, y, radius: 0, color };
    const word = words[Math.floor(Math.random() * words.length)];
    spawnWord(x, y, word);
  });

  window.addEventListener('resize', resize);

  init();
  animate();
})();
