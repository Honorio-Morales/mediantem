/* ── NAVBAR SCROLL ─────────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar')
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30)
  })
}

/* ── HAMBURGER ─────────────────────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger')
const mobileMenu = document.getElementById('mobileMenu')
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open')
    mobileMenu.classList.toggle('open')
  })
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open')
      mobileMenu.classList.remove('open')
    })
  })
}

/* ── COUNTDOWN (solo en index.html) ───────────────────────────────────── */
const cdH = document.getElementById('cdH')
const cdM = document.getElementById('cdM')
const cdS = document.getElementById('cdS')
if (cdH && cdM && cdS) {
  let total = 4 * 3600 + 30 * 60 + 45
  const tick = () => {
    if (total <= 0) return
    cdH.textContent = String(Math.floor(total / 3600)).padStart(2, '0')
    cdM.textContent = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
    cdS.textContent = String(total % 60).padStart(2, '0')
    total--
    setTimeout(tick, 1000)
  }
  tick()
}

/* ── REVEAL ON SCROLL ──────────────────────────────────────────────────── */
const revealEls = document.querySelectorAll('.reveal')
if (revealEls.length) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target
        const delay = Number(el.dataset.delay || 0)
        setTimeout(() => el.classList.add('visible'), delay)
        obs.unobserve(el)
      }
    })
  }, { threshold: 0.1 })
  revealEls.forEach(el => obs.observe(el))
}

/* ── WISHLIST TOGGLES ──────────────────────────────────────────────────── */
document.querySelectorAll('.p-wish').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation()
    const on = btn.classList.toggle('active')
    btn.textContent = on ? '♥' : '♡'
  })
})

/* ── NEWSLETTER FORM ───────────────────────────────────────────────────── */
const nlForm = document.getElementById('nlForm')
const nlOk   = document.getElementById('nlOk')
if (nlForm && nlOk) {
  nlForm.addEventListener('submit', e => {
    e.preventDefault()
    const btn = nlForm.querySelector('button[type="submit"]')
    const row = nlForm.querySelector('.nl-row')
    btn.textContent = 'Sending...'
    btn.disabled = true
    setTimeout(() => {
      nlOk.classList.add('show')
      row.style.opacity = '.4'
      row.style.pointerEvents = 'none'
      btn.textContent = 'Subscribe'
      btn.disabled = false
    }, 700)
  })
}
