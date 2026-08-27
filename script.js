document.addEventListener('DOMContentLoaded', () => {
  const revealTargets = document.querySelectorAll(
    '.section-heading, .about-text, .service-card, .gallery-item, .feature, .booking-content'
  );

  revealTargets.forEach((element, index) => {
    element.dataset.reveal = '';
    element.style.transitionDelay = `${Math.min((index % 4) * 90, 270)}ms`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  revealTargets.forEach((element) => observer.observe(element));

  const hero = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-content');
  const supportsMotion = window.matchMedia('(min-width: 681px) and (prefers-reduced-motion: no-preference)').matches;

  if (hero && heroContent && supportsMotion) {
    hero.addEventListener('pointermove', (event) => {
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      heroContent.style.transform = `rotateY(${x * 5}deg) rotateX(${y * -4}deg) translateZ(24px)`;
    });

    hero.addEventListener('pointerleave', () => {
      heroContent.style.transform = '';
    });
  }
});
