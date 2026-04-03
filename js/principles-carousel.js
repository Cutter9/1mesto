import { prefersReducedMotion } from "./utils.js";

const AUTO_PLAY_MS = 6000;
const VISIBLE_DEPTH = 4;
const DRAG_STEP_THRESHOLD = 128;

const DEPTH_SCALES = [1, 0.9, 0.8, 0.7, 0.6];
const DEPTH_CONTENT_OPACITY = [1, 0.52, 0.35, 0.22, 0.14];
const DEPTH_SHADOW_ALPHA = [0.07, 0.04, 0.03, 0.02, 0.01];
const BASE_CARD_WIDTH = 400;
const BASE_CARD_HEIGHT = 550;
const BASE_FRONT_TOP_Y = 124;
const BASE_RIGHT_EDGE_DELTAS = [0, 240, 300, 170, 0];
const BASE_TOP_DELTAS = [0, -60, -110, -150, -180];
const BASE_MAX_SIDE_DELTA = 300;
const SECOND_ROW_PULL_IN = 42;

const PRINCIPLES = [
  {
    icon: "assets/icons/3d%20Icons/Chess.png",
    iconAlt: "Иконка шахматной фигуры",
    title: "Индивидуальная стратегия",
    description: "Учитываем особенности бизнеса, ниши и конкретной точки, чтобы карточка компании выделялась среди конкурентов."
  },
  {
    icon: "assets/icons/3d%20Icons/Stairs.png",
    iconAlt: "Иконка лестницы",
    title: "Чёткий план работ",
    description:
      "Работаем по понятному плану. У большинства клиентов первые заметные результаты появляются в течение 1–3 месяцев."
  },
  {
    icon: "assets/icons/3d%20Icons/Document.png",
    iconAlt: "Иконка документа",
    title: "Регулярная отчётность",
    description:
      "Вы понимаете, что именно сделано и на каком этапе находится проект. Отчитываемся каждые 3–4 дня по выполненным шагам в проекте."
  },
  {
    icon: "assets/icons/3d%20Icons/Safe.png",
    iconAlt: "Иконка сейфа",
    title: "Результат остаётся у Вас",
    description:
      "Вся проделанная работа сохраняется внутри бизнеса, и при желании вы сможете поддерживать результат самостоятельно."
  },
  {
    icon: "assets/icons/3d%20Icons/Star.png",
    iconAlt: "Иконка звезды",
    title: "Репутационный мониторинг",
    description:
      "Следим за отзывами, отрабатываем негатив и усиливаем положительный фон вокруг компании."
  },
  {
    icon: "assets/icons/3d%20Icons/Puzzle.png",
    iconAlt: "Иконка пазла",
    title: "Опыт в разных нишах",
    description:
      "За 3 года работы агентство успело поработать с 23 нишами, поэтому быстрее находит рабочие решения под разные задачи."
  },
  {
    icon: "assets/icons/3d%20Icons/Chat.png",
    iconAlt: "Иконка чата",
    title: "Всегда на связи",
    description:
      "Держим связь, объясняем решения и помогаем быстро закрывать возникающие вопросы по ходу работы."
  },
  {
    icon: "assets/icons/3d%20Icons/Graph.png",
    iconAlt: "Иконка графика",
    title: "Упор на маркетинг",
    description:
      "Смотрим на Яндекс Карты как на часть маркетинга бизнеса. Следим за показателями, коммуникацией бренда и общим результатом."
  }
];

function getCyclicOffset(index, activeIndex, total) {
  let diff = index - activeIndex;
  const half = total / 2;

  if (diff > half) diff -= total;
  if (diff < -half) diff += total;

  if (total % 2 === 0 && Math.abs(diff) === half && diff < 0) {
    diff = half;
  }

  return diff;
}

function createCardMarkup(item) {
  return `
    <div class="principle-card__progress" aria-hidden="true">
      <div class="principle-card__progress-fill" data-card-progress></div>
    </div>
    <div class="principle-card__content">
      <div class="principle-card__icon-wrap">
        <img class="principle-card__icon" src="${item.icon}" alt="${item.iconAlt}" loading="lazy" decoding="async" draggable="false" />
      </div>
      <div class="principle-card__text">
        <h3 class="principle-card__title">${item.title}</h3>
        <p class="principle-card__description">${item.description}</p>
      </div>
    </div>
  `;
}

