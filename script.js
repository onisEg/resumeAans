// Plain JavaScript — no framework or build step needed.
const allWindows = document.querySelectorAll('.window');
const desktopElement = document.getElementById('desktop');
const dockTooltip = document.getElementById('dock-tooltip');
const mobileBreakpoint = 700;
let highestZIndex = 200;
let cascadeCounter = 0;

/* ---------- Open / close / focus windows ---------- */
function bringToFront(windowElement) {
  highestZIndex += 1;
  windowElement.style.zIndex = String(highestZIndex);
}

function updateDockIndicators() {
  document.querySelectorAll('.dock-item[data-toggle]').forEach(dockButton => {
    const targetWindow = document.getElementById(`window-${dockButton.dataset.toggle}`);
    dockButton.classList.toggle('is-open', Boolean(targetWindow && !targetWindow.hidden));
  });
}

function openWindow(windowName) {
  const windowElement = document.getElementById(`window-${windowName}`);
  if (!windowElement) return;

  const wasHidden = windowElement.hidden;
  windowElement.hidden = false;
  bringToFront(windowElement);

  // Each newly opened window lands slightly offset from the last one.
  if (wasHidden && window.innerWidth > mobileBreakpoint && !windowElement.classList.contains('is-maximized')) {
    const offsetInPixels = (cascadeCounter % 5) * 24;
    cascadeCounter += 1;
    // Keep the window clear of the menu bar and the dock.
    const topInPixels = Math.min(70 + offsetInPixels, 150);
    windowElement.style.top = `${topInPixels}px`;
    windowElement.style.maxHeight = `min(720px, calc(100% - ${topInPixels + 100}px))`;
    windowElement.style.left = `calc(50% + ${offsetInPixels}px)`;
    windowElement.style.transform = 'translateX(-50%)';
  }
  updateDockIndicators();
}

function closeWindow(windowElement) {
  windowElement.hidden = true;
  windowElement.classList.remove('is-maximized');
  updateDockIndicators();
}

function isTopWindow(windowElement) {
  const openWindows = [...allWindows].filter(otherWindow => !otherWindow.hidden);
  return openWindows.every(otherWindow => Number(otherWindow.style.zIndex) <= Number(windowElement.style.zIndex));
}

// Dock buttons: open the window, or close it if it's already open on top.
// If it's open but hidden behind another window, the first click brings it forward.
function toggleWindow(windowName) {
  const windowElement = document.getElementById(`window-${windowName}`);
  if (!windowElement) return;
  if (windowElement.hidden) {
    openWindow(windowName);
  } else if (isTopWindow(windowElement)) {
    closeWindow(windowElement);
  } else {
    bringToFront(windowElement);
  }
}

document.addEventListener('click', event => {
  const openTrigger = event.target.closest('[data-open]');
  if (openTrigger) openWindow(openTrigger.dataset.open);

  const toggleTrigger = event.target.closest('[data-toggle]');
  if (toggleTrigger) toggleWindow(toggleTrigger.dataset.toggle);

  const closeButton = event.target.closest('[data-close]');
  if (closeButton) closeWindow(closeButton.closest('.window'));

  const maximizeButton = event.target.closest('[data-maximize]');
  if (maximizeButton) maximizeButton.closest('.window').classList.toggle('is-maximized');

  const clickedWindow = event.target.closest('.window');
  if (clickedWindow && !closeButton) bringToFront(clickedWindow);
});

// Escape closes the window that is on top.
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const openWindows = [...allWindows].filter(windowElement => !windowElement.hidden);
  openWindows.sort((first, second) => Number(second.style.zIndex) - Number(first.style.zIndex));
  if (openWindows.length) closeWindow(openWindows[0]);
});

