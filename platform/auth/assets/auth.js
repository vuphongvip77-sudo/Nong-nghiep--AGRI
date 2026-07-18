const TOKEN_KEY="agri_auth_token_v72";
const API_KEY="agri_api_base_v72";
const ROLE_LABELS={admin:"Quản trị viên",editor:"Biên tập viên",technician:"Kỹ thuật viên",viewer:"Người xem"};
const $=s=>document.querySelector(s);

function apiBase(){
  return ($("#api-base")?.value||localStorage.getItem(API_KEY)||"http://127.0.0.1:8787").replace(/\/+$/,"");
}

async function api(path,options={}){
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  const token=localStorage.getItem(TOKEN_KEY);
  if(token) headers.Authorization=`Bearer ${token}`;
  const res=await fetch(`${apiBase()}${path}`,{...options,headers});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||`Lỗi HTTP ${res.status}`);
  return data;
}

function showMessage(text,type="error"){
  const el=$("#login-message");
  el.textContent=text;
  el.className=`message ${type}`;
  el.hidden=false;
}

function showAccount(user){
  $("#login-view").hidden=true;
  $("#account-view").hidden=false;
  $("#account-name").textContent=user.name||"Người dùng AGRI";
  $("#account-username").textContent=user.username||"";
  $("#account-role").textContent=ROLE_LABELS[user.role]||user.role||"";
}

function showLogin(){
  $("#account-view").hidden=true;
  $("#login-view").hidden=false;
}

async function checkSession(){
  const savedBase=localStorage.getItem(API_KEY);
  if(savedBase) $("#api-base").value=savedBase;
  if(!localStorage.getItem(TOKEN_KEY)) return;
  try{
    const data=await api("/api/me");
    showAccount(data.user);
  }catch(e){
    localStorage.removeItem(TOKEN_KEY);
    showLogin();
  }
}

document.addEventListener("DOMContentLoaded",()=>{
  checkSession();

  $("#login-form").addEventListener("submit",async e=>{
    e.preventDefault();
    $("#login-message").hidden=true;
    const base=apiBase();
    localStorage.setItem(API_KEY,base);
    try{
      const data=await api("/api/auth/login",{
        method:"POST",
        body:JSON.stringify({
          username:$("#username").value.trim(),
          password:$("#password").value
        })
      });
      localStorage.setItem(TOKEN_KEY,data.token);
      showAccount(data.user);
    }catch(err){
      showMessage(err.message);
    }
  });

  $("#btn-logout").addEventListener("click",async()=>{
    try{await api("/api/auth/logout",{method:"POST"})}catch(e){}
    localStorage.removeItem(TOKEN_KEY);
    showLogin();
  });
});