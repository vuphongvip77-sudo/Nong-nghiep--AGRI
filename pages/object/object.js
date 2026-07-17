
const params = new URLSearchParams(location.search);
const slug = params.get('slug') || 'ga-sao';

function esc(v=''){
  return v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

async function loadObject(){
  const response = await fetch(`../../data/objects/${encodeURIComponent(slug)}.json`);
  if(!response.ok) throw new Error('Không tải được dữ liệu đối tượng.');
  return response.json();
}

function render(data){
  document.title = `${data.name} | AGRI`;
  document.querySelector('#object-header').innerHTML = `
    <div class="object-title">
      <div class="icon">${esc(data.icon || '📚')}</div>
      <div>
        <h1>${esc(data.name)}</h1>
        <p class="lead">${esc(data.summary || '')}</p>
        <div class="object-meta">Cập nhật: ${esc(data.updated || '')}</div>
      </div>
    </div>`;

  document.querySelector('#object-nav').innerHTML = data.sections.map((s,i)=>`
    <a href="#${esc(s.id)}" class="${i===0?'active':''}">
      <span>${esc(s.icon || '•')}</span><span>${esc(s.title)}</span>
    </a>`).join('');

  document.querySelector('#object-content').innerHTML = data.sections.map(s=>`
    <section class="object-section" id="${esc(s.id)}">
      <h2><span>${esc(s.icon || '•')}</span>${esc(s.title)}</h2>
      ${(s.content || []).map(p=>`<p>${esc(p)}</p>`).join('')}
      ${(s.items || []).length ? `<ul>${s.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    </section>`).join('');

  const links = [...document.querySelectorAll('#object-nav a')];
  const sections = [...document.querySelectorAll('.object-section')];
  const observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${entry.target.id}`));
      }
    });
  },{rootMargin:'-25% 0px -65% 0px'});
  sections.forEach(s=>observer.observe(s));
}

loadObject().then(render).catch(error=>{
  document.querySelector('#object-content').innerHTML = `<div class="empty-state">${esc(error.message)}</div>`;
});
