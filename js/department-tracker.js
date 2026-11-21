import { supabase } from './supabase.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let user, profile, departments = [], memberships = [], goals = [], reports = [], isAdmin = false;

function msg(text, error = false) {
  const node = $('pageMessage');
  if (!node) return;
  node.replaceChildren();
  const p = document.createElement('div');
  p.className = 'dt-message' + (error ? ' error' : '');
  p.textContent = text;
  node.append(p);
}
function dept(id) { return departments.find(d => d.id === id); }
function deptName(id) { return dept(id)?.name || 'Department'; }
function activeMembership(m) {
  return ['active','renewal_pending','under_review','renewed'].includes(m.membership_status);
}
function canAccess(id) { return isAdmin || memberships.some(m => m.department_id === id && activeMembership(m)); }
function canHead(id) {
  return isAdmin || memberships.some(m => m.department_id === id && activeMembership(m) && m.department_positions?.is_leadership);
}
function availableDepartments() { return isAdmin ? departments : departments.filter(d => canAccess(d.id)); }
function fillDepartments(id, list) {
  const node = $(id);
  node.innerHTML = list.map(d => '<option value="' + d.id + '">' + esc(d.name) + '</option>').join('');
  node.disabled = !isAdmin && list.length === 1;
}
function refreshGoals() {
  const departmentId = $('reportDepartment').value;
  $('reportGoal').innerHTML = '<option value="">General department update</option>' +
    goals.filter(g => g.department_id === departmentId)
      .map(g => '<option value="' + g.id + '">' + esc(g.title) + '</option>').join('');
}
function renderGoals() {
  $('goalList').innerHTML = goals.length ? goals.map(g =>
    '<article class="dt-card"><div class="dt-meta"><span class="dt-pill">' + esc(g.status.replace('_',' ')) +
    '</span><span>' + esc(deptName(g.department_id)) + '</span><span>Due: ' + esc(g.due_date || 'Not set') +
    '</span></div><h3>' + esc(g.title) + '</h3><p>' + esc(g.description || 'No description added.') +
    '</p><div class="dt-meta">' + esc(g.target_metric || 'Target not specified') +
    (g.target_value != null ? ' · ' + esc(g.target_value) + ' ' + esc(g.unit || '') : '') +
    '</div>' + (canHead(g.department_id) ? '<label class="dt-muted">Goal status: <select data-goal-status="' + g.id +
    '"><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="on_hold">On hold</option></select></label>' : '') +
    '</article>').join('') : '<div class="dt-card dt-muted">No goals have been added yet.</div>';
  document.querySelectorAll('[data-goal-status]').forEach(el => {
    const goal = goals.find(g => g.id === el.dataset.goalStatus);
    el.value = goal.status;
    el.addEventListener('change', async () => {
      try {
        const { error } = await supabase.from('department_goals')
          .update({ status: el.value, updated_at: new Date().toISOString() }).eq('id', goal.id);
        if (error) throw error;
        goal.status = el.value;
        msg('Goal status updated.');
      } catch (error) { msg(error.message, true); el.value = goal.status; }
    });
  });
  $('statGoals').textContent = goals.filter(g => g.status !== 'completed').length;
}
function renderReports() {
  $('reportList').innerHTML = reports.length ? reports.map(r =>
    '<article class="dt-card"><div class="dt-meta"><span class="dt-pill">' + esc(r.status.replace('_',' ')) +
    '</span><span>' + esc(deptName(r.department_id)) + '</span><span>' + esc(new Date(r.submitted_at || r.created_at).toLocaleDateString()) +
    '</span></div><h3>' + esc(r.title) + '</h3><p>' + esc(r.summary) + '</p>' +
    (r.achievements ? '<p><strong>Achievements:</strong> ' + esc(r.achievements) + '</p>' : '') +
    (r.challenges ? '<p><strong>Challenges:</strong> ' + esc(r.challenges) + '</p>' : '') +
    (r.recommendations ? '<p><strong>Recommendations:</strong> ' + esc(r.recommendations) + '</p>' : '') +
    (r.attachment_path ? '<a href="' + esc(r.attachment_path) + '" target="_blank" rel="noopener noreferrer">Open attachment ↗</a>' : '') +
    (isAdmin && r.status === 'submitted' ? '<div style="margin-top:12px"><button class="dt-btn secondary" data-review="' + r.id + '">Mark under review</button></div>' : '') +
    '</article>').join('') : '<div class="dt-card dt-muted">No reports submitted yet.</div>';
  document.querySelectorAll('[data-review]').forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const { error } = await supabase.from('department_reports')
        .update({ status: 'under_review', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
        .eq('id', button.dataset.review);
      if (error) throw error;
      msg('Report moved to review.'); await loadData();
    } catch (error) { msg(error.message, true); button.disabled = false; }
  }));
  $('statReports').textContent = reports.length;
  $('statPending').textContent = reports.filter(r => r.status === 'submitted').length;
}
async function loadData() {
  const ids = availableDepartments().map(d => d.id);
  if (!ids.length) { goals = []; reports = []; renderGoals(); renderReports(); return; }
  const [g, r] = await Promise.all([
    supabase.from('department_goals').select('*').in('department_id', ids).order('created_at', { ascending: false }),
    supabase.from('department_reports').select('*').in('department_id', ids).order('created_at', { ascending: false })
  ]);
  if (g.error) throw g.error;
  if (r.error) throw r.error;
  goals = g.data || [];
  reports = r.data || [];
  renderGoals(); renderReports();
  $('statDepartments').textContent = isAdmin ? departments.length : memberships.filter(activeMembership).length;
  refreshGoals();
}
async function loadMemberships() {
  let query = supabase.from('department_memberships')
    .select('id,profile_id,department_id,position_id,membership_status,departments(name),department_positions(title,is_leadership)');
  if (!isAdmin) query = query.eq('profile_id', user.id);
  const { data, error } = await query;
  if (error) throw error;
  memberships = data || [];
}
async function setupAdmin() {
  $('access').classList.remove('dt-hidden');
  $('accessNav').classList.remove('dt-hidden');
  const { data: profiles, error } = await supabase.from('profiles')
    .select('id,full_name,email').eq('status','approved').order('full_name');
  if (error) throw error;
  $('memberProfile').innerHTML = (profiles || []).map(p =>
    '<option value="' + p.id + '">' + esc(p.full_name || p.email || p.id) + '</option>').join('');
  $('memberDepartment').innerHTML = departments.map(d =>
    '<option value="' + d.id + '">' + esc(d.name) + '</option>').join('');
  $('membershipList').innerHTML = '<div style="overflow:auto;margin-top:15px"><table class="dt-table"><thead><tr><th>Member</th><th>Department</th><th>Position</th><th>Status</th></tr></thead><tbody>' +
    memberships.map(m => '<tr><td>' + esc(profiles.find(p => p.id === m.profile_id)?.full_name || 'URWA member') +
    '</td><td>' + esc(deptName(m.department_id)) + '</td><td>' + esc(m.department_positions?.title || 'Team member') +
    '</td><td>' + esc(m.membership_status) + '</td></tr>').join('') + '</tbody></table></div>';
  // Appointments and transfers are handled by the dedicated Department Administration workflow.
  $('membershipForm')?.classList.add('dt-hidden');
}
async function init() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) { location.replace('/portal/admin/login.html'); return; }
  user = authData.user;
  const { data: p, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (!p || p.status !== 'approved') { msg('Your account is not approved.', true); return; }
  profile = p;
  isAdmin = profile.role === 'admin';
  document.querySelectorAll('[data-profile-name]').forEach(n => n.textContent = profile.full_name || 'URWA member');
  const [d] = await Promise.all([
    supabase.from('departments').select('id,slug,name,is_active').eq('is_active', true).order('name'),
    loadMemberships()
  ]);
  if (d.error) throw d.error;
  departments = d.data || [];
  const available = availableDepartments();
  if (!available.length) {
    msg('No department access has been assigned. Contact administration.', true);
    $('goalForm').classList.add('dt-hidden');
    $('reportForm').classList.add('dt-hidden');
    return;
  }
  fillDepartments('goalDepartment', available);
  fillDepartments('reportDepartment', available);
  $('createGoalPanel').classList.toggle('dt-hidden', !isAdmin && !memberships.some(m => canHead(m.department_id)));
  await loadData();
  if (isAdmin) await setupAdmin();
  $('reportDepartment').addEventListener('change', refreshGoals);
  $('goalForm').addEventListener('submit', saveGoal);
  $('reportForm').addEventListener('submit', saveReport);
}
async function saveGoal(event) {
  event.preventDefault();
  const button = event.submitter; button.disabled = true;
  try {
    const departmentId = $('goalDepartment').value;
    if (!canHead(departmentId)) throw new Error('Only department heads can create goals.');
    const { error } = await supabase.from('department_goals').insert({
      department_id: departmentId,
      title: $('goalTitle').value.trim(),
      description: $('goalDescription').value.trim() || null,
      target_metric: $('goalMetric').value.trim() || null,
      target_value: $('goalValue').value ? Number($('goalValue').value) : null,
      unit: $('goalUnit').value.trim() || null,
      start_date: $('goalStart').value || null,
      due_date: $('goalDue').value || null,
      status: 'planned',
      created_by: user.id
    });
    if (error) throw error;
    $('goalForm').reset(); msg('Department goal saved.'); await loadData();
  } catch (error) { msg(error.message, true); }
  finally { button.disabled = false; }
}
async function saveReport(event) {
  event.preventDefault();
  const button = event.submitter; button.disabled = true;
  try {
    const departmentId = $('reportDepartment').value;
    if (!canAccess(departmentId)) throw new Error('You do not have access to this department.');
    const type = $('reportType').value;
    const details = $('reportDetails').value.trim();
    const { error } = await supabase.from('department_reports').insert({
      department_id: departmentId,
      title: $('reportTitle').value.trim(),
      summary: details,
      achievements: type === 'achievement' ? details : null,
      challenges: type === 'challenge' ? details : null,
      recommendations: type === 'meeting' ? details : null,
      attachment_path: $('reportEvidence').value.trim() || null,
      report_period_start: $('periodStart').value || null,
      report_period_end: $('periodEnd').value || null,
      status: 'submitted',
      submitted_by: user.id
    });
    if (error) throw error;
    $('reportForm').reset(); msg('Your report has been submitted for administrative review.'); await loadData();
  } catch (error) { msg(error.message, true); }
  finally { button.disabled = false; }
}
init().catch(error => msg(error.message || 'Could not load department tracker.', true));
