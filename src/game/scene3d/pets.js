import { ConeGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three'
import { PET_ROUTINES, nextPetSpot, petHabitat, petResting } from '../pet-behavior.js'

const UP = new Vector3(0, 1, 0)
const blend = (a, b, t) => a + (b - a) * t

function mesh(parent, geometry, color, x = 0, y = 0, z = 0) {
  const object = new Mesh(geometry, new MeshStandardMaterial({ color }))
  object.position.set(x, y, z)
  parent.add(object)
  return object
}

function oval(parent, color, x, y, z, width, height, depth) {
  const object = mesh(parent, new SphereGeometry(1, 12, 8), color, x, y, z)
  object.scale.set(width, height, depth)
  return object
}

function segment(object, start, end) {
  const direction = new Vector3().subVectors(end, start)
  object.position.copy(start).lerp(end, .5)
  object.scale.y = direction.length()
  object.quaternion.setFromUnitVectors(UP, direction.normalize())
}

const jumpKeys = [
  [0,0,0,0,0,0], [.25,-.075,-.03,0,.05,0],
  [.42,.055,.13,.16,-.11,0], [.57,.26,.19,.28,-.18,.25],
  [.68,.29,.10,.32,-.05,.30], [.79,.16,.19,.15,.05,.24],
  [.88,.015,.13,0,.07,.12], [.94,-.065,.06,0,.06,0], [1,0,0,0,0,0]
]
function jumpPose(t) {
  const index = jumpKeys.findIndex(key => key[0] >= t)
  if (index <= 0) return jumpKeys[0].slice(1)
  const a = jumpKeys[index - 1], b = jumpKeys[index]
  return a.slice(1).map((value, i) => blend(value, b[i + 1], (t - a[0]) / (b[0] - a[0])))
}

function createPet(kind) {
  const cat = kind === 'cat'
  const fur = cat ? 0xd58a42 : 0xad6c37
  const dark = cat ? 0x9d542c : 0x81502c
  const cream = 0xffe6be
  const root = new Group()
  root.name = kind + '-quadruped'
  root.scale.setScalar(cat ? .68 : .76)
  const torso = oval(root, fur, 0, .37, 0, cat ? .29 : .26, .128, .15)
  const head = new Group()
  root.add(head)
  oval(head, fur, 0, 0, 0, .15, .145, .148)
  oval(head, cream, .105, -.052, 0, .093, .068, .103)
  oval(head, 0x432c25, .183, -.031, 0, .023, .022, .041)
  const eyes = []
  for (const side of [-1, 1]) {
    if (cat) {
      const ear = mesh(head, new ConeGeometry(.069, .15, 4), fur, -.046, .157, side*.092)
      ear.rotation.x = side*.23
      ear.rotation.y = Math.PI/4
    } else {
      const ear = oval(head, dark, -.053, .052, side*.135, .075, .122, .041)
      ear.rotation.x = side*.33
    }
    eyes.push(oval(head, 0x382721, .097, .037, side*.102, .025, .031, .021))
  }
  if (cat) {
    for (const z of [-.055, 0, .055]) {
      oval(head, dark, .033, .136, z, .06, .012, .012)
    }
  }
  const tail = new Group()
  root.add(tail)
  for (let i=0;i<6;i++) {
    const t=i/5
    oval(tail, cat?dark:fur, -t*.23, Math.sin(t*Math.PI*.72)*.17, 0, .049,.047,.047)
  }
  const legs = []
  for (const front of [false,true]) for (const side of [-1,1]) {
    legs.push({
      front, side,
      upper:mesh(root,new CylinderGeometry(.049,.063,1,8),fur),
      lower:mesh(root,new CylinderGeometry(.035,.046,1,8),fur),
      paw:oval(root,cream,0,0,0,.064,.033,.05)
    })
  }

  function pose(action, elapsed) {
    const sleeping = action === 'sleep'
    const settling = sleeping ? Math.min(1,elapsed/.85) : 0
    const rest = settling*settling*(3-2*settling)
    const breath = sleeping ? Math.sin(elapsed*3)*.006*rest : 0
    const jumpTime = Math.min(1,elapsed/1.45)
    const [rise,foreX,foreY,hindX,hindY] = action === 'jump' ? jumpPose(jumpTime) : [0,0,0,0,0]
    const gait = elapsed*(cat?10:13)
    const height = .37 - rest*.23 + rise + breath
    torso.position.y=height
    torso.rotation.z=action==='jump' ? Math.sin(jumpTime*Math.PI*2)*.20 : 0
    head.position.set(.25+rest*.035,height+.118-rest*.113-(action==='sniff'?.095:0),0)
    head.rotation.z=-rest*.31
    for (const eye of eyes) eye.scale.y=.031*(1-.82*rest)
    tail.position.set(-.22,height+.02,0)
    tail.rotation.y=Math.sin(elapsed*7)*.42*(1-rest)
    tail.rotation.z=rest*.88
    for (const leg of legs) {
      const {front,side}=leg
      const phase=gait+(front===(side>0)?0:Math.PI)+(cat&&side<0?.55:0)
      const walking=action==='run'
      const x=(front?.186:-.19)
      const reach=(front?foreX:hindX)+(walking?Math.cos(phase)*.11:0)
      const lift=(front?foreY:hindY)+(walking?Math.max(0,Math.sin(phase))*.09:0)
      const grooming=action==='groom'&&front&&side>0
      const paw=new Vector3(x+reach+rest*(front?.112:.16)+(grooming?.14:0),.034+lift+(grooming?.13+Math.sin(elapsed*8)*.026:0),side*(.098+rest*.037))
      const shoulder=new Vector3(x,height-.035,side*.097)
      const knee=new Vector3(blend(x,paw.x,.52)+(front?-.05:.065)*(1-rest),blend(shoulder.y,paw.y,.55),paw.z)
      segment(leg.upper,shoulder,knee)
      segment(leg.lower,knee,paw)
      leg.paw.position.copy(paw)
    }
  }
  return { root, pose }
}

export function addScenePets(root, kind, data, pets) {
  const points = kind==='room'
    ? data.cells.filter(cell=>!cell.item || cell.item.fid==='rug').map(({x,y})=>({id:x+','+y,x,y,z:y+.5,worldX:x+.5}))
    : [0,1,2].map(x=>({id:String(x),x,y:0,z:3.35,worldX:.32+x*1.16}))
  if (!points.length) return () => false
  const actors = ['cat','dog'].filter(species=>pets[species]).map((species,index)=>{
    const actor=createPet(species)
    root.add(actor.root)
    const spot=points[Math.min(index,points.length-1)]
    return {...actor,species,spot,from:spot,step:-1,yaw:Math.PI/4}
  })
  let start
  return (time) => {
    start ??= time
    const elapsed=(time-start)/1000
    const step=Math.floor(elapsed/2.6)
    const phase=elapsed-step*2.6
    let visible=false
    for (const actor of actors) {
      const pet=pets[actor.species]
      const now=Date.now()
      actor.root.visible=!!pet && petHabitat(actor.species,pet,now)===kind
      if (!actor.root.visible) continue
      visible=true
      const routine=PET_ROUTINES[actor.species]
      const resting=petResting(pet,now)
      const action=resting?'sleep':routine[(step+(actor.species==='cat'?2:0))%routine.length]
      if (action!==actor.action) {
        actor.action=action
        actor.actionSince=elapsed
      }
      if (step!==actor.step) {
        actor.step=step
        actor.from=actor.spot
        if (action==='run') {
          actor.spot=nextPetSpot(points,actor.spot.id,step)
          if (actor.spot!==actor.from) actor.yaw=Math.atan2(actor.from.z-actor.spot.z,actor.spot.worldX-actor.from.worldX)
        }
      }
      const walk=Math.min(1,phase/2.4)
      actor.root.position.set(blend(actor.from.worldX,actor.spot.worldX,walk),.02,blend(actor.from.z,actor.spot.z,walk))
      actor.root.rotation.y=actor.yaw
      actor.pose(action,elapsed-actor.actionSince)
    }
    return visible
  }
}
