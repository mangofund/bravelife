// SVGA 2.x vector subset. Field numbers match svga/SVGA-Format/proto/svga.proto.
// Only paths, rectangles and ellipses are emitted by our pet authoring tool.
export const schema = { nested: {
  Color: { fields: { r:{type:'float',id:1},g:{type:'float',id:2},b:{type:'float',id:3},a:{type:'float',id:4} } },
  Style: { fields: { fill:{type:'Color',id:1},stroke:{type:'Color',id:2},strokeWidth:{type:'float',id:3},lineCap:{type:'int32',id:4},lineJoin:{type:'int32',id:5} } },
  Transform: { fields: Object.fromEntries(['a','b','c','d','tx','ty'].map((k,i)=>[k,{type:'float',id:i+1}])) },
  Layout: { fields: Object.fromEntries(['x','y','width','height'].map((k,i)=>[k,{type:'float',id:i+1}])) },
  Path: { fields: { d:{type:'string',id:1} } },
  Rect: { fields: Object.fromEntries(['x','y','width','height','cornerRadius'].map((k,i)=>[k,{type:'float',id:i+1}])) },
  Ellipse: { fields: Object.fromEntries(['x','y','radiusX','radiusY'].map((k,i)=>[k,{type:'float',id:i+1}])) },
  Shape: { fields: { type:{type:'int32',id:1},shape:{type:'Path',id:2},rect:{type:'Rect',id:3},ellipse:{type:'Ellipse',id:4},styles:{type:'Style',id:10},transform:{type:'Transform',id:11} } },
  Frame: { fields: { alpha:{type:'float',id:1},layout:{type:'Layout',id:2},transform:{type:'Transform',id:3},shapes:{rule:'repeated',type:'Shape',id:5} } },
  Sprite: { fields: { imageKey:{type:'string',id:1},frames:{rule:'repeated',type:'Frame',id:2} } },
  Params: { fields: { viewBoxWidth:{type:'float',id:1},viewBoxHeight:{type:'float',id:2},fps:{type:'int32',id:3},frames:{type:'int32',id:4} } },
  Movie: { fields: { version:{type:'string',id:1},params:{type:'Params',id:2},sprites:{rule:'repeated',type:'Sprite',id:4} } }
} }