export function initPrinciplesCarousel() {
  const root = document.querySelector("[data-principles-carousel]");
  if (!root || PRINCIPLES.length === 0) return;

  const cardElements = [];
  const progressElements = [];

  PRINCIPLES.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "principle-card";
    card.dataset.index = String(index);
    card.innerHTML = createCardMarkup(item);

    cardElements.push(card);
    progressElements.push(card.querySelector("[data-card-progress]"));
    root.append(card);
  });

  root.tabIndex = 0;

  let activeIndex = 0;
  let progress = 0;
  let rafId = null;
  let lastFrameTime = performance.now();
  let isVisible = false;

  let isPointerDown = false;
  let pointerAnchorX = 0;
  let movedDuringPointer = false;
  let pointerDownCardIndex = null;
  let ignoreNextClick = false;

  // Per-card hidden state to skip redundant style writes for off-screen cards
  const cardHidden = new Array(cardElements.length).fill(false);

  // Only update the single active progress bar — not all 8 on every frame
  const updateProgressBars = () => {
    const fill = progressElements[activeIndex];
    if (fill) fill.style.transform = `scaleX(${progress.toFixed(4)})`;
  };

  const render = () => {
    // Read shared geometry once per render instead of once per card
    const cardWidth = cardElements[0]?.offsetWidth || BASE_CARD_WIDTH;
    const cardHeight = cardElements[0]?.offsetHeight || BASE_CARD_HEIGHT;
    const contentWidth = root.closest(".principles__inner")?.clientWidth || root.clientWidth || window.innerWidth;
    const widthRatio = cardWidth / BASE_CARD_WIDTH;
    const heightRatio = cardHeight / BASE_CARD_HEIGHT;

    const sideGutter = Math.min(72, Math.max(24, contentWidth * 0.035));
    const targetHalfExtent = Math.max(cardWidth / 2, contentWidth / 2 - sideGutter);
    const targetMaxDelta = Math.max(0, targetHalfExtent - cardWidth / 2);
    const spreadFactor = targetMaxDelta / (BASE_MAX_SIDE_DELTA * widthRatio);
    const spreadClamped = Math.max(0.78, Math.min(spreadFactor, 1.8));
    const frontTopY = BASE_FRONT_TOP_Y * heightRatio;

    // Pre-compute layout per unique depth (0–4) — 5 iterations instead of 8
    const depthLayouts = new Array(VISIBLE_DEPTH + 1);
    for (let depth = 0; depth <= VISIBLE_DEPTH; depth++) {
      const scale = DEPTH_SCALES[depth];
      let rightEdgeDelta = 0;
      if (depth >= 1 && depth <= 3) {
        rightEdgeDelta = BASE_RIGHT_EDGE_DELTAS[depth] * widthRatio * spreadClamped;
        if (depth === 1) {
          rightEdgeDelta -= SECOND_ROW_PULL_IN * widthRatio * spreadClamped;
        }
        rightEdgeDelta = Math.max(rightEdgeDelta, 56 * widthRatio);
      }
      const topDelta = BASE_TOP_DELTAS[depth] * heightRatio;
      const xFromEdges = rightEdgeDelta + (cardWidth * (1 - scale)) / 2;
      const yBase = frontTopY + topDelta + (cardHeight * (scale - 1)) / 2;
      const maxAllowedX = Math.max(0, (contentWidth - cardWidth * scale) / 2 - 8);
      const xMagnitude = depth === 4 ? 0 : Math.min(xFromEdges, maxAllowedX);
      depthLayouts[depth] = { xMagnitude, yBase, scale };
    }

    // Pass 1: measure stack bounds
    let minVisualTop = Number.POSITIVE_INFINITY;
    let maxVisualBottom = Number.NEGATIVE_INFINITY;

    cardElements.forEach((card, index) => {
      const offset = getCyclicOffset(index, activeIndex, cardElements.length);
      const depth = Math.abs(offset);
      if (depth > VISIBLE_DEPTH) return;

      const { yBase, scale } = depthLayouts[depth];
      const cardH = card.offsetHeight || BASE_CARD_HEIGHT;
      const visualTop = yBase - (cardH * (scale - 1)) / 2;
      const visualBottom = visualTop + cardH * scale;

      minVisualTop = Math.min(minVisualTop, visualTop);
      maxVisualBottom = Math.max(maxVisualBottom, visualBottom);
    });

    const stackOffsetY = Number.isFinite(minVisualTop) ? -minVisualTop : 0;
    const requiredHeight = Number.isFinite(maxVisualBottom)
      ? Math.max(1, Math.ceil(maxVisualBottom - minVisualTop))
      : 1;

    if (root.clientHeight !== requiredHeight) {
      root.style.height = `${requiredHeight}px`;
    }

    // Pass 2: apply styles
    cardElements.forEach((card, index) => {
      const offset = getCyclicOffset(index, activeIndex, cardElements.length);
      const depth = Math.abs(offset);

      if (depth > VISIBLE_DEPTH) {
        if (!cardHidden[index]) {
          card.classList.remove("is-active");
          card.classList.remove("is-visible");
          card.style.opacity = "0";
          card.style.pointerEvents = "none";
          card.style.zIndex = "1";
          card.style.transform = "translate3d(-50%, 0, 0) scale(0.58)";
          card.style.setProperty("--content-opacity", "0");
          card.style.setProperty("--shadow-alpha", "0");
          cardHidden[index] = true;
        }
        return;
      }

      cardHidden[index] = false;
      const { xMagnitude, yBase, scale } = depthLayouts[depth];
      const x = xMagnitude * Math.sign(offset);
      const y = yBase + stackOffsetY;

      card.classList.toggle("is-active", depth === 0);
      card.classList.add("is-visible");
      card.style.opacity = "1";
      card.style.pointerEvents = "auto";
      card.style.zIndex = String(100 - depth);
      card.style.transform = `translate3d(calc(-50% + ${x}px), ${y}px, 0) scale(${scale})`;
      card.style.setProperty("--content-opacity", String(DEPTH_CONTENT_OPACITY[depth]));
      card.style.setProperty("--shadow-alpha", String(DEPTH_SHADOW_ALPHA[depth]));
    });

    updateProgressBars();
  };

  const setActiveIndex = (nextIndex) => {
    // Reset old active progress bar before switching
    const prevFill = progressElements[activeIndex];
    if (prevFill) prevFill.style.transform = "scaleX(0)";

    activeIndex = (nextIndex + cardElements.length) % cardElements.length;
    progress = 0;
    render();
  };

  const step = (direction) => {
    setActiveIndex(activeIndex + direction);
  };

  const tick = (time) => {
    if (!isVisible || document.hidden) {
      rafId = null;
      return;
    }

    const delta = time - lastFrameTime;
    lastFrameTime = time;

    if (!prefersReducedMotion && !isPointerDown) {
      progress += delta / AUTO_PLAY_MS;

      if (progress >= 1) {
        step(1);
      } else {
        updateProgressBars();
      }
    }

    rafId = requestAnimationFrame(tick);
  };

  const startTicker = () => {
    if (rafId !== null) return;
    if (!isVisible || document.hidden) return;
    lastFrameTime = performance.now();
    rafId = requestAnimationFrame(tick);
  };

  const stopTicker = () => {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  };

  const handleResize = () => {
    render();
  };

  const getCardIndexFromTarget = (target) => {
    if (!(target instanceof Element)) return null;
    const card = target.closest(".principle-card");
    if (!card || !root.contains(card)) return null;

    const cardIndex = Number(card.dataset.index);
    return Number.isInteger(cardIndex) ? cardIndex : null;
  };

  const handlePointerDown = (event) => {
    isPointerDown = true;
    pointerAnchorX = event.clientX;
    movedDuringPointer = false;
    pointerDownCardIndex = getCardIndexFromTarget(event.target);
    root.classList.add("is-grabbing");
    root.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isPointerDown) return;
    let delta = event.clientX - pointerAnchorX;

    while (delta <= -DRAG_STEP_THRESHOLD) {
      step(1);
      pointerAnchorX -= DRAG_STEP_THRESHOLD;
      movedDuringPointer = true;
      delta = event.clientX - pointerAnchorX;
    }

    while (delta >= DRAG_STEP_THRESHOLD) {
      step(-1);
      pointerAnchorX += DRAG_STEP_THRESHOLD;
      movedDuringPointer = true;
      delta = event.clientX - pointerAnchorX;
    }
  };

  const handlePointerEnd = (event) => {
    if (!isPointerDown) return;

    isPointerDown = false;
    root.classList.remove("is-grabbing");
    if (!movedDuringPointer && pointerDownCardIndex !== null && pointerDownCardIndex !== activeIndex) {
      setActiveIndex(pointerDownCardIndex);
      ignoreNextClick = true;
    } else if (movedDuringPointer) {
      ignoreNextClick = true;
    }
    pointerDownCardIndex = null;

    if (root.hasPointerCapture(event.pointerId)) {
      root.releasePointerCapture(event.pointerId);
    }
  };

  const handleCardClick = (event) => {
    if (ignoreNextClick) {
      ignoreNextClick = false;
      return;
    }

    const card = event.target.closest(".principle-card");
    if (!card || !root.contains(card)) return;

    const clickedIndex = Number(card.dataset.index);
    if (!Number.isInteger(clickedIndex)) return;
    if (clickedIndex === activeIndex) return;

    setActiveIndex(clickedIndex);
  };

  const handleKeydown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  };

  const handleVisibilityChange = () => {
    lastFrameTime = performance.now();
    if (document.hidden) {
      stopTicker();
      return;
    }

    startTicker();
  };

  const viewportObserver = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      isVisible = Boolean(entry?.isIntersecting);

      if (!isVisible) {
        stopTicker();
        return;
      }

      startTicker();
    },
    { threshold: 0.15 }
  );

  viewportObserver.observe(root);

  window.addEventListener("resize", handleResize);
  document.addEventListener("visibilitychange", handleVisibilityChange, { passive: true });
  root.addEventListener("pointerdown", handlePointerDown);
  root.addEventListener("pointermove", handlePointerMove);
  root.addEventListener("pointerup", handlePointerEnd);
  root.addEventListener("pointercancel", handlePointerEnd);
  root.addEventListener("keydown", handleKeydown);
  root.addEventListener("click", handleCardClick);

  render();

  const initialRect = root.getBoundingClientRect();
  isVisible = initialRect.top < window.innerHeight && initialRect.bottom > 0;
  startTicker();
}
