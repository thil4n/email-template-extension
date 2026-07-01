// Content script: adds a template picker to Gmail compose windows.
(() => {
  const BODY_SELECTOR = 'div[contenteditable="true"][role="textbox"]';
  const SUBJECT_SELECTOR = 'input[name="subjectbox"]';

  let templates = [];

  // Load templates and keep them in sync with the popup manager.
  chrome.storage.local.get('templates', (res) => {
    templates = res.templates || [];
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.templates) {
      templates = changes.templates.newValue || [];
    }
  });

  // ---------- helpers ----------
  function textToHtml(text) {
    const esc = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return esc.replace(/\r\n|\r|\n/g, '<br>');
  }

  // Climb from the subject box to the enclosing compose window
  // (the nearest ancestor that also contains the message body).
  function getComposeRoot(el) {
    let node = el;
    while (node && node !== document.body) {
      if (node.querySelector && node.querySelector(BODY_SELECTOR)) return node;
      node = node.parentElement;
    }
    return document;
  }

  function insertTemplate(root, tpl) {
    // Subject: only fill it if the user hasn't typed one yet.
    const subject = root.querySelector(SUBJECT_SELECTOR);
    if (subject && tpl.subject && !subject.value.trim()) {
      subject.value = tpl.subject;
      subject.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Body: insert at the caret, or at the start if the body isn't focused.
    const body = root.querySelector(BODY_SELECTOR);
    if (!body) return;
    body.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount || !body.contains(sel.anchorNode)) {
      const range = document.createRange();
      range.selectNodeContents(body);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    document.execCommand('insertHTML', false, textToHtml(tpl.body));
  }

  // ---------- popover ----------
  let popover = null;

  function closePopover() {
    if (popover) {
      popover.remove();
      popover = null;
    }
    document.removeEventListener('mousedown', onDocDown, true);
  }

  function onDocDown(e) {
    if (
      popover &&
      !popover.contains(e.target) &&
      !e.target.classList.contains('gtpl-btn')
    ) {
      closePopover();
    }
  }

  function openPopover(btn, root) {
    closePopover();

    popover = document.createElement('div');
    popover.className = 'gtpl-popover';

    const search = document.createElement('input');
    search.className = 'gtpl-search';
    search.placeholder = 'Search templates…';
    popover.appendChild(search);

    const list = document.createElement('div');
    list.className = 'gtpl-list';
    popover.appendChild(list);

    function render(filter) {
      list.innerHTML = '';
      const f = (filter || '').toLowerCase();

      if (!templates.length) {
        const empty = document.createElement('div');
        empty.className = 'gtpl-empty';
        empty.textContent =
          'No templates yet. Click the extension icon in the toolbar to add some.';
        list.appendChild(empty);
        return;
      }

      const items = templates.filter(
        (t) =>
          !f ||
          t.name.toLowerCase().includes(f) ||
          (t.subject || '').toLowerCase().includes(f) ||
          (t.body || '').toLowerCase().includes(f)
      );

      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'gtpl-empty';
        empty.textContent = 'No matches.';
        list.appendChild(empty);
        return;
      }

      items.forEach((t) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'gtpl-item';

        const name = document.createElement('div');
        name.className = 'gtpl-item-name';
        name.textContent = t.name;
        row.appendChild(name);

        if (t.subject) {
          const sub = document.createElement('div');
          sub.className = 'gtpl-item-sub';
          sub.textContent = t.subject;
          row.appendChild(sub);
        }

        row.addEventListener('click', () => {
          insertTemplate(root, t);
          closePopover();
        });
        list.appendChild(row);
      });
    }

    render('');
    search.addEventListener('input', () => render(search.value));

    document.body.appendChild(popover);

    // Position under the button, keeping it inside the viewport.
    const r = btn.getBoundingClientRect();
    const width = 300;
    let left = r.left + window.scrollX;
    if (left + width > window.scrollX + document.documentElement.clientWidth) {
      left = window.scrollX + document.documentElement.clientWidth - width - 8;
    }
    popover.style.top = r.bottom + window.scrollY + 6 + 'px';
    popover.style.left = Math.max(8, left) + 'px';

    setTimeout(() => search.focus(), 0);
    document.addEventListener('mousedown', onDocDown, true);
  }

  // ---------- inject a button into each compose window ----------
  function injectButton(subject) {
    if (subject.dataset.gtplInjected) return;
    subject.dataset.gtplInjected = '1';

    const btn = document.createElement('div');
    btn.className = 'gtpl-btn';
    btn.setAttribute('role', 'button');
    btn.setAttribute('title', 'Insert email template');
    btn.textContent = '📋';

    const container = subject.parentElement;
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }
    container.appendChild(btn);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (popover) {
        closePopover();
        return;
      }
      openPopover(btn, getComposeRoot(subject));
    });
  }

  function scan() {
    document.querySelectorAll(SUBJECT_SELECTOR).forEach(injectButton);
  }

  const observer = new MutationObserver(() => scan());
  observer.observe(document.body, { childList: true, subtree: true });
  scan();
})();
