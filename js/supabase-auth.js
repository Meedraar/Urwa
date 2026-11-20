import { supabase } from './supabase.js';

const $ = (id) => document.getElementById(id);
const roleHome = {
  student: '/portal/student/student-dashboard.html',
  teacher: '/portal/abla/teacher-dashboard.html',
  admin: '/portal/admin/admin-dashboard.html'
};
const roleLogin = {
  student: '/portal/student/student-login.html',
  teacher: '/portal/abla/teacher-login.html',
  admin: '/portal/admin/login.html'
};

function showMessage(form, text, isError = true) {
  if (!form) return;
  let node = form.querySelector('[data-auth-message], [data-form-message], #loginMessage');
  if (!node) {
    node = document.createElement('p');
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    form.append(node);
  }
  node.hidden = false;
  node.classList.remove('sys-hidden');
  node.textContent = text;
  node.style.cssText = 'padding:12px;border-radius:8px;background:' +
    (isError ? '#fff0ed' : '#e3f0ea') + ';color:' +
    (isError ? '#8c2f20' : '#0e4a40');
}

export async function getUrwaProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, status, admin_level')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Your URWA profile is not ready. Please contact administration.');
  return data;
}

export async function requireSupabaseProfile(expectedRole) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Please sign in again.');
  const profile = await getUrwaProfile(user.id);
  if (profile.role !== expectedRole || profile.status !== 'approved') {
    throw new Error('Your account is not approved for this portal. Contact URWA administration.');
  }
  return { user, profile };
}

async function login(form, role) {
  const email = $('email')?.value.trim().toLowerCase();
  const password = $('password')?.value || '';
  if (!email || !password) throw new Error('Enter your email and password.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  try {
    const profile = await getUrwaProfile(data.user.id);
    if (profile.role !== role || profile.status !== 'approved') {
      throw new Error('This account is not approved for this portal. Contact URWA administration.');
    }
    const requestedNext = new URLSearchParams(location.search).get('next');
    const safeNext = role === 'student' && requestedNext === '/portal/departments/index.html'
      ? requestedNext
      : roleHome[role];
    location.replace(safeNext);
  } catch (err) {
    await supabase.auth.signOut();
    throw err;
  }
}

for (const [selector, role] of [
  ['#studentLoginForm', 'student'],
  ['#departmentLoginForm', 'student'],
  ['[data-staff-login="teacher"]', 'teacher'],
  ['#adminLoginForm', 'admin']
]) {
  const form = document.querySelector(selector);
  if (form) form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    const originalLabel = button?.textContent || '';
    if (button) { button.disabled = true; button.textContent = 'Signing in…'; }
    try { await login(form, role); }
    catch (error) { showMessage(form, error.message || 'Sign in failed.'); }
    finally {
      if (button) { button.disabled = false; button.textContent = originalLabel; }
    }
  });
}

const registration = $('studentRegistrationForm');
if (registration) registration.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = registration.querySelector('[type="submit"]');
  const password = $('password')?.value || '';
  if (password.length < 8) return showMessage(registration, 'Use a password with at least 8 characters.');
  if (password !== $('confirmPassword')?.value) return showMessage(registration, 'Your passwords do not match.');
  if (button) button.disabled = true;
  try {
    const fullName = $('fullName')?.value.trim() || '';
    const email = $('email')?.value.trim().toLowerCase() || '';
    const phone = $('phone')?.value.trim() || '';
    if (!fullName || !email || !phone) throw new Error('Enter your name, email and phone number.');
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: location.origin + '/portal/student/student-login.html?next=' + encodeURIComponent(new URLSearchParams(location.search).get('next') === '/portal/departments/index.html' ? '/portal/departments/index.html' : '/portal/student/student-dashboard.html'),
        data: {
          full_name: fullName,
          phone,
          level: $('level')?.value || '',
          programme: $('programme')?.value || '',
          preferred_session: $('session')?.value || ''
        }
      }
    });
    if (error) throw error;
    if (!data.user) throw new Error('Registration could not be completed. Please try again.');
    if (data.session) await supabase.auth.signOut();
    showMessage(registration,
      data.session
        ? 'Your application has been received and is pending administrator review.'
        : 'Your application has been received. Please verify your email, then wait for administrator approval.',
      false);
    registration.reset();
  } catch (error) {
    showMessage(registration, error.message || 'Registration could not be completed.');
  } finally { if (button) button.disabled = false; }
});

const departmentRegistration = $('departmentRegistrationForm');
if (departmentRegistration) departmentRegistration.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = departmentRegistration.querySelector('[type="submit"]');
  const password = $('password')?.value || '';
  if (password.length < 8) return showMessage(departmentRegistration, 'Use a password with at least 8 characters.');
  if (password !== $('confirmPassword')?.value) return showMessage(departmentRegistration, 'Your passwords do not match.');
  if (button) button.disabled = true;
  try {
    const fullName = $('fullName')?.value.trim() || '';
    const email = $('email')?.value.trim().toLowerCase() || '';
    const phone = $('phone')?.value.trim() || '';
    if (!fullName || !email || !phone) throw new Error('Enter your name, email and phone number.');
    const next = '/portal/departments/index.html';
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: location.origin + '/portal/departments/department-login.html?next=' + encodeURIComponent(next),
        data: { full_name: fullName, phone, account_type: 'department_applicant' }
      }
    });
    if (error) throw error;
    if (!data.user) throw new Error('Registration could not be completed. Please try again.');
    if (data.session) await supabase.auth.signOut();
    showMessage(departmentRegistration,
      data.session
        ? 'Your URWA Department Applicant account has been created and is awaiting Administration approval. Once approved, sign in here to continue your department application.'
        : 'Your URWA Department Applicant registration has been received. Verify your email, then wait for Administration approval. After approval, sign in here to continue your department application.',
      false);
    departmentRegistration.reset();
  } catch (error) {
    showMessage(departmentRegistration, error.message || 'Registration could not be completed.');
  } finally { if (button) button.disabled = false; }
});

