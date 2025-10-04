// posts.js — надёжная загрузка + парсер + рендер + UX
const POSTS_VARIANTS = ['posts.txt', 'posts.md', 'posts.json'];
const POSTS_FILE_CACHE_BUSTER = '?v=' + Date.now();
const CONTAINER_ID = 'posts-container';
const TOAST_ID = 'toast';

async function fetchPostsFile() {
  for (const name of POSTS_VARIANTS) {
    try {
      const res = await fetch(name + POSTS_FILE_CACHE_BUSTER, { cache: 'no-store' });
      if (!res.ok) continue;
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      const text = await res.text();
      if (name.endsWith('.json')) return { type: 'json', name, data: JSON.parse(text) };
      return { type: 'text', name, data: text };
    } catch (e) {
      // try next
    }
  }
  throw new Error('no posts file found');
}

function showToast(text, ms = 1300) {
  const t = document.getElementById(TOAST_ID);
  if (!t) return;
  t.textContent = text;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
}

function parseTextBlocks(raw) {
  const blocks = raw.split(/(?=📡)/g).map(b => b.trim()).filter(Boolean);
  return blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const title = lines.shift();
    let speaker = '';
    if (lines[0] && lines[0].startsWith('🎙')) {
      speaker = lines.shift().replace('🎙', '').trim();
    }
    const dialog = lines.map(l => {
      if (!l) return null;
      if (l.startsWith('—')) {
        const raw = l.replace(/^—\s*/, '');
        const m = raw.match(/^([^:]{1,60}):\s*(.*)$/);
        if (m) return { name: m[1].trim(), text: m[2].trim() };
        return { name: null, text: raw };
      }
      return { name: null, text: l };
    }).filter(Boolean);
    return { title, speaker, dialog };
  });
}

