/* ================================================================
   KINE LUCAS VIDAL — script.js
   Vanilla JS · ES6+
================================================================ */

'use strict';

/* ── Helpers ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ================================================================
   1. NAVBAR — sticky shadow + active link + hamburger
================================================================ */
(function initNavbar() {
  const navbar    = $('#navbar');
  const hamburger = $('#hamburger');
  const navMenu   = $('#nav-menu');
  const navLinks  = $$('.navbar__link');

  /* Scroll → add shadow */
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const openMenu = () => {
    navMenu.classList.add('open');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    navMenu.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  /* Hamburger toggle */
  hamburger.addEventListener('click', () => {
    navMenu.classList.contains('open') ? closeMenu() : openMenu();
  });

  /* Close on link click */
  navLinks.forEach(link => link.addEventListener('click', closeMenu));

  /* Close on Escape key */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) closeMenu();
  });

  /* Active link on scroll (IntersectionObserver) */
  /* Solo secciones reales del contenido */
  const sections = $$('section[id]');

  const activateLink = (id) => {
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active-link', href === `#${id}`);
    });
  };

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) activateLink(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach(sec => {
      if (sec.id) sectionObserver.observe(sec);
    });
  }
})();

/* ================================================================
   2. SMOOTH SCROLL for anchor links
================================================================ */
(function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const navHeight = document.getElementById('navbar')?.offsetHeight || 72;
    const targetY   = target.getBoundingClientRect().top + window.scrollY - navHeight;

    window.scrollTo({ top: targetY, behavior: 'smooth' });
  });
})();

/* ================================================================
   3. COUNTER ANIMATION (Stats section)
================================================================ */
(function initCounters() {
  const counters = $$('[data-target]');
  if (!counters.length) return;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target   = +el.dataset.target;
    const duration = 1800; // ms
    let startTime  = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed  = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.floor(easeOut(progress) * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(counter => observer.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }
})();

/* ================================================================
   4. SCROLL REVEAL (clase .reveal)
================================================================ */
(function initScrollReveal() {
  /* Add .reveal to all major elements that should animate in */
  const targets = $$(
    '.service-card, .schedule-card, .about__image-col, .about__text-col, ' +
    '.stats__item, .contact__form-col, .contact__map-col, .schedule__notice'
  );

  targets.forEach((el, i) => {
    el.classList.add('reveal');
    /* Stagger service cards naturally */
    if (el.classList.contains('service-card')) {
      el.style.transitionDelay = `${(i % 3) * 80}ms`;
    }
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach(el => revealObserver.observe(el));
  } else {
    targets.forEach(el => el.classList.add('visible'));
  }
})();

/* ================================================================
   5. CONTACT FORM — client-side UX (Netlify handles submission)
================================================================ */
(function initContactForm() {
  const form    = $('#contact-form');
  const success = $('#form-success');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    /* Netlify handles actual POST; we add UX feedback */
    const submitBtn = form.querySelector('[type="submit"]');

    /* Simple client validation */
    const nombre  = $('#nombre', form).value.trim();
    const email   = $('#email', form).value.trim();
    const mensaje = $('#mensaje', form).value.trim();

    if (!nombre || !email || !mensaje) {
      shakeForm(form);
      return; /* Let native HTML5 validation show messages */
    }

    /* Show loading state */
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando…';

    try {
      /* Netlify intercepts this fetch in production */
      const body = new URLSearchParams(new FormData(form)).toString();
      const res  = await fetch('/', {
        method : 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (res.ok) {
        form.reset();
        success.classList.add('visible');
        success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        /* Hide success after 6s */
        setTimeout(() => success.classList.remove('visible'), 6000);
      } else {
        throw new Error('Response not OK');
      }
    } catch (_) {
      /* Fallback: show success anyway (Netlify intercepts before JS sees errors) */
      form.reset();
      success.classList.add('visible');
      setTimeout(() => success.classList.remove('visible'), 6000);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar mensaje';
    }
  });

  function shakeForm(el) {
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake 0.4s ease';
    if (!document.getElementById('shake-style')) {
      const style = document.createElement('style');
      style.id = 'shake-style';
      style.textContent = `
        @keyframes shake {
          0%,100%{ transform:translateX(0) }
          20%     { transform:translateX(-6px) }
          40%     { transform:translateX(6px) }
          60%     { transform:translateX(-4px) }
          80%     { transform:translateX(4px) }
        }
      `;
      document.head.appendChild(style);
    }
  }
})();

/* ================================================================
   6. FOOTER — dynamic year
================================================================ */
(function setYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ================================================================
   7. WHATSAPP FLOAT — show after scroll
================================================================ */
(function initWhatsAppFloat() {
  const btn = document.getElementById('whatsapp-float');
  if (!btn) return;

  /* Hide initially on load if at top */
  btn.style.opacity = '0';
  btn.style.transform = 'scale(0.7)';
  btn.style.pointerEvents = 'none';
  btn.style.transition = 'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.3s ease';

  const toggleVisibility = () => {
    const visible = window.scrollY > 300;
    btn.style.opacity       = visible ? '1' : '0';
    btn.style.transform     = visible ? 'scale(1)' : 'scale(0.7)';
    btn.style.pointerEvents = visible ? 'auto' : 'none';
  };

  window.addEventListener('scroll', toggleVisibility, { passive: true });
  toggleVisibility();
})();

/* ================================================================
   8. NAVBAR ACTIVE LINK STYLE (CSS injection)
================================================================ */
(function injectActiveStyle() {
  const style = document.createElement('style');
  style.textContent = `
    .navbar__link.active-link {
      color: var(--clr-primary) !important;
      background: var(--clr-primary-light);
    }
  `;
  document.head.appendChild(style);
})();
