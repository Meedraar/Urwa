import { supabase } from './supabase.js';
import './halaqa-messaging.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const date = (value) => value ? new Date(value).toLocaleDateString() : '—';
const status = (id, title, message, bad = false) => {
  const node = document.getElementById(id);
  if (!node) return;
  node.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = title;
  const detail = document.createElement('p');
  detail.textContent = message;
  node.append(heading, detail);
  node.classList.toggle('is-error', bad);
};
const fail = (error) => { throw new Error(error?.message || 'The request could not be completed.'); };

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) fail(error);
  if (!data.user) throw new Error('Please sign in again.');
  return data.user;
}

async function adminLoad(user) {
  try {
    const [peopleQ, enrollQ, halaqaQ, assignmentQ, attendanceQ, teacherAppsQ] = await Promise.all([
      supabase.from('profiles').select('id,full_name,email,role,status,admin_level,created_at'),
      supabase.from('student_enrollments').select('*'),
      supabase.from('halaqas').select('*').order('name'),
      supabase.from('teacher_assignments').select('*'),
      supabase.from('attendance').select('id,status'),
      supabase.from('teacher_applications').select('id,area_of_interest,teaching_background,availability')
    ]);
    [peopleQ, enrollQ, halaqaQ, assignmentQ, attendanceQ, teacherAppsQ].forEach(q => { if (q.error) fail(q.error); });
    const people = peopleQ.data || [], enroll = enrollQ.data || [], halaqas = halaqaQ.data || [];
    const assignments = assignmentQ.data || [], attendance = attendanceQ.data || [], teacherApps = teacherAppsQ.data || [];
    const students = people.filter(p => p.role === 'student');
    const teachers = people.filter(p => p.role === 'teacher');
    const byStudent = new Map(enroll.map(e => [e.student_id, e]));
    const byId = new Map(people.map(p => [p.id, p]));
    const byHalaqa = new Map(halaqas.map(h => [h.id, h]));
    const announcementTarget = $('#announcement-halaqa');
    if (announcementTarget) announcementTarget.innerHTML = '<option value="">All selected audiences</option>' + halaqas.filter(h => h.is_active).map(h => '<option value="' + h.id + '">' + esc(h.name) + '</option>').join('');
    const options = (selected) => '<option value="">Choose halaqa</option>' +
      halaqas.filter(h => h.is_active).map(h => '<option value="' + h.id + '" ' +
      (h.id === selected ? 'selected' : '') + '>' + esc(h.name) + '</option>').join('');
    
    const put = (selector, html, empty) => { const node = $(selector); if (node) node.innerHTML = html || empty; };

    const accountRows = people.map(p => {
      const enrollment = byStudent.get(p.id);
      const accountStatus = enrollment?.status || p.status || 'pending';
      const roleLabel = p.role === 'teacher' ? 'Educator' : p.role === 'admin' ? 'Administrator' : p.role === 'department_member' ? 'Department Applicant / Member' : 'Student';
      return '<tr><td><b>' + esc(p.full_name || '—') + '</b></td><td>' + esc(p.email || '—') +
        '</td><td>' + roleLabel + '</td><td>' + esc(accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1)) +
        '</td><td>' + date(p.created_at) + '</td></tr>';
    }).join('');
    put('#admin-account-status-body', accountRows, '<tr><td colspan="5">No accounts found.</td></tr>');

    const pending = students.filter(p => (byStudent.get(p.id)?.status || p.status) === 'pending');

    put('#admin-admissions-body', pending.map(p => {
      const e = byStudent.get(p.id) || {};
      return '<tr><td><b>' + esc(p.full_name) + '</b><small>' + esc(p.email) +
        '</small></td><td>' + esc(e.programme || '—') + '</td><td>' + date(e.created_at) +
        '</td><td>Pending</td><td class="urwa-admin-actions"><select data-admission-halaqa="' +
        p.id + '">' + options(e.halaqa_id) + '</select><button class="urwa-btn urwa-btn-primary urwa-btn-small" data-accept="' +
        p.id + '">Accept</button><button class="urwa-btn urwa-btn-outline urwa-btn-small" data-decline="' +
        p.id + '">Decline</button></td></tr>';
    }).join(''), '<tr><td colspan="5">No pending student applications.</td></tr>');

    const pendingTeachers = teachers.filter(p => p.status === 'pending');
    const pendingDepartmentApplicants = people.filter(p => p.role === 'department_member' && p.status === 'pending');
    const studentCountNode = $('#admin-total-students');
    if (studentCountNode) studentCountNode.textContent = String(students.filter(p => (byStudent.get(p.id)?.status || p.status) === 'approved').length);
    const ablaCountNode = $('#admin-total-ablas');
    if (ablaCountNode) ablaCountNode.textContent = String(teachers.filter(p => p.status === 'approved').length);
    const departmentCountNode = $('#admin-total-department');
    if (departmentCountNode) departmentCountNode.textContent = String(people.filter(p => p.role === 'department_member' && p.status === 'approved').length);
    const applicationCountNode = $('#admin-new-applications');
    if (applicationCountNode) applicationCountNode.textContent = String(pending.length + pendingTeachers.length + pendingDepartmentApplicants.length);
    const studentPendingLabel = $('#admin-student-pending-label');
    if (studentPendingLabel) studentPendingLabel.textContent = pending.length + ' pending';
    const ablaPendingLabel = $('#admin-abla-pending-label');
    if (ablaPendingLabel) ablaPendingLabel.textContent = pendingTeachers.length + ' pending';
    put('#admin-students-body', students.map(p => {
      const e = byStudent.get(p.id) || {}, h = byHalaqa.get(e.halaqa_id);
      const ta = assignments.find(a => a.halaqa_id === e.halaqa_id);
      const teacher = ta ? byId.get(ta.teacher_id) : null;
      return '<tr><td><b>' + esc(p.full_name) + '</b><small>' + esc(p.email) +
        '</small></td><td>' + esc(e.programme || '—') + '</td><td>' +
        esc(h?.name || 'Not assigned') + '</td><td>' + esc(teacher?.full_name || 'Not assigned') +
        '</td><td>' + esc(e.status || p.status) + '</td></tr>';
    }).join(''), '<tr><td colspan="5">No student accounts yet.</td></tr>');

    put('#admin-teachers-body', teachers.map(p => {
      const application = teacherApps.find(a => a.id === p.id) || {};
      const assigned = assignments.filter(a => a.teacher_id === p.id);
      const names = assigned.map(a => byHalaqa.get(a.halaqa_id)?.name).filter(Boolean);
      const learnerCount = enroll.filter(e => e.status === 'approved' &&
        assigned.some(a => a.halaqa_id === e.halaqa_id)).length;
      return '<tr><td><b>' + esc(p.full_name) + '</b><small>' + esc(p.email) +
        '</small></td><td>' + esc(application.area_of_interest || 'Not specified') +
        (application.teaching_background ? '<small>' + esc(application.teaching_background) + '</small>' : '') +
        '</td><td>' + esc(names.join(', ') || 'Not assigned') +
        '</td><td>' + learnerCount + '</td><td>' + esc(p.status) +
        (p.status === 'pending' ? ' <button class="urwa-btn urwa-btn-primary urwa-btn-small" data-approve-teacher="' + p.id + '">Approve</button><button class="urwa-btn urwa-btn-outline urwa-btn-small" data-cancel-teacher="' + p.id + '">Cancel</button>' : '') +
        '<div class="urwa-admin-actions"><select data-teacher-halaqa="' + p.id + '">' +
        options('') + '</select><button class="urwa-btn urwa-btn-outline urwa-btn-small" data-assign="' +
        p.id + '">Assign</button></div></td></tr>';
    }).join(''), '<tr><td colspan="5">No educator accounts. Educator accounts must be created through a trusted administrator workflow.</td></tr>');

    const stats = $('.admin-kpi .urwa-stat-value');
    if (stats[0]) stats[0].textContent = students.filter(p => (byStudent.get(p.id)?.status || p.status) === 'approved').length;
    if (stats[1]) stats[1].textContent = teachers.filter(p => p.status === 'approved').length;
    if (stats[2]) stats[2].textContent = pending.length;
    if (stats[3]) stats[3].textContent = halaqas.filter(h => h.is_active).length;
    if (stats[4]) stats[4].textContent = attendance.length
      ? Math.round(attendance.filter(a => ['present', 'late'].includes(a.status)).length / attendance.length * 100) + '%' : '—';
    // Populate the detailed admin dashboard from the same live Supabase records.
    const approvedEnrollments = enroll.filter(e => e.status === 'approved');
    const programmeCounts = new Map();
    approvedEnrollments.forEach(e => {
      const name = (e.programme || 'Programme not specified').trim();
      programmeCounts.set(name, (programmeCounts.get(name) || 0) + 1);
    });
    const programmeEntries = [...programmeCounts.entries()].sort((a,b) => b[1]-a[1]).slice(0,6);
    put('#admin-programme-management-body', [...programmeCounts.entries()].sort((a,b) => a[0].localeCompare(b[0])).map(([name,count]) =>
      '<tr><td>' + esc(name) + '</td><td>—</td><td>—</td><td>' + count + '</td><td><span class="status">Active</span></td></tr>'
    ).join(''), '<tr><td colspan="5">No programme enrolments have been recorded yet.</td></tr>');
    const maxProgramme = Math.max(1, ...programmeEntries.map(x => x[1]));
    put('#admin-programme-chart', programmeEntries.length ? programmeEntries.map(([name,count]) =>
      '<div class="admin-bar-item"><strong>' + count + '</strong><div class="admin-bar-track"><i class="admin-bar-fill" style="height:' +
      Math.max(5, Math.round(count/maxProgramme*100)) + '%"></i></div><small title="' + esc(name) + '">' + esc(name) + '</small></div>'
    ).join('') : '<p class="admin-empty">No approved programme enrolments to chart yet.</p>');
    const renderHalaqaRow = (h, includeAction = false) => {
      const assigned = assignments.filter(a => a.halaqa_id === h.id);
      const studentCount = approvedEnrollments.filter(e => e.halaqa_id === h.id).length;
      const teacherNames = assigned.map(a => byId.get(a.teacher_id)?.full_name).filter(Boolean);
      const statusLabel = h.is_active ? 'Active' : 'Inactive';
      return '<tr><td><b>' + esc(h.name) + '</b></td><td>' + esc(teacherNames.join(', ') || 'Not assigned') +
        '</td><td>' + studentCount + '</td><td><span class="admin-mini-status">' + statusLabel + '</span></td>' +
        (includeAction ? '<td><a class="urwa-btn urwa-btn-outline urwa-btn-small" href="../departments/index.html">Manage</a></td>' : '') + '</tr>';
    };
    const halaqaRows = halaqas.map(h => renderHalaqaRow(h)).join('');
    put('#admin-halaqa-overview', halaqaRows, '<tr><td colspan="4">No halaqas configured yet.</td></tr>');
    put('#admin-halaqa-management-body', halaqas.map(h => renderHalaqaRow(h, true)).join(''),
      '<tr><td colspan="5">No halaqas configured yet.</td></tr>');
    const activeHalaqaCount = halaqas.filter(h => h.is_active).length;
    const totalHalaqaNode = $('#admin-halaqa-total'); if (totalHalaqaNode) totalHalaqaNode.textContent = String(halaqas.length);
    const activeHalaqaNode = $('#admin-halaqa-active'); if (activeHalaqaNode) activeHalaqaNode.textContent = String(activeHalaqaCount);
    const upcomingHalaqaNode = $('#admin-halaqa-upcoming'); if (upcomingHalaqaNode) upcomingHalaqaNode.textContent = String(halaqas.filter(h => String(h.status || '').toLowerCase() === 'upcoming').length);
    const completedHalaqaNode = $('#admin-halaqa-completed'); if (completedHalaqaNode) completedHalaqaNode.textContent = String(halaqas.filter(h => String(h.status || '').toLowerCase() === 'completed').length);
    const halaqaSummary = $('#admin-halaqa-summary');
    if (halaqaSummary) halaqaSummary.textContent = 'Manage all ' + activeHalaqaCount + ' active halaqas, their assigned educators and enrolled students.';
    const halaqaBadge = $('#admin-halaqa-badge');
    if (halaqaBadge) halaqaBadge.textContent = activeHalaqaCount + ' active halaqas';
    const recentPeople = [...people].sort((a,b) => new Date(b.created_at || 0)-new Date(a.created_at || 0)).slice(0,5);
    put('#admin-recent-activity', recentPeople.map(p => {
      const role = p.role === 'teacher' ? 'Educator' : p.role === 'admin' ? 'Administrator' : p.role === 'department_member' ? 'Department Applicant / Member' : 'Student';
      const initials = (p.full_name || 'U').split(/\s+/).slice(0,2).map(x => x[0]).join('').toUpperCase();
      return '<div class="admin-activity-row"><span class="admin-activity-avatar">' + esc(initials) +
        '</span><div><b>' + esc(p.full_name || 'New account') + '</b><small>' + role + ' · ' +
        (p.created_at ? date(p.created_at) : 'Registration date unavailable') + '</small></div></div>';
    }).join(''), '<p class="admin-empty">No registrations to show yet.</p>');
    const presentCount = attendance.filter(a => ['present','late'].includes(a.status)).length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const otherCount = attendance.length - presentCount - absentCount;
    const attendanceRate = attendance.length ? Math.round(presentCount / attendance.length * 100) : 0;
    const donut = $('#admin-attendance-donut');
    if (donut) donut.style.background = 'conic-gradient(#2676dd 0 ' + attendanceRate + '%,#e16a72 ' +
      attendanceRate + '% ' + (attendance.length ? Math.round((presentCount+absentCount)/attendance.length*100) : 0) + '%,#edf1f6 0 100%)';
    const textValue = (selector,value) => { const node = $(selector); if (node) node.textContent = value; };
    textValue('#admin-attendance-percent', attendance.length ? attendanceRate + '%' : '—');
    textValue('#admin-admission-received', enroll.length);
    textValue('#admin-admission-approved', approvedEnrollments.length);
    textValue('#admin-admission-rate', enroll.length ? Math.round(approvedEnrollments.length / enroll.length * 100) + '%' : '—');
    textValue('#admin-attendance-present', presentCount);
    textValue('#admin-attendance-absent', absentCount);
    textValue('#admin-attendance-other', otherCount);
    textValue('#admin-attendance-present-module', presentCount);
    textValue('#admin-attendance-absent-module', absentCount);
    textValue('#admin-attendance-other-module', otherCount);
    textValue('#admin-attendance-rate-module', attendance.length ? attendanceRate + '%' : '—');
    textValue('#admin-report-students', students.filter(p => (byStudent.get(p.id)?.status || p.status) === 'approved').length);
    textValue('#admin-report-ablas', teachers.filter(p => p.status === 'approved').length);
    textValue('#admin-report-pending', pending.length + pendingTeachers.length + pendingDepartmentApplicants.length);
    textValue('#admin-report-halaqas', halaqas.length);
    put('#admin-programmes-module-body', [...programmeCounts.entries()].sort((a,b) => a[0].localeCompare(b[0])).map(([name,count]) =>
      '<tr><td>' + esc(name) + '</td><td>' + count + '</td></tr>'
    ).join(''), '<tr><td colspan="2">No approved programme enrolments recorded.</td></tr>');
    textValue('#admin-pending-count', pending.length);
    textValue('#admin-teacher-pending', teachers.filter(p => p.status === 'pending').length);
    textValue('#admin-unassigned-count', approvedEnrollments.filter(e => !e.halaqa_id).length);

    const adminAccounts = people.filter(p => p.role === 'admin');
    const currentProfile = people.find(p => p.id === user.id);
    const isSuperAdmin = currentProfile?.admin_level === 'super_admin';
    const adminPanel = $('#super-admin-management');
    if (adminPanel) adminPanel.hidden = !isSuperAdmin;
    const adminRows = adminAccounts.map(p => {
      const level = p.admin_level || 'standard';
      const action = p.id === user.id
        ? '<span class="urwa-badge info">Current account</span>'
        : '<button class="urwa-btn urwa-btn-outline urwa-btn-small" data-admin-level="' + p.id +
          '" data-next-level="' + (level === 'super_admin' ? 'standard' : 'super_admin') + '">' +
          (level === 'super_admin' ? 'Make Standard Admin' : 'Grant Super Admin') + '</button>';
      return '<tr><td><b>' + esc(p.full_name || '—') + '</b></td><td>' + esc(p.email || '—') +
        '</td><td>' + (level === 'super_admin' ? 'Super Admin' : 'Standard Admin') +
        '</td><td>' + esc(p.status) + '</td><td>' + action + '</td></tr>';
    }).join('');
    put('#super-admin-list', adminRows, '<tr><td colspan="5">No administrator accounts found.</td></tr>');
    document.querySelectorAll('[data-admin-level]').forEach(button => {
      button.hidden = !isSuperAdmin;
    });
    status('admin-live-status', 'Supabase connection active',
      (isSuperAdmin ? 'Super Admin access · ' : 'Standard Admin access · ') +
      students.length + ' students · ' + pending.length + ' pending applications · ' +
      teachers.length + ' educators · ' + halaqas.length + ' halaqas.');
  } catch (error) {
    status('admin-live-status', 'Unable to load URWA records', error.message, true);
  }
}

