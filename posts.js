// posts.js — сучасний рендер для posts.txt
const POSTS_FILE = 'posts.txt';
const containerId = 'posts-container';

async function loadPosts() {
  const container = document.getElementById(containerId);
  try {
    const res = await fetch(POSTS_FILE + '?v=' + Date.now());
    if (!res.ok) throw new Error('Failed to fetch posts');
    const raw = await res.text();
    renderPosts(raw);
  } catch (err) {
    container.innerHTML = '<div class="empty">Ошибка загрузки эфира. Проверь posts.txt и права доступа.</div>';
    console.error(err);
  }
}

function renderPosts(raw) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const blocks = raw.split(/(?=📡)/g).map(b => b.trim()).filter(Boolean);
  const query = (document.getElementById('search')?.value || '').trim().toLowerCase();

  blocks.forEach(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    // title
    const title = lines[0].startsWith('📡') ? lines[0] : '📡 ' + lines[0];
    let speaker = '';
    let dialogStart = 1;
    if (lines[1] && lines[1].startsWith('🎙')) {
      speaker = lines[1];
      dialogStart = 2;
    }

    const dialogLines = lines.slice(dialogStart);

    // search filter
    const fullText = (title + ' ' + speaker + ' ' + dialogLines.join(' ')).toLowerCase();
    if (query && !fullText.includes(query)) return;

    // build DOM
    const article = document.createElement('article');
    article.className = 'section-post';

    const h2 = document.createElement('h2');
    h2.textContent = title;
    article.appendChild(h2);

    if (speaker) {
      const meta = document.createElement('div');
      meta.className = 'post-meta';
      meta.textContent = speaker;
      article.appendChild(meta);
    }

    const post = document.createElement('div');
    post.className = 'post-efir';

    const actions = document.createElement('div');
    actions.className = 'post-actions';
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Свернуть';
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Копировать';
    actions.appendChild(toggleBtn);
    actions.appendChild(copyBtn);
    post.appendChild(actions);

    const dialog = document.createElement('div');
    dialog.className = 'dialog';

    dialogLines.forEach(line => {
      const item = document.createElement('div');
      const clean = line.replace(/^—\s?/, '').trim();
      // heuristic: if line starts with dash it's a spoken line
      if (line.startsWith('—')) {
        // alternate role coloring by position to add visual dialogue flow
        item.className = (Math.random() > 0.5) ? 'you' : 'guest';
        item.textContent = '— ' + clean;
      } else {
        item.className = 'guest';
        item.textContent = line;
      }
      dialog.appendChild(item);
    });

    post.appendChild(dialog);
    article.appendChild(post);
    container.appendChild(article);

    // interactions
    let collapsed = false;
    toggleBtn.addEventListener('click', () => {
      collapsed = !collapsed;
      dialog.style.display = collapsed ? 'none' : 'flex';
      toggleBtn.textContent = collapsed ? 'Развернуть' : 'Свернуть';
    });

    copyBtn.addEventListener('click', async () => {
      const textToCopy = [title, speaker, ...dialogLines].join('\n');
      try {
        await navigator.clipboard.writeText(textToCopy);
        copyBtn.textContent = 'Скопировано';
        setTimeout(() => copyBtn.textContent = 'Копировать', 1300);
      } catch {
        alert('Копирование недоступно');
      }
    });
  });

  if (!container.children.length) {
    container.innerHTML = '<div class="empty">Эфиров не найдено.</div>';
  }
}

// UI
document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('search');
  const refresh = document.getElementById('refresh');
  const sample = document.getElementById('new-sample');

  if (search) search.addEventListener('input', () => loadPosts());
  if (refresh) refresh.addEventListener('click', () => loadPosts());
  if (sample) sample.addEventListener('click', () => {
    // quick append sample block to posts.txt locally visible only (no write)
    const container = document.getElementById('posts-container');
    const sampleHtml = `
      <article class="section-post">
        <h2>📡 Примерный эфир</h2>
        <div class="post-meta">🎙 Тестовый спикер</div>
        <div class="post-efir">
          <div class="post-actions"><button>Свернуть</button><button>Копировать</button></div>
          <div class="dialog">
            <div class="you">— Тестовая строчка ведущего.</div>
            <div class="guest">— Ответ гостя.</div>
          </div>
        </div>
      </article>`;
    container.insertAdjacentHTML('afterbegin', sampleHtml);
  });

  loadPosts();
});
