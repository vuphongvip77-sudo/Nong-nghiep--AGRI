const DATA_PATH=location.pathname.includes("/pages/")?"../data/articles.json":"data/articles.json";
function menu(){const b=document.querySelector(".menu-toggle"),n=document.querySelector(".main-nav");if(b&&n)b.onclick=()=>n.classList.toggle("is-open")}
function esc(v=""){return v.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
async function articles(){const r=await fetch(DATA_PATH);if(!r.ok)throw Error("Không tải được dữ liệu.");return r.json()}
function card(a,p="pages/"){return `<a class="article-card" href="${p}article.html?id=${encodeURIComponent(a.id)}"><div class="article-meta">${esc(a.categoryLabel)}</div><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p></a>`}
async function featured(){const t=document.querySelector("#featured-list");if(!t)return;try{const a=await articles();t.innerHTML=a.filter(x=>x.featured).map(x=>card(x)).join("")}catch(e){t.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`}}
function homeSearch(){const f=document.querySelector("#home-search");if(!f)return;f.onsubmit=e=>{e.preventDefault();const q=new FormData(f).get("q")?.trim()||"";location.href=`pages/search.html?q=${encodeURIComponent(q)}`}}
document.addEventListener("DOMContentLoaded",()=>{menu();homeSearch();featured()});