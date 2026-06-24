// ---- Image path resilience ----
// Helps when the page is opened from different base paths.
document.querySelectorAll("img").forEach((img) => {
  const originalSrc = img.getAttribute("src");
  if (!originalSrc) return;
  img.addEventListener(
    "error",
    () => {
      if (!img.dataset.fallbackTried && originalSrc.startsWith("assets/")) {
        img.dataset.fallbackTried = "1";
        img.src = `./${originalSrc}`;
      }
    },
    { once: true }
  );
});

// ---- Problem stat cards (data-driven) ----
const statCards = [
  { label: "For Student", num: "60+", desc: "Across SaaS, AI &amp; digital platforms" },
  { label: "Founders", num: "60+", desc: "Across SaaS, AI &amp; digital platforms" },
  { label: "Creators", num: "60+", desc: "Across SaaS, AI &amp; digital platforms" },
  { label: "Young Professionals", num: "60+", desc: "Across SaaS, AI &amp; digital platforms" },
  { label: "SMB owners", num: "60+", desc: "Across SaaS, AI &amp; digital platforms" },
  { label: "Enterprises", num: "60+", desc: "Across SaaS, AI &amp; digital platforms" },
];

const grid = document.querySelector(".stat-cards");
if (grid) {
  grid.innerHTML = statCards
    .map(
      (c) => `
      <div class="scard-mini">
        <span class="scard-mini__label"><i class="mark"></i>${c.label}</span>
        <div class="scard-mini__num">${c.num}</div>
        <div class="scard-mini__rule"></div>
        <p class="scard-mini__desc">${c.desc}</p>
      </div>`
    )
    .join("");
}

// ---- Accordions ----
document.querySelectorAll("[data-acc]").forEach((acc) => {
  acc.querySelectorAll(".acc__item").forEach((item) => {
    const btn = item.querySelector(".acc__btn");
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      acc.querySelectorAll(".acc__item").forEach((i) => i.classList.remove("is-open"));
      if (!isOpen) item.classList.add("is-open");
    });
  });
});

// ---- Pricing toggle ----
document.querySelectorAll("[data-toggle]").forEach((tg) => {
  const btns = tg.querySelectorAll(".toggle__btn");
  const price = document.querySelector(".plan__price");
  const badge = document.querySelector(".plan__badge");
  const note = document.querySelector(".plan__note");
  const includesTitle = document.querySelector(".includes h3");
  const includesItems = document.querySelectorAll(".includes ul li");
  const delivery = document.querySelector(".includes__delivery span:last-child");
  btns.forEach((b) =>
    b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.remove("is-active"));
      b.classList.add("is-active");
      const isExpert = b.textContent.trim().toLowerCase() === "for expert";
      if (isExpert) {
        if (price) price.textContent = "Your expertise deserves a business model.";
        if (badge) badge.textContent = "Become a verified expert";
        if (note) note.textContent = "Join Jatayu and convert trust into structured, repeatable income.";
        if (includesTitle) includesTitle.textContent = "Expert growth";
        const expertItems = [
          "Verified profile and trust signals",
          "Monetize consults, workshops, and events",
          "India-first payments and onboarding",
          "Build recurring audience demand"
        ];
        includesItems.forEach((li, idx) => {
          if (expertItems[idx]) li.textContent = expertItems[idx];
        });
        if (delivery) delivery.textContent = "Instant";
      } else {
        if (price) price.textContent = "Warm & accountable.";
        if (badge) badge.textContent = "Jatayu expert guidance";
        if (note) note.textContent = "Personalised, contextual, and built around your reality.";
        if (includesTitle) includesTitle.textContent = "AI answers";
        const seekerItems = [
          "Fast but generic",
          "No lived experience",
          "No accountability",
          "Good for information"
        ];
        includesItems.forEach((li, idx) => {
          if (seekerItems[idx]) li.textContent = seekerItems[idx];
        });
        if (delivery) delivery.textContent = "24h";
      }
    })
  );
});

// ---- Live clocks ----
function setClock(el, tz) {
  if (!el) return;
  const t = new Date().toLocaleTimeString("en-US", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true,
  });
  el.textContent = "✦ " + t;
}
function tickClocks() {
  const clocks = document.querySelectorAll(".clock__time");
  setClock(clocks[0], "Europe/Madrid");
  setClock(clocks[1], "Europe/Kyiv");
}
tickClocks();
setInterval(tickClocks, 1000 * 30);
