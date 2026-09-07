/* LAUNCHER — navegación móvil + animación del cohete */

(function(){
  // ====== CONFIG: cambia aquí la imagen del cohete ======
  // Acepta .svg, .png o .jpg. Si usas PNG/JPG, idealmente con fondo transparente
  // y el cohete apuntando "hacia arriba" en la imagen original (la rotación se aplica con CSS).
  const ROCKET_IMAGE_SRC = 'Imagen2.svg';
  // texto de marca que aparece junto al cohete en el header
  const BRAND_NAME = 'LAUNCHER';
  // =======================================================

  const rocketImg = document.getElementById('rocket-img');
  const headerRocketImg = document.getElementById('header-rocket-img');
  // src ya viene fijado en el HTML (progressive enhancement); solo lo
  // sobreescribimos si alguien cambia ROCKET_IMAGE_SRC arriba.
  if (rocketImg.getAttribute('src') !== ROCKET_IMAGE_SRC) rocketImg.src = ROCKET_IMAGE_SRC;
  if (headerRocketImg.getAttribute('src') !== ROCKET_IMAGE_SRC) headerRocketImg.src = ROCKET_IMAGE_SRC;

  // Menú móvil
  const navToggle = document.getElementById('nav-toggle');
  const headerNav = document.getElementById('header-nav');
  if (navToggle && headerNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = headerNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });
    headerNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        headerNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menú');
      });
    });
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = document.getElementById('site-header');
  const headerBrand = document.getElementById('header-brand');
  const rocketWrap = document.getElementById('rocket-wrap');
  const heroSpacer = document.querySelector('.hero-rocket-spacer');
  const headerRocketTarget = document.getElementById('header-rocket-img');

  // distancia (en px de scroll) durante la que el cohete pasa del hero al header
  const TRANSITION_RANGE = 460;
  // a partir de qué progreso (0..1) empieza el crossfade hacia el logo fijo del header
  const DOCK_START = 0.85;

  const ROTATE_BASE = 0;     // mirando a la izquierda, no acostado del todo
  const TILT_HERO = 0;       // inclinación extra en el hero, como si estuviera subiendo
  const TILT_HEADER = 0;       // se endereza un poco al acoplarse

  function lerp(a,b,t){ return a + (b-a)*t; }
  function clamp01(t){ return Math.min(Math.max(t,0),1); }
  function easeOutCubic(t){ return 1 - Math.pow(1-t, 3); }

  let targetT = 0;
  let smoothT = 0;
  let docked = false;
  let rafId = null;

  function computeTarget(){
    const scrollY = window.scrollY;
    targetT = clamp01(scrollY / TRANSITION_RANGE);

    if(scrollY > 40){
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    if (prefersReducedMotion) {
      smoothT = targetT;
      renderFrame();
      return;
    }
    // Solo mantenemos el bucle rAF corriendo mientras el cohete
    // realmente se esté moviendo; así no gastamos CPU/batería en reposo.
    if (rafId === null) {
      rafId = requestAnimationFrame(frame);
    }
  }

  function renderFrame(){
    smoothT += (targetT - smoothT) * 0.09;
    if(Math.abs(targetT - smoothT) < 0.0005) smoothT = targetT;

    const e = easeOutCubic(smoothT);

    // posición/tamaño del cohete grande mientras vuela del hero al header
    const heroRect = heroSpacer.getBoundingClientRect();
    const slotRect = headerRocketTarget.getBoundingClientRect();

    const startW = heroSpacer.offsetWidth;
    const startH = startW * 1.3;
    const startTopAbs = heroRect.top;
    const startLeft = heroRect.left;

    const endW = slotRect.width || 34;
    const endH = slotRect.height || 34;
    const endTopAbs = slotRect.top;
    const endLeft = slotRect.left;

    const w = lerp(startW, endW, e);
    const h = lerp(startH, endH, e);
    const top = lerp(startTopAbs, endTopAbs, e);
    const left = lerp(startLeft, endLeft, e);
    const tilt = lerp(TILT_HERO, TILT_HEADER, e);

    rocketWrap.style.width = w + 'px';
    rocketWrap.style.height = h + 'px';
    rocketWrap.style.top = top + 'px';
    rocketWrap.style.left = left + 'px';
    rocketImg.style.transform = 'rotate(' + (ROTATE_BASE + tilt) + 'deg)';

    // crossfade: el cohete volador se desvanece justo antes de llegar,
    // y el logo fijo del header (siempre presente en el DOM) toma su lugar.
    const dockProgress = clamp01((smoothT - DOCK_START) / (1 - DOCK_START));
    rocketWrap.style.opacity = (1 - dockProgress).toString();

    if(dockProgress > 0.05 && !docked){
      docked = true;
      headerBrand.classList.add('visible');
    } else if(dockProgress <= 0.05 && docked){
      docked = false;
      headerBrand.classList.remove('visible');
    }
  }

  function frame(){
    renderFrame();
    if (Math.abs(targetT - smoothT) > 0.0005) {
      rafId = requestAnimationFrame(frame);
    } else {
      rafId = null; // se detiene: nada que animar hasta el próximo scroll
    }
  }

  window.addEventListener('scroll', computeTarget, {passive:true});
  window.addEventListener('resize', computeTarget);
  computeTarget();
})();
