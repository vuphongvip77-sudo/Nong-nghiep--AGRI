
const STORAGE_KEY='agri_objects_v2_1';
const CATEGORY_LABELS={
  'chan-nuoi':'Chăn nuôi','trong-trot':'Trồng trọt','thuy-san':'Thủy sản','vietgap':'VietGAP','ocop':'OCOP'
};
const DEFAULT_SECTIONS=[
  ['tong-quan','Tổng quan','📖'],
  ['chuong-trai','Chuồng trại','🏠'],
  ['con-giong','Con giống','🐣'],
  ['um','Úm','🔥'],
  ['thuc-an','Thức ăn','🌽'],
  ['nuoc-uong','Nước uống','💧'],
  ['suc-khoe','Sức khỏe và phòng bệnh','🩺'],
  ['faq','Câu hỏi thường gặp','❓'],
  ['bieu-mau','Biểu mẫu','📝'],
  ['tai-lieu','Tài liệu','📚']
];

let objects=[];
let currentObjectIndex=-1;
let currentSectionIndex=-1;
const $=s=>document.querySelector(s);

function slugify(text=''){
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

async function loadObjects(){
  const local=localStorage.getItem(STORAGE_KEY);
  if(local) return JSON.parse(local);

  const response=await fetch('../../data/objects/index.json');
  if(!response.ok) return [];
  const idx=await response.json();
  const loaded=[];
  for(const item of (idx.objects||[])){
    try{
      const r=await fetch(`../../data/objects/${item.file||item.slug+'.json'}`);
      if(r.ok) loaded.push(await r.json());
    }catch(e){}
  }
  localStorage.setItem(STORAGE_KEY,JSON.stringify(loaded));
  return loaded;
}

function saveLocal(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(objects));
}

function renderObjectList(){
  const root=$('#object-list');
  root.innerHTML=objects.length?objects.map((o,i)=>`
    <button class="object-item ${i===currentObjectIndex?'active':''}" data-object-index="${i}">
      <span>${escapeHTML(o.icon||'📚')}</span>
      <span><strong>${escapeHTML(o.name)}</strong><small>${escapeHTML(CATEGORY_LABELS[o.category]||o.category||'')}</small></span>
      <span class="object-actions">
        <button type="button" title="Xóa" data-delete-object="${i}">🗑</button>
      </span>
    </button>`).join(''):'<div class="empty">Chưa có đối tượng.</div>';

  root.querySelectorAll('[data-object-index]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      if(e.target.closest('[data-delete-object]')) return;
      selectObject(Number(btn.dataset.objectIndex));
    });
  });
  root.querySelectorAll('[data-delete-object]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      deleteObject(Number(btn.dataset.deleteObject));
    });
  });
}

function selectObject(index){
  saveCurrentObjectMeta();
  currentObjectIndex=index;
  currentSectionIndex=-1;
  renderObjectList();
  renderEditor();
}

function renderEditor(){
  if(currentObjectIndex<0 || !objects[currentObjectIndex]){
    $('#editor-empty').hidden=false;
    $('#editor-area').hidden=true;
    $('#object-heading').textContent='Chưa chọn đối tượng';
    return;
  }
  const o=objects[currentObjectIndex];
  $('#editor-empty').hidden=true;
  $('#editor-area').hidden=false;
  $('#object-heading').textContent=`${o.icon||'📚'} ${o.name}`;
  $('#object-name').value=o.name||'';
  $('#object-slug').value=o.slug||'';
  $('#object-icon').value=o.icon||'';
  $('#object-category').value=o.category||'chan-nuoi';
  $('#object-summary').value=o.summary||'';
  renderSectionTabs();
  if(o.sections?.length) selectSection(0);
  else{
    $('#section-form').hidden=true;
    $('#section-empty').hidden=false;
  }
}

function saveCurrentObjectMeta(){
  if(currentObjectIndex<0 || !objects[currentObjectIndex]) return;
  const o=objects[currentObjectIndex];
  if($('#object-name')) o.name=$('#object-name').value.trim()||o.name;
  if($('#object-slug')) o.slug=slugify($('#object-slug').value||o.name);
  if($('#object-icon')) o.icon=$('#object-icon').value.trim()||'📚';
  if($('#object-category')) o.category=$('#object-category').value;
  if($('#object-summary')) o.summary=$('#object-summary').value.trim();
  o.updated=new Date().toISOString().slice(0,10);
}

function renderSectionTabs(){
  const o=objects[currentObjectIndex];
  $('#section-tabs').innerHTML=(o.sections||[]).map((s,i)=>`
    <button class="section-tab ${i===currentSectionIndex?'active':''}" data-section-index="${i}">
      <span>${escapeHTML(s.icon||'•')}</span><span>${escapeHTML(s.title)}</span>
    </button>`).join('');
  document.querySelectorAll('[data-section-index]').forEach(btn=>{
    btn.addEventListener('click',()=>selectSection(Number(btn.dataset.sectionIndex)));
  });
}