/* ---------- Drag windows by the title bar (desktop only) ---------- */
allWindows.forEach(windowElement => {
  const titleBar = windowElement.querySelector('.window-bar');
  let dragState = null;

  titleBar.addEventListener('pointerdown', event => {
    const isButton = event.target.closest('button');
    const isMaximized = windowElement.classList.contains('is-maximized');
    if (isButton || isMaximized || window.innerWidth <= mobileBreakpoint) return;

    event.preventDefault();
    bringToFront(windowElement);
    const windowBounds = windowElement.getBoundingClientRect();
    const desktopBounds = desktopElement.getBoundingClientRect();
    const startLeft = windowBounds.left - desktopBounds.left;
    const startTop = windowBounds.top - desktopBounds.top;

    windowElement.style.left = `${startLeft}px`;
    windowElement.style.top = `${startTop}px`;
    windowElement.style.transform = 'none';
    dragState = { pointerStartX: event.clientX, pointerStartY: event.clientY, startLeft, startTop };
    titleBar.setPointerCapture(event.pointerId);
  });

  titleBar.addEventListener('pointermove', event => {
    if (!dragState) return;
    const maxLeft = desktopElement.clientWidth - windowElement.offsetWidth;
    const maxTop = desktopElement.clientHeight - 80;
    const nextLeft = dragState.startLeft + event.clientX - dragState.pointerStartX;
    const nextTop = dragState.startTop + event.clientY - dragState.pointerStartY;
    windowElement.style.left = `${Math.max(0, Math.min(maxLeft, nextLeft))}px`;
    const clampedTop = Math.max(34, Math.min(maxTop, nextTop));
    windowElement.style.top = `${clampedTop}px`;
    windowElement.style.maxHeight = `min(720px, calc(100% - ${Math.max(clampedTop, 70) + 100}px))`;
  });

  const stopDragging = () => { dragState = null; };
  titleBar.addEventListener('pointerup', stopDragging);
  titleBar.addEventListener('pointercancel', stopDragging);

  // Double-click the title bar to maximize / restore.
  titleBar.addEventListener('dblclick', event => {
    if (event.target.closest('button') || window.innerWidth <= mobileBreakpoint) return;
    windowElement.classList.toggle('is-maximized');
  });
});

/* ---------- Dock tooltip ---------- */
document.querySelectorAll('.dock-item').forEach(dockButton => {
  dockButton.addEventListener('mouseenter', () => { dockTooltip.textContent = dockButton.dataset.tip; });
  dockButton.addEventListener('mouseleave', () => { dockTooltip.textContent = 'open me'; });
});

/* ---------- Light / dark theme (remembered between visits) ---------- */
const themeToggleButton = document.getElementById('theme-toggle');
const themeStorageKey = 'anas-portfolio-theme';

function applyTheme(themeName) {
  const isLight = themeName === 'light';
  desktopElement.classList.toggle('light', isLight);
  themeToggleButton.textContent = isLight ? '☾' : '☀';
  themeToggleButton.dataset.tip = isLight ? 'Dark mode' : 'Light mode';
}

function readSavedTheme() {
  try { return localStorage.getItem(themeStorageKey); } catch { return null; }
}

applyTheme(readSavedTheme() || 'dark');

themeToggleButton.addEventListener('click', () => {
  const nextTheme = desktopElement.classList.contains('light') ? 'dark' : 'light';
  applyTheme(nextTheme);
  dockTooltip.textContent = themeToggleButton.dataset.tip;
  try { localStorage.setItem(themeStorageKey, nextTheme); } catch { /* storage unavailable */ }
});

/* ---------- Clock in the menu bar ---------- */
const clockElement = document.getElementById('clock');
function updateClock() {
  clockElement.textContent = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(new Date());
}
updateClock();
setInterval(updateClock, 30000);

/* ---------- Terminal widget: types a few commands ---------- */
const terminalBody = document.getElementById('terminal-body');
const terminalScript = [
  { command: 'whoami', output: 'anas — frontend developer' },
  { command: 'cat stack.txt', output: 'react · typescript · tailwind' },
  { command: 'pwd', output: '/barcelona/spain' },
  { command: 'status', output: 'open to work ✔' }
];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function createLine(className, text) {
  const lineElement = document.createElement('div');
  if (className) lineElement.className = className;
  lineElement.textContent = text;
  return lineElement;
}

function createPromptLine() {
  const lineElement = document.createElement('div');
  const promptSymbol = document.createElement('span');
  promptSymbol.className = 'prompt';
  promptSymbol.textContent = '$ ';
  const commandText = document.createElement('span');
  lineElement.append(promptSymbol, commandText);
  return { lineElement, commandText };
}

