import { clamp, prefersReducedMotion } from "./utils.js";
import { getGsapRuntime } from "./gsap-runtime.js";

const FIGMA_STAGE_DASH_PATTERN = "10 10";
const FIGMA_STAGE_DASH = 10;
const FIGMA_STAGE_GAP = 10;

const BADGE_START_SCALE = 0.3;
const BADGE_OFFSET_Y = 26;
const TEXT_OFFSET_Y = 18;
const WORK_STAGES_SCROLL_MULTIPLIER = 2;
const STAGE_REVEAL_THRESHOLD = 0.995;
const STAGE_HIDE_THRESHOLD = 0.96;

const SEQUENCE_UNITS = {
  badge: 14,
  title: 10,
  text: 14,
  line: 36
};

const MOBILE_SEQUENCE_UNITS = {
  badge: 0,
  title: 0,
  text: 0,
  line: SEQUENCE_UNITS.line
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

const createSequence = (stagesCount, linesCount, units = SEQUENCE_UNITS) => {
  const ranges = {
    badge: Array.from({ length: stagesCount }, () => ({ start: 0, end: 0 })),
    title: Array.from({ length: stagesCount }, () => ({ start: 0, end: 0 })),
    text: Array.from({ length: stagesCount }, () => ({ start: 0, end: 0 })),
    line: Array.from({ length: linesCount }, () => ({ start: 0, end: 0 }))
  };

  let cursor = 0;

  for (let index = 0; index < stagesCount; index += 1) {
    ranges.badge[index] = { start: cursor, end: cursor + units.badge };
    cursor += units.badge;

    ranges.title[index] = { start: cursor, end: cursor + units.title };
    cursor += units.title;

    ranges.text[index] = { start: cursor, end: cursor + units.text };
    cursor += units.text;

    if (index < linesCount) {
      ranges.line[index] = { start: cursor, end: cursor + units.line };
      cursor += units.line;
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
  const pathsLayer = section?.querySelector(".work-stages__paths");
  const track = section?.querySelector("[data-stage-track]");
  const stages = Array.from(section?.querySelectorAll("[data-stage]") || []);
  const paths = Array.from(section?.querySelectorAll("[data-stage-path]") || []);

  if (!section || !sticky || !inner || !headingWrap || !viewport || !pathsLayer || !track || stages.length === 0)
    return;

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
    track.style.removeProperty("transform");
    pathsLayer.style.removeProperty("transform");

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

    const viewportHeight = Math.max(window.innerHeight, 1);
    const availableViewportWidth = Math.max(0, sticky.clientWidth - headingWrap.clientWidth);
    const maxShift = Math.max(0, viewport.scrollWidth - availableViewportWidth);
    const stickyHeight = Math.max(sticky.offsetHeight, 1);
    const stickyTopOffset = Math.max(0, (viewportHeight - stickyHeight) * 0.5);

    const fullDistance = Math.max(maxShift * WORK_STAGES_SCROLL_MULTIPLIER, viewportHeight * 1.2);
    section.style.height = `${Math.ceil(fullDistance + stickyHeight)}px`;

    const useMobileSequence = window.matchMedia("(max-width: 991px)").matches;
    const sequence = createSequence(
      stageNodes.length,
      paths.length,
      useMobileSequence ? MOBILE_SEQUENCE_UNITS : SEQUENCE_UNITS
    );
    const mobileLineEnds = [];

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

    inner.style.transform = "translate3d(0, 0, 0)";

    if (useMobileSequence) {
      const screenRightEdge = window.innerWidth;
      let previousEnd = 0;

      paths.forEach((_path, index) => {
        const nextStageNumber = stageNodes[index + 1]?.number;
        if (!nextStageNumber || maxShift <= 0) {
          mobileLineEnds[index] = 1;
          previousEnd = 1;
          return;
        }

        const nextNumberLeftAtStart = nextStageNumber.getBoundingClientRect().left;
        const entryProgress = clamp((nextNumberLeftAtStart - screenRightEdge) / maxShift, 0, 1);
        const normalizedEnd = Math.max(previousEnd + 0.0001, entryProgress);
        mobileLineEnds[index] = clamp(normalizedEnd, 0, 1);
        previousEnd = mobileLineEnds[index];
      });
    }

    const stageRevealed = Array.from({ length: stageNodes.length }, () => false);
    const stageTimelines = Array.from({ length: stageNodes.length }, () => null);

    const resetStage = (index) => {
      const stageTimeline = stageTimelines[index];
      if (stageTimeline) {
        stageTimeline.kill();
        stageTimelines[index] = null;
      }

      const { number, title, text } = stageNodes[index];
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
    };

    const revealStage = (index) => {
      resetStage(index);

      const { number, title, text } = stageNodes[index];
      const timeline = runtime.gsap.timeline({ defaults: { ease: "power3.out" } });

      if (number) {
        timeline.to(
          number,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1
          },
          0
        );
      }

      if (title) {
        timeline.to(
          title,
          {
            opacity: 1,
            y: 0,
            duration: 0.5
          },
          1
        );
      }

      if (text) {
        timeline.to(
          text,
          {
            opacity: 1,
            y: 0,
            duration: 0.5
          },
          1.5
        );
      }

      stageTimelines[index] = timeline;
    };

    const applyProgress = (rawProgress) => {
      const stagesProgress = clamp(rawProgress, 0, 1);

      const x = -maxShift * stagesProgress;
      inner.style.transform = `translate3d(${x}px, 0, 0)`;

      const lineProgresses = Array.from({ length: paths.length }, () => 0);

      paths.forEach((path, index) => {
        const lineProgress = useMobileSequence
          ? (() => {
              const start = index === 0 ? 0 : mobileLineEnds[index - 1] || 0;
              const end = mobileLineEnds[index] || 1;
              const span = Math.max(end - start, 0.0001);
              return clamp((stagesProgress - start) / span, 0, 1);
            })()
          : getRangeProgress(stagesProgress, sequence.ranges.line[index], sequence.totalUnits);
        lineProgresses[index] = lineProgress;
        const length = pathLengths[index] || 0;
        const visibleLength = length * lineProgress;

        if (lineProgress >= 0.999) {
          path.style.strokeDasharray = FIGMA_STAGE_DASH_PATTERN;
        } else {
          path.style.strokeDasharray = buildDashedRevealPattern(visibleLength, length);
        }

        path.style.strokeDashoffset = "0";
      });

      stageNodes.forEach((_stageNode, index) => {
        const shouldReveal = index === 0 ? stagesProgress > 0.0001 : lineProgresses[index - 1] >= STAGE_REVEAL_THRESHOLD;
        const shouldHide = index === 0 ? stagesProgress <= 0.0001 : lineProgresses[index - 1] <= STAGE_HIDE_THRESHOLD;

        if (shouldReveal && !stageRevealed[index]) {
          stageRevealed[index] = true;
          revealStage(index);
          return;
        }

        if (shouldHide && stageRevealed[index]) {
          stageRevealed[index] = false;
          resetStage(index);
        }
      });
    };

    trigger = runtime.ScrollTrigger.create({
      trigger: section,
      start: `top top+=${stickyTopOffset}`,
      end: `+=${fullDistance}`,
      scrub: true,
      invalidateOnRefresh: true,
      onRefresh: (self) => applyProgress(self.progress),
      onUpdate: (self) => applyProgress(self.progress)
    });

    applyProgress(0);
  };

  setup();
  window.addEventListener("resize", setup);
  window.addEventListener("load", setup, { once: true });
}
