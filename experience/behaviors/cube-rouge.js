/** @type {import('../../core/behaviors').Behavior} */
export default {
  onFound(ctx, targetId) {
    if (!ctx.state.cubes) {
      ctx.state.cubes = {}
    }

    // Masquer les cubes des autres affiches éventuelles
    for (const [id, c] of Object.entries(ctx.state.cubes)) {
      if (id !== targetId) {
        c.visible = false
      }
    }

    // Récupérer ou créer le cube rouge de cette affiche
    let cube = ctx.state.cubes[targetId]
    if (!cube) {
      // 20 % de la largeur de l'affiche
      const taille = 0.2
      const geometry = new ctx.THREE.BoxGeometry(taille, taille, taille)
      const material = new ctx.THREE.MeshStandardMaterial({
        color: 0xff3b30,
        roughness: 0.3,
        metalness: 0.1,
      })
      cube = new ctx.THREE.Mesh(geometry, material)
      cube.name = 'cube-rouge'

      // Flotte au centre de l'affiche (x: 0.5, y: 0.5), décollé de 0.15 vers le spectateur (+Z)
      cube.position.copy(ctx.toLocal(0.5, 0.5, 0.15))

      ctx.poster.add(cube)
      ctx.state.cubes[targetId] = cube
    }

    // Rendre le cube visible dès la détection
    cube.visible = true
  },

  onLost(ctx, targetId) {
    // Dès que le scan est perdu, masquer immédiatement le cube de l'affiche
    if (ctx.state.cubes) {
      if (ctx.state.cubes[targetId]) {
        ctx.state.cubes[targetId].visible = false
      }
      if (!ctx.tracked) {
        for (const cube of Object.values(ctx.state.cubes)) {
          cube.visible = false
        }
      }
    }

    const cubeSurAffiche = ctx.poster && ctx.poster.getObjectByName('cube-rouge')
    if (cubeSurAffiche) {
      cubeSurAffiche.visible = false
    }
  },

  onUpdate(ctx, t, dt) {
    // Si l'affiche n'est plus scannée, cacher les cubes et ne rien faire
    if (!ctx.tracked) {
      if (ctx.state.cubes) {
        for (const cube of Object.values(ctx.state.cubes)) {
          cube.visible = false
        }
      }
      return
    }

    // Faire tourner lentement le cube de l'affiche actuellement scannée
    const currentCube = ctx.state.cubes && ctx.target ? ctx.state.cubes[ctx.target] : null
    if (currentCube && currentCube.visible) {
      currentCube.rotation.x += dt * 0.6
      currentCube.rotation.y += dt * 0.8
    }
  },
}
