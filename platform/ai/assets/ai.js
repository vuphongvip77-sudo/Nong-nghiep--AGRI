\
const HISTORY_KEY='agri_ai_history_v6';
let indexItems=[];

const $=s=>document.querySelector(s);

function esc(v=''){
  return String(v).replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}

function normalize(v=''){
  return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}

async function safeFetch(path){
  try{
    const r=await fetch(path);
    if(!r.ok) return null;
    return await r.json();
  }catch(e){return null}
}

async function buildIndex(){
  const knowledge=await safeFetch('../../knowledge/index/knowledge.json');
  const docs=await safeFetch('../../documents/index/documents.json');
  const media=await safeFetch('../../media/index/media.json');
  const rows=[];

  for(const item of (knowledge?.items||[])){
    const obj=await safeFetch(`../../${item.path}`);
    rows.push({
      type:'knowledge',
      title:item.name,
      text:item.summary||'',
      icon:item.icon||'📚',
      url:`../../pages/knowledge/?path=${encodeURIComponent(item.path)}`
    });

    for(const section of (obj?.sections||[])){
      const text=[...(section.content||[]),...(section.items||[])].join(' ');
      rows.push({
        type:'section',
        title:`${item.name} — ${section.title}`,
        text,
        icon:section.icon||'📝',
        url:`../../pages/knowledge/?path=${encodeURIComponent(item.path)}#${encodeURIComponent(section.id)}`
      });
    }
  }

  const localDocs=JSON.parse(localStorage.getItem('agri_documents_v5_5')||'[]');
  for(const doc of (localDocs.length?localDocs:(docs?.items||[]))){
    rows.push({
      type:'document',
      title:doc.name,
      text:[doc.description,doc.objectSlug,...(doc.keywords||[])].join(' '),
      icon:{pdf:'📕',word:'📄',excel:'📊',powerpoint:'📽'}[doc.type]||'📄',
      url:`../../${doc.path}`
    });
  }

  const localMedia=JSON.parse(localStorage.getItem('agri_media_v5_4')||'[]');
  for(const m of (localMedia.length?localMedia:(media?.items||[]))){
    rows.push({
      type:'media',
      title:m.name,
      text:[m.description,m.objectSlug,...(m.keywords||[])].join(' '),
      icon:{image:'🖼',video:'🎥'}[m.type]||'📁',
      url:`../../${m.path}`
    });
  }

  indexItems=rows.map(x=>({...x,haystack:normalize(`${x.title} ${x.text}`)}));
}

function rank(query){
  const words=normalize(query).split(/\s+/).filter(w=>w.length>1);
  return indexItems.map(item=>{
    let score=0;
    const title=normalize(item.title);
    words.forEach(w=>{
      if(title.includes(w)) score+=8;
      if(item.haystack.includes(w)) score+=3;
    });
    return {...item,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6);
}

function summarize(results,question){
  if(!results.length){
    return {
      text:'Tôi chưa tìm thấy nội dung phù hợp trong kho dữ liệu AGRI hiện tại. Anh nên bổ sung thêm dữ liệu hoặc hỏi theo cách cụ thể hơn.',
      note:'Kết quả này chỉ dựa trên dữ liệu đã có trong AGRI.'
    };
  }

  const excerpts=results
    .filter(x=>x.text)
    .slice(0,3)
    .map(x=>x.text.trim())
    .filter(Boolean);

  let answer='Tôi tìm thấy các nội dung liên quan trong AGRI. ';
  if(excerpts.length){
    answer+=excerpts.join(' ').slice(0,900);
  }else{
    answer+='Anh có thể mở các nguồn bên dưới để xem chi tiết.';
  }

  return {
    text:answer,
    note:'Đây là phần tổng hợp tự động từ dữ liệu nội bộ, không phải chẩn đoán chuyên môn.'
  };
}

function addMessage(role,html){
  const article=document.createElement('article');
  article.className=`message ${role}`;
  article.innerHTML=role==='user'
    ? `<div class="bubble">${html}</div><div class="avatar">👤</div>`
    : `<div class="avatar">🤖</div><div class="bubble">${html}</div>`;
  $('#chat-log').appendChild(article);
  $('#chat-log').scrollTop=$('#chat-log').scrollHeight;
}

function saveHistory(){
  localStorage.setItem(HISTORY_KEY,$('#chat-log').innerHTML);
}

function loadHistory(){
  const raw=localStorage.getItem(HISTORY_KEY);
  if(raw) $('#chat-log').innerHTML=raw;
}

async function ask(question){
  const q=question.trim();
  if(!q) return;

  addMessage('user',`<p>${esc(q)}</p>`);
  $('#question').value='';
  $('#status').textContent='Đang tra cứu dữ liệu...';

  const typing=document.createElement('article');
  typing.className='message assistant';
  typing.id='typing';
  typing.innerHTML='<div class="avatar">🤖</div><div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
  $('#chat-log').appendChild(typing);

  await new Promise(r=>setTimeout(r,450));
  const results=rank(q);
  const summary=summarize(results,q);
  typing.remove();

  const sources=results.map(x=>`
    <a class="source-card" href="${esc(x.url)}" target="_blank">
      <strong>${esc(x.icon)} ${esc(x.title)}</strong>
      <small>${esc(x.type)}</small>
    </a>`).join('');

  addMessage('assistant',`
    <p>${esc(summary.text)}</p>
    ${sources?`<div class="sources"><strong>Nguồn liên quan</strong>${sources}</div>`:''}
    <div class="answer-note">${esc(summary.note)}</div>
  `);

  $('#status').textContent=`Đã tìm thấy ${results.length} nguồn liên quan`;
  saveHistory();
}

document.addEventListener('DOMContentLoaded',async()=>{
  loadHistory();
  await buildIndex();

  $('#btn-send').addEventListener('click',()=>ask($('#question').value));
  $('#question').addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){
      e.preventDefault();
      ask($('#question').value);
    }
  });

  document.querySelectorAll('.suggestion-btn').forEach(btn=>btn.addEventListener('click',()=>ask(btn.textContent.replace(/^[^ ]+\s/,''))));

  $('#btn-clear').addEventListener('click',()=>{
    localStorage.removeItem(HISTORY_KEY);
    location.reload();
  });
});
