import { clamp, prefersReducedMotion } from "./utils.js";

function normalizeLine(line) {
  return line.replace(/[\t\r\n]+/g, " ").replace(/ {2,}/g, " ").trim();
}

function extractTextLines(element) {
  const lines = [];
  let currentLine = "";

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      currentLine += node.textContent || "";
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    if (node.tagName === "BR") {
      lines.push(currentLine);
      currentLine = "";
      return;
    }

    node.childNodes.forEach(walk);
  };

  element.childNodes.forEach(walk);
  lines.push(currentLine);

  return lines.map(normalizeLine).filter(Boolean);
}

function splitElementToChars(element) {
  const lines = extractTextLines(element);
  if (!lines.length) return [];

  const fragment = document.createDocumentFragment();
  const chars = [];

  lines.forEach((line, lineIndex) => {
    Array.from(line).forEach((char) => {
      const span = document.createElement("span");
      span.className = "brand-block__char";
      span.textContent = char;
      chars.push(span);
      fragment.appendChild(span);
    });

    if (lineIndex < lines.length - 1) {
      fragment.appendChild(document.createElement("br"));
    }
  });

  element.textContent = "";
  element.appendChild(fragment);
  return chars;
}

export function initBrandBlockReveal() {
  const section = document.querySelector(".brand-block");
  if (!section) return;

  const targets = Array.from(section.querySelectorAll(".brand-block__name, .brand-block__tagline"));
  if (!targets.length) return;

  const charGroups = targets.map(splitElementToChars).filter((group) => group.length > 0);
  if (!charGroups.length) return;
  const nameRevealShare = charGroups.length > 1 ? 0.66 : 1;
  const trailingShare = charGroups.length > 1 ? (1 - nameRevealShare) / (charGroups.length - 1) : 0;
  const groupRanges = charGroups.map((_, index) => {
    if (charGroups.length === 1) {
      return { start: 0, end: 1 };
    }

    if (index === 0) {
      return { start: 0, end: nameRevealShare };
    }

    const start = nameRevealShare + trailingShare * (index - 1);
    return { start, end: start + trailingShare };
  });

  if (prefersReducedMotion) {
    charGroups.forEach((group) => {
      group.forEach((node) => {
        node.style.opacity = "1";
      });
    });
    return;
  }

  let ticking = false;

  const paintGroup = (group, progress) => {
    const totalChars = group.length;
    const charProgress = progress * totalChars;
    const fullChars = Math.floor(charProgress);
    const partial = clamp(charProgress - fullChars, 0, 1);

    group.forEach((node, index) => {
      if (index < fullChars) {
        node.style.opacity = "1";
      } else if (index === fullChars) {
        node.style.opacity = partial.toFixed(3);
      } else {
        node.style.opacity = "0";
      }
    });
  };

  const paintByProgress = (progress) => {
    charGroups.forEach((group, index) => {
      const range = groupRanges[index];
      const groupProgress = clamp((progress - range.start) / (range.end - range.start), 0, 1);
      paintGroup(group, groupProgress);
    });
  };

  const updateProgress = () => {
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const startLine = viewportHeight;
    const endLine = viewportHeight * 0.5 - rect.height * 0.5;
    const distance = Math.max(1, startLine - endLine);
    const linearProgress = clamp((startLine - rect.top) / distance, 0, 1);
    const progress = Math.pow(linearProgress, 1.15);

    paintByProgress(progress);
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateProgress);
  };

  paintByProgress(0);
  updateProgress();

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}
