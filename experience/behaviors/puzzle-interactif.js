/** @type {import('../../core/behaviors').Behavior} */
export default {
  onFound(ctx, targetId) {
    if (!ctx.state.cards) {
      ctx.state.cards = {}
    }

    // Masquer les autres cartes d'affiches
    for (const [id, group] of Object.entries(ctx.state.cards)) {
      if (id !== targetId) {
        group.visible = false
      }
    }

    // 1. AFFICHE QUI TOURNE SUR ELLE-MÊME SANS DÉFORMATION
    let group = ctx.state.cards[targetId]
    if (!group) {
      group = new ctx.THREE.Group()
      group.name = `affiche-tournante-${targetId}`
      group.position.copy(ctx.toLocal(0.5, 0.5, 0.1)) // Décollée vers l'avant

      const loader = new ctx.THREE.TextureLoader()
      loader.setCrossOrigin('anonymous')

      const texturePath = ctx.asset(`target/${targetId}_poster.jpg`)
      loader.load(texturePath, (texture) => {
        texture.colorSpace = ctx.THREE.SRGBColorSpace

        // Calcul du ratio exact de l'image de l'affiche originale (hauteur / largeur)
        const img = texture.image
        const ratio = (img && img.naturalHeight && img.naturalWidth)
          ? (img.naturalHeight / img.naturalWidth)
          : (img.height / img.width || 1.333)

        // Largeur de 0.92 pour une belle présence visuelle sans rogner les bords
        const width = 0.92
        const height = width * ratio

        const geo = new ctx.THREE.PlaneGeometry(width, height)

        // Face avant
        const frontMat = new ctx.THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: ctx.THREE.FrontSide,
        })
        const frontMesh = new ctx.THREE.Mesh(geo, frontMat)
        frontMesh.position.z = 0.001
        group.add(frontMesh)

        // Face arrière (pour que le verso soit également droit et net lors de la rotation)
        const backMat = new ctx.THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: ctx.THREE.FrontSide,
        })
        const backMesh = new ctx.THREE.Mesh(geo, backMat)
        backMesh.rotation.y = Math.PI
        backMesh.position.z = -0.001
        group.add(backMesh)
      })

      ctx.poster.add(group)
      ctx.state.cards[targetId] = group
    }

    group.visible = true

    // 2. INTERFACE DU PUZZLE ET COMPTEUR
    this.setupUi(ctx)
    this.updateCounter(ctx)

    // Si toutes les 9 affiches sont collectées, ouvrir automatiquement le puzzle
    if (ctx.collection.complete) {
      this.openPuzzle(ctx)
    }
  },

  onLost(ctx, targetId) {
    // Dès que le scan est perdu, masquer l'affiche tournante
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
    // Rotation continue de l'affiche scannée
    if (!ctx.tracked) {
      if (ctx.state.cards) {
        for (const card of Object.values(ctx.state.cards)) {
          card.visible = false
        }
      }
      return
    }

    const currentCard = ctx.state.cards && ctx.target ? ctx.state.cards[ctx.target] : null
    if (currentCard && currentCard.visible) {
      currentCard.rotation.y += dt * 0.75
    }
  },

  updateCounter(ctx) {
    const badge = ctx.state.badgeCount
    if (badge) {
      badge.textContent = `${ctx.collection.count} / ${ctx.collection.total}`
      if (ctx.collection.complete) {
        badge.classList.add('is-complete')
      }
    }
  },

  openPuzzle(ctx) {
    const modal = ctx.state.puzzleModal
    if (modal) {
      modal.classList.add('is-open')
    }
  },

  closePuzzle(ctx) {
    const modal = ctx.state.puzzleModal
    if (modal) {
      modal.classList.remove('is-open')
    }
  },

  setupUi(ctx) {
    if (ctx.state.uiPrete) return
    ctx.state.uiPrete = true

    // Style de l'interface (panneaux, puzzle 3x3, pièces, feux d'artifice)
    ctx.ui.style(`
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
        border: 1px solid rgba(255, 255, 255, 0.25);
        color: #fff;
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        backdrop-filter: blur(8px);
        transition: transform 0.2s, background 0.2s;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
      }
      .ra-hud-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: scale(1.04);
      }
      .ra-hud-badge {
        background: var(--ra-color);
        color: var(--ra-text);
        padding: 2px 7px;
        border-radius: 999px;
        font-size: 11px;
        margin-left: 4px;
      }
      .ra-hud-badge.is-complete {
        background: #34c759;
      }

      /* Modal plein écran du puzzle */
      .ra-puzzle-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;
        background: rgba(6, 6, 9, 0.95);
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
        margin-bottom: 8px;
        position: relative;
        width: 100%;
        max-width: 440px;
        z-index: 2;
      }
      .ra-puzzle-title {
        font-size: 22px;
        font-weight: 800;
        margin: 0 0 4px;
        letter-spacing: -0.02em;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
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
        border: 2px dashed rgba(255, 255, 255, 0.25);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
        margin: 12px 0;
      }
      .ra-puzzle-board.is-won {
        border: 2px solid #34c759;
        box-shadow: 0 0 40px rgba(52, 199, 89, 0.5);
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
        border-color: #ff3b30;
        box-shadow: 0 0 12px #ff3b30;
      }
      .ra-puzzle-slot-num {
        font-size: 15px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.3);
        pointer-events: none;
      }
      .ra-puzzle-slot img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      /* Tiroir des pièces en bas */
      .ra-puzzle-tray-container {
        width: 100%;
        max-width: 480px;
        text-align: center;
        z-index: 2;
      }
      .ra-puzzle-tray-label {
        font-size: 12px;
        opacity: 0.7;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
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
        transition: transform 0.2s, border-color 0.2s;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      }
      .ra-puzzle-piece:hover {
        transform: translateY(-3px);
        border-color: #fff;
      }
      .ra-puzzle-piece.is-picked {
        border-color: #ff3b30;
        transform: translateY(-6px) scale(1.06);
        box-shadow: 0 8px 22px rgba(255, 59, 48, 0.6);
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
        font-weight: 800;
        color: #ffcc00;
        margin: 0 0 4px;
        text-shadow: 0 0 25px rgba(255, 204, 0, 0.7);
      }
      .ra-victory-desc {
        font-size: 14px;
        opacity: 0.95;
        margin: 0 0 14px;
      }
      .ra-victory-replay {
        background: #ff3b30;
        color: #fff;
        border: none;
        padding: 10px 22px;
        border-radius: 999px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(255, 59, 48, 0.5);
      }

      /* Feux d'artifice en bouquets (éclatements radiaux) */
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
        0% {
          transform: rotate(var(--angle)) translateY(0px) scale(1);
          opacity: 1;
        }
        70% {
          opacity: 0.9;
        }
        100% {
          transform: rotate(var(--angle)) translateY(var(--dist)) scale(0.2);
          opacity: 0;
        }
      }
      @keyframes ra-pop {
        0% { transform: scale(0.85); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
    `)

    // Bouton HUD en haut à droite
    const hud = ctx.ui.panel('hud', { position: 'free', keep: true })
    hud.innerHTML = `
      <div class="ra-hud-bar">
        <button type="button" class="ra-hud-btn" id="btn-open-puzzle">
          🧩 Puzzle <span class="ra-hud-badge" id="badge-count">${ctx.collection.count} / ${ctx.collection.total}</span>
        </button>
      </div>
    `
    ctx.state.badgeCount = hud.querySelector('#badge-count')
    hud.querySelector('#btn-open-puzzle').addEventListener('click', () => {
      this.openPuzzle(ctx)
    })

    // Ordre des 9 affiches dans le puzzle 3x3
    const ORDER = [
      'image-7', 'image-1', 'image-2',
      'image-3', 'image-4', 'image-5',
      'image-6', 'image-8', 'image-9'
    ]

    // Génération de 3 bouquets de feux d'artifice plus légers et espacés
    const burstColors = ['#ffcc00', '#00d4ff', '#ff3b30', '#ffffff', '#00ff88']
    const burstPositions = [
      { x: 25, y: 25, delay: 0 },
      { x: 75, y: 28, delay: 0.6 },
      { x: 50, y: 70, delay: 1.2 },
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
          <h2 class="ra-puzzle-title">Reconstituez le Puzzle</h2>
          <p class="ra-puzzle-subtitle">Touchez une affiche en bas, puis la case correspondante.</p>
          <button type="button" class="ra-puzzle-close" id="btn-close-puzzle">✕</button>
        </div>

        <div class="ra-puzzle-board" id="puzzle-board">
          ${ORDER.map((id, index) => `
            <div class="ra-puzzle-slot" data-index="${index}" data-expected="${id}">
              <span class="ra-puzzle-slot-num">${index + 1}</span>
            </div>
          `).join('')}
        </div>

        <div class="ra-puzzle-victory" id="victory-box">
          <div class="ra-victory-title">🎆 Félicitations ! 🎆</div>
          <div class="ra-victory-desc">Vous avez reconstitué le grand puzzle des Castors !</div>
          <button type="button" class="ra-victory-replay" id="btn-replay">Recommencer</button>
        </div>

        <div class="ra-puzzle-tray-container" id="tray-container">
          <div class="ra-puzzle-tray-label">Affiches disponibles</div>
          <div class="ra-puzzle-tray" id="puzzle-tray"></div>
        </div>
      </div>
    `

    ctx.state.puzzleModal = panel.querySelector('#puzzle-modal')
    const board = panel.querySelector('#puzzle-board')
    const tray = panel.querySelector('#puzzle-tray')
    const victoryBox = panel.querySelector('#victory-box')
    const fireworks = panel.querySelector('#fireworks-container')
    const trayContainer = panel.querySelector('#tray-container')

    panel.querySelector('#btn-close-puzzle').addEventListener('click', () => {
      this.closePuzzle(ctx)
    })

    // État du jeu
    let selectedPieceId = null
    const gridState = new Array(9).fill(null)

    // Mélanger les pièces pour le tiroir
    const initGame = () => {
      gridState.fill(null)
      selectedPieceId = null
      board.classList.remove('is-won')
      victoryBox.classList.remove('is-visible')
      fireworks.classList.remove('is-active')
      trayContainer.style.display = 'block'

      // Réinitialiser les cases de la grille
      board.querySelectorAll('.ra-puzzle-slot').forEach((slot, index) => {
        slot.innerHTML = `<span class="ra-puzzle-slot-num">${index + 1}</span>`
        slot.classList.remove('is-selected')
      })

      // Mélange aléatoire des pièces
      const shuffled = [...ORDER].sort(() => Math.random() - 0.5)
      tray.innerHTML = shuffled.map((id) => `
        <div class="ra-puzzle-piece" data-id="${id}">
          <img src="${ctx.asset(`target/${id}_thumbnail.jpg`)}" alt="${id}" draggable="false">
        </div>
      `).join('')

      tray.querySelectorAll('.ra-puzzle-piece').forEach((piece) => {
        piece.addEventListener('click', () => {
          const id = piece.dataset.id
          if (gridState.includes(id)) return // Déjà placée
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

        // Si la case a déjà une pièce et qu'aucune n'est sélectionnée : on la retire
        if (gridState[index] && !selectedPieceId) {
          const removedId = gridState[index]
          gridState[index] = null
          slot.innerHTML = `<span class="ra-puzzle-slot-num">${index + 1}</span>`
          const pieceEl = tray.querySelector(`[data-id="${removedId}"]`)
          if (pieceEl) pieceEl.classList.remove('is-placed')
          return
        }

        // Si une pièce est sélectionnée : on la place dans cette case
        if (selectedPieceId) {
          // Si la case contenait déjà une autre pièce, libérer l'ancienne
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

          // Vérifier si toutes les pièces sont posées et correspondent
          const isFull = gridState.every((id) => id !== null)
          if (isFull) {
            const isCorrect = gridState.every((id, idx) => id === ORDER[idx])
            if (isCorrect) {
              // Victoire !
              board.classList.add('is-won')
              victoryBox.classList.add('is-visible')
              fireworks.classList.add('is-active')
              trayContainer.style.display = 'none'

              // Bruitage festif si le son est activé
              try {
                if (ctx.sound && ctx.sound.enabled) {
                  ctx.sound.play('assets/demo/pop.mp3')
                }
              } catch {
                // Silencieux si indisponible
              }
            }
          }
        }
      })
    })
  },
}
