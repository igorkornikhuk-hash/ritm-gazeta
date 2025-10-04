// posts.js — простий движок для завантаження та рендерингу статей із posts.txt
// Підтримуваний формат posts.txt:
// ---
// id|title|date|author|excerpt|image|content
// |
// Поля розділяються символом |, записи — новим рядком, коментарі починаються з #
// ---

/* example fallback data (використовується якщо posts.txt не доступний) */
const FALLBACK = [
  {
    id: "1",
    title: "Лучшее мнение за неделю",
    date: "2025-10-04T18:00:00Z",
    author: "Гость",
    excerpt: "Я всегда считал, что музыка нас удерживает вместе — и теперь я знаю, что это правда.",
    image: "./assets/placeholder-1.jpg",
    content: "<p>Музыка — это ткань, которая связывает воспоминания и людей.</p>"
  },
  {
    id: "2",
    title: "Репортаж: районный эфир",
    date: "2025-10-03T12:00:00Z",
    author: "Редакция",
    excerpt: "Короткие визуальные истории о людях, которые меняют свои города изнутри.",
    image: "./assets/placeholder-2.jpg",
    content: "<p>Мы отправились в пригород, чтобы услышать местные голоса.</p>"
  }
];

window.postsData = []; // глобальний масив постів

async function loadPostsText() {
  try {
    const res = await fetch('./posts.txt', {cache: "no-store"});
    if (!res.ok) throw new Error('no posts.txt');
    const txt = await res.text();
    document.getElementById && document.getElementById('rawSource') && (document.getElementById('rawSource').textContent = txt);
    return parsePostsTxt(txt);
  } catch (err) {
    console.warn('posts.txt не доступен, используем fallback', err);
    document.getElementById && document.getElementById('rawSource') && (document.getElementById('rawSource').textContent = 'Используется локальный fallback данных.');
    return FALLBACK;
  }
}

function parsePostsTxt(txt) {
  const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const out = [];
  for (const line of lines) {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 6) continue;
    const [id, title, date, author, excerpt, image, ...contentRest] = parts;
    const content = contentRest.join('|') || excerpt;
    out.push({ id, title, date, author, excerpt, image: image || './assets/placeholder-1.jpg', content: content.replace(/\\n/g, '<br>') });
  }
  return out;
}

function formatDateISO(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleString();
  } catch { return d; }
}

function createCard(post) {
  const div = document.createElement('article');
  div.className = 'card';
  div.innerHTML = `
    <a class="card-link" href="./posts.html#post-${post.id}">
      <div class="card-media"><img src="${post.image}" alt="${escapeHtml(post.title)}"></div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(post.title)}</h3>
        <p class="card-excerpt">${escapeHtml(post.excerpt)}</p>
        <p class="card-meta">${escapeHtml(post.author)} · ${formatDateISO(post.date)}</p>
      </div>
    </a>
  `;
  return div;
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

window.renderPosts = function() {
  const listEl = document.getElementById('postsList') || document.getElementById('featured');
  if (!listEl) return;
  const q = (document.getElementById('search') && document.getElementById('search').value || '').toLowerCase();
  const sortSel = document.getElementById('sort') && document.getElementById('sort').value || 'new';
  let items = Array.from(window.postsData);
  if (q) items = items.filter(p => (p.title + ' ' + p.excerpt + ' ' + p.content).toLowerCase().includes(q));
  if (sortSel === 'new') items.sort((a,b)=> new Date(b.date) - new Date(a.date));
  if (sortSel === 'old') items.sort((a,b)=> new Date(a.date) - new Date(b.date));
  if (sortSel === 'alpha') items.sort((a,b)=> a.title.localeCompare(b.title, 'ru'));
  listEl.innerHTML = '';
  if (!items.length) {
    listEl.innerHTML = '<p class="empty">Пока нет подходящих статей.</p>';
    return;
  }
  for (const p of items) {
    listEl.appendChild(createCard(p));
  }
};

async function init() {
  const data = await loadPostsText();
  window.postsData = data.map(d => ({
    id: d.id,
    title: d.title,
    date: d.date || new Date().toISOString(),
    author: d.author || 'Редакция',
    excerpt: d.excerpt || '',
    image: d.image || './assets/placeholder-1.jpg',
    content: d.content || ''
  }));
  renderPosts();
  // если URL содержит хеш на пост — показать его (простая навигация)
  const hash = location.hash;
  if (hash && hash.startsWith('#post-')) {
    const id = hash.replace('#post-','');
    const found = window.postsData.find(p=>p.id===id);
    if (found) {
      showPostModal(found);
    }
  }
}

function showPostModal(post) {
  // простий модальний перегляд статті
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <article class="modal-article">
      <button class="modal-close" aria-label="Закрыть">✕</button>
      <h2>${escapeHtml(post.title)}</h2>
      <p class="card-meta">${escapeHtml(post.author)} · ${formatDateISO(post.date)}</p>
      <img src="${post.image}" alt="${escapeHtml(post.title)}">
      <div class="modal-body">${post.content}</div>
    </article>
  `;
  document.body.appendChild(modal);
  document.body.classList.add('modal-open');
  modal.querySelector('.modal-close').addEventListener('click', () => {
    modal.remove();
    document.body.classList.remove('modal-open');
    history.replaceState(null, '', location.pathname);
  });
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a.card-link');
  if (a) {
    e.preventDefault();
    const href = a.getAttribute('href');
    const m = href && href.match(/#post-(\d+)/);
    if (m) {
      const id = m[1];
      const found = window.postsData.find(p => p.id === id);
      if (found) {
        history.pushState(null, '', `#post-${id}`);
        showPostModal(found);
      }
    }
  }
});

window.addEventListener('DOMContentLoaded', init);
