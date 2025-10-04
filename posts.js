window.addEventListener('DOMContentLoaded', async () => {
  const raw = await fetch('./posts.txt').then(r => r.text()).catch(() => '');
  const lines = raw.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const posts = lines.map(line => {
    const [id, title, date, author, excerpt, content] = line.split('|');
    return { id, title, date, author, excerpt, content };
  });

  const container = document.getElementById('threads') || document.getElementById('postsList');
  const query = document.getElementById('search');

  function render(filter = '') {
    container.innerHTML = '';
    posts
      .filter(p => p.title.toLowerCase().includes(filter.toLowerCase()) || p.excerpt.toLowerCase().includes(filter.toLowerCase()))
      .forEach(p => {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
          <h3>${p.title}</h3>
          <p>${p.excerpt}</p>
          <small>${p.author} · ${p.date}</small>
        `;
        container.appendChild(card);
      });
  }

  render();

  if (query) {
    query.addEventListener('input', () => render(query.value));
  }
});
