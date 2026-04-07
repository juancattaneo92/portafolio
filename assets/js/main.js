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
