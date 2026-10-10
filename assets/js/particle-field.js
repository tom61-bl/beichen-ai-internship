/* ============================================
   V3.5 粒子封面 - 物理交互增强版
   鼠标 = 引力源 + 碰撞体 + 漩涡发生器
   ============================================ */

(function() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let mouse = { x: -9999, y: -9999, px: -9999, py: -9999, active: false, vx: 0, vy: 0 };
  let cursorTrail = [];
  let clickEffects = [];
  let wordParticles = [];
  let animId;
  let time = 0;

  const colors = [
    '#4361EE', '#FF6B35', '#06D6A0', '#7B2CBF',
    '#F72585', '#FFD166', '#00B4D8', '#EF476F'
  ];

  const words = ['创造', '探索', '连接', '想象', '实现', '玩', 'AI', '灵感'];

  const GRAVITY_RADIUS = 200;
  const GRAVITY_STRENGTH = 0.8;
  const COLLISION_RADIUS = 40;
  const BOUNCE = 0.9;

  function resize() {
    width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * canvas.offsetHeight;
    }

    reset() {
      this.x = Math.random() * canvas.offsetWidth;
      this.y = Math.random() * canvas.offsetHeight;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.size = Math.random() * 5 + 2;
      this.mass = this.size;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.shape = Math.random() > 0.4 ? 'circle' : 'square';
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.03;
      this.originalColor = this.color;
    }

    update() {
      // === 鼠标龙卷风 ===
      if (mouse.active) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < GRAVITY_RADIUS && dist > 0) {
          const force = GRAVITY_STRENGTH * (1 - dist / GRAVITY_RADIUS);
          const angle = Math.atan2(dy, dx);

          // 弱引力（把粒子拉向龙卷风范围）
          this.vx += Math.cos(angle) * force * 0.08;
          this.vy += Math.sin(angle) * force * 0.08;

          // 强切向力（高速旋转 = 龙卷风主体）
          const tangentAngle = angle + Math.PI / 2;
          const swirlForce = force * 1.8;
          this.vx += Math.cos(tangentAngle) * swirlForce;
          this.vy += Math.sin(tangentAngle) * swirlForce;

          // 上升气流（粒子被吸上去，越近越强）
          const liftForce = force * 0.6 * (1 - dist / GRAVITY_RADIUS);
          this.vy -= liftForce;

          // 漏斗收缩：靠近中心时径向向内挤压
          if (dist < GRAVITY_RADIUS * 0.5) {
            const squeeze = (1 - dist / (GRAVITY_RADIUS * 0.5)) * 0.15;
            this.vx += Math.cos(angle) * squeeze;
            this.vy += Math.sin(angle) * squeeze;
          }
        }

        // === 风眼碰撞（中心弹开） ===
        if (dist < COLLISION_RADIUS + this.size && dist > 0) {
          const angle = Math.atan2(dy, dx);
          const bounceForce = (COLLISION_RADIUS + this.size - dist) * 0.4;
          this.vx -= Math.cos(angle) * bounceForce;
          this.vy -= Math.sin(angle) * bounceForce;
          this.vx += mouse.vx * 0.2;
          this.vy += mouse.vy * 0.2;
        }
      }

      // === 点击效果影响 ===
      clickEffects.forEach(effect => {
        const dx = this.x - effect.x;
        const dy = this.y - effect.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < effect.radius && dist > 0) {
          const force = effect.strength * (1 - dist / effect.radius);
          const angle = Math.atan2(dy, dx);
          this.vx += Math.cos(angle) * force;
          this.vy += Math.sin(angle) * force;
        }
      });

      // === 粒子间碰撞（简化） ===
      for (let i = 0; i < particles.length; i++) {
        const other = particles[i];
        if (other === this) continue;
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = this.size + other.size;
        if (dist < minDist && dist > 0) {
          const angle = Math.atan2(dy, dx);
          const overlap = (minDist - dist) / 2;
          this.x -= Math.cos(angle) * overlap * 0.5;
          this.y -= Math.sin(angle) * overlap * 0.5;
          // 速度交换（简化）
          const tempVx = this.vx;
          const tempVy = this.vy;
          this.vx = other.vx * 0.5;
          this.vy = other.vy * 0.5;
          other.vx = tempVx * 0.5;
          other.vy = tempVy * 0.5;
        }
      }

      // 速度衰减
      this.vx *= 0.97;
      this.vy *= 0.97;

      // 基础漂移
      this.vx += (Math.random() - 0.5) * 0.02;
      this.vy += (Math.random() - 0.5) * 0.02;

      // 限制最大速度
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const maxSpeed = 14;
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }

      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotSpeed + this.vx * 0.01;

      // 边界反弹
      if (this.x < this.size) { this.x = this.size; this.vx *= -BOUNCE; }
      if (this.x > canvas.offsetWidth - this.size) { this.x = canvas.offsetWidth - this.size; this.vx *= -BOUNCE; }
      if (this.y < this.size) { this.y = this.size; this.vy *= -BOUNCE; }
      if (this.y > canvas.offsetHeight - this.size) { this.y = canvas.offsetHeight - this.size; this.vy *= -BOUNCE; }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      // 发光效果
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;

      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.85;

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

  // 文字粒子
  class WordParticle {
    constructor(x, y, targetX, targetY, color) {
      this.x = x;
      this.y = y;
      this.targetX = targetX;
      this.targetY = targetY;
      this.vx = (Math.random() - 0.5) * 15;
      this.vy = (Math.random() - 0.5) * 15;
      this.size = Math.random() * 3 + 2;
      this.color = color;
      this.life = 1;
      this.phase = 'explode';
      this.holdTimer = 0;
    }

    update() {
      if (this.phase === 'explode') {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.94;
        this.vy *= 0.94;
        if (Math.abs(this.vx) < 0.5 && Math.abs(this.vy) < 0.5) {
          this.phase = 'gather';
        }
      } else if (this.phase === 'gather') {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        this.x += dx * 0.06;
        this.y += dy * 0.06;
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
          this.phase = 'hold';
        }
      } else if (this.phase === 'hold') {
        this.holdTimer++;
        this.x += (Math.random() - 0.5) * 0.8;
        this.y += (Math.random() - 0.5) * 0.8;
        if (this.holdTimer > 100) this.phase = 'fade';
      } else {
        this.life -= 0.012;
        this.y -= 0.8;
      }
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.life;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function init() {
    resize();
    const count = window.innerWidth < 768 ? 60 : 120;
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / 80) * 0.12;
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

  function drawCursor() {
    if (!mouse.active) return;

    const cx = mouse.x, cy = mouse.y;
    const t = time * 0.05;

    // 龙卷风范围（淡底）
    ctx.save();
    ctx.globalAlpha = 0.06;
    const tornadoGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, GRAVITY_RADIUS);
    tornadoGrad.addColorStop(0, '#FF6B35');
    tornadoGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = tornadoGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, GRAVITY_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 螺旋气流线（3条，旋转上升）
    for (let arm = 0; arm < 3; arm++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t + arm * (Math.PI * 2 / 3));
      ctx.strokeStyle = arm === 0 ? '#FF6B35' : (arm === 1 ? '#4361EE' : '#06D6A0');
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      // 螺旋线：从中心向外，同时向上
      for (let i = 0; i <= 60; i++) {
        const progress = i / 60;
        const angle = progress * Math.PI * 3; // 转1.5圈
        const radius = progress * 70; // 从中心向外扩大
        const lift = -progress * 50; // 向上
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.4 + lift; // 压扁成漏斗
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 风眼（中心黑点+发光）
    ctx.save();
    ctx.fillStyle = '#1a1a2e';
    ctx.shadowColor = '#FF6B35';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 风眼外环（快速旋转）
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 3);
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, COLLISION_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 底部吸入漩涡（宽底）
    ctx.save();
    ctx.translate(cx, cy + 30);
    ctx.rotate(-t * 0.8);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const progress = i / 40;
      const angle = progress * Math.PI * 2;
      const radius = 15 + progress * 55;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.3;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // 鼠标拖尾（螺旋状）
    cursorTrail.forEach((pos, i) => {
      const alpha = (i / cursorTrail.length) * 0.2;
      const size = (i / cursorTrail.length) * 15;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#FF6B35';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y - i * 2, size, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();
    });
  }

  function animate() {
    time++;
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // 背景
    const gradient = ctx.createLinearGradient(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    gradient.addColorStop(0, '#f8f9ff');
    gradient.addColorStop(0.5, '#fff8f5');
    gradient.addColorStop(1, '#f5fffb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    drawConnections();

    particles.forEach(p => { p.update(); p.draw(); });

    // 文字粒子
    wordParticles = wordParticles.filter(wp => wp.life > 0);
    wordParticles.forEach(wp => { wp.update(); wp.draw(); });

    // 点击效果
    clickEffects = clickEffects.filter(e => {
      e.radius += e.expandSpeed;
      e.strength *= 0.95;
      // 画涟漪
      ctx.save();
      ctx.globalAlpha = e.strength * 0.5;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return e.strength > 0.1;
    });

    drawCursor();

    // 更新鼠标速度
    if (mouse.active) {
      mouse.vx = mouse.x - mouse.px;
      mouse.vy = mouse.y - mouse.py;
      mouse.px = mouse.x;
      mouse.py = mouse.y;

      // 拖尾
      cursorTrail.push({ x: mouse.x, y: mouse.y });
      if (cursorTrail.length > 12) cursorTrail.shift();
    }

    animId = requestAnimationFrame(animate);
  }

  function spawnWord(x, y, word) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const fontSize = 72;
    const charWidth = fontSize * 0.85;
    const startX = x - (word.length * charWidth) / 2;
    const startY = y - fontSize / 2;

    for (let ci = 0; ci < word.length; ci++) {
      const charTargetX = startX + ci * charWidth + charWidth / 2;
      const charTargetY = startY + fontSize / 2;
      for (let i = 0; i < 20; i++) {
        const tx = charTargetX + (Math.random() - 0.5) * charWidth * 0.7;
        const ty = charTargetY + (Math.random() - 0.5) * fontSize * 0.7;
        wordParticles.push(new WordParticle(x, y, tx, ty, color));
      }
    }
  }

  function handleClick(x, y) {
    // 点击产生爆炸+漩涡
    clickEffects.push({
      x, y,
      radius: 0,
      expandSpeed: 6,
      strength: 8,
      color: colors[Math.floor(Math.random() * colors.length)]
    });

    // 生成词
    const word = words[Math.floor(Math.random() * words.length)];
    setTimeout(() => spawnWord(x, y, word), 200);
  }

  // 鼠标事件
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    if (!mouse.active) {
      mouse.px = mouse.x;
      mouse.py = mouse.y;
    }
    mouse.active = true;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
    cursorTrail = [];
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    handleClick(e.clientX - rect.left, e.clientY - rect.top);
  });

  // 触摸
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    mouse.x = t.clientX - rect.left;
    mouse.y = t.clientY - rect.top;
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.active = true;
    handleClick(mouse.x, mouse.y);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    mouse.x = t.clientX - rect.left;
    mouse.y = t.clientY - rect.top;
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    mouse.active = false;
    cursorTrail = [];
  });

  window.addEventListener('resize', resize);

  // 隐藏默认光标
  canvas.style.cursor = 'none';

  init();
  animate();
})();
