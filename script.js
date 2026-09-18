document.getElementById('year').textContent = new Date().getFullYear();

/* --- nav scroll state --- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* --- mobile menu --- */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
  })
);

/* --- cursor glow (desktop only) --- */
const glow = document.getElementById('cursorGlow');
const isFinePointer = window.matchMedia('(pointer: fine)').matches;
if (isFinePointer) {
  window.addEventListener('mousemove', (e) => {
    glow.style.opacity = '1';
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
  });
  window.addEventListener('mouseleave', () => glow.style.opacity = '0');
}

/* --- scroll reveal --- */
const revealEls = document.querySelectorAll('[data-reveal]');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

/* --- 3D tilt on cards --- */
const tiltEls = document.querySelectorAll('.tilt');
if (isFinePointer) {
  tiltEls.forEach(el => {
    let bounds;
    el.addEventListener('mouseenter', () => {
      bounds = el.getBoundingClientRect();
      el.style.transition = 'transform .1s ease';
    });
    el.addEventListener('mousemove', (e) => {
      if (!bounds) return;
      const x = (e.clientX - bounds.left) / bounds.width - 0.5;
      const y = (e.clientY - bounds.top) / bounds.height - 0.5;
      el.style.transform = `perspective(700px) rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg) translateZ(6px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
      el.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateZ(0)';
    });
  });
}

/* --- vinyl tilts subtly with scroll position (parallax) --- */
const vinylWrap = document.getElementById('vinylWrap');
window.addEventListener('scroll', () => {
  const y = Math.min(window.scrollY, 600);
  vinylWrap.style.transform = `rotateY(${y * 0.04}deg) translateY(${y * 0.06}px)`;
}, { passive: true });
