import {
  Box3, DirectionalLight, HemisphereLight, OrthographicCamera, Raycaster, Scene,
  Vector2, Vector3, WebGLRenderer
} from 'three'

let shared
let users = 0
const losses = new Set()

function acquire(onFailure) {
  if (!shared) {
    shared = new WebGLRenderer({ alpha: true, antialias: true })
    const current = shared
    current.domElement.addEventListener('webglcontextlost', () => {
      if (shared !== current) return
      for (const fail of losses) fail()
    })
  }
  users++
  losses.add(onFailure)
  return shared
}

function disposeModel(root) {
  root.traverse(object => {
    if (!object.isMesh) return
    object.geometry.dispose()
    object.material.dispose()
  })
}

export function createSceneView(canvas, onFailure) {
  const output = canvas.getContext('2d')
  if (!output) throw new Error('Canvas 2D unavailable')
  const renderer = acquire(onFailure)
  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, .1, 120)
  const ray = new Raycaster()
  const sun = new DirectionalLight(0xffe0b4, 2.05)
  sun.position.set(2, 7, 4)
  scene.add(sun, new HemisphereLight(0xfff5e0, 0xb0a295, 2))
  let model

  function setModel(next) {
    if (model) {
      scene.remove(model.root)
      disposeModel(model.root)
    }
    model = next
    scene.add(model.root)
  }

  function draw(width, height) {
    if (!model || !width || !height) return false
    const bounds = new Box3().setFromObject(model.root)
    const center = bounds.getCenter(new Vector3())
    camera.position.copy(center).add(new Vector3(10, 9.5, 10))
    camera.lookAt(center)
    camera.updateMatrixWorld()

    // Fit the projected bounds, including the room walls, at any aspect ratio.
    const viewBounds = bounds.clone().applyMatrix4(camera.matrixWorldInverse)
    const middle = viewBounds.getCenter(new Vector3())
    const size = viewBounds.getSize(new Vector3())
    const aspect = width / height
    const halfHeight = Math.max(size.y, size.x / aspect) * .53
    camera.left = middle.x - halfHeight * aspect
    camera.right = middle.x + halfHeight * aspect
    camera.top = middle.y + halfHeight
    camera.bottom = middle.y - halfHeight
    camera.updateProjectionMatrix()

    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, 1200 / Math.max(width, height))
    const w = Math.max(1, Math.round(width * ratio))
    const h = Math.max(1, Math.round(height * ratio))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    // Room and garden share one GPU context, rendering only when their content changes.
    renderer.setSize(w, h, false)
    renderer.render(scene, camera)
    output.clearRect(0, 0, w, h)
    output.drawImage(renderer.domElement, 0, 0)
    return true
  }

  return {
    setModel,
    draw,
    project(x, height, z) {
      const p = new Vector3(x, height, z).project(camera)
      return { left: (p.x + 1) * 50 + '%', top: (1 - p.y) * 50 + '%' }
    },
    pick(event) {
      const rect = canvas.getBoundingClientRect()
      if (!model || !rect.width || !rect.height) return
      ray.setFromCamera(new Vector2(
        (event.clientX - rect.left) / rect.width * 2 - 1,
        1 - (event.clientY - rect.top) / rect.height * 2
      ), camera)
      const hit = ray.intersectObjects(model.targets, true)[0]
      return hit?.object.parent.userData.hit
    },
    dispose() {
      if (model) disposeModel(model.root)
      losses.delete(onFailure)
      if (--users === 0) {
        shared = undefined
        renderer.dispose()
        renderer.forceContextLoss()
      }
    }
  }
}
