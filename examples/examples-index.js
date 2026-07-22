(function () {
  "use strict";

  const search = document.querySelector("#examples-search");
  const cards = [...document.querySelectorAll(".example-card")];
  const filters = [...document.querySelectorAll("[data-example-filter]")];
  const resultCount = document.querySelector("#examples-result-count");
  const empty = document.querySelector("#examples-empty");
  const reset = document.querySelector("#examples-reset");
  let activeCategory = "all";

  cards.forEach((card) => {
    card.dataset.searchIndex = card.textContent.toLowerCase().replace(/\s+/g, " ").trim();
  });

  function applyFilters() {
    const query = search.value.toLowerCase().trim();
    let visibleCount = 0;

    cards.forEach((card) => {
      const categoryMatches = activeCategory === "all" || card.dataset.category === activeCategory;
      const searchMatches = !query || card.dataset.searchIndex.includes(query);
      const visible = categoryMatches && searchMatches;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    resultCount.textContent = visibleCount === cards.length
      ? `Showing all ${cards.length} examples`
      : `Showing ${visibleCount} of ${cards.length} examples`;
    empty.hidden = visibleCount !== 0;
  }

  function selectCategory(category) {
    activeCategory = category;
    filters.forEach((button) => {
      const active = button.dataset.exampleFilter === category;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    applyFilters();
  }

  filters.forEach((button) => {
    button.addEventListener("click", () => selectCategory(button.dataset.exampleFilter));
  });

  search.addEventListener("input", applyFilters);
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && search.value) {
      search.value = "";
      applyFilters();
    }
  });

  reset.addEventListener("click", () => {
    search.value = "";
    selectCategory("all");
    search.focus();
  });
})();
