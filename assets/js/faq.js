/* ============================================
   FAQ 折叠组件
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function(item) {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', function() {
      const isOpen = item.classList.contains('open');

      // 关闭所有
      faqItems.forEach(function(i) {
        i.classList.remove('open');
      });

      // 打开当前（如果之前是关闭的）
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
});
