const $ = (selector) => document.querySelector(selector);

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}.`);
  return data;
}

/* ── Login page ── */
const loginForm = $('[data-login-form]');
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = $('[data-login-message]');
    const button = loginForm.querySelector('button[type=submit]');
    button.disabled = true;
    message.hidden = false; message.className = 'form-message'; message.textContent = 'Signing in…';
    try {
      await api('/api/portal/login', { method: 'POST', body: JSON.stringify({ email: loginForm.email.value, password: loginForm.password.value }) });
      window.location.href = 'dashboard.html';
    } catch (error) {
      message.className = 'form-message error';
      message.textContent = error.message;
      button.disabled = false;
    }
  });
}

/* ── Activation page ── */
const activateLoading = $('[data-activate-loading]');
const activateFormWrap = $('[data-activate-form]');
const activateErrorWrap = $('[data-activate-error]');
const setPasswordForm = $('[data-set-password-form]');

if (activateLoading) {
  (async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      showActivateError('This activation link is missing required information. Please use the link from your email or contact support@shedlr.com.');
      return;
    }

    try {
      const data = await api('/api/portal/activate', { method: 'POST', body: JSON.stringify({ token }) });
      if (data.already_has_password) {
        showActivateError('This account has already been activated. Please sign in with your existing password.');
        return;
      }
      activateLoading.hidden = true;
      activateFormWrap.hidden = false;
      $('[data-activate-lead]').textContent = `Create a password for ${data.email} to finish setting up your client portal.`;
      setPasswordForm.dataset.activationToken = data.activation_token;
    } catch (error) {
      showActivateError(error.message);
    }
  })();

  setPasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = $('[data-activate-message]');
    const button = setPasswordForm.querySelector('button[type=submit]');
    const password = setPasswordForm.password.value;
    const confirmPassword = setPasswordForm.confirmPassword.value;
    message.hidden = false; message.className = 'form-message'; message.textContent = '';

    if (password !== confirmPassword) {
      message.className = 'form-message error';
      message.textContent = 'Passwords do not match.';
      return;
    }

    button.disabled = true;
    message.textContent = 'Setting up your portal…';
    try {
      await api('/api/portal/set-password', { method: 'POST', body: JSON.stringify({ token: setPasswordForm.dataset.activationToken, password }) });
      window.location.href = 'dashboard.html';
    } catch (error) {
      message.className = 'form-message error';
      message.textContent = error.message;
      button.disabled = false;
    }
  });
}

function showActivateError(text) {
  activateLoading.hidden = true;
  if (activateFormWrap) activateFormWrap.hidden = true;
  if (activateErrorWrap) {
    activateErrorWrap.hidden = false;
    $('[data-activate-error-text]').textContent = text;
  }
}

/* ── Password visibility toggle ── */
document.querySelectorAll('input[type="password"]').forEach(input=>{
  const wrapper=document.createElement('div');
  wrapper.className='password-field';
  wrapper.style.position='relative';
  input.parentNode.insertBefore(wrapper,input);
  wrapper.appendChild(input);
  const toggle=document.createElement('button');
  toggle.type='button';
  toggle.className='password-toggle';
  toggle.innerHTML='\u25C9';
  toggle.setAttribute('aria-label','Show or hide password');
  toggle.addEventListener('click',()=>{
    if(input.type==='password'){input.type='text';toggle.innerHTML='\u25CD';}else{input.type='password';toggle.innerHTML='\u25C9';}
  });
  wrapper.appendChild(toggle);
});
