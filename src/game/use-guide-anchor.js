import { getCurrentInstance, onMounted, onBeforeUnmount } from 'vue'
import { ui } from './ui.js'
// Measure inside the owning component, including its room scale and scrolling.
export function useGuideAnchor(key, selector) {
  const instance=getCurrentInstance()
  let timer,alive=true,pending=false
  const measure=()=>{
    if(!alive||pending||!ui.gameVisible)return
    pending=true
    uni.createSelectorQuery().in(instance.proxy).select(selector).boundingClientRect(rect=>{
      pending=false
      if(!alive)return
      ui.guideAnchors[key]=rect&&rect.width>0&&rect.height>0?{left:rect.left,top:rect.top,width:rect.width,height:rect.height}:null
    }).exec()
  }
  onMounted(()=>{measure();timer=setInterval(measure,350)})
  onBeforeUnmount(()=>{alive=false;clearInterval(timer);ui.guideAnchors[key]=null})
}
