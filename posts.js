// posts.js — загружает и рендерить posts.txt
const POSTS_FILE = 'posts.txt';

async function loadPosts() {
  try {
    const res = await fetch(POSTS_FILE + '?v=' + Date.now());
    if (!res.ok) throw new Error('Не удалось загрузить posts.txt');
    const text = await res.text();
    renderPosts(text);
  } catch (e) {
    document.getElementById('posts-container').textContent = 'Ошибка загрузки эфира.';
    console.error(e);
  }
}

function renderPosts(raw) {
  const container = document.getElementById('posts-container');
  container.innerHTML = '';
  const blocks = raw.split(/(?=📡)/g).map(b => b.trim()).filter(Boolean);
  const searchInput = document.getElementById('search');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  blocks.forEach(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const titleLine = lines[0].startsWith('📡') ? lines[0] : '📡 ' + lines[0];
    let speakerLine = lines[1] && lines[1].startsWith('🎙') ? lines[1] : '';
    const dialogLines = lines.slice(speakerLine ? 2 : 1);

    const fullText = (titleLine + ' ' + speakerLine + ' ' + dialogLines.join(' ')).toLowerCase();
    if (query && !fullText.includes(query)) return;

    const section = document.createElement('article');
    section.className = 'section-post';

    const h2 = document.createElement('h2');
    h2.textContent = titleLine;
    section.appendChild(h2);

    const meta = document.createElement('div');
    meta.className = 'post-meta';
    meta.textContent = speakerLine || '';
    section.appendChild(meta);

    const postEfir = document.createElement('div');
    postEfir.className = 'post-efir';

    // actions
    const actions = document.createElement('div');
    actions.className = 'post-actions';
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Свернуть';
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Копировать';
    actions.appendChild(toggleBtn);
    actions.appendChild(copyBtn);
    postEfir.appendChild(actions);

    // dialog container
    const dialog = document.createElement('div');
    dialog.className = 'dialog';

    dialogLines.forEach(line => {
      const item = document.createElement('div');
      const trimmed = line.replace(/^—\s?/, '').trim();
      if (line.startsWith('—')) {
        item.className = 'you';
        item.textContent = '— ' + trimmed;
      } else {
        item.className = 'guest';
        item.textContent = line;
      }
      dialog.appendChild(item);
    });

    postEfir.appendChild(dialog);
    section.appendChild(postEfir);
    container.appendChild(section);

    // toggle logic
    let collapsed = false;
    toggleBtn.addEventListener('click', () => {
      collapsed = !collapsed;
      dialog.style.display = collapsed ? 'none' : '';
      toggleBtn.textContent = collapsed ? 'Развернуть' : 'Свернуть';
    });

    // copy logic
    copyBtn.addEventListener('click', async () => {
      const textToCopy = [titleLine, speakerLine, ...dialogLines].join('\n');
      try {
        await navigator.clipboard.writeText(textToCopy);
        copyBtn.textContent = 'Скопировано';
        setTimeout(()=> copyBtn.textContent = 'Копировать', 1500);
      } catch {
        alert('Копирование недоступно');
      }
    });
  });

  if (container.children.length === 0) {
    container.textContent = 'Эфиров не найдено.';
  }
}

// search + refresh handlers
document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('search');
  const refresh = document.getElementById('refresh');
  if (search) {
    search.addEventListener('input', () => {
      loadPosts();
    });
  }
  if (refresh) refresh.addEventListener('click', () => loadPosts());
  loadPosts();
});
