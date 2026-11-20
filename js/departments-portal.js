import { supabase } from './supabase.js';

const $ = (id) => document.getElementById(id);
const state = { user:null, profile:null, departments:[], positions:[], membership:null, application:null, members:[], conversations:[], activeConversation:null, admin:false, selectedApplication:null, directory:[] };
const icons = ['◈','✦','◉','⌂','＋','♡'];
const esc = (value='') => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const activeStatuses = ['active','renewal_pending','under_review','renewed'];
const notify = (message, error=false) => { const n=$('notice'); n.textContent=message; n.classList.toggle('error',error); n.hidden=false; window.scrollTo({top:0,behavior:'smooth'}); };
const dept = id => state.departments.find(d=>d.id===id);
const position = id => state.positions.find(p=>p.id===id);
const isLeader = () => state.admin || Boolean(state.membership && position(state.membership.position_id)?.is_leadership);
const myDept = () => state.membership ? dept(state.membership.department_id) : null;

function setView(view) {
  document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id==='view-'+view));
  document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
  const titles={overview:'Department overview',directory:'Department directory',tasks:'Tasks & assignments',messages:'Team communication',reports:'Reports & submissions',admin:'Administration'};
  $('pageTitle').textContent=titles[view]||'Department workspace';
}
document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>setView(el.dataset.view)));

