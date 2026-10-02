/**
 * Research & Development (R&D) Cell - PCCOE Pune
 * Main Client Application Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileMenu();
  initMembersDirectory();
  initStatsObserver();
  initNavScroll();
});

/* ==========================================================================
   1. Theme Management (Light / Dark)
   ========================================================================== */
function initTheme() {
  const themeToggleBtn = document.getElementById("theme-toggle");
  const themeIconSun = document.getElementById("theme-icon-sun");
  const themeIconMoon = document.getElementById("theme-icon-moon");

  const savedTheme = localStorage.getItem("rd-theme") || 
    (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const nextTheme = current === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      localStorage.setItem("rd-theme", nextTheme);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeIconSun && themeIconMoon) {
      if (theme === "light") {
        themeIconSun.classList.add("hidden");
        themeIconMoon.classList.remove("hidden");
      } else {
        themeIconSun.classList.remove("hidden");
        themeIconMoon.classList.add("hidden");
      }
    }
  }
}

/* ==========================================================================
   2. Mobile Menu Navigation
   ========================================================================== */
function initMobileMenu() {
  const menuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileLinks = document.querySelectorAll(".mobile-nav-link");

  if (!menuBtn || !mobileMenu) return;

  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  mobileLinks.forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
    });
  });
}

/* ==========================================================================
   3. Members Directory & Dynamic Rendering
   ========================================================================== */
let activeCategory = 'all';
let searchQuery = '';