async function initAdmin(user) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,role,status,admin_level')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) fail(profileError);
  if (!profile || profile.role !== 'admin' || profile.status !== 'approved') {
    await supabase.auth.signOut();
    window.location.replace('/portal/admin/login.html');
    return;
  }
  await adminLoad(user);
  document.addEventListener('click', async (event) => {
    try {
      const accept = event.target.closest('[data-accept]');
      const decline = event.target.closest('[data-decline]');
      const approve = event.target.closest('[data-approve-teacher]');
      const cancelTeacher = event.target.closest('[data-cancel-teacher]');
      const assign = event.target.closest('[data-assign]');
      const adminLevel = event.target.closest('[data-admin-level]');
      if (accept || decline) {
        const id = (accept || decline).dataset[accept ? 'accept' : 'decline'];
        const halaqaId = $('[data-admission-halaqa="' + id + '"]')?.value || null;
        if (accept && !halaqaId) throw new Error('Choose a halaqa before accepting.');
        const next = accept ? 'approved' : 'cancelled';
        const { error } = await supabase.from('student_enrollments').update({
          status: next, halaqa_id: halaqaId, reviewed_by: user.id, reviewed_at: new Date().toISOString()
        }).eq('student_id', id);
        if (error) fail(error);
        const profileUpdate = await supabase.from('profiles').update({ status: next }).eq('id', id);
        if (profileUpdate.error) fail(profileUpdate.error);
        await adminLoad(user);
      }
      if (approve || cancelTeacher) {
        const teacherId = approve ? approve.dataset.approveTeacher : cancelTeacher.dataset.cancelTeacher;
        const nextStatus = approve ? 'approved' : 'cancelled';
        const { error } = await supabase.from('profiles').update({ status: nextStatus }).eq('id', teacherId);
        if (error) fail(error);
        await adminLoad(user);
      }
      if (adminLevel) {
        const targetId = adminLevel.dataset.adminLevel;
        const nextLevel = adminLevel.dataset.nextLevel;
        const confirmed = window.confirm('Change this administrator to ' +
          (nextLevel === 'super_admin' ? 'Super Admin' : 'Standard Admin') + '?');
        if (!confirmed) return;
        const { error } = await supabase.rpc('admin_set_admin_level', {
          target_user_id: targetId,
          new_level: nextLevel
        });
        if (error) fail(error);
        await adminLoad(user);
      }
      if (assign) {
        const teacherId = assign.dataset.assign;
        const halaqaId = $('[data-teacher-halaqa="' + teacherId + '"]')?.value;
        if (!halaqaId) throw new Error('Choose a halaqa.');
        const { error } = await supabase.from('teacher_assignments').upsert({ teacher_id: teacherId, halaqa_id: halaqaId }, { onConflict: 'teacher_id,halaqa_id', ignoreDuplicates: true });
        if (error) fail(error);
        await adminLoad(user);
      }
    } catch (error) { status('admin-live-status', 'Could not save change', error.message, true); }
  });

  const form = $('#admin-announcement-form');
  if (form) form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const { error } = await supabase.from('announcements').insert({
        title: $('#announcement-title').value.trim(),
        message: $('#announcement-message').value.trim(),
        audience: $('#announcement-audience').value,
        halaqa_id: $('#announcement-halaqa')?.value || null,
        published_by: user.id
      });
      if (error) fail(error);
      form.reset();
      status('admin-live-status', 'Announcement published', 'Your announcement has been saved to Supabase.');
    } catch (error) { status('admin-live-status', 'Announcement failed', error.message, true); }
  });
}

