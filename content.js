// Content script: adds a template picker to Gmail compose AND reply windows.
(() => {
  // The message body exists in new compose windows and inline replies alike,
  // so we anchor everything to it. (Replies have no subject box.)
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

  // Find the subject box for this compose window by climbing up from the
  // body. Returns null for replies (which reuse the thread's subject).
  function findSubject(body) {
    let node = body.parentElement;
    while (node && node !== document.body) {
      const s = node.querySelector(SUBJECT_SELECTOR);
      if (s) return s;
      node = node.parentElement;
    }
    return null;
  }

  function insertTemplate(body, tpl) {
    // Subject: only fill it if present (compose) and not already typed.
    const subject = findSubject(body);
    if (subject && tpl.subject && !subject.value.trim()) {
      subject.value = tpl.subject;
      subject.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Body: insert at the caret, or at the start if the body isn't focused.
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

  function openPopover(btn, body) {
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
          insertTemplate(body, t);
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

  // ---------- inject a button onto each compose/reply body ----------
  function injectButton(body) {
    if (body.dataset.gtplInjected) return;
    body.dataset.gtplInjected = '1';

    // IMPORTANT: attach to the body's (non-editable) wrapper, never to the
    // body itself — anything inside the contenteditable gets sent in the email.
    const wrapper = body.parentElement;
    if (!wrapper) return;
    if (getComputedStyle(wrapper).position === 'static') {
      wrapper.style.position = 'relative';
    }

    const btn = document.createElement('div');
    btn.className = 'gtpl-btn';
    btn.setAttribute('role', 'button');
    btn.setAttribute('title', 'Insert email template');
    btn.textContent = '📋';
    wrapper.appendChild(btn);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (popover) {
        closePopover();
        return;
      }
      openPopover(btn, body);
    });
  }

  function scan() {
    document.querySelectorAll(BODY_SELECTOR).forEach(injectButton);
  }

  const observer = new MutationObserver(() => scan());
  observer.observe(document.body, { childList: true, subtree: true });
  scan();
})();
