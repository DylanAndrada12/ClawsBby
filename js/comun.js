/* Claws Bby · comportamiento compartido: menú, barra, revelado y visor de fotos */
(() => {
    "use strict";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    /* ---------- Menú ---------- */
    const nav = $("#nav");
    const toggle = $("#nav-toggle");
    const links = $("#nav-links");

    const abrir = (si) => {
        links.classList.toggle("abierto", si);
        toggle.setAttribute("aria-expanded", String(si));
        toggle.setAttribute("aria-label", si ? "Cerrar menú" : "Abrir menú");
        document.documentElement.style.overflow = si ? "hidden" : "";
    };

    toggle?.addEventListener("click", () => abrir(!links.classList.contains("abierto")));
    $$("a", links).forEach((a) => a.addEventListener("click", () => abrir(false)));
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && links?.classList.contains("abierto")) abrir(false);
    });

    const fondoNav = () => nav?.classList.toggle("con-fondo", window.scrollY > 20 || document.body.dataset.navSolida === "1");
    window.addEventListener("scroll", fondoNav, { passive: true });
    fondoNav();

    /* ---------- Revelado al scroll ---------- */
    const revelables = $$(".revelar");
    if ("IntersectionObserver" in window && !reduceMotion) {
        const obs = new IntersectionObserver((entradas) => {
            entradas.forEach((en) => {
                if (!en.isIntersecting) return;
                const hermanos = $$(":scope > .revelar", en.target.parentElement);
                const i = Math.max(0, hermanos.indexOf(en.target));
                en.target.style.setProperty("--retraso", `${Math.min(i, 6) * 0.07}s`);
                en.target.classList.add("visible");
                obs.unobserve(en.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
        revelables.forEach((el) => obs.observe(el));
    } else {
        revelables.forEach((el) => el.classList.add("visible"));
    }

    /* ---------- Visor de fotos (galería e inicio) ---------- */
    const visor = $("#visor");
    if (visor) {
        const img = $("#visor-img");
        const texto = $("#visor-texto");
        let lista = [];
        let actual = 0;

        const mostrar = (i) => {
            if (!lista.length) return;
            actual = (i + lista.length) % lista.length;
            const f = lista[actual];
            img.src = f.src;
            img.alt = f.alt;
            texto.textContent = f.texto;
        };

        window.clawsVisor = {
            abrir(fotos, i = 0) {
                lista = fotos;
                mostrar(i);
                const multiples = fotos.length > 1;
                $$(".visor-nav", visor).forEach((b) => { b.hidden = !multiples; });
                if (typeof visor.showModal === "function") visor.showModal();
            },
        };

        $("#visor-cerrar")?.addEventListener("click", () => visor.close());
        $(".visor-anterior", visor)?.addEventListener("click", () => mostrar(actual - 1));
        $(".visor-siguiente", visor)?.addEventListener("click", () => mostrar(actual + 1));
        visor.addEventListener("click", (e) => { if (e.target === visor) visor.close(); });
        visor.addEventListener("keydown", (e) => {
            if (e.key === "ArrowRight") mostrar(actual + 1);
            if (e.key === "ArrowLeft") mostrar(actual - 1);
        });
    }
})();
