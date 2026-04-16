import { clamp, prefersReducedMotion } from "./utils.js";
import { getGsapRuntime } from "./gsap-runtime.js";

const FIGMA_STAGE_DASH_PATTERN = "10 10";
const FIGMA_STAGE_DASH = 10;
const FIGMA_STAGE_GAP = 10;

const BADGE_START_SCALE = 0.3;
const BADGE_OFFSET_Y = 26;
const TEXT_OFFSET_Y = 18;
const WORK_STAGES_SCROLL_MULTIPLIER = 2;

const SEQUENCE_UNITS = {
  badge: 14,
  title: 10,
  text: 14,
  line: 36
};

const roundDashValue = (value) => Number(value.toFixed(3));

const buildDashedRevealPattern = (visibleLength, totalLength) => {
  if (totalLength <= 0 || visibleLength <= 0) {
    return `0 ${roundDashValue(totalLength + 2)}`;
  }

  let remain = Math.min(visibleLength, totalLength);
  const parts = [];

  while (remain > 0) {
    const draw = Math.min(FIGMA_STAGE_DASH, remain);
    parts.push(roundDashValue(draw));
    remain -= draw;

    if (remain <= 0) break;

    const gap = Math.min(FIGMA_STAGE_GAP, remain);
    parts.push(roundDashValue(gap));
    remain -= gap;
  }

  const consumed = Math.min(visibleLength, totalLength);
  const tailGap = roundDashValue(Math.max(totalLength - consumed, 0) + 2);

  if (parts.length % 2 === 1) {
    parts.push(tailGap);
  } else {
    parts.push(0, tailGap);
  }

  return parts.join(" ");
};

const createSequence = (stagesCount, linesCount) => {
  const ranges = {
    badge: Array.from({ length: stagesCount }, () => ({ start: 0, end: 0 })),
    title: Array.from({ length: stagesCount }, () => ({ start: 0, end: 0 })),
    text: Array.from({ length: stagesCount }, () => ({ start: 0, end: 0 })),
    line: Array.from({ length: linesCount }, () => ({ start: 0, end: 0 }))
  };

  let cursor = 0;

  for (let index = 0; index < stagesCount; index += 1) {
    ranges.badge[index] = { start: cursor, end: cursor + SEQUENCE_UNITS.badge };
    cursor += SEQUENCE_UNITS.badge;

    ranges.title[index] = { start: cursor, end: cursor + SEQUENCE_UNITS.title };
    cursor += SEQUENCE_UNITS.title;

    ranges.text[index] = { start: cursor, end: cursor + SEQUENCE_UNITS.text };
    cursor += SEQUENCE_UNITS.text;

    if (index < linesCount) {
      ranges.line[index] = { start: cursor, end: cursor + SEQUENCE_UNITS.line };
      cursor += SEQUENCE_UNITS.line;
    }
  }

  return { ranges, totalUnits: Math.max(cursor, 1) };
};

const getRangeProgress = (progress, range, totalUnits) => {
  const scaled = progress * totalUnits;
  if (scaled <= range.start) return 0;
  if (scaled >= range.end) return 1;
  const length = Math.max(range.end - range.start, 0.0001);
  return (scaled - range.start) / length;
};

