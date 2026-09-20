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

/* --- count-up numbers on scroll into view --- */
const countEls = document.querySelectorAll('.count');
const countIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.target, 10);
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countIO.unobserve(el);
  });
}, { threshold: 0.5 });
countEls.forEach(el => countIO.observe(el));

/* --- youtube facade: load real iframe only on click --- */
document.querySelectorAll('.yt-facade').forEach(el => {
  const load = () => {
    const id = el.dataset.ytId;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
    iframe.title = el.getAttribute('aria-label') || 'YouTube video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    el.classList.remove('yt-facade');
    el.innerHTML = '';
    el.appendChild(iframe);
  };
  el.addEventListener('click', load);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); load(); }
  });
});
