(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const states = Array.isArray(window.INDIA_STATES) ? window.INDIA_STATES : [];
  const steps = [
    { level: "state", stateSlug: "maharashtra", targetSlug: "maharashtra", kicker: "Chapter 1 · State", title: "Maharashtra and the western landscape", description: "Begin at state scale, where one highlighted region establishes context before the story moves into a district.", image: "../assets/story/western-ghats.svg", imageAlt: "Abstract layered green hills at sunset" },
    { level: "district", stateSlug: "maharashtra", targetSlug: "pune", kicker: "Chapter 2 · District", title: "Pune as a learning and project hub", description: "The same tour can replace the national layer with district boundaries and focus the reader on one local area.", image: "../assets/story/pune-learning.svg", imageAlt: "Abstract open book in front of a city skyline" },
    { level: "state", stateSlug: "assam", targetSlug: "assam", kicker: "Chapter 3 · State", title: "Assam and the Brahmaputra landscape", description: "A new chapter can jump across India while the progress controls, narrative structure, and visual emphasis remain consistent.", image: "../assets/story/assam-river.svg", imageAlt: "Abstract river winding through green hills" },
    { level: "state", stateSlug: "ladakh", targetSlug: "ladakh", kicker: "Chapter 4 · Union territory", title: "Ladakh and high-altitude geography", description: "The final step shows how an educational, tourism, or project-report story can end with a distinct geographic setting.", image: "../assets/story/ladakh-himalaya.svg", imageAlt: "Abstract snow-covered mountain peaks beneath a blue sky" },
  ];
  const elements = { mount: document.querySelector("#story-map"), status: document.querySelector("#story-status"), progress: document.querySelector("#story-progress"), caption: document.querySelector("#story-caption"), image: document.querySelector("#story-image"), kicker: document.querySelector("#story-kicker"), title: document.querySelector("#story-title"), description: document.querySelector("#story-description"), identifier: document.querySelector("#story-identifier"), previous: document.querySelector("#story-previous"), next: document.querySelector("#story-next"), steps: document.querySelector("#story-steps") };
  let currentIndex = initialStepIndex();
  let engine = null;
  let loadSequence = 0;

  function initialStepIndex() {
    const match = location.hash.match(/step=(\d+)/);
    return match ? Math.max(0, Math.min(steps.length - 1, Number(match[1]) - 1)) : 0;
  }

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NAMESPACE, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function createStepItem(step, index) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button"; button.textContent = `${index + 1}. ${step.title}`;
    if (index === currentIndex) button.setAttribute("aria-current", "step");
    button.addEventListener("click", () => showStep(index).catch(showError)); item.append(button); return item;
  }

  async function showStep(index, updateHash = true) {
    currentIndex = Math.max(0, Math.min(steps.length - 1, index));
    const step = steps[currentIndex];
    const state = states.find((item) => item.slug === step.stateSlug);
    const sequence = ++loadSequence;
    engine?.destroy();
    elements.status.textContent = `Loading ${step.title}…`;
    elements.progress.textContent = `Step ${currentIndex + 1} of ${steps.length}`;
    elements.image.src = step.image; elements.image.alt = step.imageAlt;
    elements.kicker.textContent = step.kicker; elements.title.textContent = step.title; elements.description.textContent = step.description;
    elements.previous.disabled = currentIndex === 0; elements.next.disabled = currentIndex === steps.length - 1;
    elements.steps.replaceChildren(...steps.map(createStepItem));
    engine = new IndiaMapEngine({ mount: elements.mount, src: step.level === "state" ? "../assets/maps/india-states.svg" : `../${state.svg}`, featureSelector: step.level === "state" ? ".map-region" : ".district-region", featureKey: "slug", interactive: false });
    await engine.load(); if (sequence !== loadSequence) return;
    const features = engine.getFeatures();
    const target = features.find((feature) => feature.id === step.targetSlug);
    features.forEach((feature) => { feature.element.classList.toggle("is-story-focus", feature.id === step.targetSlug); feature.element.classList.toggle("is-story-muted", feature.id !== step.targetSlug); feature.element.removeAttribute("tabindex"); feature.element.setAttribute("role", "presentation"); feature.element.removeAttribute("aria-label"); });
    if (target) {
      const box = target.element.getBBox();
      const marker = svgElement("g", { class: "example-story-marker", transform: `translate(${(box.x + box.width / 2).toFixed(2)} ${(box.y + box.height / 2).toFixed(2)})`, role: "img", "aria-label": `Highlighted location: ${step.title}` });
      marker.append(svgElement("circle", { r: "15" }), svgElement("circle", { r: "5" })); engine.svg.append(marker);
    }
    elements.identifier.textContent = target?.attributes.featureId || target?.attributes.regionId || step.targetSlug;
    elements.status.textContent = `${step.level === "state" ? "State" : "District"} focus · ${step.title}`;
    elements.caption.textContent = `${step.title}. ${step.description}`;
    if (updateHash) history.replaceState(null, "", `#step=${currentIndex + 1}`);
  }

  function showError(error) { elements.status.textContent = "The guided tour could not load."; elements.caption.textContent = error.message; console.error(error); }
  elements.previous.addEventListener("click", () => showStep(currentIndex - 1).catch(showError));
  elements.next.addEventListener("click", () => showStep(currentIndex + 1).catch(showError));
  window.addEventListener("hashchange", () => { const index = initialStepIndex(); if (index !== currentIndex) showStep(index, false).catch(showError); });
  showStep(currentIndex, false).catch(showError);
})();
