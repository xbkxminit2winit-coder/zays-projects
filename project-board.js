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

function loadEntries() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) {
      return saved;
    }
  } catch (error) {
    console.warn('Could not read project board entries', error);
  }
  return defaultEntries;
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatTimestamp(value) {
  const date = new Date(value);
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function renderBoard(page = 1) {
  const board = document.getElementById('projectBoard');
  const pagination = document.getElementById('paginationControls');
  const entries = loadEntries().sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
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

function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const entry = {
    id: Date.now(),
    displayName: data.get('displayName').toString().trim(),
    projectTitle: data.get('projectTitle').toString().trim(),
    projectLink: data.get('projectLink').toString().trim(),
    description: data.get('description').toString().trim(),
    postedAt: new Date().toISOString()
  };

  const entries = loadEntries();
  entries.unshift(entry);
  saveEntries(entries);
  closeModal();
  renderBoard(1);
}

window.addEventListener('DOMContentLoaded', () => {
  renderBoard();

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
