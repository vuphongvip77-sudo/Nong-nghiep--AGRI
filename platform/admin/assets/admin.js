const TOKEN_KEY="agri_auth_token_v72",API_KEY="agri_api_base_v72";
const $=s=>document.querySelector(s),E=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function base(){return(localStorage.getItem(API_KEY)||"http://127.0.0.1:8787").replace(/\/+$/,"")}
async function api(path){const token=localStorage.getItem(TOKEN_KEY);const r=await fetch(base()+path,{headers:{Authorization:`Bearer ${token}`}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||`HTTP ${r.status}`);return d}
async function load(){
  const token=localStorage.getItem(TOKEN_KEY);
  if(!token){location.href="../auth/";return}
  try{
    const me=await api("/api/me");
    if(me.user.role!=="admin")throw Error("Chỉ quản trị viên được truy cập.");
    const [users,logs]=await Promise.all([api("/api/users"),api("/api/logs")]);
    $("#guard").hidden=true;$("#content").hidden=false;
    $("#users").innerHTML=`<table class="table"><thead><tr><th>Họ tên</th><th>Tài khoản</th><th>Vai trò</th></tr></thead><tbody>${users.items.map(u=>`<tr><td>${E(u.name)}</td><td>${E(u.username)}</td><td><span class="badge">${E(u.role)}</span></td></tr>`).join("")}</tbody></table>`;
    $("#logs").innerHTML=logs.items.slice(0,20).map(l=>`<div class="log"><strong>${E(l.action)}</strong><br><small>${E(l.username)} • ${E(new Date(l.time).toLocaleString("vi-VN"))}</small></div>`).join("")||"Chưa có nhật ký.";
  }catch(e){$("#guard").innerHTML=`<h1>Không thể truy cập</h1><p>${E(e.message)}</p><a class="button" href="../auth/">Đăng nhập lại</a>`}
}
document.addEventListener("DOMContentLoaded",()=>{load();$("#reload").onclick=load});