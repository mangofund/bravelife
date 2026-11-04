// Short pages keep the independent bubble small even on a 320px phone.
export function guidePages(guide) {
  if(!guide)return []
  return (guide.text.match(/[^。；]+[。；]?/g)||[]).flatMap(sentence=>{
    const chars=Array.from(sentence),pages=[]
    while(chars.length)pages.push(chars.splice(0,30).join(''))
    return pages
  })
}
