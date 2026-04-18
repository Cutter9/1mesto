export function initHeaderScrollState() {
  const header = document.querySelector(".header");
  if (!header) return;

  const sentinel = document.createElement("div");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:5px;pointer-events:none;visibility:hidden;";
  document.body.insertAdjacentElement("afterbegin", sentinel);

  new IntersectionObserver(([entry]) => {
    header.classList.toggle("header--scrolled", !entry.isIntersecting);
  }).observe(sentinel);
}
