// Fonctions internes du puzzle et de l'interface (séparées pour n'exposer que les hooks attendus par le moteur AR)
const updateCounter = (ctx) => {
  const badge = ctx.state.badgeCount
  if (badge) {
    const count = ctx.state.discovered ? ctx.state.discovered.size : 0
    badge.textContent = `${count} / 9`
    if (count >= 9) {
      badge.classList.add('is-complete')
    }
  }
}

const openPuzzle = (ctx) => {
  const modal = ctx.state.puzzleModal
  if (modal) {
    modal.classList.add('is-open')
  }
}

const closePuzzle = (ctx) => {
  const modal = ctx.state.puzzleModal
  if (modal) {
    modal.classList.remove('is-open')
  }
}

const setupUi = (ctx) => {
  if (ctx.state.uiPrete) return
  ctx.state.uiPrete = true

  // Style de l'interface (HUD, puzzle 3x3, pièces, feux d'artifice multicolores)
  ctx.ui.style(`
    /* Cacher discrètement le bandeau des avertissements informatifs s'il n'y a pas d'erreur bloquante */
    .ra-errors:not(.has-errors) {
      display: none !important;
    }

    .ra-hud-bar {
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 50;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--ra-ui-font);
    }
    .ra-hud-btn {
      background: rgba(18, 18, 24, 0.88);
      border: 1px solid rgba(255, 215, 0, 0.4);
      color: #ffdf00;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
    }
    .ra-hud-btn:hover {
      background: rgba(255, 215, 0, 0.15);
      transform: scale(1.05);
      box-shadow: 0 0 16px rgba(255, 215, 0, 0.5);
    }
    .ra-hud-badge {
      background: #ffaa00;
      color: #000;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      margin-left: 4px;
    }
    .ra-hud-badge.is-complete {
      background: #34c759;
      color: #fff;
    }

    /* Modal plein écran du puzzle */
    .ra-puzzle-overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: rgba(8, 8, 12, 0.96);
      backdrop-filter: blur(14px);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      box-sizing: border-box;
      overflow-y: auto;
      color: #fff;
      font-family: var(--ra-ui-font);
    }
    .ra-puzzle-overlay.is-open {
      display: flex;
    }

    .ra-puzzle-header {
      text-align: center;
      margin-bottom: 6px;
      position: relative;
      width: 100%;
      max-width: 440px;
      z-index: 2;
    }
    .ra-puzzle-title {
      font-size: 22px;
      font-weight: 800;
      color: #ffea00;
      margin: 0 0 4px;
      letter-spacing: -0.02em;
      text-shadow: 0 0 20px rgba(255, 234, 0, 0.6);
    }
    .ra-puzzle-subtitle {
      font-size: 13px;
      opacity: 0.8;
      margin: 0;
    }
    .ra-puzzle-close {
      position: absolute;
      top: 0;
      right: 0;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: #fff;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
    }

    /* Grille 3x3 centrale */
    .ra-puzzle-board {
      position: relative;
      z-index: 2;
      width: min(86vw, 320px);
      aspect-ratio: 3 / 4;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 6px;
      background: rgba(255, 255, 255, 0.04);
      padding: 6px;
      border-radius: 12px;
      border: 2px dashed rgba(255, 215, 0, 0.35);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
      margin: 10px 0;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .ra-puzzle-board.is-won {
      border: 2px solid #34c759;
      box-shadow: 0 0 40px rgba(52, 199, 89, 0.6);
    }
    .ra-puzzle-board.is-wrong {
      border: 2px solid #ff9500;
      box-shadow: 0 0 25px rgba(255, 149, 0, 0.5);
      animation: ra-shake 0.45s ease-in-out;
    }

    .ra-puzzle-slot {
      background: rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      transition: border-color 0.2s, transform 0.15s;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .ra-puzzle-slot.is-selected {
      border-color: #ffcc00;
      box-shadow: 0 0 12px #ffcc00;
    }
    .ra-puzzle-slot-num {
      font-size: 15px;
      font-weight: 700;
      color: rgba(255, 215, 0, 0.4);
      pointer-events: none;
    }
    .ra-puzzle-slot img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Message d'aide et vérification en cas d'erreur */
    .ra-puzzle-hint {
      display: none;
      background: rgba(255, 149, 0, 0.16);
      border: 1px solid rgba(255, 179, 0, 0.5);
      color: #ffd666;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 13px;
      max-width: 350px;
      margin: 6px auto;
      text-align: center;
      line-height: 1.45;
      box-sizing: border-box;
      z-index: 3;
      animation: ra-shake 0.4s ease-in-out;
    }
    .ra-puzzle-hint.is-visible {
      display: block;
    }

    /* Tiroir des 9 pièces en bas */
    .ra-puzzle-tray-container {
      width: 100%;
      max-width: 480px;
      text-align: center;
      z-index: 2;
    }
    .ra-puzzle-tray-label {
      font-size: 12px;
      opacity: 0.75;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #ffdf00;
    }
    .ra-puzzle-tray {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 8px 4px 12px;
      scrollbar-width: thin;
    }
    .ra-puzzle-piece {
      flex: 0 0 68px;
      aspect-ratio: 3 / 4;
      border-radius: 6px;
      overflow: hidden;
      border: 2px solid rgba(255, 255, 255, 0.25);
      cursor: pointer;
      background: #111;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }
    .ra-puzzle-piece:hover {
      transform: translateY(-3px);
      border-color: #ffea00;
      box-shadow: 0 6px 16px rgba(255, 234, 0, 0.4);
    }
    .ra-puzzle-piece.is-picked {
      border-color: #ffea00;
      transform: translateY(-6px) scale(1.06);
      box-shadow: 0 8px 22px rgba(255, 234, 0, 0.7);
    }
    .ra-puzzle-piece.is-placed {
      opacity: 0.3;
      filter: grayscale(0.8);
      cursor: default;
    }
    .ra-puzzle-piece img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Victoire */
    .ra-puzzle-victory {
      display: none;
      text-align: center;
      padding: 12px;
      z-index: 3;
      animation: ra-pop 0.5s ease-out forwards;
    }
    .ra-puzzle-victory.is-visible {
      display: block;
    }
    .ra-victory-title {
      font-size: 26px;
      font-weight: 900;
      color: #ffea00;
      margin: 0 0 6px;
      text-shadow: 0 0 25px rgba(255, 234, 0, 0.8);
    }
    .ra-victory-desc {
      font-size: 14px;
      opacity: 0.95;
      line-height: 1.5;
      max-width: 380px;
      margin: 0 auto 16px;
    }
    .ra-victory-replay {
      background: linear-gradient(135deg, #ffcc00, #ff8800);
      color: #000;
      border: none;
      padding: 10px 24px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(255, 170, 0, 0.5);
    }

    /* Feux d'artifice multicolores festifs */
    .ra-fireworks-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      display: none;
      z-index: 1;
    }
    .ra-fireworks-layer.is-active {
      display: block;
    }
    .ra-fw-burst {
      position: absolute;
      width: 2px;
      height: 2px;
      pointer-events: none;
    }
    .ra-fw-spark {
      position: absolute;
      top: 0;
      left: 0;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      box-shadow: 0 0 8px currentColor;
      animation: ra-fw-expand 1.8s ease-out infinite;
    }
    @keyframes ra-fw-expand {
      0% { transform: rotate(var(--angle)) translateY(0px) scale(1); opacity: 1; }
      70% { opacity: 0.9; }
      100% { transform: rotate(var(--angle)) translateY(var(--dist)) scale(0.2); opacity: 0; }
    }
    @keyframes ra-pop {
      0% { transform: scale(0.85); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes ra-shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-5px); }
      80% { transform: translateX(5px); }
    }
  `)

  // Bouton HUD en haut à droite
  const hud = ctx.ui.panel('hud', { position: 'free', keep: true })
  const initialCount = ctx.state.discovered ? ctx.state.discovered.size : 0
  hud.innerHTML = `
    <div class="ra-hud-bar">
      <button type="button" class="ra-hud-btn" id="btn-open-puzzle">
        ⭐ Puzzle <span class="ra-hud-badge" id="badge-count">${initialCount} / 9</span>
      </button>
    </div>
  `
  ctx.state.badgeCount = hud.querySelector('#badge-count')
  hud.querySelector('#btn-open-puzzle').addEventListener('click', () => {
    openPuzzle(ctx)
  })

  // Ordre exact des 9 affiches dans le puzzle 3x3 pour correspondre à "castors"
  const ORDER = [
    'castor-1', 'castor-2', 'castor-3',
    'castor-4', 'castor-5', 'castor-6',
    'castor-7', 'castor-8', 'castor-9'
  ]

  // Feux d'artifice multicolores du final
  const burstColors = ['#ff0055', '#ffcc00', '#00ff88', '#00d4ff', '#ff6600', '#ffffff', '#e040fb']
  const burstPositions = [
    { x: 25, y: 24, delay: 0 },
    { x: 75, y: 28, delay: 0.6 },
    { x: 50, y: 72, delay: 1.2 },
  ]

  const fireworksHtml = burstPositions.map((pos) => {
    const sparks = Array.from({ length: 8 }, (_, i) => {
      const angle = (i * (360 / 8)) + (Math.random() * 6)
      const dist = 50 + Math.random() * 50
      const color = burstColors[Math.floor(Math.random() * burstColors.length)]
      return `<div class="ra-fw-spark" style="--angle:${angle}deg; --dist:${dist}px; color:${color}; background-color:${color}; animation-delay:${pos.delay}s"></div>`
    }).join('')
    return `<div class="ra-fw-burst" style="left:${pos.x}%; top:${pos.y}%;">${sparks}</div>`
  }).join('')

  // Modal du puzzle interactif
  const panel = ctx.ui.panel('puzzle-game', { position: 'free', keep: true })
  panel.innerHTML = `
    <div class="ra-puzzle-overlay" id="puzzle-modal">
      <div class="ra-fireworks-layer" id="fireworks-container">${fireworksHtml}</div>
      <div class="ra-puzzle-header">
        <h2 class="ra-puzzle-title">Le Grand Puzzle des Castors</h2>
        <p class="ra-puzzle-subtitle">Touchez une affiche en bas, puis sa case dans la grille 3×3.</p>
        <button type="button" class="ra-puzzle-close" id="btn-close-puzzle">✕</button>
      </div>

      <div class="ra-puzzle-board" id="puzzle-board">
        ${ORDER.map((id, index) => `
          <div class="ra-puzzle-slot" data-index="${index}" data-expected="${id}">
            <span class="ra-puzzle-slot-num">${index + 1}</span>
          </div>
        `).join('')}
      </div>

      <div class="ra-puzzle-hint" id="error-hint">
        🔍 <strong>Ce n’est pas tout à fait ça !</strong> Regarde bien les raccords et les détails entre les affiches, tu y es presque. Prends ton temps pour replacer les cartes au bon endroit !
      </div>

      <div class="ra-puzzle-victory" id="victory-box">
        <div class="ra-victory-title">✨ Félicitations ! ✨</div>
        <div class="ra-victory-desc">Tu as reconstitué le grand puzzle des castors avec succès ! Toutes les affiches sont parfaitement à leur place. 🎉✨</div>
        <button type="button" class="ra-victory-replay" id="btn-replay">Recommencer</button>
      </div>

      <div class="ra-puzzle-tray-container" id="tray-container">
        <div class="ra-puzzle-tray-label">Affiches collectionnées</div>
        <div class="ra-puzzle-tray" id="puzzle-tray"></div>
      </div>
    </div>
  `

  ctx.state.puzzleModal = panel.querySelector('#puzzle-modal')
  const board = panel.querySelector('#puzzle-board')
  const tray = panel.querySelector('#puzzle-tray')
  const victoryBox = panel.querySelector('#victory-box')
  const errorHint = panel.querySelector('#error-hint')
  const fireworks = panel.querySelector('#fireworks-container')
  const trayContainer = panel.querySelector('#tray-container')

  panel.querySelector('#btn-close-puzzle').addEventListener('click', () => {
    closePuzzle(ctx)
  })

  // État du jeu
  let selectedPieceId = null
  const gridState = new Array(9).fill(null)

  // Initialisation et mélange
  const initGame = () => {
    gridState.fill(null)
    selectedPieceId = null
    board.classList.remove('is-won', 'is-wrong')
    victoryBox.classList.remove('is-visible')
    errorHint.classList.remove('is-visible')
    fireworks.classList.remove('is-active')
    trayContainer.style.display = 'block'

    board.querySelectorAll('.ra-puzzle-slot').forEach((slot, index) => {
      slot.innerHTML = `<span class="ra-puzzle-slot-num">${index + 1}</span>`
      slot.classList.remove('is-selected')
    })

    const shuffled = [...ORDER].sort(() => Math.random() - 0.5)
    tray.innerHTML = shuffled.map((id) => `
      <div class="ra-puzzle-piece" data-id="${id}">
        <img src="${ctx.asset(`target/${id}_thumbnail.jpg`)}" alt="${id}" draggable="false">
      </div>
    `).join('')

    tray.querySelectorAll('.ra-puzzle-piece').forEach((piece) => {
      piece.addEventListener('click', () => {
        const id = piece.dataset.id
        if (gridState.includes(id)) return
        tray.querySelectorAll('.ra-puzzle-piece').forEach((p) => p.classList.remove('is-picked'))
        if (selectedPieceId === id) {
          selectedPieceId = null
        } else {
          selectedPieceId = id
          piece.classList.add('is-picked')
        }
      })
    })
  }

  initGame()

  panel.querySelector('#btn-replay').addEventListener('click', () => {
    initGame()
  })

  // Clic sur une case de la grille
  board.querySelectorAll('.ra-puzzle-slot').forEach((slot) => {
    slot.addEventListener('click', () => {
      const index = parseInt(slot.dataset.index, 10)

      // Retirer une pièce déjà posée
      if (gridState[index] && !selectedPieceId) {
        const removedId = gridState[index]
        gridState[index] = null
        slot.innerHTML = `<span class="ra-puzzle-slot-num">${index + 1}</span>`
        const pieceEl = tray.querySelector(`[data-id="${removedId}"]`)
        if (pieceEl) pieceEl.classList.remove('is-placed')
        errorHint.classList.remove('is-visible')
        board.classList.remove('is-wrong')
        return
      }

      // Poser la pièce sélectionnée
      if (selectedPieceId) {
        if (gridState[index]) {
          const oldId = gridState[index]
          const oldEl = tray.querySelector(`[data-id="${oldId}"]`)
          if (oldEl) oldEl.classList.remove('is-placed')
        }

        gridState[index] = selectedPieceId
        slot.innerHTML = `<img src="${ctx.asset(`target/${selectedPieceId}_thumbnail.jpg`)}" alt="${selectedPieceId}">`

        const pieceEl = tray.querySelector(`[data-id="${selectedPieceId}"]`)
        if (pieceEl) {
          pieceEl.classList.remove('is-picked')
          pieceEl.classList.add('is-placed')
        }

        selectedPieceId = null

        // Vérification automatique dès que les 9 cases sont remplies
        const isFull = gridState.every((id) => id !== null)
        if (isFull) {
          const isCorrect = gridState.every((id, idx) => id === ORDER[idx])
          if (isCorrect) {
            // Assemblage réussi
            board.classList.remove('is-wrong')
            board.classList.add('is-won')
            errorHint.classList.remove('is-visible')
            victoryBox.classList.add('is-visible')
            fireworks.classList.add('is-active')
            trayContainer.style.display = 'none'

            try {
              if (ctx.sound && ctx.sound.enabled) {
                ctx.sound.play('assets/demo/pop.mp3')
              }
            } catch {
              // Silencieux
            }
          } else {
            // Assemblage incorrect : invitation bienveillante à vérifier les positions
            board.classList.remove('is-won')
            board.classList.add('is-wrong')
            errorHint.classList.add('is-visible')
          }
        } else {
          errorHint.classList.remove('is-visible')
          board.classList.remove('is-wrong')
        }
      }
    })
  })
}

