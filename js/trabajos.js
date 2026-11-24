/* Claws Bby · Galería de trabajos: filtros y visor */
(() => {
    "use strict";
    const obras = Array.from(document.querySelectorAll(".obra"));
    const filtros = Array.from(document.querySelectorAll(".filtro"));

    const visibles = () => obras.filter((o) => !o.classList.contains("oculta"));

    filtros.forEach((f) => {
        f.addEventListener("click", () => {
            filtros.forEach((x) => x.setAttribute("aria-pressed", String(x === f)));
            const tipo = f.dataset.filtro;
            obras.forEach((o) => o.classList.toggle("oculta", tipo !== "todos" && o.dataset.tipo !== tipo));
        });
    });

    obras.forEach((o) => {
        o.addEventListener("click", () => {
            const lista = visibles();
            const fotos = lista.map((x) => {
                const img = x.querySelector("img");
                return { src: img.src, alt: img.alt, texto: `${x.dataset.tipoNombre} · ${x.dataset.titulo}` };
            });
            window.clawsVisor?.abrir(fotos, lista.indexOf(o));
        });
    });
})();
