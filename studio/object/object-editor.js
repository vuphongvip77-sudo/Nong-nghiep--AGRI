
const STORAGE_KEY='agri_object_ga_sao_v1';
let objectData=null;
let currentIndex=-1;

const $=s=>document.querySelector(s);

async function loadData(){
  const local=localStorage.getItem(STORAGE_KEY);
  if(local) return JSON.parse(local);
  const response=await fetch('../../data/objects/ga-sao.json');
  if(!response.ok) throw new Error('Không tải được dữ liệu Gà sao.');
  const data=await response.json();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
  return data;
}

function saveLocal(){
  objectData.updated=new Date().toISOString().slice(0,10);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(objectData));
}

function renderMeta(){
  $('#object-name').value=objectData.name||'';
  $('#object-slug').value=objectData.slug||'';
  $('#object-summary').value=objectData.summary||'';
}

function renderTabs(){
  $('#section-tabs').innerHTML=objectData.sections.map((s,i)=>`
    <button class="section-tab ${i===currentIndex?'active':''}" data-index="${i}">
      <span>${s.icon||'•'}</span><span>${s.title}</span>
    </button>`).join('');
  document.querySelectorAll('.section-tab').forEach(btn=>{
    btn.addEventListener('click',()=>selectSection(Number(btn.dataset.index)));
  });
}

function selectSection(index){
  currentIndex=index;
  renderTabs();
  const s=objectData.sections[index];
  $('#section-empty').hidden=true;
  $('#section-form').hidden=false;
  $('#section-title').textContent=s.title||'Mục nội dung';
  $('#section-name').value=s.title||'';
  $('#section-icon').value=s.icon||'';
  $('#section-content').value=(s.content||[]).join('\n\n');
  $('#section-items').value=(s.items||[]).join('\n');
}

function saveCurrent(){
  if(currentIndex<0) return;
  const s=objectData.sections[currentIndex];
  s.title=$('#section-name').value.trim()||'Mục mới';
  s.icon=$('#section-icon').value.trim()||'•';
  s.id=s.id||slugify(s.title);
  s.content=$('#section-content').value.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  s.items=$('#section-items').value.split('\n').map(x=>x.trim()).filter(Boolean);
  saveLocal();
  renderTabs();
  $('#section-title').textContent=s.title;
  alert('Đã lưu mục nội dung.');
}

function slugify(text=''){
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function addSection(){
  const section={id:`muc-${Date.now()}`,title:'Mục mới',icon:'📌',content:[],items:[]};
  objectData.sections.push(section);
  saveLocal();
  selectSection(objectData.sections.length-1);
}

function deleteSection(){
  if(currentIndex<0) return;
  const name=objectData.sections[currentIndex].title;
  if(!confirm(`Xóa mục “${name}”?`)) return;
  objectData.sections.splice(currentIndex,1);
  currentIndex=-1;
  saveLocal();
  renderTabs();
  $('#section-form').hidden=true;
  $('#section-empty').hidden=false;
  $('#section-title').textContent='Chọn một mục';
}

function saveAll(){
  objectData.name=$('#object-name').value.trim()||'Gà sao';
  objectData.slug=$('#object-slug').value.trim()||'ga-sao';
  objectData.summary=$('#object-summary').value.trim();
  if(currentIndex>=0) saveCurrent();
  else saveLocal();
  alert('Đã lưu toàn bộ dữ liệu đối tượng.');
}

function exportJSON(){
  saveAll();
  const blob=new Blob([JSON.stringify(objectData,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='ga-sao.json';a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      objectData=JSON.parse(reader.result);
      saveLocal();currentIndex=-1;renderMeta();renderTabs();
      $('#section-form').hidden=true;$('#section-empty').hidden=false;
      alert('Đã nhập dữ liệu đối tượng.');
    }catch(e){alert(`Không thể nhập file: ${e.message}`)}
  };
  reader.readAsText(file,'utf-8');
}

document.addEventListener('DOMContentLoaded',async()=>{
  try{
    objectData=await loadData();
    renderMeta();
    renderTabs();
    selectSection(0);
  }catch(e){
    alert(e.message);
  }

  $('#btn-save-section').addEventListener('click',saveCurrent);
  $('#btn-delete-section').addEventListener('click',deleteSection);
  $('#btn-add-section').addEventListener('click',addSection);
  $('#btn-save-all').addEventListener('click',saveAll);
  $('#btn-export').addEventListener('click',exportJSON);
  $('#btn-import').addEventListener('click',()=>$('#file-import').click());
  $('#file-import').addEventListener('change',e=>e.target.files[0]&&importJSON(e.target.files[0]));
});
