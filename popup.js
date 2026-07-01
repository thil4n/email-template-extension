const KEY = 'templates';

// A couple of starter templates seeded on first install.
const DEFAULTS = [
  {
    id: 'seed-followup',
    name: 'Meeting follow-up',
    subject: 'Follow-up on our meeting',
    body:
      'Hi,\n\nThanks for taking the time to meet today. Here is a quick summary of what we discussed and the next steps:\n\n- \n- \n\nLet me know if I missed anything.\n\nBest regards,',
  },
  {
    id: 'seed-intro',
    name: 'Quick intro',
    subject: '',
    body: 'Hi,\n\nHope you are doing well. I wanted to reach out regarding ...\n\nBest regards,',
  },
];

let templates = [];
let editingId = null;

const listEl = document.getElementById('list');
const editorEl = document.getElementById('editor');
const newBtn = document.getElementById('new-btn');
const nameEl = document.getElementById('f-name');
const subjectEl = document.getElementById('f-subject');
const bodyEl = document.getElementById('f-body');

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
    if (t.subject) {
      const sub = document.createElement('div');
      sub.className = 'row-sub';
      sub.textContent = t.subject;
      info.appendChild(sub);
    }
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
  subjectEl.value = t ? t.subject || '' : '';
  bodyEl.value = t ? t.body : '';
  editorEl.classList.remove('hidden');
  listEl.classList.add('hidden');
  newBtn.classList.add('hidden');
  nameEl.focus();
}

function closeEditor() {
  editorEl.classList.add('hidden');
  listEl.classList.remove('hidden');
  newBtn.classList.remove('hidden');
}

newBtn.addEventListener('click', () => openEditor(null));
document.getElementById('cancel-btn').addEventListener('click', closeEditor);

document.getElementById('save-btn').addEventListener('click', () => {
  const name = nameEl.value.trim();
  if (!name) {
    nameEl.focus();
    return;
  }
  const subject = subjectEl.value.trim();
  const body = bodyEl.value;

  if (editingId) {
    const t = templates.find((x) => x.id === editingId);
    if (t) {
      t.name = name;
      t.subject = subject;
      t.body = body;
    }
  } else {
    templates.push({ id: uid(), name, subject, body });
  }

  save();
  render();
  closeEditor();
});

load();
