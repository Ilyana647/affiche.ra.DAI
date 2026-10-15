/** @type {import('../../core/behaviors').Behavior} */
export default {
  onFound(ctx, targetId) {
    // Si l'affiche détectée n'a pas encore son cube rouge, on le crée
    let cube = ctx.poster.getObjectByName('cube-rouge')
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
    }
    cube.visible = true
  },

  onLost(ctx, targetId) {
    // Cache le cube lorsque l'affiche n'est plus visible
    const cube = ctx.poster.getObjectByName('cube-rouge')
    if (cube) {
      cube.visible = false
    }
  },

  onUpdate(ctx, t, dt) {
    // Fait tourner lentement le cube sur lui-même
    const cube = ctx.poster.getObjectByName('cube-rouge')
    if (cube && cube.visible) {
      cube.rotation.x += dt * 0.6
      cube.rotation.y += dt * 0.8
    }
  },
}
