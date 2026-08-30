// Nav: backdrop blur on scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// Hamburger + mobile menu
const hamburger   = document.getElementById('nav-hamburger');
const mobileMenu  = document.getElementById('mobile-menu');
let scrollY = 0;

function openMenu() {
  scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top      = `-${scrollY}px`;
  document.body.style.width    = '100%';
  nav.classList.add('open');
  mobileMenu.classList.add('open');
}

function closeMenu() {
  document.body.style.position = '';
  document.body.style.top      = '';
  document.body.style.width    = '';
  window.scrollTo(0, scrollY);
  nav.classList.remove('open');
  mobileMenu.classList.remove('open');
}

hamburger.addEventListener('click', () => {
  nav.classList.contains('open') ? closeMenu() : openMenu();
});

// Close button
document.getElementById('mobile-menu-close').addEventListener('click', closeMenu);

// Close when a mobile menu link is clicked
document.querySelectorAll('.mobile-menu-links a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// Scroll reveal with IntersectionObserver
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Skills: flip a card to reveal its docs + project links
const skillCards = document.querySelectorAll('.skill-card');

function resetSkillCards(except) {
  skillCards.forEach(card => {
    if (card !== except) {
      card.classList.remove('is-flipped');
      card.setAttribute('aria-expanded', 'false');
    }
  });
}

skillCards.forEach(card => {
  card.addEventListener('click', (e) => {
    if (e.target.closest('a')) return; // let the back-face links work
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-expanded', flipped ? 'true' : 'false');
    resetSkillCards(card);
  });
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.skill-card')) resetSkillCards(null);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') resetSkillCards(null);
});

// Project pages: "View repo" opens a "repo is private" modal instead of a link
const repoBtns = document.querySelectorAll('.pd-repo-btn');
if (repoBtns.length) {
  const modal = document.createElement('div');
  modal.className = 'pd-modal';
  modal.innerHTML =
    '<div class="pd-modal-backdrop" data-close></div>' +
    '<div class="pd-modal-card" role="dialog" aria-modal="true" aria-labelledby="pd-modal-title">' +
      '<button class="pd-modal-x" data-close aria-label="Close">&times;</button>' +
      '<h3 id="pd-modal-title">Repo is private</h3>' +
      '<p>The source for this project isn\'t public. If you\'re interested in it, reach out and I\'ll be glad to walk you through it.</p>' +
      '<a class="btn btn-primary" href="../index.html#contact" data-close>Get in touch</a>' +
    '</div>';
  document.body.appendChild(modal);

  function openRepoModal() {
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeRepoModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  repoBtns.forEach(btn => btn.addEventListener('click', openRepoModal));
  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeRepoModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeRepoModal();
  });
}
