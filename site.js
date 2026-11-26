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
  const canShowDialogs = typeof serviceDialog.showModal === 'function';
  let returnTarget;
  select('[data-close]', serviceDialog).addEventListener('click', () => serviceDialog.close());
  serviceDialog.addEventListener('click', event => {
    if (event.target !== serviceDialog) return;
    const bounds = serviceDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) serviceDialog.close();
  });
  serviceDialog.addEventListener('close', () => {
    if (returnTarget?.isConnected) returnTarget.focus({preventScroll: true});
  });

  function showTreatment(card, trigger) {
    const photo = select('.treatment-img img', card);
    const detailPhoto = select('#detail-photo');
    detailPhoto.src = photo.getAttribute('src');
    detailPhoto.alt = photo.alt;
    select('#detail-name').textContent = select('.treatment-title', card).textContent;
    select('#detail-price').textContent = select('.treatment-price', card).textContent;
    const duration = select('.treatment-time', card)?.textContent;
    const time = select('#detail-time');
    time.textContent = duration || '';
    time.parentElement.hidden = !duration;
    select('#detail-text').textContent = select('.description', card).textContent;
    select('#detail-book').href = select('.treatment-inline .button', card).href;
    returnTarget = trigger;
    serviceDialog.showModal();
    select('[data-close]', serviceDialog).focus({preventScroll: true});
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
(() => {
  const slides = [...document.querySelectorAll('.nail-slide')];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let timer;
  function schedule() {
    clearInterval(timer);
    if (preference.matches || document.hidden) return;
    timer = setInterval(() => {
      slides[index].removeAttribute('data-current');
      slides[index].setAttribute('aria-hidden', 'true');
      index = (index + 1) % slides.length;
      slides[index].setAttribute('data-current', '');
      slides[index].removeAttribute('aria-hidden');
    }, 5000);
  }
  preference.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', schedule);
  schedule();
})();
