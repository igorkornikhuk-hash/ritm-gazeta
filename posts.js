fetch('posts.txt')
  .then(response => response.text())
  .then(text => {
    const container = document.getElementById('posts-container');
    const blocks = text.split(/📡/).filter(b => b.trim());

    container.innerHTML = '';

    blocks.forEach(raw => {
      const lines = raw.trim().split('\n').filter(l => l.trim());
      const title = '📡' + lines[0];
      const speaker = lines[1] || '';
      const dialogLines = lines.slice(2);

      const section = document.createElement('section');
      section.className = 'section';

      const h2 = document.createElement('h2');
      h2.textContent = title;
      section.appendChild(h2);

      const block = document.createElement('div');
      block.className = 'post-efir';

      const intro = document.createElement('p');
      intro.innerHTML = `<b>${speaker}</b>`;
      block.appendChild(intro);

      const dialog = document.createElement('div');
      dialog.className = 'dialog';

      dialogLines.forEach(line => {
        const div = document.createElement('div');
        div.className = line.startsWith('—') ? 'you' : 'guest';
        div.textContent = line;
        dialog.appendChild(div);
      });

      block.appendChild(dialog);
      section.appendChild(block);
      container.appendChild(section);
    });
  });
