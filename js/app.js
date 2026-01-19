/* ======================================================
   1. CONFIGURACIÓN GLOBAL
====================================================== */

const ID = 1;
const API_URL = "https://sheetdb.io/api/v1/mdaz3wrflxsmq";

/* Lista blanca de comités válidos */
const COMITES_VALIDOS = [
    "JuntaLocal",
    "EscuelaDominical",
    "Jovenes",
    "DamasDorcas",
    "Musica",
    "Misiones",
    "MinisterioEstudiantil",
    "ObraSocial",
    "Comunicaciones",
    "Refam"
];

/* ===================== NUEVO ===================== */
/* RUTAS / VISTAS DE LA APP */
const RUTAS = {
    inicio: "inicio",
    menu: "menu",
    seleccionarInforme: "seleccionar-informe",
    comite: "comite",
    informe: "informe"
};

/* ======================================================
   2. ESTADO DE LA APP
====================================================== */

const FECHA_ACTUAL = (() => {
    const fecha = new Date();
    const meses = [
        "ENERO","FEBRERO","MARZO","ABRIL",
        "MAYO","JUNIO","JULIO","AGOSTO",
        "SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"
    ];
    return { mes: meses[fecha.getMonth()], anio: fecha.getFullYear() };
})();

const AppState = {
    comite: null,
    mesAno: `${FECHA_ACTUAL.mes} ${FECHA_ACTUAL.anio}`,
    mesAnoEnviado: {}
};

/* ======================================================
   3. DOM BASE
====================================================== */

const contenedor = document.getElementById("contenido");
const btnfooter = document.getElementById("btnfooter");

/* ======================================================
   4. UTILIDADES
====================================================== */

function comiteYaEnviado(comite) {
    return AppState.mesAnoEnviado[comite] === AppState.mesAno;
}

async function obtenerVersiculoDelDia() {
    const ahora = new Date();

    const dia = ahora.getDate();        // 1 a 31
    const hora = ahora.getHours();      // 0 a 23
    const minuto = ahora.getMinutes();  // 0 a 59

    // Índice dinámico basado en día + hora + minuto
    let indice = dia + hora + minuto;   // máximo 115

    // Seguridad de rango (1 a 115)
    if (indice < 1) indice = 1;
    if (indice > 115) indice = 115;

    const res = await fetch("./json/versiculos.json");
    const lista = await res.json();

    // Buscar por id
    const versiculo = lista.find(v => v.id === indice) || lista[0];

    return {
        texto: versiculo.texto,
        cita: versiculo.cita
    };
}

function abrirWhatsApp(mensaje) {
    const texto = encodeURIComponent(mensaje);
    const urlApp = `whatsapp://send?text=${texto}`;
    const urlWeb = `https://wa.me/?text=${texto}`;

    if (/Android|iPhone/i.test(navigator.userAgent)) {
        window.location.href = urlApp;
        setTimeout(() => window.open(urlWeb, "_blank"), 600);
    } else {
        window.open(urlWeb, "_blank");
    }
}

/* ======================================================
   5. LOADER
====================================================== */

window.Loader = {
    async cargar(ruta, destino, vars = {}) {
        const res = await fetch(ruta);
        let html = res.ok ? await res.text() : "<p>Error al cargar</p>";

        for (const [key, value] of Object.entries(vars)) {
            html = html.replaceAll(`{{${key}}}`, value);
        }

        destino.innerHTML = html;
    }
};

/* ======================================================
   6. NAVEGACIÓN (HISTORY API)
====================================================== */

/* ===== NUEVO: FUNCIÓN CENTRAL ===== */
function navegar(vista, data = {}) {
    let hash = "#" + vista;

    if (vista === RUTAS.comite && data.comite) {
        hash = `#comite/${data.comite}`;
    }

    if (vista === RUTAS.informe && data.comite) {
        hash = `#informe/${data.comite}`;
    }

    history.pushState(null, "", hash);
    renderVista(vista, data);
}

/* ===== NUEVO: RENDER SEGÚN VISTA ===== */
function renderVista(vista, data = {}) {
    switch (vista) {
        case RUTAS.inicio:
            mostrarInicio();
            break;
        case RUTAS.menu:
            mostrarMenu();
            break;
        case RUTAS.comite:
            mostrarComite(data.comite);
            break;
        case RUTAS.seleccionarInforme:
            mostrarSeleccionarInforme();
            break;
        case RUTAS.informe:
            mostrarInforme(data.comite);
            break;
        default:
            mostrarInicio();
    }
}

/* ===== NUEVO: BOTÓN ATRÁS ===== */
window.onpopstate = (e) => {
    if (!e.state) return;
    renderVista(e.state.vista, e.state.data);
};

/* ======================================================
   7. VISTAS
====================================================== */

