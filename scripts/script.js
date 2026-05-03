// Loading screen
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("loading-screen").style.display = "none"
  }, 1500)
})

// Mobile menu toggle
function toggleMenu() {
  const navLinks = document.querySelector(".nav-links")
  const menuIcon = document.querySelector(".menu-icon i")
  const overlay = document.querySelector(".overlay")

  if (!overlay) {
    // Create overlay if it doesn't exist
    const newOverlay = document.createElement("div")
    newOverlay.className = "overlay"
    document.body.appendChild(newOverlay)

    // Add click event to close menu when overlay is clicked
    newOverlay.addEventListener("click", () => {
      toggleMenu()
    })
  }

  const currentOverlay = document.querySelector(".overlay")

  if (navLinks.classList.contains("active")) {
    navLinks.classList.remove("active")
    menuIcon.classList.remove("fa-times")
    menuIcon.classList.add("fa-bars")
    currentOverlay.classList.remove("active")
    document.body.style.overflow = ""
  } else {
    navLinks.classList.add("active")
    menuIcon.classList.remove("fa-bars")
    menuIcon.classList.add("fa-times")
    currentOverlay.classList.add("active")
    document.body.style.overflow = "hidden"
  }
}

// Close menu when clicking on a link
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    const navLinks = document.querySelector(".nav-links")
    if (navLinks.classList.contains("active")) {
      toggleMenu()
    }
  })
})

// Handle escape key to close menu
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const navLinks = document.querySelector(".nav-links")
    if (navLinks.classList.contains("active")) {
      toggleMenu()
    }
  }
})

// Login modal
function openLoginModal() {
  document.getElementById("login-modal").style.display = "block"
}

function closeLoginModal() {
  document.getElementById("login-modal").style.display = "none"
}

// Close modal when clicking outside
window.onclick = (event) => {
  const modal = document.getElementById("login-modal")
  if (event.target == modal) {
    closeLoginModal()
  }
}

// Login form submission
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault()
  const email = document.getElementById("login-email").value
  const password = document.getElementById("login-password").value
  // Here you would typically send this data to your server for authentication
  console.log("Login attempt:", email, password)
  // For now, we'll just close the modal
  closeLoginModal()
})

// Password recovery functions
function showForgotPassword() {
  alert("Funcionalidad de recuperación de contraseña - A implementar")
}

function showForgotEmail() {
  alert("Funcionalidad de recuperación de correo - A implementar")
}

// Form validation
function validateForm(formId) {
  const form = document.getElementById(formId)
  let isValid = true

  form.querySelectorAll("input, select, textarea").forEach((element) => {
    if (element.hasAttribute("required") && !element.value.trim()) {
      isValid = false
      element.classList.add("error")
    } else {
      element.classList.remove("error")
    }
  })

  return isValid
}

// Client registration form
const clientForm = document.getElementById("client-register-form")
if (clientForm) {
  clientForm.addEventListener("submit", (e) => {
    e.preventDefault()
    if (validateForm("client-register-form")) {
      console.log("Client registration submitted")
      // Here you would typically send this data to your server
    }
  })
}

// Lawyer registration form
const lawyerForm = document.getElementById("lawyer-register-form")
if (lawyerForm) {
  lawyerForm.addEventListener("submit", (e) => {
    e.preventDefault()
    if (validateForm("lawyer-register-form")) {
      console.log("Lawyer registration submitted")
      // Here you would typically send this data to your server
    }
  })
}

// Contact form
const contactForm = document.getElementById("contact-form")
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault()
    if (validateForm("contact-form")) {
      console.log("Contact form submitted")
      // Here you would typically send this data to your server
    }
  })
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    })
  })
})

// FAQ accordion functionality
const faqItems = document.querySelectorAll(".faq-item")
if (faqItems) {
  faqItems.forEach((item) => {
    const question = item.querySelector("h3")
    const answer = item.querySelector("p")
    answer.style.display = "none"

    question.addEventListener("click", () => {
      if (answer.style.display === "none") {
        answer.style.display = "block"
        question.classList.add("active")
      } else {
        answer.style.display = "none"
        question.classList.remove("active")
      }
    })
  })
}

// Implement lawyer search functionality (placeholder)
const searchLawyer = document.getElementById("search-lawyer")
if (searchLawyer) {
  searchLawyer.addEventListener("submit", (e) => {
    e.preventDefault()
    const searchTerm = document.getElementById("lawyer-search-term").value
    console.log("Searching for lawyer:", searchTerm)
    // Here you would typically send this data to your server and display results
  })
}

// Add to favorites functionality (placeholder)
function addToFavorites(lawyerId) {
  console.log("Adding lawyer to favorites:", lawyerId)
  // Here you would typically send this data to your server to save in user's favorites
}

// Rate lawyer functionality (placeholder)
function rateLawyer(lawyerId, rating) {
  console.log("Rating lawyer:", lawyerId, "with", rating, "stars")
  // Here you would typically send this data to your server to save the rating
}

// Initialize any components that need it after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Any initialization code can go here
})

