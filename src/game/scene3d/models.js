import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three'

const wood = 0xb48054
const cream = 0xffe5b6
const teal = 0x6d9c91
const coral = 0xdb826a

function part(group, geometry, color, x, y, z) {
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ color }))
  mesh.position.set(x, y, z)
  group.add(mesh)
  return mesh
}

function box(group, color, x, y, z, w, h, d) {
  return part(group, new BoxGeometry(w, h, d), color, x, y, z)
}

function round(group, color, x, y, z, radius, height = radius) {
  const mesh = part(group, new SphereGeometry(radius, 9, 6), color, x, y, z)
  mesh.scale.y = height / radius
  return mesh
}

function pot(group, color, x, y, z, radius, h) {
  return part(group, new CylinderGeometry(radius, radius * .77, h, 8), color, x, y, z)
}

function furniture(group, id) {
  switch (id) {
    case 'futon':
    case 'bed':
    case 'kingbed': {
      const h = id === 'futon' ? .08 : .27
      box(group, wood, 0, h / 2, 0, .78, h, .9)
      box(group, id === 'kingbed' ? coral : teal, 0, h + .07, 0, .75, .14, .85)
      box(group, cream, 0, h + .16, -.27, .5, .09, .24)
      if (id !== 'futon') box(group, wood, 0, h + .15, -.43, .78, .48, .08)
      break
    }
    case 'desk':
      box(group, wood, 0, .58, 0, .84, .08, .6)
      for (const x of [-.34, .34]) {
        for (const z of [-.23, .23]) box(group, wood, x, .28, z, .07, .56, .07)
      }
      box(group, cream, -.1, .63, .08, .28, .03, .23)
      break
    case 'sofa':
      box(group, teal, 0, .2, 0, .88, .34, .65)
      box(group, teal, 0, .42, -.27, .88, .35, .17)
      for (const x of [-.38, .38]) box(group, teal, x, .34, .03, .13, .27, .57)
      box(group, cream, 0, .37, .03, .61, .09, .42)
      break
    case 'stove':
    case 'kitchen':
      box(group, wood, 0, .27, 0, .8, .54, .66)
      box(group, cream, 0, .57, 0, .84, .07, .7)
      for (const x of [-.2, .2]) pot(group, 0x434c48, x, .62, 0, .12, .045)
      break
    case 'plant':
      pot(group, coral, 0, .13, 0, .23, .26)
      round(group, 0x57854f, 0, .41, 0, .22, .25)
      round(group, 0x84a95c, .12, .54, .03, .13)
      break
    case 'rug':
      box(group, coral, 0, .018, 0, .92, .036, .84)
      box(group, cream, 0, .038, 0, .73, .009, .64)
      break
    case 'robovac':
      pot(group, 0x575e60, 0, .045, 0, .24, .09)
      break
    default:
      box(group, wood, 0, .23, 0, .68, .46, .62)
      box(group, cream, 0, .48, 0, .73, .06, .67)
      box(group, coral, 0, .31, .32, .22, .1, .025)
  }
}

export function buildRoom({ cols, rows, cells, placing }) {
  const root = new Group()
  const targets = []
  for (const { x, y, item } of cells) {
    const tile = new Group()
    tile.position.set(x + .5, 0, y + .5)
    tile.userData.hit = { x, y }
    const floor = (x + y) % 2 ? 0xe8bb82 : 0xf2cb94
    box(tile, placing ? (item ? 0xe1ac8a : 0xc9d5a0) : floor, 0, -.055, 0, .986, .11, .986)
    if (item) furniture(tile, item.fid)
    root.add(tile)
    targets.push(tile)
  }

  const wall = 0xe8ceaa
  box(root, wall, cols / 2, .65, -.07, cols, 1.3, .14)
  box(root, wall, -.07, .65, rows / 2, .14, 1.3, rows)
  box(root, wood, cols / 2, .1, .025, cols, .16, .07)
  box(root, wood, .025, .1, rows / 2, .07, .16, rows)
  box(root, cream, cols / 2, .84, .014, 1.56, .7, .07)
  box(root, 0xaad5d9, cols / 2, .84, .057, 1.39, .54, .025)
  box(root, cream, cols / 2, .84, .077, .065, .59, .04)
  box(root, cream, cols / 2, .84, .077, 1.41, .06, .04)
  box(root, wood, .012, .55, rows - .67, .06, 1.1, .7)
  round(root, cream, .073, .52, rows - .43, .04)
  return { root, targets }
}

function crop(group, { crop, phase }) {
  const size = [.42, .73, 1][phase]
  const leafy = crop === 'radish' ? 0x6b9f55 : 0x538549
  for (const x of [-.39, 0, .39]) {
    const z = x === 0 ? -.15 : .15
    pot(group, leafy, x, size * .2, z, .023, size * .4)
    for (const side of [-1, 1]) {
      const leaf = round(group, leafy, x + side * size * .09, size * .34, z, size * .12, size * .055)
      leaf.rotation.z = side * .45
    }
    if (phase === 2) {
      const color = crop === 'radish' ? 0xffe8bf : crop === 'tomato' ? 0xe56847 : 0xb93d49
      round(group, color, x + .04, crop === 'radish' ? .075 : .24, z + .08, .09, crop === 'radish' ? .13 : .09)
    }
  }
}

export function buildGarden({ plots }) {
  const root = new Group()
  const targets = []
  box(root, 0x9cad72, 1.6, -.16, 1.6, 4.1, .3, 4.05)
  box(root, 0xe8c797, 1.6, .005, 1.6, .45, .035, 3.8)
  box(root, 0xe8c797, 1.6, .005, 1.6, 3.8, .035, .45)
  for (let i = 0; i <= 5; i++) {
    box(root, wood, -.3 + i * .76, .16, -.29, .08, .33, .09)
  }
  box(root, cream, 1.6, .19, -.29, 3.85, .085, .045)
  plots.forEach((plant, index) => {
    const bed = new Group()
    bed.position.set((index % 2) * 1.65 + .77, .12, Math.floor(index / 2) * 1.65 + .77)
    bed.userData.hit = index
    box(bed, wood, 0, -.065, 0, 1.37, .19, 1.27)
    box(bed, plant?.wet ? 0x795443 : 0xb58059, 0, .027, 0, 1.24, .06, 1.14)
    for (const z of [-.29, 0, .29]) box(bed, plant?.wet ? 0x674638 : 0x996647, 0, .058, z, 1.02, .016, .055)
    if (plant) crop(bed, plant)
    root.add(bed)
    targets.push(bed)
  })
  const can = pot(root, teal, 3.18, .17, 3.15, .15, .3)
  can.rotation.z = -.13
  box(root, teal, 3.36, .21, 3.15, .26, .05, .05).rotation.z = .6
  return { root, targets }
}
