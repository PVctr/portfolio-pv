/* Paulo Victor — portfólio. Sem dependências. */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const PHONE = '5521990777088';

  /* ---------------------------------------------------------------
     Abertura em vídeo
     - termina sozinha, ou com "Pular abertura" / Esc
     - se o vídeo não tocar (autoplay bloqueado, rede lenta, erro), segue sem ela
  ---------------------------------------------------------------- */
  const intro = $('#intro');
  const app = $('#app');

  const ready = (delay = 0) => setTimeout(() => root.classList.add('is-ready'), delay);

  function runIntro() {
    const video = $('#introVideo');
    const skip = $('#introSkip');
    const sources = $$('source', video);
    let done = false;
    let startTimer;
    let hardTimer;

    app.setAttribute('inert', '');
    document.body.classList.add('is-locked');

    const release = () => {
      if (!intro.isConnected) return;
      try { video.pause(); video.removeAttribute('src'); sources.forEach((s) => s.remove()); video.load(); } catch (e) {}
      intro.remove();
    };

    function finish(instant) {
      if (done) return;
      done = true;
      clearTimeout(startTimer);
      clearTimeout(hardTimer);
      try { sessionStorage.setItem('pv-intro', '1'); } catch (e) {}

      app.removeAttribute('inert');
      document.body.classList.remove('is-locked');

      if (instant) {
        intro.classList.add('is-instant');
        release();
        ready();
        return;
      }

      intro.classList.add('is-leaving');
      ready(380);
      intro.addEventListener('transitionend', (e) => { if (e.propertyName === 'clip-path') release(); });
      setTimeout(release, 1800);
    }

    video.addEventListener('playing', () => {
      clearTimeout(startTimer);
      intro.classList.add('is-playing');
    }, { once: true });
    video.addEventListener('ended', () => finish(false));
    video.addEventListener('error', () => finish(true));
    if (sources.length) sources[sources.length - 1].addEventListener('error', () => finish(true));

    skip.addEventListener('click', () => finish(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') finish(false); });

    startTimer = setTimeout(() => { if (!intro.classList.contains('is-playing')) finish(true); }, 4000);
    hardTimer = setTimeout(() => finish(false), 9000);

    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => finish(true));
  }

  if (intro && root.classList.contains('has-intro')) {
    runIntro();
  } else {
    if (intro) intro.remove();
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-ready')));
  }

  /* ---------------------------------------------------------------
     Cabeçalho: fundo só depois de rolar
  ---------------------------------------------------------------- */
  const header = $('.header');
  const sentinel = $('#sentinel');
  if (header && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-stuck', !entry.isIntersecting);
    }).observe(sentinel);
  }

  /* ---------------------------------------------------------------
     Navegação: seção atual
  ---------------------------------------------------------------- */
  const navLinks = $$('.nav__link, .mobile-nav__link');
  const sections = ['sobre', 'servicos', 'projetos', 'processo', 'contato']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((a) => {
          if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------------------------------------------------------------
     Menu mobile
  ---------------------------------------------------------------- */
  const menuBtn = $('#menuBtn');
  const mobileNav = $('#mobileNav');

  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    mobileNav.hidden = !open;
    header.classList.toggle('is-stuck', open || header.classList.contains('is-stuck'));
  }
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    mobileNav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !mobileNav.hidden) { setMenu(false); menuBtn.focus(); }
    });
    matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  /* ---------------------------------------------------------------
     Formulário → mensagem de WhatsApp
  ---------------------------------------------------------------- */
  const form = $('#briefing');
  if (form) {
    const tipo = $('#tipo');
    const objetivo = $('#objetivo');
    const nome = $('#nome');
    const contador = $('#contador');
    const erro = $('#tipo-erro');
    const status = $('#status');
    const copiar = $('#copiar');

    const message = () => {
      const lines = ['Olá, Paulo! Vim pelo seu portfólio e quero falar sobre um projeto.', '', 'Tipo de site: ' + tipo.value];
      if (objetivo.value.trim()) lines.push('Objetivo: ' + objetivo.value.trim());
      if (nome.value.trim()) lines.push('Nome: ' + nome.value.trim());
      return lines.join('\n');
    };

    const valid = () => {
      const ok = Boolean(tipo.value);
      erro.hidden = ok;
      if (ok) tipo.removeAttribute('aria-invalid');
      else { tipo.setAttribute('aria-invalid', 'true'); tipo.focus(); }
      return ok;
    };

    const say = (text) => {
      status.textContent = '';
      requestAnimationFrame(() => { status.textContent = text; });
    };

    objetivo.addEventListener('input', () => { contador.textContent = String(objetivo.value.length); });
    tipo.addEventListener('change', () => { if (tipo.value) valid(); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!valid()) return;
      const url = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(message());
      // Link real em nova aba: funciona em qualquer navegador e não é barrado como pop-up.
      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      document.body.appendChild(a); a.click(); a.remove();
      say('Conversa aberta no WhatsApp.');
    });

    copiar.addEventListener('click', async () => {
      if (!valid()) return;
      const text = message();
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch (e2) {}
        ta.remove();
      }
      const label = copiar.textContent;
      copiar.textContent = ok ? 'Mensagem copiada' : 'Não foi possível copiar';
      say(copiar.textContent);
      setTimeout(() => { copiar.textContent = label; }, 2200);
    });
  }
})();
