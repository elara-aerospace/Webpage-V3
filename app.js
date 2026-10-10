// Keep the custom forms while bounding network requests and allowing retries.
window.elaraSubmitForm = async (url, options) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timeout); }
};

const year = new Date().getFullYear().toString();

document.querySelectorAll('#year, [data-year]').forEach((node) => {
  node.textContent = year;
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const homepageData = window.elaraHomepage || {};

const initializeFloatingControls = () => {
  const localPrefix = window.location.pathname.includes('/news/') ? '../' : './';
  const socialLinks = [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/company/elara-aerospace',
      path: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/elara_aerospace/',
      path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'
    },
    {
      label: 'X',
      href: 'https://x.com/Elara_Aerospace',
      path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
    },
    {
      label: 'GitHub',
      href: 'https://github.com/elara-aerospace',
      path: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.841 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'
    }
  ];

  if (!document.querySelector('.social-sidebar')) {
    const socialSidebar = document.createElement('div');
    socialSidebar.className = 'social-sidebar';
    socialSidebar.innerHTML = socialLinks.map((link) => `
      <a href="${link.href}" target="_blank" rel="noopener" aria-label="${link.label}">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="${link.path}"></path></svg>
      </a>
    `).join('');
    document.body.appendChild(socialSidebar);
  }

  if (!document.querySelector('.team-link')) {
    const teamLink = document.createElement('a');
    teamLink.className = 'team-link';
    teamLink.href = `${localPrefix}team.html#apply`;
    teamLink.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-8-2h4v2h-4V4z"></path></svg>
      <span>Apply</span>
    `;
    document.body.appendChild(teamLink);
  }

  document.querySelectorAll('.social-sidebar, .team-link').forEach((control) => {
    if (control.parentElement !== document.body) {
      document.body.appendChild(control);
    }
  });

  document.querySelectorAll('.team-link span').forEach((label) => {
    label.textContent = 'Apply';
  });
};

initializeFloatingControls();

const heroSlides = Array.isArray(homepageData.heroSlides) ? homepageData.heroSlides : [];
const heroRoot = document.querySelector('.hero-live');
const heroEyebrow = document.querySelector('[data-hero-eyebrow]');
const heroTitle = document.querySelector('[data-hero-title]');
const heroLede = document.querySelector('[data-hero-lede]');
const heroPrimary = document.querySelector('[data-hero-primary]');
const heroSecondary = document.querySelector('[data-hero-secondary]');
const heroControls = document.querySelector('[data-hero-controls]');
const heroStats = document.querySelector('[data-hero-stats]');
const heroPills = document.querySelector('[data-hero-pills]');
let activeHeroSlide = 0;
let heroSlideTimer;

const renderHeroSlide = (index, immediate = false) => {
  if (!heroSlides.length || !heroRoot || !heroTitle) return;

  activeHeroSlide = (index + heroSlides.length) % heroSlides.length;
  const slide = heroSlides[activeHeroSlide];

  if (!immediate) {
    heroRoot.classList.add('is-changing');
  }

  window.setTimeout(() => {
    if (heroEyebrow) heroEyebrow.textContent = slide.eyebrow || '';
    heroTitle.innerHTML = slide.title || '';
    if (heroLede) heroLede.textContent = slide.lede || '';

    if (heroPrimary && slide.primaryCta) {
      heroPrimary.textContent = slide.primaryCta.label;
      heroPrimary.href = slide.primaryCta.href;
    }

    if (heroSecondary && slide.secondaryCta) {
      heroSecondary.textContent = slide.secondaryCta.label;
      heroSecondary.href = slide.secondaryCta.href;
    }

    if (slide.background) {
      const isMobile = window.innerWidth <= 768;
      const bgUrl = (isMobile && slide.backgroundMobile) ? slide.backgroundMobile : slide.background;
      heroRoot.style.backgroundImage = `url('${bgUrl}')`;
    }

    heroRoot.style.backgroundSize = slide.backgroundSize || 'cover';
    heroRoot.style.backgroundPosition = slide.backgroundPosition || 'center center';

    if (heroStats && Array.isArray(slide.stats)) {
      heroStats.innerHTML = slide.stats.map((stat) => `
        <div class="stat-item">
          <div class="stat-value">${stat.value || ''}</div>
          <div class="stat-label">${stat.label || ''}</div>
        </div>
      `).join('');
    }

    if (heroPills && Array.isArray(slide.pills)) {
      heroPills.innerHTML = slide.pills.map((pill) => `
        <div class="status-pill ${pill.state ? `status-${pill.state}` : ''}">
          <span>${pill.label || ''}</span>
          <strong>${pill.value || ''}</strong>
        </div>
      `).join('');
    }

    document.querySelectorAll('[data-hero-slide]').forEach((button, buttonIndex) => {
      const isActive = buttonIndex === activeHeroSlide;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive.toString());
    });

    heroRoot.classList.remove('is-changing');
  }, (prefersReducedMotion || immediate) ? 0 : 180);
};

const startHeroRotation = () => {
  if (prefersReducedMotion || heroSlides.length < 2) return;
  window.clearInterval(heroSlideTimer);
  heroSlideTimer = window.setInterval(() => {
    renderHeroSlide(activeHeroSlide + 1);
  }, 13000);
};

window.addEventListener('load', () => {
  const isMobile = window.innerWidth <= 768;
  heroSlides.forEach((slide, index) => {
    if (index === 0 || !slide.background) return;
    const image = new Image();
    image.src = (isMobile && slide.backgroundMobile) ? slide.backgroundMobile : slide.background;
  });
});

if (heroSlides.length && heroControls) {
  heroControls.innerHTML = heroSlides.map((slide, index) => (
    `<button type="button" data-hero-slide="${index}" aria-label="Show ${slide.eyebrow || `slide ${index + 1}`}" aria-pressed="${index === 0}"></button>`
  )).join('');

  heroControls.querySelectorAll('[data-hero-slide]').forEach((button) => {
    button.addEventListener('click', () => {
      renderHeroSlide(Number(button.dataset.heroSlide));
      startHeroRotation();
    });
  });

  renderHeroSlide(0, true);
  startHeroRotation();
}

const roadmapItems = Array.isArray(homepageData.roadmapMilestones) ? homepageData.roadmapMilestones : [];
const roadmapRoot = document.querySelector('[data-roadmap]');

if (roadmapRoot && roadmapItems.length) {
  const completedCount = roadmapItems.filter((item) => item.state === 'complete').length;
  const progress = roadmapItems.length > 1
    ? Math.min((completedCount / (roadmapItems.length - 1)) * 100, 100)
    : 0;

  roadmapRoot.style.setProperty('--roadmap-progress', `${progress}%`);
  roadmapRoot.style.setProperty('--roadmap-items', roadmapItems.length.toString());
  roadmapRoot.innerHTML = `
    <div class="roadmap-rail">
      ${roadmapItems.map((item, index) => `
        <article class="roadmap-item roadmap-${item.state || 'upcoming'}">
          <div class="roadmap-marker">
            <span>${item.state === 'complete' ? '✓' : String(index + 1).padStart(2, '0')}</span>
          </div>
          <div class="roadmap-card">
            <div class="roadmap-meta">
              <span>${item.date || ''}</span>
              <span>${item.status || ''}</span>
            </div>
            <h3>${item.phase || ''}</h3>
            <p>${item.detail || ''}</p>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

// Set active link in nav
const currentFile = window.location.pathname.split('/').pop() || 'index.html';
const isNewsArticle = window.location.pathname.includes('/news/');
const technologyPages = new Set(['starleap.html', 'starlight.html', 'tb30.html', 'other-projects.html']);
document.querySelectorAll('.site-nav a').forEach((link) => {
  const target = link.getAttribute('href').split('/').pop();
  const isCurrentPage = target === currentFile || (currentFile === '' && target === 'index.html');
  const isTechnologyRoot = link.textContent.trim() === 'Technology' && technologyPages.has(currentFile);
  const isNewsRoot = link.textContent.trim() === 'News' && isNewsArticle;

  if (isCurrentPage || isTechnologyRoot || isNewsRoot) {
    link.classList.add('active');
  }
});

// Header scroll effect
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  if (!header) return;
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

const glossarySearch = document.querySelector('[data-glossary-search]');
if (glossarySearch) {
  const glossaryEntries = Array.from(document.querySelectorAll('.glossary-entry'));
  const glossaryGroups = Array.from(document.querySelectorAll('.glossary-group'));
  const glossaryCount = document.querySelector('[data-glossary-count]');
  const glossaryEmpty = document.querySelector('[data-glossary-empty]');

  const filterGlossary = () => {
    const query = glossarySearch.value.trim().toLowerCase();
    let visibleEntries = 0;

    glossaryEntries.forEach((entry) => {
      const isVisible = !query || entry.textContent.toLowerCase().includes(query);
      entry.hidden = !isVisible;
      if (isVisible) visibleEntries += 1;
    });

    glossaryGroups.forEach((group) => {
      group.hidden = !group.querySelector('.glossary-entry:not([hidden])');
    });

    if (glossaryCount) {
      glossaryCount.textContent = `${visibleEntries} ${visibleEntries === 1 ? 'term' : 'terms'}`;
    }
    if (glossaryEmpty) {
      glossaryEmpty.classList.toggle('is-visible', visibleEntries === 0);
    }
  };

  glossarySearch.addEventListener('input', filterGlossary);
  filterGlossary();
}

const newsFilterButtons = Array.from(document.querySelectorAll('[data-news-filter]'));
if (newsFilterButtons.length) {
  const newsCards = Array.from(document.querySelectorAll('[data-news-category]'));
  const newsStatus = document.querySelector('[data-news-status]');

  const applyNewsFilter = (category) => {
    let visibleCount = 0;

    newsCards.forEach((card) => {
      const isVisible = category === 'all' || card.dataset.newsCategory === category;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    newsFilterButtons.forEach((button) => {
      const isActive = button.dataset.newsFilter === category;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive.toString());
    });

    if (!newsStatus) return;
    const categoryLabels = {
      all: ['published report', 'published reports'],
      visits: ['visit report', 'visit reports'],
      technology: ['technology report', 'technology reports'],
      events: ['event report', 'event reports']
    };
    const labels = categoryLabels[category] || categoryLabels.all;
    const categoryLabel = visibleCount === 1 ? labels[0] : labels[1];
    newsStatus.textContent = visibleCount
      ? `Showing ${visibleCount} ${categoryLabel}`
      : `No ${categoryLabel} published yet`;
  };

  newsFilterButtons.forEach((button) => {
    button.addEventListener('click', () => applyNewsFilter(button.dataset.newsFilter));
  });

  applyNewsFilter('all');
}

document.querySelectorAll('[data-newsletter-form]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const status = form.querySelector('[data-newsletter-status]');
    const submitBtn = form.querySelector('button[type="submit"]');
    const formId = form.dataset.hubspotFormId;
    if (submitBtn?.disabled) return;
    if (!status) return;

    if (!formId) {
      status.classList.add('is-visible');
      status.textContent = 'Subscriptions are temporarily unavailable. Please email team@elara-aerospace.com.';
      return;
    }

    const body = new URLSearchParams(new FormData(form)).toString();
    if (submitBtn) submitBtn.disabled = true;
    status.classList.add('is-visible');
    status.textContent = 'Subscribing...';

    try {
      const response = await window.elaraSubmitForm(`https://forms-eu1.hubspot.com/uploads/form/v2/143597793/${formId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });

      if (!response.ok) {
        throw new Error(`Newsletter submission failed with status ${response.status}`);
      }

      form.reset();
      status.textContent = 'You are subscribed. Welcome aboard.';
      if (submitBtn) submitBtn.textContent = 'Subscribed';
    } catch (error) {
      console.error('Newsletter submission error:', error);
      status.textContent = 'Something went wrong. Please try again or email team@elara-aerospace.com.';
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});

// Count technical values up smoothly when they enter the viewport
const counters = document.querySelectorAll('[data-count]');
const animateCounter = (counter) => {
  if (counter.dataset.counted === 'true') return;
  counter.dataset.counted = 'true';

  const target = Number(counter.dataset.count);
  const decimals = Number(counter.dataset.decimals || 0);
  const prefix = counter.dataset.prefix || '';
  const suffix = counter.dataset.suffix || '';

  if (prefersReducedMotion) {
    counter.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
    return;
  }

  const duration = 1200;
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    counter.textContent = `${prefix}${(target * eased).toFixed(decimals)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      counter.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
    }
  };

  requestAnimationFrame(step);
};

if ('IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.45 });

  counters.forEach((counter) => counterObserver.observe(counter));
} else {
  counters.forEach(animateCounter);
}

// Mobile Nav Toggle Accessibility
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.classList.toggle('open');
    siteNav.classList.toggle('open');
    document.body.classList.toggle('no-scroll');
    navToggle.setAttribute('aria-expanded', isOpen);
  });
}

// Close mobile nav on link click
document.querySelectorAll('.site-nav a').forEach(link => {
  link.addEventListener('click', () => {
    if (navToggle) {
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
    if (siteNav) siteNav.classList.remove('open');
    document.body.classList.remove('no-scroll');
  });
});

// Carousel Controls and Progress
const initializeCarousels = () => {
  const carousels = document.querySelectorAll('.carousel-container, .landing-coverage');

  carousels.forEach(container => {
    const wrapper = container.querySelector('.carousel-wrapper');
    const progressBar = container.querySelector('[data-carousel-progress]');
    const prevBtn = container.querySelector('[data-carousel-prev]');
    const nextBtn = container.querySelector('[data-carousel-next]');
    const shouldAutoplay = container.dataset.carouselAutoplay === 'true';
    let autoplayTimer;
    let autoplayPaused = false;
    let autoplayLoopWidth = 0;
    const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    if (!wrapper || !progressBar) return;

    const getStartScroll = () => {
      const firstItem = wrapper.querySelector('.carousel-item');
      if (!firstItem) return 0;
      return wrapper.scrollLeft + firstItem.getBoundingClientRect().left - wrapper.getBoundingClientRect().left;
    };

    const updateProgress = () => {
      const scrollLeft = wrapper.scrollLeft;
      const startScroll = Math.round(getStartScroll());
      const endScroll = wrapper.scrollWidth - wrapper.clientWidth;
      const scrollWidth = endScroll - startScroll;
      const progress = scrollWidth > 0 ? Math.min(100, Math.max(0, ((scrollLeft - startScroll) / scrollWidth) * 100)) : 0;
      progressBar.style.width = `${progress}%`;
    };

    const getStepSize = () => {
      const item = wrapper.querySelector('.carousel-item');
      if (!item) return 0;
      const gap = parseInt(window.getComputedStyle(wrapper).gap, 10) || 30;
      return item.offsetWidth + gap;
    };

    const scrollToNextItem = () => {
      const stepSize = getStepSize();
      if (!stepSize) return;

      const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
      const startScroll = getStartScroll();
      const isAtEnd = wrapper.scrollLeft >= maxScroll - 4;

      if (isAtEnd) {
        wrapper.scrollTo({ left: startScroll, behavior: scrollBehavior });
      } else {
        wrapper.scrollBy({ left: stepSize, behavior: scrollBehavior });
      }
    };

    const prepareContinuousAutoplay = () => {
      if (!shouldAutoplay || wrapper.dataset.autoplayPrepared === 'true') return;

      const originalItems = Array.from(wrapper.querySelectorAll('.carousel-item'));
      if (originalItems.length < 2) return;

      originalItems.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('a, button, input, textarea, select').forEach((element) => {
          element.setAttribute('tabindex', '-1');
        });
        wrapper.appendChild(clone);
      });
      const firstOriginal = originalItems[0];
      const firstClone = wrapper.querySelector('.carousel-item[aria-hidden="true"]');
      autoplayLoopWidth = firstClone && firstOriginal
        ? firstClone.offsetLeft - firstOriginal.offsetLeft
        : wrapper.scrollWidth / 2;
      wrapper.dataset.autoplayPrepared = 'true';
    };

    const tickAutoplay = () => {
      if (!autoplayPaused && autoplayLoopWidth > 0) {
        wrapper.scrollLeft += 1;
        if (wrapper.scrollLeft >= autoplayLoopWidth) {
          wrapper.scrollLeft -= autoplayLoopWidth;
        }
      }

      updateProgress();
    };

    const startAutoplay = () => {
      if (
        prefersReducedMotion ||
        !shouldAutoplay ||
        wrapper.scrollWidth <= wrapper.clientWidth ||
        container.matches(':hover, :focus-within')
      ) return;
      prepareContinuousAutoplay();
      autoplayPaused = false;
      if (!autoplayTimer) {
        autoplayTimer = window.setInterval(tickAutoplay, 30);
      }
    };

    const stopAutoplay = () => {
      autoplayPaused = true;
    };

    // Update progress on scroll
    wrapper.addEventListener('scroll', updateProgress, { passive: true });

    // Initial progress update
    updateProgress();

    // Navigation buttons
    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        const stepSize = getStepSize();
        if (!stepSize) return;
        const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
        if (wrapper.scrollLeft <= getStartScroll() + 4) {
          wrapper.scrollTo({ left: maxScroll, behavior: scrollBehavior });
        } else {
          wrapper.scrollBy({ left: -stepSize, behavior: scrollBehavior });
        }
      });

      nextBtn.addEventListener('click', () => {
        scrollToNextItem();
      });
    }

    if (shouldAutoplay) {
      container.addEventListener('focusin', stopAutoplay);
      container.addEventListener('focusout', startAutoplay);
      container.addEventListener('pointerenter', stopAutoplay);
      container.addEventListener('pointerleave', startAutoplay);
      container.addEventListener('pointerdown', stopAutoplay);
      container.addEventListener('pointerup', startAutoplay);
      container.addEventListener('pointercancel', startAutoplay);
      startAutoplay();
      window.addEventListener('load', startAutoplay, { once: true });
      window.setTimeout(startAutoplay, 800);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      updateProgress();
      if (shouldAutoplay) {
        const firstOriginal = wrapper.querySelector('.carousel-item:not([aria-hidden="true"])');
        const firstClone = wrapper.querySelector('.carousel-item[aria-hidden="true"]');
        autoplayLoopWidth = firstClone && firstOriginal
          ? firstClone.offsetLeft - firstOriginal.offsetLeft
          : wrapper.scrollWidth / 2;
      }
      startAutoplay();
    }, { passive: true });
  });
};

// Roadmap Controls and Progress
const initializeRoadmap = () => {
  const track = document.querySelector('.roadmap-track');
  const progressBar = document.querySelector('[data-roadmap-progress]');
  const prevBtn = document.querySelector('[data-roadmap-prev]');
  const nextBtn = document.querySelector('[data-roadmap-next]');

  if (!track || !progressBar) return;

  const updateProgress = () => {
    const scrollLeft = track.scrollLeft;
    const scrollWidth = track.scrollWidth - track.clientWidth;
    const progress = scrollWidth > 0 ? (scrollLeft / scrollWidth) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  };

  // Update progress on scroll
  track.addEventListener('scroll', updateProgress, { passive: true });

  // Initial progress update
  updateProgress();

  // Navigation buttons
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      const item = track.querySelector('.roadmap-item');
      if (!item) return;
      const itemWidth = item.offsetWidth;
      track.scrollBy({ left: -itemWidth, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      const item = track.querySelector('.roadmap-item');
      if (!item) return;
      const itemWidth = item.offsetWidth;
      track.scrollBy({ left: itemWidth, behavior: 'smooth' });
    });
  }

  // Handle window resize
  window.addEventListener('resize', updateProgress, { passive: true });
};

initializeCarousels();
initializeRoadmap();

// Premium Scroll Progress Indicator
const initializeScrollProgress = () => {
  const progressContainer = document.createElement('div');
  progressContainer.className = 'scroll-progress-container';
  progressContainer.setAttribute('aria-hidden', 'true');

  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress-bar';

  progressContainer.appendChild(progressBar);
  document.body.appendChild(progressContainer);

  const updateProgressBar = () => {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    progressBar.style.width = `${scrolled}%`;
  };

  window.addEventListener('scroll', updateProgressBar, { passive: true });
  window.addEventListener('resize', updateProgressBar, { passive: true });
  updateProgressBar();
};

// Premium Scroll-Reveal Animations Engine
const initializeScrollReveal = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) return;

  if (prefersReducedMotion) {
    // If the user prefers reduced motion, reveal everything immediately without transitions
    elements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Unobserve to run transition only once as it enters the viewport
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -60px 0px' // Trigger slightly before it fully enters viewport
  });

  elements.forEach(el => {
    revealObserver.observe(el);
  });
};

initializeScrollProgress();
initializeScrollReveal();

// Instant Navigation Hover/Touch Prefetching + conservative predictive preloading
const initializeInstantNav = () => {
  const prefetchCache = new Set();
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isConstrainedConnection = Boolean(
    connection && (connection.saveData || ['slow-2g', '2g'].includes(connection.effectiveType))
  );
  const canPrefetch = !isConstrainedConnection && document.visibilityState !== 'hidden';
  const maxPredictivePrefetches = isConstrainedConnection ? 0 : 5;
  let predictivePrefetchCount = 0;

  const routePredictions = {
    '/index.html': ['/starleap.html', '/news.html', '/events.html', '/partner-with-us.html', '/team.html'],
    '/': ['/starleap.html', '/news.html', '/events.html', '/partner-with-us.html', '/team.html'],
    '/technology.html': ['/starleap.html', '/starlight.html', '/tb30.html', '/other-projects.html'],
    '/starleap.html': ['/starlight.html', '/tb30.html', '/other-projects.html', '/partner-with-us.html'],
    '/starlight.html': ['/payload.html', '/tb30.html', '/partner-with-us.html', '/donate.html'],
    '/tb30.html': ['/starlight.html', '/other-projects.html', '/partner-with-us.html', '/contact.html'],
    '/other-projects.html': ['/starleap.html', '/starlight.html', '/tb30.html', '/payload.html'],
    '/payload.html': ['/contact.html', '/partner-with-us.html', '/starlight.html'],
    '/news.html': ['/donate.html', '/partners.html', '/events.html', '/starleap.html'],
    '/events.html': ['/news.html', '/partner-with-us.html', '/team.html', '/contact.html'],
    '/team.html': ['/contact.html', '/partner-with-us.html', '/about.html'],
    '/partners.html': ['/partner-with-us.html', '/donate.html', '/contact.html'],
    '/partner-with-us.html': ['/contact.html', '/partners.html', '/donate.html'],
    '/donate.html': ['/thank-you.html', '/partners.html', '/news.html'],
    '/about.html': ['/team.html', '/partner-with-us.html', '/contact.html'],
    '/contact.html': ['/partner-with-us.html', '/payload.html', '/team.html'],
    '/glossary.html': ['/starleap.html', '/payload.html', '/news.html'],
    '/legal.html': ['/contact.html', '/index.html']
  };

  const normalizePath = (url) => {
    try {
      const urlObj = new URL(url, window.location.href);
      if (urlObj.origin !== window.location.origin) return null;

      const pathname = urlObj.pathname === '/' ? '/index.html' : urlObj.pathname;
      if (!pathname.endsWith('.html')) return null;
      if (pathname === window.location.pathname || (window.location.pathname === '/' && pathname === '/index.html')) return null;

      return `${pathname}${urlObj.search || ''}`;
    } catch (e) {
      return null;
    }
  };

  const runWhenIdle = (callback, timeout = 1400) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout });
      return;
    }

    window.setTimeout(callback, 350);
  };

  const prefetchPage = (url, priority = 'intent') => {
    // Predictive requests should never compete with the current page on a
    // metered/slow connection or while the tab is hidden.
    if (!canPrefetch) return;

    const path = normalizePath(url);
    if (!path) return;

    // Avoid duplicate prefetching before consuming one of the predictive
    // request slots. Visible-link discovery can see the same route more than
    // once (for example in the header and footer).
    if (prefetchCache.has(path)) return;

    if (priority === 'predictive') {
      if (predictivePrefetchCount >= maxPredictivePrefetches) return;
      predictivePrefetchCount += 1;
    }

    prefetchCache.add(path);

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'document';
    link.href = path;
    link.fetchPriority = priority === 'predictive' ? 'low' : 'auto';
    link.dataset.prefetchPriority = priority;
    document.head.appendChild(link);
  };

  const predictCurrentRoute = () => {
    if (isConstrainedConnection) return;

    const pathname = window.location.pathname === '/' ? '/index.html' : window.location.pathname;
    const predictedRoutes = routePredictions[pathname] || ['/index.html', '/starleap.html', '/news.html'];

    runWhenIdle(() => {
      predictedRoutes.forEach((route) => prefetchPage(route, 'predictive'));
    }, 1800);
  };

  const prefetchVisiblePriorityLinks = () => {
    if (isConstrainedConnection || !('IntersectionObserver' in window)) return;

    const observedLinks = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const link = entry.target;
        observer.unobserve(link);
        observedLinks.delete(link);

        const isPriorityLink = link.closest('.site-nav, .header-actions, .hero-actions, .footer-links') ||
          link.classList.contains('btn');
        if (!isPriorityLink) return;

        runWhenIdle(() => prefetchPage(link.href, 'predictive'), 1200);
      });
    }, { rootMargin: '180px 0px' });

    document.querySelectorAll('a[href]').forEach((link) => {
      if (!normalizePath(link.href)) return;
      observedLinks.add(link);
      observer.observe(link);
    });
  };

  // Find all links on the page and attach prefetch listeners for same-origin local pages
  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('javascript:')) return;

    if (!normalizePath(href)) return;

    // Attach pointer intent, keyboard focus, and mobile touch triggers.
    link.addEventListener('pointerenter', () => prefetchPage(link.href, 'intent'), { passive: true });
    link.addEventListener('focus', () => prefetchPage(link.href, 'intent'), { passive: true });
    link.addEventListener('touchstart', () => prefetchPage(link.href, 'intent'), { passive: true });
  });

  predictCurrentRoute();
  prefetchVisiblePriorityLinks();
};

initializeInstantNav();

// ==========================================================================
// Premium German-Compliant Cookie Consent Manager
// ==========================================================================
function initializeCookieConsent() {
  const CONSENT_KEY = 'elara_cookie_consent';

  // Default preferences state
  const defaultConsent = {
    essential: true,
    telemetry: false,
    marketing: false
  };

  // Helper to get active consent
  function getConsent() {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  // Helper to save consent
  function saveConsent(consent) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
      // Dispatch global custom event for extensibility
      window.dispatchEvent(new CustomEvent('elara_cookie_consent_changed', { detail: consent }));

      // Clear non-essential cookies if opted out
      if (!consent.telemetry) {
        clearCookiesByPattern(/(_ga|_gid|_gat|telemetry|analytics)/i);
      }
      if (!consent.marketing) {
        clearCookiesByPattern(/(_fbp|_gcl|marketing|promo)/i);
      }
    } catch (e) {
      console.warn('Unable to write to localStorage for cookie consent.');
    }
  }

  // Helper to clear cookies matching a pattern (supporting multiple path/domain variations)
  function clearCookiesByPattern(regex) {
    try {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        if (regex.test(name)) {
          // Clear cookie for current page, domain, and subdomain levels
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname.replace(/^www\./, '')}`;
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  // Inject HTML markup into body
  function injectConsentDOM() {
    if (document.getElementById('cookie-consent-banner')) return;

    const bannerHtml = `
      <div class="cookie-consent-banner" id="cookie-consent-banner" aria-live="polite" aria-label="Cookie Consent Banner">
        <div class="cookie-consent-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; color: var(--accent-cyan, #7bdcff); flex-shrink: 0;">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <div class="cookie-consent-title">Cookie Management</div>
        </div>
        <div class="cookie-consent-text">
          We use cookies to keep the site working and, with your consent, to understand how visitors use it. You can change your choice at any time. Read our <a href="${window.location.pathname.includes('/news/') ? '../' : './'}legal.html?tab=privacy-policy" id="cookie-privacy-link">Privacy Policy</a>.
        </div>
        <div class="cookie-buttons">
          <button type="button" class="cookie-btn cookie-btn-accept" id="cookie-accept-all">Accept All</button>
          <button type="button" class="cookie-btn cookie-btn-decline" id="cookie-reject-all">Reject All</button>
          <button type="button" class="cookie-btn cookie-btn-customize" id="cookie-customize-btn">Customize Settings</button>
        </div>
        <div class="cookie-preferences-drawer" id="cookie-preferences-drawer">
          <div class="cookie-preference-item">
            <div class="cookie-pref-info">
              <div class="cookie-pref-title">Essential Protocols</div>
              <div class="cookie-pref-desc">Required for the site to function: saving your cookie choice and keeping forms working. Always on.</div>
            </div>
            <label class="cookie-switch">
              <input type="checkbox" id="pref-essential" checked disabled aria-disabled="true">
              <span class="cookie-slider"></span>
            </label>
          </div>
          <div class="cookie-preference-item">
            <div class="cookie-pref-info">
              <div class="cookie-pref-title">Telemetry & Analytics</div>
              <div class="cookie-pref-desc">Anonymized usage statistics that help us understand which pages matter and improve the site.</div>
            </div>
            <label class="cookie-switch">
              <input type="checkbox" id="pref-telemetry">
              <span class="cookie-slider"></span>
            </label>
          </div>
          <div class="cookie-preference-item">
            <div class="cookie-pref-info">
              <div class="cookie-pref-title">Marketing & Communications</div>
              <div class="cookie-pref-desc">Enables newsletter, recruiting, and partnership communications tools (e.g. HubSpot) to work across visits.</div>
            </div>
            <label class="cookie-switch">
              <input type="checkbox" id="pref-marketing">
              <span class="cookie-slider"></span>
            </label>
          </div>
          <button type="button" class="cookie-btn cookie-btn-save" id="cookie-save-prefs">Save Preferences</button>
        </div>
      </div>

      <button type="button" class="cookie-trigger-btn" id="cookie-trigger-btn" aria-label="Cookie Settings" style="opacity: 0; pointer-events: none;">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C5.925 2 1 6.925 1 13c0 5.523 4.477 10 10 10 5.285 0 9.61-4.102 9.97-9.31a7 7 0 0 1-6.66-6.66C13.843 3.013 12.87 2.115 12 2zm-1.5 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-9 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm8.5 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-4.5 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
        </svg>
      </button>
    `;

    const container = document.createElement('div');
    container.innerHTML = bannerHtml;
    while (container.firstChild) {
      document.body.appendChild(container.firstChild);
    }
  }

  // Inject dynamic DOM structure
  injectConsentDOM();

  const banner = document.getElementById('cookie-consent-banner');
  const triggerBtn = document.getElementById('cookie-trigger-btn');
  const acceptAllBtn = document.getElementById('cookie-accept-all');
  const rejectAllBtn = document.getElementById('cookie-reject-all');
  const customizeBtn = document.getElementById('cookie-customize-btn');
  const savePrefsBtn = document.getElementById('cookie-save-prefs');
  const drawer = document.getElementById('cookie-preferences-drawer');
  const telemetryInput = document.getElementById('pref-telemetry');
  const marketingInput = document.getElementById('pref-marketing');

  if (!banner || !triggerBtn) return;

  function showBanner() {
    banner.classList.add('is-visible');
    triggerBtn.style.opacity = '0';
    triggerBtn.style.pointerEvents = 'none';
  }

  function hideBanner() {
    banner.classList.remove('is-visible');
    triggerBtn.style.opacity = '1';
    triggerBtn.style.pointerEvents = 'auto';
  }

  function toggleDrawer() {
    const isOpen = drawer.classList.toggle('is-open');
    customizeBtn.textContent = isOpen ? 'Hide Settings' : 'Customize Settings';
  }

  // Attach button triggers
  acceptAllBtn.addEventListener('click', () => {
    const consent = { essential: true, telemetry: true, marketing: true };
    saveConsent(consent);
    hideBanner();
  });

  rejectAllBtn.addEventListener('click', () => {
    const consent = { essential: true, telemetry: false, marketing: false };
    saveConsent(consent);
    hideBanner();
  });

  customizeBtn.addEventListener('click', () => {
    toggleDrawer();
  });

  savePrefsBtn.addEventListener('click', () => {
    const consent = {
      essential: true,
      telemetry: telemetryInput.checked,
      marketing: marketingInput.checked
    };
    saveConsent(consent);
    hideBanner();
  });

  triggerBtn.addEventListener('click', () => {
    const activeConsent = getConsent() || defaultConsent;
    telemetryInput.checked = activeConsent.telemetry;
    marketingInput.checked = activeConsent.marketing;

    // Automatically open preferences drawer when user re-opens from floating trigger
    if (!drawer.classList.contains('is-open')) {
      toggleDrawer();
    }

    showBanner();
  });

  // Evaluate initial state
  const activeConsent = getConsent();
  if (activeConsent) {
    // Consent already stored
    hideBanner();
  } else {
    // First time visitor: show banner after brief delay
    setTimeout(() => {
      showBanner();
    }, 800);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { initializeCookieConsent(); });
} else {
  initializeCookieConsent();
}

// The machining asset is encoded at 2x speed; playback stays at its native rate.
const machiningVideo = document.querySelector('[data-machining-video]');
const machiningToggle = document.querySelector('[data-machining-toggle]');
if (machiningVideo && machiningToggle) {
  const updateMachiningToggle = () => {
    machiningToggle.textContent = machiningVideo.paused ? 'Play' : 'Pause';
    machiningToggle.setAttribute('aria-label', machiningVideo.paused ? 'Play machining video' : 'Pause machining video');
  };
  machiningVideo.muted = true;
  if (prefersReducedMotion) {
    machiningVideo.autoplay = false;
    machiningVideo.pause();
  }
  machiningToggle.hidden = false;
  machiningVideo.addEventListener('play', updateMachiningToggle);
  machiningVideo.addEventListener('pause', updateMachiningToggle);
  machiningToggle.addEventListener('click', () => {
    if (machiningVideo.paused) machiningVideo.play().catch(updateMachiningToggle);
    else machiningVideo.pause();
  });
  updateMachiningToggle();
}
