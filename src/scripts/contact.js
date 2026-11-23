// Contact form: posts to /api/contact (Cloudflare Pages Function -> Resend).
export function initContact(root = document) {
  const wrap = root.querySelector('[data-contact]');
  if (!wrap) return null;
  const form = wrap.querySelector('[data-contact-form]');
  const err = wrap.querySelector('[data-contact-error]');
  const submit = wrap.querySelector('[data-contact-submit]');
  const box = wrap.querySelector('[data-scope-box]');
  const boxText = wrap.querySelector('[data-scope-text]');
  const scopeInput = wrap.querySelector('[data-scope-input]');

  function setScope(text) {
    scopeInput.value = text || '';
    boxText.textContent = text || '';
    box.hidden = !text;
  }
  wrap.querySelector('[data-scope-clear]').addEventListener('click', () => setScope(''));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    submit.disabled = true;
    submit.textContent = 'SENDING...';
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || 'Something went wrong.');
      wrap.querySelector('[data-contact-form-wrap]').hidden = true;
      wrap.querySelector('[data-contact-sent]').hidden = false;
      document.dispatchEvent(new CustomEvent('nickos:sent'));
    } catch (ex) {
      err.textContent = ex.message + ' You can also email me directly at the address below.';
      err.hidden = false;
      submit.disabled = false;
      submit.textContent = 'SEND >';
    }
  });
  return { setScope };
}
