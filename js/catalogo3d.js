/* =========================================================
   Claws Bby · Catálogo 3D de uñas
   Cada uña es un modelo 3D (forma almendra, curvada) con un
   diseño pintado a mano en código, inspirado en los trabajos
   reales publicados en la página.
   ========================================================= */

import * as THREE from "three";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mod = (n, m) => ((n % m) + m) % m;
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/* ---------- Medidas de la uña (unidades 3D) ---------- */
const ANCHO = 0.5;      // medio ancho
const LARGO = 1.7;
const BASE_Y = -0.1;    // la cutícula redondeada baja un poco del 0

/* =========================================================
   PINCELES: ayudantes para pintar diseños en el canvas
   El canvas representa la uña "aplanada": abajo la cutícula,
   arriba la punta. x = 0..w, y = 0..h
   ========================================================= */

const rnd = (() => {
    let s = 7;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
})();

function degradado(ctx, w, h, colores) {
    const g = ctx.createLinearGradient(0, h, 0, 0);
    colores.forEach(([p, c]) => g.addColorStop(p, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
}

function brilloEsmalte(ctx, w, h) {
    // luz suave lateral para dar volumen al color
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(0,0,0,0.10)");
    g.addColorStop(0.35, "rgba(255,255,255,0.06)");
    g.addColorStop(0.65, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(0,0,0,0.12)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
}

function glitter(ctx, x0, y0, x1, y1, cantidad, colores, tam = [1, 3]) {
    for (let i = 0; i < cantidad; i++) {
        const x = x0 + rnd() * (x1 - x0);
        const y = y0 + rnd() * (y1 - y0);
        const r = tam[0] + rnd() * (tam[1] - tam[0]);
        ctx.fillStyle = colores[Math.floor(rnd() * colores.length)];
        ctx.globalAlpha = 0.55 + rnd() * 0.45;
        if (rnd() > 0.6) {
            ctx.fillRect(x, y, r * 1.4, r * 1.4);       // escamas cuadradas
        } else {
            ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
}

function flor(ctx, x, y, r, petalo, centro, petalos = 5, giro = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(giro);
    for (let i = 0; i < petalos; i++) {
        ctx.rotate(TAU / petalos);
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.62, r * 0.42, r * 0.62, 0, 0, TAU);
        ctx.fillStyle = petalo;
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = r * 0.04;
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.24, 0, TAU);
    ctx.fillStyle = centro;
    ctx.fill();
    ctx.restore();
}

function piedra(ctx, x, y, r) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.5, "#e9eef5");
    g.addColorStop(1, "#9aa5b8");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

function puntaFrancesa(ctx, w, h, color, profundidad = 0.3, sonrisa = 0.12) {
    // banda de la punta con línea de sonrisa curva
    const y = h * profundidad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, y + h * sonrisa);
    ctx.quadraticCurveTo(w / 2, y - h * sonrisa * 0.9, w, y + h * sonrisa);
    ctx.lineTo(w, 0);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function lineaSonrisa(ctx, w, h, color, grosor, profundidad = 0.3, sonrisa = 0.12) {
    const y = h * profundidad;
    ctx.beginPath();
    ctx.moveTo(0, y + h * sonrisa);
    ctx.quadraticCurveTo(w / 2, y - h * sonrisa * 0.9, w, y + h * sonrisa);
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.stroke();
}

function estrella(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const rr = i % 2 ? r * 0.42 : r;
        const a = (i / 10) * TAU - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function huellita(ctx, x, y, r, color, giro = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(giro);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(0, r * 0.25, r * 0.55, r * 0.45, 0, 0, TAU); ctx.fill();
    [[-0.55, -0.35], [-0.2, -0.65], [0.2, -0.65], [0.55, -0.35]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.ellipse(dx * r, dy * r, r * 0.18, r * 0.24, dx * 0.6, 0, TAU); ctx.fill();
    });
    ctx.restore();
}

/* =========================================================
   DISEÑOS — uno por cada trabajo publicado
   ========================================================= */

export const DISEÑOS = [
    {
        tipo: "Capping",
        nombre: "Rosas con flores y pedrería",
        foto: "imagenes/WhatsApp Image 2026-11-02 at 19.57.25 (1).jpeg",
        pintar(ctx, w, h) {
            degradado(ctx, w, h, [[0, "#f6d3d1"], [0.6, "#f8dcda"], [1, "#fbeeea"]]);
            brilloEsmalte(ctx, w, h);
            flor(ctx, w * 0.36, h * 0.42, w * 0.2, "#fffaf7", "#e7b66d", 5, 0.2);
            flor(ctx, w * 0.66, h * 0.26, w * 0.13, "#d9415a", "#f6d06e", 5, 0.6);
            flor(ctx, w * 0.6, h * 0.6, w * 0.1, "#fffaf7", "#e7b66d", 5, 0.1);
            piedra(ctx, w * 0.42, h * 0.7, w * 0.05);
            piedra(ctx, w * 0.55, h * 0.76, w * 0.035);
            piedra(ctx, w * 0.3, h * 0.24, w * 0.04);
        },
        acabado: { roughness: 0.28 },
    },
    {
        tipo: "Capping",
        nombre: "Rojo con mármol plateado",
        foto: "imagenes/WhatsApp Image 2026-11-02 at 19.57.25 (5).jpeg",
        pintar(ctx, w, h) {
            degradado(ctx, w, h, [[0, "#5e0a16"], [0.5, "#8b1224"], [1, "#a4182c"]]);
            brilloEsmalte(ctx, w, h);
            ctx.lineCap = "round";
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                const x = w * (0.15 + rnd() * 0.7);
                ctx.moveTo(x, h);
                ctx.bezierCurveTo(w * rnd(), h * 0.7, w * rnd(), h * 0.4, w * (0.1 + rnd() * 0.8), 0);
                ctx.strokeStyle = i % 2 ? "rgba(230,235,245,0.95)" : "rgba(190,198,212,0.85)";
                ctx.lineWidth = w * (0.012 + rnd() * 0.03);
                ctx.stroke();
            }
            glitter(ctx, 0, 0, w, h, 140, ["#ffffff", "#d7dde8", "#ffd9de"], [0.8, 2.2]);
        },
        acabado: { roughness: 0.22, metalness: 0.15 },
    },
    {
        tipo: "Acrílicas",
        nombre: "Francés marrón con glitter dorado",
        foto: "imagenes/uñas1.jpeg",
        pintar(ctx, w, h) {
            degradado(ctx, w, h, [[0, "#e6bfac"], [1, "#f1d3c4"]]);
            brilloEsmalte(ctx, w, h);
            puntaFrancesa(ctx, w, h, "#4b2417", 0.34, 0.14);
            lineaSonrisa(ctx, w, h, "#d9ae5c", w * 0.04, 0.34, 0.14);
            glitter(ctx, 0, h * 0.33, w, h * 0.5, 160, ["#f5d27a", "#e3b14e", "#fff1c2"], [1, 3]);
        },
        acabado: { roughness: 0.25 },
    },
    {
        tipo: "Capping",
        nombre: "Nude con efecto cat eye",
        foto: "imagenes/WhatsApp Image 2026-11-02 at 19.57.25 (4).jpeg",
        pintar(ctx, w, h) {
            degradado(ctx, w, h, [[0, "#8e7471"], [1, "#a48783"]]);
            const g = ctx.createLinearGradient(0, h * 0.85, w, h * 0.15);
            g.addColorStop(0, "rgba(255,255,255,0)");
            g.addColorStop(0.42, "rgba(255,236,232,0.15)");
            g.addColorStop(0.52, "rgba(255,246,242,0.85)");
            g.addColorStop(0.62, "rgba(255,236,232,0.15)");
            g.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            glitter(ctx, 0, 0, w, h, 400, ["rgba(255,240,236,0.6)", "rgba(220,190,186,0.7)"], [0.5, 1.4]);
        },
        acabado: { roughness: 0.25, metalness: 0.12 },
    },
    {
        tipo: "Esmaltado semipermanente",
        nombre: "Negras con gatito y huellitas",
        foto: "imagenes/WhatsApp Image 2026-11-02 at 19.57.24 (2).jpeg",
        pintar(ctx, w, h) {
            degradado(ctx, w, h, [[0, "#120d0f"], [1, "#231a1d"]]);
            brilloEsmalte(ctx, w, h);
            huellita(ctx, w * 0.5, h * 0.62, w * 0.2, "#fbf3ef", -0.15);
            huellita(ctx, w * 0.36, h * 0.38, w * 0.12, "#fbf3ef", 0.3);
            huellita(ctx, w * 0.62, h * 0.24, w * 0.09, "#fbf3ef", -0.4);
        },
        acabado: { roughness: 0.12 },
    },
    {
        tipo: "Capping",
        nombre: "Blancas con lunares y flores",
        foto: "imagenes/uñas2.jpeg",
        pintar(ctx, w, h) {
            degradado(ctx, w, h, [[0, "#f4e7e3"], [1, "#fffaf8"]]);
            brilloEsmalte(ctx, w, h);
            ctx.fillStyle = "#1b1416";
            for (let y = 0.12; y < 0.95; y += 0.11) {
                for (let x = 0.12; x < 0.95; x += 0.24) {
                    const dx = (Math.round(y / 0.11) % 2) * 0.12;
                    ctx.beginPath();
                    ctx.arc(w * (x + dx), h * y, w * 0.035, 0, TAU);
                    ctx.fill();
                }
            }
            flor(ctx, w * 0.5, h * 0.5, w * 0.2, "#f3a6b6", "#fff4d6", 5, 0.4);
        },
        acabado: { roughness: 0.25 },
    },
    {
        tipo: "Acrílicas",
        nombre: "Azules con lunares y estrellas",
        foto: "imagenes/WhatsApp Image 2026-11-02 at 19.57.25 (3).jpeg",
        pintar(ctx, w, h) {
            degradado(ctx, w, h, [[0, "#f0d5cc"], [1, "#f7e4dc"]]);
            puntaFrancesa(ctx, w, h, "#2346c8", 0.5, 0.12);
            brilloEsmalte(ctx, w, h);
            ctx.fillStyle = "#ffffff";
            [[0.3, 0.2], [0.6, 0.12], [0.72, 0.34], [0.42, 0.4], [0.2, 0.42]].forEach(([x, y]) => {
                ctx.beginPath(); ctx.arc(w * x, h * y, w * 0.035, 0, TAU); ctx.fill();
            });
            estrella(ctx, w * 0.5, h * 0.26, w * 0.09, "#ffffff");
            estrella(ctx, w * 0.5, h * 0.7, w * 0.08, "#2346c8");
        },
        acabado: { roughness: 0.22 },
    },
    {
        tipo: "Capping",
        nombre: "Rojo y dorado con lunares",
        foto: "imagenes/uñas3.jpeg",
        pintar(ctx, w, h) {
            degradado(ctx, w, h, [[0, "#8f0d1d"], [1, "#b3172a"]]);
            brilloEsmalte(ctx, w, h);
            puntaFrancesa(ctx, w, h, "#c9a04f", 0.2, 0.1);
            glitter(ctx, 0, 0, w, h * 0.32, 220, ["#ffe8a3", "#e6b858", "#fff6d6"], [0.8, 2.4]);
            ctx.fillStyle = "#f2cf7a";
            [[0.3, 0.55], [0.62, 0.48], [0.45, 0.72], [0.7, 0.7], [0.36, 0.36]].forEach(([x, y]) => {
                ctx.beginPath(); ctx.arc(w * x, h * y, w * 0.045, 0, TAU); ctx.fill();
            });
        },
        acabado: { roughness: 0.2, metalness: 0.1 },
    },
    {
        tipo: "Acrílicas",
        nombre: "Francés rojo con flores",
        foto: "imagenes/WhatsApp Image 2026-11-02 at 19.57.25.jpeg",
        pintar(ctx, w, h) {
            degradado(ctx, w, h, [[0, "#f1cfc6"], [1, "#f8e0d9"]]);
            puntaFrancesa(ctx, w, h, "#b0122a", 0.32, 0.13);
            brilloEsmalte(ctx, w, h);
            flor(ctx, w * 0.42, h * 0.62, w * 0.17, "#c8162f", "#fff1cc", 5, 0.2);
            flor(ctx, w * 0.66, h * 0.76, w * 0.09, "#c8162f", "#fff1cc", 5, 0.5);
        },
        acabado: { roughness: 0.22 },
    },
    {
        tipo: "Capping",
        nombre: "Nude, animal print y dorado",
        foto: "imagenes/uñas4.jpeg",
        pintar(ctx, w, h) {
            degradado(ctx, w, h, [[0, "#d7ab90"], [1, "#e7c3aa"]]);
            brilloEsmalte(ctx, w, h);
            for (let i = 0; i < 16; i++) {
                const x = w * (0.08 + rnd() * 0.84);
                const y = h * (0.08 + rnd() * 0.84);
                const r = w * (0.05 + rnd() * 0.05);
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rnd() * TAU);
                ctx.fillStyle = "#9b5a33";
                ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.75, 0, 0, TAU); ctx.fill();
                ctx.strokeStyle = "#2b1710";
                ctx.lineWidth = r * 0.35;
                ctx.lineCap = "round";
                ctx.beginPath(); ctx.arc(0, 0, r * 1.05, 0.3, 1.9); ctx.stroke();
                ctx.beginPath(); ctx.arc(0, 0, r * 1.05, 2.6, 3.9); ctx.stroke();
                ctx.restore();
            }
            lineaSonrisa(ctx, w, h, "#d8ad55", w * 0.035, 0.22, 0.1);
        },
        acabado: { roughness: 0.25 },
    },
    {
        tipo: "Capping",
        nombre: "Grises con glitter",
        foto: "imagenes/WhatsApp Image 2026-11-02 at 19.57.24 (1).jpeg",
        pintar(ctx, w, h) {
            degradado(ctx, w, h, [[0, "#6f6a72"], [1, "#8f8a93"]]);
            glitter(ctx, 0, 0, w, h, 500, ["#ffffff", "#d9d6de", "#b5b0bb", "#f3e9ff"], [0.7, 2]);
            glitter(ctx, 0, 0, w, h * 0.45, 600, ["#ffffff", "#ece8f2"], [0.8, 2.4]);
        },
        acabado: { roughness: 0.3, metalness: 0.12 },
    },
];