async function loadDirectory() {
  const [d,p]=await Promise.all([
    supabase.from('departments').select('*').eq('is_active',true).order('name'),
    supabase.from('department_positions').select('*').eq('is_active',true).order('title')
  ]);
  if(d.error) throw d.error; if(p.error) throw p.error;
  state.departments=d.data||[]; state.positions=p.data||[];
  $('statDepartments').textContent=state.departments.length;
  $('departmentGrid').innerHTML=state.departments.map((item,i)=>{
    const roles=state.positions.filter(x=>x.department_id===item.id);
    return '<article class="department-card"><div class="dept-icon">'+icons[i%icons.length]+'</div><h3>'+esc(item.name)+'</h3><p>'+esc(item.description)+'</p><div class="position-list">'+roles.map(r=>'<span class="position-chip '+(r.is_leadership?'lead':'')+'">'+esc(r.title)+(r.is_leadership?' · appointed':'')+'</span>').join('')+'</div><button class="text-btn apply-dept" data-dept="'+item.id+'">View open positions →</button></article>';
  }).join('');
  $('applicationDepartment').innerHTML='<option value="">Choose department</option>'+state.departments.map(d=>'<option value="'+d.id+'">'+esc(d.name)+'</option>').join('');
  $('appointmentDepartment').innerHTML=state.departments.map(d=>'<option value="'+d.id+'">'+esc(d.name)+'</option>').join('');
  $('applicationDepartment').addEventListener('change',renderPositionOptions);
  $('applicationDepartment').addEventListener('change',()=>{});
  document.querySelectorAll('.apply-dept').forEach(b=>b.addEventListener('click',()=>{ $('applicationDepartment').value=b.dataset.dept; renderPositionOptions(); $('applicationPanel').scrollIntoView({behavior:'smooth'}); }));
  $('appointmentDepartment').addEventListener('change',renderAppointmentPositions);
  renderPositionOptions(); renderAppointmentPositions();
}
function renderPositionOptions() {
  const id=$('applicationDepartment').value;
  const options=state.positions.filter(p=>p.department_id===id && p.is_open_for_application && !p.is_leadership);
  $('applicationPosition').disabled=!id;
  $('applicationPosition').innerHTML=options.length?'<option value="">Choose position</option>'+options.map(p=>'<option value="'+p.id+'">'+esc(p.title)+'</option>').join(''):'<option value="">No open positions in this department</option>';
}
function renderAppointmentPositions() {
  const id=$('appointmentDepartment').value;
  $('appointmentPosition').innerHTML=state.positions.filter(p=>p.department_id===id&&p.is_leadership).map(p=>'<option value="'+p.id+'">'+esc(p.title)+'</option>').join('');
}
async function loadMemberState() {
  const [m,a]=await Promise.all([
    supabase.from('department_memberships').select('*').eq('profile_id',state.user.id).in('membership_status',activeStatuses).maybeSingle(),
    supabase.from('department_applications').select('*').eq('applicant_id',state.user.id).order('created_at',{ascending:false}).limit(1).maybeSingle()
  ]);
  if(m.error) throw m.error; if(a.error) throw a.error;
  state.membership=m.data; state.application=a.data;
  $('statMembership').textContent=state.membership?'Active':state.application?state.application.status.replaceAll('_',' '):'Not joined';
  $('membershipCaption').textContent=state.membership?'One department membership':state.application?'Latest application':'Apply to join a team';
  $('teamTitle').textContent=state.membership?dept(state.membership.department_id)?.name||'Your department':'Department membership';
  $('teamDescription').textContent=state.membership?'Your position: '+(position(state.membership.position_id)?.title||'Team member')+'. Your workspace is ready.':'Explore the six URWA departments and apply for a position that matches your skills and availability.';
  $('memberStatus').textContent=state.membership?position(state.membership.position_id)?.title||'Active member':state.application?.status?.replaceAll('_',' ')||'Not assigned';
  if(state.membership) { $('applicationPanel').hidden=true; $('renewalPanel').hidden=false; $('renewalYear').value=new Date().getFullYear(); await loadRenewalStatus(); }
  else if(state.application){$('myApplication').hidden=false;$('myApplication').innerHTML='<b>Your latest application:</b> '+esc(dept(state.application.department_id)?.name||'Department')+' · '+esc(position(state.application.position_id)?.title||'Position')+' — <b>'+esc(state.application.status.replaceAll('_',' '))+'</b>'; if(['pending','under_review','more_information_required'].includes(state.application.status)) $('applicationForm').hidden=true;}
  $('adminNav').hidden=!state.admin;
  $('teamLeaders').innerHTML=state.membership?'<div class="person-row"><span>Your position</span><b>'+esc(position(state.membership.position_id)?.title||'Member')+'</b></div><div class="person-row"><span>Membership since</span><b>'+new Date(state.membership.start_date).toLocaleDateString()+'</b></div>':'<div class="person-row"><span>Membership</span><b>Application based</b></div>';
  if(state.membership){await loadTeamMembers();await loadTasks();await loadReports();await loadConversations();}
}
async function loadTeamMembers() {
  const {data,error}=await supabase.from('department_memberships').select('profile_id,position_id').eq('department_id',state.membership.department_id).in('membership_status',activeStatuses);
  if(error)throw error;
  const ids=(data||[]).map(m=>m.profile_id);
  if(!ids.length){state.members=[];return;}
  const profiles=await supabase.from('profiles').select('id,full_name,email').in('id',ids);
  if(profiles.error)throw profiles.error;
  state.members=(data||[]).map(m=>({...m,profile:(profiles.data||[]).find(p=>p.id===m.profile_id)}));
  $('taskAssignees').innerHTML=state.members.map(m=>'<option value="'+m.profile_id+'">'+esc(m.profile?.full_name||m.profile?.email||'Member')+'</option>').join('');
}
async function submitApplication(e){
  e.preventDefault();const button=e.submitter;button.disabled=true;
  try{
    if(state.membership)throw new Error('You already have a department membership. Request a transfer through Administration.');
    const payload={applicant_id:state.user.id,department_id:$('applicationDepartment').value,position_id:$('applicationPosition').value,motivation:$('motivation').value.trim(),skills_experience:$('skills').value.trim()||null,leadership_experience:$('leadershipExperience').value.trim()||null,availability:$('availability').value.trim()||null,additional_information:$('additionalInfo').value.trim()||null};
    const {error}=await supabase.from('department_applications').insert(payload);if(error)throw error;
    notify('Your application has been submitted to URWA Administration.');$('applicationForm').reset();$('applicationForm').hidden=true;await loadMemberState();
  }catch(err){notify(err.message,true);}finally{button.disabled=false;}
}
async function loadTasks(){
  const {data,error}=await supabase.from('department_tasks').select('*,department_task_assignees(profile_id)').eq('department_id',state.membership.department_id).order('created_at',{ascending:false});
  if(error)throw error;
  const tasks=data||[];const mine=tasks.filter(t=>t.department_task_assignees?.some(a=>a.profile_id===state.user.id));
  $('statTasks').textContent=mine.filter(t=>!['completed','cancelled'].includes(t.status)).length;
  $('taskCreatePanel').hidden=!isLeader();
  $('taskList').innerHTML=tasks.length?tasks.map(t=>'<article class="task-card"><div class="task-meta"><span class="pill">'+esc(t.priority)+'</span><span>'+esc(t.status.replaceAll('_',' '))+'</span><span>Due '+(t.due_at?new Date(t.due_at).toLocaleString():'Not set')+'</span><span>'+(t.department_task_assignees?.length||0)+' assigned</span></div><h3>'+esc(t.title)+'</h3><p>'+esc(t.description||'No additional instructions.')+'</p>'+(t.department_task_assignees?.some(a=>a.profile_id===state.user.id)||isLeader()?'<label class="small">Update status <select data-task="'+t.id+'"><option value="todo">To do</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option></select></label>':'<span class="muted small">Not assigned to you</span>')+'</article>').join(''):'<div class="loading-card">No department tasks yet.</div>';
  document.querySelectorAll('[data-task]').forEach(sel=>{const t=tasks.find(x=>x.id===sel.dataset.task);sel.value=t.status;sel.addEventListener('change',async()=>{const {error}=await supabase.from('department_tasks').update({status:sel.value,updated_at:new Date().toISOString()}).eq('id',t.id);if(error){notify(error.message,true);sel.value=t.status;}else{t.status=sel.value;notify('Task status updated.');$('statTasks').textContent=mine.filter(x=>!['completed','cancelled'].includes(x.status)).length;}});});
}
async function createTask(e){
  e.preventDefault();const button=e.submitter;button.disabled=true;
  try{
    const due=$('taskDue').value?new Date($('taskDue').value).toISOString():null;
    const {data,error}=await supabase.from('department_tasks').insert({department_id:state.membership.department_id,title:$('taskTitle').value.trim(),description:$('taskDescription').value.trim()||null,priority:$('taskPriority').value,due_at:due,created_by:state.user.id}).select().single();
    if(error)throw error;
    const ids=Array.from($('taskAssignees').selectedOptions).map(o=>o.value);
    if(ids.length){const assigned=await supabase.from('department_task_assignees').insert(ids.map(profile_id=>({task_id:data.id,profile_id,assigned_by:state.user.id})));if(assigned.error)throw assigned.error;}
    $('taskForm').reset();notify('Task created and assigned.');await loadTasks();
  }catch(err){notify(err.message,true);}finally{button.disabled=false;}
}
async function loadReports(){
  const {data,error}=await supabase.from('department_reports').select('*').eq('department_id',state.membership.department_id).order('created_at',{ascending:false});
  if(error)throw error;
  const reports=data||[];$('statReports').textContent=reports.filter(r=>r.submitted_by===state.user.id).length;
  $('reportList').innerHTML=reports.length?reports.map(r=>'<article class="report-card"><div class="task-meta"><span class="pill">'+esc(r.status.replaceAll('_',' '))+'</span><span>'+new Date(r.created_at).toLocaleDateString()+'</span></div><h3>'+esc(r.title)+'</h3><p>'+esc(r.summary)+'</p>'+(r.achievements?'<p><b>Achievements:</b> '+esc(r.achievements)+'</p>':'')+(r.challenges?'<p><b>Challenges:</b> '+esc(r.challenges)+'</p>':'')+(r.review_notes?'<p><b>Review note:</b> '+esc(r.review_notes)+'</p>':'')+'</article>').join(''):'<div class="loading-card">No reports submitted yet.</div>';
}
async function submitReport(e){
  e.preventDefault();const button=e.submitter;button.disabled=true;
  try{
    const {error}=await supabase.from('department_reports').insert({department_id:state.membership.department_id,title:$('reportTitle').value.trim(),report_period_start:$('reportStart').value||null,summary:$('reportSummary').value.trim(),achievements:$('reportAchievements').value.trim()||null,challenges:$('reportChallenges').value.trim()||null,submitted_by:state.user.id});
    if(error)throw error;$('reportForm').reset();notify('Your report has been submitted.');await loadReports();
  }catch(err){notify(err.message,true);}finally{button.disabled=false;}
}
async function loadConversations(){
  const [mine,channels]=await Promise.all([
    supabase.from('department_conversation_participants').select('conversation_id').eq('profile_id',state.user.id),
    supabase.from('department_conversations').select('*').eq('conversation_type','department').eq('department_id',state.membership.department_id)
  ]);
  if(mine.error)throw mine.error;if(channels.error)throw channels.error;
  if(!(channels.data||[]).length){const created=await supabase.from('department_conversations').insert({conversation_type:'department',department_id:state.membership.department_id,title:dept(state.membership.department_id)?.name+' · Team channel',created_by:state.user.id}).select('id').single();if(created.error && created.error.code!=='23505')throw created.error;return loadConversations();}
  const ids=[...new Set([...(mine.data||[]).map(x=>x.conversation_id),...(channels.data||[]).map(x=>x.id)])];
  if(!ids.length){state.conversations=[];renderConversations();return;}
  const result=await supabase.from('department_conversations').select('*').in('id',ids).order('created_at',{ascending:false});
  if(result.error)throw result.error;state.conversations=result.data||[];renderConversations();
}
function renderConversations(){
  $('conversationList').innerHTML=state.conversations.length?state.conversations.map(c=>'<button class="conversation-item '+(state.activeConversation===c.id?'active':'')+'" data-conversation="'+c.id+'"><b>'+esc(c.title||(c.conversation_type==='department'?'Department channel':'Collaboration chat'))+'</b><small>'+esc(c.conversation_type.replaceAll('_',' '))+'</small></button>').join(''):'<p class="muted">No conversations yet. Start a collaboration group or create your department channel.</p>';
  document.querySelectorAll('[data-conversation]').forEach(b=>b.addEventListener('click',()=>openConversation(b.dataset.conversation)));
}
async function openConversation(id){
  state.activeConversation=id;const c=state.conversations.find(x=>x.id===id);$('chatTitle').textContent=c?.title||'Department channel';renderConversations();
  const {data,error}=await supabase.from('department_messages').select('id,sender_id,body,created_at').eq('conversation_id',id).is('deleted_at',null).order('created_at');
  if(error){notify(error.message,true);return;}
  const senderIds=[...new Set((data||[]).map(m=>m.sender_id))];
  const people=senderIds.length?await supabase.from('profiles').select('id,full_name').in('id',senderIds):{data:[],error:null};
  if(people.error)throw people.error;
  $('messageList').innerHTML=(data||[]).map(m=>'<div class="message-bubble '+(m.sender_id===state.user.id?'mine':'')+'"><small>'+esc(people.data.find(p=>p.id===m.sender_id)?.full_name||'URWA member')+' · '+new Date(m.created_at).toLocaleString()+'</small>'+esc(m.body)+'</div>').join('')||'<div class="empty-state">No messages yet. Start the conversation.</div>';
  $('messageList').scrollTop=$('messageList').scrollHeight;
}
async function sendMessage(e){
  e.preventDefault();if(!state.activeConversation)return notify('Choose a conversation first.',true);
  const body=$('messageText').value.trim();if(!body)return;
  const {error}=await supabase.from('department_messages').insert({conversation_id:state.activeConversation,sender_id:state.user.id,body});
  if(error)notify(error.message,true);else{$('messageText').value='';await openConversation(state.activeConversation);}
}
async function showNewConversation(){
  $('newConversationPanel').hidden=false;
  const {data,error}=await supabase.rpc('get_department_collaboration_directory');if(error)throw error;
  $('conversationMembers').innerHTML=(data||[]).filter(m=>m.profile_id!==state.user.id).map(m=>'<option value="'+m.profile_id+'">'+esc(m.full_name)+' — '+esc(m.department_name)+'</option>').join('');
  $('newConversationPanel').scrollIntoView({behavior:'smooth'});
}
async function createConversation(e){
  e.preventDefault();const button=e.submitter;button.disabled=true;
  try{
    const title=$('conversationTitle').value.trim();const {data,error}=await supabase.from('department_conversations').insert({conversation_type:'cross_department',title,created_by:state.user.id}).select().single();if(error)throw error;
    const ids=[state.user.id,...Array.from($('conversationMembers').selectedOptions).map(o=>o.value)];
    const added=await supabase.from('department_conversation_participants').insert(ids.map(profile_id=>({conversation_id:data.id,profile_id,added_by:state.user.id})));if(added.error)throw added.error;
    $('conversationForm').reset();$('newConversationPanel').hidden=true;await loadConversations();await openConversation(data.id);notify('Collaboration group created.');
  }catch(err){notify(err.message,true);}finally{button.disabled=false;}
}


