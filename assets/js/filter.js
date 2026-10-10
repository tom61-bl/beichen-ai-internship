/* ============================================
   成果库筛选组件
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const workCards = document.querySelectorAll('.work-card');

  if (!filterBtns.length) return;

  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const filter = btn.getAttribute('data-filter');

      // 更新按钮状态
      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      // 筛选作品
      workCards.forEach(function(card) {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = '';
          setTimeout(function() {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(function() {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });
});
