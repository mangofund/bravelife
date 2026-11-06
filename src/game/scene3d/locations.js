import { ConeGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { box, round, pot } from './models.js'

const wood = 0xb48054
const cream = 0xffe5b6
const teal = 0x6d9c91
const coral = 0xdb826a
const slate = 0x586876
const leaf = 0x79a969

// 每个地点单独摆放道具。坐标是模型地板上的 x、z。
const scenes = {
  konbini: ['shop', 0xdce4d3, [['shelf', -2, -1], ['shelf', -.6, -1], ['fridge', 1.5, -1.6], ['counter', 2, 0]]],
  ramen: ['shop', 0xe1b894, [['kitchen', -1, -1.6], ['counter', 0, -.5], ['stool', -1, .4], ['stool', 0, .4], ['stool', 1, .4], ['lantern', 2.2, -1.5]]],
  tsukiji: ['yard', 0xadc8cc, [['stall', -1.7, -1], ['fish', -1.7, -1], ['stall', 1, -1.5], ['fish', 1, -1.5], ['crate', 2, .3]]],
  marunouchi: ['shop', 0xc4d1da, [['computer', -1.6, -1], ['computer', .6, -1], ['computer', 1.9, .2], ['plant', -2.3, .3]]],
  shibuya_tech: ['shop', 0xdec7ae, [['computer', -1.8, -.9], ['computer', -.1, -1.4], ['sofa', 1.6, -.8], ['board', 1.7, -1.85], ['plant', 2.2, .2]]],
  gym: ['shop', 0xc3c9cb, [['mat', -1.4, -.8], ['barbell', -1.4, -.8], ['mat', 1, -.8], ['barbell', 1, -.8], ['bench', 1.4, .5]]],
  library: ['shop', 0xd5b895, [['shelf', -1.9, -1.55], ['shelf', -.2, -1.55], ['shelf', 1.6, -1.55], ['books', -.5, .05], ['plant', 2.1, .1]]],
  karaoke: ['shop', 0xc9a3c3, [['sofa', -1.45, -.9], ['table', -1.2, .05], ['speaker', 1.6, -1.35], ['screen', .4, -1.65], ['mic', 1, .2]]],
  izakaya: ['shop', 0xbc926c, [['counter', -.75, -1.15], ['stool', -1.5, -.25], ['stool', -.3, -.25], ['lantern', 1.85, -1.3], ['table', 1.75, .1]]],
  club: ['shop', 0x897eaa, [['stage', 0, -1], ['speaker', -2, -1.35], ['speaker', 2, -1.35], ['disco', 0, -.7], ['mat', 0, .1]]],
  onsen: ['shop', 0xc4d6ce, [['bath', -.8, -.7], ['screen', 1.8, -1.55], ['bench', 1.6, .15], ['plant', 2, -.55]]],
  shrine: ['yard', 0xbdc79c, [['torii', 0, -.85], ['tree', -2, -1], ['tree', 2, -1.3], ['crate', 1.7, .4]]],
  temple: ['yard', 0xd2bb97, [['torii', 0, -1.5], ['stall', -1.85, -.6], ['stall', 1.85, -.6], ['lantern', 1.2, .25]]],
  park: ['yard', 0xb4ca91, [['sakura', -1.85, -.95], ['sakura', 1.8, -1.25], ['bench', -1, -.1], ['pond', 1.45, .25]]],
  akiba: ['shop', 0xb6c2d6, [['screen', -1.55, -1.4], ['screen', .15, -1.4], ['computer', 1.85, -.8], ['shelf', -2, .05]]],
  hospital: ['shop', 0xd3e4dd, [['counter', -1.4, -1.15], ['bed', 1.35, -.85], ['screen', 2.2, -1.5], ['plant', -2.1, .3]]],
  police: ['shop', 0xb7c9db, [['counter', -1.25, -1.15], ['computer', .75, -1.35], ['board', 1.95, -1.8], ['bench', 1.65, .2]]],
  ginza: ['shop', 0xe0c5be, [['counter', -1.55, -1], ['shelf', 0, -1.5], ['stall', 1.5, -.85], ['plant', 2.25, .2]]],
  furniture: ['shop', 0xdabfa0, [['bed', -1.75, -1], ['sofa', .1, -1], ['table', 1.5, -.9], ['shelf', 2, -1.8]]],
  livehouse: ['shop', 0xa296ad, [['stage', 0, -1.15], ['mic', 0, -1.05], ['speaker', -2, -1.25], ['speaker', 2, -1.25], ['stool', 1, -.85]]],
  cityhall: ['shop', 0xc9cdc2, [['board', 0, -1.8], ['counter', -1.5, -.8], ['ballot', .35, -.6], ['ballot', 1.65, -.6]]],
  estate: ['shop', 0xd8c0a5, [['board', -1.65, -1.75], ['computer', 1.5, -1.15], ['house', -.8, -.5], ['sofa', 1.3, .1]]],
  beach: ['yard', 0xe9ca91, [['sea', 0, -1.3], ['parasol', -1.55, -.1], ['parasol', 1.5, .1], ['surf', 2.15, -.45]]],
  school: ['shop', 0xd9c29f, [['board', .1, -1.85], ['books', -1.5, -.6], ['books', 0, -.4], ['books', 1.5, -.65]]],
  courage: ['shop', 0xb09278, [['lantern', -2.1, -1.1], ['lantern', 2.1, -1.1], ['shelf', .6, -1.65], ['counter', -.75, -.6]]],
  airport: ['yard', 0xb8c2c9, [['runway', 0, 0], ['plane', 0, -.5], ['tower', 2.05, -1.45]]],
  fuji: ['yard', 0xa9c5a5, [['mountain', 0, -.85], ['tree', -2, .05], ['tree', 2, -.3], ['pond', .8, .35]]]
}

function prop(root, id, x, z) {
  const group = new Group()
  group.position.set(x, 0, z)
  root.add(group)
  const b = (color, x, y, z, w, h, d) => box(group, color, x, y, z, w, h, d)
  const r = (color, x, y, z, size, height) => round(group, color, x, y, z, size, height)
  const p = (color, x, y, z, size, height) => pot(group, color, x, y, z, size, height)
  const table = (width = 1.1) => {
    b(wood, 0, .29, 0, width * .72, .58, .43)
    b(cream, 0, .61, 0, width, .08, .67)
  }
  switch (id) {
    case 'shelf':
    case 'fridge':
      b(id === 'fridge' ? slate : wood, 0, .75, 0, 1.15, 1.5, .34)
      for (const y of [.35, .74, 1.13]) {
        b(cream, 0, y, .2, 1.15, .06, .38)
        for (const [i, color] of [coral, teal, cream, slate].entries()) b(color, -.42 + i * .23, y + .13, .28, .15, .2, .16)
      }
      break
    case 'counter': table(2.4); break
    case 'table': table(); break
    case 'computer':
    case 'books':
    case 'kitchen':
      table(id === 'kitchen' ? 1.65 : 1.05)
      if (id === 'computer') {
        b(slate, 0, .91, -.1, .58, .37, .08)
        b(0xadd5db, 0, .92, -.049, .48, .27, .02)
        b(teal, 0, .67, .19, .42, .04, .16)
      } else if (id === 'books') {
        b(coral, -.13, .68, 0, .42, .06, .34)
        b(teal, -.06, .74, .06, .36, .06, .26)
      } else {
        for (const x of [-.42, .42]) p(slate, x, .72, 0, .19, .15)
      }
      break
    case 'tree':
    case 'sakura':
      p(wood, 0, .65, 0, .13, 1.3)
      for (const [x, y, z] of [[0, 1.52, 0], [-.36, 1.25, .05], [.36, 1.3, -.05]]) r(id === 'sakura' ? 0xe59bb6 : leaf, x, y, z, .51, .44)
      break
    case 'plant':
      p(coral, 0, .15, 0, .23, .3); r(leaf, 0, .48, 0, .28); break
    case 'torii':
      for (const x of [-.65, .65]) p(0xaf5146, x, .81, 0, .11, 1.62)
      b(0xaf5146, 0, 1.35, 0, 1.67, .12, .17)
      b(slate, 0, 1.67, 0, 1.95, .14, .23)
      break
    case 'stall':
      table(1.32)
      for (const x of [-.55, .55]) b(wood, x, 1.07, -.24, .08, 1.05, .08)
      b(coral, 0, 1.58, -.05, 1.46, .13, .85)
      break
    case 'fish':
      for (const x of [-.36, 0, .36]) r(0x7ba6bc, x, .74, .11, .17, .08)
      break
    case 'lantern':
      p(wood, 0, .67, 0, .055, 1.34); r(coral, 0, 1.37, 0, .22, .28); break
    case 'bench':
    case 'sofa':
      b(id === 'sofa' ? teal : wood, 0, .25, 0, 1.36, .23, .55)
      b(id === 'sofa' ? teal : wood, 0, .45, -.22, 1.36, .38, .12)
      for (const x of [-.49, .49]) b(slate, x, .1, 0, .11, .2, .38)
      break
    case 'stool': p(wood, 0, .18, 0, .08, .36); p(coral, 0, .39, 0, .22, .09); break
    case 'board':
    case 'screen':
      b(wood, 0, .59, 0, .15, 1.18, .16)
      b(id === 'board' ? teal : slate, 0, 1.12, 0, 1.24, .72, .13)
      b(id === 'board' ? cream : 0xacc7df, 0, 1.12, .077, 1.07, .52, .025)
      break
    case 'bed':
      b(cream, 0, .23, 0, .86, .45, 1.36); b(teal, 0, .49, .13, .83, .12, .91); b(0xfff5dc, 0, .5, -.45, .6, .14, .32); break
    case 'mat': b(teal, 0, .045, 0, 1.45, .09, 1.12); break
    case 'barbell':
      b(slate, 0, .19, 0, 1.15, .06, .06)
      for (const x of [-.48, .48]) r(slate, x, .18, 0, .18)
      break
    case 'stage': b(slate, 0, .16, 0, 3.12, .32, 1.24); break
    case 'speaker':
      b(slate, 0, .53, 0, .51, 1.06, .45)
      for (const y of [.3, .72]) r(0x313840, 0, y, .23, .16)
      break
    case 'mic': p(slate, 0, .66, 0, .035, 1.29); r(slate, 0, 1.33, 0, .084); break
    case 'disco': r(0xc8afea, 0, 1.84, 0, .3); break
    case 'pond': r(0x77adb9, 0, .015, 0, .64, .035); break
    case 'bath':
      b(cream, 0, .15, 0, 2.15, .3, 1.3)
      b(0x7bbdc1, 0, .31, 0, 1.92, .035, 1.08)
      break
    case 'sea': b(0x78b8c8, 0, .025, 0, 5.9, .05, 1.65); break
    case 'parasol': p(wood, 0, .58, 0, .045, 1.16); r(coral, 0, 1.18, 0, .54, .22); break
    case 'surf': r(teal, 0, .57, 0, .22, .57); break
    case 'ballot': table(.78); b(slate, 0, .78, 0, .45, .27, .32); b(cream, 0, .923, 0, .24, .012, .05); break
    case 'house': b(cream, 0, .26, 0, .85, .52, .8); b(coral, 0, .56, 0, 1.02, .14, .95); break
    case 'runway':
      b(slate, 0, .03, 0, 5.7, .06, 1.43)
      for (const x of [-2.3, -1.2, 0, 1.2, 2.3]) b(cream, x, .063, 0, .57, .006, .055)
      break
    case 'plane': r(cream, 0, .35, 0, .31, .27).scale.x = 4.5; b(teal, 0, .32, 0, .38, .1, 1.75); break
    case 'tower': p(slate, 0, .65, 0, .16, 1.3); b(0x9dc6ce, 0, 1.36, 0, .63, .29, .64); break
    case 'mountain':
      partMountain(group)
      break
    case 'crate': b(wood, 0, .23, 0, .64, .46, .57); break
  }
}

function partMountain(group) {
  const base = new Mesh(new ConeGeometry(1.53, 1.95, 9), new MeshStandardMaterial({ color: slate }))
  base.position.y = .975
  const snow = new Mesh(new ConeGeometry(.55, .69, 9), new MeshStandardMaterial({ color: cream }))
  snow.position.y = 1.611
  group.add(base, snow)
}

const outfits = {
  haruka: [0xc78d90, 0x4b3332], ren: [0xdbd2bf, 0x4d3c34], aoi: [0x788fac, 0x292d3e],
  kenta: [0x9bba7a, 0x614738], mio: [0xce7ca7, 0x5e3c51], daichi: [0x4b627f, 0x373138],
  yui: [0xe6ddd2, 0x664436], sho: [0x71a7ad, 0x886040], natsume: [0xb78c5f, 0x443630],
  sumire: [0x78a474, 0x684736], riku: [0x718da2, 0x373031], nozomi: [0xa581ae, 0x584050]
}

function actor(root, id, index, total) {
  const group = new Group()
  const [shirt, hair] = outfits[id] || [teal, slate]
  const skin = 0xe6b58d
  group.position.set((index - (total - 1) / 2) * .85, 0, 1.15 + (index % 2) * .3)
  group.rotation.y = index % 2 ? .18 : -.1
  group.userData.hit = id
  root.add(group)
  for (const x of [-.09, .09]) box(group, slate, x, .19, 0, .13, .38, .18)
  box(group, shirt, 0, .51, 0, .38, .38, .24)
  for (const x of [-.23, .23]) round(group, shirt, x, .49, 0, .078, .17)
  round(group, skin, 0, .85, 0, .203, .213)
  round(group, hair, 0, .956, -.04, .207, .139)
  for (const x of [-.065, .065]) round(group, 0x423136, x, .861, .179, .018)
  if (id === 'natsume') {
    box(group, slate, .21, .49, .145, .2, .14, .1)
    round(group, 0x91b4c4, .21, .49, .207, .051)
  } else if (id === 'sumire') {
    pot(group, coral, .24, .39, .16, .095, .16)
    round(group, leaf, .24, .53, .16, .1)
  } else if (id === 'riku') {
    box(group, wood, .235, .46, .15, .22, .15, .105)
    round(group, slate, .2, .47, .208, .044)
  } else if (id === 'nozomi') {
    box(group, slate, .23, .51, .13, .075, .17, .07)
    round(group, cream, .23, .601, .13, .037)
  }
  return group
}

export function buildLocation({ id, people }) {
  const [kind, floor, props] = scenes[id]
  const root = new Group()
  box(root, floor, 0, -.14, 0, 5.95, .28, 4.48)
  if (kind === 'shop') {
    box(root, floor, 0, .93, -2.13, 5.95, 1.86, .14)
    box(root, cream, -2.91, .53, 0, .13, 1.06, 4.35)
  }
  for (const [name, x, z] of props) prop(root, name, x, z)
  return { root, targets: people.map((person, index) => actor(root, person, index, people.length)) }
}
