import { supabase } from './supabase.js';

const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const role = document.body.dataset.urwaRole;
if (!['admin','student','teacher'].includes(role)) { /* not a protected dashboard */ }
else boot().catch(err => console.error('[URWA messaging]', err));

async function boot() {
  const { data:{user}, error:authError } = await supabase.auth.getUser();
  if (authError || !user) return;
  // Keep admin pages free of the injected Community/Halaqa Messages panel.
  // Student and Abla dashboards retain their private and group class messaging.
  const adminPage = window.location.pathname.split('/').pop();
  if (role === 'admin' && ['admin-dashboard.html', 'students.html', 'ablas.html'].includes(adminPage)) return;
  const { data:profile, error:profileError } = await supabase.from('profiles').select('id,full_name,role,status').eq('id',user.id).maybeSingle();
  if (profileError || !profile || profile.role !== role || profile.status !== 'approved') return;

  const link = document.createElement('link');
  link.rel='stylesheet'; link.href='../../css/halaqa-messaging.css'; document.head.append(link);

  const mount = document.createElement('section');
  mount.className='hm-panel';
  mount.id='halaqa-messages';
  mount.innerHTML = role === 'admin' ? adminMarkup() : memberMarkup();
  const target = role === 'admin'
    ? (document.querySelector('.content') || document.querySelector('.urwa-content'))
    : role === 'student'
      ? document.querySelector('.discussion-section')
      : document.querySelector('.center-column');
  if (!target) return;
  if (role === 'student') {
    target.querySelector('.discussion-layout')?.remove();
  }
  if (role === 'teacher') {
    const oldPlaceholder = target.querySelector('.empty');
    if (oldPlaceholder) oldPlaceholder.remove();
  }
  target.append(mount);

  if (role === 'admin') return loadAdmin(mount);
  await loadMember(mount,user,profile);
}

function adminMarkup(){
 return `<div class="hm-heading"><div><span class="hm-kicker">COMMUNITY & COMMUNICATION</span><h2>Halaqa Messaging</h2><p>Overview of the 32 named learning circles and their assigned teaching teams.</p></div><span class="hm-pill">Admin overview</span></div>
 <div class="hm-admin-note"><b>Student conversations are private.</b><span>Administration can manage halaqa membership and Abla assignments, but private student–Abla messages are not exposed in the admin dashboard.</span></div>
 <div class="hm-admin-list" id="hm-admin-list"><p>Loading halaqa directory…</p></div>`;
}
function memberMarkup(){
 return `<div class="hm-heading"><div><span class="hm-kicker">YOUR HALAQA COMMUNITY</span><h2>Messages</h2><p>Speak with your halaqa and stay connected with your Abla.</p></div><span class="hm-live"><i></i> Live chat</span></div>
 <div class="hm-layout">
  <aside class="hm-sidebar"><label class="hm-label" for="hm-chat-select">Conversation</label><select id="hm-chat-select"><option>Loading your halaqa…</option></select><div class="hm-chat-info" id="hm-chat-info">Your assigned halaqa conversations will appear here.</div></aside>
  <div class="hm-conversation"><div class="hm-messages" id="hm-messages" aria-live="polite"><p class="hm-empty">Choose a conversation to view messages.</p></div>
   <form class="hm-compose" id="hm-compose"><textarea id="hm-message" rows="2" maxlength="4000" placeholder="Write a message…" required></textarea><button type="submit">Send <span>➤</span></button></form>
   <p class="hm-status" id="hm-status" role="status"></p>
  </div>
 </div>`;
}

async function loadAdmin(root){
 const [h, a] = await Promise.all([
  supabase.from('halaqas').select('id,name,is_active').order('name'),
  supabase.from('teacher_assignments').select('halaqa_id,teacher_id')
 ]);
 if(h.error) throw h.error; if(a.error) throw a.error;
 const assigned=new Map();
 (a.data||[]).forEach(x=>assigned.set(x.halaqa_id,(assigned.get(x.halaqa_id)||0)+1));
 root.querySelector('#hm-admin-list').innerHTML=(h.data||[]).map(x=>`<div class="hm-admin-row"><span class="hm-circle">◎</span><b>${esc(x.name)}</b><small>${assigned.get(x.id)||0} Abla assignment(s)</small><em class="${x.is_active?'active':''}">${x.is_active?'Active':'Inactive'}</em></div>`).join('') || '<p>No halaqas found.</p>';
}

