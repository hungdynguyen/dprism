/* Named case entry and a searchable, paginated frontend template catalog. */
Object.assign(state,{creationSessions:[],creationSession:null,templateQuery:'',templateCategory:'all',templateSort:'default',templatePage:1});
const TEMPLATE_PAGE_SIZE=6;
const catalogExamples=[
  ['prompt-review','Rà soát Prompt Injection','Bảo mật','Kiểm tra ranh giới chỉ dẫn, nội dung không tin cậy và phương án phòng vệ.',['safety','security'],'Danh sách đường tấn công, bằng chứng và kiểm soát cần bổ sung.'],
  ['data-review','Đánh giá quyền riêng tư dữ liệu','Tuân thủ','Đối chiếu mục đích xử lý, quyền truy cập, lưu giữ và xóa dữ liệu.',['legal','safety'],'Bảng khoảng trống chính sách dữ liệu và khuyến nghị xử lý.'],
  ['tool-permissions','Kiểm tra phân quyền công cụ','Bảo mật','Đánh giá service account, quyền người dùng và ranh giới thực thi.',['security','operations'],'Ma trận quyền, tình huống vượt quyền và phương án kiểm soát.'],
  ['operational-readiness','Sẵn sàng vận hành trước pilot','Vận hành','Rà soát logging, xử lý sự cố, giới hạn tác động và trách nhiệm vận hành.',['operations','security'],'Checklist trước pilot cùng các hành động ưu tiên.'],
  ['model-governance','Rà soát quản trị mô hình AI','Quản trị AI','Đánh giá các giả định mô hình, giám sát, bằng chứng và phạm vi sử dụng.',['safety','legal'],'Các điều kiện sử dụng mô hình và kế hoạch theo dõi.'],
  ['implementation-options','Lựa chọn phương án kiểm soát','Ra quyết định','So sánh tác động, tính khả thi và trade-off của các phương án giảm thiểu.',['operations','safety'],'Ma trận phương án, khuyến nghị và các quan điểm khác nhau.']
];
for(const [id,title,category,description,primaries,output] of catalogExamples){
  if(templates.some(t=>t.id===id))continue;
  templates.push({id,title,category,description,tag:category,icon:category==='Bảo mật'?'shield':'plan',steps:3,output,version:'1.0',definition:[
    {id:'C1',title:'Đánh giá '+title.toLowerCase(),depends:[],experts:primaries,rounds:2,budget:14000,docs:category==='Tuân thủ'?['D3']:['D2'],instruction:description,output:'Phát hiện độc lập, dẫn nguồn và giới hạn nhận định.'},
    {id:'C2',title:'Đối chiếu bằng chứng & phương án',depends:['C1'],experts:primaries,rounds:1,budget:12000,docs:category==='Tuân thủ'?['D3']:['D2'],instruction:'Dựa trên brief C1, kiểm tra các giả định và ghi nhận các phương án xử lý.',output:'Các luận điểm đã đối chiếu và bất đồng còn mở.'},
    {id:'C3',title:'Tổng hợp kết quả',depends:['C2'],experts:['synthesizer'],rounds:0,budget:8000,docs:[],instruction:'Tổng hợp kết quả đã hoàn thành và giữ nguyên bất đồng.',output}
  ]});
}
function normalizeCatalogText(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();}
function templateCategory(template){return template.category||({'Risk assessment':'Thẩm định rủi ro','Decision support':'Ra quyết định',Custom:'Template của tôi'}[template.tag])||template.tag||'Khác';}
function matchingTemplates(){
  const words=normalizeCatalogText(state.templateQuery).trim().split(/\s+/).filter(Boolean);
  const result=templates.filter(t=>(state.templateCategory==='all'||templateCategory(t)===state.templateCategory)&&words.every(word=>normalizeCatalogText([t.title,t.description,t.output,t.tag,templateCategory(t)].join(' ')).includes(word)));
  if(state.templateSort==='name')result.sort((a,b)=>a.title.localeCompare(b.title,'vi'));
  return result;
}
function pendingCreationRows(query){return state.creationSessions.filter(c=>c.status==='pending'&&normalizeCatalogText(c.title).includes(normalizeCatalogText(query))).map(c=>`<article class="case-list-row"><div class="case-row-icon">${ico('file')}</div><div class="case-row-title"><h3>${esc(c.title)}</h3><p>Chọn cách bắt đầu để tiếp tục chuẩn bị.</p></div><span class="case-kind">Chưa chọn hình thức</span>${badge('Bản nháp')}${btn('Tiếp tục '+ico('arrow'),'resume-creation','small',`data-id="${c.id}"`)}</article>`).join('');}
function openCaseNameModal(rename=false){
  const current=rename?state.creationSession:null;
  openModal(rename?'Đổi tên case':'Tạo case mới','Đặt tên để dễ tìm lại trong lịch sử. Bạn sẽ chọn cách bắt đầu ở màn hình tiếp theo.',`<form id="case-name-form" data-rename="${rename?'true':'false'}"><label class="label" for="new-case-name">Tên case <span class="required">*</span></label><input id="new-case-name" name="caseName" maxlength="120" required value="${esc(current?.title||'')}" placeholder="Ví dụ: Thẩm định AutoSupport trước pilot" autocomplete="off" aria-describedby="case-name-help"><p id="case-name-help" class="helper-text">Có thể đổi tên sau. Chưa có plan hoặc expert nào được chạy.</p><p id="case-name-error" class="field-error" role="alert"></p><div class="wizard-foot">${btn('Hủy','close-modal')}<button type="submit" class="btn primary">${rename?'Lưu tên':'Tiếp tục '+ico('arrow')}</button></div></form>`);
}
function submitCaseName(rawName,rename=false){
  const title=String(rawName||'').trim();if(!title)return false;
  if(rename&&state.creationSession){
    state.creationSession.title=title;
    const draft=state.drafts.find(d=>d.id===state.creationSession.draftId);if(draft)draft.title=title;
    if(state.activeDraftId===state.creationSession.draftId)state.title=title;
    const chat=state.chats.find(c=>c.id===state.creationSession.chatId);if(chat)chat.title=title;
  }else{
    saveActiveDraft();state.creationSession={id:'case-'+Date.now().toString(36)+'-'+state.creationSessions.length,title,references:state.pendingContextCases.slice(),status:'pending'};state.pendingContextCases=[];state.creationSessions.push(state.creationSession);
    state.templateQuery='';state.templateCategory='all';state.templatePage=1;
  }
  closeModal();go('templates');return true;
}
const createDraftBeforeNaming=startNew;
startNew=function(mode,templateId){
  const creation=state.creationSession,existing=creation&&state.drafts.find(d=>d.id===creation.draftId);
  if(existing){
    resumeCaseDraft(existing.id);state.mode=mode;state.wizard=mode==='template'?4:1;state.undoPlan=null;state.showValidation=false;state.validation='';state.validationErrors=[];
    if(templateId){applyTemplate(templateId);state.planGenerated=true;if(!templates.find(t=>t.id===templateId)?.definition)state.steps.forEach(s=>s.docs=s.docs.filter(id=>id!=='D1'));}
    else if(state.templateId){state.steps=[];state.templateId=null;state.planGenerated=false;}
    state.dagView.auto=true;saveActiveDraft();go('setup');return;
  }
  createDraftBeforeNaming(mode,templateId);
  if(creation){state.title=creation.title;state.selectedCases=[...new Set([...state.selectedCases,...creation.references])];creation.draftId=state.activeDraftId;creation.status='configured';saveActiveDraft();render();}
};
const saveDraftBeforeNaming=saveActiveDraft;
saveActiveDraft=function(){saveDraftBeforeNaming();const creation=state.creationSessions?.find(c=>c.draftId===state.activeDraftId);if(creation&&state.hasDraft)creation.title=state.title;};
const resumeDraftBeforeNaming=resumeCaseDraft;
resumeCaseDraft=function(id){state.creationSession=state.creationSessions.find(c=>c.draftId===id)||null;resumeDraftBeforeNaming(id);};
const beginChatBeforeNaming=beginDirectChat;
beginDirectChat=function(id,returnPage){beginChatBeforeNaming(id,returnPage);if(returnPage==='templates'&&state.creationSession&&currentDirectChat()?.expert.id===id){const creation=state.creationSession,chat=currentDirectChat();chat.title=creation.title;chat.namedCase=true;chat.creationId=creation.id;creation.chatId=chat.id;creation.status='configured';render();}};
renderTemplates=function(){
  const creation=state.creationSession,all=matchingTemplates(),pageCount=Math.max(1,Math.ceil(all.length/TEMPLATE_PAGE_SIZE));state.templatePage=Math.min(state.templatePage,pageCount);
  const first=(state.templatePage-1)*TEMPLATE_PAGE_SIZE,items=all.slice(first,first+TEMPLATE_PAGE_SIZE),categories=[...new Set(templates.map(templateCategory))];
  const methods=[['template','Theo template','Dùng quy trình có sẵn, điều chỉnh rồi chạy.','plan','Xem thư viện template'],['open','Thảo luận theo chủ đề','Nhiều expert cùng giải quyết vấn đề qua bốn bước chuẩn bị.','graph','Bắt đầu theo chủ đề'],['direct','Trực tiếp trao đổi','Chat với đúng một expert, không cần thiết lập plan.','chat','Chọn một expert']];
  return `${backButton('cases','Quay lại Cases')}<header class="new-case-heading"><div><div class="eyebrow">Case mới</div><h1>${esc(creation?.title||'Chọn cách bắt đầu')}</h1><p>Cùng một mục tiêu, ba cách làm việc với chuyên gia.</p></div>${btn(ico('edit')+' '+(creation?'Đổi tên':'Đặt tên case'),creation?'rename-creation':'new-case','small')}</header><section class="case-methods" aria-label="Ba cách bắt đầu">${methods.map(([id,title,description,icon,cta])=>`<button class="case-method ${id==='template'?'selected':''}" data-action="choose-case-method" data-method="${id}"><span class="case-method-icon">${ico(icon)}</span><h2>${title}</h2><p>${description}</p><span class="case-method-cta">${cta} ${ico('arrow')}</span></button>`).join('')}</section><section class="template-catalog" id="template-library" aria-labelledby="template-library-title"><div class="template-library-heading"><div><h2 id="template-library-title">Thư viện template</h2><p>Quy trình có sẵn để chọn, điều chỉnh và tái sử dụng.</p></div><span class="catalog-demo-label">Dữ liệu mẫu frontend</span></div><div class="template-search-tools"><div class="template-search-field"><label class="label" for="template-search">Tìm template</label><div class="search-box">${ico('search')}<input id="template-search" data-template-query value="${esc(state.templateQuery)}" placeholder="Tên, lĩnh vực hoặc đầu ra…" autocomplete="off"></div></div><label><span class="label">Lĩnh vực</span><select id="template-category" data-template-category><option value="all">Tất cả lĩnh vực</option>${categories.map(c=>`<option value="${esc(c)}" ${state.templateCategory===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label><label><span class="label">Sắp xếp</span><select id="template-sort" data-template-sort><option value="default" ${state.templateSort==='default'?'selected':''}>Mặc định</option><option value="name" ${state.templateSort==='name'?'selected':''}>Tên A–Z</option></select></label></div><div class="template-result-status" role="status"><span>${all.length?`${first+1}–${Math.min(first+TEMPLATE_PAGE_SIZE,all.length)} trong ${all.length} template`:'Không tìm thấy template phù hợp'}</span>${state.templateQuery||state.templateCategory!=='all'?'<button class="text-button" data-action="clear-template-filters">Xóa bộ lọc</button>':''}</div><div class="catalog-template-grid">${items.map(t=>{const steps=t.definition||(t.id==='ai-risk'?templateSteps():null),expertCount=steps?new Set(steps.flatMap(s=>s.experts)).size:4;return `<button class="catalog-template" data-action="use-template" data-id="${t.id}"><div class="catalog-template-top"><span>${ico(t.icon)}</span>${badge(templateCategory(t))}</div><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p><div class="catalog-template-meta"><span>${t.steps} tasks</span><span>${expertCount} experts</span><span>v${esc(t.version||'1.0')}</span></div><div class="catalog-template-output"><strong>Đầu ra</strong><span>${esc(t.output)}</span></div><div class="catalog-template-footer"><span>Dùng template</span>${ico('arrow')}</div></button>`;}).join('')||'<div class="template-catalog-empty"><h3>Chưa có template phù hợp</h3><p>Thử từ khóa khác hoặc bỏ bộ lọc lĩnh vực.</p><button class="btn" data-action="clear-template-filters">Xóa bộ lọc</button></div>'}</div>${pageCount>1?`<nav class="template-pagination" aria-label="Trang template">${btn(ico('back'),'template-page','small',`data-page="${state.templatePage-1}" aria-label="Trang trước" ${state.templatePage===1?'disabled':''}`)}${Array.from({length:pageCount},(_,i)=>`<button class="btn small ${state.templatePage===i+1?'subtle':''}" data-action="template-page" data-page="${i+1}" ${state.templatePage===i+1?'aria-current="page"':''}>${i+1}</button>`).join('')}${btn(ico('arrow'),'template-page','small',`data-page="${state.templatePage+1}" aria-label="Trang tiếp" ${state.templatePage===pageCount?'disabled':''}`)}</nav>`:''}</section>`;
};
const casesBeforeCreation=renderCases;
renderCases=function(){let html=casesBeforeCreation().replaceAll('data-action="navigate" data-page="templates"','data-action="new-case"');const count=state.sessions.length+state.drafts.length+state.creationSessions.filter(c=>c.status==='pending').length;html=html.replace(/(Case của tôi <span class="tab-count">)\d+(<\/span>)/,(_,start,end)=>start+count+end);if(state.caseTab==='mine'){const pending=pendingCreationRows(state.caseQuery);if(pending)html=html.replace('<section class="case-list">','<section class="case-list">'+pending).replace(/<div class="case-empty">[\s\S]*?<\/div>/,'');}return html;};
function handleCaseCreationAction(button){
  const action=button.dataset.action;
  if(action==='resume-direct-chat'||action==='direct-chat'){
    const chat=action==='resume-direct-chat'?state.chats.find(c=>c.id===button.dataset.id):[...state.chats].reverse().find(c=>c.expert.id===button.dataset.id);
    if(chat)state.creationSession=state.creationSessions.find(c=>c.id===chat.creationId)||null;
  }
  if(action==='new-case'){openCaseNameModal();return true;}
  if(action==='rename-creation'){openCaseNameModal(true);return true;}
  if(action==='resume-creation'){state.creationSession=state.creationSessions.find(c=>c.id===button.dataset.id);go('templates');return true;}
  if(action==='choose-case-method'){
    if(!state.creationSession){openCaseNameModal();return true;}
    if(button.dataset.method==='template'){$('#template-library')?.scrollIntoView?.({behavior:'smooth',block:'start'});$('#template-search')?.focus?.({preventScroll:true});}
    if(button.dataset.method==='open')startNew('open');
    if(button.dataset.method==='direct'){state.chatReturn='templates';state.directExpertId=null;state.directExpertQuery='';state.directExpertDomain='all';go('direct-picker');}
    return true;
  }
  if(action==='use-template'&&!state.creationSession){openCaseNameModal();return true;}
  if(action==='begin-direct-chat'&&state.chatReturn==='templates'&&state.creationSession){beginDirectChat(state.directExpertId,'templates');return true;}
  if(action==='clear-template-filters'){state.templateQuery='';state.templateCategory='all';state.templatePage=1;render();return true;}
  if(action==='template-page'){state.templatePage=Number(button.dataset.page);render();$('#template-library')?.scrollIntoView?.({block:'start',behavior:'smooth'});return true;}
  return false;
}
document.addEventListener('submit',event=>{
  if(event.target.id!=='case-name-form')return;event.preventDefault();
  const input=$('#new-case-name'),title=input.value.trim();if(!title){input.setAttribute('aria-invalid','true');$('#case-name-error').textContent='Nhập tên case trước khi tiếp tục.';input.focus();return;}
  submitCaseName(title,event.target.dataset.rename==='true');
});
document.addEventListener('input',event=>{if(event.target.hasAttribute('data-template-query')){state.templateQuery=event.target.value;state.templatePage=1;render();}if(event.target.id==='new-case-name'){event.target.removeAttribute('aria-invalid');$('#case-name-error').textContent='';}});
document.addEventListener('change',event=>{if(event.target.hasAttribute('data-template-category')){state.templateCategory=event.target.value;state.templatePage=1;render();}if(event.target.hasAttribute('data-template-sort')){state.templateSort=event.target.value;state.templatePage=1;render();}});
render();
