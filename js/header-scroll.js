export function initHeaderScrollState() {
  const header = document.querySelector(".header");
  if (!header) return;

  const updateState = () => {
    header.classList.toggle("header--scrolled", window.scrollY > 4);
  };

  updateState();
  window.addEventListener("scroll", updateState, { passive: true });
}