async function mostrarInicio() {
    AppState.comite = null;

    const versiculo = await obtenerVersiculoDelDia();

    // 🔹 Cargar vista inicio
    await Loader.cargar("./partials/inicio.html", contenedor, {
        VERSICULO_TEXTO: versiculo.texto,
        VERSICULO_CITA: versiculo.cita
    });

    // 🔹 Cargar botón compartir en el footer (igual que menú)
    await Loader.cargar("./partials/btn-footer-compartir.html", btnfooter);

    // 🔹 Activar lógica del botón compartir
    activarCompartirMenu();

    // 🔹 Botones del inicio
    document.getElementById("btnRegistrarInforme").onclick =
        () => navegar(RUTAS.menu);

    document.getElementById("btnVerInformes").onclick =
        () => navegar(RUTAS.seleccionarInforme);
}

async function mostrarMenu() {
    AppState.comite = null;

    await Loader.cargar("./partials/menu.html", contenedor, {
        MES_ANO: `${FECHA_ACTUAL.mes} ${FECHA_ACTUAL.anio}`
    });

    await Loader.cargar("./partials/btn-footer-compartir.html", btnfooter);

    activarMenu();
    activarCompartirMenu();

    /* ===== PASO 6 (MARCAR COMITÉS ENVIADOS) ===== */
    document.querySelectorAll("[data-comite]").forEach(btn => {
        const c = btn.dataset.comite;
    });
}

async function mostrarSeleccionarInforme() {
    AppState.comite = null;

    await Loader.cargar(
        "./partials/seleccionar-informe.html",
        contenedor
    );

    btnfooter.innerHTML = "";

    document.querySelectorAll("[data-informe]").forEach(btn => {
        const c = btn.dataset.informe;

        btn.onclick = () => {
            navegar(RUTAS.informe, { comite: c });
        };

        // 🔥 ÚNICA LÓGICA
        if (comiteYaEnviado(c)) {
            btn.classList.add("comite-enviado");
        }
    });
}

async function mostrarComite(nombre) {
    if (!COMITES_VALIDOS.includes(nombre)) return navegar(RUTAS.menu);

    AppState.comite = nombre;

    if (comiteYaEnviado(nombre)) {
        await Loader.cargar(
            "./partials/enviado.html",
            contenedor,
            { MES_ANO: AppState.mesAno }
        );

        await Loader.cargar("./partials/btn-footer-ver-informe.html", btnfooter);

        document.getElementById("btnVerInforme").onclick =
            () => navegar(RUTAS.informe, { comite: nombre });

        return;
    }

    await Loader.cargar(
        `./partials/formulario-comite/${nombre}.html`,
        contenedor
    );

    await Loader.cargar("./partials/btn-footer-enviar.html", btnfooter);

    activarEnvio();
}

async function mostrarInforme(nombre) {
    if (!COMITES_VALIDOS.includes(nombre)) return navegar(RUTAS.menu);

    AppState.comite = nombre;

    // 1️⃣ Traer datos primero
    const res = await fetch(`${API_URL}/search?ID=${ID}&single_object=true`);
    const datos = JSON.parse((await res.json())[nombre] || "{}");

    // 2️⃣ Mes/Año real del registro
    const mesAnoReal = datos.mes_ano || "SIN REGISTRO";

    // 3️⃣ Cargar HTML ya con el mes correcto
    await Loader.cargar(
        `./partials/informe-comite/${nombre}.html`,
        contenedor,
        { MES_ANO: mesAnoReal }
    );
    
    if (datos.mes_ano !== AppState.mesAno) {
        contenedor
          .querySelector(".informe-registrado")
          ?.classList.add("informe-registrado-antiguo");
    }

    // 4️⃣ Footer
    await Loader.cargar(
        "./partials/btn-footer-compartir-registro.html",
        btnfooter
    );

    activarCompartirRegistro();

    // 5️⃣ Pintar datos del informe
    Object.entries(datos).forEach(([k, v]) => {
        const el = document.getElementById(k);
        if (el) el.textContent = v || "—";
    });
}

/* ======================================================
   8. EVENTOS
====================================================== */

function activarMenu() {
    document.querySelectorAll("[data-comite]").forEach(btn => {
        btn.onclick = e => {
            e.preventDefault();
            navegar(RUTAS.comite, { comite: btn.dataset.comite });
        };
    });
}

function activarEnvio() {
    const btn = document.getElementById("btnEnviar");
    if (!btn) return;
    btn.onclick = () => {
        if (validarCampos()) {
            // Notificación antes de enviar a la base de datos
            flashy.info("Enviando informe...", { duration: 3000 });
            enviarDatos();
        }
    };
}

/* ======================================================
   9. FOOTER
====================================================== */

function activarCompartirMenu() {
    const btn = document.getElementById("btnCompartir");
    if (!btn) return;

    btn.onclick = () => {
        const mensaje = `
*Dios les bendiga, amados hermanos y secretarios de cada comité 🙌*

Les pedimos de favor nos ayuden enviando la información de todo lo realizado durante el mes.

A través del siguiente enlace:
https://informe-secretario.netlify.app

Muchas gracias por su colaboración, Dios les bendiga grandemente 😇🙏
        `.trim();

        abrirWhatsApp(mensaje);
    };
}

