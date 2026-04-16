import { getGsapRuntime } from "./gsap-runtime.js";

export function initDisclosureLists() {
  const items = Array.from(document.querySelectorAll("[data-disclosure-item]"));
  if (!items.length) return;

  const runtime = getGsapRuntime();
  const disclosures = [];

  const getPanelContent = (entry) => Array.from(entry.panel.children);

  const closePanel = (entry) => {
    if (!entry.isOpen) return;

    entry.isOpen = false;
    entry.item.classList.remove("is-open");
    entry.trigger.setAttribute("aria-expanded", "false");
    const fromHeight = entry.panel.getBoundingClientRect().height;
    const contentNodes = getPanelContent(entry);
    entry.panel.style.willChange = "height";
    contentNodes.forEach((node) => {
      node.style.willChange = "opacity";
    });

    if (runtime?.gsap) {
      runtime.gsap.killTweensOf(entry.panel);
      runtime.gsap.killTweensOf(contentNodes);

      const timeline = runtime.gsap.timeline({
        defaults: { overwrite: true },
        onComplete: () => {
          entry.panel.hidden = true;
          entry.panel.style.removeProperty("will-change");
          contentNodes.forEach((node) => {
            node.style.removeProperty("opacity");
            node.style.removeProperty("will-change");
          });
        }
      });

      timeline.fromTo(
        entry.panel,
        { height: fromHeight },
        {
          height: 0,
          duration: 0.3,
          ease: "power2.in"
        },
        0
      );

      if (contentNodes.length) {
        timeline.to(
          contentNodes,
          {
            opacity: 0,
            duration: 0.16,
            ease: "power1.out",
            stagger: 0
          },
          0.14
        );
      }

      return;
    }

    entry.panel.style.height = "0px";
    entry.panel.hidden = true;
    entry.panel.style.removeProperty("will-change");
    contentNodes.forEach((node) => {
      node.style.removeProperty("opacity");
      node.style.removeProperty("will-change");
    });
  };

  const openPanel = (entry) => {
    if (entry.isOpen) return;

    entry.isOpen = true;
    entry.item.classList.add("is-open");
    entry.panel.hidden = false;
    entry.trigger.setAttribute("aria-expanded", "true");
    const fromHeight = entry.panel.getBoundingClientRect().height;
    const targetHeight = entry.panel.scrollHeight;
    const contentNodes = getPanelContent(entry);
    entry.panel.style.willChange = "height";
    contentNodes.forEach((node) => {
      node.style.opacity = "0";
      node.style.willChange = "opacity";
    });

    if (runtime?.gsap) {
      runtime.gsap.killTweensOf(entry.panel);
      runtime.gsap.killTweensOf(contentNodes);

      const timeline = runtime.gsap.timeline({
        defaults: { overwrite: true },
        onComplete: () => {
          entry.panel.style.height = "auto";
          entry.panel.style.removeProperty("will-change");
          contentNodes.forEach((node) => {
            node.style.removeProperty("opacity");
            node.style.removeProperty("will-change");
          });
        }
      });

      timeline.fromTo(
        entry.panel,
        { height: fromHeight },
        {
          height: targetHeight,
          duration: 0.3,
          ease: "power2.out"
        },
        0
      );

      if (contentNodes.length) {
        timeline.to(
          contentNodes,
          {
            opacity: 1,
            duration: 0.2,
            ease: "power1.out",
            stagger: 0
          },
          0.08
        );
      }

      return;
    }

    entry.panel.style.height = "auto";
    entry.panel.style.removeProperty("will-change");
    contentNodes.forEach((node) => {
      node.style.removeProperty("opacity");
      node.style.removeProperty("will-change");
    });
  };

  items.forEach((item) => {
    const trigger = item.querySelector("[data-disclosure]");
    const panel = item.querySelector("[data-disclosure-panel]");
    if (!trigger || !panel) return;
    const scope =
      item.closest("[data-disclosure-group], .faq__grid, .feedback__grid, .faq, .feedback") || document.body;

    const entry = { item, trigger, panel, scope, isOpen: false };

    panel.hidden = true;
    panel.style.height = "0px";
    panel.style.overflow = "hidden";
    trigger.setAttribute("aria-expanded", "false");
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
