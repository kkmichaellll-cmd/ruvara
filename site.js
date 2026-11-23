(() => {
  'use strict';

  const select = (query, root = document) => root.querySelector(query);
  const all = (query, root = document) => Array.from(root.querySelectorAll(query));
  document.documentElement.classList.add('enhanced');

  const menuButton = select('.menu-toggle');
  const mobileMenu = select('#mobile-nav');
  const menuIcon = select('use', menuButton);
  function toggleMenu(open, returnFocus = false) {
    mobileMenu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuIcon.setAttribute('href', open ? '#i-close' : '#i-menu');
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => toggleMenu(mobileMenu.hidden));
  mobileMenu.addEventListener('click', event => {
    if (event.target.closest('a')) toggleMenu(false);
  });
  document.addEventListener('click', event => {
    if (!mobileMenu.hidden && !event.target.closest('.site-header')) toggleMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileMenu.hidden) toggleMenu(false, true);
  });
  document.addEventListener('focusin', event => {
    if (!mobileMenu.hidden && !event.target.closest('.site-header')) toggleMenu(false);
  });
  const desktop = window.matchMedia('(min-width: 781px)');
  if (desktop.addEventListener) desktop.addEventListener('change', event => { if (event.matches) toggleMenu(false); });

  const serviceDialog = select('#service-dialog');
  const galleryDialog = select('#gallery-dialog');
  const canShowDialogs = typeof serviceDialog.showModal === 'function';
  const returnTargets = new WeakMap();
  function openDialog(dialog, trigger) {
    returnTargets.set(dialog, trigger);
    dialog.showModal();
    const close = select('[data-close]', dialog);
    if (close) close.focus({preventScroll:true});
  }
  [serviceDialog, galleryDialog].forEach(dialog => {
    select('[data-close]', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      const trigger = returnTargets.get(dialog);
      if (trigger && trigger.isConnected) trigger.focus({preventScroll:true});
    });
  });

  function showTreatment(card, trigger) {
    const photo = select('.treatment-img img', card);
    const detailPhoto = select('#detail-photo');
    detailPhoto.src = photo.getAttribute('src');
    detailPhoto.alt = photo.alt;
    select('#detail-name').textContent = select('.treatment-title', card).textContent;
    select('#detail-price').textContent = select('.treatment-price', card).textContent;
    select('#detail-time').textContent = select('.treatment-time', card).textContent;
    select('#detail-text').textContent = select('.description', card).textContent;
    select('#detail-book').href = select('.treatment-inline .button', card).href;
    openDialog(serviceDialog, trigger);
  }
  all('.treatment').forEach(card => {
    const summary = select('summary', card);
    if (canShowDialogs) {
      summary.setAttribute('aria-haspopup', 'dialog');
      summary.setAttribute('aria-controls', 'service-dialog');
      summary.addEventListener('click', event => { event.preventDefault(); showTreatment(card, summary); });
    }
  });
  all('[data-treatment]').forEach(link => {
    const card = document.getElementById('svc-' + link.dataset.treatment);
    if (!card) return;
    link.addEventListener('click', event => {
      if (!canShowDialogs || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) { card.open = true; return; }
      event.preventDefault(); showTreatment(card, link);
    });
  });

  const gallery = all('.gallery-item');
  let photoIndex = 0;
  function displayPhoto(index) {
    photoIndex = (index + gallery.length) % gallery.length;
    const link = gallery[photoIndex];
    const photo = select('#gallery-photo');
    photo.src = link.href;
    photo.alt = select('img', link).alt;
    select('#gallery-caption').textContent = photo.alt;
  }
  if (canShowDialogs) {
    gallery.forEach((link, index) => {
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); displayPhoto(index); openDialog(galleryDialog, link);
      });
    });
    select('[data-gallery-prev]').addEventListener('click', () => displayPhoto(photoIndex - 1));
    select('[data-gallery-next]').addEventListener('click', () => displayPhoto(photoIndex + 1));
    galleryDialog.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); displayPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    });
    const photo = select('#gallery-photo');
    let touchStart = null;
    photo.addEventListener('touchstart', event => {
      touchStart = event.touches.length === 1 ? [event.touches[0].clientX, event.touches[0].clientY] : null;
    }, {passive:true});
    photo.addEventListener('touchcancel', () => {touchStart = null;}, {passive:true});
    photo.addEventListener('touchend', event => {
      if (!touchStart) return;
      const dx = event.changedTouches[0].clientX - touchStart[0];
      const dy = event.changedTouches[0].clientY - touchStart[1];
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) displayPhoto(photoIndex + (dx < 0 ? 1 : -1));
      touchStart = null;
    }, {passive:true});
  }

  const quotes = all('.quote');
  const dots = all('[data-review-index]');
  let reviewIndex = 0;
  function showReview(index) {
    reviewIndex = (index + quotes.length) % quotes.length;
    quotes.forEach((quote, i) => { quote.hidden = i !== reviewIndex; });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === reviewIndex)));
  }
  if (quotes.length) {
    showReview(0);
    select('.review-control').hidden = false;
    select('.review-dots').hidden = false;
    dots.forEach((dot, i) => dot.addEventListener('click', () => showReview(i)));
    select('[data-review-prev]').addEventListener('click', () => showReview(reviewIndex - 1));
    select('[data-review-next]').addEventListener('click', () => showReview(reviewIndex + 1));
  }

  const enquiry = select('#enquiry');
  enquiry.addEventListener('submit', event => {
    event.preventDefault();
    if (!enquiry.reportValidity()) return;
    const fields = Array.from(new FormData(enquiry).entries())
      .map(([name, value]) => [name, String(value).trim()])
      .filter(([, value]) => value);
    const message = fields.map(([name, value]) => name + ': ' + value).join('\n\n');
    const destination = new URL('https://wa.me/31640561581');
    destination.searchParams.set('text', message);
    window.location.assign(destination.toString());
  });
})();