/* =========================================================
   GEOMETRÍA: uña almendra curvada (curva C + arco)
   ========================================================= */

function perfil(v) {
    if (v < 0.5) return 0.86 + 0.14 * Math.sin((v / 0.5) * Math.PI / 2);
    const t = (v - 0.5) / 0.5;
    return Math.pow(Math.max(0, 1 - t * t), 0.62);
}

function crearGeometriaUña() {
    const segU = 28;
    const segV = 56;
    const grosor = 0.05;
    const curvaC = 0.62;
    const pos = [];
    const uv = [];
    const idx = [];

    const punto = (u, v) => {
        const w = ANCHO * perfil(v);
        const x = u * w;
        const y = v * LARGO - 0.1 * (1 - u * u) * Math.pow(1 - v, 6);
        const z = -curvaC * x * x - 0.12 * v * v;
        return [x, y, z];
    };

    const fila = segU + 1;

    // superficie de arriba
    for (let j = 0; j <= segV; j++) {
        for (let i = 0; i <= segU; i++) {
            const [x, y, z] = punto(-1 + (2 * i) / segU, j / segV);
            pos.push(x, y, z);
            uv.push(x / (2 * ANCHO) + 0.5, (y - BASE_Y) / (LARGO - BASE_Y));
        }
    }
    const offAbajo = pos.length / 3;
    // superficie de abajo
    for (let j = 0; j <= segV; j++) {
        for (let i = 0; i <= segU; i++) {
            const [x, y, z] = punto(-1 + (2 * i) / segU, j / segV);
            pos.push(x * 0.985, y - 0.004, z - grosor);
            uv.push(0.5, 0.5);
        }
    }

    const caraArriba = [];
    const caraAbajo = [];
    for (let j = 0; j < segV; j++) {
        for (let i = 0; i < segU; i++) {
            const a = j * fila + i;
            const b = a + 1;
            const c = a + fila;
            const d = c + 1;
            caraArriba.push(a, b, d, a, d, c);
            caraAbajo.push(a + offAbajo, d + offAbajo, b + offAbajo, a + offAbajo, c + offAbajo, d + offAbajo);
        }
    }

    // paredes laterales (izquierda, derecha y base)
    const paredes = [];
    const borde = [];
    for (let j = segV; j >= 0; j--) borde.push(j * fila);              // lado izquierdo, de la punta a la base
    for (let i = 1; i <= segU; i++) borde.push(i);                      // base
    for (let j = 1; j <= segV; j++) borde.push(j * fila + segU);        // lado derecho, de la base a la punta
    for (let k = 0; k < borde.length - 1; k++) {
        const t0 = borde[k];
        const t1 = borde[k + 1];
        paredes.push(t0, t0 + offAbajo, t1 + offAbajo, t0, t1 + offAbajo, t1);
    }

    idx.push(...caraArriba);
    const inicioResto = idx.length;
    idx.push(...caraAbajo, ...paredes);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.addGroup(0, inicioResto, 0);
    geo.addGroup(inicioResto, idx.length - inicioResto, 1);
    geo.computeVertexNormals();
    return geo;
}

