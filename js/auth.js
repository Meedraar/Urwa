/* URWA Supabase authentication. Public publishable key only. */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://kwqaorzvflrgepepfwwg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_dr-L_IXcqt1Rw4ROmoH62w_AoTn204K';
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
function showMessage(form, message, isError = true) {
  let node = form.querySelector('[data-auth-message]');
  if (!node) {
    node = document.createElement('p'); node.dataset.authMessage = 'true';
    node.setAttribute('role','status'); node.setAttribute('aria-live','polite');
    node.style.cssText = 'margin:14px 0;padding:12px;border-radius:8px;background:#e3f0ea;color:#0e4a40;font-size:.9rem;line-height:1.5';
    form.appendChild(node);
  }
  node.textContent = message;
  node.style.background = isError ? '#fff0ed' : '#e3f0ea';
  node.style.color = isError ? '#8c2f20' : '#0e4a40';
}
function portalFor(role) {
  if (role === 'student') return '/portal/student/student-dashboard.html';
  if (role === 'teacher') return '/portal/abla/teacher-dashboard.html';
  if (role === 'admin') return '/portal/admin/admin-dashboard.html';
  return '/';
}
async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('id,full_name,email,role,status').eq('id', userId).single();
  if (error) throw error;
  return data;
}
async function signIn(form, expectedRole) {
  const email = $('email')?.value.trim();
  const password = $('password')?.value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  let profile;
  try { profile = await getProfile(data.user.id); }
  catch (err) { await supabase.auth.signOut(); throw new Error('Your URWA profile is not ready. Please contact administration.'); }
  if (profile.role !== expectedRole) {
    await supabase.auth.signOut();
    throw new Error('This account is not authorised for this portal. Please use the correct login page.');
  }
  if (profile.status !== 'approved') {
    await supabase.auth.signOut();
    throw new Error('Your account is awaiting URWA approval or has been suspended. Please contact administration.');
  }
  window.location.href = portalFor(profile.role);
}

const studentLogin = $('studentLoginForm');
if (studentLogin) studentLogin.addEventListener('submit', async (e) => {
  e.preventDefault(); const button = studentLogin.querySelector('[type="submit"]');
  button.disabled = true;
  try { await signIn(studentLogin, 'student'); }
  catch (err) { showMessage(studentLogin, err.message); }
  finally { button.disabled = false; }
});

const staffForm = document.querySelector('[data-staff-login]');
if (staffForm) staffForm.addEventListener('submit', async (e) => {
  e.preventDefault(); const button = staffForm.querySelector('[type="submit"]'); button.disabled = true;
  try { await signIn(staffForm, staffForm.dataset.staffLogin); }
  catch (err) { showMessage(staffForm, err.message); }
  finally { button.disabled = false; }
});

const adminForm = $('adminLoginForm');
if (adminForm) adminForm.addEventListener('submit', async (e) => {
  e.preventDefault(); const button = adminForm.querySelector('[type="submit"]'); button.disabled = true;
  try { await signIn(adminForm, 'admin'); }
  catch (err) { showMessage(adminForm, err.message); }
  finally { button.disabled = false; }
});

const registrationForm = $('studentRegistrationForm');
if (registrationForm) registrationForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = $('password').value;
  if (password !== $('confirmPassword').value) return showMessage(registrationForm, 'Your passwords do not match.');
  const button = registrationForm.querySelector('[type="submit"]'); button.disabled = true;
  try {
    const fullName = $('fullName').value.trim();
    const email = $('email').value.trim();
    const phone = $('phone').value.trim();
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, phone, level: $('level').value, programme: $('programme').value, preferred_session: $('session').value || null }, emailRedirectTo: `${location.origin}/portal/student/student-login.html` }
    });
    if (error) throw error;
    showMessage(registrationForm, 'Registration received. Check your email to confirm your account. Your URWA admission remains pending until administration reviews it.', false);
    registrationForm.reset();
  } catch (err) { showMessage(registrationForm, err.message || 'Registration could not be completed.'); }
  finally { button.disabled = false; }
});

// Toggle-password controls used by the existing login and registration designs.
document.querySelectorAll('[data-toggle-password]').forEach(btn => btn.addEventListener('click', () => {
  const input = $(btn.dataset.togglePassword); if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password'; btn.textContent = input.type === 'password' ? 'Show' : 'Hide';
}));

// Protect each dashboard using both an active Supabase session and database role/status.
const dashboard = document.body.dataset.urwaRole;
if (dashboard) (async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.replace(dashboard === 'student' ? '/portal/student/student-login.html' : dashboard === 'teacher' ? '/portal/abla/teacher-login.html' : '/portal/admin/login.html'); return; }
  try {
    const profile = await getProfile(session.user.id);
    if (profile.role !== dashboard || profile.status !== 'approved') throw new Error('Not authorised');
    document.querySelectorAll('[data-profile-name]').forEach(el => el.textContent = profile.full_name || 'URWA member');
    document.querySelectorAll('[data-profile-email]').forEach(el => el.textContent = profile.email || session.user.email || '');
  } catch (_) { await supabase.auth.signOut(); window.location.replace('/'); }
})();

document.querySelectorAll('[data-urwa-logout]').forEach(el => el.addEventListener('click', async (e) => {
  e.preventDefault(); await supabase.auth.signOut(); window.location.href = '/';
}));

// Student password recovery: send the reset email to the dedicated reset page.
const forgotPasswordForm = $('studentForgotPasswordForm');
if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = forgotPasswordForm.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const email = $('email')?.value.trim();
    if (!email) throw new Error('Enter the email address linked to your URWA account.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/portal/student/student-reset-password.html`
    });
    if (error) throw error;
    showMessage(forgotPasswordForm, 'Password reset instructions have been sent, if an account exists for that email. Please check your inbox.', false);
  } catch (err) {
    showMessage(forgotPasswordForm, err.message || 'Unable to send the password reset email.');
  } finally {
    button.disabled = false;
  }
});

// Set a new password after the user opens the Supabase recovery link.
const resetPasswordForm = $('studentResetPasswordForm');
if (resetPasswordForm) resetPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = resetPasswordForm.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const password = $('newPassword')?.value || '';
    const confirmation = $('confirmNewPassword')?.value || '';
    if (password.length < 8) throw new Error('Your new password must be at least 8 characters long.');
    if (password !== confirmation) throw new Error('Your passwords do not match.');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('This password-reset link is invalid or has expired. Request a new one.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    showMessage(resetPasswordForm, 'Your password has been updated. You can now sign in with your new password.', false);
    await supabase.auth.signOut();
    setTimeout(() => { window.location.href = '/portal/student/student-login.html'; }, 1200);
  } catch (err) {
    showMessage(resetPasswordForm, err.message || 'Your password could not be updated.');
  } finally {
    button.disabled = false;
  }
});
