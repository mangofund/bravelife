import protobuf from 'protobufjs/minimal.js'
import { unzlibSync } from 'fflate'
import { schema } from './svga-schema.js'
// Interpret the fixed field table with protobuf's minimal Reader. No eval/Function
// generation: WeChat mini-programs prohibit runtime-generated JavaScript.
const tables = Object.fromEntries(Object.entries(schema.nested).map(([name, spec]) => [name, Object.fromEntries(Object.entries(spec.fields).map(([key, field]) => [field.id, { key, ...field }]))]))
function decodeMessage(reader, name, end) {
  const table = tables[name], value = {}
  for (const f of Object.values(table)) value[f.key] = f.rule === 'repeated' ? [] : tables[f.type] ? null : f.type === 'string' ? '' : 0
  while (reader.pos < end) {
    const tag = reader.uint32(), field = table[tag >>> 3]
    if (!field) { reader.skipType(tag & 7); continue }
    let result
    if (tables[field.type]) { const length = reader.uint32(); const stop = reader.pos + length; if(stop > end)throw Error('Invalid SVGA field length'); result = decodeMessage(reader, field.type, stop) }
    else result = reader[field.type]()
    if (field.rule === 'repeated') value[field.key].push(result)
    else value[field.key] = result
  }
  return value
}
const cache = new Map()
export function decodePetSVGA(bytes) {
  const raw = unzlibSync(new Uint8Array(bytes))
  const movie = decodeMessage(protobuf.Reader.create(raw), 'Movie', raw.length)
  if (movie.version !== '2.0' || movie.params?.frames !== 24 || !movie.sprites.length) throw Error('Unsupported pet animation')
  return movie
}
export function loadPetSVGA(kind, action) {
  const path = '/static/pets/' + kind + '-' + action + '.svga'
  if (!cache.has(path)) {
    const pending = new Promise((resolve, reject) => {
      const loaded = data => { try { resolve(decodePetSVGA(data)) } catch (error) { reject(error) } }
      // #ifdef MP-WEIXIN
      wx.getFileSystemManager().readFile({filePath: path.slice(1), success: res => loaded(res.data), fail: reject})
      // #endif
      // #ifndef MP-WEIXIN
      uni.request({ url: path, responseType: 'arraybuffer', success: res => res.statusCode === 200 ? loaded(res.data) : reject(Error('Pet asset unavailable')), fail: reject })
      // #endif
    }).catch(error => { cache.delete(path); throw error })
    cache.set(path, pending)
  }
  return cache.get(path)
}
function path(ctx, d) {
  const tokens = d.match(/[MLQCZ]|-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi) || []
  let i = 0
  const n = () => Number(tokens[i++])
  while (i < tokens.length) {
    const command = tokens[i++]
    if (command === 'M') ctx.moveTo(n(), n())
    else if (command === 'L') ctx.lineTo(n(), n())
    else if (command === 'Q') ctx.quadraticCurveTo(n(), n(), n(), n())
    else if (command === 'C') ctx.bezierCurveTo(n(), n(), n(), n(), n(), n())
    else if (command === 'Z') ctx.closePath()
    else throw Error('Unsupported authored path command')
  }
}
const rgba = c => `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},${c.a})`
export function drawPetFrame(ctx, movie, frame, size) {
  ctx.clearRect(0, 0, size, size*112/128)
  ctx.save(); ctx.scale(size/128, size/128)
  for (const sprite of movie.sprites) {
    const f = sprite.frames[frame % movie.params.frames]
    if (!f || f.alpha === 0) continue
    ctx.save(); ctx.setGlobalAlpha(f.alpha)
    const t=f.transform
    if(t)ctx.transform(t.a,t.b,t.c,t.d,t.tx,t.ty)
    for(const s of f.shapes){
      ctx.beginPath()
      if(s.type===2){ const e=s.ellipse;ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.radiusX,e.radiusY);ctx.arc(0,0,1,0,Math.PI*2);ctx.restore() }
      else if(s.type===0)path(ctx,s.shape.d)
      else throw Error('Unsupported authored pet shape')
      const st=s.styles
      if(st.fill){ctx.setFillStyle(rgba(st.fill));ctx.fill()}
      if(st.stroke && st.strokeWidth>0){ctx.setStrokeStyle(rgba(st.stroke));ctx.setLineWidth(st.strokeWidth);ctx.setLineCap('round');ctx.setLineJoin('round');ctx.stroke()}
    }
    ctx.restore()
  }
  ctx.restore();ctx.draw()
}
