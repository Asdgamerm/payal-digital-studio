document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const optimizedStyles = document.createElement('style');
  optimizedStyles.textContent = `
    .hero,.page-hero{background-image:linear-gradient(105deg,rgba(12,8,8,.8),rgba(12,8,8,.35)),url('images/optimized/hero.jpg')}
    .booking-section{background-image:linear-gradient(rgba(9,6,6,.78),rgba(9,6,6,.78)),url('images/optimized/hero.jpg')}
    .gallery-item:nth-child(1) .gallery-placeholder{background-image:linear-gradient(0deg,rgba(0,0,0,.68),transparent 65%),url('images/optimized/ChatGPT%20Image%20Aug%2026,%202026,%2005_26_32%20PM.jpg')}
    .gallery-item:nth-child(2) .gallery-placeholder{background-image:linear-gradient(0deg,rgba(0,0,0,.68),transparent 65%),url('images/optimized/ChatGPT%20Image%20Aug%2026,%202026,%2005_28_21%20PM.jpg')}
    .gallery-item:nth-child(3) .gallery-placeholder{background-image:linear-gradient(0deg,rgba(0,0,0,.68),transparent 65%),url('images/optimized/wedding.jpg')}
  `;
  document.head.append(optimizedStyles);
  document.querySelectorAll('img').forEach((image) => {
    image.loading = image.closest('.hero') ? 'eager' : 'lazy';
    image.decoding = 'async';
    const optimized = {
      'images/hero.JPG': 'images/optimized/hero.jpg',
      'images/wedding.JPG': 'images/optimized/wedding.jpg',
      'images/ChatGPT Image Aug 26, 2026, 05_26_32 PM.png': 'images/optimized/ChatGPT Image Aug 26, 2026, 05_26_32 PM.jpg',
      'images/ChatGPT Image Aug 26, 2026, 05_28_21 PM.png': 'images/optimized/ChatGPT Image Aug 26, 2026, 05_28_21 PM.jpg'
    };
    if (optimized[image.getAttribute('src')]) image.src = optimized[image.getAttribute('src')];
  });
  const header = document.querySelector('header');
  const nav = document.querySelector('.navbar');
  const navLinks = document.querySelector('.nav-links');

  if (nav && navLinks) {
    const toggle = document.createElement('button');
    toggle.className = 'menu-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Open navigation menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '&#9776;';
    nav.insertBefore(toggle, navLinks);
    toggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.innerHTML = open ? '&#215;' : '&#9776;';
    });
    navLinks.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        navLinks.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '&#9776;';
      }
    });
  }

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.prepend(progress);
  const topButton = document.createElement('button');
  topButton.className = 'back-to-top';
  topButton.type = 'button';
  topButton.setAttribute('aria-label', 'Back to top');
  topButton.innerHTML = '&uarr;';
  document.body.append(topButton);
  const updateScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${maxScroll > 0 ? window.scrollY / maxScroll : 0})`;
    topButton.classList.toggle('is-visible', window.scrollY > 520);
    header?.classList.toggle('is-scrolled', window.scrollY > 15);
  };
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });
  topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const revealTargets = document.querySelectorAll('.section-heading,.about-text,.service-card,.gallery-item,.gallery-photo,.feature,.booking-content,.package-card,.contact-info,.booking-form,.split-section');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .12 });
    revealTargets.forEach((element, index) => {
      element.dataset.reveal = '';
      element.style.transitionDelay = `${Math.min((index % 4) * 80, 240)}ms`;
      observer.observe(element);
    });
  }

  const form = document.querySelector('[data-booking-form]');
  if (form) {
    const service = new URLSearchParams(window.location.search).get('service');
    if (service && form.elements.service) {
      const select = form.elements.service;
      if (![...select.options].some((option) => option.value === service)) select.add(new Option(service, service));
      select.value = service;
    }
    const message = () => {
      const f = form.elements;
      return `Hello Payal Digital Studio, I would like to make an enquiry.\n\nName: ${f.name.value}\nPhone: ${f.phone.value}\nService: ${f.service.value}\nEvent date: ${f.date.value || 'Not decided'}\nLocation: ${f.location.value || 'Not specified'}\nMessage: ${f.message.value || 'No additional details'}`;
    };
    const notice = document.createElement('p');
    notice.className = 'booking-status';
    notice.setAttribute('aria-live', 'polite');
    form.querySelector('.form-actions')?.insertAdjacentElement('afterend', notice);
    const payload = () => {
      const f = form.elements;
      return { name: f.name.value, phone: f.phone.value, service: f.service.value, date: f.date.value, location: f.location.value, message: f.message.value };
    };
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      notice.textContent = 'Saving your enquiry…';
      try {
        const response = await fetch('/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) });
        const result = await response.json();
        if (response.ok && result.ok) notice.textContent = `Saved successfully. Your booking ID: ${result.booking_id}`;
        else throw new Error(result.error || 'Could not save enquiry.');
      } catch {
        notice.textContent = 'Opening WhatsApp to send your enquiry directly.';
      } finally {
        submit.disabled = false;
        window.open(`https://wa.me/916264798222?text=${encodeURIComponent(message())}`, '_blank', 'noopener');
      }
    });
    document.querySelector('[data-email-booking]')?.addEventListener('click', () => {
      if (form.reportValidity()) window.location.href = `mailto:gamerasd85@gmail.com?subject=${encodeURIComponent(`Booking enquiry - ${form.elements.service.value}`)}&body=${encodeURIComponent(message())}`;
    });
  }

  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const image = lightbox.querySelector('img');
    const close = () => { lightbox.classList.remove('is-open'); lightbox.setAttribute('aria-hidden', 'true'); };
    document.querySelectorAll('[data-full]').forEach((item) => item.addEventListener('click', () => {
      image.src = item.dataset.full.replace('images/wedding.JPG', 'images/optimized/wedding.jpg').replace('images/hero.JPG', 'images/optimized/hero.jpg').replace('images/ChatGPT Image Aug 26, 2026, 05_26_32 PM.png', 'images/optimized/ChatGPT Image Aug 26, 2026, 05_26_32 PM.jpg').replace('images/ChatGPT Image Aug 26, 2026, 05_28_21 PM.png', 'images/optimized/ChatGPT Image Aug 26, 2026, 05_28_21 PM.jpg');
      image.alt = item.querySelector('img')?.alt || 'Gallery image';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
    }));
    lightbox.addEventListener('click', (event) => { if (event.target === lightbox || event.target.closest('.lightbox-close')) close(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  }
});
