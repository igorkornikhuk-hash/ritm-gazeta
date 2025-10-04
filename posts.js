// Легка та надійна логіка для posts.txt
const POSTS_FILE = 'posts.txt';
const containerId = 'posts-container';

async function loadPosts() {
  const container = document.getElementById(containerId);
  try {
    const res = await fetch(POSTS_FILE + '?v=' + Date.now());
    if (!res.ok) throw new Error('Не удалось загрузить posts.txt');
    const raw = await res.text();
    renderPosts(raw);
  } catch (err) {
    container.innerHTML = `<div class="placeholder">Ошибка загрузки эфира. Проверьте posts.txt</div>`;
    console.error(err);
  }
}

function renderPosts(raw) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const blocks = raw.split(/(?=📡)/g).map(b => b.trim()).filter(Boolean);
  const query = (document.getElementById('search')?.value || '').toLowerCase().trim();

  blocks.forEach(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;

    const title = lines[0].startsWith('📡') ? lines[0] : '📡 ' + lines[0];
    let speaker = '';
    let start = 1;
    if (lines[1] && lines[1].startsWith('🎙')) { speaker = lines[1]; start = 2; }
    const dialog = lines.slice(start);

    const textFull = (title + ' ' + speaker + ' ' + dialog.join(' ')).toLowerCase();
    if (query && !textFull.includes(query)) return;

    const article = document.createElement('article');
    article.className = 'section-post';

    const h2 = document.createElement('h2'); h2.textContent = title; article.appendChild(h2);
    if (speaker) { const meta = document.createElement('div'); meta.className = 'post-meta'; meta.textContent = speaker; article.appendChild(meta); }

    const postEfir = document.createElement('div'); postEfir.className = 'post-efir';

    const actions = document.createElement('div'); actions.className = 'post-actions';
    const toggle = document.createElement('button'); toggle.textContent = 'Свернуть';
    const copy = document.createElement('button'); copy.textContent = 'Копировать';
    actions.appendChild(toggle); actions.appendChild(copy); article.appendChild(actions);

    const d = document.createElement('div'); d.className = 'dialog';
    dialog.forEach((ln, idx) => {
      const el = document.createElement('div');
      const text = ln.replace(/^—\s?/, '');
      el.textContent = '— ' + text;
      el.className = (idx % 2 === 0) ? 'you' : 'guest';
      d.appendChild(el);
    });

    postEfir.appendChild(d); article.appendChild(postEfir); container.appendChild(article);

    let collapsed = false;
    toggle.addEventListener('click', () => {
      collapsed = !collapsed;
      d.style.display = collapsed ? 'none' : 'flex';
      toggle.textContent = collapsed ? 'Развернуть' : 'Свернуть';
    });

    copy.addEventListener('click', async () => {
      const payload = [title, speaker, ...dialog].join('\n');
      try { await navigator.clipboard.writeText(payload); copy.textContent = 'Скопировано'; setTimeout(()=>copy.textContent='Копировать',1200); }
      catch { alert('Копирование недоступно'); }
    });
  });

  if (!container.children.length) container.innerHTML = '<div class="placeholder">Эфиров не найдено.</div>';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search')?.addEventListener('input', () => loadPosts());
  document.getElementById('refresh')?.addEventListener('click', () => loadPosts());
  loadPosts();
});
