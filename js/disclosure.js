import { getGsapRuntime } from "./gsap-runtime.js";

export function initDisclosureLists() {
  const items = Array.from(document.querySelectorAll("[data-disclosure-item]"));
  if (!items.length) return;

  const disclosures = [];

  const getPanelContent = (entry) => Array.from(entry.panel.children);

  const clearNativeAnimations = (entry) => {
    if (!entry.nativeAnimations?.length) return;
    entry.nativeAnimations.forEach((animation) => {
      try {
        animation.cancel();
      } catch (_error) {
        // Ignore canceled animation errors.
      }
    });
    entry.nativeAnimations = [];
  };

  const cleanupContentStyles = (contentNodes) => {
    contentNodes.forEach((node) => {
      node.style.removeProperty("opacity");
      node.style.removeProperty("transform");
      node.style.removeProperty("will-change");
    });
  };

  const runNativeCloseAnimation = (entry, fromHeight, contentNodes) => {
    clearNativeAnimations(entry);
    entry.panel.style.height = `${Math.max(fromHeight, 0)}px`;
    entry.panel.style.overflow = "hidden";
    entry.panel.style.willChange = "height";
    contentNodes.forEach((node) => {
      node.style.willChange = "opacity, transform";
    });

    if (typeof entry.panel.animate !== "function") {
      entry.panel.style.height = "0px";
      entry.panel.hidden = true;
      entry.panel.style.removeProperty("will-change");
      cleanupContentStyles(contentNodes);
      return;
    }

    const panelAnimation = entry.panel.animate(
      [{ height: `${Math.max(fromHeight, 0)}px` }, { height: "0px" }],
      {
        duration: 300,
        easing: "cubic-bezier(0.32, 0, 0.67, 0)",
        fill: "forwards"
      }
    );

    const contentAnimations = contentNodes.map((node) =>
      node.animate(
        [
          { opacity: 1, transform: "translate3d(0, 0, 0)" },
          { opacity: 0, transform: "translate3d(0, -6px, 0)" }
        ],
        {
          duration: 160,
          delay: 140,
          easing: "cubic-bezier(0.4, 0, 1, 1)",
          fill: "forwards"
        }
      )
    );

    entry.nativeAnimations = [panelAnimation, ...contentAnimations];

    panelAnimation.addEventListener(
      "finish",
      () => {
        entry.panel.hidden = true;
        entry.panel.style.height = "0px";
        entry.panel.style.removeProperty("will-change");
        cleanupContentStyles(contentNodes);
        entry.nativeAnimations = [];
      },
      { once: true }
    );
  };

  const runNativeOpenAnimation = (entry, fromHeight, targetHeight, contentNodes) => {
    clearNativeAnimations(entry);
    entry.panel.hidden = false;
    entry.panel.style.overflow = "hidden";
    entry.panel.style.height = `${Math.max(fromHeight, 0)}px`;
    entry.panel.style.willChange = "height";
    contentNodes.forEach((node) => {
      node.style.opacity = "0";
      node.style.transform = "translate3d(0, -6px, 0)";
      node.style.willChange = "opacity, transform";
    });

    if (typeof entry.panel.animate !== "function") {
      entry.panel.style.height = "auto";
      entry.panel.style.removeProperty("will-change");
      cleanupContentStyles(contentNodes);
      return;
    }

    const panelAnimation = entry.panel.animate(
      [{ height: `${Math.max(fromHeight, 0)}px` }, { height: `${Math.max(targetHeight, 0)}px` }],
      {
        duration: 300,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards"
      }
    );

    const contentAnimations = contentNodes.map((node) =>
      node.animate(
        [
          { opacity: 0, transform: "translate3d(0, -6px, 0)" },
          { opacity: 1, transform: "translate3d(0, 0, 0)" }
        ],
        {
          duration: 200,
          delay: 80,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards"
        }
      )
    );

    entry.nativeAnimations = [panelAnimation, ...contentAnimations];

    panelAnimation.addEventListener(
      "finish",
      () => {
        entry.panel.style.height = "auto";
        entry.panel.style.removeProperty("will-change");
        cleanupContentStyles(contentNodes);
        entry.nativeAnimations = [];
      },
      { once: true }
    );
  };

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

    const runtime = getGsapRuntime();
    if (runtime?.gsap) {
      clearNativeAnimations(entry);
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

    runNativeCloseAnimation(entry, fromHeight, contentNodes);
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

    const runtime = getGsapRuntime();
    if (runtime?.gsap) {
      clearNativeAnimations(entry);
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

    runNativeOpenAnimation(entry, fromHeight, targetHeight, contentNodes);
  };

  items.forEach((item) => {
    const trigger = item.querySelector("[data-disclosure]");
    const panel = item.querySelector("[data-disclosure-panel]");
    if (!trigger || !panel) return;
    const scope =
      item.closest("[data-disclosure-group], .faq__grid, .feedback__grid, .faq, .feedback") || document.body;

    const entry = { item, trigger, panel, scope, isOpen: false, nativeAnimations: [] };

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
