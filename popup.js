const KEY = 'templates';

// A couple of starter templates seeded on first install.
const DEFAULTS = [
  {
    id: 'seed-followup',
    name: 'Meeting follow-up',
    body:
      'Hi,\n\nThanks for taking the time to meet today. Here is a quick summary of what we discussed and the next steps:\n\n- \n- \n\nLet me know if I missed anything.\n\nBest regards,',
  },
  {
    id: 'seed-intro',
    name: 'Quick intro',
    body: 'Hi,\n\nHope you are doing well. I wanted to reach out regarding ...\n\nBest regards,',
  },
];

let templates = [];
let editingId = null;

const listEl = document.getElementById('list');
const editorEl = document.getElementById('editor');
const footerEl = document.getElementById('footer');
const newBtn = document.getElementById('new-btn');
const nameEl = document.getElementById('f-name');
const bodyEl = document.getElementById('f-body');
const importFileEl = document.getElementById('import-file');

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load() {
  chrome.storage.local.get(KEY, (res) => {
    if (res[KEY] === undefined) {
      templates = DEFAULTS.slice();
      save();
    } else {
      templates = res[KEY];
    }
    render();
  });
}

function save() {
  chrome.storage.local.set({ [KEY]: templates });
}

function render() {
  listEl.innerHTML = '';

  if (!templates.length) {
    const e = document.createElement('div');
    e.className = 'empty';
    e.textContent = 'No templates yet. Click “＋ New” to create one.';
    listEl.appendChild(e);
    return;
  }

  templates.forEach((t) => {
    const row = document.createElement('div');
    row.className = 'row';

    const info = document.createElement('div');
    info.className = 'row-info';
    const name = document.createElement('div');
    name.className = 'row-name';
    name.textContent = t.name;
    info.appendChild(name);
    row.appendChild(info);

    const edit = document.createElement('button');
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => openEditor(t));
    row.appendChild(edit);

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.className = 'danger';
    del.addEventListener('click', () => {
      if (confirm(`Delete "${t.name}"?`)) {
        templates = templates.filter((x) => x.id !== t.id);
        save();
        render();
      }
    });
    row.appendChild(del);

    listEl.appendChild(row);
  });
}

function openEditor(t) {
  editingId = t ? t.id : null;
  nameEl.value = t ? t.name : '';
  bodyEl.value = t ? t.body : '';
  editorEl.classList.remove('hidden');
  listEl.classList.add('hidden');
  footerEl.classList.add('hidden');
  newBtn.classList.add('hidden');
  nameEl.focus();
}

function closeEditor() {
  editorEl.classList.add('hidden');
  listEl.classList.remove('hidden');
  footerEl.classList.remove('hidden');
  newBtn.classList.remove('hidden');
}

// ---------- backup: export / import ----------
function pad(n) {
  return String(n).padStart(2, '0');
}

function exportTemplates() {
  if (!templates.length) {
    alert('There are no templates to export yet.');
    return;
  }
  const json = JSON.stringify(templates, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const d = new Date();
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `email-templates-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importTemplates(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let parsed;
    try {
      parsed = JSON.parse(reader.result);
    } catch (e) {
      alert('That file is not valid JSON.');
      return;
    }
    if (!Array.isArray(parsed)) {
      alert('This backup file should contain a list of templates.');
      return;
    }
    const valid = parsed
      .filter((t) => t && typeof t.name === 'string' && typeof t.body === 'string')
      .map((t) => ({
        id: uid(),
        name: t.name,
        body: t.body,
      }));
    if (!valid.length) {
      alert('No valid templates were found in that file.');
      return;
    }
    if (!confirm(`Import ${valid.length} template(s)? They will be added to your current list.`)) {
      return;
    }
    templates = templates.concat(valid);
    save();
    render();
  };
  reader.readAsText(file);
}

document.getElementById('export-btn').addEventListener('click', exportTemplates);
document.getElementById('import-btn').addEventListener('click', () => importFileEl.click());
importFileEl.addEventListener('change', () => {
  const file = importFileEl.files[0];
  if (file) importTemplates(file);
  importFileEl.value = ''; // allow re-selecting the same file later
});

newBtn.addEventListener('click', () => openEditor(null));
document.getElementById('cancel-btn').addEventListener('click', closeEditor);

document.getElementById('save-btn').addEventListener('click', () => {
  const name = nameEl.value.trim();
  if (!name) {
    nameEl.focus();
    return;
  }
  const body = bodyEl.value;

  if (editingId) {
    const t = templates.find((x) => x.id === editingId);
    if (t) {
      t.name = name;
      t.body = body;
    }
  } else {
    templates.push({ id: uid(), name, body });
  }

  save();
  render();
  closeEditor();
});

load();
