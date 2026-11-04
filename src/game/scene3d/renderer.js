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

export function createSceneView(canvas, onFailure, { native = false, pixelRatio = 1 } = {}) {
  const output = native ? null : canvas.getContext('2d')
  if (!native && !output) throw new Error('Canvas 2D unavailable')
  let renderer
  if (native) {
    const context = canvas.getContext('webgl', { alpha: true, antialias: true })
    if (!context) throw new Error('WebGL unavailable')
    // A native canvas owns its backing buffer, but has no DOM event interface.
    const adapter = {
      get width() { return canvas.width },
      set width(value) { if (canvas.width !== value) canvas.width = value },
      get height() { return canvas.height },
      set height(value) { if (canvas.height !== value) canvas.height = value },
      addEventListener() {},
      removeEventListener() {}
    }
    renderer = new WebGLRenderer({ canvas: adapter, context, alpha: true, antialias: true })
  } else {
    renderer = acquire(onFailure)
  }
  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, .1, 120)
  const ray = new Raycaster()
  const sun = new DirectionalLight(0xffe0b4, 2.05)
  sun.position.set(2, 7, 4)
  scene.add(sun, new HemisphereLight(0xfff5e0, 0xb0a295, 2))
  let model, bounds

  function setModel(next) {
    if (model) {
      scene.remove(model.root)
      disposeModel(model.root)
    }
    model = next
    bounds = new Box3().setFromObject(model.root)
    scene.add(model.root)
  }

  function draw(width, height, yaw = 0) {
    if (!model || !width || !height) return false
    const center = bounds.getCenter(new Vector3())
    const heading = Math.PI / 4 + yaw
    const radius = Math.SQRT2 * 10
    camera.position.set(center.x + Math.sin(heading) * radius, center.y + 9.5,
      center.z + Math.cos(heading) * radius)
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

    const detailed = !native && model.detailed
    const ratio = Math.min(pixelRatio, detailed ? 2 : 1.5,
      (detailed ? 2048 : 1200) / Math.max(width, height))
    const w = Math.max(1, Math.round(width * ratio))
    const h = Math.max(1, Math.round(height * ratio))
    if (output && (canvas.width !== w || canvas.height !== h)) {
      canvas.width = w
      canvas.height = h
    }
    // Room and garden share one GPU context, rendering on demand or while pets move.
    renderer.setSize(w, h, false)
    renderer.render(scene, camera)
    if (output) {
      output.clearRect(0, 0, w, h)
      output.drawImage(renderer.domElement, 0, 0)
    } else if (renderer.getContext().isContextLost?.()) {
      throw new Error('WebGL context lost')
    }
    return true
  }

  return {
    setModel,
    draw,
    project(x, height, z) {
      const p = new Vector3(x, height, z).project(camera)
      return { left: (p.x + 1) * 50 + '%', top: (1 - p.y) * 50 + '%' }
    },
    pick(x, y) {
      if (!model || !(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return
      ray.setFromCamera(new Vector2(x * 2 - 1, 1 - y * 2), camera)
      const hit = ray.intersectObjects(model.targets, true)[0]
      return hit?.object.parent.userData.hit
    },
    dispose() {
      if (model) disposeModel(model.root)
      if (native) {
        renderer.dispose()
        renderer.forceContextLoss()
        return
      }
      losses.delete(onFailure)
      if (--users === 0) {
        shared = undefined
        renderer.dispose()
        renderer.forceContextLoss()
      }
    }
  }
}
