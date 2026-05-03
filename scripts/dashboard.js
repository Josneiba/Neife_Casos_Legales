document.addEventListener("DOMContentLoaded", () => {
  const userName = localStorage.getItem("userName") || "Cliente"
  document.getElementById("userName").textContent = userName

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
    "casos-activos": `
            <div class="cases-list">
                <h4>Casos Activos Actuales</h4>
                <div class="case-items">
                    <div class="case-item">
                        <h5>Caso #12345</h5>
                        <p>Estado: En proceso</p>
                        <p>Último actualización: Hace 2 días</p>
                    </div>
                    <!-- Add more case items as needed -->
                </div>
            </div>
        `,
    "nuevo-caso": `
            <div class="new-case-form">
                <form>
                    <div class="form-group">
                        <label>Tipo de Caso</label>
                        <select>
                            <option>Seleccione tipo de caso</option>
                            <option>Civil</option>
                            <option>Penal</option>
                            <option>Laboral</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea rows="4"></textarea>
                    </div>
                    <button type="submit">Crear Nuevo Caso</button>
                </form>
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

// Get content for each section
function getSectionContent(sectionId) {
  const contents = {
    experiencia: `
            <h2>Experiencia y Especialidad</h2>
            <div class="content-placeholder">
                <p>Aquí se mostrará la información sobre experiencia y especialidad.</p>
            </div>
        `,
    "casos-activos": `
            <h2>Casos Activos</h2>
            <div class="content-placeholder">
                <p>Lista de casos activos aparecerá aquí.</p>
            </div>
        `,
    // Add more section contents as needed
  }

  return (
    contents[sectionId] ||
    `
        <h2>${sectionId.charAt(0).toUpperCase() + sectionId.slice(1).replace("-", " ")}</h2>
        <div class="content-placeholder">
            <p>Contenido para ${sectionId} se mostrará aquí.</p>
        </div>
    `
  )
}

// Create section content
function createSectionContent(sectionId) {
  const contentArea = document.querySelector(".content-area")
  const section = document.createElement("div")
  section.id = `section-${sectionId}`
  section.className = "section-content"

  // Add content based on section ID
  section.innerHTML = getSectionContent(sectionId)

  contentArea.appendChild(section)
  return section
}

// Handle section loading
function loadSectionOld(sectionId) {
  // Hide default content
  const defaultContent = document.getElementById("default-content")
  if (defaultContent) {
    defaultContent.style.display = "none"
  }

  // Remove any existing active section
  const existingSection = document.querySelector(".section-content.active")
  if (existingSection) {
    existingSection.classList.remove("active")
  }

  // Create or show section content
  let sectionContent = document.getElementById(`section-${sectionId}`)
  if (!sectionContent) {
    sectionContent = createSectionContent(sectionId)
  }
  sectionContent.classList.add("active")

  // Close sidebar on mobile after selection
  if (window.innerWidth <= 768) {
    toggleSidebar()
  }
}

function loadDashboardSummary() {
  const contentArea = document.querySelector(".content-area")
  const summaryContent = document.createElement("div")
  summaryContent.className = "section-content active"

  summaryContent.innerHTML = `
        <h2>Bienvenido a tu Dashboard</h2>
        <div class="dashboard-summary">
            <div class="summary-section">
                <h3>Soy Cliente</h3>
                <p>Casos Activos: 3</p>
                <p>Notificaciones: 2</p>
            </div>
            <div class="summary-section">
                <h3>Mis Casos</h3>
                <p>En Progreso: 2</p>
                <p>Completados: 1</p>
            </div>
            <div class="summary-section">
                <h3>Busca Abogados</h3>
                <p>Abogados Disponibles: 50+</p>
            </div>
            <div class="summary-section">
                <h3>Centro de Comunicación</h3>
                <p>Mensajes No Leídos: 3</p>
            </div>
            <div class="summary-section">
                <h3>Recursos Legales</h3>
                <p>Documentos Disponibles: 100+</p>
            </div>
            <div class="summary-section">
                <h3>Gestión Financiera</h3>
                <p>Facturas Pendientes: 1</p>
            </div>
            <div class="summary-section">
                <h3>Evaluación y Feedback</h3>
                <p>Calificación Promedio: 4.8/5</p>
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

