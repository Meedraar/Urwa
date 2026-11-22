import { supabase } from './supabase.js';

const body = document.getElementById('admin-admissions-body');
const search = document.getElementById('search');
const statusFilter = document.getElementById('applicationStatusFilter');
let applications = [];
let halaqas = [];
let currentAdminId = null;

const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function render() {
  if (!body) return;
  const term = (search?.value || '').trim().toLowerCase();
  const selectedStatus = statusFilter?.value || '';
  const filtered = applications.filter((item) => {
    const haystack = [item.full_name, item.email, item.programme, item.level].join(' ').toLowerCase();
    return (!term || haystack.includes(term)) && (!selectedStatus || item.status === selectedStatus);
  });

  body.replaceChildren();
  if (!filtered.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.className = 'empty';
    cell.textContent = 'No student applications match these filters.';
    row.append(cell);
    body.append(row);
    return;
  }

  filtered.forEach((item) => {
    const row = document.createElement('tr');
    const addCell = (value) => {
      const cell = document.createElement('td');
      cell.textContent = value || '—';
      row.append(cell);
      return cell;
    };
    addCell(item.full_name);
    addCell(item.email);
    addCell([item.programme, item.level].filter(Boolean).join(' · ') || '—');
    addCell(item.created_at ? new Date(item.created_at).toLocaleDateString() : '—');
    addCell(item.department_review_status === 'not_started'
      ? 'Not yet reviewed'
      : item.department_review_status.replaceAll('_', ' '));
    addCell(item.admin_decision === 'pending'
      ? (item.status === 'approved' ? 'Approved' : item.status === 'cancelled' ? 'Declined' : 'Awaiting final decision')
      : item.admin_decision.replaceAll('_', ' '));

    const actions = document.createElement('td');
    if (item.status === 'pending') {
      const select = document.createElement('select');
      select.className = 'action';
      select.setAttribute('aria-label', 'Assign halaqa for ' + item.full_name);
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'Choose halaqa';
      select.append(empty);
      halaqas.forEach((halaqa) => {
        const option = document.createElement('option');
        option.value = halaqa.id;
        option.textContent = halaqa.name;
        option.selected = halaqa.id === item.halaqa_id;
        select.append(option);
      });

      const approve = document.createElement('button');
      approve.type = 'button';
      approve.className = 'action';
      approve.textContent = 'Approve';
      approve.addEventListener('click', () => decide(item, 'approved', select, approve));

      const decline = document.createElement('button');
      decline.type = 'button';
      decline.className = 'action';
      decline.style.marginLeft = '5px';
      decline.textContent = 'Decline';
      decline.addEventListener('click', () => decide(item, 'cancelled', select, decline));
      actions.append(select, approve, decline);
    } else {
      actions.textContent = 'Decision recorded';
    }
    row.append(actions);
    body.append(row);
  });
}

async function decide(item, decision, halaqaSelect, button) {
  if (decision === 'approved' && !halaqaSelect.value) {
    window.alert('Choose a halaqa before approving this student.');
    return;
  }
  const prompt = decision === 'approved'
    ? 'Approve ' + item.full_name + ' and assign the selected halaqa?'
    : 'Decline the application from ' + item.full_name + '?';
  if (!window.confirm(prompt)) return;

  button.disabled = true;
  try {
    const now = new Date().toISOString();
    const { error: enrollmentError } = await supabase
      .from('student_enrollments')
      .update({
        status: decision,
        halaqa_id: decision === 'approved' ? halaqaSelect.value : null,
        reviewed_by: currentAdminId,
        reviewed_at: now,
        admin_decision: decision === 'approved' ? 'approved' : 'declined',
        admin_decided_by: currentAdminId,
        admin_decided_at: now
      })
      .eq('id', item.id)
      .eq('status', 'pending');
    if (enrollmentError) throw enrollmentError;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ status: decision })
      .eq('id', item.student_id)
      .eq('role', 'student');
    if (profileError) throw profileError;

    await loadApplications();
  } catch (error) {
    console.error('URWA admission decision failed:', error);
    window.alert('The admission decision could not be saved. ' + (error.message || 'Please refresh and try again.'));
    button.disabled = false;
  }
}

async function loadApplications() {
  const [enrollmentResult, profileResult, halaqaResult] = await Promise.all([
    supabase.from('student_enrollments')
      .select('id,student_id,halaqa_id,level,programme,status,created_at,department_review_status,admin_decision')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id,full_name,email,role'),
    supabase.from('halaqas').select('id,name,is_active').order('name')
  ]);
  if (enrollmentResult.error) throw enrollmentResult.error;
  if (profileResult.error) throw profileResult.error;
  if (halaqaResult.error) throw halaqaResult.error;

  const profiles = new Map((profileResult.data || []).map((profile) => [profile.id, profile]));
  applications = (enrollmentResult.data || [])
    .map((enrollment) => {
      const profile = profiles.get(enrollment.student_id);
      if (!profile || profile.role !== 'student') return null;
      return { ...enrollment, full_name: profile.full_name, email: profile.email };
    })
    .filter(Boolean);
  halaqas = (halaqaResult.data || []).filter((halaqa) => halaqa.is_active);
  render();
}

async function init() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      location.replace('/portal/admin/login.html');
      return;
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('role,status').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.role !== 'admin' || profile.status !== 'approved') {
      await supabase.auth.signOut();
      location.replace('/portal/admin/login.html');
      return;
    }
    currentAdminId = user.id;
    await loadApplications();
  } catch (error) {
    console.error('Unable to load URWA admissions:', error);
    if (body) {
      body.replaceChildren();
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 7;
      cell.className = 'empty';
      cell.textContent = 'Student applications could not be loaded. Please refresh or contact the system administrator.';
      row.append(cell);
      body.append(row);
    }
  }
}

search?.addEventListener('input', render);
statusFilter?.addEventListener('change', render);
init();
