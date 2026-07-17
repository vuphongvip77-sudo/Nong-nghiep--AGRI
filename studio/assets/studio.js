
const STORAGE_KEY = 'agri_studio_articles_v1';
const CATEGORY_LABELS = {
  'trong-trot':'Trồng trọt',
  'chan-nuoi':'Chăn nuôi',
  'thuy-san':'Thủy sản',
  'vietgap':'VietGAP',
  'ocop':'OCOP'
};
let articles = [];

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function slugify(text=''){
  return text.normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}

function saveLocal(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

async function loadInitial(){
  const local = localStorage.getItem(STORAGE_KEY);
  if(local){
    articles = JSON.parse(local);
    return;
  }
  const response = await fetch('../data/articles.json');
  if(!response.ok) throw new Error('Không tải được data/articles.json');
  articles = await response.json();
  saveLocal();
}

function switchView(name){
  $$('.view').forEach(v=>v.classList.remove('active'));
  $$('.nav-item[data-view]').forEach(v=>v.classList.remove('active'));
  $(`#view-${name}`).classList.add('active');
  $(`.nav-item[data-view="${name}"]`)?.classList.add('active');
  if(name==='dashboard') renderDashboard();
  if(name==='list') renderList();
}

function renderDashboard(){
  $('#stat-total').textContent = articles.length;
  $('#stat-published').textContent = articles.filter(a=>a.status!=='draft').length;
  $('#stat-featured').textContent = articles.filter(a=>a.featured).length;
  $('#stat-draft').textContent = articles.filter(a=>a.status==='draft').length;
  const recent = [...articles].reverse().slice(0,5);
  $('#recent-list').innerHTML = recent.length
    ? recent.map((a,i)=>rowHTML(a, articles.length-1-i)).join('')
    : '<div class="empty">Chưa có bài viết.</div>';
}

function rowHTML(a,index){
  return `<article class="article-row">
    <div>
      <h3>${escapeHTML(a.title)}</h3>
      <p><span class="badge">${escapeHTML(a.categoryLabel || CATEGORY_LABELS[a.category] || a.category)}</span>
      <span class="badge">${a.status==='draft'?'Bản nháp':'Đã xuất bản'}</span>
      ${a.featured?'<span class="badge">Nổi bật</span>':''}</p>
    </div>
    <div class="row-actions">
      <button onclick="editArticle(${index})">Sửa</button>
      <button class="delete" onclick="deleteArticle(${index})">Xóa</button>
    </div>
  </article>`;
}

function renderList(){
  const q = $('#filter-text').value.trim().toLocaleLowerCase('vi');
  const cat = $('#filter-category').value;
  const filtered = articles.map((a,index)=>({a,index})).filter(({a})=>{
    const hay = [a.title,a.summary,...(a.keywords||[])].join(' ').toLocaleLowerCase('vi');
    return (!q || hay.includes(q)) && (!cat || a.category===cat);
  });
  $('#all-list').innerHTML = filtered.length
    ? filtered.map(({a,index})=>rowHTML(a,index)).join('')
    : '<div class="empty">Không tìm thấy bài phù hợp.</div>';
}

function addSection(data={}){
  const node = $('#section-template').content.cloneNode(true);
  node.querySelector('.section-heading').value = data.heading || '';
  let body = '';
  if(data.paragraphs) body += data.paragraphs.join('\n\n');
  if(data.items?.length){
    if(body) body += '\n\n';
    body += data.items.map(x=>`- ${x}`).join('\n');
  }
  node.querySelector('.section-body').value = body;
  node.querySelector('.remove-section').addEventListener('click',e=>{
    e.target.closest('.section-card').remove();
  });
  $('#sections').appendChild(node);
}

function parseSection(card){
  const heading = card.querySelector('.section-heading').value.trim();
  const raw = card.querySelector('.section-body').value.trim();
  const paragraphs = [];
  const items = [];
  raw.split(/\n\s*\n/).forEach(block=>{
    const lines = block.split('\n').map(x=>x.trim()).filter(Boolean);
    if(lines.length && lines.every(x=>x.startsWith('- '))){
      lines.forEach(x=>items.push(x.slice(2).trim()));
    }else if(lines.length){
      const normal = lines.filter(x=>!x.startsWith('- ')).join(' ');
      if(normal) paragraphs.push(normal);
      lines.filter(x=>x.startsWith('- ')).forEach(x=>items.push(x.slice(2).trim()));
    }
  });
  const result = {heading};
  if(paragraphs.length) result.paragraphs = paragraphs;
  if(items.length) result.items = items;
  return result;
}

function formData(){
  const title = $('#title').value.trim();
  const category = $('#category').value;
  const index = $('#edit-index').value;
  const old = index!=='' ? articles[Number(index)] : null;
  return {
    id: old?.id || slugify(title),
    type:'guide',
    category,
    categoryLabel:CATEGORY_LABELS[category],
    featured:$('#featured').checked,
    status:$('#status').value,
    title,
    summary:$('#summary').value.trim(),
    keywords:$('#keywords').value.split(',').map(x=>x.trim()).filter(Boolean),
    updated:new Date().toISOString().slice(0,10),
    entityIds:old?.entityIds || [],
    related:old?.related || [],
    sections:$$('.section-card').map(parseSection).filter(s=>s.heading || s.paragraphs?.length || s.items?.length)
  };
}

function resetForm(){
  $('#article-form').reset();
  $('#edit-index').value='';
  $('#sections').innerHTML='';
  $('#editor-title').textContent='Thêm bài viết';
  addSection();
}

window.editArticle = function(index){
  const a = articles[index];
  switchView('editor');
  $('#edit-index').value=index;
  $('#editor-title').textContent='Sửa bài viết';
  $('#title').value=a.title||'';
  $('#category').value=a.category||'chan-nuoi';
  $('#status').value=a.status||'published';
  $('#summary').value=a.summary||'';
  $('#keywords').value=(a.keywords||[]).join(', ');
  $('#featured').checked=Boolean(a.featured);
  $('#sections').innerHTML='';
  (a.sections||[]).forEach(addSection);
  if(!(a.sections||[]).length) addSection();
  window.scrollTo({top:0,behavior:'smooth'});
};

window.deleteArticle = function(index){
  if(!confirm(`Xóa bài “${articles[index].title}”?`)) return;
  articles.splice(index,1);
  saveLocal();
  renderDashboard();
  renderList();
};

function escapeHTML(value=''){
  return value.replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}

function preview(){
  const a=formData();
  $('#preview-content').innerHTML=`
    <h1>${escapeHTML(a.title||'Chưa có tiêu đề')}</h1>
    <p>${escapeHTML(a.summary||'')}</p>
    ${a.sections.map(s=>`<section>
      <h2>${escapeHTML(s.heading||'')}</h2>
      ${(s.paragraphs||[]).map(p=>`<p>${escapeHTML(p)}</p>`).join('')}
      ${s.items?.length?`<ul>${s.items.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul>`:''}
    </section>`).join('')}`;
  $('#preview-dialog').showModal();
}

function exportJSON(){
  const blob = new Blob([JSON.stringify(articles,null,2)],{type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url;
  a.download='articles.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file){
  const reader = new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result);
      if(!Array.isArray(parsed)) throw new Error('File JSON phải là danh sách bài viết.');
      articles=parsed;
      saveLocal();
      renderDashboard();
      renderList();
      alert('Đã nhập dữ liệu thành công.');
    }catch(error){
      alert(`Không thể nhập file: ${error.message}`);
    }
  };
  reader.readAsText(file,'utf-8');
}

