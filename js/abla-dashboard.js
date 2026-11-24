import { supabase } from './supabase.js';
import './halaqa-messaging.js';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel = value => value ? new Date(value+'T00:00:00').toLocaleDateString() : '—';
const say = (node, message, bad=false) => { if(!node)return; node.textContent=message; node.style.color=bad?'#b33b32':'#0e4a40'; };
const empty = message => '<div class="empty"><strong>'+esc(message)+'</strong></div>';

async function boot(){
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError) throw authError;
 if(!user){location.replace('/portal/abla/teacher-login.html');return;}
 const {data:profile,error:profileError}=await supabase.from('profiles').select('id,full_name,email,role,status').eq('id',user.id).maybeSingle();
 if(profileError) throw profileError;
 if(!profile||profile.role!=='teacher'||profile.status!=='approved'){
   await supabase.auth.signOut(); location.replace('/portal/abla/teacher-login.html'); return;
 }
 $$('[data-profile-name]').forEach(n=>n.textContent=profile.full_name||'Educator');
 $$('[data-profile-email]').forEach(n=>n.textContent=profile.email||user.email||'');
 const statusNode=document.createElement('p');statusNode.id='abla-live-status';statusNode.setAttribute('role','status');
 statusNode.style.cssText='font-size:11px;color:#71817a;margin:0 0 12px';
 $('.page-title')?.after(statusNode);
 const [linksQ,assignmentsQ,announcementsQ]=await Promise.all([
   supabase.from('teacher_assignments').select('halaqa_id').eq('teacher_id',user.id),
   supabase.from('assignments').select('id,halaqa_id,title,assignment_type,instructions,due_date,created_at').eq('teacher_id',user.id).order('created_at',{ascending:false}),
   supabase.from('announcements').select('id,title,message,audience,halaqa_id,published_at').or('audience.eq.all,audience.eq.teachers').order('published_at',{ascending:false})
 ]);
 for(const q of [linksQ,assignmentsQ,announcementsQ]) if(q.error) throw q.error;
 const halaqaIds=[...new Set((linksQ.data||[]).map(x=>x.halaqa_id))];
 if(!halaqaIds.length){
   $('#students tbody')?.replaceChildren();
   const node=$('#students .table-wrap'); if(node) node.innerHTML=empty('No halaqas assigned yet')+'<p>URWA administration needs to assign a halaqa to your teacher account.</p>';
   say(statusNode,'Your account is connected, but no halaqas have been assigned yet.');
   return;
 }
 const [halaqasQ,enrollmentsQ,attendanceQ]=await Promise.all([
   supabase.from('halaqas').select('id,name,description').in('id',halaqaIds).order('name'),
   supabase.from('student_programme_enrollments').select('id,student_id,halaqa_id,programme,schedule,status').in('halaqa_id',halaqaIds).eq('status','approved'),
   supabase.from('attendance').select('id,halaqa_id,student_id,class_date,status').in('halaqa_id',halaqaIds)
 ]);
 for(const q of [halaqasQ,enrollmentsQ,attendanceQ]) if(q.error) throw q.error;
 const halaqas=halaqasQ.data||[], enrollments=enrollmentsQ.data||[], attendance=attendanceQ.data||[];
 const studentIds=[...new Set(enrollments.map(x=>x.student_id))];
 const [profilesQ,legacyEnrollmentsQ,submissionsQ]=await Promise.all([
   supabase.rpc('get_teacher_student_directory'),
   supabase.from('student_enrollments').select('student_id,level').in('student_id',[...new Set(enrollments.map(x=>x.student_id))]),
   assignmentsQ.data?.length?supabase.from('submissions').select('id,assignment_id,student_id,content,file_url,submitted_at,feedback').in('assignment_id',assignmentsQ.data.map(x=>x.id)).order('submitted_at',{ascending:false}):Promise.resolve({data:[],error:null})
 ]);
 if(profilesQ.error)throw profilesQ.error;if(legacyEnrollmentsQ.error)throw legacyEnrollmentsQ.error;if(submissionsQ.error)throw submissionsQ.error;
 const people=profilesQ.data||[], submissions=submissionsQ.data||[];
 const peopleById=new Map(people.map(x=>[x.id,x]));
 const legacyByStudent=new Map((legacyEnrollmentsQ.data||[]).map(x=>[x.student_id,x]));
 const halaqaById=new Map(halaqas.map(x=>[x.id,x]));
 const totalStudents=enrollments.length, totalAttendance=attendance.length;
 const present=attendance.filter(x=>['present','late'].includes(x.status)).length;
 const attendanceRate=totalAttendance?Math.round(present/totalAttendance*100)+'%':'—';
 const pendingReviews=submissions.filter(x=>!x.feedback).length;
 const kpis=$$('.stat');
 if(kpis[0]) kpis[0].querySelector('strong').textContent=String(totalStudents);
 if(kpis[1]) kpis[1].querySelector('strong').textContent=attendanceRate;
 if(kpis[2]) kpis[2].querySelector('strong').textContent=String((assignmentsQ.data||[]).length);
 if(kpis[3]) kpis[3].querySelector('strong').textContent=String(pendingReviews);
 const halaqaPanel=$('#halaqa .panel');
 if(halaqaPanel) halaqaPanel.innerHTML='<div class="panel-heading"><h2>My Halaqas</h2></div>'+halaqas.map(h=>'<div class="activity"><div class="date-box">◎</div><div><strong>'+esc(h.name)+'</strong><small>'+esc(h.description||'Assigned teaching group')+'</small></div></div>').join('');
 const studentTable=$('#students .table-wrap');
 if(studentTable) studentTable.innerHTML='<table><thead><tr><th>Student name</th><th>Email address</th><th>Halaqa</th><th>Programme</th><th>Learning level</th><th>Attendance</th><th>Assessment score</th><th>Action</th></tr></thead><tbody>'+
 enrollments.map(e=>{const p=peopleById.get(e.student_id)||{};const records=attendance.filter(a=>a.student_id===e.student_id&&a.halaqa_id===e.halaqa_id);const rate=records.length?Math.round(records.filter(a=>['present','late'].includes(a.status)).length/records.length*100)+'%':'—';const level=legacyByStudent.get(e.student_id)?.level||'Qaida';return '<tr><td>'+esc(p.full_name||'Student')+'</td><td>'+esc(p.email||'')+'</td><td>'+esc(halaqaById.get(e.halaqa_id)?.name||'—')+'</td><td>'+esc(e.programme||'—')+'</td><td>'+esc(level)+'</td><td>'+rate+'</td><td><input type="number" min="0" max="100" step="0.01" aria-label="Assessment score for '+esc(p.full_name||'student')+'" data-assessment-score="'+e.id+'" style="width:88px" placeholder="0–100"></td><td><button class="primary-btn" type="button" data-record-assessment="'+e.id+'">Submit assessment</button></td></tr>';}).join('')+'</tbody></table><p id="abla-assessment-message" role="status">Assessment recommendations are sent to URWA administration for review. Current levels do not change until approved.</p>';
 studentTable?.querySelectorAll('[data-record-assessment]').forEach(button=>button.addEventListener('click',async()=>{
  button.disabled=true;
  try{
   const enrollmentId=button.dataset.recordAssessment;
   const score=Number($('[data-assessment-score="'+enrollmentId+'"]',studentTable)?.value);
   if(!Number.isFinite(score)||score<0||score>100)throw new Error('Enter an assessment score between 0 and 100.');
   const {data:assessmentId,error}=await supabase.rpc('record_learning_assessment',{target_enrollment_id:enrollmentId,assessment_score:score,assessment_notes:null,assessment_day:new Date().toISOString().slice(0,10)});
   if(error)throw error;
   say($('#abla-assessment-message'),'Assessment saved and sent to administration for review.');
   $('[data-assessment-score="'+enrollmentId+'"]',studentTable).value='';
  }catch(e){say($('#abla-assessment-message'),e.message,true);}finally{button.disabled=false;}
 }));
 const attendancePanel=$('#attendance .panel');
 if(attendancePanel){
  attendancePanel.innerHTML='<div class="panel-heading"><h2>Record Attendance</h2></div><div class="form-group"><label for="attendance-date">Class date</label><input type="date" id="attendance-date" value="'+new Date().toISOString().slice(0,10)+'"></div><div class="table-wrap" id="abla-attendance-roster"></div><button class="primary-btn" type="button" id="abla-save-attendance">Save attendance</button><p id="abla-attendance-message" role="status"></p>';
  const roster=$('#abla-attendance-roster');
  $('#attendance-date').value ||= new Date().toISOString().slice(0,10);
  const renderAttendanceRoster=()=>{
   const classDate=$('#attendance-date').value;
   roster.innerHTML='<table><thead><tr><th>Student</th><th>Level</th><th>Abla</th><th>Halaqa</th><th>Attendance status</th></tr></thead><tbody>'+enrollments.map(e=>{
    const existing=attendance.find(a=>a.student_id===e.student_id&&a.halaqa_id===e.halaqa_id&&a.class_date===classDate);
    const status=existing?.status||'present';
    return '<tr data-student="'+e.student_id+'" data-halaqa="'+e.halaqa_id+'"><td><strong>'+esc(peopleById.get(e.student_id)?.full_name||'Student')+'</strong></td><td>'+esc(e.level||'—')+'</td><td>'+esc(profile.full_name||'Abla')+'</td><td>'+esc(halaqaById.get(e.halaqa_id)?.name||'')+'</td><td><select data-status aria-label="Attendance for '+esc(peopleById.get(e.student_id)?.full_name||'student')+'"><option value="present" '+(status==='present'?'selected':'')+'>Present</option><option value="absent" '+(status==='absent'?'selected':'')+'>Absent</option><option value="excused" '+(status==='excused'?'selected':'')+'>Excused</option></select></td></tr>';
   }).join('')+'</tbody></table>';
  };
  renderAttendanceRoster();
  $('#attendance-date').addEventListener('change',renderAttendanceRoster);
  $('#abla-save-attendance').addEventListener('click',async()=>{
   const button=$('#abla-save-attendance');button.disabled=true;
   try{
    const classDate=$('#attendance-date').value;
    const rows=$$('[data-student]','#abla-attendance-roster');
    const records=rows.map(row=>({halaqa_id:row.dataset.halaqa,student_id:row.dataset.student,class_date:classDate,status:$('[data-status]',row).value,recorded_by:user.id}));
    if(!classDate||!records.length)throw new Error('Choose a class date and ensure your roster is available.');
    const {error}=await supabase.from('attendance').upsert(records,{onConflict:'halaqa_id,student_id,class_date'});
    if(error)throw error;say($('#abla-attendance-message'),'Attendance saved successfully.');
   }catch(e){say($('#abla-attendance-message'),e.message,true);}finally{button.disabled=false;}
  });
 }
 const timetablePanel=$('#timetable .panel');
 if(timetablePanel){
  timetablePanel.innerHTML='<div class="panel-heading"><h2>Create class timetable</h2></div>'+
   '<form id="abla-timetable-form"><div class="form-grid">'+
   '<div class="form-group"><label for="tt-halaqa">Halaqa</label><select id="tt-halaqa" required><option value="">Choose Halaqa</option>'+halaqas.map(h=>'<option value="'+h.id+'">'+esc(h.name)+'</option>').join('')+'</select></div>'+
   '<div class="form-group"><label for="tt-title">Class / session title</label><input id="tt-title" required placeholder="e.g. Qur’an memorisation"></div>'+
   '<div class="form-group"><label for="tt-day">Day</label><select id="tt-day" required>'+['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=>'<option>'+d+'</option>').join('')+'</select></div>'+
   '<div class="form-group"><label for="tt-start">Start time</label><input id="tt-start" type="time" required></div>'+
   '<div class="form-group"><label for="tt-end">End time</label><input id="tt-end" type="time" required></div>'+
   '<div class="form-group"><label for="tt-location">Location / platform</label><input id="tt-location" placeholder="Online / venue"></div>'+
   '<div class="form-group"><label for="tt-link">Meeting link</label><input id="tt-link" type="url" placeholder="https://..."></div></div>'+
   '<div class="form-group"><label for="tt-notes">Lesson notes (optional)</label><textarea id="tt-notes" placeholder="What students should prepare"></textarea></div>'+
   '<button class="primary-btn" type="submit">Publish timetable session</button><p id="abla-timetable-message" role="status"></p></form>'+
   '<div class="panel-heading" style="margin-top:22px"><h2>Published timetable</h2></div><div id="abla-timetable-list" class="table-wrap">Loading timetable…</div>';
  const form=$('#abla-timetable-form');
  const renderTimetable=async()=>{
   const {data,error}=await supabase.from('halaqa_timetable').select('*').in('halaqa_id',halaqaIds).eq('is_active',true).order('day_of_week').order('start_time');
   if(error)throw error;
   $('#abla-timetable-list').innerHTML=(data||[]).length?'<table><thead><tr><th>Day</th><th>Time</th><th>Halaqa</th><th>Session</th><th>Details</th><th></th></tr></thead><tbody>'+(data||[]).map(x=>'<tr><td>'+esc(x.day_of_week)+'</td><td>'+esc(String(x.start_time).slice(0,5))+'–'+esc(String(x.end_time).slice(0,5))+'</td><td>'+esc(halaqaById.get(x.halaqa_id)?.name||'')+'</td><td>'+esc(x.title)+'</td><td>'+esc(x.location||'')+(x.meeting_link?' · <a href="'+esc(x.meeting_link)+'" target="_blank" rel="noopener">Join</a>':'')+'</td><td><button type="button" class="primary-btn" data-delete-timetable="'+x.id+'">Remove</button></td></tr>').join('')+'</tbody></table>':empty('No timetable sessions published yet');
   $('#abla-timetable-list')?.querySelectorAll('[data-delete-timetable]').forEach(btn=>btn.addEventListener('click',async()=>{
    btn.disabled=true;
    const {error}=await supabase.from('halaqa_timetable').update({is_active:false}).eq('id',btn.dataset.deleteTimetable);
    if(error){say($('#abla-timetable-message'),error.message,true);btn.disabled=false;return;}
    await renderTimetable();
   }));
  };
  form.addEventListener('submit',async event=>{
   event.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;
   try{
    const payload={teacher_id:user.id,halaqa_id:$('#tt-halaqa').value,title:$('#tt-title').value.trim(),day_of_week:$('#tt-day').value,start_time:$('#tt-start').value,end_time:$('#tt-end').value,location:$('#tt-location').value.trim()||null,meeting_link:$('#tt-link').value.trim()||null,notes:$('#tt-notes').value.trim()||null};
    if(payload.end_time<=payload.start_time)throw new Error('End time must be later than start time.');
    const {error}=await supabase.from('halaqa_timetable').insert(payload);
    if(error)throw error;
    say($('#abla-timetable-message'),'Timetable session published for your students.');
    form.reset();await renderTimetable();
   }catch(e){say($('#abla-timetable-message'),e.message,true);}finally{button.disabled=false;}
  });
  await renderTimetable();
 }
 const assignmentForm=$('#assignments form');
 if(assignmentForm){
  const select=document.createElement('select');select.id='abla-assignment-halaqa';select.required=true;
  select.innerHTML='<option value="">Choose halaqa</option>'+halaqas.map(h=>'<option value="'+h.id+'">'+esc(h.name)+'</option>').join('');
  const group=document.createElement('div');group.className='form-group';group.innerHTML='<label for="abla-assignment-halaqa">Halaqa</label>';group.append(select);
  assignmentForm.querySelector('.form-grid')?.prepend(group);
  const button=assignmentForm.querySelector('button');
  button.type='submit';button.textContent='Publish Assignment';
  const notice=document.createElement('p');notice.id='abla-assignment-message';notice.setAttribute('role','status');assignmentForm.append(notice);
  assignmentForm.addEventListener('submit',async event=>{
   event.preventDefault();button.disabled=true;
   try{
    const halaqaId=select.value,title=$('#assignment-title').value.trim();
    if(!halaqaId||!title)throw new Error('Choose a halaqa and enter an assignment title.');
    const {error}=await supabase.from('assignments').insert({halaqa_id:halaqaId,teacher_id:user.id,title,assignment_type:$('#assignment-type').value,instructions:$('#assignment-instructions').value.trim()||null,due_date:$('#assignment-due').value||null});
    if(error)throw error;say(notice,'Assignment published successfully.');assignmentForm.reset();
   }catch(e){say(notice,e.message,true);}finally{button.disabled=false;}
  });
 }
 const assignmentRows=(assignmentsQ.data||[]).map(a=>'<div class="activity"><div class="date-box">▤</div><div><strong>'+esc(a.title)+'</strong><small>'+esc(a.assignment_type||'Assignment')+' · '+esc(halaqaById.get(a.halaqa_id)?.name||'')+' · Due '+dateLabel(a.due_date)+'</small></div></div>').join('');
 const subPanel=$('#submissions .panel');
 if(subPanel) subPanel.innerHTML='<div class="panel-heading"><h2>Student Submissions</h2></div>'+(submissions.length?submissions.map(s=>'<article class="activity"><div class="date-box">⇧</div><div style="flex:1"><strong>'+esc(peopleById.get(s.student_id)?.full_name||'Student')+' · '+esc((assignmentsQ.data||[]).find(a=>a.id===s.assignment_id)?.title||'Assignment')+'</strong><small>'+new Date(s.submitted_at).toLocaleString()+'</small><p>'+esc(s.content||'File submission')+'</p><label>Feedback<textarea data-feedback="'+s.id+'" rows="2">'+esc(s.feedback||'')+'</textarea></label><button class="primary-btn" data-review="'+s.id+'" type="button">Save feedback</button></div></article>').join(''):empty('No student submissions yet'));
 subPanel?.querySelectorAll('[data-review]').forEach(button=>button.addEventListener('click',async()=>{
  button.disabled=true;try{const id=button.dataset.review;const feedback=$('[data-feedback="'+id+'"]',subPanel).value.trim();const {error}=await supabase.from('submissions').update({feedback,reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq('id',id);if(error)throw error;say(button.parentElement,'Feedback saved.');}catch(e){say(button.parentElement,e.message,true);}finally{button.disabled=false;}
 }));
 const progressPanel=$('#progress .panel');
 if(progressPanel){
  const [hifdhQ,murajaahQ]=await Promise.all([
   studentIds.length?supabase.from('hifdh_records').select('student_id,surah,juz,recorded_on').in('student_id',studentIds).order('recorded_on',{ascending:false}):Promise.resolve({data:[],error:null}),
   studentIds.length?supabase.from('murajaah_records').select('student_id,surah,juz,completed_on').in('student_id',studentIds).order('completed_on',{ascending:false}):Promise.resolve({data:[],error:null})
  ]);
  if(hifdhQ.error)throw hifdhQ.error;if(murajaahQ.error)throw murajaahQ.error;
  progressPanel.innerHTML='<div class="panel-heading"><h2>Hifdh &amp; Muraja’ah Progress</h2></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Latest Hifdh</th><th>Latest Muraja’ah</th></tr></thead><tbody>'+studentIds.map(id=>{const h=(hifdhQ.data||[]).find(x=>x.student_id===id);const m=(murajaahQ.data||[]).find(x=>x.student_id===id);return '<tr><td>'+esc(peopleById.get(id)?.full_name||'Student')+'</td><td>'+esc(h?(h.surah||'Juz '+(h.juz||'')):'—')+'</td><td>'+esc(m?(m.surah||'Juz '+(m.juz||'')):'—')+'</td></tr>';}).join('')+'</tbody></table></div>';
 }
 const announcementsPanel=$('#announcements .panel');
 if(announcementsPanel){const rows=(announcementsQ.data||[]).filter(a=>!a.halaqa_id||halaqaIds.includes(a.halaqa_id));announcementsPanel.innerHTML='<div class="panel-heading"><h2>Announcements</h2></div>'+(rows.length?rows.map(a=>'<article class="activity"><div class="date-box">✦</div><div><strong>'+esc(a.title)+'</strong><small>'+dateLabel(a.published_at?.slice(0,10))+'</small><p>'+esc(a.message)+'</p></div></article>').join(''):empty('No announcements yet'));}
 const schedule=$('.right-column .calendar-panel .empty');if(schedule)schedule.innerHTML='<strong>Timetable not configured</strong><br>Your class times will appear here once URWA adds timetable records.';
 say(statusNode,'Connected to Supabase · '+halaqas.length+' halaqa(s) · '+totalStudents+' approved students · '+totalAttendance+' attendance records.');
}
boot().catch(error=>{
 console.error('[URWA Abla dashboard]',error);
 let node=$('#abla-live-status');
 if(!node){node=document.createElement('p');node.id='abla-live-status';$('.page-title')?.after(node);}
 say(node,'Dashboard could not load: '+(error.message||'Unknown error'),true);
});
