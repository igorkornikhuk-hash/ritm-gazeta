// ---- ДОДАТКОВІ ХЕЛПЕРИ ДЛЯ ІЗОБРАЖЕНЬ ----
function detectImageLine(line) {
  // підтримує формати:
  // ![](images/foo.png)  або  image: images/foo.png
  const mdMatch = line.match(/^!\[\]\((.+\.(png|jpe?g|webp|gif))\)$/i);
  if (mdMatch) return mdMatch[1].trim();
  const kvMatch = line.match(/^image:\s*(.+\.(png|jpe?g|webp|gif))$/i);
  if (kvMatch) return kvMatch[1].trim();
  return null;
}

// ---- ОНОВЛЕНА parseTextBlocks: розпізнає image-рядки і витягує їх у поле images: [] ----
function parseTextBlocks(raw) {
  const blocks = raw.split(/(?=📡)/g).map(b => b.trim()).filter(Boolean);
  return blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const title = lines.shift();
    let speaker = '';
    if (lines[0] && lines[0].startsWith('🎙')) {
      speaker = lines.shift().replace('🎙', '').trim();
    }
    const images = [];
    const dialog = [];
    lines.forEach(l => {
      const img = detectImageLine(l);
      if (img) {
        images.push(img);
        return;
      }
      if (l.startsWith('—')) {
        const raw = l.replace(/^—\s*/, '');
        const m = raw.match(/^([^:]{1,60}):\s*(.*)$/);
        if (m) dialog.push({ name: m[1].trim(), text: m[2].trim() });
        else dialog.push({ name: null, text: raw });
      } else {
        dialog.push({ name: null, text: l });
      }
    });
    return { title, speaker, images, dialog };
  });
}

// ---- ПРИСТОСУВАННЯ renderPostsFromData: якщо блок має images[], рендерить їх над dialog ----
// Усередині renderPostsFromData або render() при переборі блоків:
// замінюємо отримання block.dialog на вже оновлену структуру з parseTextBlocks
// приклад (вставити замість частини, де створюється article/post):
// ...
// якщо block.images && block.images.length > 0 => рендер
if (Array.isArray(block.images) && block.images.length) {
  const gallery = document.createElement('div');
  gallery.className = 'post-images';
  block.images.forEach(src => {
    const wrap = document.createElement('div');
    wrap.className = 'post-image-wrap';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = block.title || 'Эфирный скрин';
    img.src = src;
    // встановлюємо додаткові атрибути для обробки помилок
    img.addEventListener('error', () => {
      wrap.classList.add('image-error');
      img.style.display = 'none';
    });
    wrap.appendChild(img);
    gallery.appendChild(wrap);
  });
  post.appendChild(gallery);
}
// ...
// далі додаємо діалогний блок як раніше
