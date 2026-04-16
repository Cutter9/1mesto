const OVERLAY_TRANSITION_MS = 320;

export function initOverlayUi() {
  const body = document.body;

  const menu = document.querySelector("[data-mobile-menu]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menuCloseButtons = Array.from(document.querySelectorAll("[data-menu-close]"));
  const menuLinks = Array.from(document.querySelectorAll("[data-menu-link]"));

  const popup = document.querySelector("[data-popup-form]");
  const popupOpenButtons = Array.from(document.querySelectorAll("[data-popup-open]"));
  const popupCloseButtons = Array.from(document.querySelectorAll("[data-popup-close]"));
  const popupForm = popup?.querySelector("form");

  let menuOpen = false;
  let popupOpen = false;
  let menuHideTimer = null;
  let popupHideTimer = null;

  const syncBodyLock = () => {
    body.classList.toggle("body--lock", menuOpen || popupOpen);
  };

  const openMenu = () => {
    if (!menu || !menuToggle || menuOpen) return;
    if (menuHideTimer !== null) {
      clearTimeout(menuHideTimer);
      menuHideTimer = null;
    }

    menuOpen = true;
    menu.hidden = false;
    menuToggle.classList.add("burger-button--active");
    menuToggle.setAttribute("aria-expanded", "true");

    window.requestAnimationFrame(() => {
      menu.classList.add("is-visible");
    });

    syncBodyLock();
  };

  const closeMenu = () => {
    if (!menu || !menuToggle || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove("is-visible");
    menuToggle.classList.remove("burger-button--active");
    menuToggle.setAttribute("aria-expanded", "false");

    menuHideTimer = window.setTimeout(() => {
      menu.hidden = true;
      menuHideTimer = null;
    }, OVERLAY_TRANSITION_MS);

    syncBodyLock();
  };

  const openPopup = () => {
    if (!popup || popupOpen) return;
    if (popupHideTimer !== null) {
      clearTimeout(popupHideTimer);
      popupHideTimer = null;
    }

    popupOpen = true;
    popup.hidden = false;
    popup.setAttribute("aria-hidden", "false");

    window.requestAnimationFrame(() => {
      popup.classList.add("is-visible");
    });

    syncBodyLock();
  };

  const closePopup = () => {
    if (!popup || !popupOpen) return;

    popupOpen = false;
    popup.classList.remove("is-visible");
    popup.setAttribute("aria-hidden", "true");

    popupHideTimer = window.setTimeout(() => {
      popup.hidden = true;
      popupHideTimer = null;
    }, OVERLAY_TRANSITION_MS);

    syncBodyLock();
  };

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      if (menuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  menuCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeMenu();
    });
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  popupOpenButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openPopup();
    });
  });

  popupCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closePopup();
    });
  });

  if (popupForm) {
    popupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      closePopup();
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (popupOpen) {
      closePopup();
      return;
    }
    if (menuOpen) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 991 && menuOpen) {
      closeMenu();
    }
  });
}