async function studentLoad(user) {
  const [enrollmentQ, attendanceQ, assignmentQ, hifdhQ, murajaahQ] = await Promise.all([
    supabase.from('student_enrollments').select('*').eq('student_id', user.id).maybeSingle(),
    supabase.from('attendance').select('status').eq('student_id', user.id),
    supabase.from('assignments').select('*').order('created_at', { ascending: false }),
    supabase.from('hifdh_records').select('id').eq('student_id', user.id),
    supabase.from('murajaah_records').select('id').eq('student_id', user.id)
  ]);
  [enrollmentQ, attendanceQ, assignmentQ, hifdhQ, murajaahQ].forEach(q => { if (q.error) fail(q.error); });
  const enrollment = enrollmentQ.data || {};
  const assignments = (assignmentQ.data || []).filter(a => a.halaqa_id === enrollment.halaqa_id);
  let halaqaName = 'Not assigned';
  if (enrollment.halaqa_id) {
    const { data, error } = await supabase.from('halaqas').select('name').eq('id', enrollment.halaqa_id).maybeSingle();
    if (error) fail(error);
    if (data) halaqaName = data.name;
  }
  const announcementsQ = await supabase.from('announcements').select('id,title,message,audience,halaqa_id,published_at').or('audience.eq.all,audience.eq.students').order('published_at', { ascending: false });
  if (announcementsQ.error) fail(announcementsQ.error);
  const visibleAnnouncements = (announcementsQ.data || []).filter(x => !x.halaqa_id || x.halaqa_id === enrollment.halaqa_id);
  const renderFeed = items => items.length ? items.map(x => '<article class="urwa-announcement-item"><div class="urwa-announcement-meta">' + date(x.published_at) + (x.halaqa_id ? ' · Your level' : ' · URWA') + '</div><h4>' + esc(x.title) + '</h4><p>' + esc(x.message) + '</p></article>').join('') : '<div class="urwa-empty"><strong>No updates yet</strong>New messages from URWA will appear here.</div>';
  const communityFeed = $('#student-community-feed'); if (communityFeed) communityFeed.innerHTML = renderFeed(visibleAnnouncements.filter(x => x.halaqa_id));
  const announcementFeed = $('#student-announcements-feed'); if (announcementFeed) announcementFeed.innerHTML = renderFeed(visibleAnnouncements);
  const panel = $('#student-assignments-list');
  if (panel) panel.innerHTML = assignments.length ? assignments.map(a =>
    '<article><b>' + esc(a.title) + '</b><p>' + esc(a.assignment_type || 'Learning task') +
    ' · Due ' + date(a.due_date) + '</p><p>' + esc(a.instructions || 'Follow your educator’s instructions.') +
    '</p></article>').join('') : '<b>No assignments yet</b><p>Your educator’s assignments will appear here.</p>';
  const attendance = attendanceQ.data || [];
  const rate = attendance.length ? Math.round(attendance.filter(a => ['present', 'late'].includes(a.status)).length / attendance.length * 100) + '%' : 'No records';
  status('student-live-overview', 'Your live learning overview',
    (enrollment.programme || 'Programme awaiting confirmation') + ' · ' + halaqaName +
    ' · Admission: ' + (enrollment.status || 'not submitted') + ' · Attendance: ' + rate +
    ' · Assignments: ' + assignments.length + ' · Hifdh entries: ' + hifdhQ.data.length +
    ' · Muraja’ah entries: ' + murajaahQ.data.length);
}

