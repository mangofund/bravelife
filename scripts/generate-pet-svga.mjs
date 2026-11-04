// Original vector pets; deterministic SVGA 2.x authoring, no remote art or runtime image downloads.
import fs from 'node:fs'
import path from 'node:path'
import { deflateSync } from 'node:zlib'
import protobuf from 'protobufjs/light.js'
import { schema } from '../src/game/animation/svga-schema.js'
const Movie=protobuf.Root.fromJSON(schema).lookupType('Movie')
const root=path.resolve('src/static/pets');fs.mkdirSync(root,{recursive:true})
const outline='#624535',cream='#fff3db',pink='#e9a39a'
const color=(hex,alpha=1)=>({r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255,a:alpha})
// [frame, torso offset, forepaw reach, forepaw lift, hindpaw reach, hindpaw lift].
const leap = [
 [0,0,0,0,0,0], [4,7,-3,0,5,0], [7,-4,12,18,-11,0],
 [10,-21,17,28,-17,24], [13,-23,11,30,-4,29],
 [16,-12,16,15,5,24], [18,1,12,0,3,13],
 [20,6,5,0,6,0], [23,0,0,0,0,0]
]
const mix = (a,b,t) => a+(b-a)*t
function leapPose(frame) {
 const end = leap.findIndex(key => key[0] >= frame)
 if (end <= 0) return leap[0].slice(1)
 const a=leap[end-1], b=leap[end]
 return a.slice(1).map((value,i)=>mix(value,b[i+1],(frame-a[0])/(b[0]-a[0])))
}
function draw(kind,action,frame){
 const shapes=[],t=frame/24*Math.PI*2,cat=kind==='cat',fur=cat?'#dfa05b':'#c68a50',dark=cat?'#b77341':'#a56538'
 const moving=action==='run', jumping=action==='jump', sleep=action==='sleep', groom=action==='groom', sniff=action==='sniff'
 const [body,frontReach,frontLift,backReach,backLift]=jumping?leapPose(frame):[0,0,0,0,0]
 const settle=sleep?Math.min(1,frame/11):0
 const breath=sleep&&frame>=12?Math.sin((frame-12)/12*Math.PI*2)*.65:0
 const bob=moving?Math.sin(t*2)*1.4:0
 const Y=y=>y+body+settle*13+bob+breath
 const style=(fill,stroke=outline,width=1.7)=>({fill:color(fill),stroke:color(stroke),strokeWidth:width,lineCap:1,lineJoin:1})
 const ellipse=(x,y,rx,ry,fill,stroke=outline,width=1.7,alpha=1)=>shapes.push({type:2,ellipse:{x,y:Y(y),radiusX:rx,radiusY:ry},styles:{...style(fill,stroke,width),fill:color(fill,alpha),stroke:color(stroke,alpha)}})
 const p=(d,fill,stroke=outline,width=1.7)=>shapes.push({type:0,shape:{d},styles:style(fill,stroke,width)})
 const line=(d,stroke=outline,width=1.7)=>p(d,stroke,stroke,width)
 // Keep the shadow on the ground through takeoff and landing.
 shapes.push({type:2,ellipse:{x:62,y:104,radiusX:30+Math.min(0,body)*.35,radiusY:3},styles:{fill:color('#685241',.15)}})
 // Species-specific tail silhouette: cat's expressive upright curve; dog's curled wag.
 const wag=Math.sin(t*(action==='idle'?2:3))*7
 if(sleep)line(`M 36 ${Y(78)} Q ${mix(14,22,settle)} ${Y(mix(52,92,settle))} ${mix(22,46,settle)} ${Y(mix(49,98-settle*13,settle))}`,dark,cat?7:10)
 else if(cat)line(`M 36 ${Y(82)} C 12 ${Y(78)} ${12+wag} ${Y(49)} ${25+wag} ${Y(51)}`,dark,8)
 else line(`M 37 ${Y(77)} C 7 ${Y(48+wag*.4)} 44 ${Y(44+wag)} 33 ${Y(65)}`,fur,12)
 // Four separate hip/shoulder → joint → paw chains. Paws use ground coordinates.
 function leg(front,near) {
  const phase=t*2+(front===near?0:Math.PI)+(cat&&!near?.55:0)
  const stride=moving?Math.cos(phase)*(cat?8:11):0
  const lift=moving?Math.max(0,Math.sin(phase))*9:0
  const rootX=(front?77:44)+(near?3:-5)
  const rootY=Y(front?76:75)+(near?2:-2)
  const reach=front?frontReach:backReach
  const jumpLift=front?frontLift:backLift
  const pawX=rootX+stride+reach*(cat?1:.87)+settle*(front?9:12)
  const pawY=(near?101:97)-lift-jumpLift-(groom&&front&&near?18+Math.sin(t*2)*3:0)
  const kneeX=mix(rootX,pawX,.5)+(front?-4:7)*(1-settle)
  const kneeY=mix(rootY,pawY,.54)+settle*3
  const limb=near?fur:dark
  const limbPath=`M ${rootX} ${rootY} L ${kneeX} ${kneeY} L ${pawX} ${pawY}`
  line(limbPath,outline,near?8:7)
  line(limbPath,limb,near?6:5)
  ellipse(pawX,pawY-Y(0),near?5:4,2.8,near?cream:dark,outline,1)
 }
 leg(false,false);leg(true,false)
 ellipse(59,75,30,15+breath*.4,fur)
 ellipse(65,82-settle*2,21,8,cream,cream,0)
 leg(false,true);leg(true,true)
 const hx=(sniff?88:85)+settle*4
 const hy=(sniff?73:59)+(groom?5:0)+settle*10
 // Ears are separate from head and move with its pose.
 if(cat){
  p(`M ${hx-17} ${Y(hy-8)} L ${hx-18} ${Y(hy-29)} L ${hx-3} ${Y(hy-18)} Z`,fur)
  p(`M ${hx+5} ${Y(hy-19)} L ${hx+18} ${Y(hy-30)} L ${hx+19} ${Y(hy-4)} Z`,fur)
  p(`M ${hx-14} ${Y(hy-13)} L ${hx-15} ${Y(hy-23)} L ${hx-7} ${Y(hy-17)} Z`,pink,pink,0)
  p(`M ${hx+9} ${Y(hy-17)} L ${hx+15} ${Y(hy-23)} L ${hx+15} ${Y(hy-11)} Z`,pink,pink,0)
 }else{
  p(`M ${hx-18} ${Y(hy-7)} Q ${hx-28} ${Y(hy-29)} ${hx-12} ${Y(hy-23)} L ${hx-2} ${Y(hy-14)} Z`,dark)
  p(`M ${hx+6} ${Y(hy-15)} L ${hx+17} ${Y(hy-29)} Q ${hx+27} ${Y(hy-14)} ${hx+17} ${Y(hy-3)} Z`,fur)
 }
 ellipse(hx,hy,23,21,fur)
 ellipse(hx+3,hy+9,17,10,cream,cream,0)
 if(cat){ // Tabby forehead marks and whiskers.
  for(let i=-1;i<=1;i++)line(`M ${hx+i*6} ${Y(hy-18)} L ${hx+i*5} ${Y(hy-11)}`,dark,2)
  for(const side of [-1,1])for(const dy of [-2,3])line(`M ${hx+side*14} ${Y(hy+8+dy)} L ${hx+side*27} ${Y(hy+5+dy*2)}`,outline,.9)
 }
 const blink=frame===18||frame===19||groom||(sleep&&settle>.65)
 for(const x of [hx-8,hx+10]){
  if(blink)line(`M ${x-3} ${Y(hy+1)} Q ${x} ${Y(hy+4)} ${x+3} ${Y(hy+1)}`,outline,2)
  else {ellipse(x,hy,2.6,3.8,outline,outline,0);ellipse(x+.6,hy-1.2,.8,1.1,cream,cream,0)}
 }
 ellipse(hx+2,hy+8,3,2.2,cat?pink:outline,outline,.7)
 line(`M ${hx+2} ${Y(hy+10)} Q ${hx+2} ${Y(hy+15)} ${hx-3} ${Y(hy+13)}`,outline,1.2)
 if(!cat&&(action==='idle'||moving||action==='jump'))ellipse(hx+7,hy+15,3,4,pink,pink,0)
 // A subdued collar, keeping species silhouettes distinct at game scale.
 line(`M ${hx-16} ${Y(hy+18)} Q ${hx-3} ${Y(hy+25)} ${hx+11} ${Y(hy+19)}`,cat?'#a883ac':'#738e79',3)
 ellipse(hx-1,hy+22,2.3,2.7,'#dbb76d',outline,.8)
 return shapes
}
const actions={dog:['idle','run','jump','sniff','sleep'],cat:['idle','run','jump','groom','sleep']}
for(const [kind,list] of Object.entries(actions))for(const action of list){
 const movie={version:'2.0',params:{viewBoxWidth:128,viewBoxHeight:112,fps:12,frames:24},sprites:[{imageKey:kind+'.vector',frames:Array.from({length:24},(_,i)=>({alpha:1,layout:{x:0,y:0,width:128,height:112},transform:{a:1,b:0,c:0,d:1,tx:0,ty:0},shapes:draw(kind,action,i).map(shape => ({...shape, transform:{a:1,b:0,c:0,d:1,tx:0,ty:0}}))}))}]}
 const error=Movie.verify(movie);if(error)throw Error(error)
 fs.writeFileSync(path.join(root,kind+'-'+action+'.svga'),deflateSync(Movie.encode(Movie.create(movie)).finish()))
}
fs.writeFileSync(path.join(root,'README.md'),'# BraveLife original pet animation assets\n\n10 original vector SVGA 2.x clips, 128×112, 12 fps, 24 frames, transparent.\nGenerated deterministically by `node scripts/generate-pet-svga.mjs`.\nDog: idle/wag, run/trot, jump, sniff, sleep. Cat: idle, run/walk, jump/pounce, groom, sleep.\nNo third-party artwork or remote media. Format: https://github.com/svga/SVGA-Format/blob/master/proto/svga.proto\nThe shared cross-platform player supports only this authored vector subset (absolute M/L/Q/C/Z paths and ellipses); it is not a general SVGA player.\n')
console.log('Generated 10 transparent vector SVGA clips')
