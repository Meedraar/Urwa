import { supabase } from './supabase.js';

const body = document.getElementById('public-enquiries-body');
const statusFilter = document.getElementById('enquiryStatusFilter');
const searchInput = document.getElementById('enquirySearch');
let enquiries = [];

function cell(value) {
  const td = document.createElement('td');
  td.textContent = value || '—';
  return td;
}

function render() {
  if (!body) return;
  const status = statusFilter?.value || '';
  const query = (searchInput?.value || '').trim().toLowerCase();
  const rows = enquiries.filter((item) => {
    const matchesStatus = !status || item.status === status;
    const haystack = [item.full_name, item.email, item.phone, item.enquiry_type, item.message, item.source].join(' ').toLowerCase();
    return matchesStatus && (!query || haystack.includes(query));
  });

  body.replaceChildren();
  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.className = 'empty';
    td.textContent = 'No enquiries match this filter.';
    tr.append(td);
    body.append(tr);
    return;
  }

  rows.forEach((item) => {
    const tr = document.createElement('tr');
    tr.append(cell(new Date(item.created_at).toLocaleString()));
    tr.append(cell(item.full_name));
    tr.append(cell([item.email, item.phone].filter(Boolean).join(' / ')));
    tr.append(cell(item.enquiry_type + ' · ' + item.source));

    const message = cell(item.message);
    message.style.maxWidth = '320px';
    message.style.whiteSpace = 'normal';
    tr.append(message);

    const statusCell = document.createElement('td');
    const select = document.createElement('select');
    select.className = 'action';
    [['new','New'],['in_review','In review'],['resolved','Resolved'],['closed','Closed']].forEach(([value,label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.append(option);
    });
    select.value = item.status;
    select.addEventListener('change', async () => {
      select.disabled = true;
      const { error } = await supabase.from('public_enquiries').update({ status: select.value }).eq('id', item.id);
      if (error) {
        window.alert('Could not update enquiry status: ' + error.message);
        select.value = item.status;
      } else {
        item.status = select.value;
      }
      select.disabled = false;
    });
    statusCell.append(select);
    tr.append(statusCell);
    body.append(tr);
  });
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

    const { data, error } = await supabase
      .from('public_enquiries')
      .select('id,full_name,email,phone,enquiry_type,message,source,status,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    enquiries = data || [];
    render();
  } catch (error) {
    console.error('Unable to load URWA website enquiries:', error);
    if (body) {
      body.replaceChildren();
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.className = 'empty';
      td.textContent = 'Enquiries could not be loaded. Please refresh or contact the system administrator.';
      tr.append(td);
      body.append(tr);
    }
  }
}

statusFilter?.addEventListener('change', render);
searchInput?.addEventListener('input', render);
init();
