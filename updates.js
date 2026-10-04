import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, UPDATES_TABLE } from './supabase-config.js';
const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const list = document.querySelector('#update-list');
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if (list) {
  try {
    const { data, error } = await db.from(UPDATES_TABLE).select('id,title,content,image_url,button_text,button_url,created_at').order('created_at', { ascending: false }).limit(8);
    if (!error && data?.length) list.innerHTML = data.map((post) => {
      const date = post.created_at ? new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'AXY UPDATE';
      const image = post.image_url ? `<img class="update-image" src="${escapeHtml(post.image_url)}" alt="" loading="lazy">` : '';
      const href = post.button_url && /^https?:\/\//i.test(post.button_url) ? post.button_url : '';
      const button = href ? `<a class="update-action" href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(post.button_text || 'Read more')} ↗</a>` : '';
      return `<article class="update-row"><time>${escapeHtml(date)}</time><div>${image}<small>AXY UPDATE</small><h3>${escapeHtml(post.title || 'Update')}</h3><p>${escapeHtml(post.content || '')}</p>${button}</div><span>✦</span></article>`;
    }).join('');
  } catch (error) { console.info('Updates are temporarily unavailable.', error); }
}
