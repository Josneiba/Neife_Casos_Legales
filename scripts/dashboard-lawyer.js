document.addEventListener("DOMContentLoaded", () => {
  const lawyerName = localStorage.getItem("lawyerName") || "Abogado"
  document.getElementById("lawyerName").textContent = lawyerName

  // Add click handlers for sections and subsections
  setupNavigationHandlers()

  // Load dashboard summary by default
  loadDashboardSummary()
})

function setupNavigationHandlers() {
  // Handle main section clicks
  document.querySelectorAll(".nav-section h2").forEach((section) => {
    section.addEventListener("click", function () {
      const sectionId = this.textContent.toLowerCase().replace(/\s+/g, "-")
      loadSection(sectionId, this.textContent)
    })
  })

  // Handle subsection clicks
  document.querySelectorAll(".nav-section h3").forEach((subsection) => {
    subsection.addEventListener("click", function () {
      const subsectionId = this.textContent.toLowerCase().replace(/\s+/g, "-")
      loadSubsection(subsectionId, this.textContent)
    })
  })

  // Handle individual link clicks
  document.querySelectorAll(".nav-section a").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const linkId = this.getAttribute("href").substring(1)
      loadContent(linkId, this.textContent)

      // Update active state
      document.querySelectorAll(".nav-section a").forEach((a) => a.classList.remove("active"))
      this.classList.add("active")
    })
  })
}

function loadSection(sectionId, title) {
  const contentArea = document.querySelector(".content-area")
  const sectionContent = document.createElement("div")
  sectionContent.className = "section-content active"

  // Get subsections for this section
  const section = document.querySelector(`h2:contains('${title}')`).closest(".nav-section")
  const subsections = Array.from(section.querySelectorAll("a")).map((a) => ({
    title: a.textContent,
    id: a.getAttribute("href").substring(1),
  }))

  sectionContent.innerHTML = `
        <h2>${title}</h2>
        <div class="section-summary">
            ${subsections
              .map(
                (sub) => `
                <div class="summary-card" onclick="loadContent('${sub.id}', '${sub.title}')">
                    <h4>${sub.title}</h4>
                    <p>Ver detalles</p>
                </div>
            `,
              )
              .join("")}
        </div>
    `

  // Replace existing content
  const existing = document.querySelector(".section-content")
  if (existing) existing.remove()
  contentArea.appendChild(sectionContent)
}

function loadSubsection(subsectionId, title) {
  const contentArea = document.querySelector(".content-area")
  const sectionContent = document.createElement("div")
  sectionContent.className = "section-content active"

  // Get items for this subsection
  const subsection = document.querySelector(`h3:contains('${title}')`).closest(".sub-section")
  const items = Array.from(subsection.querySelectorAll("a")).map((a) => ({
    title: a.textContent,
    id: a.getAttribute("href").substring(1),
  }))

  sectionContent.innerHTML = `
        <h3>${title}</h3>
        <div class="section-summary">
            ${items
              .map(
                (item) => `
                <div class="summary-card" onclick="loadContent('${item.id}', '${item.title}')">
                    <h4>${item.title}</h4>
                    <p>Ver detalles</p>
                </div>
            `,
              )
              .join("")}
        </div>
    `

  // Replace existing content
  const existing = document.querySelector(".section-content")
  if (existing) existing.remove()
  contentArea.appendChild(sectionContent)
}

function loadContent(contentId, title) {
  const contentArea = document.querySelector(".content-area")
  const sectionContent = document.createElement("div")
  sectionContent.className = "section-content active"

  // Generate content based on contentId
  sectionContent.innerHTML = `
        <h3>${title}</h3>
        <div class="content-details">
            ${getContentDetails(contentId)}
        </div>
    `

  // Replace existing content
  const existing = document.querySelector(".section-content")
  if (existing) existing.remove()
  contentArea.appendChild(sectionContent)

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    toggleSidebar()
  }
}