async function runTerminal() {
  // Small screens show a shorter session so the widget doesn't cover the title.
  const visibleSteps = window.innerWidth <= mobileBreakpoint ? terminalScript.slice(0, 2) : terminalScript;
  for (const step of visibleSteps) {
    const { lineElement, commandText } = createPromptLine();
    terminalBody.appendChild(lineElement);
    if (prefersReducedMotion) {
      commandText.textContent = step.command;
    } else {
      for (const character of step.command) {
        commandText.textContent += character;
        await wait(70);
      }
      await wait(250);
    }
    terminalBody.appendChild(createLine('output', step.output));
    if (!prefersReducedMotion) await wait(450);
  }
  const { lineElement } = createPromptLine();
  const caret = document.createElement('span');
  caret.className = 'terminal-caret';
  lineElement.appendChild(caret);
  terminalBody.appendChild(lineElement);
}

/* ---------- Boot screen: plays once per visit, then starts the terminal ---------- */
const bootScreen = document.getElementById('boot-screen');
const bootProgressFill = document.getElementById('boot-progress-fill');
const bootLog = document.getElementById('boot-log');
const bootSessionKey = 'anas-portfolio-booted';
const bootSteps = [
  { progress: 18, message: 'loading kernel…' },
  { progress: 37, message: 'loading react & typescript…' },
  { progress: 58, message: 'mounting ~/projects…' },
  { progress: 79, message: 'starting window manager…' },
  { progress: 100, message: 'welcome, visitor ✔' }
];

function hasBootedThisSession() {
  try { return sessionStorage.getItem(bootSessionKey) === 'yes'; } catch { return false; }
}

function finishBoot() {
  bootScreen.classList.add('is-done');
  desktopElement.classList.remove('is-booting');
  try { sessionStorage.setItem(bootSessionKey, 'yes'); } catch { /* storage unavailable */ }
}

function runBootScreen() {
  return new Promise(resolve => {
    if (prefersReducedMotion || hasBootedThisSession()) {
      bootScreen.remove();
      resolve();
      return;
    }

    let isSkipped = false;
    const skipBoot = () => { isSkipped = true; };
    bootScreen.addEventListener('click', skipBoot);
    document.addEventListener('keydown', skipBoot, { once: true });
    desktopElement.classList.add('is-booting');

    (async () => {
      await wait(700); // let the logo fade in first
      for (const step of bootSteps) {
        if (isSkipped) break;
        bootProgressFill.style.width = `${step.progress}%`;
        bootLog.textContent = step.message;
        await wait(420);
      }
      bootProgressFill.style.width = '100%';
      if (!isSkipped) await wait(300);
      finishBoot();
      setTimeout(() => bootScreen.remove(), 700);
      resolve();
    })();
  });
}

runBootScreen().then(runTerminal);

/* =========================================================
   Mouse effects (desktop only, skipped for reduced motion)
   ========================================================= */
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const mouseEffectsEnabled = hasFinePointer && !prefersReducedMotion;
const smoothStep = value => value * value * (3 - 2 * value);

/* ---------- "ANAS." letters grow as the mouse gets close ---------- */
const heroLetters = [...document.querySelectorAll('.hero-letter')];
const letterReachInPixels = 220; // how far from the mouse letters start reacting
const letterGrowAmount = 0.18;   // closest letter grows 18%

function updateHeroLetters(pointerX, pointerY) {
  heroLetters.forEach(letter => {
    const letterBounds = letter.getBoundingClientRect();
    const letterCenterX = letterBounds.left + letterBounds.width / 2;
    const letterCenterY = letterBounds.top + letterBounds.height / 2;
    const distance = Math.hypot(pointerX - letterCenterX, (pointerY - letterCenterY) * 0.8);
    const closeness = smoothStep(Math.max(0, 1 - distance / letterReachInPixels));
    letter.style.transform = `translateY(${-closeness * 4}px) scale(${1 + closeness * letterGrowAmount})`;
    letter.style.marginInline = `${closeness * 0.1}em`; // push neighbours apart so they don't overlap
    letter.classList.toggle('is-hot', closeness > 0.55);
  });
}

function resetHeroLetters() {
  heroLetters.forEach(letter => {
    letter.style.transform = '';
    letter.style.marginInline = '';
    letter.classList.remove('is-hot');
  });
}

/* ---------- Dock magnifies like macOS ---------- */
const dockElement = document.querySelector('.dock');
const dockButtons = [...document.querySelectorAll('.dock-item')];
const dockReachInPixels = 130;
const dockGrowAmount = 0.4;

