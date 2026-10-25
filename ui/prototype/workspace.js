/* UX refinement for the frontend prototype. Drafts remain in memory only. */
const demoCaseInput=clone({title:state.title,star:state.star,discussionDocs:state.discussionDocs});
Object.assign(state,{drafts:[],activeDraftId:null,planGenerated:false,sampleCase:false,expertEdits:{},pendingContextCases:[],validationErrors:[],showValidation:false,workspaceTab:'graph',boardTab:'graph',undoPlan:null});
const draftFields=['mode','wizard','templateId','title','star','output','steps','selectedStep','selectedCases','discussionDocs','planGenerated','sampleCase','undoPlan'];
function saveActiveDraft(){
  if(!state.activeDraftId||!state.hasDraft)return;
  const index=state.drafts.findIndex(d=>d.id===state.activeDraftId);if(index<0)return;
  const data={id:state.activeDraftId,updatedAt:Date.now()};for(const key of draftFields)data[key]=clone(state[key]);state.drafts[index]=data;
}
function saveExpertEdit(){if(state.page==='expert'&&state.expertEditing&&state.expertDraft)state.expertEdits[state.expertId||'new']=clone(state.expertDraft);}
function visibleDocuments(){const linked=new Set([...state.discussionDocs,...state.steps.flatMap(s=>s.docs)]);return documents.filter(d=>d.kind==='Tài liệu nội bộ'||linked.has(d.id));}
function resumeCaseDraft(id){
  saveActiveDraft();const draft=state.drafts.find(d=>d.id===id);if(!draft){toast('Bản nháp không còn trong phiên này.');go('cases');return;}
  for(const key of draftFields)state[key]=clone(draft[key]);state.activeDraftId=id;state.hasDraft=true;state.validation='';state.showValidation=false;state.validationErrors=[];state.dagView.auto=true;go('setup');
}
startNew=function(mode,templateId){
  saveActiveDraft();saveExpertEdit();
  const seed=state.pendingContextCases.slice();state.pendingContextCases=[];
  Object.assign(state,{mode,wizard:mode==='template'?4:1,templateId:null,title:'',star:{situation:'',task:'',action:'',result:''},output:'',steps:[],selectedStep:null,selectedCases:seed,discussionDocs:[],planGenerated:false,sampleCase:false,undoPlan:null,hasDraft:true,activeDraftId:'draft-'+Date.now().toString(36)+'-'+state.drafts.length,showValidation:false,validation:'',validationErrors:[],workspaceTab:'graph'});
  if(templateId){applyTemplate(templateId);state.planGenerated=true;if(!templates.find(t=>t.id===templateId)?.definition)for(const step of state.steps)step.docs=step.docs.filter(id=>id!=='D1');}
  state.drafts.push({id:state.activeDraftId});saveActiveDraft();state.dagView.auto=true;go('setup');
};
function discardStartedDraft(){state.drafts=state.drafts.filter(d=>d.id!==state.activeDraftId);state.activeDraftId=null;state.hasDraft=false;}
function generateOpenPlan(){const output=state.output;applyTemplate('ai-risk');state.output=output;state.templateId=null;for(const step of state.steps)step.docs=step.docs.filter(id=>id!=='D1');state.planGenerated=true;state.selectedStep=state.steps[0]?.id;state.dagView.auto=true;}
openExpert=function(id,editing=false){
  saveExpertEdit();state.expertId=id||null;state.expertEditing=editing||!id;
  state.expertDraft=clone(state.expertEditing&&state.expertEdits[id||'new']?state.expertEdits[id||'new']:id?expertById(id):{role:'',domain:'AI & Data',approach:'',prompt:'',skills:[]});go('expert');
};
function navSnapshot(){return {page:state.page,draftId:state.activeDraftId,wizard:state.wizard,expertId:state.expertId,expertEditing:state.expertEditing,runId:state.run?.id,chatId:state.chatId,dashboardView:state.dashboardView,chatReturn:state.chatReturn};}
function navHash(nav){return '#/'+nav.page+(nav.page==='setup'?'/'+nav.draftId+'/'+nav.wizard:nav.page==='expert'?'/'+(nav.expertId||'new')+'/'+(nav.expertEditing?'edit':'view'):['running','dashboard'].includes(nav.page)?'/'+nav.runId+(nav.page==='dashboard'?'/'+nav.dashboardView:''):nav.page==='chat'?'/'+nav.chatId:'');}
let restoringRoute=false,lastRoute=null;
function recordRoute(replace=false){
  if(restoringRoute)return;const nav=navSnapshot(),hash=navHash(nav);if(lastRoute===hash)return;
  const completing=lastRoute?.startsWith('#/running/')&&nav.page==='dashboard';
  history[replace||!lastRoute||completing?'replaceState':'pushState']({dprism:true,nav},'',hash);lastRoute=hash;
}
go=function(page){saveActiveDraft();saveExpertEdit();state.page=page;state.validation='';state.showValidation=false;state.validationErrors=[];render();window.scrollTo(0,0);};
window.addEventListener('popstate',event=>{
  saveActiveDraft();saveExpertEdit();const nav=event.state?.dprism?event.state.nav:{page:'home'};restoringRoute=true;
  if(nav.page==='setup'){
    const draft=state.drafts.find(d=>d.id===nav.draftId);
    if(draft){for(const key of draftFields)state[key]=clone(draft[key]);state.activeDraftId=draft.id;state.hasDraft=true;state.wizard=nav.wizard;state.page='setup';}else state.page='cases';
  }else if(nav.page==='expert'){
    state.expertId=nav.expertId||null;state.expertEditing=nav.expertEditing;state.expertDraft=clone(state.expertEditing&&state.expertEdits[nav.expertId||'new']?state.expertEdits[nav.expertId||'new']:nav.expertId?expertById(nav.expertId):{role:'',domain:'AI & Data',approach:'',prompt:'',skills:[]});state.page='expert';
  }else if(['running','dashboard'].includes(nav.page)){
    const run=state.sessions.find(r=>r.id===nav.runId);state.run=run||state.run;state.page=run?(run.status==='running'?'running':'dashboard'):'cases';state.dashboardView=nav.dashboardView||'map';
  }else{state.page=nav.page;state.chatId=nav.chatId||state.chatId;state.chatReturn=nav.chatReturn||state.chatReturn;}
  state.validation='';state.showValidation=false;state.validationErrors=[];state.dagView.auto=true;state.argumentView.auto=true;render();restoringRoute=false;lastRoute=location.hash||navHash(navSnapshot());
});
function caseErrors(){const inContext=state.mode==='open'&&state.wizard===1;return [
  !state.title.trim()?{field:'title',id:inContext?'discussion-title':'job-title',message:'Đặt tên cho case này.'}:null,
  !state.star.task.trim()?{field:'task',id:inContext?'star-task':'case-task',message:'Mô tả mục tiêu cần đánh giá hoặc quyết định.'}:null,
  !state.output.trim()?{field:'output',id:inContext?'initial-output':'plan-output',message:'Xác định đầu ra mong muốn.'}:null
].filter(Boolean);}
function planErrors(){
  const errors=caseErrors(),ids=new Set(state.steps.map(s=>s.id));
  if(!state.steps.length)errors.push({message:'Plan cần ít nhất một task.',id:'job-title'});
  for(const step of state.steps){
    const add=(field,id,message)=>errors.push({taskId:step.id,field,id,message:step.id+' · '+message});
    if(!step.title.trim())add('title','step-title','Nhập tên task.');
    if(!step.output.trim())add('output','step-output','Xác định đầu ra của task.');
    if(!step.experts.length)add('experts','task-experts','Chọn ít nhất một expert.');
    if(step.depends.some(id=>!ids.has(id)||id===step.id))add('depends','task-dependencies','Sửa liên kết phụ thuộc bị thiếu hoặc trỏ về chính task.');
    if(!Number.isInteger(step.rounds)||step.rounds<0||step.rounds>5||step.experts.length>1&&step.rounds<1)add('rounds','step-rounds','Số vòng từ 0–5; nhiều expert cần ít nhất 1 vòng.');
    if(!Number.isFinite(step.budget)||step.budget<100)add('budget','step-budget','Token budget cần ít nhất 100.');
  }
  if(state.steps.length&&topologicalSteps(state.steps).length!==state.steps.length&&!errors.some(e=>e.field==='depends'))errors.push({taskId:state.steps[0].id,field:'depends',id:'task-dependencies',message:'Phụ thuộc tạo thành chu trình; cần bỏ một liên kết.'});
  return errors;
}
validatePlan=function(){return planErrors()[0]?.message||'';};
function validateAndFocus(contextOnly=false){
  state.validationErrors=contextOnly?caseErrors():planErrors();state.showValidation=true;state.validation=state.validationErrors[0]?.message||'';
  if(!state.validationErrors.length)return true;
  const first=state.validationErrors[0];if(first.taskId)state.selectedStep=first.taskId;if(state.mode==='open'&&state.wizard===4)state.wizard=first.taskId?3:1;state.workspaceTab=first.taskId?'details':'info';render();requestAnimationFrame(()=>focusValidation(0));return false;
}
function focusValidation(index){const error=state.validationErrors[index];if(!error)return;if(error.taskId&&state.selectedStep!==error.taskId){state.selectedStep=error.taskId;state.workspaceTab='details';render();}const target=document.getElementById(error.id);if(target){target.scrollIntoView?.({block:'center',behavior:'smooth'});target.focus?.({preventScroll:true});}}
function errorSummary(){return state.showValidation&&state.validationErrors.length?`<section class="validation-summary" role="alert"><strong>Cần hoàn thiện ${state.validationErrors.length} mục</strong>${state.validationErrors.map((e,i)=>`<button data-action="focus-error" data-index="${i}">${esc(e.message)} ${ico('arrow')}</button>`).join('')}</section>`:'';}
function decorateFieldErrors(){
  if(!state.showValidation)return;
  for(const error of state.validationErrors){if(error.taskId&&error.taskId!==state.selectedStep)continue;const field=document.getElementById(error.id);if(!field)continue;field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby',error.id+'-error');if(!document.getElementById(error.id+'-error'))field.insertAdjacentHTML?.('afterend',`<p class="field-error" id="${error.id}-error">${esc(error.message)}</p>`);}
}
function editableDoc(id){const doc=currentDocument(id);if(!doc)return '';return `<div class="input-document">${ico('file')}<span><strong>${esc(doc.name)}</strong><small>${doc.metadataOnly?'Chưa đọc nội dung · chỉ có thông tin file':'Nội dung văn bản sẵn sàng'}</small></span>${btn(ico('close'),'remove-input-doc','small icon-btn',`data-id="${id}" aria-label="Gỡ ${esc(doc.name)} khỏi case"`)}</div>`;}
function referenceSelection(){return state.page==='setup'?state.selectedCases:state.pendingContextCases;}
renderJobInfo=function(){return `<aside class="card job-info"><header class="job-info-header"><h3>Thông tin case</h3><span class="saved-indicator">Đã giữ bản nháp trong phiên</span></header><div class="job-info-body" data-scroll="job-info">${errorSummary()}<div class="field"><label class="label" for="job-title">Tên case <span class="required">*</span></label><input id="job-title" data-field="title" value="${esc(state.title)}" placeholder="Ví dụ: Thẩm định trợ lý khách hàng"></div><div class="field"><label class="label" for="case-task">Mục tiêu cần giải quyết <span class="required">*</span></label><textarea id="case-task" data-star="task" placeholder="Cần đánh giá hoặc quyết định điều gì?">${esc(state.star.task)}</textarea></div><button class="text-button demo-input-button" data-action="load-demo">${ico('file')} Dùng hồ sơ AutoSupport mẫu</button><div class="inspector-group"><label class="label" for="plan-output">Đầu ra mong muốn <span class="required">*</span></label><textarea id="plan-output" data-field="output">${esc(state.output)}</textarea></div><div class="inspector-group"><h3>Tài liệu đầu vào</h3><p class="helper-text">Dùng chung trong case; tài liệu quy trình được gán theo task.</p>${state.discussionDocs.map(editableDoc).join('')||'<p class="helper-text">Chưa đính kèm tài liệu.</p>'}<label class="upload-inline" for="document-upload">${ico('plus')} Thêm tài liệu<input id="document-upload" type="file" accept=".txt,.md,.csv,.pdf,.docx" multiple></label><button class="text-button tiny-gap" data-action="edit-case-context">Bối cảnh bổ sung</button></div><div class="inspector-group"><h3>Case tham khảo · ${state.selectedCases.length}</h3><p class="helper-text">${state.selectedCases.length?state.selectedCases.map(id=>esc(cases.find(c=>c.id===id)?.title||id)).join('<br>'):'Không bắt buộc.'}</p><button class="text-button" data-action="edit-reference-cases">Chọn case liên quan</button></div><details class="plan-advanced inspector-group"><summary>Quy tắc & tái sử dụng</summary><p class="helper-text">${state.steps.length} tasks · ${selectedExpertCount()} experts. Giới hạn trao đổi theo từng task; giữ bất đồng khi kết thúc.</p>${btn('Lưu thành template','save-template','small')}${state.mode==='open'?btn('Tạo lại plan đề xuất','regenerate-plan','small'):''}</details></div></aside>`;};
const originalNodeDetails=renderNodeDetails;
renderNodeDetails=function(){const task=stepById(state.selectedStep)||state.steps[0];if(!task)return '';let html=originalNodeDetails();html=html.replace('<h3>Expert được giao</h3>','<h3 id="task-experts" tabindex="-1">Expert được giao</h3>').replace('<h3>Phụ thuộc</h3>','<h3 id="task-dependencies" tabindex="-1">Phụ thuộc</h3>');const missing=task.depends.filter(id=>!stepById(id));if(missing.length)html=html.replace('id="task-dependencies" tabindex="-1">Phụ thuộc</h3>','id="task-dependencies" tabindex="-1">Phụ thuộc</h3>'+missing.map(id=>`<div class="missing-dependency">Thiếu ${esc(id)} ${btn('Bỏ liên kết','remove-missing-link','small',`data-id="${task.id}" data-dep="${id}"`)}</div>`).join(''));return html;};
function mobileTabs(kind){const graph=kind==='board',value=graph?state.boardTab:state.workspaceTab,steps=state.page==='running'?state.run.plan.steps:state.steps,selected=state.page==='running'?state.run.selectedStep:state.selectedStep;return `<nav class="workspace-mobile-tabs" aria-label="${graph?'Kết quả':'Planning'}">${(graph?[['graph','Bản đồ'],['details','Chi tiết'],['people','Chuyên gia']]:[['graph','DAG'],['details','Chi tiết task'],['info','Thông tin case']]).map(([key,label])=>`<button data-action="workspace-tab" data-kind="${kind}" data-tab="${key}" aria-pressed="${key===value}">${label}</button>`).join('')}${!graph?`<select aria-label="Chọn task" data-task-picker>${steps.map(s=>`<option value="${s.id}" ${s.id===selected?'selected':''}>${s.id} · ${esc(s.title)}</option>`).join('')}</select>`:`<select aria-label="Chọn luận điểm" data-argument-picker>${argumentItems().map(a=>`<option value="${a.id}" ${a.id===currentArgument()?.id?'selected':''}>${esc(a.title)}</option>`).join('')}</select>`}</nav>`;}
const originalPlanView=renderPlan;
renderPlan=function(){let html=originalPlanView().replace('<div class="planning-workspace">',mobileTabs('plan')+'<div class="planning-workspace">');if(state.undoPlan)html=html.replace('<span class="muted small">',`<span class="undo-plan">Đã xóa task ${btn('Hoàn tác','undo-remove','small')}</span><span class="muted small">`);return html;};
const originalContext=renderContext;
renderContext=function(){return errorSummary()+originalContext().replace('<section class="card">',`<div class="context-demo-row">${btn('Dùng hồ sơ mẫu','load-demo','small')}<span>Không bắt buộc nhập tất cả trường STAR.</span></div><section class="card">`).replace(state.discussionDocs.map(id=>docChip(id)).join(''),state.discussionDocs.map(editableDoc).join(''));};
const originalPaint=render;
render=function(){
  if(state.showValidation){state.validationErrors=state.page==='setup'&&state.wizard===1?caseErrors():planErrors();state.validation=state.validationErrors[0]?.message||'';}
  saveActiveDraft();saveExpertEdit();originalPaint();recordRoute();
  requestAnimationFrame(()=>{const main=$('#main-content');if(main){main.classList.add('workspace-view-'+state.workspaceTab,'board-view-'+state.boardTab);}decorateFieldErrors();});
};
function handleWorkspaceAction(button){
  const a=button.dataset.action,id=button.dataset.id;
  if(a==='resume-draft'){resumeCaseDraft(id);return true;}
  if(a==='edit-expert'){openExpert(state.expertId,true);return true;}
  if(a==='cancel-expert'){delete state.expertEdits[state.expertId||'new'];state.expertEditing=false;state.expertId?openExpert(state.expertId):go('experts');return true;}
  if(a==='wizard-next'){
    if(state.wizard===1&&!validateAndFocus(true))return true;
    if(state.wizard===2&&!state.planGenerated)generateOpenPlan();
    if(state.wizard===3&&!validateAndFocus())return true;
    state.wizard=Math.min(4,state.wizard+1);state.validation='';state.showValidation=false;render();window.scrollTo(0,0);return true;
  }
  if(a==='start'){if(!validateAndFocus())return true;state.workspaceTab='graph';return false;}
  if(a==='load-demo'){state.title=demoCaseInput.title;state.star=clone(demoCaseInput.star);state.discussionDocs=clone(demoCaseInput.discussionDocs);if(!state.output)state.output='Bảng rủi ro, bằng chứng, bất đồng và biện pháp giảm thiểu.';state.sampleCase=true;render();toast('Đã nạp hồ sơ mẫu cho case này.');return true;}
  if(a==='focus-error'){focusValidation(Number(button.dataset.index));return true;}
  if(a==='workspace-tab'){if(button.dataset.kind==='board')state.boardTab=button.dataset.tab;else state.workspaceTab=button.dataset.tab;render();return true;}
  if(a==='edit-case-context'){templateInputsModal('context');return true;}
  if(a==='edit-reference-cases'){templateInputsModal('cases');return true;}
  if(a==='remove-input-doc'){state.discussionDocs=state.discussionDocs.filter(d=>d!==id);state.steps.forEach(s=>s.docs=s.docs.filter(d=>d!==id));render();toast('Đã gỡ tài liệu khỏi context của case.');return true;}
  if(a==='remove-step'){
    if(state.steps.length<=1){toast('Plan cần giữ ít nhất một task.');return true;}
    const task=stepById(id),affected=state.steps.filter(s=>s.depends.includes(id));
    openModal('Xóa task '+id,'Các liên kết phụ thuộc cần được kiểm tra trước khi chạy.',`<p class="small">${esc(task.title)}</p>${affected.length?`<div class="notice amber gap">${affected.map(s=>esc(s.id)).join(', ')} đang phụ thuộc task này. Các liên kết sẽ được đánh dấu thiếu; bạn cần chọn lại trước khi Start.</div>`:'<p class="helper-text gap">Không có task nào phụ thuộc trực tiếp.</p>'}<div class="wizard-foot">${btn('Giữ lại','close-modal')}${btn('Xóa task','confirm-remove-step','primary',`data-id="${id}"`)}</div>`);return true;
  }
  if(a==='confirm-remove-step'){state.undoPlan={task:clone(stepById(id)),index:state.steps.findIndex(s=>s.id===id)};state.steps=state.steps.filter(s=>s.id!==id);state.selectedStep=state.steps.find(s=>s.depends.includes(id))?.id||state.steps[0]?.id;state.dagView.auto=true;state.showValidation=true;closeModal();render();return true;}
  if(a==='undo-remove'){if(state.undoPlan&&!stepById(state.undoPlan.task.id))state.steps.splice(Math.min(state.undoPlan.index,state.steps.length),0,clone(state.undoPlan.task));state.undoPlan=null;state.showValidation=false;state.validation='';state.dagView.auto=true;render();return true;}
  if(a==='remove-missing-link'){const task=stepById(id);task.depends=task.depends.filter(d=>d!==button.dataset.dep);render();return true;}
  if(a==='regenerate-plan'){openModal('Tạo lại plan đề xuất?','Các chỉnh sửa task hiện tại sẽ được thay bằng plan mẫu mới.',`<p class="small">Bối cảnh, đầu ra và tài liệu của case được giữ lại.</p><div class="wizard-foot">${btn('Giữ plan hiện tại','close-modal')}${btn('Tạo lại','confirm-regenerate','primary')}</div>`);return true;}
  if(a==='confirm-regenerate'){generateOpenPlan();state.showValidation=false;closeModal();render();return true;}
  if(a==='toggle-case'||a==='case-from-modal'){
    if(state.page!=='setup'){state.pendingContextCases=state.pendingContextCases.includes(id)?state.pendingContextCases.filter(x=>x!==id):[...state.pendingContextCases,id];if(a==='case-from-modal')closeModal();toast('Case tham khảo sẽ được thêm khi bạn tạo case mới.');render();return true;}
  }
  if(a==='select-step')state.workspaceTab='details';
  if(a==='select-argument')state.boardTab='details';
  if(a==='select-run-step')state.workspaceTab='details';
  if(a==='follow-task')state.workspaceTab='graph';
  if(a==='direct-chat'||a==='begin-direct-chat'){
    const expertId=id||state.directExpertId,previous=[...state.chats].reverse().find(c=>c.expert.id===expertId);
    if(previous){state.chatId=previous.id;go('chat');return true;}
  }
  if(a==='new-direct-chat'){beginDirectChat(id||state.directExpertId,button.dataset.from||state.chatReturn);return true;}
  return false;
}
renderCases=function(){
  const query=state.caseQuery.toLowerCase(),tab=state.caseTab;
  const own=state.sessions.filter(r=>r.plan.title.toLowerCase().includes(query));
  const shared=cases.filter(c=>c.public&&(c.title+' '+c.description).toLowerCase().includes(query));
  const drafts=state.drafts.filter(d=>(d.title||'Case chưa đặt tên').toLowerCase().includes(query));
  const row=(title,description,type,status,action,attrs,aux='')=>`<article class="case-list-row"><div class="case-row-icon">${ico(type==='Trao đổi riêng'?'chat':'file')}</div><div class="case-row-title"><h3>${esc(title)}</h3><p>${esc(description)}</p></div><span class="case-kind">${esc(type)}</span>${badge(status,status==='Hoàn tất'?'green':'')}${aux}${btn('Mở '+ico('arrow'),action,'small',attrs)}</article>`;
  const content=tab==='shared'?shared.map(c=>row(c.title,c.owner,'Case chia sẻ','Public','case',`data-id="${c.id}"`)).join(''):tab==='chats'?state.chats.filter(c=>(c.title+' '+c.expert.role).toLowerCase().includes(query)).map(c=>row(c.title,c.expert.role,'Trao đổi riêng',c.messages.filter(m=>m.role==='user').length+' tin nhắn','resume-direct-chat',`data-id="${c.id}"`)).join(''):drafts.map(d=>row(d.title||'Case chưa đặt tên',d.star?.task||'Chưa có mục tiêu',d.mode==='template'?'Theo template':'Theo chủ đề','Bản nháp','resume-draft',`data-id="${d.id}"`)).join('')+own.map(r=>row(r.plan.title,r.plan.star.task,r.plan.templateId?'Theo template':'Theo chủ đề',r.status==='running'?'Đang chạy':r.status==='completed'?'Hoàn tất':'Chưa hoàn tất','session',`data-index="${state.sessions.indexOf(r)}"`)).join('');
  return heading('WORKSPACE','Cases','Các đánh giá, bản nháp và trao đổi của bạn.',btn(ico('plus')+' Tạo case','navigate','primary','data-page="templates"'))+`<nav class="dashboard-tabs" aria-label="Loại lịch sử">${[['mine','Case của tôi',state.sessions.length+state.drafts.length],['shared','Đã chia sẻ',cases.filter(c=>c.public).length],['chats','Trao đổi riêng',state.chats.length]].map(([id,label,count])=>`<button class="tab ${tab===id?'active':''}" data-action="case-tab" data-tab="${id}" aria-pressed="${tab===id}">${label} <span class="tab-count">${count}</span></button>`).join('')}</nav><div class="library-toolbar"><div class="search-box">${ico('search')}<input id="case-search" data-field="caseQuery" value="${esc(state.caseQuery)}" placeholder="Tìm trong lịch sử" aria-label="Tìm trong lịch sử"></div><span class="helper-text">Được giữ trong phiên trình duyệt này</span></div><section class="case-list">${content||`<div class="case-empty"><h2>${query?'Không có kết quả phù hợp':'Chưa có nội dung'}</h2><p>${query?'Thử một từ khóa khác.':'Tạo case hoặc mở một cuộc trao đổi để bắt đầu.'}</p>${btn('Tạo case','navigate','primary','data-page="templates"')}</div>`}</section>`;
};
renderHome=function(){return `<div class="welcome workbench-welcome"><div class="welcome-intro"><h1>Chào Tran!</h1><p>Hôm nay bạn muốn làm gì?</p><span class="welcome-subtitle">Chọn cách bắt đầu phù hợp với mục tiêu của bạn.</span></div><div class="welcome-options"><article class="welcome-option expert-option"><div class="welcome-option-top"><span class="welcome-choice-icon expert-choice" aria-hidden="true">${ico('book')}</span><button class="welcome-forward" data-action="navigate" data-page="experts" aria-label="Mở chuyên gia AI">${ico('arrow')}</button></div><h2>Tạo chuyên gia AI</h2><p>Định nghĩa chuyên môn và cách tư duy, bổ sung kỹ năng và trao đổi với expert của bạn.</p><div class="welcome-features"><div>${ico('settings')}<span>Định nghĩa vai trò và cách đánh giá</span></div><div>${ico('book')}<span>Gắn các kỹ năng chuyên môn</span></div><div>${ico('chat')}<span>Xem hồ sơ và trao đổi riêng</span></div></div><button class="btn primary welcome-cta" data-action="navigate" data-page="experts">Khám phá & tạo expert ${ico('arrow')}</button></article><article class="welcome-option discussion-option"><div class="welcome-option-top"><span class="welcome-choice-icon discussion-choice" aria-hidden="true">${ico('bulb')}</span><button class="welcome-forward" data-action="navigate" data-page="cases" aria-label="Mở cases để giải quyết vấn đề">${ico('arrow')}</button></div><h2>Cùng expert giải quyết vấn đề</h2><p>Kết hợp các góc nhìn chuyên môn theo một plan rõ ràng, với kết quả có thể truy nguồn.</p><div class="welcome-features"><div>${ico('plan')}<span>Chọn template hoặc tạo plan riêng</span></div><div>${ico('expert')}<span>Phân công expert cho từng task</span></div><div>${ico('graph')}<span>Xem kết quả, bất đồng và bằng chứng</span></div></div><button class="btn primary welcome-cta" data-action="navigate" data-page="cases">Khám phá & tạo case ${ico('arrow')}</button></article></div><footer class="workspace-note">Prototype frontend · dữ liệu được giữ trong phiên trình duyệt</footer></div>`;};
const priorExpertsView=renderExperts;
renderExperts=function(){let html=priorExpertsView();for(const expert of experts){const previous=state.chats.some(c=>c.expert.id===expert.id);if(previous){const attr=`data-id="${expert.id}" data-from="experts"`;html=html.replace(`data-action="direct-chat" ${attr}>${ico('chat')} Trao đổi riêng</button>`,`data-action="direct-chat" ${attr}>${ico('chat')} Tiếp tục</button>${btn('Mới','new-direct-chat','small',attr)}`);}}return html;};
const previousRunning=renderRunning;
renderRunning=function(){return previousRunning().replace('<div class="planning-workspace runtime-workspace">',mobileTabs('plan')+'<div class="planning-workspace runtime-workspace">');};
const previousBoard=renderDiscussionDashboard;
renderDiscussionDashboard=function(){return previousBoard().replace('<div class="discussion-board">',mobileTabs('board')+'<div class="discussion-board">');};
argumentItems=function(run=state.run){return run.results.flatMap(result=>{
  const base={id:result.stepId,stepId:result.stepId,title:result.title,text:result.summary,kind:'finding',experts:result.experts.map(e=>e.id),evidence:result.evidence,rating:result.rating};
  const dissenters=result.experts.filter(e=>e.final&&result.rating&&e.final!==result.rating);
  const rating=dissenters.length?[{...base,id:result.stepId+'-dissent',title:'Mức rủi ro khác · '+result.title,text:result.dissent,kind:'dissent',experts:dissenters.map(e=>e.id),rating:dissenters[0].final}]:[];
  const aspects=(result.disagreements||[]).map((d,i)=>({...base,id:result.stepId+'-aspect-'+i,title:d.aspect,text:d.expertViews.map(v=>v.view).join(' / '),kind:'dissent',experts:d.expertViews.map(v=>v.expert),rating:null,disagreement:d}));
  return [base,...rating,...aspects];
});};
renderOpinionFeed=function(run,selected){
  const opinions=run.results.flatMap(r=>r.experts.map(e=>({result:r,expert:e}))),args=argumentItems(run);
  const list=opinions.filter(({result:r,expert:e})=>(!state.feedExpert||state.feedExpert===e.id)&&(state.feedFilter!=='selected'||r.stepId===selected?.stepId)&&(state.feedFilter!=='dissent'||args.some(a=>a.stepId===r.stepId&&a.kind==='dissent'&&a.experts.includes(e.id))));
  return list.map(({result:r,expert:e})=>{const disagreement=args.find(a=>a.stepId===r.stepId&&a.kind==='dissent'&&a.experts.includes(e.id)),view=disagreement?.disagreement?.expertViews.find(v=>v.expert===e.id)?.view||e.view;return `<button class="opinion-card" data-action="select-argument" data-id="${disagreement?.id||r.stepId}"><div class="row"><strong>${esc(e.role)}</strong></div><div class="row opinion-meta">${badge(r.stepId)}${badge(e.final||'Mẫu',disagreement?'amber':'green')}</div><p>${esc(view)}</p><span>${disagreement?'Có quan điểm cần xem xét':'Xem bằng chứng và nhận định'} ↗</span></button>`;}).join('')||'<div class="empty">Không có ý kiến trong bộ lọc này.</div>';
};
const originalArgumentDetail=renderArgumentDetail;
renderArgumentDetail=function(argument,run){let html=originalArgumentDetail(argument,run);if(argument?.disagreement){const d=argument.disagreement;html=html.replace('<div class="argument-detail-section">',`<div class="argument-detail-section"><h3>${esc(d.aspect)}</h3>${d.expertViews.map(v=>`<p><strong>${esc(run.plan.experts.find(e=>e.id===v.expert)?.role||v.expert)}</strong><br>${esc(v.view)}</p>`).join('')}<p>${esc(d.resolutionNote||'Chưa có cách giải quyết chung.')}</p></div><div class="argument-detail-section">`);}return html;};
const previousHeading=heading;
heading=function(label,title,description,action=''){const titles={'Chuyên môn bắt đầu từ đây.':'Chuyên gia AI','Bạn muốn bắt đầu như thế nào?':'Tạo case','Không bắt đầu từ một trang trắng.':'Case tham khảo'};return previousHeading(label,titles[title]||title,description,action);};
document.addEventListener('change',event=>{if(event.target.hasAttribute('data-task-picker')){if(state.page==='running'){state.run.selectedStep=event.target.value;state.run.followActive=false;}else state.selectedStep=event.target.value;state.workspaceTab='details';render();}if(event.target.hasAttribute('data-argument-picker')){state.argumentId=event.target.value;state.boardTab='details';render();}});
document.addEventListener('focusin',event=>{const node=event.target.closest?.('.dag-node,.argument-card');if(!node)return;const viewport=node.closest('.dag-viewport,.argument-viewport');if(!viewport)return;const argument=node.classList.contains('argument-card'),view=argument?state.argumentView:currentGraphView();const x=node.offsetLeft*view.zoom+view.x,y=node.offsetTop*view.zoom+view.y;if(x<0||y<0||x+node.offsetWidth*view.zoom>viewport.clientWidth||y+node.offsetHeight*view.zoom>viewport.clientHeight){view.auto=false;view.x=viewport.clientWidth/2-(node.offsetLeft+node.offsetWidth/2)*view.zoom;view.y=viewport.clientHeight/2-(node.offsetTop+node.offsetHeight/2)*view.zoom;argument?syncArgumentMap():syncDAG();}});
recordRoute(true);render();
