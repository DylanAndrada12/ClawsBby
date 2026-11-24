/* Claws Bby · Inicio: intro animada + catálogo 3D de fotos
   Gira con la rueda del mouse (desktop) y deslizando de costado (celular). */
(() => {
    "use strict";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const mod = (n, m) => ((n % m) + m) % m;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const zona = $("#escena3d");
    const carrusel = $("#carrusel");
    const anillo = $("#anillo");
    const tarjetas = $$(".tarjeta", anillo);
    const N = tarjetas.length;
    const paso = 360 / N;

    const ficha = $(".ficha");
    const fichaTipo = $("#ficha-tipo");
    const fichaDetalle = $("#ficha-detalle");
    const contador = $("#contador-actual");
    const miniatura = $("#foto-real img");
    const pista = $(".pista");

    $("#contador-total").textContent = String(N).padStart(2, "0");

    let radio = 500;
    let pos = 0;          // posición dibujada (índice con decimales)
    let objetivo = 0;     // posición buscada
    let introGiro = 0;
    let introZoom = 0;
    let activa = -1;

    /* ---------- Medidas ---------- */
    const medir = () => {
        const ancho = carrusel.offsetWidth;
        radio = Math.round((ancho / 2) / Math.tan(Math.PI / N) + ancho * 0.04);
        carrusel.style.setProperty("--radio", `${radio}px`);
        tarjetas.forEach((t, i) => {
            t.style.transform = `rotateY(${i * paso}deg) translateZ(${radio}px)`;
        });
    };

    /* ---------- Ficha ---------- */
    const actualizarFicha = (i) => {
        if (i === activa) return;
        activa = i;
        const t = tarjetas[i];
        contador.textContent = String(i + 1).padStart(2, "0");
        fichaTipo.textContent = t.dataset.tipo;
        fichaDetalle.textContent = t.dataset.detalle;
        miniatura.src = $("img", t).src;
        ficha.classList.remove("cambiando");
        void ficha.offsetWidth;
        ficha.classList.add("cambiando");
        tarjetas.forEach((x, k) => x.classList.toggle("activa", k === i));
    };

    /* ---------- Dibujo ---------- */
    const dibujar = () => {
        const p = pos + introGiro;
        anillo.style.transform = `translateZ(${-radio - introZoom}px) rotateY(${-p * paso}deg)`;
        tarjetas.forEach((t, i) => {
            let rel = mod(i - p, N);
            if (rel > N / 2) rel -= N;
            const d = Math.abs(rel);
            t.style.filter = `brightness(${clamp(1 - d * 0.14, 0.45, 1)}) saturate(${clamp(1 - d * 0.1, 0.6, 1)})`;
            t.style.opacity = clamp(1.25 - d * 0.22, 0, 1);
        });
        actualizarFicha(mod(Math.round(pos), N));
    };

    const bucle = () => {
        const dif = objetivo - pos;
        pos += Math.abs(dif) < 0.0005 ? dif : dif * (reduceMotion ? 1 : 0.1);
        dibujar();
        requestAnimationFrame(bucle);
    };

    const ajustar = () => { objetivo = Math.round(objetivo); };
    const irA = (i) => {
        let rel = mod(i - Math.round(objetivo), N);
        if (rel > N / 2) rel -= N;
        objetivo = Math.round(objetivo) + rel;
    };

    /* ---------- Pista ---------- */
    let interactuo = false;
    const ocultarPista = () => {
        if (interactuo) return;
        interactuo = true;
        pista.classList.add("oculta");
    };

    /* ---------- Rueda del mouse: gira sin mover la página ---------- */
    let ajusteTimer;
    zona.addEventListener("wheel", (e) => {
        e.preventDefault();
        ocultarPista();
        const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        objetivo += clamp(d, -120, 120) * 0.008;
        clearTimeout(ajusteTimer);
        ajusteTimer = setTimeout(ajustar, 180);
    }, { passive: false });

    /* ---------- Arrastre / swipe horizontal ---------- */
    let arrastre = null;
    let recienArrastrado = false;

    zona.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        arrastre = { x: e.clientX, y: e.clientY, inicio: objetivo, ultimoX: e.clientX, t: performance.now(), vel: 0, horizontal: null, movio: false, id: e.pointerId };
    });

    zona.addEventListener("pointermove", (e) => {
        if (!arrastre || e.pointerId !== arrastre.id) return;
        const dx = e.clientX - arrastre.x;
        const dy = e.clientY - arrastre.y;
        if (arrastre.horizontal === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
            arrastre.horizontal = Math.abs(dx) >= Math.abs(dy);
            if (arrastre.horizontal) zona.setPointerCapture(e.pointerId);
        }
        if (!arrastre.horizontal) return;
        arrastre.movio = true;
        ocultarPista();
        const ahora = performance.now();
        arrastre.vel = (e.clientX - arrastre.ultimoX) / Math.max(1, ahora - arrastre.t);
        arrastre.ultimoX = e.clientX;
        arrastre.t = ahora;
        objetivo = arrastre.inicio - dx / (carrusel.offsetWidth * 0.85);
    });

    const soltar = (e) => {
        if (!arrastre || e.pointerId !== arrastre.id) return;
        if (arrastre.movio) {
            objetivo = Math.round(objetivo + clamp(-arrastre.vel * 2.2, -3, 3));
            recienArrastrado = true;
            setTimeout(() => { recienArrastrado = false; }, 60);
        }
        arrastre = null;
    };
    zona.addEventListener("pointerup", soltar);
    zona.addEventListener("pointercancel", soltar);

    /* ---------- Click, botones y teclado ---------- */
    const fotos = () => tarjetas.map((t) => ({ src: $("img", t).src, alt: $("img", t).alt, texto: `${t.dataset.tipo} · ${t.dataset.detalle}` }));
    const ampliar = (i = activa) => window.clawsVisor?.abrir(fotos(), i);

    tarjetas.forEach((t, i) => {
        t.addEventListener("click", () => {
            if (recienArrastrado) return;
            if (i === activa) ampliar(i);
            else irA(i);
        });
    });

    $("#anterior").addEventListener("click", () => { ocultarPista(); objetivo = Math.round(objetivo) - 1; });
    $("#siguiente").addEventListener("click", () => { ocultarPista(); objetivo = Math.round(objetivo) + 1; });
    $("#foto-real").addEventListener("click", () => ampliar());

    zona.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); objetivo = Math.round(objetivo) + 1; }
        if (e.key === "ArrowLeft") { e.preventDefault(); objetivo = Math.round(objetivo) - 1; }
        if (e.key === "Enter") ampliar();
    });

    /* ---------- Entrada del catálogo ---------- */
    const entrada = () => {
        if (reduceMotion) return;
        const inicio = performance.now();
        const dur = 1900;
        const anim = (ahora) => {
            const t = clamp((ahora - inicio) / dur, 0, 1);
            const e = easeOutCubic(t);
            introGiro = -N * 0.75 * (1 - e);
            introZoom = 900 * (1 - e);
            if (t < 1) requestAnimationFrame(anim);
        };
        introGiro = -N * 0.75;
        introZoom = 900;
        requestAnimationFrame(anim);
    };

    /* ---------- Intro ---------- */
    const intro = $("#intro");
    let terminada = false;

    const terminarIntro = () => {
        if (terminada) return;
        terminada = true;
        intro.classList.add("saliendo");
        document.body.classList.remove("intro-activa");
        entrada();
        setTimeout(() => intro.classList.add("oculta"), 1100);
        try { sessionStorage.setItem("clawsIntroVista", "1"); } catch (_) { /* sin storage */ }
    };

    let yaVista = false;
    try { yaVista = sessionStorage.getItem("clawsIntroVista") === "1"; } catch (_) { /* sin storage */ }

    if (reduceMotion || yaVista) {
        intro.classList.add("oculta");
        document.body.classList.remove("intro-activa");
        terminada = true;
        entrada();
    } else {
        (document.fonts?.ready ?? Promise.resolve()).then(() => setTimeout(terminarIntro, 2900));
        $("#intro-saltar").addEventListener("click", terminarIntro);
        intro.addEventListener("click", terminarIntro);
        setTimeout(terminarIntro, 6500);
    }

    /* ---------- Arranque ---------- */
    medir();
    dibujar();
    requestAnimationFrame(bucle);

    let t;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(medir, 120); });
})();
