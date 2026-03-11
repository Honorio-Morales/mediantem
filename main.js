// ── NAVBAR SCROLL ──────────────────────────────────────────────────────────
const navbar = document.getElementById('navbar')
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40)
})

// ── HAMBURGER MENU ─────────────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger')
const mobileMenu = document.getElementById('mobileMenu')
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open')
  mobileMenu.classList.toggle('open')
})
// Cerrar al hacer click en un link
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open')
    mobileMenu.classList.remove('open')
  })
})

// ── COUNTDOWN TIMER ────────────────────────────────────────────────────────
function startCountdown(hours, minutes, seconds) {
  let total = hours * 3600 + minutes * 60 + seconds

  const hEl = document.getElementById('cd-h')
  const mEl = document.getElementById('cd-m')
  const sEl = document.getElementById('cd-s')

  function update() {
    if (total <= 0) { total = 0 }
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    hEl.textContent = String(h).padStart(2, '0')
    mEl.textContent = String(m).padStart(2, '0')
    sEl.textContent = String(s).padStart(2, '0')
    if (total > 0) { total--; setTimeout(update, 1000) }
  }
  update()
}
startCountdown(4, 30, 0)

// ── SCROLL ANIMATIONS (IntersectionObserver) ───────────────────────────────
const animatedEls = document.querySelectorAll('.why-card, .product-card, .review-card')

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target
      const delay = el.dataset.delay || 0
      setTimeout(() => el.classList.add('visible'), Number(delay))
      observer.unobserve(el)
    }
  })
}, { threshold: 0.1 })

animatedEls.forEach(el => observer.observe(el))

// ── WISHLIST TOGGLE ────────────────────────────────────────────────────────
document.querySelectorAll('.wishlist-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation()
    const active = btn.classList.toggle('active')
    btn.textContent = active ? '♥' : '♡'
  })
})

// ── NEWSLETTER FORM ────────────────────────────────────────────────────────
const form    = document.getElementById('newsletterForm')
const success = document.getElementById('formSuccess')

form.addEventListener('submit', e => {
  e.preventDefault()
  const email = document.getElementById('emailInput').value
  if (!email) return

  // Simulación — aquí irá la llamada real a la API
  const btn = form.querySelector('button[type="submit"]')
  btn.textContent = 'Enviando...'
  btn.disabled = true

  setTimeout(() => {
    success.classList.add('show')
    form.querySelector('.form-row').style.opacity = '.4'
    form.querySelector('.form-row').style.pointerEvents = 'none'
    btn.textContent = 'Suscribirme'
    btn.disabled = false
  }, 800)
})