async function teacherLoad(user) {
  const [assignmentLinksQ, assignmentsQ] = await Promise.all([
    supabase.from('teacher_assignments').select('*').eq('teacher_id', user.id),
    supabase.from('assignments').select('*').eq('teacher_id', user.id)
  ]);
  [assignmentLinksQ, assignmentsQ].forEach(q => { if (q.error) fail(q.error); });
  const links = assignmentLinksQ.data || [], halaqaIds = links.map(a => a.halaqa_id);
  let halaqas = [], enrollments = [], attendance = [];
  if (halaqaIds.length) {
    const [h, e, a] = await Promise.all([
      supabase.from('halaqas').select('*').in('id', halaqaIds),
      supabase.from('student_enrollments').select('*').in('halaqa_id', halaqaIds).eq('status', 'approved'),
      supabase.from('attendance').select('*').in('halaqa_id', halaqaIds)
    ]);
    [h, e, a].forEach(q => { if (q.error) fail(q.error); });
    halaqas = h.data || []; enrollments = e.data || []; attendance = a.data || [];
  }
  let studentProfiles = [];
  if (enrollments.length) {
    const { data, error } = await supabase.from('profiles').select('id,full_name,email')
      .in('id', enrollments.map(e => e.student_id));
    if (error) fail(error);
    studentProfiles = data || [];
  }
  const byStudent = new Map(studentProfiles.map(p => [p.id, p]));
  const roster = $('#teacher-attendance-roster');
  if (roster) roster.innerHTML = enrollments.length
    ? '<div class="urwa-table-wrap"><table class="urwa-table"><thead><tr><th>Student</th><th>Halaqa</th><th>Attendance</th></tr></thead><tbody>' +
      enrollments.map(e => {
        const p = byStudent.get(e.student_id) || {};
        return '<tr data-attendance-row="' + e.student_id + '" data-halaqa-id="' + e.halaqa_id +
          '"><td>' + esc(p.full_name || 'Student') + '<small>' + esc(p.email || '') +
          '</small></td><td>' + esc(halaqas.find(h => h.id === e.halaqa_id)?.name || '') +
          '</td><td><select data-attendance-status><option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option><option value="excused">Excused</option></select></td></tr>';
      }).join('') + '</tbody></table></div><button class="urwa-btn urwa-btn-primary urwa-btn-small" type="button" data-save-attendance>Save attendance</button><p id="teacher-attendance-message" role="status"></p>'
    : '<b>No approved students assigned yet.</b>';

  const select = $('#assignment-students');
  if (select) select.innerHTML = '<option value="">Choose your halaqa</option>' +
    halaqas.map(h => '<option value="' + h.id + '">' + esc(h.name) + '</option>').join('');
  const teacherAnnouncementsQ = await supabase.from('announcements').select('id,title,message,audience,halaqa_id,published_at').or('audience.eq.all,audience.eq.teachers').order('published_at', { ascending: false });
  if (teacherAnnouncementsQ.error) fail(teacherAnnouncementsQ.error);
  const teacherFeedItems = (teacherAnnouncementsQ.data || []).filter(x => !x.halaqa_id || halaqaIds.includes(x.halaqa_id));
  const renderTeacherFeed = items => items.length ? items.map(x => '<article class="urwa-announcement-item"><div class="urwa-announcement-meta">' + date(x.published_at) + (x.halaqa_id ? ' · Assigned halaqa' : ' · URWA') + '</div><h4>' + esc(x.title) + '</h4><p>' + esc(x.message) + '</p></article>').join('') : '<div class="urwa-empty"><strong>No updates yet</strong>New messages from URWA will appear here.</div>';
  const communityFeed = $('#teacher-community-feed'); if (communityFeed) communityFeed.innerHTML = renderTeacherFeed(teacherFeedItems.filter(x => x.halaqa_id));
  const announcementFeed = $('#teacher-announcements-feed'); if (announcementFeed) announcementFeed.innerHTML = renderTeacherFeed(teacherFeedItems);
  status('teacher-live-overview', 'Your teaching workspace is connected',
    halaqas.length + ' halaqas · ' + enrollments.length + ' approved students · ' +
    attendance.length + ' attendance records · ' + assignmentsQ.data.length + ' assignments.');

  const form = $('#teacher-assignment-form');
  if (form) form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[type=submit]');
    if (button) button.disabled = true;
    try {
      const halaqaId = select?.value;
      if (!halaqaId) throw new Error('Choose your halaqa first.');
      const { error } = await supabase.from('assignments').insert({
        halaqa_id: halaqaId, teacher_id: user.id,
        title: $('#assignment-title').value.trim(),
        assignment_type: $('#assignment-type').value,
        instructions: $('#assignment-instructions').value.trim(),
        due_date: $('#assignment-due').value || null
      });
      if (error) fail(error);
      $('#teacher-assignment-message').textContent = 'Assignment published.';
      form.reset();
    } catch (error) { $('#teacher-assignment-message').textContent = error.message; }
    finally { if (button) button.disabled = false; }
  });

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-save-attendance]');
    if (!button) return;
    button.disabled = true;
    try {
      const classDate = $('#teacher-attendance-date')?.value || new Date().toISOString().slice(0, 10);
      const records = $$('[data-attendance-row]').map(row => ({
        halaqa_id: row.dataset.halaqaId,
        student_id: row.dataset.attendanceRow,
        class_date: classDate,
        status: $('[data-attendance-status]', row).value,
        recorded_by: user.id
      }));
      if (records.length) {
        const { error } = await supabase.from('attendance').insert(records);
        if (error) fail(error);
      }
      $('#teacher-attendance-message').textContent = 'Attendance saved.';
    } catch (error) { $('#teacher-attendance-message').textContent = error.message; }
    finally { button.disabled = false; }
  });
}

(async () => {
  try {
    const user = await currentUser();
    const role = document.body.dataset.urwaRole;
    if (role === 'admin') await initAdmin(user);
    if (role === 'student') await studentLoad(user);
    if (role === 'teacher') await teacherLoad(user);
  } catch (error) {
    const role = document.body.dataset.urwaRole;
    if (role === 'admin' && /sign in again|not approved|profile is not ready/i.test(error.message || '')) {
      window.location.replace('/portal/admin/login.html');
      return;
    }
    status(role === 'student' ? 'student-live-overview' : role === 'teacher' ? 'teacher-live-overview' : 'admin-live-status',
      'Could not load records', error.message, true);
  }
})();