function selectSection(index){
  saveCurrentSection();
  currentSectionIndex=index;
  renderSectionTabs();
  const s=objects[currentObjectIndex].sections[index];
  $('#section-empty').hidden=true;
  $('#section-form').hidden=false;
  $('#section-title').textContent=s.title||'Mục nội dung';
  $('#section-name').value=s.title||'';
  $('#section-icon').value=s.icon||'';
  $('#section-content').value=(s.content||[]).join('\n\n');
  $('#section-items').value=(s.items||[]).join('\n');
}

function saveCurrentSection(){
  if(currentObjectIndex<0 || currentSectionIndex<0) return;
  const s=objects[currentObjectIndex].sections[currentSectionIndex];
  if(!s) return;
  s.title=$('#section-name').value.trim()||s.title||'Mục mới';
  s.icon=$('#section-icon').value.trim()||'•';
  s.id=s.id||slugify(s.title);
  s.content=$('#section-content').value.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  s.items=$('#section-items').value.split('\n').map(x=>x.trim()).filter(Boolean);
}

function saveAll(showAlert=true){
  saveCurrentSection();
  saveCurrentObjectMeta();
  saveLocal();
  renderObjectList();
  if(currentObjectIndex>=0) $('#object-heading').textContent=`${objects[currentObjectIndex].icon||'📚'} ${objects[currentObjectIndex].name}`;
  if(showAlert) alert('Đã lưu toàn bộ dữ liệu.');
}

function createObject(){
  const name=$('#new-name').value.trim();
  if(!name){alert('Vui lòng nhập tên đối tượng.');return false}
  const slug=slugify(name);
  if(objects.some(o=>o.slug===slug)){alert('Đối tượng này đã tồn tại.');return false}
  const obj={
    id:`object-${slug}`,
    slug,
    name,
    category:$('#new-category').value,
    icon:$('#new-icon').value.trim()||'📚',
    summary:$('#new-summary').value.trim(),
    updated:new Date().toISOString().slice(0,10),
    sections:DEFAULT_SECTIONS.map(([id,title,icon])=>({id,title,icon,content:[],items:[]}))
  };
  objects.push(obj);
  saveLocal();
  $('#new-object-dialog').close();
  $('#new-object-form').reset();
  $('#new-icon').value='📚';
  selectObject(objects.length-1);
  return true;
}

function deleteObject(index){
  const o=objects[index];
  if(!confirm(`Xóa đối tượng “${o.name}”?`)) return;
  objects.splice(index,1);
  saveLocal();
  currentObjectIndex=objects.length?Math.min(index,objects.length-1):-1;
  currentSectionIndex=-1;
  renderObjectList();
  renderEditor();
}

function addSection(){
  if(currentObjectIndex<0) return;
  objects[currentObjectIndex].sections.push({
    id:`muc-${Date.now()}`,title:'Mục mới',icon:'📌',content:[],items:[]
  });
  saveLocal();
  selectSection(objects[currentObjectIndex].sections.length-1);
}

function deleteSection(){
  if(currentObjectIndex<0 || currentSectionIndex<0) return;
  const s=objects[currentObjectIndex].sections[currentSectionIndex];
  if(!confirm(`Xóa mục “${s.title}”?`)) return;
  objects[currentObjectIndex].sections.splice(currentSectionIndex,1);
  currentSectionIndex=-1;
  saveLocal();
  renderSectionTabs();
  $('#section-form').hidden=true;
  $('#section-empty').hidden=false;
  $('#section-title').textContent='Chọn một mục';
}

function exportCurrentObject(){
  if(currentObjectIndex<0){alert('Chưa chọn đối tượng.');return}
  saveAll(false);
  const o=objects[currentObjectIndex];
  downloadJSON(o,`${o.slug}.json`);
}

function exportIndex(){
  saveAll(false);
  const index={
    version:'1.1',
    objects:objects.map(o=>({
      id:o.id,slug:o.slug,name:o.name,category:o.category,icon:o.icon,
      summary:o.summary||'',file:`${o.slug}.json`
    }))
  };
  downloadJSON(index,'index.json');
}

function downloadJSON(data,filename){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=filename;a.click();
  URL.revokeObjectURL(url);
}

function escapeHTML(v=''){
  return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;',">":'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

document.addEventListener('DOMContentLoaded',async()=>{
  objects=await loadObjects();
  renderObjectList();
  if(objects.length) selectObject(0);

  $('#btn-new-object').addEventListener('click',()=>$('#new-object-dialog').showModal());
  $('#create-object-confirm').addEventListener('click',e=>{
    e.preventDefault();
    createObject();
  });
  $('#btn-save-all').addEventListener('click',()=>saveAll(true));
  $('#btn-export-object').addEventListener('click',exportCurrentObject);
  $('#btn-export-index').addEventListener('click',exportIndex);
  $('#btn-add-section').addEventListener('click',addSection);
  $('#btn-save-section').addEventListener('click',()=>{saveCurrentSection();saveLocal();renderSectionTabs();alert('Đã lưu mục nội dung.')});
  $('#btn-delete-section').addEventListener('click',deleteSection);
});
