import { supabase } from './supabase.js';

const formLabels = {
  general: 'General enquiry',
  contact: 'Contact enquiry',
  enrolment: 'Enrolment enquiry'
};

function announce(form, message, isError = false) {
  let status = form.querySelector('[data-enquiry-status]');
  if (!status) {
    status = document.createElement('p');
    status.dataset.enquiryStatus = '';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.style.cssText = 'margin-top:14px;padding:12px 14px;border-radius:9px;font-size:.9rem;line-height:1.6;';
    form.append(status);
  }
  status.textContent = message;
  status.style.background = isError ? '#fff0ed' : '#e3f0ea';
  status.style.color = isError ? '#8c2f20' : '#0e4a40';
}

document.querySelectorAll('form[data-urwa-enquiry]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const button = form.querySelector('[type="submit"]');
    const originalText = button?.textContent || 'Submit';
    const values = Object.fromEntries(new FormData(form).entries());
    const fullName = String(values.name || values.full_name || '').trim();
    const email = String(values.email || '').trim().toLowerCase();
    const phone = String(values.phone || '').trim();
    const message = String(values.message || values.goals || values.learning_goals || '').trim();
    const kind = form.dataset.urwaEnquiry || 'general';

    if (fullName.length < 2 || !email || message.length < 5) {
      announce(form, 'Please provide your name, a valid email address and a message of at least 5 characters.', true);
      return;
    }

    const metadata = {};
    for (const [key, value] of Object.entries(values)) {
      if (!['name', 'full_name', 'email', 'phone', 'message'].includes(key)) {
        metadata[key] = typeof value === 'string' ? value.trim() : value;
      }
    }

    if (button) {
      button.disabled = true;
      button.textContent = 'Submitting…';
    }

    try {
      const { error } = await supabase.from('public_enquiries').insert({
        full_name: fullName,
        email,
        phone: phone || null,
        enquiry_type: String(values.type || values.enquiry_type || formLabels[kind] || kind).trim(),
        message,
        source: kind,
        metadata
      });
      if (error) throw error;
      form.reset();
      announce(form, kind === 'enrolment'
        ? 'Your enrolment enquiry has been received by URWA. The team will review your details and contact you about the next steps. This does not reserve a class place or create an account.'
        : 'Thank you. Your enquiry has been submitted successfully to URWA. Our team will review it and get back to you.');
    } catch (error) {
      console.error('URWA enquiry submission failed:', error);
      announce(form, 'We could not submit your enquiry just now. Please check your connection and try again. If the issue continues, contact URWA directly.', true);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  });
});
