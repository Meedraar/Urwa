import { supabase } from './supabase.js';

const body = document.getElementById('admin-users-body');
const search = document.getElementById('search');
const roleFilter = document.getElementById('roleFilter');
const statusFilter = document.getElementById('statusFilter');
let profiles = [];
let memberships = [];

function labelRole(role) {
  return ({ admin: 'Administrator', teacher: 'Educator', student: 'Student', department_member: 'Department applicant / member' })[role] || role;
}
function labelStatus(status) {
  return ({ approved: 'Approved', pending: 'Pending', suspended: 'Suspended', cancelled: 'Cancelled' })[status] || status;
}
function td(value) {
  const node = document.createElement('td');
  node.textContent = value || '—';
  return node;
}

function render() {
  const term = (search?.value || '').trim().toLowerCase();
  const role = roleFilter?.value || '';
  const status = statusFilter?.value || '';
  const rows = profiles.filter((profile) => {
    const matchesRole = !role || profile.role === role;
    const matchesStatus = !status || profile.status === status;
    const matchesSearch = !term || [profile.full_name, profile.email, profile.phone].join(' ').toLowerCase().includes(term);
    return matchesRole && matchesStatus && matchesSearch;
  });

  body.replaceChildren();
  if (!rows.length) {
    const tr = document.createElement('tr');
    const empty = document.createElement('td');
    empty.colSpan = 7;
    empty.className = 'empty';
    empty.textContent = 'No accounts match these filters.';
    tr.append(empty);
    body.append(tr);
    return;
  }

  rows.forEach((profile) => {
    const tr = document.createElement('tr');
    tr.append(td(profile.full_name), td(profile.email), td(labelRole(profile.role)));
    const membership = memberships.find((item) => item.profile_id === profile.id && ['active','renewal_pending','under_review','renewed'].includes(item.membership_status));
    tr.append(td(membership?.department_name || (profile.role === 'department_member' ? 'Not yet assigned' : '—')));
    tr.append(td(labelStatus(profile.status)));
    tr.append(td(profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'));

    const action = document.createElement('td');
    if (profile.role === 'teacher' && profile.status === 'pending') {
      const approve = document.createElement('button');
      approve.type = 'button';
      approve.className = 'action';
      approve.textContent = 'Approve educator';
      approve.addEventListener('click', () => reviewMembershipApplication(profile, 'approve', approve));
      const decline = document.createElement('button');
      decline.type = 'button';
      decline.className = 'action';
      decline.textContent = 'Decline';
      decline.style.marginLeft = '5px';
      decline.addEventListener('click', () => reviewMembershipApplication(profile, 'reject', decline));
      action.append(approve, decline);
    } else if (profile.role === 'department_member' && profile.status === 'pending') {
      const approve = document.createElement('button');
      approve.type = 'button';
      approve.className = 'action';
      approve.textContent = 'Approve applicant';
      approve.addEventListener('click', () => updateStatus(profile, 'approved', approve));
      const decline = document.createElement('button');
      decline.type = 'button';
      decline.className = 'action';
      decline.textContent = 'Decline';
      decline.style.marginLeft = '5px';
      decline.addEventListener('click', () => updateStatus(profile, 'cancelled', decline));
      action.append(approve, decline);
    } else {
      action.textContent = profile.id === currentUserId ? 'Current account' : '—';
    }
    tr.append(action);
    body.append(tr);
  });
}

let currentUserId = null;
let isSuperAdmin = false;
async function reviewAdminApplication(profile, decision, button) {
  const action = decision === 'approved' ? 'approve' : 'decline';
  if (!window.confirm((decision === 'approved'
    ? 'Approve ' + profile.full_name + ' as a Standard Admin?'
    : 'Decline the administrator application from ' + profile.full_name + '?'))) return;
  button.disabled = true;
  try {
    const { error } = await supabase.rpc('review_admin_application', {
      target_user_id: profile.id,
      final_decision: decision
    });
    if (error) throw error;
    await init();
  } catch (error) {
    window.alert('Could not ' + action + ' administrator application: ' + error.message);
    button.disabled = false;
  }
}

function renderPendingAdminApplications() {
  const panel = document.getElementById('pending-admin-applications');
  const target = document.getElementById('pending-admin-applications-body');
  if (!panel || !target) return;
  panel.hidden = !isSuperAdmin;
  if (!isSuperAdmin) return;
  const pending = profiles.filter((profile) => profile.role === 'admin' && profile.status === 'pending');
  const count = document.getElementById('pending-admin-count');
  if (count) count.textContent = pending.length + ' pending';
  target.replaceChildren();
  if (!pending.length) {
    const tr = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'empty';
    cell.textContent = 'No pending administrator applications.';
    tr.append(cell);
    target.append(tr);
    return;
  }
  pending.forEach((profile) => {
    const tr = document.createElement('tr');
    tr.append(td(profile.full_name), td(profile.email), td(profile.phone),
      td(profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'));
    const action = document.createElement('td');
    const approve = document.createElement('button');
    approve.type = 'button';
    approve.className = 'btn';
    approve.textContent = 'Approve as Standard Admin';
    approve.addEventListener('click', () => reviewAdminApplication(profile, 'approved', approve));
    const decline = document.createElement('button');
    decline.type = 'button';
    decline.className = 'btn';
    decline.textContent = 'Decline';
    decline.style.marginLeft = '6px';
    decline.style.background = '#a64b43';
    decline.addEventListener('click', () => reviewAdminApplication(profile, 'cancelled', decline));
    action.append(approve, decline);
    tr.append(action);
    target.append(tr);
  });
}

async function reviewMembershipApplication(profile, decision, button) {
  const verb = decision === 'approve' ? 'approve' : 'decline';
  if (!window.confirm((decision === 'approve' ? 'Approve educator ' : 'Decline educator application from ') + profile.full_name + '?')) return;
  button.disabled = true;
  try {
    const { error } = await supabase.rpc('admin_review_membership_application', {
      target_user_id: profile.id,
      decision
    });
    if (error) throw error;
    await init();
  } catch (error) {
    window.alert('Could not ' + verb + ' educator application: ' + error.message);
    button.disabled = false;
  }
}

async function updateStatus(profile, status, button) {
  if (!window.confirm((status === 'approved' ? 'Approve' : 'Decline') + ' department applicant ' + profile.full_name + '?')) return;
  button.disabled = true;
  try {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', profile.id).eq('role', 'department_member');
    if (error) throw error;
    profile.status = status;
    renderPendingAdminApplications();
    render();
  } catch (error) {
    window.alert('Could not update account status: ' + error.message);
    button.disabled = false;
  }
}

async function init() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      location.replace('/portal/admin/login.html');
      return;
    }
    currentUserId = user.id;
    const { data: current, error: currentError } = await supabase
      .from('profiles').select('role,status,admin_level').eq('id', user.id).maybeSingle();
    if (currentError) throw currentError;
    if (!current || current.role !== 'admin' || current.status !== 'approved') {
      await supabase.auth.signOut();
      location.replace('/portal/admin/login.html');
      return;
    }
    isSuperAdmin = current.admin_level === 'super_admin';

    const [peopleQ, membershipQ] = await Promise.all([
      supabase.from('profiles').select('id,full_name,email,phone,role,status,admin_level,created_at').order('created_at', { ascending: false }),
      supabase.from('department_memberships').select('profile_id,department_id,membership_status,departments(name)')
    ]);
    if (peopleQ.error) throw peopleQ.error;
    if (membershipQ.error) throw membershipQ.error;
    profiles = peopleQ.data || [];
    memberships = (membershipQ.data || []).map((item) => ({
      ...item,
      department_name: item.departments?.name || ''
    }));

    const stats = document.querySelectorAll('.stats .stat strong');
    if (stats[0]) stats[0].textContent = String(profiles.length);
    if (stats[1]) stats[1].textContent = String(profiles.filter((p) => p.role === 'student').length);
    if (stats[2]) stats[2].textContent = String(profiles.filter((p) => p.role === 'teacher').length);
    if (stats[3]) stats[3].textContent = String(profiles.filter((p) => p.role === 'department_member').length);
    renderPendingAdminApplications();
    render();
  } catch (error) {
    console.error('Unable to load URWA user management:', error);
    body.replaceChildren();
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.className = 'empty';
    td.textContent = 'User accounts could not be loaded. Refresh the page or contact the system administrator.';
    tr.append(td);
    body.append(tr);
  }
}

search?.addEventListener('input', render);
roleFilter?.addEventListener('change', render);
statusFilter?.addEventListener('change', render);
init();