async function loadRenewalStatus(){
  if(!state.membership)return;
  const {data,error}=await supabase.from('department_renewal_requests').select('*').eq('membership_id',state.membership.id).order('review_year',{ascending:false}).limit(1).maybeSingle();
  if(error)throw error;
  if(data){$('renewalStatus').hidden=false;$('renewalStatus').textContent='Your '+data.review_year+' renewal: '+data.status.replaceAll('_',' ');$('renewalForm').hidden=['submitted','under_review','renewed','not_renewed'].includes(data.status);}
}
async function submitRenewal(e){
  e.preventDefault();const button=e.submitter;button.disabled=true;
  try{
    const year=Number($('renewalYear').value);
    const {error}=await supabase.from('department_renewal_requests').insert({membership_id:state.membership.id,profile_id:state.user.id,department_id:state.membership.department_id,review_year:year,continued_interest:true,availability:$('renewalAvailability').value.trim()||null,member_notes:$('renewalNotes').value.trim()||null});
    if(error)throw error;
    notify('Your annual renewal request has been submitted.');await loadMemberState();
  }catch(err){notify(err.message,true);}finally{button.disabled=false;}
}

async function loadAdmin(){
  if(!state.admin)return;
  const [apps,members,profiles,reviews,renewals]=await Promise.all([
    supabase.from('department_applications').select('*').order('created_at',{ascending:false}),
    supabase.from('department_memberships').select('*').in('membership_status',activeStatuses).order('created_at',{ascending:false}),
    supabase.from('profiles').select('id,full_name,email').eq('status','approved').order('full_name'),
    supabase.from('department_reviews').select('id'),\n    supabase.from('department_renewal_requests').select('*').order('created_at',{ascending:false})
  ]);
  for(const x of [apps,members,profiles,reviews,renewals])if(x.error)throw x.error;
  const people=profiles.data||[];const appsData=apps.data||[];const membersData=members.data||[];
  $('adminPending').textContent=appsData.filter(a=>['pending','under_review','more_information_required'].includes(a.status)).length;
  $('adminMembers').textContent=membersData.length;$('adminReviews').textContent=(reviews.data||[]).length;
  $('applicationRows').innerHTML=appsData.length?appsData.map(a=>'<tr><td>'+esc(people.find(p=>p.id===a.applicant_id)?.full_name||'Applicant')+'</td><td>'+esc(dept(a.department_id)?.name||'')+'</td><td>'+esc(position(a.position_id)?.title||'')+'</td><td>'+esc(a.availability||'—')+'</td><td>'+new Date(a.created_at).toLocaleDateString()+'</td><td><button class="table-action" data-review="'+a.id+'">Review</button></td></tr>').join(''):'<tr><td colspan="6">No applications received.</td></tr>';
  $('membershipRows').innerHTML=membersData.length?membersData.map(m=>'<tr><td>'+esc(people.find(p=>p.id===m.profile_id)?.full_name||'Member')+'</td><td>'+esc(dept(m.department_id)?.name||'')+'</td><td>'+esc(position(m.position_id)?.title||'')+'</td><td>'+esc(m.membership_status.replaceAll('_',' '))+'</td><td>'+new Date(m.start_date).toLocaleDateString()+'</td></tr>').join(''):'<tr><td colspan="5">No active memberships yet.</td></tr>';
  $('appointmentMember').innerHTML=people.map(p=>'<option value="'+p.id+'">'+esc(p.full_name||p.email)+'</option>').join('');
  document.querySelectorAll('[data-review]').forEach(b=>b.addEventListener('click',()=>openReview(appsData.find(a=>a.id===b.dataset.review),people)));
  $('renewalRows').innerHTML=(renewals.data||[]).length?(renewals.data||[]).map(r=>'<tr><td>'+esc(people.find(p=>p.id===r.profile_id)?.full_name||'Member')+'</td><td>'+esc(dept(r.department_id)?.name||'')+'</td><td>'+r.review_year+'</td><td>'+esc(r.availability||'—')+'</td><td>'+esc(r.status.replaceAll('_',' '))+'</td><td>'+(r.status==='submitted'||r.status==='under_review'?'<button class="table-action" data-renew="'+r.id+'" data-status="renewed">Renew</button> <button class="table-action" data-renew="'+r.id+'" data-status="not_renewed">Decline</button>':'—')+'</td></tr>').join(''):'<tr><td colspan="6">No renewal requests received.</td></tr>';
  document.querySelectorAll('[data-renew]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{const {error}=await supabase.from('department_renewal_requests').update({status:b.dataset.status,reviewed_by:state.user.id,reviewed_at:new Date().toISOString()}).eq('id',b.dataset.renew);if(error)throw error;notify('Membership renewal decision saved.');await loadAdmin();}catch(err){notify(err.message,true);b.disabled=false;}}));
}
function openReview(app,people){
  if(!app)return;state.selectedApplication=app;
  $('reviewApplicant').textContent=people.find(p=>p.id===app.applicant_id)?.full_name||'Applicant';
  $('reviewDetails').innerHTML='<div class="detail-grid"><div><b>Department</b><p>'+esc(dept(app.department_id)?.name)+'</p></div><div><b>Position</b><p>'+esc(position(app.position_id)?.title)+'</p></div><div><b>Availability</b><p>'+esc(app.availability||'Not provided')+'</p></div><div><b>Skills and experience</b><p>'+esc(app.skills_experience||'Not provided')+'</p></div><div><b>Motivation</b><p>'+esc(app.motivation)+'</p></div><div><b>Leadership / volunteering</b><p>'+esc(app.leadership_experience||'Not provided')+'</p></div></div>';
  $('reviewNote').value=app.review_notes||'';$('reviewDialog').showModal();
}
async function reviewApplication(status){
  const app=state.selectedApplication;if(!app)return;
  const note=$('reviewNote').value.trim();
  if(status==='approved'){
    const {error:memberError}=await supabase.from('department_memberships').insert({profile_id:app.applicant_id,department_id:app.department_id,position_id:app.position_id,membership_status:'active',appointed_by:state.user.id,source_application_id:app.id});
    if(memberError)throw memberError;
  }
  const {error}=await supabase.from('department_applications').update({status,reviewed_by:state.user.id,review_notes:note||null,reviewed_at:new Date().toISOString()}).eq('id',app.id);
  if(error)throw error;$('reviewDialog').close();notify(status==='approved'?'Application approved and membership activated.':'Application updated: '+status.replaceAll('_',' '));await loadAdmin();
}
async function appointLeader(e){
  e.preventDefault();const button=e.submitter;button.disabled=true;
  try{
    const departmentId=$('appointmentDepartment').value;const posId=$('appointmentPosition').value;const profileId=$('appointmentMember').value;
    const {data:old,error:oldError}=await supabase.from('department_memberships').select('id').eq('department_id',departmentId).eq('position_id',posId).in('membership_status',activeStatuses);
    if(oldError)throw oldError;
    if(old?.length){const update=await supabase.from('department_memberships').update({membership_status:'transferred',end_date:new Date().toISOString().slice(0,10)}).in('id',old.map(x=>x.id));if(update.error)throw update.error;}
    const {error}=await supabase.from('department_memberships').insert({profile_id:profileId,department_id:departmentId,position_id:posId,membership_status:'active',appointed_by:state.user.id});
    if(error)throw error;notify('Leadership appointment saved.');await loadAdmin();await loadMemberState();
  }catch(err){notify(err.message,true);}finally{button.disabled=false;}
}
async function init(){
  const {data,error}=await supabase.auth.getUser();if(error||!data.user){location.replace('/portal/student/student-login.html');return;}
  state.user=data.user;
  const {data:profile,error:profileError}=await supabase.from('profiles').select('id,full_name,email,role,status').eq('id',state.user.id).maybeSingle();
  if(profileError)throw profileError;if(!profile||profile.status!=='approved'){notify('Your URWA account is not approved for portal access.',true);return;}
  state.profile=profile;state.admin=profile.role==='admin';
  $('userName').textContent=profile.full_name||profile.email;$('userRole').textContent=state.admin?'URWA Administration':'URWA member';$('userInitials').textContent=(profile.full_name||'U').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
  $('signOut').addEventListener('click',async()=>{await supabase.auth.signOut();location.replace('/portal/student/student-login.html');});
  $('applicationForm').addEventListener('submit',submitApplication);$('renewalForm').addEventListener('submit',submitRenewal);$('taskForm').addEventListener('submit',createTask);$('reportForm').addEventListener('submit',submitReport);$('messageForm').addEventListener('submit',sendMessage);$('conversationForm').addEventListener('submit',createConversation);$('appointmentForm').addEventListener('submit',appointLeader);
  $('newConversationBtn').addEventListener('click',()=>showNewConversation().catch(e=>notify(e.message,true)));$('cancelConversation').addEventListener('click',()=>$('newConversationPanel').hidden=true);
  $('approveApplicationBtn').addEventListener('click',()=>reviewApplication('approved').catch(e=>notify(e.message,true)));
  $('declineApplicationBtn').addEventListener('click',()=>reviewApplication('declined').catch(e=>notify(e.message,true)));
  $('requestInfoBtn').addEventListener('click',()=>reviewApplication('more_information_required').catch(e=>notify(e.message,true)));
  await loadDirectory();await loadMemberState();if(state.admin){$('adminNav').hidden=false;await loadAdmin();}
  $('welcomeTitle').textContent='Assalamu alaykum, '+(profile.full_name?.split(' ')[0]||'');$('welcomeText').textContent=state.membership?'Welcome to the '+(myDept()?.name||'department')+' workspace. Your team can coordinate tasks, messages and reports here.':'Browse the six departments and submit an application to join one URWA team.';
}
init().catch(err=>notify(err.message||'Unable to load the department workspace.',true));
