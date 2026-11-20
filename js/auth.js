/* URWA authentication is temporarily disconnected during the backend migration.
   The previous Supabase project URL and key have been removed.
   Reconnect this file only after the NEW Supabase project is configured and tested. */
(() => {
  const message = 'URWA account access is temporarily unavailable while we connect the new secure platform. Please try again shortly or contact URWA administration.';
  const show = (form) => {
    let note = form.querySelector('[data-auth-message], [data-form-message], .alert-note');
    if (!note) {
      note = document.createElement('p');
      note.setAttribute('role', 'status');
      note.setAttribute('aria-live', 'polite');
      note.className = 'auth-migration-notice';
      form.appendChild(note);
    }
    note.textContent = message;
    note.hidden = false;
  };

  document.querySelectorAll(
    '#studentLoginForm, #adminLoginForm, #studentRegistrationForm, #studentForgotPasswordForm, #studentResetPasswordForm, #adminActivationRequestForm, #adminPasswordSetupForm, [data-staff-login]'
  ).forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      show(form);
    });
  });

  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      button.textContent = input.type === 'password' ? 'Show' : 'Hide';
    });
  });

  document.querySelectorAll('[data-urwa-logout]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.href = '/';
    });
  });

  // Keep private dashboards inaccessible while there is no active auth provider.
  const role = document.body.dataset.urwaRole;
  if (role) {
    const login = role === 'student'
      ? '/portal/student/student-login.html'
      : role === 'teacher'
        ? '/portal/abla/teacher-login.html'
        : '/portal/admin/login.html';
    window.location.replace(login);
  }

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
  const year = document.getElementById('yr');
  if (year) year.textContent = new Date().getFullYear();
})();
