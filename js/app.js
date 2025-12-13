// 탭 스위칭
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-buttons button');
  if(!btn) return;
  const tabs = btn.closest('.tabs');
  const id = btn.dataset.tab;
  tabs.querySelectorAll('.tab-buttons button').forEach(b => b.classList.toggle('active', b===btn));
  tabs.querySelectorAll('.tab-contents .pane').forEach(p => p.classList.toggle('active', p.dataset.pane===id));
});

// 페럴랙스
const heroImg = document.querySelector('.parallax');
if(heroImg && window.matchMedia('(min-width: 821px)').matches){
  window.addEventListener('scroll', ()=>{
    const y = window.scrollY * 0.05;
    heroImg.style.transform = `translateY(${y}px)`;
  }, {passive:true});
}

// 모바일 하단바 페이드 인
const mobileCta = document.querySelector('.mobile-cta');
if(mobileCta){ setTimeout(()=> mobileCta.classList.add('show'), 200); }

// 앵커 스무스 스크롤
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if(!a) return;
  const id = a.getAttribute('href');
  if(id.length > 1){
    const target = document.querySelector(id);
    if(target){
      e.preventDefault();
      target.scrollIntoView({behavior:'smooth', block:'start'});
    }
  }
});

// ---------------------------
// 스크롤 리빌 (중복 제거: 이거 하나만 사용)
// ---------------------------
(function(){
  const items = document.querySelectorAll('[data-reveal], .panel'); // ✅ panel까지 포함
  if (!('IntersectionObserver' in window) || items.length === 0){
    items.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      const once = el.hasAttribute('data-reveal-once');

      if (entry.isIntersecting) {
        if (el._leaveTimer){ clearTimeout(el._leaveTimer); el._leaveTimer = null; }

        const baseDelay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
        el.style.transitionDelay = (baseDelay/1000) + 's';
        el.classList.add('is-revealed');

        if (once) revealIO.unobserve(el);
      } else {
        if (!once){
          el._leaveTimer = setTimeout(() => {
            el.classList.remove('is-revealed');
            el.style.transitionDelay = '';
          }, 150);
        }
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -12% 0px',
    threshold: 0.12
  });

  items.forEach(el => revealIO.observe(el));
})();


// ---------------------------
// 폼
// ---------------------------
const MODE        = "phone";
const SITE_NAME   = "보라매";
const API_BASE    = "https://solapi-backend.onrender.com";
const ADMIN_PHONE = "01022844859";

document.addEventListener('DOMContentLoaded', function () {
  flatpickr('#visit-date', { locale: 'ko', dateFormat:'Y-m-d', defaultDate:new Date(), disableMobile:true });

  const timeWrap   = document.querySelector('.time-wrap');
  const dispInput  = document.getElementById('visit-time-display');
  const hiddenTime = document.getElementById('visit-time');
  const dd         = document.getElementById('time-dropdown');

  const hideDD = ()=>{ dd.classList.remove('open'); dispInput.setAttribute('aria-expanded','false'); };

  dispInput.addEventListener('click', e=>{ e.stopPropagation(); dd.classList.toggle('open'); });
  dd.addEventListener('click', e=>{
    const btn=e.target.closest('.slot'); if(!btn) return;
    dd.querySelectorAll('.slot').forEach(s=>s.removeAttribute('aria-selected'));
    btn.setAttribute('aria-selected','true');
    dispInput.value  = btn.textContent.trim();
    hiddenTime.value = btn.dataset.value;
    hideDD();
  });
  document.addEventListener('click', e=>{ if(timeWrap && !timeWrap.contains(e.target)) hideDD(); });

  const form      = document.getElementById('reservation');
  const submitBtn = document.getElementById('submitBtn');
  const checkbox  = document.querySelector('.form-contents-privacy-checkbox');
  const dateInput = document.getElementById('visit-date');

  const normalizePhone = v => (v||'').replace(/[^\d]/g,'');
  const sleep = ms => new Promise(r=>setTimeout(r,ms));

  if(checkbox && submitBtn){
    checkbox.addEventListener('change', ()=> { submitBtn.disabled = !checkbox.checked; });
  }

  if(form){
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if(!checkbox || !checkbox.checked){ alert('개인정보 수집 및 이용에 동의해야 합니다.'); return; }

      const name    = form.elements.name.value.trim();
      const phone   = normalizePhone(form.elements.phone.value);
      const vd      = dateInput.value.trim();
      const vt      = hiddenTime.value.trim();
      const vtLabel = (dispInput.value||'').trim();

      if(!name){ alert('성함을 입력해 주세요.'); return; }
      if(!(phone.length===10 || phone.length===11)){ alert('연락처를 정확히 입력해 주세요.'); return; }
      if(!vd){ alert('방문일을 선택해 주세요.'); return; }
      if(!vt){ alert('방문 시간을 선택해 주세요.'); return; }

      const payload = { site:SITE_NAME, vd, vtLabel, name, phone, adminPhone:ADMIN_PHONE, memo:'' };

      submitBtn.disabled = true;
      const prev = submitBtn.textContent;
      submitBtn.textContent = '전송 중…';

      try {
        const res = await fetch(`${API_BASE}/sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const txt = await res.text();
        let data = null;
        try { data = JSON.parse(txt); } catch {}

        if (!res.ok) throw new Error(`HTTP ${res.status} / ${txt.slice(0,200)}`);
        if (data && data.ok === false) throw new Error(data.error || JSON.stringify(data).slice(0,200));
        if (!data) console.warn('서버 원문 응답(비JSON):', txt);

        await sleep(200);
        alert(`${name}님, 방문예약 요청이 전송되었습니다!`);
        form.reset();
        hiddenTime.value='';
        dispInput.value='';
      } catch(err){
        alert(`전송 실패: ${String(err.message)}`);
        console.error(err);
      } finally {
        submitBtn.textContent = prev;
        submitBtn.disabled = !checkbox.checked;
      }
    });
  }

  fetch(`${API_BASE}/version`)
    .then(r=>r.json())
    .then(v=>console.log('FROM(ENV_SENDER)=', v.from_admin))
    .catch(()=>{});
});
