(() => {
  const client = window.AGI_AUTH_CLIENT;
  const desktopNav = document.querySelector('.desktop-nav');
  const mobileNav = document.querySelector('.mobile-menu');
  if (!desktopNav || !mobileNav) return;

  const accountLink = document.createElement('a');
  accountLink.href = '#account';
  accountLink.className = 'account-link';
  accountLink.textContent = 'SIGN IN';
  desktopNav.insertBefore(accountLink, desktopNav.querySelector('.nav-play'));
  const mobileAccountLink = accountLink.cloneNode(true);
  mobileNav.insertBefore(mobileAccountLink, mobileNav.querySelector('.menu-bottom'));

  const dialog = document.createElement('dialog');
  dialog.className = 'account-dialog';
  dialog.id = 'account-dialog';
  dialog.setAttribute('aria-labelledby', 'account-title');
  dialog.innerHTML = `
    <button class="account-close" type="button" aria-label="Close account dialog">×</button>
    <span class="section-meta">4399AGI / ACCOUNT</span>
    <h2 id="account-title">SIGN IN<span>.</span></h2>
    <p class="account-intro">Your next jump starts here.</p>
    <div class="account-tabs" role="group" aria-label="Account form">
      <button type="button" data-mode="login" aria-pressed="true">SIGN IN</button>
      <button type="button" data-mode="signup" aria-pressed="false">SIGN UP</button>
    </div>
    <form class="account-form" novalidate>
      <div class="account-field signup-only" hidden><label for="account-username">Username</label><input id="account-username" name="username" autocomplete="username" minlength="3" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" aria-describedby="account-username-error"><small id="account-username-error" class="field-error"></small></div>
      <div class="account-field"><label for="account-email">Email</label><input id="account-email" name="email" type="email" autocomplete="email" required aria-describedby="account-email-error"><small id="account-email-error" class="field-error"></small></div>
      <div class="account-field"><label for="account-password">Password</label><input id="account-password" name="password" type="password" autocomplete="current-password" required aria-describedby="account-password-error"><small id="account-password-error" class="field-error"></small></div>
      <div class="account-field signup-only" hidden><label for="account-confirm">Confirm password</label><input id="account-confirm" name="confirm" type="password" autocomplete="new-password" aria-describedby="account-confirm-error"><small id="account-confirm-error" class="field-error"></small></div>
      <button class="account-submit" type="submit">SIGN IN <span aria-hidden="true">↗</span></button>
    </form>
    <div class="account-profile" hidden><p>Signed in as <strong id="account-username-display"></strong></p><button class="account-logout" type="button">LOG OUT ↗</button></div>
    <p class="account-status" role="status" aria-live="polite"></p>`;
  document.body.append(dialog);

  const form = dialog.querySelector('form');
  const status = dialog.querySelector('.account-status');
  const tabs = dialog.querySelector('.account-tabs');
  const profilePanel = dialog.querySelector('.account-profile');
  const submit = dialog.querySelector('.account-submit');
  const field = name => form.elements.namedItem(name);
  let mode = 'login';
  let currentUser = null;
  let requestVersion = 0;
  let busy = false;

  function setStatus(message, error = false) {
    status.textContent = message;
    status.classList.toggle('is-error', error);
  }

  function clearFieldErrors() {
    for (const name of ['username', 'email', 'password', 'confirm']) {
      const input = field(name);
      input.removeAttribute('aria-invalid');
      document.getElementById(`account-${name}-error`).textContent = '';
    }
  }

  function fieldError(name, message) {
    field(name).setAttribute('aria-invalid', 'true');
    document.getElementById(`account-${name}-error`).textContent = message;
  }

  function setMode(next) {
    mode = next;
    clearFieldErrors();
    setStatus('');
    form.reset();
    dialog.querySelector('#account-title').innerHTML = next === 'signup' ? 'SIGN UP<span>.</span>' : 'SIGN IN<span>.</span>';
    dialog.querySelectorAll('.signup-only').forEach(el => { el.hidden = next !== 'signup'; });
    field('password').autocomplete = next === 'signup' ? 'new-password' : 'current-password';
    tabs.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === next)));
    submit.firstChild.textContent = next === 'signup' ? 'SIGN UP ' : 'SIGN IN ';
    field(next === 'signup' ? 'username' : 'email').focus();
  }

  function renderUser(user, username) {
    currentUser = user;
    const displayName = username || user?.email || 'ACCOUNT';
    [accountLink, mobileAccountLink].forEach(link => { link.textContent = user ? displayName : 'SIGN IN'; });
    profilePanel.hidden = !user;
    form.hidden = !!user;
    tabs.hidden = !!user;
    if (user) {
      dialog.querySelector('#account-username-display').textContent = displayName;
      dialog.querySelector('#account-title').innerHTML = 'ACCOUNT<span>.</span>';
    } else {
      dialog.querySelector('#account-title').innerHTML = 'SIGN IN<span>.</span>';
    }
  }

  async function loadProfile(user, version) {
    try {
      const { data, error } = await client.from('profiles').select('username').eq('id', user.id).maybeSingle();
      if (version !== requestVersion) return;
      if (error) {
        renderUser(user, null);
        setStatus('Signed in, but your profile could not be loaded. Please try again later.', true);
      } else {
        renderUser(user, data?.username || null);
        if (!data) setStatus('Signed in. Your profile is missing; please contact support.', true);
      }
    } catch {
      if (version !== requestVersion) return;
      renderUser(user, null);
      setStatus('Signed in, but your profile could not be loaded. Check your connection.', true);
    }
  }

  function handleAuthState(_event, session) {
    const version = ++requestVersion;
    if (!session?.user) {
      renderUser(null, null);
      return;
    }
    currentUser = session.user;
    renderUser(session.user, null);
    // Supabase requests must run after the auth callback returns.
    setTimeout(() => loadProfile(session.user, version), 0);
  }

  function openAccount(event) {
    event.preventDefault();
    if (document.body.classList.contains('menu-open')) document.querySelector('#menu-toggle')?.click();
    dialog.showModal();
    if (currentUser) dialog.querySelector('.account-logout').focus();
    else if (client) field(mode === 'signup' ? 'username' : 'email').focus();
    else dialog.querySelector('.account-close').focus();
  }
  [accountLink, mobileAccountLink].forEach(link => link.addEventListener('click', openAccount));
  dialog.querySelector('.account-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    clearFieldErrors();
    if (document.activeElement === document.body || document.activeElement === mobileAccountLink) {
      (matchMedia('(max-width: 700px)').matches ? document.querySelector('#menu-toggle') : accountLink)?.focus();
    }
  });
  tabs.addEventListener('click', event => {
    const button = event.target.closest('[data-mode]');
    if (button) setMode(button.dataset.mode);
  });

  if (!client) {
    form.hidden = true;
    tabs.hidden = true;
    const configured = !String(window.AGI_SUPABASE_CONFIG?.anonKey || '').includes('YOUR_')
      && !String(window.AGI_SUPABASE_CONFIG?.url || '').includes('YOUR_');
    setStatus(configured
      ? 'Account service is unavailable. Check your connection and try again later.'
      : 'Account sign-in is being set up. Please try again later.', true);
    return;
  }

  client.auth.onAuthStateChange(handleAuthState);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    clearFieldErrors();
    setStatus('');
    const email = field('email').value.trim();
    const password = field('password').value;
    let valid = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fieldError('email', 'Enter a valid email address.'); valid = false; }
    if (password.length < (mode === 'signup' ? 8 : 1)) { fieldError('password', mode === 'signup' ? 'Use at least 8 characters.' : 'Enter your password.'); valid = false; }
    const username = field('username').value.trim();
    if (mode === 'signup') {
      if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) { fieldError('username', 'Use 3–24 letters, numbers, or underscores.'); valid = false; }
      if (field('confirm').value !== password) { fieldError('confirm', 'Passwords do not match.'); valid = false; }
    }
    if (!valid) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }

    busy = true;
    submit.disabled = true;
    setStatus(mode === 'signup' ? 'Creating your account…' : 'Signing in…');
    try {
      if (mode === 'signup') {
        const { data, error } = await client.auth.signUp({
          email, password,
          options: { data: { username }, emailRedirectTo: new URL('index.html', location.href).href }
        });
        if (error) throw error;
        form.reset();
        setStatus(data.session
          ? 'Account created. You are signed in.'
          : 'Check your email to confirm your account, then sign in. If you already have an account, try signing in.');
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        form.reset();
        setStatus('Signed in.');
      }
    } catch (error) {
      const code = String(error?.code || '');
      const message = String(error?.message || '').toLowerCase();
      if (mode === 'login' && (code === 'invalid_credentials' || message.includes('invalid login'))) {
        fieldError('password', 'Email or password is incorrect.');
        setStatus('Email or password is incorrect.', true);
      } else if (mode === 'signup' && (message.includes('unique') || message.includes('database error'))) {
        fieldError('username', 'This username may already be taken. Try another.');
        setStatus('Could not create the account. Try another username or contact support.', true);
      } else if (code === 'email_not_confirmed') {
        setStatus('Please confirm your email before signing in.', true);
      } else if (code === 'user_already_exists' || message.includes('already registered')) {
        setStatus('An account may already use this email. Try signing in.', true);
      } else if (code === 'weak_password') {
        fieldError('password', 'Choose a stronger password.');
        setStatus('Choose a stronger password and try again.', true);
      } else {
        setStatus('Account request failed. Check your connection and try again.', true);
      }
    } finally {
      busy = false;
      submit.disabled = false;
    }
  });

  dialog.querySelector('.account-logout').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    setStatus('Signing out…');
    try {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
      renderUser(null, null);
      setStatus('Signed out.');
      setMode('login');
      setStatus('Signed out.');
    } catch {
      setStatus('Could not sign out. Check your connection and try again.', true);
    } finally {
      button.disabled = false;
    }
  });
})();
