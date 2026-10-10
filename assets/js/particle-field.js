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
  let fireworks = [];
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

  // 烟花：上升 → 绽放 → 下落
  class Firework {
    constructor(x, y) {
      this.startX = x;
      this.startY = y;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.phase = 'rising'; // rising -> burst -> falling
      this.riser = {
        x: x,
        y: y,
        vy: -(Math.random() * 4 + 8), // 上升速度
        vx: (Math.random() - 0.5) * 1.5,
        trail: []
      };
      this.burstHeight = y - (Math.random() * 120 + 100); // 绽放高度
      this.particles = [];
      this.life = 1;
    }

    update() {
      if (this.phase === 'rising') {
        // 尾迹
        this.riser.trail.push({ x: this.riser.x, y: this.riser.y, life: 1 });
        if (this.riser.trail.length > 12) this.riser.trail.shift();
        this.riser.trail.forEach(t => t.life *= 0.85);

        this.riser.x += this.riser.vx;
        this.riser.y += this.riser.vy;
        this.riser.vy += 0.12; // 重力减速

        // 到达顶点 → 绽放
        if (this.riser.vy >= -1 || this.riser.y <= this.burstHeight) {
          this.burst();
        }
      } else if (this.phase === 'burst' || this.phase === 'falling') {
        this.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.08; // 重力
          p.vx *= 0.98;
          p.life -= p.decay;
        });
        this.particles = this.particles.filter(p => p.life > 0);
        if (this.particles.length === 0) this.life = 0;
      }
    }

    burst() {
      this.phase = 'burst';
      const count = Math.floor(Math.random() * 20) + 25;
      const burstColor = this.color;
      const secondColor = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
        const speed = Math.random() * 4 + 2;
        this.particles.push({
          x: this.riser.x,
          y: this.riser.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: Math.random() * 0.012 + 0.008,
          size: Math.random() * 2.5 + 1.5,
          color: Math.random() > 0.3 ? burstColor : secondColor
        });
      }
      // 绽放冲击波，影响周围粒子
      clickEffects.push({
        x: this.riser.x,
        y: this.riser.y,
        radius: 0,
        expandSpeed: 8,
        strength: 6,
        color: burstColor
      });
      // 中心闪光
      this.flash = 1;
    }

    draw() {
      if (this.phase === 'rising') {
        // 尾迹
        this.riser.trail.forEach((t, i) => {
          ctx.save();
          ctx.globalAlpha = t.life * 0.6;
          ctx.fillStyle = this.color;
          ctx.shadowColor = this.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        // 上升弹
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.riser.x, this.riser.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // 中心闪光
        if (this.flash && this.flash > 0) {
          ctx.save();
          ctx.globalAlpha = this.flash;
          const flashGrad = ctx.createRadialGradient(
            this.riser.x, this.riser.y, 0,
            this.riser.x, this.riser.y, 60
          );
          flashGrad.addColorStop(0, '#fff');
          flashGrad.addColorStop(0.3, this.color);
          flashGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = flashGrad;
          ctx.beginPath();
          ctx.arc(this.riser.x, this.riser.y, 60, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          this.flash *= 0.85;
        }
        // 绽放粒子
        this.particles.forEach(p => {
          ctx.save();
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }
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
    const t = time * 0.06;

    // 龙卷风参数
    const tornadoHeight = 100;  // 龙卷风高度
    const bottomRadius = 55;    // 底部宽口半径
    const topRadius = 8;        // 顶部窄口半径
    const arms = 5;             // 螺旋臂数量

    // 漏斗半透明填充（龙卷风主体）
    ctx.save();
    ctx.globalAlpha = 0.08;
    const funnelGrad = ctx.createLinearGradient(cx, cy - tornadoHeight, cx, cy + 20);
    funnelGrad.addColorStop(0, '#4361EE');
    funnelGrad.addColorStop(0.5, '#FF6B35');
    funnelGrad.addColorStop(1, '#06D6A0');
    ctx.fillStyle = funnelGrad;
    ctx.beginPath();
    // 画漏斗形状（左边缘）
    ctx.moveTo(cx - bottomRadius, cy + 15);
    ctx.quadraticCurveTo(cx - bottomRadius * 0.6, cy - tornadoHeight * 0.4, cx - topRadius, cy - tornadoHeight);
    // 顶部
    ctx.lineTo(cx + topRadius, cy - tornadoHeight);
    // 右边缘
    ctx.quadraticCurveTo(cx + bottomRadius * 0.6, cy - tornadoHeight * 0.4, cx + bottomRadius, cy + 15);
    // 底部椭圆
    ctx.ellipse(cx, cy + 15, bottomRadius, bottomRadius * 0.25, 0, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 多条螺旋气流线（绕漏斗表面旋转上升）
    for (let arm = 0; arm < arms; arm++) {
      const armOffset = (arm / arms) * Math.PI * 2;
      const armColor = colors[arm % colors.length];
      ctx.save();
      ctx.strokeStyle = armColor;
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.45;
      ctx.shadowColor = armColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const progress = i / 80; // 0=底部, 1=顶部
        // 漏斗半径：底部大，向上逐渐缩小
        const radius = bottomRadius * (1 - progress) + topRadius * progress;
        // 旋转：越往上转得越快（角动量守恒）
        const angle = t * (1 + progress * 2) + armOffset + progress * Math.PI * 4;
        const y = cy + 15 - progress * (tornadoHeight + 15);
        const x = cx + Math.cos(angle) * radius;
        const ellipseY = Math.sin(angle) * radius * 0.3; // 压扁成椭圆透视
        if (i === 0) ctx.moveTo(x, y + ellipseY);
        else ctx.lineTo(x, y + ellipseY);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 底部吸入漩涡（宽口椭圆）
    ctx.save();
    ctx.translate(cx, cy + 15);
    ctx.rotate(-t * 0.6);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    for (let i = 0; i <= 50; i++) {
      const progress = i / 50;
      const angle = progress * Math.PI * 2.5;
      const r = 8 + progress * (bottomRadius - 8);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r * 0.28;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // 风眼（中心黑点+强发光）
    ctx.save();
    ctx.fillStyle = '#1a1a2e';
    ctx.shadowColor = '#FF6B35';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    // 风眼内环
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, COLLISION_RADIUS * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 顶部云团（龙卷风顶端）
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#4361EE';
    for (let i = 0; i < 5; i++) {
      const cloudAngle = t * 0.5 + (i / 5) * Math.PI * 2;
      const cloudR = 15 + Math.sin(t + i) * 5;
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(cloudAngle) * cloudR,
        cy - tornadoHeight + Math.sin(cloudAngle) * cloudR * 0.4,
        10 + Math.sin(t * 2 + i) * 3,
        0, Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();

    // 鼠标拖尾（螺旋上升的小粒子）
    cursorTrail.forEach((pos, i) => {
      const alpha = (i / cursorTrail.length) * 0.25;
      const size = (i / cursorTrail.length) * 8 + 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FF6B35';
      ctx.shadowColor = '#FF6B35';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(pos.x + Math.sin(time * 0.1 + i) * 5, pos.y - i * 3, size, 0, Math.PI * 2);
      ctx.fill();
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

    // 点击效果（冲击波）
    clickEffects = clickEffects.filter(e => {
      e.radius += e.expandSpeed;
      e.strength *= 0.95;
      ctx.save();
      ctx.globalAlpha = e.strength * 0.4;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return e.strength > 0.1;
    });

    // 烟花
    fireworks = fireworks.filter(fw => fw.life > 0);
    fireworks.forEach(fw => { fw.update(); fw.draw(); });

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
    // 点击发射一个烟花
    fireworks.push(new Firework(x, y));
    // 偶尔连发两个
    if (Math.random() > 0.5) {
      setTimeout(() => {
        fireworks.push(new Firework(
          x + (Math.random() - 0.5) * 100,
          y + (Math.random() - 0.5) * 40
        ));
      }, 200);
    }
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