const teacherRegistration = $('teacherRegistrationForm');
if (teacherRegistration) teacherRegistration.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = teacherRegistration.querySelector('[type="submit"]');
  const password = $('password')?.value || '';
  if (password.length < 8) return showMessage(teacherRegistration, 'Use a password with at least 8 characters.');
  if (password !== $('confirmPassword')?.value) return showMessage(teacherRegistration, 'Your passwords do not match.');
  if (button) button.disabled = true;
  try {
    const fullName = $('fullName')?.value.trim() || '';
    const email = $('email')?.value.trim().toLowerCase() || '';
    const phone = $('phone')?.value.trim() || '';
    if (!fullName || !email || !phone) throw new Error('Enter your name, email and phone number.');
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: location.origin + '/portal/abla/teacher-login.html',
        data: {
          account_type: 'teacher',
          full_name: fullName,
          phone,
          area_of_interest: $('area')?.value || '',
          teaching_background: $('background')?.value.trim() || '',
          availability: $('availability')?.value.trim() || ''
        }
      }
    });
    if (error) throw error;
    if (!data.user) throw new Error('Registration could not be completed. Please try again.');
    if (data.session) await supabase.auth.signOut();
    showMessage(teacherRegistration,
      'Your Abla application has been received. Please verify your email, then wait for URWA administration approval.',
      false);
    teacherRegistration.reset();
  } catch (error) {
    showMessage(teacherRegistration, error.message || 'Registration could not be completed.');
  } finally { if (button) button.disabled = false; }
});

const forgot = $('studentForgotPasswordForm');
if (forgot) forgot.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = forgot.querySelector('[type="submit"]');
  if (button) button.disabled = true;
  try {
    const email = $('email')?.value.trim();
    if (!email) throw new Error('Enter your email address.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin + '/portal/student/student-reset-password.html'
    });
    if (error) throw error;
    showMessage(forgot, 'If an account exists, password-reset instructions have been sent.', false);
  } catch (error) { showMessage(forgot, error.message || 'Unable to send reset email.'); }
  finally { if (button) button.disabled = false; }
});

const reset = $('studentResetPasswordForm');
if (reset) {
  supabase.auth.getSession().then(({ data }) => {
    if (!data.session) showMessage(reset, 'Open the password-reset link sent to your email before setting a new password.');
  });
  reset.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = reset.querySelector('[type="submit"]');
    const password = $('newPassword')?.value || '';
    if (password.length < 8) return showMessage(reset, 'Use at least 8 characters.');
    if (password !== $('confirmNewPassword')?.value) return showMessage(reset, 'Your passwords do not match.');
    if (button) button.disabled = true;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Open the password-reset link sent to your email, then try again.');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      showMessage(reset, 'Password updated. You can now sign in.', false);
      await supabase.auth.signOut();
      setTimeout(() => location.replace('/portal/student/student-login.html'), 1200);
    } catch (error) { showMessage(reset, error.message || 'Unable to update password.'); }
    finally { if (button) button.disabled = false; }
  });
}

document.querySelectorAll('[data-toggle-password], [data-target]').forEach((button) => {
  button.addEventListener('click', () => {
    const id = button.dataset.togglePassword || button.dataset.target;
    const input = $(id);
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
      button.textContent = input.type === 'password' ? 'Show' : 'Hide';
    }
  });
});

const protectedRole = document.body.dataset.urwaRole;
if (protectedRole) {
  supabase.auth.getUser().then(async ({ data, error }) => {
    if (error || !data.user) {
      location.replace(roleLogin[protectedRole] || '/');
      return;
    }
    try {
      const { profile } = await requireSupabaseProfile(protectedRole);
      document.querySelectorAll('[data-profile-name]').forEach((node) => node.textContent = profile.full_name || 'URWA member');
      document.querySelectorAll('[data-profile-email]').forEach((node) => node.textContent = profile.email || data.user.email || '');
      if (protectedRole === 'admin') {
        document.querySelectorAll('[data-admin-level-label]').forEach((node) => {
          node.textContent = profile.admin_level === 'super_admin' ? 'Super Admin' : 'Standard Admin';
        });
        document.querySelectorAll('[data-super-admin-only]').forEach((node) => {
          node.hidden = profile.admin_level !== 'super_admin';
        });
      }
    } catch (_) {
      await supabase.auth.signOut();
      location.replace(roleLogin[protectedRole] || '/');
    }
  });
}

document.querySelectorAll('[data-urwa-logout]').forEach((button) => {
  button.addEventListener('click', async (event) => {
    event.preventDefault();
    await supabase.auth.signOut();
    location.replace('/');
  });
});