function texturaDiseño(diseño, anisotropia) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 1024;
    const ctx = c.getContext("2d");
    diseño.pintar(ctx, c.width, c.height);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anisotropia;
    return t;
}

async function texturaLogo() {
    try { await document.fonts.load('200px "Great Vibes"'); await document.fonts.load('600 40px "DM Sans"'); } catch (_) { /* sin fuentes */ }
    const s = 1024;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d");

    const g = ctx.createRadialGradient(s * 0.45, s * 0.4, s * 0.05, s / 2, s / 2, s / 2);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.7, "#fdf3f0");
    g.addColorStop(1, "#f3dcd6");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);

    // arco fino
    ctx.strokeStyle = "#c97b86";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s / 2, s * 0.47, s * 0.2, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    ctx.fillStyle = "#2a2124";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '190px "Great Vibes", cursive';
    ctx.fillText("Claws bby", s / 2, s * 0.47);

    ctx.font = '600 30px "DM Sans", sans-serif';
    if ("letterSpacing" in ctx) ctx.letterSpacing = "9px";
    ctx.fillStyle = "#66585c";
    ctx.fillText("MANICURÍA A TU GUSTO", s / 2, s * 0.62);

    ctx.strokeStyle = "rgba(42,33,36,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s * 0.3, s * 0.69); ctx.lineTo(s * 0.46, s * 0.69); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.54, s * 0.69); ctx.lineTo(s * 0.7, s * 0.69); ctx.stroke();

    // corazón
    ctx.save();
    ctx.translate(s / 2, s * 0.69);
    ctx.scale(1.4, 1.4);
    ctx.fillStyle = "#c97b86";
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-14, -2, -8, -14, 0, -6);
    ctx.bezierCurveTo(8, -14, 14, -2, 0, 8);
    ctx.fill();
    ctx.restore();

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/* Entorno de reflejos suave (estudio rosado, sin focos que "quemen" el esmalte) */
function entornoSuave() {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, "#f8e9e6");
    g.addColorStop(0.55, "#e9cfcb");
    g.addColorStop(1, "#7d6264");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    // dos ventanas difusas para que el brillo tenga forma
    [[0.22, 0.22], [0.7, 0.28]].forEach(([x, y]) => {
        const r = ctx.createRadialGradient(c.width * x, c.height * y, 2, c.width * x, c.height * y, c.width * 0.12);
        r.addColorStop(0, "rgba(255,255,255,0.9)");
        r.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = r;
        ctx.fillRect(0, 0, c.width, c.height);
    });
    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/* =========================================================
   ESCENA
   ========================================================= */

