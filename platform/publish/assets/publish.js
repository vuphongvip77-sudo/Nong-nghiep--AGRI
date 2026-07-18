\
const STORAGE_KEY='agri_km_v5_objects';
const TYPE_FOLDER={animal:'animals',plant:'plants',aquaculture:'aquaculture',standard:'standards'};
const TYPE_LABEL={animal:'Vật nuôi',plant:'Cây trồng',aquaculture:'Thủy sản',standard:'Tiêu chuẩn'};

let objects=[];
let validationResults=[];
let publishFiles=[];

const $=s=>document.querySelector(s);

function esc(v=''){
  return String(v).replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}

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

function validateObject(o){
  const errors=[];
  const warnings=[];

  if(!o.name?.trim()) errors.push('Thiếu tên đối tượng.');
  if(!o.slug?.trim()) errors.push('Thiếu mã đường dẫn.');
  if(!o.knowledgeType) errors.push('Thiếu loại tri thức.');
  if(!TYPE_FOLDER[o.knowledgeType]) errors.push('Loại tri thức không hợp lệ.');
  if(!o.category) warnings.push('Chưa có chuyên mục.');
  if(!o.icon) warnings.push('Chưa có biểu tượng.');
  if(!o.summary?.trim()) warnings.push('Chưa có mô tả ngắn.');
  if(!Array.isArray(o.sections)||o.sections.length===0) errors.push('Chưa có mục nội dung.');

  (o.sections||[]).forEach((s,i)=>{
    if(!s.title?.trim()) errors.push(`Mục ${i+1} thiếu tiêu đề.`);
    const count=(s.content||[]).length+(s.items||[]).length;
    if(count===0) warnings.push(`Mục “${s.title||i+1}” chưa có nội dung.`);
  });

  return {errors,warnings};
}

function runValidation(){
  validationResults=objects.map(o=>{
    const check=validateObject(o);
    let status='ok';
    if(check.errors.length) status='error';
    else if(check.warnings.length) status='warn';
    return {object:o,status,...check};
  });
  renderValidation();
  prepareFiles();
}

function renderValidation(){
  const valid=validationResults.filter(x=>x.status==='ok').length;
  const warns=validationResults.filter(x=>x.status==='warn').length;
  const errors=validationResults.filter(x=>x.status==='error').length;

  $('#stat-total').textContent=objects.length;
  $('#stat-valid').textContent=valid;
  $('#stat-warning').textContent=warns;
  $('#stat-error').textContent=errors;

  const overall=$('#overall-status');
  if(errors){
    overall.textContent='Có lỗi';
    overall.className='status error';
  }else if(warns){
    overall.textContent='Có cảnh báo';
    overall.className='status warn';
  }else{
    overall.textContent='Sẵn sàng xuất bản';
    overall.className='status ok';
  }

  $('#validation-list').innerHTML=validationResults.length?validationResults.map(r=>{
    const icon=r.status==='ok'?'✅':r.status==='warn'?'⚠️':'❌';
    const detail=[
      ...r.errors.map(x=>`Lỗi: ${x}`),
      ...r.warnings.map(x=>`Cảnh báo: ${x}`)
    ];
    return `<div class="validation-item ${r.status}">
      <span class="icon">${icon}</span>
      <div>
        <strong>${esc(r.object.icon||'📚')} ${esc(r.object.name||'Chưa có tên')}</strong>
        <small>${detail.length?detail.map(esc).join(' • '):'Dữ liệu hợp lệ.'}</small>
      </div>
      <span class="status ${r.status==='ok'?'ok':r.status==='warn'?'warn':'error'}">
        ${r.status==='ok'?'Hợp lệ':r.status==='warn'?'Cảnh báo':'Lỗi'}
      </span>
    </div>`;
  }).join(''):'<div class="empty">Chưa có đối tượng.</div>';
}

function prepareFiles(){
  const publishable=objects.filter((o,i)=>validationResults[i]?.status!=='error');

  const indexData={
    version:'5.3',
    updated:new Date().toISOString().slice(0,10),
    items:publishable.map(o=>({
      id:o.id,
      slug:o.slug,
      name:o.name,
      icon:o.icon||'📚',
      category:o.category||'',
      knowledgeType:o.knowledgeType,
      summary:o.summary||'',
      path:`knowledge/${TYPE_FOLDER[o.knowledgeType]}/${o.slug}.json`
    }))
  };

  publishFiles=publishable.map(o=>({
    name:`${o.slug}.json`,
    folder:`knowledge/${TYPE_FOLDER[o.knowledgeType]}/`,
    data:{...o,version:'5.3',status:'published',updated:new Date().toISOString().slice(0,10)}
  }));

  publishFiles.push({
    name:'knowledge.json',
    folder:'knowledge/index/',
    data:indexData
  });

  $('#file-list').innerHTML=publishFiles.map(f=>`
    <div class="file-item">
      <span class="icon">📄</span>
      <div><strong>${esc(f.name)}</strong><small>${esc(f.folder)}</small></div>
      <span class="badge">${f.name==='knowledge.json'?'Chỉ mục':'Đối tượng'}</span>
    </div>`).join('');
}

function downloadJSON(file){
  const blob=new Blob([JSON.stringify(file.data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=file.name;
  a.click();
  URL.revokeObjectURL(url);
}

function openPublishDialog(){
  runValidation();
  const hasErrors=validationResults.some(x=>x.status==='error');
  if(hasErrors){
    alert('Chưa thể xuất bản vì vẫn còn lỗi dữ liệu.');
    return;
  }

  $('#download-summary').innerHTML=publishFiles.map(f=>`
    <li><code>${esc(f.folder+f.name)}</code></li>
  `).join('');
  $('#publish-dialog').showModal();
}

function downloadAll(){
  publishFiles.forEach((f,i)=>setTimeout(()=>downloadJSON(f),i*450));
}

document.addEventListener('DOMContentLoaded',async()=>{
  objects=await loadObjects();
  runValidation();

  $('#btn-validate').addEventListener('click',runValidation);
  $('#btn-publish').addEventListener('click',openPublishDialog);
  $('#btn-download-all').addEventListener('click',downloadAll);
  $('#close-dialog').addEventListener('click',()=>$('#publish-dialog').close());
});