async function loadMember(root,user,profile){
 const select=root.querySelector('#hm-chat-select');
 const messages=root.querySelector('#hm-messages');
 const info=root.querySelector('#hm-chat-info');
 const status=root.querySelector('#hm-status');
 let chats=[], active=null, channel=null, roster=[];

 if(role==='student'){
  const {data:enrollments,error}=await supabase.from('student_enrollments').select('halaqa_id,programme,status').eq('student_id',user.id).eq('status','approved').not('halaqa_id','is',null);
  if(error) throw error;
  const enrollment=enrollments?.[0];
  if(!enrollment){select.innerHTML='<option>No halaqa assigned</option>';info.textContent='Your Abla will appear here after administration assigns your halaqa.';messages.innerHTML='<p class="hm-empty">You are not assigned to a halaqa yet.</p>';return;}
  const {data:halaqa,error:he}=await supabase.from('halaqas').select('id,name').eq('id',enrollment.halaqa_id).maybeSingle(); if(he)throw he;
  const {data:assignments,error:ae}=await supabase.from('teacher_assignments').select('teacher_id').eq('halaqa_id',enrollment.halaqa_id);if(ae)throw ae;
  const ids=(assignments||[]).map(x=>x.teacher_id);
  const teacherId=ids[0];
  if(!teacherId){select.innerHTML='<option>Abla not assigned yet</option>';info.textContent=halaqa?.name||'Your halaqa';messages.innerHTML='<p class="hm-empty">Your Abla has not been assigned yet. Group messaging will be available once an Abla is assigned.</p>';return;}
  chats=[{kind:'group',label:(halaqa?.name||'My Halaqa')+' · Group',halaqaId:enrollment.halaqa_id},{kind:'private',label:'Private chat · Your Abla',halaqaId:enrollment.halaqa_id,studentId:user.id,teacherId}];
  info.textContent='Your assigned Abla · '+(halaqa?.name||'My Halaqa');
 } else {
  const {data:assignments,error}=await supabase.from('teacher_assignments').select('halaqa_id').eq('teacher_id',user.id);if(error)throw error;
  const ids=[...new Set((assignments||[]).map(x=>x.halaqa_id))];
  if(!ids.length){select.innerHTML='<option>No halaqas assigned</option>';info.textContent='Your assigned halaqas will appear here after administration assigns them.';messages.innerHTML='<p class="hm-empty">No halaqas are assigned to your account yet.</p>';return;}
  const [{data:halaqas,error:he},{data:enrollments,error:ee}]=await Promise.all([
   supabase.from('halaqas').select('id,name').in('id',ids).order('name'),
   supabase.from('student_enrollments').select('student_id,halaqa_id').in('halaqa_id',ids).eq('status','approved')
  ]);if(he)throw he;if(ee)throw ee;
  chats=[];
  (halaqas||[]).forEach(h=>{
   chats.push({kind:'group',label:h.name+' · Group',halaqaId:h.id});
   (enrollments||[]).filter(e=>e.halaqa_id===h.id).forEach((e,i)=>chats.push({kind:'private',label:'Student '+(i+1)+' · Private',halaqaId:h.id,studentId:e.student_id,teacherId:user.id}));
  });
  info.textContent='You can participate in your halaqa group chats and privately message students assigned to your classes.';
 }
 select.innerHTML=chats.map((c,i)=>`<option value="${i}">${esc(c.label)}</option>`).join('');
 if(!chats.length){messages.innerHTML='<p class="hm-empty">No conversations available.</p>';return;}
 async function openChat(index){
  active=chats[Number(index)];
  if(channel){await supabase.removeChannel(channel);channel=null;}
  messages.innerHTML='<p class="hm-empty">Loading conversation…</p>';
  let query=supabase.from('halaqa_chats').select('id').eq('halaqa_id',active.halaqaId).eq('chat_type',active.kind);
  if(active.kind==='private') query=query.eq('student_id',active.studentId).eq('teacher_id',active.teacherId);
  let {data:chat,error}=await query.maybeSingle();if(error)throw error;
  if(!chat){
   const payload={halaqa_id:active.halaqaId,chat_type:active.kind,student_id:active.studentId||null,teacher_id:active.teacherId||null};
   const created=await supabase.from('halaqa_chats').insert(payload).select('id').single();
   if(created.error) throw created.error; chat=created.data;
  }
  active.id=chat.id;
  await refreshMessages();
  channel=supabase.channel('hm-'+chat.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'halaqa_messages',filter:'chat_id=eq.'+chat.id},()=>refreshMessages()).subscribe();
 }
 async function refreshMessages(){
  if(!active?.id)return;
  const {data,error}=await supabase.from('halaqa_messages').select('id,sender_id,body,created_at').eq('chat_id',active.id).order('created_at',{ascending:true}).limit(150);
  if(error){status.textContent=error.message;return;}
  messages.innerHTML=(data||[]).map(m=>`<article class="hm-message ${m.sender_id===user.id?'mine':'theirs'}"><div>${esc(m.body).replace(/\n/g,'<br>')}</div><time>${new Date(m.created_at).toLocaleString()}</time></article>`).join('')||'<p class="hm-empty">No messages yet. Start the conversation with salaam.</p>';
  messages.scrollTop=messages.scrollHeight;
 }
 select.addEventListener('change',()=>openChat(select.value).catch(e=>status.textContent=e.message));
 root.querySelector('#hm-compose').addEventListener('submit',async e=>{
  e.preventDefault(); const field=root.querySelector('#hm-message');const body=field.value.trim();if(!body||!active?.id)return;
  const button=e.currentTarget.querySelector('button');button.disabled=true;status.textContent='Sending…';
  const {error}=await supabase.from('halaqa_messages').insert({chat_id:active.id,sender_id:user.id,body});
  button.disabled=false;
  if(error){status.textContent=error.message;return;}
  field.value='';status.textContent='Message sent.';
  await refreshMessages();
 });
 await openChat(0);
}
