export function initCustomCursor() {
  const cursor = document.querySelector(".custom-cursor");
  const dot = document.querySelector(".custom-cursor-dot");
  if (!cursor || !dot) return;

  const supportsFinePointer =
    window.matchMedia("(hover: hover)").matches &&
    window.matchMedia("(pointer: fine)").matches;

  if (!supportsFinePointer) {
    cursor.style.display = "none";
    dot.style.display = "none";
    return;
  }

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let cursorX = targetX;
  let cursorY = targetY;
  const lagFactor = 0.16;

  const animateCursor = () => {
    cursorX += (targetX - cursorX) * lagFactor;
    cursorY += (targetY - cursorY) * lagFactor;
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
    requestAnimationFrame(animateCursor);
  };

  const updatePosition = (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    dot.style.left = `${targetX}px`;
    dot.style.top = `${targetY}px`;
    cursor.style.opacity = "1";
    dot.style.opacity = "1";
  };

  document.addEventListener("mousemove", updatePosition, { passive: true });
  document.addEventListener("mouseleave", () => {
    cursor.style.opacity = "0";
    dot.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    cursor.style.opacity = "1";
    dot.style.opacity = "1";
  });

  animateCursor();
}