function updateDockMagnification(pointerX) {
  dockButtons.forEach(dockButton => {
    const buttonBounds = dockButton.getBoundingClientRect();
    const distance = Math.abs(pointerX - (buttonBounds.left + buttonBounds.width / 2));
    const closeness = smoothStep(Math.max(0, 1 - distance / dockReachInPixels));
    dockButton.style.transform = `translateY(${-closeness * 8}px) scale(${1 + closeness * dockGrowAmount})`;
    dockButton.style.marginInline = `${closeness * 9}px`; // make room so icons don't overlap
  });
}

function resetDockMagnification() {
  dockButtons.forEach(dockButton => {
    dockButton.style.transform = '';
    dockButton.style.marginInline = '';
  });
}

/* ---------- Cursor trail: small code-ish particles ---------- */
const trailLayer = document.getElementById('cursor-trail-layer');
const trailCharacters = ['+', '×', '·', '▪', '0', '1', '/'];
const trailColors = ['#ff6b2c', '#ff8a4d', '#4a7bb7', '#9aa3b2'];
let lastTrailTime = 0;

function spawnTrailParticle(pointerX, pointerY) {
  const now = performance.now();
  if (now - lastTrailTime < 32 || trailLayer.childElementCount > 50) return;
  lastTrailTime = now;

  const particle = document.createElement('span');
  particle.className = 'trail-particle';
  particle.textContent = trailCharacters[Math.floor(Math.random() * trailCharacters.length)];
  particle.style.left = `${pointerX}px`;
  particle.style.top = `${pointerY}px`;
  particle.style.color = trailColors[Math.floor(Math.random() * trailColors.length)];
  particle.style.fontSize = `${9 + Math.random() * 7}px`;
  particle.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 36}px`);
  particle.style.setProperty('--drift-y', `${10 + Math.random() * 26}px`);
  particle.style.setProperty('--spin', `${(Math.random() - 0.5) * 160}deg`);
  particle.addEventListener('animationend', () => particle.remove());
  trailLayer.appendChild(particle);
}

if (mouseEffectsEnabled) {
  let pendingFrame = null;
  let latestPointer = { x: 0, y: 0 };
  let isOverDock = false;

  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    latestPointer = { x: event.clientX, y: event.clientY };
    spawnTrailParticle(event.clientX, event.clientY);
    if (pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = null;
      updateHeroLetters(latestPointer.x, latestPointer.y);
      if (isOverDock) updateDockMagnification(latestPointer.x);
    });
  });
  document.addEventListener('pointerleave', resetHeroLetters);

  dockElement.addEventListener('pointerenter', () => { isOverDock = true; dockElement.classList.add('is-magnifying'); });
  dockElement.addEventListener('pointerleave', () => {
    isOverDock = false;
    dockElement.classList.remove('is-magnifying');
    resetDockMagnification();
  });
}

/* ---------- Drag desktop icons and the terminal around ---------- */
// A short press opens the icon; dragging more than a few pixels moves it instead.
function makeDraggable(element, handle) {
  let dragState = null;

  handle.addEventListener('pointerdown', event => {
    if (window.innerWidth <= mobileBreakpoint || event.button !== 0) return;
    const computedStyle = getComputedStyle(element);
    dragState = {
      pointerStartX: event.clientX,
      pointerStartY: event.clientY,
      startLeft: parseFloat(computedStyle.left),
      startTop: parseFloat(computedStyle.top),
      hasMoved: false
    };
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener('pointermove', event => {
    if (!dragState) return;
    const movedX = event.clientX - dragState.pointerStartX;
    const movedY = event.clientY - dragState.pointerStartY;
    if (!dragState.hasMoved && Math.abs(movedX) + Math.abs(movedY) < 5) return;
    dragState.hasMoved = true;
    element.classList.add('is-dragging');
    const maxLeft = desktopElement.clientWidth - 20;
    const maxTop = desktopElement.clientHeight - 60;
    element.style.left = `${Math.max(20, Math.min(maxLeft, dragState.startLeft + movedX))}px`;
    element.style.top = `${Math.max(40, Math.min(maxTop, dragState.startTop + movedY))}px`;
  });

  const stopDragging = () => {
    if (!dragState) return;
    element.classList.remove('is-dragging');
    if (dragState.hasMoved) element.dataset.justDragged = 'yes';
    dragState = null;
  };
  handle.addEventListener('pointerup', stopDragging);
  handle.addEventListener('pointercancel', stopDragging);

  // Swallow the click that follows a drag so the icon doesn't open.
  element.addEventListener('click', event => {
    if (element.dataset.justDragged === 'yes') {
      delete element.dataset.justDragged;
      event.stopPropagation();
      event.preventDefault();
    }
  }, true);
}

document.querySelectorAll('.desktop-icon').forEach(icon => makeDraggable(icon, icon));
const terminalWidget = document.querySelector('.terminal-widget');
makeDraggable(terminalWidget, terminalWidget.querySelector('.terminal-bar'));

/* ---------- Resume window: shows the CV pages with PDF.js ---------- */
// Browsers often refuse to show a PDF inside a frame and download it instead,
// so the pages are drawn onto <canvas> elements. To update a CV, replace the PDF
// in assets/cv/ keeping the same file name.
const resumeFiles = {
  en: { path: 'assets/cv/Anas_Alnagar_Frontend_Developer_CV_EN.pdf', label: 'Resume_EN.pdf' },
  es: { path: 'assets/cv/Anas_Alnagar_Desarrollador_Frontend_CV_ES.pdf', label: 'Resume_ES.pdf' }
};
// PDF.js 3.11 (Apache-2.0) is kept inside the project so it works without a CDN.
// If the local copy is missing, the same version is loaded from cdnjs instead.
const pdfLibrarySources = [
  { libraryUrl: 'assets/vendor/pdfjs/pdf.min.js', workerUrl: 'assets/vendor/pdfjs/pdf.worker.min.js' },
  { libraryUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    workerUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js' }
];

const resumeWindow = document.getElementById('window-resume');
const resumeViewer = document.getElementById('resume-viewer');
const resumeOpenLink = document.getElementById('resume-open-link');
const resumeDownloadLink = document.getElementById('resume-download-link');
const resumeFileName = document.getElementById('resume-file-name');
const loadedResumeDocuments = {};
let selectedResumeLanguage = 'en';
let pdfLibraryPromise = null;
let renderRequestNumber = 0;

function loadScript(scriptUrl) {
  return new Promise((resolve, reject) => {
    const scriptElement = document.createElement('script');
    scriptElement.src = scriptUrl;
    scriptElement.onload = resolve;
    scriptElement.onerror = () => reject(new Error(`Could not load ${scriptUrl}`));
    document.head.appendChild(scriptElement);
  });
}

// PDF.js is only loaded the first time someone opens the resume.
// Its worker file is loaded as a normal script too, so PDF.js runs on the page itself.
// That way it also works when the site is opened straight from the computer,
// where browsers don't allow background workers.
function loadPdfLibrary() {
  if (!pdfLibraryPromise) {
    pdfLibraryPromise = (async () => {
      for (const source of pdfLibrarySources) {
        try {
          await loadScript(source.libraryUrl);
          await loadScript(source.workerUrl);
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = source.workerUrl;
          return window.pdfjsLib;
        } catch {
          // try the next source
        }
      }
      throw new Error('PDF.js could not be loaded');
    })();
  }
  return pdfLibraryPromise;
}

let embeddedResumeDataPromise = null;
function loadEmbeddedResumeData() {
  if (!embeddedResumeDataPromise) embeddedResumeDataPromise = loadScript('assets/cv/cv-data.js');
  return embeddedResumeDataPromise;
}

function base64ToBytes(base64Text) {
  const binaryText = atob(base64Text);
  const bytes = new Uint8Array(binaryText.length);
  for (let index = 0; index < binaryText.length; index += 1) bytes[index] = binaryText.charCodeAt(index);
  return bytes;
}

function showResumeMessage(messageText) {
  resumeViewer.innerHTML = '';
  const messageElement = document.createElement('p');
  messageElement.className = 'resume-status';
  messageElement.textContent = messageText;
  resumeViewer.appendChild(messageElement);
}

// Read the PDF file first; if the browser blocks that, use the copy embedded in cv-data.js.
async function getResumeDocument(language) {
  if (!loadedResumeDocuments[language]) {
    loadedResumeDocuments[language] = (async () => {
      const pdfLibrary = await loadPdfLibrary();
      try {
        return await pdfLibrary.getDocument(resumeFiles[language].path).promise;
      } catch {
        await loadEmbeddedResumeData();
        const embeddedBytes = base64ToBytes(window.resumePdfData[language]);
        return pdfLibrary.getDocument({ data: embeddedBytes }).promise;
      }
    })();
    // If both ways fail, forget the attempt so opening the window again retries.
    loadedResumeDocuments[language].catch(() => { delete loadedResumeDocuments[language]; });
  }
  return loadedResumeDocuments[language];
}

async function renderResume() {
  const thisRenderNumber = ++renderRequestNumber;
  if (!resumeViewer.querySelector('canvas')) showResumeMessage('Loading resume…');

  try {
    const resumeDocument = await getResumeDocument(selectedResumeLanguage);
    if (thisRenderNumber !== renderRequestNumber) return; // a newer render started meanwhile

    const availableWidth = resumeViewer.clientWidth - 24;
    const pixelRatio = window.devicePixelRatio || 1;
    const pageCanvases = [];

    for (let pageNumber = 1; pageNumber <= resumeDocument.numPages; pageNumber += 1) {
      const pdfPage = await resumeDocument.getPage(pageNumber);
      const unscaledViewport = pdfPage.getViewport({ scale: 1 });
      const fitScale = availableWidth / unscaledViewport.width;
      const viewport = pdfPage.getViewport({ scale: fitScale * pixelRatio });

      const pageCanvas = document.createElement('canvas');
      pageCanvas.className = 'resume-page';
      pageCanvas.width = Math.floor(viewport.width);
      pageCanvas.height = Math.floor(viewport.height);
      pageCanvas.style.width = `${Math.floor(viewport.width / pixelRatio)}px`;
      pageCanvas.setAttribute('aria-label', `Resume page ${pageNumber} of ${resumeDocument.numPages}`);
      await pdfPage.render({ canvasContext: pageCanvas.getContext('2d'), viewport }).promise;
      if (thisRenderNumber !== renderRequestNumber) return;
      pageCanvases.push(pageCanvas);
    }

    const previousScroll = resumeViewer.scrollTop;
    resumeViewer.replaceChildren(...pageCanvases);
    resumeViewer.scrollTop = previousScroll;
  } catch (error) {
    if (thisRenderNumber !== renderRequestNumber) return;
    showResumeMessage('The resume preview could not load here. Use "Open in new tab" to view it.');
    console.warn(error);
  }
}

function selectResumeLanguage(language) {
  selectedResumeLanguage = language;
  const { path, label } = resumeFiles[language];
  document.querySelectorAll('.resume-tab').forEach(languageTab => {
    const isSelected = languageTab.dataset.resumeLanguage === language;
    languageTab.classList.toggle('is-active', isSelected);
    languageTab.setAttribute('aria-selected', String(isSelected));
  });
  resumeOpenLink.href = path;
  resumeDownloadLink.href = path;
  resumeDownloadLink.download = path.split('/').pop();
  resumeFileName.textContent = label;
  resumeViewer.scrollTop = 0;
  resumeViewer.replaceChildren();
  renderResume();
}

document.querySelectorAll('.resume-tab').forEach(languageTab => {
  languageTab.addEventListener('click', () => selectResumeLanguage(languageTab.dataset.resumeLanguage));
});

// Draw the pages when the window opens, and redraw when its size changes
// (maximize, browser resize) so the text stays sharp.
let lastRenderedWidth = 0;
new ResizeObserver(() => {
  if (resumeWindow.hidden) return;
  const currentWidth = resumeViewer.clientWidth;
  if (Math.abs(currentWidth - lastRenderedWidth) < 8) return;
  lastRenderedWidth = currentWidth;
  renderResume();
}).observe(resumeViewer);

/* ---------- Screenshot viewer ---------- */
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxTitle = document.getElementById('lightbox-title');

function openLightbox(imageElement) {
  const projectCard = imageElement.closest('.project-card, .mini-card');
  const projectTitle = projectCard ? projectCard.querySelector('h3, h4').textContent : '';
  lightboxImage.src = imageElement.src;
  lightboxImage.alt = imageElement.alt;
  lightboxTitle.textContent = projectTitle;
  lightbox.hidden = false;
  lightbox.querySelector('.lightbox-scroll').scrollTop = 0;
}

function closeLightbox() {
  lightbox.hidden = true;
}

document.addEventListener('click', event => {
  const screenshot = event.target.closest('.project-shot img');
  if (screenshot) openLightbox(screenshot);
});
document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
// Escape closes the screenshot first, before any window.
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !lightbox.hidden) {
    closeLightbox();
    event.stopImmediatePropagation();
  }
}, true);
