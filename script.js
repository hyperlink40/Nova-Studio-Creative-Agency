/* script.js
   Interactivity + GSAP page transitions + ScrollTrigger + graceful fallback.
*/

(() => {
  // Helpers
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

  // Set year
  document.getElementById('year').textContent = new Date().getFullYear();

  /* NAV toggle (mobile) */
  const navToggle = $('#navToggle');
  const navList = $('#navList');
  navToggle?.addEventListener('click', () => {
    const shown = navList.classList.toggle('show');
    navToggle.setAttribute('aria-expanded', String(shown));
  });

  // Close mobile nav on link click
  $$('.nav-list a').forEach(a => a.addEventListener('click', () => {
    navList.classList.remove('show');
    navToggle?.setAttribute('aria-expanded', 'false');
  }));

  /* Theme toggle with persisted preference */
  const themeToggle = $('#themeToggle');
  const root = document.documentElement;
  const saved = localStorage.getItem('ns_theme');
  if (saved === 'light') root.classList.add('light');

  themeToggle?.addEventListener('click', () => {
    const isLight = root.classList.toggle('light');
    themeToggle.setAttribute('aria-pressed', String(isLight));
    localStorage.setItem('ns_theme', isLight ? 'light' : 'dark');
    themeToggle.textContent = isLight ? '☀️' : '🌙';
  });
  themeToggle && (themeToggle.textContent = root.classList.contains('light') ? '☀️' : '🌙');

  /* Portfolio modal */
  const gallery = $('#gallery');
  const modal = $('#modal');
  const modalClose = $('#modalClose');
  const modalTitle = $('#modalTitle');
  const modalDesc = $('#modalDesc');
  const modalTags = $('#modalTags');

  function openModal(title, desc, tags) {
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modalTags.textContent = tags.split(',').map(t => t.trim()).join(' · ');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // animate modal in with GSAP if available
    if (window.gsap) {
      gsap.killTweensOf('.modal-panel');
      gsap.fromTo('.modal-panel', { scale: 0.94, autoAlpha: 0 }, { duration: 0.42, scale: 1, autoAlpha: 1, ease: "power3.out" });
      modalClose.focus();
    } else {
      modalClose.focus();
    }
  }
  function closeModal() {
    // animate modal out
    if (window.gsap) {
      gsap.to('.modal-panel', { duration: 0.32, scale: 0.94, autoAlpha: 0, ease: "power3.in", onComplete: () => {
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }});
    } else {
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  gallery && gallery.addEventListener('click', (e) => {
    const tile = e.target.closest('.tile');
    if (!tile) return;
    openModal(tile.dataset.title, tile.dataset.desc, tile.dataset.tags || '');
  });

  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.getAttribute('aria-hidden') === 'false') closeModal();
  });

  /* Testimonials carousel (small) */
  const testimonials = [
    { text: "Nova’s team helped us rethink onboarding — conversions increased 38% within a month.", who: "Lina Morales, Head of Product at Finch" },
    { text: "Fast, communicative and exceptionally detail-oriented. Our site launch was flawless.", who: "Owen Park, CEO at Vela" },
    { text: "The design system they shipped saved our engineering team hundreds of hours.", who: "Maya Singh, Lead Engineer at Orbit" }
  ];
  let tIndex = 0;
  const testView = $('#testView');
  const prevTest = $('#prevTest');
  const nextTest = $('#nextTest');

  function renderTest(i) {
    const t = testimonials[i];
    testView.innerHTML = `<blockquote class="testimonial"><p>“${t.text}”</p><footer><strong>— ${t.who}</strong></footer></blockquote>`;
  }
  renderTest(tIndex);
  prevTest?.addEventListener('click', () => {
    tIndex = (tIndex - 1 + testimonials.length) % testimonials.length;
    renderTest(tIndex);
  });
  nextTest?.addEventListener('click', () => {
    tIndex = (tIndex + 1) % testimonials.length;
    renderTest(tIndex);
  });

  /* Contact form: validation + simulated submit */
  const form = $('#contactForm');
  const status = $('#formStatus');

  function showFieldError(name, msg) {
    const el = document.querySelector(`.field-error[data-for="${name}"]`);
    if (el) { el.textContent = msg; el.setAttribute('aria-hidden', 'false'); }
  }
  function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.setAttribute('aria-hidden', 'true'); });
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearFieldErrors();
    status.textContent = '';
    const data = new FormData(form);
    const name = data.get('name')?.toString().trim() || '';
    const email = data.get('email')?.toString().trim() || '';
    const budget = data.get('budget')?.toString().trim() || '';
    const message = data.get('message')?.toString().trim() || '';

    let ok = true;
    if (name.length < 2) { showFieldError('name', 'Please enter your full name.'); ok = false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { showFieldError('email', 'Please enter a valid email.'); ok = false; }
    if (!budget) { showFieldError('budget', 'Please select a budget range.'); ok = false; }
    if (message.length < 10) { showFieldError('message', 'Tell us a bit more about the project (min 10 chars).'); ok = false; }

    if (!ok) {
      status.textContent = 'Please fix the highlighted fields.';
      status.style.color = '#ffb4b4';
      return;
    }

    // Simulate sending — in real usage send to your API endpoint (fetch)
    status.textContent = 'Sending…';
    status.style.color = 'var(--muted)';
    // fake delay
    setTimeout(() => {
      status.textContent = 'Thanks! Your message has been received — we’ll reply within 48 hours.';
      status.style.color = '#a9ffd6';
      form.reset();
    }, 900);
  });

  // --------- Reveal-on-scroll fallback (keeps earlier behavior) ----------
  function setupRevealObserver() {
    const revealEls = $$('.reveal');
    if (!revealEls.length) return null;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
    return io;
  }
  const revealObserver = setupRevealObserver();

  // ---------- GSAP: page transitions and entrance animations ----------
  const overlay = $('#pageOverlay');
  const navLinks = $$('.navlink'); // internal nav anchors to animate between sections

  // ensure GSAP is present
  function safeGsap(fn) {
    if (window.gsap) return fn();
    // gracefully degrade: reveal everything if GSAP not available
    $$('.reveal').forEach(el => el.classList.add('visible'));
    return null;
  }

  safeGsap(() => {
    // register plugin
    if (gsap?.registerPlugin) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (e) { /* ignore if already registered */ }
    }

    // initial entrance: hero + staggered reveals for key areas
    const intro = gsap.timeline({ defaults: { duration: 0.7, ease: "power3.out" }});
    intro.from("#hero .hero-copy h1", { y: 18, autoAlpha: 0, duration: 0.9 });
    intro.from("#hero .hero-copy .lead", { y: 12, autoAlpha: 0 }, "-=0.55");
    intro.from("#hero .hero-ctas a", { y: 10, autoAlpha: 0, stagger: 0.08 }, "-=0.45");
    intro.from(".card.c1, .card.c2, .card.c3", { y: 8, autoAlpha: 0, stagger: 0.06, duration: 0.9 }, "-=0.7");

    // subtle entrance for tiles/cards controlled by ScrollTrigger
    gsap.utils.toArray('.cards .card, .gallery .tile, .pricing-grid .card').forEach((el) => {
      gsap.from(el, {
        y: 18, autoAlpha: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          toggleActions: "play none none reverse",
          once: true
        }
      });
    });

    // animate reveal sections (the ones with .reveal class) to complement IntersectionObserver
    gsap.utils.toArray('.reveal').forEach(section => {
      gsap.from(section, {
        y: 20, autoAlpha: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 85%", once: true }
      });
    });

    // Page transition timeline (overlay in -> scroll -> overlay out)
    function pageTransitionTo(targetHash) {
      return new Promise((res) => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.inOut" },
          onComplete: () => res()
        });
        // overlay in (grow from top to full)
        tl.to(overlay, { duration: 0.45, transformOrigin: "top center", scaleY: 1, autoAlpha: 1 });
      });
    }
    function pageTransitionOut() {
      // overlay out (reveal content)
      return gsap.to(overlay, { duration: 0.45, scaleY: 0, autoAlpha: 0, transformOrigin: "bottom center", ease: "power3.inOut" });
    }

    // Attach click handlers to nav links for animated in-page navigation
    navLinks.forEach(link => {
      link.addEventListener('click', (ev) => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;
        ev.preventDefault();
        const targetId = href.slice(1);
        const targetEl = document.getElementById(targetId) || document.body;

        // animate overlay in, then scroll, then animate out, then focus target
        pageTransitionTo(targetId).then(() => {
          // perform instant scroll (no jump) then animate content reveal
          targetEl.scrollIntoView({ behavior: 'auto', block: 'start' });
          // small delay before hiding overlay so the content has been positioned
          pageTransitionOut().then(() => {
            // animate the target section slightly to emphasize arrival
            gsap.fromTo(targetEl, { y: 8, autoAlpha: 0.98 }, { duration: 0.6, y: 0, autoAlpha: 1, ease: "power3.out" });
            // accessibility: focus a heading inside the section if present
            const h = targetEl.querySelector('h2, h1, h3');
            if (h) h.setAttribute('tabindex', '-1'), h.focus();
          });
        });
      });
    });

    // Also animate internal anchor clicks in other places (e.g., hero CTAs)
    $$('a[href^="#"]').forEach(a => {
      if (a.classList.contains('navlink')) return; // already handled
      a.addEventListener('click', (ev) => {
        const href = a.getAttribute('href');
        if (!href || !href.startsWith('#')) return;
        ev.preventDefault();
        const targetId = href.slice(1);
        const targetEl = document.getElementById(targetId) || document.body;
        pageTransitionTo(targetId).then(() => {
          targetEl.scrollIntoView({ behavior: 'auto', block: 'start' });
          pageTransitionOut();
        });
      });
    });

    // small visual hint for clickable tiles using GSAP hover
    $$('.tile').forEach(tile => {
      tile.addEventListener('mouseenter', () => gsap.to(tile, { duration: 0.28, scale: 1.02 }));
      tile.addEventListener('mouseleave', () => gsap.to(tile, { duration: 0.28, scale: 1 }));
    });

  }); // end safeGsap

  // small: remove visually hidden aria attributes on load
  window.addEventListener('load', () => {
    document.querySelectorAll('[aria-hidden="true"]').forEach(el => {
      if (!el.closest('.modal') && el.id !== 'pageOverlay') el.removeAttribute('aria-hidden');
    });
  });

})();