export function initWorkStagesAnimation() {
  const section = document.querySelector("[data-work-stages]");
  const sticky = section?.querySelector(".work-stages__sticky");
  const inner = section?.querySelector(".work-stages__inner");
  const headingWrap = section?.querySelector(".work-stages__heading-wrap");
  const viewport = section?.querySelector(".work-stages__viewport");
  const track = section?.querySelector("[data-stage-track]");
  const stages = Array.from(section?.querySelectorAll("[data-stage]") || []);
  const paths = Array.from(section?.querySelectorAll("[data-stage-path]") || []);

  if (!section || !sticky || !inner || !headingWrap || !viewport || !track || stages.length === 0) return;

  const runtime = getGsapRuntime();
  if (!runtime?.ScrollTrigger || prefersReducedMotion) return;

  let trigger = null;
  const pathLengths = [];

  const stageNodes = stages.map((stage) => ({
    stage,
    number: stage.querySelector(".work-stage__number"),
    title: stage.querySelector(".work-stage__desc h3"),
    text: stage.querySelector(".work-stage__desc p")
  }));

  const resetInlineStyles = () => {
    inner.style.removeProperty("transform");
    headingWrap.style.removeProperty("transform");
    track.style.removeProperty("transform");

    stageNodes.forEach(({ number, title, text }) => {
      if (number) {
        number.style.removeProperty("opacity");
        number.style.removeProperty("transform");
      }
      if (title) {
        title.style.removeProperty("opacity");
        title.style.removeProperty("transform");
      }
      if (text) {
        text.style.removeProperty("opacity");
        text.style.removeProperty("transform");
      }
    });

    paths.forEach((path) => {
      path.style.removeProperty("stroke-dasharray");
      path.style.removeProperty("stroke-dashoffset");
      path.style.removeProperty("opacity");
    });
  };

  const destroy = () => {
    if (trigger) {
      trigger.kill();
      trigger = null;
    }

    section.style.removeProperty("height");
    resetInlineStyles();
  };

  const setup = () => {
    destroy();
    if (window.innerWidth <= 1200) return;

    const maxShift = Math.max(0, inner.scrollWidth - sticky.clientWidth);
    // Move the heading so its center reaches the block center.
    const headingDropY = Math.max(0, (viewport.clientHeight - headingWrap.offsetHeight) * 0.5);

    const headingDistance = Math.max(window.innerHeight * 0.45, 360) * WORK_STAGES_SCROLL_MULTIPLIER;
    const stagesDistance = Math.max(maxShift + window.innerHeight * 1.2, window.innerHeight * 2.2) * WORK_STAGES_SCROLL_MULTIPLIER;
    const fullDistance = headingDistance + stagesDistance;
    const headingRatio = headingDistance / fullDistance;

    section.style.height = `${Math.ceil(fullDistance + window.innerHeight * 1.2)}px`;

    const sequence = createSequence(stageNodes.length, paths.length);

    pathLengths.length = 0;
    paths.forEach((path) => {
      const length = path.getTotalLength();
      pathLengths.push(length);
      path.style.strokeDasharray = buildDashedRevealPattern(0, length);
      path.style.strokeDashoffset = "0";
      path.style.opacity = "1";
    });

    stageNodes.forEach(({ number, title, text }) => {
      if (number) {
        number.style.opacity = "0";
        number.style.transform = `translateY(${BADGE_OFFSET_Y}px) scale(${BADGE_START_SCALE})`;
      }
      if (title) {
        title.style.opacity = "0";
        title.style.transform = `translateY(${TEXT_OFFSET_Y}px)`;
      }
      if (text) {
        text.style.opacity = "0";
        text.style.transform = `translateY(${TEXT_OFFSET_Y}px)`;
      }
    });

    headingWrap.style.transform = "translate3d(0, 0, 0)";
    inner.style.transform = "translate3d(0, 0, 0)";

    trigger = runtime.ScrollTrigger.create({
      trigger: viewport,
      start: "center center",
      end: `+=${fullDistance}`,
      scrub: 0.9,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const progress = clamp(self.progress, 0, 1);

        const headingProgress = clamp(progress / headingRatio, 0, 1);
        const stagesProgress = clamp((progress - headingRatio) / (1 - headingRatio), 0, 1);

        headingWrap.style.transform = `translate3d(0, ${headingDropY * headingProgress}px, 0)`;

        const x = -maxShift * stagesProgress;
        inner.style.transform = `translate3d(${x}px, 0, 0)`;

        stageNodes.forEach(({ number, title, text }, index) => {
          const badgeProgress = getRangeProgress(stagesProgress, sequence.ranges.badge[index], sequence.totalUnits);
          const titleProgress = getRangeProgress(stagesProgress, sequence.ranges.title[index], sequence.totalUnits);
          const textProgress = getRangeProgress(stagesProgress, sequence.ranges.text[index], sequence.totalUnits);

          if (number) {
            const scale = BADGE_START_SCALE + (1 - BADGE_START_SCALE) * badgeProgress;
            const y = (1 - badgeProgress) * BADGE_OFFSET_Y;
            number.style.opacity = String(badgeProgress);
            number.style.transform = `translateY(${y}px) scale(${scale})`;
          }

          if (title) {
            title.style.opacity = String(titleProgress);
            title.style.transform = `translateY(${(1 - titleProgress) * TEXT_OFFSET_Y}px)`;
          }

          if (text) {
            text.style.opacity = String(textProgress);
            text.style.transform = `translateY(${(1 - textProgress) * TEXT_OFFSET_Y}px)`;
          }
        });

        paths.forEach((path, index) => {
          const lineProgress = getRangeProgress(stagesProgress, sequence.ranges.line[index], sequence.totalUnits);
          const length = pathLengths[index] || 0;
          const visibleLength = length * lineProgress;

          if (lineProgress >= 0.999) {
            path.style.strokeDasharray = FIGMA_STAGE_DASH_PATTERN;
          } else {
            path.style.strokeDasharray = buildDashedRevealPattern(visibleLength, length);
          }

          path.style.strokeDashoffset = "0";
        });
      }
    });
  };

  setup();
  window.addEventListener("resize", setup);
}
