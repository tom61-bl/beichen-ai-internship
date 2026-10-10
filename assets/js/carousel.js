/* ============================================
   首页轮播组件
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.carousel-track');
  const slides = carousel.querySelectorAll('.carousel-slide');
  const dots = carousel.querySelectorAll('.carousel-dot');
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');

  let currentIndex = 0;
  const totalSlides = slides.length;
  const autoPlayInterval = 4000; // 4秒自动切换
  let autoPlayTimer = null;

  function goToSlide(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;

    currentIndex = index;
    track.style.transform = 'translateX(-' + (index * 100) + '%)';

    // 更新圆点
    dots.forEach(function(dot, i) {
      dot.classList.toggle('active', i === index);
    });
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayTimer = setInterval(nextSlide, autoPlayInterval);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  // 事件绑定
  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      prevSlide();
      resetAutoPlay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      nextSlide();
      resetAutoPlay();
    });
  }

  dots.forEach(function(dot, index) {
    dot.addEventListener('click', function() {
      goToSlide(index);
      resetAutoPlay();
    });
  });

  // 触摸滑动支持
  let touchStartX = 0;
  let touchEndX = 0;

  carousel.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoPlay();
  }, { passive: true });

  carousel.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    startAutoPlay();
  }, { passive: true });

  function handleSwipe() {
    const diff = touchStartX - touchEndX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }

  // 鼠标悬停暂停
  carousel.addEventListener('mouseenter', stopAutoPlay);
  carousel.addEventListener('mouseleave', startAutoPlay);

  // 键盘控制
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
      prevSlide();
      resetAutoPlay();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      resetAutoPlay();
    }
  });

  // 初始化
  goToSlide(0);
  startAutoPlay();
});
