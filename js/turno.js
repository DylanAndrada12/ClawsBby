/* Claws Bby · Registrar turno: arma el mensaje y abre WhatsApp (no se guarda nada en ningún servidor) */
(() => {
    "use strict";
    const TELEFONO = "5491159372996";

    const form = document.getElementById("form-turno");
    const nombre = document.getElementById("nombre");
    const errorNombre = document.getElementById("error-nombre");

    const validar = () => {
        const ok = nombre.value.trim().length >= 2;
        errorNombre.textContent = ok ? "" : "Contame tu nombre así sé quién sos ♡";
        nombre.setAttribute("aria-invalid", String(!ok));
        return ok;
    };

    nombre.addEventListener("blur", validar);

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!validar()) { nombre.focus(); return; }

        const datos = new FormData(form);
        const lineas = [
            `¡Hola Evi! Soy ${datos.get("nombre").trim()} y quiero reservar un turno ♡`,
            `• Servicio: ${datos.get("servicio")}`,
        ];
        const dia = datos.get("dia");
        if (dia) lineas.push(`• Día que me queda bien: ${dia}`);
        const horario = datos.get("horario");
        if (horario) lineas.push(`• Horario: ${horario}`);
        const idea = (datos.get("idea") || "").trim();
        if (idea) lineas.push(`• Idea de diseño: ${idea}`);

        const url = `https://wa.me/${TELEFONO}?text=${encodeURIComponent(lineas.join("\n"))}`;
        window.open(url, "_blank", "noopener");
    });
})();
