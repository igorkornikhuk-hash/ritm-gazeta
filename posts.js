// posts.js
document.addEventListener("DOMContentLoaded", () => {
  const postsContainer = document.getElementById('posts-container');
  fetch('posts.txt?' + new Date().getTime()) // cache-bust
    .then(response => {
      if (!response.ok) throw new Error('Ошибка загрузки постов');
      return response.text();
    })
    .then(data => {
      const postBlocks = data.split('---');
      let html = '';
      postBlocks.forEach(raw => {
        const trimmed = raw.trim();
        if (!trimmed) return;
        // парсим каждое поле вручную
        const titleMatch = trimmed.match(/^Заголовок:\s*(.+)$/m);
        const authorMatch = trimmed.match(/^Автор:\s*(.+)$/m);
        const dateMatch = trimmed.match(/^Дата:\s*(.+)$/m);
        const textMatch = trimmed.match(/^Текст:\s*([\s\S]+)$/m);
        html += `
          <div class="post-card animate-fadein">
            <div class="post-meta">
              <span class="post-date">${dateMatch ? dateMatch[1] : ''}</span>
              <span class="post-author">${authorMatch ? authorMatch[1] : ''}</span>
            </div>
            <h4 class="post-title">${titleMatch ? titleMatch[1] : 'Без названия'}</h4>
            <div class="post-text">${textMatch ? textMatch[1].replace(/\n/g, '<br>') : ''}</div>
          </div>
        `;
      });
      postsContainer.innerHTML = html || '<div class="posts-no">Пока нет постов.</div>';
    })
    .catch(err => {
      postsContainer.innerHTML = `<div class="posts-error">Не удалось загрузить посты. Попробуйте позже.</div>`;
    });
});
