// posts.js — надёжный рендерер для posts.txt (поддержка имён, аватарок, копирования и шаринга)
const POSTS_FILE = 'posts.txt';
const CONTAINER_ID = 'posts-container';

async function loadPosts() {
  const container = document.getElementById(CONTAINER_ID);
  try {
    const resp = await fetch(POSTS_FILE + '?v=' + Date.now());
    if (!resp.ok) throw new Error('Не удалось загрузить posts.txt');
    const raw = await resp.text();
    render(raw);
  } catch (err) {
    document.getElementById(CONTAINER_ID).innerHTML = '<div class="placeholder">Ошибка загрузки. Проверьте posts.txt</div>';
    console.error(err);
  }
}

function normalizeName(name) {
  return name.trim().replace(/^—\s*/, '').replace(/^Ведущий[:\s]*/i, '').replace(/^Гость[:\s]*/i, '').trim();
}

function avatarFor(name, role) {
  const ch = (name && name[0]) ? name[0].toUpperCase() : (role === 'you' ? 'В' : 'Г');
  const cls = role === 'you' ? 'avatar--you' : 'avatar--guest';
  return `<div class="avatar ${cls}">${ch}</div>`;
}

function detectRoleAndName(line) {
  // formats supported: "— Ведущий: текст", "— Artem_Gustatov: текст", "— текст"
  const trimmed = line.replace(/^—\s*/, '');
  const nameMatch = trimmed.match(/^([A-Za-zА-Яа-я0-9_\-\. ]{2,40}):\s*(.*)$/);
  if (nameMatch) {
    return { name: nameMatch[1].trim(), text: nameMatch[2].trim() };
  }
  // if no explicit name, alternate roles
  return { name: null, text: trimmed };
}

function render(raw) {
  const container = document.getElementById(CONTAINER_ID);
  container.innerHTML = '';
  const blocks = raw.split(/(?=📡)/g).map(b => b.trim()).filter(Boolean);
  const q = (document.getElementById('search')?.value || '').toLowerCase().trim();

  blocks.forEach(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;

    const title = lines[0].startsWith('📡') ? lines[0] : '📡 ' + lines[0];
    let speaker = '';
    let idx = 1;
    if (lines[1] && lines[1].startsWith('🎙')) {
      speaker = lines[1].replace('🎙','').trim();
      idx = 2;
    }
    const dialogLines = lines.slice(idx);

    const fullText = (title + ' ' + speaker + ' ' + dialogLines.join(' ')).toLowerCase();
    if (q && !fullText.includes(q)) return;

    // build article
    const art = document.createElement('article');
    art.className = 'section-post';

    const h2 = document.createElement('h2'); h2.textContent = title; art.appendChild(h2);
    if (speaker) {
      const meta = document.createElement('div'); meta.className = 'post-meta'; meta.textContent = 'В эфире — ' + speaker; art.appendChild(meta);
    }

    const post = document.createElement('div'); post.className = 'post-efir';

    // actions
    const actions = document.createElement('div'); actions.className = 'post-actions';
    const btnToggle = document.createElement('button'); btnToggle.className = 'icon-btn'; btnToggle.textContent = 'Свернуть';
    const btnCopy = document.createElement('button'); btnCopy.className = 'icon-btn'; btnCopy.textContent = 'Копировать';
    const btnShare = document.createElement('button'); btnShare.className = 'icon-btn'; btnShare.textContent = 'Поделиться';
    actions.appendChild(btnToggle); actions.appendChild(btnCopy); actions.appendChild(btnShare);
    art.appendChild(actions);

    const dialog = document.createElement('div'); dialog.className = 'dialog';

    // alternate role if no explicit names
    let fallbackRole = 0;
    dialogLines.forEach(line => {
      if (!line) return;
      const parsed = detectRoleAndName(line);
      const nameDetected = parsed.name;
      const text = parsed.text;
      const role = nameDetected ? (parsed.name.toLowerCase().includes('ведущий') ? 'you' : 'guest') : (fallbackRole % 2 === 0 ? 'you' : 'guest');
      const row = document.createElement('div'); row.className = 'dialog-row ' + (role === 'you' ? 'role-you' : 'role-guest');

      const speakerName = nameDetected ? parsed.name : (role === 'you' ? 'Ведущий' : 'Гость');
      const avatarHTML = avatarFor(speakerName, role);
      row.innerHTML = avatarHTML;

      const body = document.createElement('div'); body.className = 'dialog-body';
      const nameEl = document.createElement('div'); nameEl.className = 'speaker-name'; nameEl.textContent = speakerName;
      const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = text;
      body.appendChild(nameEl); body.appendChild(bubble);
      row.appendChild(body);
      dialog.appendChild(row);

      fallbackRole++;
    });

    post.appendChild(dialog);
    art.appendChild(post);
    container.appendChild(art);

    // interactivity
    let collapsed = false;
    btnToggle.addEventListener('click', () => {
      collapsed = !collapsed;
      dialog.style.display = collapsed ? 'none' : 'block';
      btnToggle.textContent = collapsed ? 'Развернуть' : 'Свернуть';
    });

    btnCopy.addEventListener('click', async () => {
      const payload = [title, speaker ? 'В эфире — ' + speaker : '', ...dialogLines].join('\n');
      try { await navigator.clipboard.writeText(payload); btnCopy.textContent = 'Скопировано'; setTimeout(()=>btnCopy.textContent='Копировать',1200); }
      catch { alert('Копирование недоступно'); }
    });

    btnShare.addEventListener('click', () => {
      const payload = [title, speaker ? 'В эфире — ' + speaker : '', ...dialogLines].join('\n');
      if (navigator.share) {
        navigator.share({ title: title, text: payload }).catch(()=>{/* ignore */});
      } else {
        // fallback: open mailto
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(payload);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      }
    });
  });

  if (!document.getElementById(CONTAINER_ID).children.length) {
    document.getElementById(CONTAINER_ID).innerHTML = '<div class="placeholder">Эфиров не найдено.</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search')?.addEventListener('input', () => loadPosts());
  document.getElementById('refresh')?.addEventListener('click', () => loadPosts());
  document.getElementById('sample')?.addEventListener('click', () => {
    // local dummy insertion for preview (no file write)
    const container = document.getElementById(CONTAINER_ID);
    const html = `
      <article class="section-post">
        <h2>📡 Примерный эфир</h2>
        <div class="post-meta">В эфире — Тестовый спикер</div>
        <div class="post-efir">
          <div class="dialog">
            <div class="dialog-row role-you">${avatarFor('Ведущий','you')}<div class="dialog-body"><div class="speaker-name">Ведущий</div><div class="bubble">— Тестовая реплика ведущего.</div></div></div>
            <div class="dialog-row role-guest">${avatarFor('Гость','guest')}<div class="dialog-body"><div class="speaker-name">Гость</div><div class="bubble">— Ответ гостя в духе Ритма.</div></div></div>
          </div>
        </div>
      </article>`;
    container.insertAdjacentHTML('afterbegin', html);
  });
  loadPosts();
});