/** @type {import('../../core/behaviors').Behavior} */
export default {
  onFound(ctx, targetId) {
    // Si c'est l'affiche complète "castors", elle n'a pas l'animation de carte qui tourne
    if (targetId === 'castors') {
      const b = ctx.bricks && ctx.bricks.get('eclat-dore')
      if (b && b.group) b.group.visible = false
      return
    }

    // Réactiver les particules d'étincelles pour les affiches 1 à 9
    const b = ctx.bricks && ctx.bricks.get('eclat-dore')
    if (b && b.group) b.group.visible = true

    if (!ctx.state.cards) {
      ctx.state.cards = {}
    }
    if (!ctx.state.cardTimes) {
      ctx.state.cardTimes = {}
    }

    ctx.state.cardTimes[targetId] = 0

    if (!ctx.state.discovered) {
      ctx.state.discovered = new Set()
    }
    ctx.state.discovered.add(targetId)

    for (const [id, group] of Object.entries(ctx.state.cards)) {
      if (id !== targetId) {
        group.visible = false
      }
    }

    let group = ctx.state.cards[targetId]
    if (!group) {
      group = new ctx.THREE.Group()
      group.name = `carte-rare-${targetId}`
      group.position.copy(ctx.toLocal(0.5, 0.5, 0.12))

      const loader = new ctx.THREE.TextureLoader()
      loader.setCrossOrigin('anonymous')

      const texturePath = ctx.asset(`target/${targetId}_poster.jpg`)
      loader.load(texturePath, (texture) => {
        texture.colorSpace = ctx.THREE.SRGBColorSpace

        const img = texture.image
        const ratio = (img && img.naturalHeight && img.naturalWidth)
          ? (img.naturalHeight / img.naturalWidth)
          : (img.height / img.width || 1.333)

        const width = 0.90
        const height = width * ratio

        const cardGeo = new ctx.THREE.PlaneGeometry(width, height)

        const frontMat = new ctx.THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: ctx.THREE.FrontSide,
        })
        const frontMesh = new ctx.THREE.Mesh(cardGeo, frontMat)
        frontMesh.position.z = 0.002
        group.add(frontMesh)

        const backMat = new ctx.THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: ctx.THREE.FrontSide,
        })
        const backMesh = new ctx.THREE.Mesh(cardGeo, backMat)
        backMesh.rotation.y = Math.PI
        backMesh.position.z = -0.002
        group.add(backMesh)
      })

      ctx.poster.add(group)
      ctx.state.cards[targetId] = group
    }

    group.rotation.y = 0
    group.visible = true

    setupUi(ctx)
    updateCounter(ctx)

    if (ctx.state.discovered.size >= 9) {
      openPuzzle(ctx)
    }
  },

  onLost(ctx, targetId) {
    if (ctx.state.cards) {
      if (ctx.state.cards[targetId]) {
        ctx.state.cards[targetId].visible = false
      }
      if (!ctx.tracked) {
        for (const card of Object.values(ctx.state.cards)) {
          card.visible = false
        }
      }
    }
  },

  onUpdate(ctx, t, dt) {
    if (!ctx.tracked) {
      if (ctx.state.cards) {
        for (const card of Object.values(ctx.state.cards)) {
          card.visible = false
        }
      }
      return
    }

    const targetId = ctx.target
    if (targetId === 'castors') return

    const currentCard = ctx.state.cards && targetId ? ctx.state.cards[targetId] : null
    if (currentCard && currentCard.visible) {
      const DURATION = 3.2
      const TOTAL_ROTATION = Math.PI * 4

      if (!ctx.state.cardTimes) ctx.state.cardTimes = {}
      const currentTime = (ctx.state.cardTimes[targetId] || 0) + dt
      ctx.state.cardTimes[targetId] = currentTime

      if (currentTime < DURATION) {
        const progress = currentTime / DURATION
        currentCard.rotation.y = progress * TOTAL_ROTATION
      } else {
        currentCard.rotation.y = TOTAL_ROTATION
      }
    }
  },
}