function renderPostsFromData(dataObj) {
  const container = document.getElementById(CONTAINER_ID);
  container.innerHTML = '';
  const query = (document.getElementById('search')?.value || '').toLowerCase().trim();

  let blocks = [];
  if (dataObj.type === 'json') {
    // expected format: array of { title, speaker, dialog: [{name,text}, ...] } or simple text elements
    blocks = Array.isArray(dataObj.data) ? dataObj.data.map(item => {
      if (typeof item === 'string') {
        // simple lines — treat as text block
        return { title: item, speaker: '', dialog: [] };
      }
      return {
        title: item.title || '📡 Пост',
        speaker: item.speaker || item.host || '',
        dialog: Array.isArray(item.dialog) ? item.dialog.map(d => typeof d === 'string' ? { name: null, text: d } : d) : []
      };
    }) : [];
  } else {
    blocks = parseTextBlocks(dataObj.data);
  }

  blocks.forEach(block => {
    const fullText = (block.title + ' ' + (block.speaker || '') + ' ' + block.dialog.map(d => (d.name||'') + ' ' + d.text).join(' ')).toLowerCase();
    if (query && !fullText.includes(query)) return;

    const art = document.createElement('article');
    art.className = 'section-post';
    art.setAttribute('role', 'listitem');

    const h2 = document.createElement('h2'); h2.textContent = block.title; art.appendChild(h2);
    if (block.speaker) {
      const meta = document.createElement('div'); meta.className = 'post-meta'; meta.textContent = 'В эфире — ' + block.speaker; art.appendChild(meta);
    }

    const post = document.createElement('div'); post.className = 'post-efir';

    const actions = document.createElement('div'); actions.className = 'post-actions';
    const btnToggle = document.createElement('button'); btnToggle.className = 'icon-btn'; btnToggle.textContent = 'Свернуть'; btnToggle.setAttribute('aria-label', 'Свернуть реплики');
    const btnCopy = document.createElement('button'); btnCopy.className = 'icon-btn'; btnCopy.textContent = 'Копировать'; btnCopy.setAttribute('aria-label', 'Копировать текст эфира');
    const btnShare = document.createElement('button'); btnShare.className = 'icon-btn'; btnShare.textContent = 'Поделиться'; btnShare.setAttribute('aria-label', 'Поделиться эфиром');
    actions.appendChild(btnToggle); actions.appendChild(btnCopy); actions.appendChild(btnShare);
    art.appendChild(actions);

    const dialogWrap = document.createElement('div'); dialogWrap.className = 'dialog';

    let fallback = 0;
    block.dialog.forEach(entry => {
      const role = entry.name ? (entry.name.toLowerCase().includes('ведущ') ? 'you' : 'guest') : (fallback % 2 === 0 ? 'you' : 'guest');
      const row = document.createElement('div'); row.className = 'dialog-row';
      const avatar = document.createElement('div'); avatar.className = 'avatar ' + (role === 'you' ? 'avatar--you' : 'avatar--guest');
      const avatarChar = (entry.name && entry.name[0]) ? entry.name[0].toUpperCase() : (role === 'you' ? 'В' : 'Г');
      avatar.textContent = avatarChar;
      const body = document.createElement('div'); body.className = 'dialog-body';
      const nameEl = document.createElement('div'); nameEl.className = 'speaker-name'; nameEl.textContent = entry.name || (role === 'you' ? 'Ведущий' : 'Гость');
      const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = entry.text;
      body.appendChild(nameEl); body.appendChild(bubble);
      if (role === 'guest') {
        // guest on right visually (reverse)
        row.appendChild(body); row.appendChild(avatar);
      } else {
        row.appendChild(avatar); row.appendChild(body);
      }
      dialogWrap.appendChild(row);
      fallback++;
    });

    post.appendChild(dialogWrap);
    art.appendChild(post);
    container.appendChild(art);

    // interactions
    let collapsed = false;
    btnToggle.addEventListener('click', () => {
      collapsed = !collapsed;
      dialogWrap.style.display = collapsed ? 'none' : 'block';
      btnToggle.textContent = collapsed ? 'Развернуть' : 'Свернуть';
      showToast(collapsed ? 'Реплики свернуты' : 'Реплики развернуты', 900);
    });

    btnCopy.addEventListener('click', async () => {
      const payload = [block.title, block.speaker ? 'В эфире — ' + block.speaker : '', ...block.dialog.map(d => (d.name ? d.name + ': ' : '') + d.text)].join('\n');
      try {
        await navigator.clipboard.writeText(payload);
        showToast('Скопировано', 1000);
      } catch {
        showToast('Копирование недоступно', 1200);
      }
    });

    btnShare.addEventListener('click', () => {
      const payload = [block.title, block.speaker ? 'В эфире — ' + block.speaker : '', ...block.dialog.map(d => (d.name ? d.name + ': ' : '') + d.text)].join('\n');
      if (navigator.share) {
        navigator.share({ title: block.title, text: payload }).catch(()=>{});
      } else {
        const subject = encodeURIComponent(block.title);
        const body = encodeURIComponent(payload);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      }
    });
  });

  if (!document.getElementById(CONTAINER_ID).children.length) {
    document.getElementById(CONTAINER_ID).innerHTML = '<div class="placeholder">Эфиров не найдено.</div>';
  }
}

async function loadPosts() {
  const container = document.getElementById(CONTAINER_ID);
  container.innerHTML = '<div class="placeholder">Загрузка...</div>';
  try {
    const file = await fetchPostsFile();
    if (file.type === 'json') {
      renderPostsFromData({ type: 'json', data: file.data });
    } else {
      renderPostsFromData({ type: 'text', data: file.data });
    }
  } catch (e) {
    container.innerHTML = '<div class="placeholder">Ошибка загрузки эфиров. Проверьте наличие posts.txt/posts.json</div>';
    console.error(e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search')?.addEventListener('input', () => loadPosts());
  document.getElementById('refresh')?.addEventListener('click', () => loadPosts());
  document.getElementById('sample')?.addEventListener('click', () => {
    // preview sample (local only)
    const container = document.getElementById(CONTAINER_ID);
    const sample = `
📡 Примерный эфир
🎙 В эфире — Тестовый спикер
— Ведущий: Добрый вечер, это тестовый эфир.
— Тестовый спикер: Спасибо, рад быть в эфире.
`;
    // prepend sample visually
    const blocks = parseTextBlocks(sample);
    renderPostsFromData({ type: 'text', data: sample + '\n' + (document._lastRaw || '') });
    showToast('Пример добавлен (локально)', 1200);
  });
  loadPosts();
});
