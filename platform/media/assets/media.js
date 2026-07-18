\
const STORAGE_KEY='agri_media_v5_4';
const TYPE_LABELS={image:'Hình ảnh',video:'Video',pdf:'PDF',word:'Word',excel:'Excel'};
const TYPE_ICONS={image:'🖼',video:'🎥',pdf:'📕',word:'📄',excel:'📊'};

let mediaItems=[];
let activeType='';

const $=s=>document.querySelector(s);

function escapeHTML(v=''){
  return String(v).replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}

function saveLocal(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(mediaItems));
}

function loadLocal(){
  const raw=localStorage.getItem(STORAGE_KEY);
  return raw?JSON.parse(raw):[
    {
      id:'media-ga-sao-001',
      name:'Ảnh minh họa chuồng úm gà sao',
      type:'image',
      path:'media/images/ga-sao/chuong-um.jpg',
      description:'Ảnh mẫu dùng cho mục chuồng trại và úm.',
      objectSlug:'ga-sao',
      keywords:['chuồng úm','gà sao'],
      previewUrl:'',
      updated:new Date().toISOString().slice(0,10)
    }
  ];
}

function renderStats(){
  $('#stat-total').textContent=mediaItems.length;
  $('#stat-image').textContent=mediaItems.filter(x=>x.type==='image').length;
  $('#stat-video').textContent=mediaItems.filter(x=>x.type==='video').length;
  $('#stat-document').textContent=mediaItems.filter(x=>['pdf','word','excel'].includes(x.type)).length;
}

function filteredItems(){
  const q=$('#search').value.trim().toLocaleLowerCase('vi');
  const sort=$('#sort').value;
  let list=mediaItems.map((item,index)=>({item,index})).filter(({item})=>{
    const text=[item.name,item.description,item.objectSlug,(item.keywords||[]).join(' ')].join(' ').toLocaleLowerCase('vi');
    return (!activeType||item.type===activeType)&&(!q||text.includes(q));
  });

  list.sort((a,b)=>{
    if(sort==='updated') return String(b.item.updated||'').localeCompare(String(a.item.updated||''));
    if(sort==='type') return String(a.item.type).localeCompare(String(b.item.type));
    return String(a.item.name).localeCompare(String(b.item.name),'vi');
  });

  return list;
}

function render(){
  renderStats();
  const list=filteredItems();

  $('#media-grid').innerHTML=list.length?list.map(({item,index})=>{
    const preview=item.type==='image'&&item.previewUrl
      ? `<img src="${escapeHTML(item.previewUrl)}" alt="${escapeHTML(item.name)}">`
      : `<span>${TYPE_ICONS[item.type]||'📁'}</span>`;

    return `<article class="media-card">
      <div class="media-preview">${preview}</div>
      <div class="media-body">
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.description||'Chưa có mô tả.')}</p>
        <div class="media-meta">
          <span class="badge">${escapeHTML(TYPE_LABELS[item.type]||item.type)}</span>
          ${item.objectSlug?`<span class="badge">${escapeHTML(item.objectSlug)}</span>`:''}
        </div>
        <small>${escapeHTML(item.path)}</small>
      </div>
      <div class="media-actions">
        <button onclick="editItem(${index})">Sửa</button>
        <button class="delete" onclick="deleteItem(${index})">Xóa</button>
      </div>
    </article>`;
  }).join(''):'<div class="empty">Không tìm thấy tệp phù hợp.</div>';
}

function openDialog(index=''){
  $('#media-form').reset();
  $('#edit-index').value=index;
  $('#dialog-title').textContent=index===''?'Thêm tệp':'Sửa tệp';

  if(index!==''){
    const item=mediaItems[Number(index)];
    $('#name').value=item.name||'';
    $('#type').value=item.type||'image';
    $('#path').value=item.path||'';
    $('#description').value=item.description||'';
    $('#object-slug').value=item.objectSlug||'';
    $('#keywords').value=(item.keywords||[]).join(', ');
    $('#preview-url').value=item.previewUrl||'';
  }

  $('#media-dialog').showModal();
}

function saveItem(){
  const name=$('#name').value.trim();
  const path=$('#path').value.trim();

  if(!name||!path){
    alert('Vui lòng nhập tên hiển thị và đường dẫn tệp.');
    return;
  }

  const index=$('#edit-index').value;
  const old=index!==''?mediaItems[Number(index)]:null;
  const item={
    id:old?.id||`media-${Date.now()}`,
    name,
    type:$('#type').value,
    path,
    description:$('#description').value.trim(),
    objectSlug:$('#object-slug').value.trim(),
    keywords:$('#keywords').value.split(',').map(x=>x.trim()).filter(Boolean),
    previewUrl:$('#preview-url').value.trim(),
    updated:new Date().toISOString().slice(0,10)
  };

  if(index==='') mediaItems.push(item);
  else mediaItems[Number(index)]=item;

  saveLocal();
  $('#media-dialog').close();
  render();
}

window.editItem=index=>openDialog(index);

window.deleteItem=index=>{
  if(!confirm(`Xóa tệp “${mediaItems[index].name}”?`)) return;
  mediaItems.splice(index,1);
  saveLocal();
  render();
};

function exportJSON(){
  const data={
    version:'5.4',
    updated:new Date().toISOString().slice(0,10),
    items:mediaItems
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='media.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result);
      mediaItems=Array.isArray(parsed)?parsed:(parsed.items||[]);
      saveLocal();
      render();
      alert('Đã nhập danh mục tệp.');
    }catch(e){
      alert(`Không thể nhập file: ${e.message}`);
    }
  };
  reader.readAsText(file,'utf-8');
}

document.addEventListener('DOMContentLoaded',()=>{
  mediaItems=loadLocal();
  saveLocal();
  render();

  document.querySelectorAll('.filter[data-type]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter[data-type]').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    activeType=btn.dataset.type;
    render();
  }));

  $('#btn-new').addEventListener('click',()=>openDialog(''));
  $('#btn-save').addEventListener('click',e=>{e.preventDefault();saveItem()});
  $('#btn-export').addEventListener('click',exportJSON);
  $('#btn-import').addEventListener('click',()=>$('#import-file').click());
  $('#import-file').addEventListener('change',e=>e.target.files[0]&&importJSON(e.target.files[0]));
  $('#search').addEventListener('input',render);
  $('#sort').addEventListener('change',render);
});