document.addEventListener('DOMContentLoaded', async()=>{
  try{
    await loadInitial();
  }catch(error){
    alert(error.message);
    articles=[];
  }

  $$('.nav-item[data-view]').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view)));
  $$('[data-open-editor]').forEach(btn=>btn.addEventListener('click',()=>{resetForm();switchView('editor')}));
  $('#btn-add-section').addEventListener('click',()=>addSection());
  $('#btn-reset').addEventListener('click',resetForm);
  $('#btn-preview').addEventListener('click',preview);
  $('#close-preview').addEventListener('click',()=>$('#preview-dialog').close());
  $('#btn-export').addEventListener('click',exportJSON);
  $('#btn-import').addEventListener('click',()=>$('#file-import').click());
  $('#file-import').addEventListener('change',e=>e.target.files[0]&&importJSON(e.target.files[0]));
  $('#filter-text').addEventListener('input',renderList);
  $('#filter-category').addEventListener('change',renderList);

  $('#article-form').addEventListener('submit',e=>{
    e.preventDefault();
    const a=formData();
    if(!a.title || !a.summary){
      alert('Vui lòng nhập tiêu đề và mô tả ngắn.');
      return;
    }
    const index=$('#edit-index').value;
    if(index==='') articles.push(a);
    else articles[Number(index)]=a;
    saveLocal();
    alert('Đã lưu bài viết trong trình duyệt. Khi hoàn tất, hãy xuất articles.json.');
    resetForm();
    switchView('list');
  });

  resetForm();
  renderDashboard();
});
