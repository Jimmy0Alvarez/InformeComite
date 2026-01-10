(() => {

    const API_URL =
        "https://timeapi.io/api/Time/current/zone?timeZone=America/Guayaquil";

    const INTERVALO = 30000;

    let fechaApi = null;
    let intervalo = null;
    let validado = false;

    const obtenerFechaLocal = () => {
        const d = new Date();
        return { mes: d.getMonth() + 1, anio: d.getFullYear() };
    };

    const comparar = (a, b) => a.mes === b.mes && a.anio === b.anio;

    async function obtenerFechaApi() {
        console.log("🔍 Consultando API (mes/año)...");
        const r = await fetch(API_URL, { cache: "no-store" });
        if (!r.ok) throw new Error("API falló");
        const d = await r.json();
        return { mes: d.month, anio: d.year };
    }

    function verificar() {
        if (validado) return;

        const local = obtenerFechaLocal();

        if (comparar(local, fechaApi)) {
            console.log(`✅ FECHA CORRECTA → ${local.mes}/${local.anio}`);
            validado = true;

            if (intervalo) {
                clearInterval(intervalo);
                intervalo = null;
                console.log("🛑 Comparaciones detenidas");
            }

        } else {
            console.warn(
                `❌ FECHA INCORRECTA → Dispositivo ${local.mes}/${local.anio} | API ${fechaApi.mes}/${fechaApi.anio}`
            );

            flashy.warning(
                "El mes y año de tu dispositivo es incorrecto. Por favor ajusta y actualiza.",
                { duration: 27000 }
            );

            if (!intervalo) {
                console.log("⏱️ Iniciando verificación cada 30s");
                intervalo = setInterval(verificar, INTERVALO);
            }
        }
    }

    async function iniciar() {
        while (!fechaApi) {
            try {
                fechaApi = await obtenerFechaApi();
                console.log("📦 Fecha API obtenida:", fechaApi);

                // 🔍 Comparación inmediata
                verificar();

            } catch {
                console.warn("⚠️ API no respondió, reintentando...");
            }
        }
    }

    window.addEventListener("load", iniciar);

})();