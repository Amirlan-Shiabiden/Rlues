const $ = (s) => document.querySelector(s);

async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function showError(err) {
  const el = $('#error');
  el.textContent = err.message;
  el.hidden = false;
  setTimeout(() => (el.hidden = true), 4000);
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, attrs);
  node.append(...children);
  return node;
}

const fmt = (d) => new Date(d).toLocaleString('ru-RU');

async function loadUsers() {
  const users = await api('/users');
  $('#users').replaceChildren(...users.map((u) =>
    el('li', {},
      el('span', {}, `${u.name} `, el('span', { className: 'muted' }, `${u.email} · записей: ${u.posts_count}`)),
      el('button', { className: 'link', textContent: '✕', title: 'Удалить',
        onclick: () => confirm(`Удалить ${u.name} и все его записи?`) &&
          api(`/users/${u.id}`, { method: 'DELETE' }).then(refresh).catch(showError) })
    )));
  $('#post-form [name=user_id]').replaceChildren(
    el('option', { value: '', textContent: 'Автор…' }),
    ...users.map((u) => el('option', { value: u.id, textContent: u.name })));
}

async function loadPosts() {
  const posts = await api('/posts');
  $('#posts').replaceChildren(...(posts.length ? posts.map((p) =>
    el('article', { className: 'post' },
      el('h3', { textContent: p.title }),
      el('div', { className: 'muted' }, `${p.author} · ${fmt(p.created_at)} `,
        el('button', { className: 'link', textContent: 'удалить',
          onclick: () => api(`/posts/${p.id}`, { method: 'DELETE' }).then(refresh).catch(showError) })),
      p.body ? el('p', { textContent: p.body }) : ''
    )) : [el('p', { className: 'muted', textContent: 'Пока нет записей.' })]));
}

async function refresh() {
  await Promise.all([loadUsers(), loadPosts()]);
}

$('#user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  try {
    await api('/users', { method: 'POST', body: { name: f.name.value, email: f.email.value } });
    f.reset();
    await refresh();
  } catch (err) { showError(err); }
});

$('#post-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  try {
    await api('/posts', { method: 'POST',
      body: { user_id: Number(f.user_id.value), title: f.title.value, body: f.body.value } });
    f.title.value = ''; f.body.value = '';
    await refresh();
  } catch (err) { showError(err); }
});

api('/health')
  .then(() => { $('#db-status').textContent = 'БД: подключена'; $('#db-status').className = 'badge ok'; })
  .catch(() => { $('#db-status').textContent = 'БД: нет связи'; $('#db-status').className = 'badge err'; });

refresh().catch(showError);
