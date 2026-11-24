/* Claws Bby · Mapa 3D de la ubicación (MapLibre + OpenFreeMap, sin API key) */
(() => {
    "use strict";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (s, r = document) => r.querySelector(s);
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

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


})();
