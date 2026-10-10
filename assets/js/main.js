/* ============================================
   主脚本 - 导航、滚动动画、通用功能
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  initNav();
  initScrollReveal();
  initCurrentPage();
});

/* --- 导航 --- */
function initNav() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.nav-mobile');

  // 滚动阴影
  window.addEventListener('scroll', function() {
    if (window.scrollY > 10) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // 移动端菜单
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function() {
      toggle.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    // 点击链接后关闭菜单
    mobileMenu.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        toggle.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
}

/* --- 滚动显现动画 --- */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  if (!reveals.length) return;

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(function(el) {
    observer.observe(el);
  });
}

/* --- 当前页面高亮 --- */
function initCurrentPage() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link, .nav-mobile-link');

  navLinks.forEach(function(link) {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
}

/* --- 工具函数 --- */
function debounce(fn, delay) {
  let timer;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(fn.bind(this, ...arguments), delay);
  };
}

function throttle(fn, limit) {
  let inThrottle;
  return function() {
    if (!inThrottle) {
      fn.apply(this, arguments);
      inThrottle = true;
      setTimeout(function() { inThrottle = false; }, limit);
    }
  };
}
