const TYPE_FOLDER={animal:"animals",plant:"plants",aquaculture:"aquaculture",standard:"standards"};
let objectData=null;
let knowledgeIndex=null;

const fileInput=document.querySelector("#object-file");
const typeSelect=document.querySelector("#knowledge-type");
const target=document.querySelector("#target-folder");
const preview=document.querySelector("#preview");
const btnObject=document.querySelector("#btn-object");
const btnIndex=document.querySelector("#btn-index");

function slugify(text=""){
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/đ/g,"d").replace(/Đ/g,"D").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}

function inferType(category=""){
  if(category==="trong-trot") return "plant";
  if(category==="thuy-san") return "aquaculture";
  if(category==="vietgap"||category==="ocop") return "standard";
  return "animal";
}

function updateFolder(){
  target.value=`knowledge/${TYPE_FOLDER[typeSelect.value]}/`;
}

function escapeHTML(v=""){
  return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

function buildIndex(){
  const raw=localStorage.getItem("agri_publisher_index_v3_1");
  const items=raw?JSON.parse(raw):[];
  const type=typeSelect.value;
  const slug=objectData.slug||slugify(objectData.name);
  const item={
    id:objectData.id||`object-${slug}`,
    slug,
    name:objectData.name,
    icon:objectData.icon||"📚",
    category:objectData.category||"",
    knowledgeType:type,
    summary:objectData.summary||"",
    path:`knowledge/${TYPE_FOLDER[type]}/${slug}.json`
  };
  const pos=items.findIndex(x=>x.slug===slug);
  if(pos>=0) items[pos]=item; else items.push(item);
  localStorage.setItem("agri_publisher_index_v3_1",JSON.stringify(items));
  knowledgeIndex={version:"3.1",updated:new Date().toISOString().slice(0,10),items};
}

function prepare(){
  if(!objectData) return;
  const type=typeSelect.value;
  objectData.slug=objectData.slug||slugify(objectData.name);
  objectData.id=objectData.id||`object-${objectData.slug}`;
  objectData.knowledgeType=type;
  objectData.version="3.1";
  objectData.status=objectData.status||"published";
  objectData.updated=new Date().toISOString().slice(0,10);
  updateFolder();
  buildIndex();

  preview.classList.remove("empty");
  preview.innerHTML=`<h3>${escapeHTML(objectData.icon||"📚")} ${escapeHTML(objectData.name||"Chưa có tên")}</h3>
    <p><strong>File:</strong> ${escapeHTML(objectData.slug)}.json</p>
    <p><strong>Số mục:</strong> ${(objectData.sections||[]).length}</p>
    <p><strong>Đường dẫn:</strong> ${escapeHTML(target.value+objectData.slug+".json")}</p>`;
  btnObject.disabled=false;
  btnIndex.disabled=false;
}

function downloadJSON(data,name){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=name;a.click();
  URL.revokeObjectURL(url);
}

fileInput.addEventListener("change",()=>{
  const file=fileInput.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      objectData=JSON.parse(reader.result);
      typeSelect.value=objectData.knowledgeType||inferType(objectData.category);
      prepare();
    }catch(e){
      alert("File JSON không hợp lệ: "+e.message);
    }
  };
  reader.readAsText(file,"utf-8");
});

typeSelect.addEventListener("change",prepare);
btnObject.addEventListener("click",()=>downloadJSON(objectData,`${objectData.slug}.json`));
btnIndex.addEventListener("click",()=>downloadJSON(knowledgeIndex,"knowledge.json"));
updateFolder();