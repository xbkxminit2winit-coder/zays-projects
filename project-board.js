const SHARED_BLOB_URL = 'https://jsonblob.com/api/jsonBlob/019fd3d1-c421-785f-8408-22d98ab735b9';
const STORAGE_KEY = 'zayProjectBoardEntries';
const PAGE_SIZE = 6;

const defaultEntries = [
  {
    id: 1,
    displayName: 'Zay',
    projectTitle: 'FlappyCat',
    projectLink: 'projects/uploads/flappycat.html',
    description: 'A playful cat-themed browser game released now.',
    postedAt: '2026-08-05T15:30:00'
  }
];

async function loadBoardState() {
  try {
    const response = await fetch(SHARED_BLOB_URL, { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.projects)) {
        return { projects: data.projects, visitorCount: Number(data.visitorCount || 0) };
      }
      if (Array.isArray(data)) {
        return { projects: data, visitorCount: 0 };
      }
    }
  } catch (error) {
    console.warn('Could not read shared project board data', error);
  }

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.projects)) {
      return saved;
    }
    if (Array.isArray(saved)) {
      return { projects: saved, visitorCount: 0 };
    }
  } catch (error) {
    console.warn('Could not read cached project board entries', error);
  }

  return { projects: defaultEntries, visitorCount: 0 };
}

async function saveBoardState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  try {
    await fetch(SHARED_BLOB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
  } catch (error) {
    console.warn('Could not sync project board to shared storage', error);
  }
}

function formatTimestamp(value) {
  const date = new Date(value);
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

async function renderBoard(page = 1) {
  const board = document.getElementById('projectBoard');
  const pagination = document.getElementById('paginationControls');
  const state = await loadBoardState();
  const entries = [...state.projects].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));

  if (!board) return;

  const start = (page - 1) * PAGE_SIZE;
  const visibleEntries = entries.slice(start, start + PAGE_SIZE);

  board.innerHTML = '';
  visibleEntries.forEach((entry) => {
    const card = document.createElement('article');
    card.className = 'community-project-card';
    card.innerHTML = `
      <div class="community-card-head">
        <div>
          <p class="community-name">${entry.displayName}</p>
          <h3>${entry.projectTitle}</h3>
        </div>
        <span class="project-status">${entry.postedAt ? formatTimestamp(entry.postedAt) : 'Recently posted'}</span>
      </div>
      <p>${entry.description || 'No description provided.'}</p>
      <a href="${entry.projectLink}" class="button button-primary" target="_blank" rel="noopener noreferrer">Open project</a>
    `;
    board.appendChild(card);
  });

  pagination.innerHTML = '';
  if (totalPages > 1) {
    for (let i = 1; i <= totalPages; i += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `page-switch ${i === page ? 'active' : ''}`;
      button.textContent = i;
      button.addEventListener('click', () => renderBoard(i));
      pagination.appendChild(button);
    }
  }
}

function openModal() {
  const modal = document.getElementById('projectModal');
  const form = document.getElementById('projectForm');
  const preview = document.getElementById('projectPreview');
  if (modal) modal.classList.remove('hidden');
  if (form) form.reset();
  if (preview) preview.innerHTML = '<p class="preview-placeholder">Your project preview will appear here.</p>';
}

function closeModal() {
  document.getElementById('projectModal')?.classList.add('hidden');
}

function updatePreview(formData) {
  const preview = document.getElementById('projectPreview');
  if (!preview) return;
  const displayName = formData.get('displayName') || 'Your name';
  const title = formData.get('projectTitle') || 'Your project';
  const link = formData.get('projectLink') || '#';
  const description = formData.get('description') || 'A short description will appear here.';
  preview.innerHTML = `
    <div class="preview-card-body">
      <p class="community-name">${displayName}</p>
      <h4>${title}</h4>
      <p>${description}</p>
      <a href="${link}" class="button button-primary" target="_blank" rel="noopener noreferrer">Preview link</a>
    </div>
  `;
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = new FormData(form);
  const entry = {
    id: Date.now(),
    displayName: data.get('displayName').toString().trim(),
    projectTitle: data.get('projectTitle').toString().trim(),
    projectLink: data.get('projectLink').toString().trim(),
    description: data.get('description').toString().trim(),
    postedAt: new Date().toISOString()
  };

  const state = await loadBoardState();
  const entries = [entry, ...state.projects];
  await saveBoardState({ ...state, projects: entries });
  closeModal();
  renderBoard(1);
}

window.addEventListener('DOMContentLoaded', () => {
  renderBoard();
  setInterval(() => renderBoard(), 8000);

  document.getElementById('openProjectModal')?.addEventListener('click', openModal);
  document.getElementById('closeModal')?.addEventListener('click', closeModal);
  document.getElementById('cancelModal')?.addEventListener('click', closeModal);
  document.getElementById('projectForm')?.addEventListener('submit', handleSubmit);
  document.getElementById('projectModal')?.addEventListener('click', (event) => {
    if (event.target.id === 'projectModal') closeModal();
  });

  document.querySelectorAll('#projectForm input, #projectForm textarea').forEach((field) => {
    field.addEventListener('input', () => updatePreview(new FormData(document.getElementById('projectForm'))));
  });
});
