\
const STORAGE_KEY='agri_km_v5_objects';
const TYPE_LABELS={animal:'Vật nuôi',plant:'Cây trồng',aquaculture:'Thủy sản',standard:'Tiêu chuẩn'};
const TYPE_FOLDER={animal:'animals',plant:'plants',aquaculture:'aquaculture',standard:'standards'};
const TEMPLATES={
  animal:[['tong-quan','Tổng quan','📖'],['chuong-trai','Chuồng trại','🏠'],['con-giong','Con giống','🐣'],['um','Úm','🔥'],['thuc-an','Thức ăn','🌽'],['nuoc-uong','Nước uống','💧'],['suc-khoe','Sức khỏe và phòng bệnh','🩺'],['bieu-mau','Biểu mẫu','📝'],['tai-lieu','Tài liệu','📚']],
  plant:[['tong-quan','Tổng quan','📖'],['dieu-kien','Điều kiện sinh thái','🌦️'],['giong','Giống','🌱'],['dat-trong','Đất và chuẩn bị vườn','🟫'],['trong','Kỹ thuật trồng','🪴'],['cham-soc','Chăm sóc','🧑‍🌾'],['dinh-duong','Phân bón và dinh dưỡng','🧪'],['sau-benh','Sâu bệnh','🐛'],['thu-hoach','Thu hoạch','📦'],['bieu-mau','Biểu mẫu','📝']],
  aquaculture:[['tong-quan','Tổng quan','📖'],['ao-nuoi','Ao và hệ thống nuôi','🌊'],['con-giong','Con giống','🐟'],['tha-giong','Thả giống','🪣'],['thuc-an','Thức ăn','🌽'],['nuoc','Quản lý chất lượng nước','💧'],['suc-khoe','Sức khỏe và phòng bệnh','🩺'],['thu-hoach','Thu hoạch','📦'],['bieu-mau','Biểu mẫu','📝']],
  standard:[['tong-quan','Tổng quan','📖'],['dieu-kien','Điều kiện áp dụng','✅'],['ho-so','Hồ sơ cần chuẩn bị','📂'],['quy-trinh','Quy trình thực hiện','🧭'],['kiem-tra','Kiểm tra và đánh giá','🔎'],['duy-tri','Duy trì sau chứng nhận','♻️'],['bieu-mau','Biểu mẫu','📝'],['tai-lieu','Tài liệu','📚']]
};

let objects=[];
let selectedIndex=-1;
let activeType='';
const $=s=>document.querySelector(s);

