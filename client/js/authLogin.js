// ✅ Auto switch: local vs deployed
const API_BASE =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://socks-zz58.onrender.com';

const loginBtn  = document.querySelector('.btn-login');
const errorBox  = document.getElementById('error-box');

// ---- UI helpers ----
function setLoading(on) {
  const text = loginBtn.querySelector('.btn-text');
  loginBtn.disabled = on;
  text.textContent  = on ? 'Signing in…' : 'Sign In';
}

function showError(msg) {
  errorBox.innerHTML = `<p>${msg}</p>`;
}

// ---- Submit ----
loginBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  errorBox.innerHTML = '';

  if (!email || !password) {
    showError('Both email and password are required!');
    return;
  }

  setLoading(true);

  try {
    const response = await axios.post(`${API_BASE}/api/login`, { email, password });

    sessionStorage.setItem('auth-token', response.data.token);
    window.location.href = 'dashboard.html';

  } catch (error) {
    const message =
      error?.response?.data?.error || 'Something went wrong. Please try again.';
    showError(message);
  } finally {
    setLoading(false);
  }
});