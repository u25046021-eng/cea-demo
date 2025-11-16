// js/script.js

document.addEventListener("DOMContentLoaded", () => {
    // =========================================
    // 0. CONTROL DE SCROLL Y MENÚ HAMBURGUESA
    // =========================================
    window.scrollTo(0, 0); 

    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }

    // =========================================
    // 1. GESTIÓN DE DATOS (SOLO LECTURA)
    // =========================================

    let eventList = [];

    // Array de respaldo para cuando falla la carga del JSON
    const FALLBACK_EVENTS = [
        { id: 1, day: 28, month: 10, title: "Taller de Reciclaje", info: "10:00 am - 13:00 pm Sede Principal" },
        { id: 2, day: 5, month: 11, title: "Caminata Ecológica", info: "08:00 am - 11:00 am Parque Norte" },
        { id: 3, day: 12, month: 11, title: "Charla: Cambio Climático", info: "18:00 pm - 20:00 pm Virtual (Zoom)" }
    ];

    async function fetchDefaultEvents() {
        try {
            const response = await fetch("./data/events.json"); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            eventList = data.map((event) => ({ ...event, id: parseInt(event.id) }));
        } catch (error) {
            console.error("⚠️ ERROR: No se pudo cargar events.json. Usando datos de respaldo.", error);
            eventList = FALLBACK_EVENTS;
        }
    }

    async function loadEvents() {
        // Ahora solo carga desde el archivo JSON, ya no usa localStorage
        await fetchDefaultEvents();
    }

    function getEventsForCalendar() {
        const eventsData = {};
        const currentYear = new Date().getFullYear();
        eventList.forEach((event) => {
            const key = `${event.day}-${event.month}-${currentYear}`;
            if (!eventsData[key]) eventsData[key] = [];
            eventsData[key].push({ title: event.title, info: event.info, id: event.id });
        });
        return eventsData;
    }

    // =========================================
    // 2. RENDERIZADO RÁPIDO (LISTA Y CALENDARIO)
    // =========================================

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    const calendarWidget = document.querySelector(".calendar-widget");
    const eventsListContainer = document.querySelector(".events-list");
    const monthNamesShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    function renderEventsAndCalendar() {
        if (!eventsListContainer) return;

        const sortedList = [...eventList].sort((a, b) => {
            if (a.month !== b.month) return a.month - b.month;
            return a.day - b.day;
        });

        // 1. Redibuja la LISTA pública
        let publicListHTML = '';
        sortedList.forEach((event) => {
            publicListHTML += `
                <div class="event-item">
                    <div class="event-date">
                        <div class="day">${event.day < 10 ? "0" + event.day : event.day}</div>
                        <div class="month">${monthNamesShort[event.month]}</div>
                    </div>
                    <div class="event-info">
                        <h4>${event.title}</h4>
                        <p>${event.info}</p>
                    </div>
                </div>`;
        });
        eventsListContainer.innerHTML = publicListHTML;
        
        // 2. Redibuja el CALENDARIO
        updateCalendar(currentMonth, currentYear);
    }
    
    function updateCalendar(month, year) {
        if (!calendarWidget) return;

        const events = getEventsForCalendar();
        const now = new Date();
        const today = now.getDate();
        const currentActualMonth = now.getMonth();
        const currentActualYear = now.getFullYear();

        let firstDayIndex = new Date(year, month, 1).getDay();
        const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <button id="prevMonth" title="Mes anterior" style="background:none; border:none; cursor:pointer; font-size:1.5rem; color:var(--primary-green);"><i class="fas fa-chevron-left"></i></button>
                <h4 style="margin: 0; color: var(--primary-green);">${monthNames[month]} ${year}</h4>
                <button id="nextMonth" title="Mes siguiente" style="background:none; border:none; cursor:pointer; font-size:1.5rem; color:var(--primary-green);"><i class="fas fa-chevron-right"></i></button>
            </div>
            <table class="calendar-table">
                <thead>
                    <tr><th>L</th><th>M</th><th>X</th><th>J</th><th>V</th><th>S</th><th>D</th></tr>
                </thead>
                <tbody><tr>`;

        for (let i = 0; i < adjustedFirstDay; i++) html += "<td></td>";

        let currentDayOfWeek = adjustedFirstDay;

        for (let day = 1; day <= daysInMonth; day++) {
            if (currentDayOfWeek > 6) {
                html += "</tr><tr>";
                currentDayOfWeek = 0;
            }

            const eventKey = `${day}-${month}-${year}`;
            const eventArray = events[eventKey];

            let classList = [];
            if (day === today && month === currentActualMonth && year === currentActualYear) classList.push("active-date");
            if (eventArray) classList.push("has-event");

            const dataAttributes = eventArray
                ? `data-event-title="${eventArray[0].title}" data-event-info="${eventArray[0].info}"`
                : "";

            html += `<td class="${classList.join(" ")}" ${dataAttributes}>${day}</td>`;
            currentDayOfWeek++;
        }

        html += "</tr></tbody></table>";
        html += '<div id="calendar-info-box" class="calendar-info-box" style="display:none;"></div>';

        calendarWidget.innerHTML = html;
        attachCalendarListeners();
    }
    
    function attachCalendarListeners() {
        document.getElementById("prevMonth")?.addEventListener("click", () => changeMonth(-1));
        document.getElementById("nextMonth")?.addEventListener("click", () => changeMonth(1));

        const infoBox = document.getElementById("calendar-info-box");

        document.querySelectorAll(".calendar-table td.has-event").forEach((td) => {
            td.addEventListener("click", function (e) {
                const rect = e.target.getBoundingClientRect();
                infoBox.innerHTML = `<p><strong>${e.target.getAttribute("data-event-title")}</strong></p><p style="margin-top:5px; font-size:0.9em; color:#ddd;">${e.target.getAttribute("data-event-info")}</p>`;
                const widgetRect = calendarWidget.getBoundingClientRect();

                infoBox.style.left = `${rect.left - widgetRect.left + rect.width / 2}px`;
                infoBox.style.top = `${rect.bottom - widgetRect.top + 10}px`;
                infoBox.style.transform = `translateX(-50%)`;
                infoBox.style.display = "block";

                setTimeout(() => { infoBox.style.display = "none"; }, 4000);
            });
        });

        document.addEventListener("click", (e) => {
            // Se eliminó la referencia a 'adminSection'
            if (!calendarWidget?.contains(e.target) && infoBox && !infoBox.contains(e.target)) {
                infoBox.style.display = "none";
            }
        });
    }

    function changeMonth(step) {
        currentMonth += step;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        } else if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar(currentMonth, currentYear);
    }

    // =========================================
    // 3. SECCIÓN DE ADMINISTRACIÓN (ELIMINADA)
    // =========================================
    
    // Todo el código relacionado con buildAdminPanel, handleEventSubmit,
    // keydown listener, hashString, saveEvents y toggleAdminPanel
    // ha sido eliminado.

    // =========================================
    // 4. INICIALIZACIÓN Y ANIMACIONES
    // =========================================

    loadEvents().then(() => {
        renderEventsAndCalendar();
    });

    // [Código de las funciones de animación, omitido]
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px",
    };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('fade-up') || entry.target.classList.contains('fade-in')) {
                    entry.target.classList.add('element-visible');
                }
                if (entry.target.classList.contains('events-section') || entry.target.classList.contains('location-section')) {
                    const container = entry.target.querySelector('.leaf-animation-container');
                    if (container && !container.dataset.generated) {
                        generateSideLeaves(container);
                        container.dataset.generated = 'true';
                    }
                }
                observer.unobserve(entry.target);
            }
        });
    });
    
    // Se eliminó el 'if (el.id !== "admin-section")'
    document
        .querySelectorAll(".fade-up, .fade-in, .events-section, .location-section")
        .forEach((el) => {
            observer.observe(el);
        });

    const heroSection = document.querySelector(".hero");
    if (heroSection) {
        for (let i = 0; i < 5; i++) {
            let leaf = document.createElement("div");
            leaf.className = "leaf";
            heroSection.appendChild(leaf);
        }
    }

    function generateSideLeaves(container) {
        for (let i = 0; i < 6; i++) {
            let leaf = document.createElement("div");
            leaf.className = "side-leaf";
            leaf.style.top = 10 + Math.random() * 80 + "%";
            if (Math.random() > 0.5) {
                leaf.style.left = "-30px";
                leaf.classList.add("animate-leaf-left");
            } else {
                leaf.style.right = "-30px";
                leaf.classList.add("animate-leaf-right");
            }
            const size = 20 + Math.random() * 15;
            leaf.style.width = `${size}px`;
            leaf.style.height = `${size}px`;
            leaf.style.animationDelay = Math.random() * 2 + "s";
            container.appendChild(leaf);
        }
    }
});