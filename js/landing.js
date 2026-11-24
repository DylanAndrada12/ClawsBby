/* =========================================================
   Claws Bby · Landing
   - Intro animada
   - Catálogo 3D (rueda del mouse en desktop, swipe en celular)
   - Mapa 3D de la ubicación
   ========================================================= */

(() => {
    "use strict";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    const mod = (n, m) => ((n % m) + m) % m;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);


    /* ==================== NAV ==================== */

    const nav = $("#nav");
    const navToggle = $("#nav-toggle");
    const navLinks = $("#nav-links");

    const toggleMenu = (abrir) => {
        navLinks.classList.toggle("abierto", abrir);
        navToggle.setAttribute("aria-expanded", String(abrir));
        navToggle.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
        document.body.style.overflow = abrir ? "hidden" : "";
    };

    navToggle.addEventListener("click", () => toggleMenu(!navLinks.classList.contains("abierto")));
    $$("a", navLinks).forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && navLinks.classList.contains("abierto")) toggleMenu(false);
    });


    /* ==================== CATÁLOGO 3D ==================== */

    const seccion = $("#catalogo");
    const carrusel = $("#carrusel");
    const anillo = $("#anillo");
    const tarjetas = $$(".tarjeta", anillo);
    const N = tarjetas.length;
    const paso = 360 / N;

    const contadorActual = $("#contador-actual");
    const ficha = $(".ficha");
    const fichaTipo = $("#ficha-tipo");
    const fichaDetalle = $("#ficha-detalle");
    const barra = $("#progreso-barra");
    const pista = $(".pista");
    const zona = $("#catalogo-escena");   // zona de arrastre: toda la escena

    $("#contador-total").textContent = String(N).padStart(2, "0");

    let modoScroll = true;   // desktop: la rueda del mouse gira el catálogo
    let radio = 500;
    let pos = 0;             // posición dibujada (índice con decimales)
    let objetivo = 0;        // posición a la que vamos
    let introGiro = 0;       // giro extra durante la entrada
    let introZoom = 0;
    let activa = -1;
    let interactuo = false;

    const medir = () => {
        modoScroll = window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
        seccion.style.setProperty("--recorrido", modoScroll ? `${(N - 1) * 34}vh` : "0px");

        const ancho = carrusel.offsetWidth;
        radio = Math.round((ancho / 2) / Math.tan(Math.PI / N) + ancho * 0.04);
        carrusel.style.setProperty("--radio", `${radio}px`);

        tarjetas.forEach((t, i) => {
            t.style.transform = `rotateY(${i * paso}deg) translateZ(${radio}px)`;
        });

        if (modoScroll) objetivo = progresoScroll() * (N - 1);
    };

    const progresoScroll = () => {
        const recorrido = seccion.offsetHeight - window.innerHeight;
        if (recorrido <= 0) return 0;
        return clamp((window.scrollY - seccion.offsetTop) / recorrido, 0, 1);
    };

    const ocultarPista = () => {
        if (interactuo) return;
        interactuo = true;
        pista.classList.add("oculta");
    };

    const actualizarFicha = (i) => {
        if (i === activa) return;
        activa = i;
        const t = tarjetas[i];
        contadorActual.textContent = String(i + 1).padStart(2, "0");
        fichaTipo.textContent = t.dataset.tipo;
        fichaDetalle.textContent = t.dataset.detalle;
        ficha.classList.remove("cambiando");
        void ficha.offsetWidth;
        ficha.classList.add("cambiando");
        tarjetas.forEach((x, k) => x.classList.toggle("activa", k === i));
    };

    const dibujar = () => {
        const p = pos + introGiro;
        const zoom = introZoom;
        anillo.style.transform =
            `translateZ(${-radio - zoom}px) rotateY(${-p * paso}deg)`;

        tarjetas.forEach((t, i) => {
            let rel = mod(i - p, N);
            if (rel > N / 2) rel -= N;
            const d = Math.abs(rel);
            const luz = clamp(1 - d * 0.14, 0.45, 1);
            t.style.filter = `brightness(${luz}) saturate(${clamp(1 - d * 0.1, 0.6, 1)})`;
            t.style.opacity = clamp(1.25 - d * 0.22, 0, 1);
        });

        actualizarFicha(mod(Math.round(pos), N));

        const progreso = modoScroll ? pos / (N - 1) : mod(pos, N) / (N - 1);
        barra.style.transform = `scaleX(${clamp(progreso, 0, 1)})`;
    };

    const bucle = () => {
        const dif = objetivo - pos;
        pos += Math.abs(dif) < 0.0005 ? dif : dif * (reduceMotion ? 1 : 0.09);
        dibujar();
        requestAnimationFrame(bucle);
    };

    /* Ir a un diseño (botones, teclado, click en tarjeta) */
    const irA = (indice) => {
        ocultarPista();
        if (modoScroll) {
            const i = clamp(indice, 0, N - 1);
            const recorrido = seccion.offsetHeight - window.innerHeight;
            window.scrollTo({
                top: seccion.offsetTop + (i / (N - 1)) * recorrido,
                behavior: reduceMotion ? "auto" : "smooth",
            });
        } else {
            objetivo = indice;
        }
    };

    const actual = () => Math.round(objetivo);

    $("#anterior").addEventListener("click", () => irA(actual() - 1));
    $("#siguiente").addEventListener("click", () => irA(actual() + 1));

    carrusel.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); irA(actual() + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); irA(actual() - 1); }
        if (e.key === "Enter") abrirVisor(activa);
    });

    window.addEventListener("scroll", () => {
        if (modoScroll) {
            objetivo = progresoScroll() * (N - 1);
            if (window.scrollY > seccion.offsetTop + 40) ocultarPista();
        }
        nav.classList.toggle("con-fondo", window.scrollY > 30);
    }, { passive: true });

    /* Arrastre / swipe horizontal */
    let arrastre = null;

    zona.addEventListener("pointerdown", (e) => {
        if (e.button !== 0 || e.target.closest("button, a")) return;
        arrastre = {
            x: e.clientX,
            y: e.clientY,
            inicio: objetivo,
            ultimoX: e.clientX,
            ultimoT: performance.now(),
            vel: 0,
            movio: false,
            horizontal: null,
            id: e.pointerId,
        };
    });

    zona.addEventListener("pointermove", (e) => {
        if (!arrastre || e.pointerId !== arrastre.id) return;
        const dx = e.clientX - arrastre.x;
        const dy = e.clientY - arrastre.y;

        if (arrastre.horizontal === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
            arrastre.horizontal = Math.abs(dx) > Math.abs(dy);
            if (arrastre.horizontal) {
                zona.setPointerCapture(e.pointerId);
                carrusel.classList.add("arrastrando");
            }
        }
        if (!arrastre.horizontal) return;

        arrastre.movio = true;
        ocultarPista();
        const ancho = carrusel.offsetWidth;
        const ahora = performance.now();
        arrastre.vel = (e.clientX - arrastre.ultimoX) / Math.max(1, ahora - arrastre.ultimoT);
        arrastre.ultimoX = e.clientX;
        arrastre.ultimoT = ahora;

        const nuevo = arrastre.inicio - dx / (ancho * 0.85);
        if (modoScroll) {
            irScrollInstantaneo(nuevo);
        } else {
            objetivo = nuevo;
        }
    });

    const soltar = (e) => {
        if (!arrastre || e.pointerId !== arrastre.id) return;
        carrusel.classList.remove("arrastrando");
        if (arrastre.movio) {
            const impulso = clamp(-arrastre.vel * 2.2, -3, 3);
            const destino = Math.round(objetivo + impulso);
            irA(destino);
            // evitar que el "click" del final del arrastre abra la foto
            carrusel.dataset.recienArrastrado = "1";
            setTimeout(() => delete carrusel.dataset.recienArrastrado, 50);
        }
        arrastre = null;
    };

    zona.addEventListener("pointerup", soltar);
    zona.addEventListener("pointercancel", soltar);

    const irScrollInstantaneo = (indice) => {
        const i = clamp(indice, 0, N - 1);
        const recorrido = seccion.offsetHeight - window.innerHeight;
        window.scrollTo({ top: seccion.offsetTop + (i / (N - 1)) * recorrido, behavior: "auto" });
    };

    /* Click en tarjeta: la del frente se amplía, las otras giran al frente */
    tarjetas.forEach((t, i) => {
        t.addEventListener("click", () => {
            if (carrusel.dataset.recienArrastrado) return;
            if (i === activa) {
                abrirVisor(i);
                return;
            }
            let rel = mod(i - Math.round(objetivo), N);
            if (rel > N / 2) rel -= N;
            irA(modoScroll ? i : Math.round(objetivo) + rel);
        });
    });


    /* ==================== VISOR ==================== */

    const visor = $("#visor");
    const visorImg = $("#visor-img");
    const visorTexto = $("#visor-texto");

    function abrirVisor(i) {
        if (i < 0 || typeof visor.showModal !== "function") return;
        const t = tarjetas[i];
        const img = $("img", t);
        visorImg.src = img.src;
        visorImg.alt = img.alt;
        visorTexto.textContent = `${t.dataset.tipo} · ${t.dataset.detalle}`;
        visor.showModal();
    }

    $("#visor-cerrar").addEventListener("click", () => visor.close());
    visor.addEventListener("click", (e) => { if (e.target === visor) visor.close(); });


    /* ==================== INTRO ==================== */

    const intro = $("#intro");
    let introTerminada = false;

    const entradaCatalogo = () => {
        if (reduceMotion) return;
        const inicio = performance.now();
        const dur = 1900;
        introGiro = -N * 0.75;
        introZoom = 900;
        const anim = (ahora) => {
            const t = clamp((ahora - inicio) / dur, 0, 1);
            const e = easeOutCubic(t);
            introGiro = -N * 0.75 * (1 - e);
            introZoom = 900 * (1 - e);
            if (t < 1) requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
    };

    const terminarIntro = () => {
        if (introTerminada) return;
        introTerminada = true;
        intro.classList.add("saliendo");
        document.body.classList.remove("intro-activa");
        entradaCatalogo();
        setTimeout(() => intro.classList.add("oculta"), 1100);
        try { sessionStorage.setItem("clawsIntroVista", "1"); } catch (_) { /* sin storage */ }
    };

    const yaVista = (() => { try { return sessionStorage.getItem("clawsIntroVista") === "1"; } catch (_) { return false; } })();

    if (reduceMotion || yaVista || location.hash) {
        intro.classList.add("oculta");
        document.body.classList.remove("intro-activa");
        introTerminada = true;
        if (!reduceMotion && !location.hash) entradaCatalogo();
    } else {
        // Esperar a la tipografía cursiva para que el trazo se dibuje bien
        const arrancar = () => setTimeout(terminarIntro, 2900);
        (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(arrancar);
        $("#intro-saltar").addEventListener("click", terminarIntro);
        intro.addEventListener("click", terminarIntro);
        setTimeout(terminarIntro, 6000); // red de seguridad
    }


    /* ==================== REVELADO AL SCROLL ==================== */

    const revelables = $$(".revelar");
    if ("IntersectionObserver" in window && !reduceMotion) {
        const obs = new IntersectionObserver((entradas) => {
            entradas.forEach((en) => {
                if (!en.isIntersecting) return;
                const hermanos = $$(".revelar", en.target.parentElement);
                const idx = Math.max(0, hermanos.indexOf(en.target));
                en.target.style.setProperty("--retraso", `${Math.min(idx, 6) * 0.07}s`);
                en.target.classList.add("visible");
                obs.unobserve(en.target);
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
        revelables.forEach((el) => obs.observe(el));
    } else {
        revelables.forEach((el) => el.classList.add("visible"));
    }


    /* ==================== MAPA 3D ==================== */

    // Recondo 961, entre Roberto Arlt y Unamuno · Villa Fiorito, Lomas de Zamora
    // Si el pin no queda exacto, ajustá estas coordenadas (latitud, longitud).
    const UBICACION = { lat: -34.71144, lng: -58.44523 };

    const mapaEl = $("#mapa");

    const mapaRespaldo = () => {
        mapaEl.innerHTML =
            `<iframe class="mapa-iframe" title="Mapa de Recondo 961, Villa Fiorito" loading="lazy" ` +
            `referrerpolicy="no-referrer-when-downgrade" ` +
            `src="https://maps.google.com/maps?q=${UBICACION.lat},${UBICACION.lng}&z=17&output=embed"></iframe>`;
    };

    const soportaWebGL = () => {
        try {
            const c = document.createElement("canvas");
            return !!(c.getContext("webgl2") || c.getContext("webgl"));
        } catch (_) { return false; }
    };

    /* Pinta el estilo del mapa con la paleta de la marca */
    const teñirMapa = (map) => {
        const capas = map.getStyle().layers;
        capas.forEach((capa) => {
            const id = capa.id;
            try {
                if (capa.type === "background") {
                    map.setPaintProperty(id, "background-color", "#f7ebe7");
                } else if (capa.type === "raster") {
                    map.setLayoutProperty(id, "visibility", "none");
                } else if (capa.type === "fill") {
                    let color = "#f4e4df";
                    if (/water/.test(id)) color = "#ead5dc";
                    else if (/park|grass|wood|wetland|pitch|cemetery/.test(id)) color = "#efdcd3";
                    else if (/building/.test(id)) color = "#efd3cf";
                    map.setPaintProperty(id, "fill-color", color);
                    if (/road_area_pattern/.test(id)) map.setLayoutProperty(id, "visibility", "none");
                } else if (capa.type === "line") {
                    if (/waterway/.test(id)) map.setPaintProperty(id, "line-color", "#e3c8d2");
                    else if (/casing/.test(id)) map.setPaintProperty(id, "line-color", "#ecd6d0");
                    else if (/rail|hatching/.test(id)) map.setPaintProperty(id, "line-color", "#dcc3bd");
                    else if (/boundary/.test(id)) map.setLayoutProperty(id, "visibility", "none");
                    else map.setPaintProperty(id, "line-color", "#ffffff");
                } else if (capa.type === "fill-extrusion") {
                    map.setPaintProperty(id, "fill-extrusion-color", [
                        "interpolate", ["linear"], ["coalesce", ["get", "render_height"], 6],
                        0, "#f1d6d3",
                        20, "#e7bcc0",
                        60, "#d99ea8",
                    ]);
                    map.setPaintProperty(id, "fill-extrusion-opacity", 0.92);
                } else if (capa.type === "symbol") {
                    if (/^poi|one_way|shield/.test(id)) {
                        map.setLayoutProperty(id, "visibility", "none");
                    } else {
                        map.setPaintProperty(id, "text-color", "#6a3f4b");
                        map.setPaintProperty(id, "text-halo-color", "#fff8f6");
                        map.setPaintProperty(id, "text-halo-width", 1.4);
                    }
                }
            } catch (_) { /* capa sin esa propiedad */ }
        });
    };

    const crearPin = () => {
        const el = document.createElement("div");
        el.className = "pin";
        el.setAttribute("aria-label", "Claws Bby, Recondo 961");
        el.innerHTML =
            `<span class="pin-onda"></span>` +
            `<span class="pin-gota"><svg viewBox="0 0 24 22" aria-hidden="true"><path d="M12 21C4 15 1 10.5 1 6.5 1 3.4 3.4 1 6.4 1c2.2 0 4.2 1.3 5.6 3.3C13.4 2.3 15.4 1 17.6 1 20.6 1 23 3.4 23 6.5c0 4-3 8.5-11 14.5z"/></svg></span>` +
            `<span class="pin-sombra"></span>`;
        return el;
    };

    const iniciarMapa = () => {
        if (!window.maplibregl || !soportaWebGL()) {
            mapaRespaldo();
            return;
        }

        let map;
        try {
            map = new maplibregl.Map({
                container: mapaEl,
                style: "https://tiles.openfreemap.org/styles/liberty",
                center: [UBICACION.lng, UBICACION.lat],
                zoom: 16.4,
                pitch: 62,
                bearing: -28,
                maxPitch: 75,
                antialias: true,
                cooperativeGestures: true,
                attributionControl: { compact: true },
            });
        } catch (_) {
            mapaRespaldo();
            return;
        }

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

        new maplibregl.Marker({ element: crearPin(), anchor: "bottom" })
            .setLngLat([UBICACION.lng, UBICACION.lat])
            .addTo(map);

        map.on("error", () => { /* tiles con error: el mapa sigue funcionando */ });

        map.on("load", () => {
            teñirMapa(map);

            if (reduceMotion) return;

            // Vuelo de entrada y luego una órbita lenta alrededor del local
            map.easeTo({ zoom: 17.2, pitch: 66, bearing: 12, duration: 3200, easing: easeOutCubic });

            let orbitando = true;
            const frenar = () => { orbitando = false; };
            ["mousedown", "touchstart", "wheel", "dragstart"].forEach((ev) => map.on(ev, frenar));

            map.once("moveend", () => {
                const girar = () => {
                    if (!orbitando) return;
                    map.setBearing(map.getBearing() + 0.035);
                    requestAnimationFrame(girar);
                };
                requestAnimationFrame(girar);
            });
        });
    };

    let mapaIniciado = false;
    const intentarMapa = () => {
        if (mapaIniciado) return;
        mapaIniciado = true;
        // maplibre se carga con defer: esperar a que esté disponible
        if (window.maplibregl) iniciarMapa();
        else window.addEventListener("load", iniciarMapa, { once: true });
    };

    if ("IntersectionObserver" in window) {
        const obsMapa = new IntersectionObserver((entradas) => {
            if (entradas.some((e) => e.isIntersecting)) {
                intentarMapa();
                obsMapa.disconnect();
            }
        }, { rootMargin: "600px 0px" });
        obsMapa.observe(mapaEl);
    } else {
        intentarMapa();
    }


    /* ==================== ARRANQUE ==================== */

    medir();
    pos = objetivo;
    dibujar();
    requestAnimationFrame(bucle);

    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(medir, 120);
    });
})();
