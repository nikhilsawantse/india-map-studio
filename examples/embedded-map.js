(function () {
  "use strict";

  const elements = {
    region: document.querySelector("#embed-region"),
    preview: document.querySelector("#embed-preview"),
    code: document.querySelector("#embed-code"),
    copy: document.querySelector("#embed-copy"),
    status: document.querySelector("#embed-status"),
  };

  window.INDIA_STATES.forEach((state) => {
    const option = document.createElement("option");
    option.value = state.slug;
    option.textContent = state.name;
    option.selected = state.slug === "maharashtra";
    elements.region.append(option);
  });

  function frameUrl() {
    const url = new URL("embed-frame.html", window.location.href);
    url.searchParams.set("selected", elements.region.value);
    return url.href;
  }

  function update() {
    const url = frameUrl();
    elements.preview.src = url;
    elements.code.value = [
      `<iframe`,
      `  src="${url}"`,
      `  title="Interactive India map"`,
      `  width="100%"`,
      `  height="650"`,
      `  loading="lazy"`,
      `></iframe>`,
    ].join("\n");
    const state = window.INDIA_STATES.find((item) => item.slug === elements.region.value);
    elements.status.textContent = `Preview updated: ${state?.name || elements.region.value}.`;
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(elements.code.value);
      elements.status.textContent = "Embed code copied to the clipboard.";
    } catch (_error) {
      elements.code.select();
      elements.status.textContent = "Select and copy the iframe markup manually.";
    }
  }

  elements.region.addEventListener("change", update);
  elements.copy.addEventListener("click", copyCode);
  update();
})();
