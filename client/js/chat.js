// ============================================
// KONECT — Chat Logic
// ============================================

// ✅ Auto switch API (local vs deployed)
const API_BASE =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://socks-zz58.onrender.com';

// ✅ Auth token
const token = sessionStorage.getItem('auth-token');

if (!token) {
  window.location.href = 'index.html';
}

// ✅ Socket connection (unchanged)
const socket = io(API_BASE, {
  auth: { token },
});

// URL params
const searchParams = new URLSearchParams(window.location.search);
const roomId       = searchParams.get('roomId');
const roomName     = searchParams.get('roomName') || 'Room';

// ---- DOM refs ----
const $messageForm  = document.querySelector('#messageForm');
const $messageInput = $messageForm ? $messageForm.querySelector('input[name="message"]') : null;
const $messages     = document.querySelector('#messages');
const $sendBtn      = document.getElementById('send-btn');
const $emptyState   = document.getElementById('empty-state');

// ---- Templates ----
const messageTemplate = document.querySelector('#message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// ---- My email from JWT ----
let myEmail = '';
try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  myEmail = payload.email || '';
} catch (_) {}

// ---- Header: set room name ----
const headerRoomName = document.getElementById('header-room-name');
if (headerRoomName) headerRoomName.textContent = `# ${roomName}`;
document.title = `${roomName} — Konect`;

// ============= EMOJI PICKER =============
const EMOJIS = [
  '😀','😂','😍','🥰','😎','🤔','😢','😅','😜','🙏',
  '👍','👎','❤️','🔥','💯','🎉','✨','💪','🙌','👏',
  '😤','🤩','😬','🥳','🫡','😇','🤣','😴','🤯','🫶'
];

const $emojiPicker = document.getElementById('emoji-picker');
const $emojiToggle = document.getElementById('emoji-toggle');

if ($emojiPicker && $emojiToggle) {
  EMOJIS.forEach((em) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = em;
    btn.addEventListener('click', () => {
      if ($messageInput) {
        $messageInput.value += em;
        $messageInput.focus();
      }
    });
    $emojiPicker.appendChild(btn);
  });

  $emojiToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    $emojiPicker.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if ($emojiPicker.classList.contains('open') &&
        !$emojiPicker.contains(e.target) &&
        e.target !== $emojiToggle) {
      $emojiPicker.classList.remove('open');
    }
  });
}

// ============= MOBILE SIDEBAR =============
const $sidebarEl      = document.getElementById('sidebar');
const $sidebarToggle  = document.getElementById('sidebar-toggle');
const $sidebarOverlay = document.getElementById('sidebar-overlay');

function checkMobileLayout() {
  if (!$sidebarToggle) return;
  if (window.innerWidth <= 768) {
    $sidebarToggle.style.display = 'flex';
  } else {
    $sidebarToggle.style.display = 'none';
    if ($sidebarEl) $sidebarEl.classList.remove('open');
    if ($sidebarOverlay) $sidebarOverlay.classList.remove('show');
  }
}

if ($sidebarToggle) {
  $sidebarToggle.addEventListener('click', () => {
    $sidebarEl && $sidebarEl.classList.toggle('open');
    $sidebarOverlay && $sidebarOverlay.classList.toggle('show');
  });
}

if ($sidebarOverlay) {
  $sidebarOverlay.addEventListener('click', () => {
    $sidebarEl && $sidebarEl.classList.remove('open');
    $sidebarOverlay.classList.remove('show');
  });
}

window.addEventListener('resize', checkMobileLayout);
checkMobileLayout();

// ============= AUTOSCROLL =============
function autoscroll() {
  if (!$messages) return;
  const last = $messages.lastElementChild;
  if (!last) return;
  const lastH   = last.offsetHeight + parseInt(getComputedStyle(last).marginBottom || '0');
  const visible = $messages.offsetHeight;
  const total   = $messages.scrollHeight;
  const offset  = $messages.scrollTop + visible;
  if (total - lastH <= offset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
}

// ============= FETCH MESSAGES =============
async function fetchMessages(id) {
  try {
    const res = await axios.get(
      `${API_BASE}/api/chat/${id}/messages`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (err) {
    console.error('Fetch messages error:', err);
    return null;
  }
}

// ============= RENDER MESSAGE =============
function appendMessage(msg) {
  if (!$messages) return;

  const isEvent = !!msg.is_event;
  const isOwn   = !isEvent && myEmail && msg.sender_mail === myEmail;

  let type = '';
  if (isEvent)    type = 'event';
  else if (isOwn) type = 'own';

  const displayName = isEvent ? '' : (isOwn ? 'You' : (msg.sender_mail || 'Unknown'));
  const time        = isEvent ? '' : moment(msg.createdAt).format('h:mm a');
  const body        = msg.message_text || '';

  const html = Mustache.render(messageTemplate, {
    userName:  displayName,
    message:   body,
    createdAt: time,
    type:      type,
  });

  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
}

// ============= LOAD ALL MESSAGES =============
async function useData(id) {
  const data = await fetchMessages(id);
  if (!$messages) return;

  $messages.innerHTML = '';

  if (!data || !data.length) {
    if ($emptyState) $emptyState.style.display = 'flex';
    return;
  }

  if ($emptyState) $emptyState.style.display = 'none';

  // API returns newest-first → reverse to show chronologically
  data.reverse().forEach((msg) => appendMessage(msg));
}

// ============= SEND MESSAGE =============
if ($messageForm) {
  $messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const message = $messageInput ? $messageInput.value.trim() : '';
    if (!message) return;

    if ($sendBtn) $sendBtn.disabled = true;

    // ✅ Socket emit (logic unchanged)
    socket.emit('sendMessage', { roomName, message });

    if ($messageInput) $messageInput.value = '';
    if ($emojiPicker)  $emojiPicker.classList.remove('open');

    setTimeout(() => {
      if ($sendBtn) $sendBtn.disabled = false;
    }, 300);
  });
}

// ============= SOCKET EVENTS (unchanged logic) =============
socket.on('connect', () => {
  console.log('Connected');
  socket.emit('joinRoom', { roomName });
});

socket.on('onlineUsers', ({ roomName: rName, users }) => {
  const enrichedUsers = (users || []).map((u) => ({
    name:   u,
    avatar: (u || 'U')[0].toUpperCase(),
  }));

  const html = Mustache.render(sidebarTemplate, {
    roomName: rName,
    users:    enrichedUsers,
  });

  const $sidebar = document.querySelector('#sidebar');
  if ($sidebar) $sidebar.innerHTML = html;
});

socket.on('receiveMessage', () => {
  if ($emptyState) $emptyState.style.display = 'none';
  useData(roomId);
});

// ============= INITIAL LOAD =============
useData(roomId);