function initMembersDirectory() {
  const membersGrid = document.getElementById("members-grid");
  const searchInput = document.getElementById("member-search");
  const filterContainer = document.getElementById("category-filters");
  const memberCountBadge = document.getElementById("member-count");

  if (!membersGrid || typeof RD_MEMBERS === 'undefined') return;

  // Render Category Filter Buttons
  if (filterContainer && typeof RD_CATEGORIES !== 'undefined') {
    filterContainer.innerHTML = RD_CATEGORIES.map(cat => `
      <button class="filter-btn ${cat.id === activeCategory ? 'active' : ''}" data-category="${cat.id}">
        <span>${cat.label}</span>
      </button>
    `).join('');

    filterContainer.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        filterContainer.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeCategory = btn.dataset.category;
        renderMembers();
      });
    });
  }

  // Search input event
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderMembers();
    });
  }

  // Initial render
  renderMembers();

  function renderMembers() {
    let filtered = RD_MEMBERS.filter(member => {
      // Category filter
      const matchesCategory = (activeCategory === 'all') || (member.category === activeCategory);

      // Search query filter (search across name, designation, department, and specializations)
      const matchesQuery = !searchQuery || 
        member.name.toLowerCase().includes(searchQuery) ||
        member.designation.toLowerCase().includes(searchQuery) ||
        member.department.toLowerCase().includes(searchQuery) ||
        (member.specializations && member.specializations.some(s => s.toLowerCase().includes(searchQuery)));

      return matchesCategory && matchesQuery;
    });

    if (memberCountBadge) {
      memberCountBadge.textContent = `${filtered.length} ${filtered.length === 1 ? 'member' : 'members'}`;
    }

    if (filtered.length === 0) {
      membersGrid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/40 border border-slate-700/60 flex items-center justify-center text-slate-400">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <h4 class="text-lg font-semibold text-slate-200">No members found</h4>
          <p class="text-sm text-slate-400 mt-1 max-w-sm mx-auto">No members matched "${searchQuery}". Try searching for another name, designation, or department.</p>
          <button id="reset-search-btn" class="mt-4 px-4 py-2 text-xs font-medium uppercase tracking-wider text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition">
            Reset Filters
          </button>
        </div>
      `;
      const resetBtn = document.getElementById("reset-search-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          searchQuery = '';
          activeCategory = 'all';
          if (searchInput) searchInput.value = '';
          if (filterContainer) {
            filterContainer.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            const allBtn = filterContainer.querySelector('[data-category="all"]');
            if (allBtn) allBtn.classList.add("active");
          }
          renderMembers();
        });
      }
      return;
    }

    membersGrid.innerHTML = filtered.map(member => createMemberCard(member)).join('');

    // Attach click listeners to cards for the details modal
    membersGrid.querySelectorAll(".member-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = parseInt(card.dataset.id, 10);
        const member = RD_MEMBERS.find(m => m.id === id);
        if (member) showMemberModal(member);
      });
    });
  }

  function createMemberCard(m) {
    const specs = (m.specializations || []).slice(0, 3).map(s => `
      <span class="spec-pill">${s}</span>
    `).join('');

    return `
      <div class="member-card glass-card p-6 flex flex-col justify-between cursor-pointer group relative overflow-hidden" data-id="${m.id}">
        <!-- Top subtle accent line on hover -->
        <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500 transition-all duration-500"></div>

        <div>
          <!-- Header with Avatar and Badge -->
          <div class="flex items-start gap-4 mb-4">
            <div class="relative shrink-0">
              <img 
                src="${m.avatar}" 
                alt="${m.name}" 
                class="w-16 h-16 rounded-xl object-cover border border-slate-700/50 shadow-md group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=1e293b&color=cbd5e1'"
              />
              <span class="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span class="pulse-indicator"></span>
              </span>
            </div>
            
            <div class="flex-1 min-w-0">
              <span class="designation-badge mb-1">${m.badge || 'Faculty'}</span>
              <h3 class="text-base font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors truncate">
                ${m.name}
              </h3>
              <p class="text-xs font-medium text-slate-300 line-clamp-1 mt-0.5">
                ${m.designation}
              </p>
              <p class="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <svg class="w-3 h-3 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                ${m.department}
              </p>
            </div>
          </div>

          <!-- Bio snippet -->
          <p class="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
            ${m.bio}
          </p>

          <!-- Specialization Tags -->
          <div class="flex flex-wrap gap-1.5 mb-5">
            ${specs}
          </div>
        </div>

        <!-- Footer / Quick Action -->
        <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div class="flex items-center gap-2">
            ${m.stats?.publications ? `<span class="text-[11px] font-medium text-slate-300">${m.stats.publications} Pubs</span>` : ''}
            ${m.stats?.patents ? `<span class="text-[11px] text-slate-500">•</span><span class="text-[11px] font-medium text-slate-300">${m.stats.patents} Patents</span>` : ''}
          </div>
          <span class="text-indigo-400 font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-[11px]">
            View Profile
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </span>
        </div>
      </div>
    `;
  }
}

/* ==========================================================================
   4. Member Details Modal
   ========================================================================== */
function showMemberModal(m) {
  let modal = document.getElementById("member-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "member-modal";
    modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop";
    document.body.appendChild(modal);
  }

  const specs = (m.specializations || []).map(s => `
    <span class="px-2.5 py-1 text-xs rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">
      ${s}
    </span>
  `).join('');

  modal.innerHTML = `
    <div class="relative w-full max-w-lg glass-card border border-slate-700/80 bg-slate-900/95 p-6 md:p-8 rounded-2xl shadow-2xl text-slate-200 animate-fadeIn" onclick="event.stopPropagation()">
      <!-- Close Button -->
      <button id="modal-close-btn" class="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      <!-- Profile Header -->
      <div class="flex items-start gap-4 mb-6">
        <img 
          src="${m.avatar}" 
          alt="${m.name}" 
          class="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-lg"
          onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=1e293b&color=cbd5e1'"
        />
        <div>
          <span class="designation-badge mb-1.5">${m.badge || 'Member'}</span>
          <h3 class="text-xl font-bold text-white">${m.name}</h3>
          <p class="text-sm font-semibold text-indigo-400 mt-0.5">${m.designation}</p>
          <p class="text-xs text-slate-400 mt-0.5">${m.department}</p>
        </div>
      </div>

      <!-- Bio -->
      <div class="mb-5">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Overview</h4>
        <p class="text-sm text-slate-300 leading-relaxed">${m.bio}</p>
      </div>

      <!-- Stats Grid -->
      ${m.stats ? `
        <div class="grid grid-cols-3 gap-3 mb-6 p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
          <div>
            <div class="text-lg font-bold text-white">${m.stats.publications || '0'}</div>
            <div class="text-[11px] uppercase tracking-wider text-slate-400">Publications</div>
          </div>
          <div class="border-x border-slate-700/50">
            <div class="text-lg font-bold text-indigo-400">${m.stats.patents || '0'}</div>
            <div class="text-[11px] uppercase tracking-wider text-slate-400">Patents</div>
          </div>
          <div>
            <div class="text-lg font-bold text-emerald-400">${m.stats.grants || 'N/A'}</div>
            <div class="text-[11px] uppercase tracking-wider text-slate-400">Grants / Project</div>
          </div>
        </div>
      ` : ''}

      <!-- Specializations -->
      <div class="mb-6">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Research Focus & Specializations</h4>
        <div class="flex flex-wrap gap-2">
          ${specs}
        </div>
      </div>

      <!-- Action Links -->
      <div class="pt-5 border-t border-slate-800 flex items-center justify-between">
        <a href="mailto:${m.links?.email || 'research@pccoepune.org'}" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          Contact Member
        </a>

        <div class="flex items-center gap-2">
          ${m.links?.scholar ? `
            <a href="${m.links.scholar}" target="_blank" rel="noreferrer" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition" title="Google Scholar">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z"/>
              </svg>
            </a>
          ` : ''}
          ${m.links?.linkedin ? `
            <a href="${m.links.linkedin}" target="_blank" rel="noreferrer" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition" title="LinkedIn">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");

  // Close handlers
  const closeBtn = modal.querySelector("#modal-close-btn");
  if (closeBtn) closeBtn.onclick = closeModal;
  modal.onclick = closeModal;

  document.addEventListener("keydown", handleEscapeKey);

  function closeModal() {
    modal.classList.add("hidden");
    document.removeEventListener("keydown", handleEscapeKey);
  }

  function handleEscapeKey(e) {
    if (e.key === "Escape") closeModal();
  }
}

/* ==========================================================================
   5. Animated Counters
   ========================================================================== */
function initStatsObserver() {
  const statElements = document.querySelectorAll(".counter-stat");
  if (!statElements.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateValue(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statElements.forEach(el => observer.observe(el));

  function animateValue(obj) {
    const target = parseFloat(obj.getAttribute("data-target")) || 0;
    const prefix = obj.getAttribute("data-prefix") || "";
    const suffix = obj.getAttribute("data-suffix") || "";
    const duration = 1800;
    const startTimestamp = performance.now();

    function step(timestamp) {
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(easeProgress * target);
      obj.textContent = `${prefix}${current}${suffix}`;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.textContent = `${prefix}${target}${suffix}`;
      }
    }
    window.requestAnimationFrame(step);
  }
}

/* ==========================================================================
   6. Navigation Scroll Spy
   ========================================================================== */
function initNavScroll() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(sec => {
      const sectionTop = sec.offsetTop - 120;
      if (window.pageYOffset >= sectionTop) {
        current = sec.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("text-indigo-400");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("text-indigo-400");
      }
    });
  });
}
