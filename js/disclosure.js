export function initDisclosureLists() {
  const items = Array.from(document.querySelectorAll("[data-disclosure-item]"));
  if (!items.length) return;

  const disclosures = [];

  const closePanel = (entry) => {
    if (!entry.isOpen) return;
    entry.isOpen = false;
    entry.item.classList.remove("is-open");
    entry.trigger.setAttribute("aria-expanded", "false");
    entry.panel.setAttribute("aria-hidden", "true");
    entry.panel.setAttribute("inert", "");
  };

  const openPanel = (entry) => {
    if (entry.isOpen) return;
    entry.isOpen = true;
    entry.item.classList.add("is-open");
    entry.trigger.setAttribute("aria-expanded", "true");
    entry.panel.removeAttribute("aria-hidden");
    entry.panel.removeAttribute("inert");
  };

  items.forEach((item) => {
    const trigger = item.querySelector("[data-disclosure]");
    const panel = item.querySelector("[data-disclosure-panel]");
    if (!trigger || !panel) return;

    const scope =
      item.closest("[data-disclosure-group], .faq__grid, .feedback__grid, .faq, .feedback") || document.body;

    const inner = document.createElement("div");
    inner.className = "disclosure__panel-inner";
    while (panel.firstChild) inner.appendChild(panel.firstChild);
    panel.appendChild(inner);

    panel.removeAttribute("hidden");
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("inert", "");
    trigger.setAttribute("aria-expanded", "false");

    const entry = { item, trigger, panel, scope, isOpen: false };
    disclosures.push(entry);

    trigger.addEventListener("click", () => {
      if (entry.isOpen) {
        closePanel(entry);
        return;
      }

      disclosures.forEach((other) => {
        if (other === entry || other.scope !== entry.scope) return;
        closePanel(other);
      });

      openPanel(entry);
    });
  });
}
