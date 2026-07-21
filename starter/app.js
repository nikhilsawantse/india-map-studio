const map = document.querySelector("#my-map");
const selection = document.querySelector("#selection");

map.addEventListener("india-map:selectionchange", (event) => {
  selection.textContent = event.detail.id
    ? `Selected: ${event.detail.id}`
    : "No region selected";
});

map.addEventListener("india-map:maperror", () => {
  selection.textContent = "The map could not load. Serve this directory over HTTP.";
});