function slugify(text=''){
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function saveLocal(){localStorage.setItem(STORAGE_KEY,JSON.stringify(objects))}

async function loadObjects(){
  const local=localStorage.getItem(STORAGE_KEY);
  if(local) return JSON.parse(local);
  const r=await fetch('../../knowledge/index/knowledge.json');
  if(!r.ok) return [];
  const idx=await r.json();
  const result=[];
  for(const item of (idx.items||[])){
    try{
      const f=await fetch(`../../${item.path}`);
      if(f.ok) result.push(await f.json());
    }catch(e){}
  }
  localStorage.setItem(STORAGE_KEY,JSON.stringify(result));
  return result;
}

function filteredObjects(){
  const q=$('#search').value.trim().toLocaleLowerCase('vi');
  const sort=$('#sort').value;
  let list=objects.map((o,index)=>({o,index})).filter(({o})=>{
    const text=[o.name,o.summary,(o.keywords||[]).join(' '),o.category].join(' ').toLocaleLowerCase('vi');
    return (!activeType||o.knowledgeType===activeType)&&(!q||text.includes(q));
  });
  list.sort((a,b)=>{
    if(sort==='updated') return String(b.o.updated||'').localeCompare(String(a.o.updated||''));
    if(sort==='type') return String(a.o.knowledgeType||'').localeCompare(String(b.o.knowledgeType||''));
    return String(a.o.name||'').localeCompare(String(b.o.name||''),'vi');
  });
  return list;
}

function renderList(){
  const list=filteredObjects();
  $('#object-list').innerHTML=list.length?list.map(({o,index})=>`
    <button class="object-card ${index===selectedIndex?'active':''}" data-index="${index}">
      <span class="icon">${esc(o.icon||'📚')}</span>
      <span><strong>${esc(o.name)}</strong><small>${esc(TYPE_LABELS[o.knowledgeType]||'Khác')} • ${esc(o.updated||'')}</small></span>
    </button>`).join(''):'<div class="empty-state">Không tìm thấy đối tượng.</div>';
  document.querySelectorAll('.object-card').forEach(btn=>btn.addEventListener('click',()=>selectObject(Number(btn.dataset.index))));
}

function selectObject(index){
  selectedIndex=index;
  renderList();
  const o=objects[index];
  $('#detail-empty').hidden=true;
  $('#detail-view').hidden=false;
  $('#detail-title').textContent=`${o.icon||'📚'} ${o.name}`;
  $('#detail-type').textContent=TYPE_LABELS[o.knowledgeType]||'Khác';
  $('#detail-category').textContent=o.category||'';
  $('#detail-slug').textContent=o.slug||'';
  $('#detail-updated').textContent=o.updated||'';
  $('#detail-summary').textContent=o.summary||'Chưa có mô tả.';
  $('#section-list').innerHTML=(o.sections||[]).map(s=>`
    <div class="section-row"><span>${esc(s.icon||'•')} ${esc(s.title)}</span><small>${(s.content||[]).length+(s.items||[]).length} nội dung</small></div>`).join('')||'<div class="empty-state">Chưa có mục nội dung.</div>';
  const folder=TYPE_FOLDER[o.knowledgeType]||'animals';
  $('#public-link').href=`../../pages/knowledge/?path=knowledge/${folder}/${encodeURIComponent(o.slug)}.json`;
}

function openEditor(index=''){
  $('#editor-form').reset();
  $('#edit-index').value=index;
  $('#dialog-title').textContent=index===''?'Đối tượng mới':'Sửa đối tượng';
  if(index!==''){
    const o=objects[Number(index)];
    $('#name').value=o.name||'';
    $('#type').value=o.knowledgeType||'animal';
    $('#category').value=o.category||'chan-nuoi';
    $('#icon').value=o.icon||'📚';
    $('#summary').value=o.summary||'';
    $('#keywords').value=(o.keywords||[]).join(', ');
  }else{
    $('#icon').value='📚';
  }
  $('#editor-dialog').showModal();
}

function saveObject(){
  const name=$('#name').value.trim();
  if(!name){alert('Vui lòng nhập tên đối tượng.');return}
  const type=$('#type').value;
  const index=$('#edit-index').value;
  const old=index!==''?objects[Number(index)]:null;
  const slug=old?.slug||slugify(name);
  const obj={
    ...(old||{}),
    id:old?.id||`object-${slug}`,
    slug,
    name,
    knowledgeType:type,
    category:$('#category').value,
    icon:$('#icon').value.trim()||'📚',
    summary:$('#summary').value.trim(),
    keywords:$('#keywords').value.split(',').map(x=>x.trim()).filter(Boolean),
    updated:new Date().toISOString().slice(0,10),
    version:'5.0',
    status:'published',
    sections:old?.sections||(TEMPLATES[type]||TEMPLATES.animal).map(([id,title,icon])=>({id,title,icon,content:[],items:[]}))
  };
  if(index==='') objects.push(obj); else objects[Number(index)]=obj;
  saveLocal();
  $('#editor-dialog').close();
  selectedIndex=index===''?objects.length-1:Number(index);
  renderList();
  selectObject(selectedIndex);
}

function deleteSelected(){
  if(selectedIndex<0) return;
  const o=objects[selectedIndex];
  if(!confirm(`Xóa đối tượng “${o.name}”?`)) return;
  objects.splice(selectedIndex,1);
  selectedIndex=-1;
  saveLocal();
  renderList();
  $('#detail-view').hidden=true;
  $('#detail-empty').hidden=false;
}

function exportData(){
  const index={
    version:'5.0',
    updated:new Date().toISOString().slice(0,10),
    items:objects.map(o=>({
      id:o.id,slug:o.slug,name:o.name,icon:o.icon,category:o.category,
      knowledgeType:o.knowledgeType,summary:o.summary||'',
      path:`knowledge/${TYPE_FOLDER[o.knowledgeType]||'animals'}/${o.slug}.json`
    }))
  };
  const blob=new Blob([JSON.stringify({objects,index},null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='agri-knowledge-manager-export.json';a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded',async()=>{
  objects=await loadObjects();
  renderList();
  if(objects.length) selectObject(0);

  document.querySelectorAll('.tree-item[data-type]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.tree-item[data-type]').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    activeType=btn.dataset.type;
    renderList();
  }));
  $('#search').addEventListener('input',renderList);
  $('#sort').addEventListener('change',renderList);
  $('#btn-new').addEventListener('click',()=>openEditor(''));
  $('#btn-edit').addEventListener('click',()=>selectedIndex>=0&&openEditor(selectedIndex));
  $('#btn-delete').addEventListener('click',deleteSelected);
  $('#btn-save').addEventListener('click',e=>{e.preventDefault();saveObject()});
  $('#btn-export').addEventListener('click',exportData);
});
