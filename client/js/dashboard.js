// ============================================
// KONECT — Dashboard Logic
// ============================================

// ✅ Auto switch API (local vs deployed)
const API_BASE =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://konect-b.onrender.com';

// ✅ Token helpers
const getToken = () => sessionStorage.getItem('auth-token');

// 🔐 Protect route
if (!getToken()) {
  window.location.href = 'index.html';
}

// ---- DOM refs ----
const leaveBtn     = document.getElementById('leave-btn');
const createBtn    = document.getElementById('create-btn');
const seeBtn       = document.getElementById('see-btn');
const roomList     = document.getElementById('room-list');
const errorBox     = document.getElementById('error-box');
const roomsSection = document.getElementById('rooms-section');
const roomsCount   = document.getElementById('rooms-count');

// ---- Toast ----
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => { toast.className = `toast ${type}`; }, 2800);
}

// ---- Avatar initial from JWT ----
(function initAvatar() {
  try {
    const payload = JSON.parse(atob(getToken().split('.')[1]));
    const initial = (payload.email || 'U')[0].toUpperCase();
    const el = document.getElementById('nav-avatar-letter');
    if (el) el.textContent = initial;
  } catch (_) {}
})();

// ---- Logout ----
if (leaveBtn) {
  leaveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('auth-token');
    window.location.href = 'index.html';
  });
}

// ---- Create Room ----
if (createBtn) {
  createBtn.addEventListener('click', async () => {
    const token    = getToken();
    const roomName = document.getElementById('message-input').value.trim();

    if (errorBox) errorBox.innerHTML = '';

    if (!roomName) {
      if (errorBox) errorBox.innerHTML = '<p>Room name cannot be empty.</p>';
      return;
    }

    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';

    try {
      await axios.post(
        `${API_BASE}/api/chat`,
        { name: roomName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      document.getElementById('message-input').value = '';
      showToast('Room created successfully', 'success');
      await loadRooms();

    } catch (error) {
      if (error?.response?.status === 401) {
        sessionStorage.removeItem('auth-token');
        window.location.href = 'index.html';
        return;
      }
      const message = error?.response?.data?.error || 'Failed to create room.';
      if (errorBox) errorBox.innerHTML = `<p>${message}</p>`;
    } finally {
      createBtn.disabled = false;
      createBtn.textContent = 'Create';
    }
  });
}

// ---- Refresh ----
if (seeBtn) {
  seeBtn.addEventListener('click', loadRooms);
}

// ---- Navigate to chat room ----
function joinRoom(room) {
  window.location.href = `chat.html?roomId=${encodeURIComponent(room.id)}&roomName=${encodeURIComponent(room.name)}`;
}

// ---- Render a single room <li> ----
function renderRoom(room) {
  const li = document.createElement('li');

  // Left: icon + info — clicking this joins the room
  const left = document.createElement('div');
  left.className = 'room-item-left';

  const icon = document.createElement('div');
  icon.className = 'room-icon';
  icon.textContent = '#';

  const info = document.createElement('div');
  info.className = 'room-info';

  const nameEl = document.createElement('div');
  nameEl.className = 'room-name';
  nameEl.textContent = room.name;

  const metaEl = document.createElement('div');
  metaEl.className = 'room-meta';
  metaEl.textContent = 'Click to join';

  info.appendChild(nameEl);
  info.appendChild(metaEl);
  left.appendChild(icon);
  left.appendChild(info);

  // Delete button (right side)
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'room-delete-btn';
  deleteBtn.title = 'Delete room';
  deleteBtn.setAttribute('aria-label', `Delete ${room.name}`);
  deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;

  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation(); // prevent li click
    if (!confirm(`Delete room "${room.name}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/chat/${room.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      showToast('Room deleted', '');
      await loadRooms();
    } catch {
      showToast('Failed to delete room', 'error');
    }
  });

  li.appendChild(left);
  li.appendChild(deleteBtn);

  // ✅ CRITICAL: Direct click on the li navigates to chat
  // Using onclick for maximum reliability (avoids bubbling issues)
  li.style.cursor = 'pointer';
  li.onclick = function (e) {
    // Ignore if delete button (or its child) was clicked
    if (deleteBtn.contains(e.target)) return;
    joinRoom(room);
  };

  return li;
}

// ---- Skeleton HTML ----
function skeletonHTML(count) {
  return Array.from({ length: count }, () => `
    <li style="pointer-events:none; cursor:default;">
      <div class="room-item-left">
        <div class="room-icon skeleton" style="border:none;"></div>
        <div class="skeleton-text">
          <div class="skeleton-line skeleton"></div>
          <div class="skeleton-line short skeleton"></div>
        </div>
      </div>
    </li>`
  ).join('');
}

// ---- Load all rooms ----
async function loadRooms() {
  const token = getToken();

  // Show skeleton while loading
  roomList.innerHTML = skeletonHTML(3);

  try {
    const response = await axios.get(`${API_BASE}/api/chat`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const rooms = response.data || [];

    // Update count badge
    if (roomsCount) {
      roomsCount.textContent = rooms.length
        ? `${rooms.length} ${rooms.length === 1 ? 'room' : 'rooms'}`
        : '';
    }

    // Clear and render
    roomList.innerHTML = '';

    if (!rooms.length) {
      roomList.innerHTML = `
        <li style="pointer-events:none;">
          <div class="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <h3>No rooms yet</h3>
            <p>Create a room above to get started</p>
          </div>
        </li>`;
      return;
    }

    rooms.forEach((room) => {
      roomList.appendChild(renderRoom(room));
    });

  } catch (error) {
    if (error?.response?.status === 401) {
      sessionStorage.removeItem('auth-token');
      window.location.href = 'index.html';
      return;
    }
    roomList.innerHTML = `
      <li style="pointer-events:none;">
        <div class="empty-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <h3>Failed to load rooms</h3>
          <p>Check your connection and try again</p>
        </div>
      </li>`;
  }
}

// ---- Allow Enter key to create room ----
const roomInput = document.getElementById('message-input');
if (roomInput) {
  roomInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createBtn && createBtn.click();
    }
  });
}

// ---- Auto-load on page ready ----
loadRooms();