export async function iniciarCatalogo3D({ contenedor, alCambiar, alElegir }) {
    const N = DISEÑOS.length;
    const paso = TAU / N;
    const RADIO_BASE = 1.38;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    contenedor.appendChild(renderer.domElement);

    const escena = new THREE.Scene();
    // Sin mapa de entorno: con la uña de frente, cualquier reflejo de entorno la blanquea.
    // El brillo de gel lo dan las luces rasantes + clearcoat.
    void entornoSuave;
    escena.add(new THREE.HemisphereLight(0xffffff, 0xe8c4c4, 0.9));

    const camara = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    // luces rasantes: si la luz viene de frente, la parte plana de la uña se "quema" en blanco
    const luz = new THREE.DirectionalLight(0xfff4f2, 1.7);
    luz.position.set(-5, 7, 3);
    escena.add(luz);
    const luzRosa = new THREE.DirectionalLight(0xf2b6c0, 0.6);
    luzRosa.position.set(6, -4, 2);
    escena.add(luzRosa);
    escena.add(new THREE.AmbientLight(0xffffff, 0.7));

    const raiz = new THREE.Group();
    escena.add(raiz);

    /* Logo central */
    const logoTex = await texturaLogo();
    const logo = new THREE.Group();
    const disco = new THREE.Mesh(
        new THREE.CylinderGeometry(1.18, 1.18, 0.08, 96),
        [
            new THREE.MeshPhysicalMaterial({ color: 0xf6e4df, roughness: 0.4, clearcoat: 0.6 }),
            new THREE.MeshBasicMaterial({ map: logoTex, toneMapped: false }),
            new THREE.MeshPhysicalMaterial({ color: 0xf6e4df, roughness: 0.6 }),
        ],
    );
    disco.rotation.set(Math.PI / 2, Math.PI / 2, 0);
    logo.add(disco);
    const aro = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.028, 24, 160),
        new THREE.MeshPhysicalMaterial({ color: 0xd6ad7e, metalness: 1, roughness: 0.22 }),
    );
    logo.add(aro);
    raiz.add(logo);

    /* Rueda de uñas */
    const rueda = new THREE.Group();
    raiz.add(rueda);

    const geo = crearGeometriaUña();
    const anis = renderer.capabilities.getMaxAnisotropy();
    const matAbajo = new THREE.MeshStandardMaterial({ color: 0xf3e1dc, roughness: 0.7, side: THREE.DoubleSide });

    const uñas = DISEÑOS.map((d, i) => {
        const mat = new THREE.MeshPhysicalMaterial({
            map: texturaDiseño(d, anis),
            roughness: d.acabado.roughness ?? 0.25,
            metalness: d.acabado.metalness ?? 0,
            clearcoat: 0.85,
            clearcoatRoughness: 0.22,
            specularIntensity: 0.6,
            envMapIntensity: 0.55,
        });
        const malla = new THREE.Mesh(geo, [mat, matAbajo]);
        malla.userData.indice = i;
        const pivote = new THREE.Group();
        pivote.rotation.z = i * paso;       // la uña 0 queda arriba
        pivote.add(malla);
        rueda.add(pivote);
        return { malla, pivote, pop: 0, entrada: reduceMotion ? 1 : 0 };
    });

    /* ---------- Estado ---------- */
    let giro = 0;          // rotación dibujada
    let objetivo = 0;      // rotación buscada
    let seleccion = -1;
    let parallaxX = 0, parallaxY = 0, pX = 0, pY = 0;
    let visible = true;
    let entradaInicio = null;

    const indiceDe = (r) => mod(Math.round(-r / paso), N);

    const irA = (i) => {
        const base = -i * paso;
        const vueltas = Math.round((objetivo - base) / TAU);
        objetivo = base + vueltas * TAU;
    };

    const ajustarAlMasCercano = () => { objetivo = Math.round(objetivo / paso) * paso; };

    /* ---------- Tamaño ---------- */
    const redimensionar = () => {
        const w = contenedor.clientWidth;
        const h = contenedor.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camara.aspect = w / h;
        const necesario = 3.45;
        const t = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
        camara.position.set(0, 0, necesario / (t * Math.min(1, camara.aspect)));
        camara.lookAt(0, 0, 0);
        camara.updateProjectionMatrix();
    };
    new ResizeObserver(redimensionar).observe(contenedor);
    redimensionar();

    /* ---------- Entrada (rueda del mouse / swipe / click) ---------- */
    let ajusteTimer;
    contenedor.addEventListener("wheel", (e) => {
        e.preventDefault();
        const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        objetivo -= clamp(d, -120, 120) * 0.0032;
        clearTimeout(ajusteTimer);
        ajusteTimer = setTimeout(ajustarAlMasCercano, 160);
    }, { passive: false });

    let arrastre = null;
    contenedor.addEventListener("pointerdown", (e) => {
        arrastre = { x: e.clientX, y: e.clientY, inicio: objetivo, ultimoX: e.clientX, t: performance.now(), vel: 0, horizontal: null, movio: false };
    });
    contenedor.addEventListener("pointermove", (e) => {
        const r = contenedor.getBoundingClientRect();
        parallaxX = ((e.clientX - r.left) / r.width - 0.5) * 2;
        parallaxY = ((e.clientY - r.top) / r.height - 0.5) * 2;
        if (!arrastre) return;
        const dx = e.clientX - arrastre.x;
        const dy = e.clientY - arrastre.y;
        if (arrastre.horizontal === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
            arrastre.horizontal = Math.abs(dx) >= Math.abs(dy) || e.pointerType === "mouse";
            if (arrastre.horizontal) contenedor.setPointerCapture(e.pointerId);
        }
        if (!arrastre.horizontal) return;
        arrastre.movio = true;
        const ahora = performance.now();
        arrastre.vel = (e.clientX - arrastre.ultimoX) / Math.max(1, ahora - arrastre.t);
        arrastre.ultimoX = e.clientX;
        arrastre.t = ahora;
        objetivo = arrastre.inicio + (dx / r.width) * 3.2;
    });
    const soltar = (e) => {
        if (!arrastre) return;
        if (arrastre.movio) {
            objetivo += clamp(arrastre.vel * 0.9, -1.6, 1.6);
            ajustarAlMasCercano();
        } else {
            elegirConClick(e);
        }
        arrastre = null;
    };
    contenedor.addEventListener("pointerup", soltar);
    contenedor.addEventListener("pointercancel", () => { arrastre = null; ajustarAlMasCercano(); });
    contenedor.addEventListener("pointerleave", () => { parallaxX = 0; parallaxY = 0; });

    const rayo = new THREE.Raycaster();
    const puntero = new THREE.Vector2();
    function elegirConClick(e) {
        const r = contenedor.getBoundingClientRect();
        puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        rayo.setFromCamera(puntero, camara);
        const hit = rayo.intersectObjects(uñas.map((u) => u.malla), false)[0];
        if (!hit) return;
        const i = hit.object.userData.indice;
        if (i === seleccion) alElegir?.(i);
        else irA(i);
    }

    /* ---------- Visibilidad: no dibujar si no se ve ---------- */
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(contenedor);

    /* ---------- Bucle ---------- */
    const reloj = new THREE.Clock();

    const animar = () => {
        requestAnimationFrame(animar);
        if (!visible) return;
        const t = reloj.getElapsedTime();

        giro += (objetivo - giro) * (reduceMotion ? 1 : 0.085);

        pX += (parallaxX - pX) * 0.05;
        pY += (parallaxY - pY) * 0.05;
        const flotar = reduceMotion ? 0 : Math.sin(t * 0.6) * 0.04;
        raiz.rotation.x = -0.28 + pY * 0.12 + flotar;
        raiz.rotation.y = pX * 0.22 + (reduceMotion ? 0 : Math.sin(t * 0.4) * 0.05);

        // entrada escalonada de las uñas
        let progresoEntrada = 1;
        if (entradaInicio !== null) progresoEntrada = clamp((performance.now() - entradaInicio) / 2200, 0, 1);

        rueda.rotation.z = giro + (1 - easeOutCubic(progresoEntrada)) * TAU * 0.6;
        logo.scale.setScalar(0.6 + 0.4 * easeOutBack(clamp(progresoEntrada * 1.6, 0, 1)));

        const sel = indiceDe(giro);
        if (sel !== seleccion) {
            seleccion = sel;
            alCambiar?.(sel, DISEÑOS[sel]);
        }

        uñas.forEach((u, i) => {
            if (entradaInicio !== null && u.entrada < 1) {
                const local = clamp(progresoEntrada * 1.5 - i * 0.04, 0, 1);
                u.entrada = local;
            }
            const e = easeOutBack(u.entrada);
            const meta = i === seleccion ? 1 : 0;
            u.pop += (meta - u.pop) * 0.12;
            const s = Math.max(0.0001, e * (1 + u.pop * 0.16));
            u.malla.scale.setScalar(s);
            u.malla.position.set(0, RADIO_BASE - 0.5 * (1 - e) + u.pop * 0.3, u.pop * 0.25);
            u.malla.rotation.y = reduceMotion ? 0 : u.pop * Math.sin(t * 1.4) * 0.22;
            u.malla.rotation.x = -u.pop * 0.18;
        });

        renderer.render(escena, camara);
    };
    animar();

    return {
        entrar() { entradaInicio = performance.now(); },
        siguiente() { objetivo = Math.round(objetivo / paso) * paso - paso; },
        anterior() { objetivo = Math.round(objetivo / paso) * paso + paso; },
        irA,
        total: N,
    };
}
