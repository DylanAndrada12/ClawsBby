/* Claws Bby · Inicio: intro animada + rueda 3D de uñas */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);

const escena = $("#escena3d");
const ficha = $(".ficha");
const fichaTipo = $("#ficha-tipo");
const fichaDetalle = $("#ficha-detalle");
const contador = $("#contador-actual");
const fotoReal = $("#foto-real");
const fotoRealImg = $("#foto-real img");
const pista = $(".pista");

let catalogo = null;
let diseños = [];
let actual = 0;

/* ---------- Ficha del diseño seleccionado ---------- */
function alCambiar(i, d) {
    actual = i;
    contador.textContent = String(i + 1).padStart(2, "0");
    fichaTipo.textContent = d.tipo;
    fichaDetalle.textContent = d.nombre;
    fotoRealImg.src = d.foto;
    fotoRealImg.alt = `Foto real: ${d.nombre}`;
    ficha.classList.remove("cambiando");
    void ficha.offsetWidth;
    ficha.classList.add("cambiando");
}

function verFotoReal(i = actual) {
    const fotos = diseños.map((d) => ({ src: d.foto, alt: d.nombre, texto: `${d.tipo} · ${d.nombre}` }));
    window.clawsVisor?.abrir(fotos, i);
}

let interactuo = false;
const ocultarPista = () => {
    if (interactuo) return;
    interactuo = true;
    pista.classList.add("oculta");
};
["wheel", "pointerdown"].forEach((ev) => escena.addEventListener(ev, ocultarPista, { passive: true }));

$("#anterior").addEventListener("click", () => { ocultarPista(); catalogo?.anterior(); });
$("#siguiente").addEventListener("click", () => { ocultarPista(); catalogo?.siguiente(); });
fotoReal.addEventListener("click", () => verFotoReal());

escena.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); catalogo?.siguiente(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); catalogo?.anterior(); }
    if (e.key === "Enter") verFotoReal();
});

/* ---------- Cargar la escena 3D ---------- */
async function cargar() {
    try {
        const c = document.createElement("canvas");
        if (!(c.getContext("webgl2") || c.getContext("webgl"))) throw new Error("sin WebGL");
        const mod = await import("./catalogo3d.js?v=3");
        diseños = mod.DISEÑOS;
        $("#contador-total").textContent = String(diseños.length).padStart(2, "0");
        catalogo = await mod.iniciarCatalogo3D({
            contenedor: escena,
            alCambiar,
            alElegir: (i) => verFotoReal(i),
        });
    } catch (err) {
        console.warn("Catálogo 3D no disponible:", err);
        escena.innerHTML = `<div class="escena3d-respaldo"><p>Tu navegador no puede mostrar el catálogo 3D.<br><a href="trabajos.html">Ver los trabajos en fotos</a></p></div>`;
    } finally {
        $(".escena3d-cargando")?.remove();
    }
}

const listo = cargar();

/* ---------- Intro ---------- */
const intro = $("#intro");
let terminada = false;

const entrar = () => listo.then(() => catalogo?.entrar());

function terminarIntro() {
    if (terminada) return;
    terminada = true;
    intro.classList.add("saliendo");
    document.body.classList.remove("intro-activa");
    entrar();
    setTimeout(() => intro.classList.add("oculta"), 1100);
    try { sessionStorage.setItem("clawsIntroVista", "1"); } catch (_) { /* sin storage */ }
}

let yaVista = false;
try { yaVista = sessionStorage.getItem("clawsIntroVista") === "1"; } catch (_) { /* sin storage */ }

if (reduceMotion || yaVista) {
    intro.classList.add("oculta");
    document.body.classList.remove("intro-activa");
    terminada = true;
    entrar();
} else {
    const fuentes = document.fonts?.ready ?? Promise.resolve();
    fuentes.then(() => setTimeout(terminarIntro, 2900));
    $("#intro-saltar").addEventListener("click", terminarIntro);
    intro.addEventListener("click", terminarIntro);
    setTimeout(terminarIntro, 6500);
}