function activarCompartirRegistro() {
    const btn = document.getElementById("btnCompartirRegistro");
    if (!btn) return;

    btn.onclick = () => {
        const mensaje = `
Dios le bendiga 🙌

Aquí le comparto el informe registrado del comité ${AppState.comite} 📋
https://informe-secretario.netlify.app/#informe/${AppState.comite}
        `.trim();

        abrirWhatsApp(mensaje);
    };
}

/* ======================================================
   10. VALIDACIONES
====================================================== */

function validarCampos() {
    const inputs = contenedor.querySelectorAll("input");

    // Validar inputs normales (no radio)
    for (const input of inputs) {
        if (input.type !== "radio" && !input.value.trim()) {
            flashy.info(`Completa el campo "${input.name}"`);
            input.focus();
            return false;
        }
    }

    // Validar que haya al menos un radio seleccionado por grupo (por name)
    const gruposRadio = {};

    for (const input of inputs) {
        if (input.type === "radio") {
            const nombre = input.name || "opción";
            if (!gruposRadio[nombre]) {
                gruposRadio[nombre] = {
                    tieneSeleccionado: false,
                    primero: input
                };
            }
            if (input.checked) {
                gruposRadio[nombre].tieneSeleccionado = true;
            }
        }
    }

    for (const [nombre, grupo] of Object.entries(gruposRadio)) {
        if (!grupo.tieneSeleccionado) {
            flashy.info(`Selecciona una opción en "${nombre}"`);
            grupo.primero.focus();
            return false;
        }
    }

    return true;
}

/* ======================================================
   11. API
====================================================== */

async function enviarDatos() {
    const COMITE = AppState.comite;

    try {
        // 1️⃣ Traer fila completa
        const res = await fetch(`${API_URL}/search?ID=${ID}&single_object=true`);
        const fila = await res.json();

        // 2️⃣ Obtener datos actuales del comité
        let objetoComite = fila[COMITE]
            ? JSON.parse(fila[COMITE])
            : {};

        // 3️⃣ Obtener mes_ano_enviado completo
        let mesAnoEnviado = fila.mes_ano_enviado
            ? JSON.parse(fila.mes_ano_enviado)
            : {};

        // 4️⃣ Guardar datos del formulario
        contenedor.querySelectorAll("input").forEach(i => {
            if (i.type !== "radio" || i.checked) {
                objetoComite[i.name] = i.value;
            }
        });

        // 5️⃣ Guardar mes y año en el comité
        objetoComite.mes_ano = AppState.mesAno;

        // 6️⃣ Guardar mes y año SOLO en el comité correspondiente
        mesAnoEnviado[COMITE] = AppState.mesAno;

        // 7️⃣ PATCH ÚNICO
        await fetch(`${API_URL}/ID/${ID}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                [COMITE]: JSON.stringify(objetoComite),
                mes_ano_enviado: JSON.stringify(mesAnoEnviado)
            })
        });

        // 8️⃣ Limpiar historial del formulario
        history.replaceState(null, "", `#informe/${COMITE}`);

        renderVista(RUTAS.informe, { comite: COMITE });

        // 9️⃣ Notificación de éxito
        flashy.success("Informe enviado con éxito");
    } catch (e) {
        // 🔟 Notificación de error
        console.error(e);
        flashy.error("Ocurrió un error al enviar el informe. Intenta nuevamente.");
    }
}

/* ======================================================
   12. ARRANQUE (LEE LA URL)
====================================================== */

async function iniciarApp() {
    try {
        const res = await fetch(`${API_URL}/search?ID=${ID}&single_object=true`);
        const fila = await res.json();

        AppState.mesAnoEnviado = fila.mes_ano_enviado
            ? JSON.parse(fila.mes_ano_enviado)
            : {};
    } catch (e) {
        AppState.mesAnoEnviado = {};
    }

    const hash = location.hash.replace("#", "");
    const [vista, comite] = hash.split("/");

    switch (vista) {
        case RUTAS.menu:
            mostrarMenu();
            break;

        case RUTAS.seleccionarInforme:
            mostrarSeleccionarInforme();
            break;

        case RUTAS.comite:
            COMITES_VALIDOS.includes(comite)
                ? mostrarComite(comite)
                : mostrarMenu();
            break;

        case RUTAS.informe:
            COMITES_VALIDOS.includes(comite)
                ? mostrarInforme(comite)
                : mostrarMenu();
            break;

        default:
            mostrarInicio();
    }
}

/* ======================================================
   11.5. CONFIGURACIÓN DE EVENTOS DEL BANNER
====================================================== */

function configurarBanner() {
    const banner = document.getElementById("bannerPrincipal");
    if (banner) {
        banner.style.cursor = "pointer";
        banner.onclick = () => navegar(RUTAS.inicio);
    }
}

window.addEventListener("load", () => {
    iniciarApp();
    configurarBanner();
});
window.onpopstate = iniciarApp;

/* ======================================================
   13. PWA
====================================================== */

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}