function getContentDetails(contentId) {
  // Content templates for different sections
  const templates = {
    "resumen-casos": `
            <div class="cases-list">
                <h4>Casos Activos Actuales</h4>
                <div class="case-items">
                    <div class="case-item">
                        <h5>Caso #12345</h5>
                        <p>Cliente: Juan Pérez</p>
                        <p>Tipo: Derecho Laboral</p>
                        <p>Estado: En proceso</p>
                        <p>Último actualización: Hace 2 días</p>
                    </div>
                    <div class="case-item">
                        <h5>Caso #67890</h5>
                        <p>Cliente: María Rodríguez</p>
                        <p>Tipo: Derecho Civil</p>
                        <p>Estado: Preparación para juicio</p>
                        <p>Último actualización: Ayer</p>
                    </div>
                </div>
            </div>
        `,
    "casos-disponibles": `
            <div class="available-cases">
                <h4>Casos Disponibles</h4>
                <div class="case-items">
                    <div class="case-item">
                        <h5>Caso #54321</h5>
                        <p>Tipo: Derecho Penal</p>
                        <p>Descripción: Defensa en caso de fraude</p>
                        <button onclick="expresarInteres('54321')">Expresar Interés</button>
                    </div>
                    <div class="case-item">
                        <h5>Caso #98765</h5>
                        <p>Tipo: Derecho Familiar</p>
                        <p>Descripción: Proceso de divorcio</p>
                        <button onclick="expresarInteres('98765')">Expresar Interés</button>
                    </div>
                </div>
            </div>
        `,
    "vista-calendario": `
            <div class="calendar-view">
                <h4>Calendario de Actividades</h4>
                <div id="calendar"></div>
                <script>
                    // Aquí se integraría una biblioteca de calendario como FullCalendar
                    // Por ahora, mostraremos un placeholder
                    document.getElementById('calendar').innerHTML = '<p>Calendario se mostrará aquí</p>';
                </script>
            </div>
        `,
    // Add more templates for other sections
  }

  return (
    templates[contentId] ||
    `
        <div class="placeholder-content">
            <p>Contenido para ${contentId} se mostrará aquí.</p>
        </div>
    `
  )
}

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar")
  sidebar.classList.toggle("active")
}

// Utility function for case-insensitive contains selector
jQuery.expr[":"].contains = (a, i, m) => jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0

// Handle window resize
window.addEventListener("resize", () => {
  const sidebar = document.querySelector(".sidebar")
  if (window.innerWidth > 768) {
    sidebar.classList.remove("active")
  }
})

// Handle escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && window.innerWidth <= 768) {
    const sidebar = document.querySelector(".sidebar")
    if (sidebar.classList.contains("active")) {
      sidebar.classList.remove("active")
    }
  }
})

function loadDashboardSummary() {
  const contentArea = document.querySelector(".content-area")
  const summaryContent = document.createElement("div")
  summaryContent.className = "section-content active"

  summaryContent.innerHTML = `
        <h2>Bienvenido a tu Dashboard</h2>
        <div class="dashboard-summary">
            <div class="summary-section">
                <h3>Resumen de Casos Activos</h3>
                <p>Casos en curso: 5</p>
                <p>Casos de alta prioridad: 2</p>
                <p>Próximo plazo: 15/05/2023</p>
            </div>
            <div class="summary-section">
                <h3>Notificaciones</h3>
                <p>Nuevos casos potenciales: 3</p>
                <p>Mensajes no leídos: 7</p>
            </div>
            <div class="summary-section">
                <h3>Métricas de Rendimiento</h3>
                <p>Casos ganados este mes: 4</p>
                <p>Satisfacción del cliente: 4.8/5</p>
            </div>
            <div class="summary-section">
                <h3>Tareas Pendientes</h3>
                <p>Documentos por revisar: 3</p>
                <p>Próxima cita: Hoy, 14:00</p>
            </div>
        </div>
    `

  // Replace existing content
  const existing = document.querySelector(".section-content")
  if (existing) existing.remove()
  contentArea.appendChild(summaryContent)

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    toggleSidebar()
  }
}

function expresarInteres(casoId) {
  alert(`Has expresado interés en el caso #${casoId}. Un administrador se pondrá en contacto contigo pronto.`)
}

