/**
 * Inline boot script — adds splash-pending before paint; failsafe only if React
 * never claims the controller (avoids cutting the real animation short).
 */
export function buildSplashBootInlineScript(): string {
  return `(function(){
try{
  var p=location.pathname;
  if(/^\\/admin(?:\\/|$)/.test(p)||p==="/login"||p==="/register"||p==="/forgot-password"||p==="/reset-password"||p.startsWith("/checkout")||p.startsWith("/cart"))return;
  if(sessionStorage.getItem("vibe-splash-seen")==="1")return;
}catch(e){}
window.__VIBE_SPLASH_T0=Date.now();
document.documentElement.classList.add("vibe-splash-pending");
function unblock(){
  var h=document.documentElement;
  if(!h.classList.contains("vibe-splash-pending"))return;
  if(h.getAttribute("data-splash-controller")==="ready")return;
  if(h.classList.contains("vibe-splash-active"))return;
  h.classList.remove("vibe-splash-pending");
  h.classList.remove("vibe-splash-active");
  h.removeAttribute("data-splash-controller");
  var b=document.getElementById("vibe-boot-splash");
  if(b)b.setAttribute("hidden","");
  try{sessionStorage.setItem("vibe-splash-seen","1");}catch(x){}
}
function armFailsafe(){setTimeout(unblock,12000);}
if(document.readyState==="complete")armFailsafe();
else window.addEventListener("load",armFailsafe,{once:true});
})();`;
}
