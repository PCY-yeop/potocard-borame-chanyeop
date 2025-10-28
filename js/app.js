
// 탭 스위칭
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-buttons button');
  if(!btn) return;
  const tabs = btn.closest('.tabs');
  const id = btn.dataset.tab;
  tabs.querySelectorAll('.tab-buttons button').forEach(b => b.classList.toggle('active', b===btn));
  tabs.querySelectorAll('.tab-contents .pane').forEach(p => p.classList.toggle('active', p.dataset.pane===id));
});

// 스크롤 리빌
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('revealed');
      io.unobserve(entry.target);
    }
  });
},{threshold:.12});
document.querySelectorAll('[data-reveal], .panel').forEach(el=>io.observe(el));

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


const SITE_NAME = '검단 센트레빌';

    document.addEventListener('DOMContentLoaded', function () {
      /* ===== 날짜: flatpickr 유지 ===== */
      flatpickr("#visit-date", {
        locale:"ko",
        dateFormat:"Y-m-d",
        defaultDate:new Date(),
        disableMobile:true
      });

      /* ===== 시간: 커스텀 드롭다운 ===== */
      const timeWrap   = document.querySelector('.time-wrap');
      const dispInput  = document.getElementById('visit-time-display'); // 화면표시(읽기전용)
      const hiddenTime = document.getElementById('visit-time');         // 서버전송값(HH:mm)
      const dd         = document.getElementById('time-dropdown');

      const openDD  = () => { dd.classList.add('open'); dispInput.setAttribute('aria-expanded','true'); };
      const closeDD = () => { dd.classList.remove('open'); dispInput.setAttribute('aria-expanded','false'); };

      dispInput.addEventListener('click', (e)=>{ e.stopPropagation(); dd.classList.toggle('open'); dispInput.setAttribute('aria-expanded', dd.classList.contains('open')); });

      dd.addEventListener('click', (e)=>{
        const btn = e.target.closest('.slot'); if(!btn) return;
        dd.querySelectorAll('.slot').forEach(s=>s.removeAttribute('aria-selected'));
        btn.setAttribute('aria-selected','true');
        dispInput.value = btn.textContent.trim();
        hiddenTime.value = btn.dataset.value; // "HH:mm"
        closeDD();
      });

      // 키보드 접근성
      dd.addEventListener('keydown', (e)=>{
        const items = [...dd.querySelectorAll('.slot')];
        const idx = items.indexOf(document.activeElement);
        if(e.key==='ArrowDown'){ e.preventDefault(); (items[idx+1]||items[0]).focus(); }
        if(e.key==='ArrowUp'){ e.preventDefault(); (items[idx-1]||items[items.length-1]).focus(); }
        if(e.key==='Enter' || e.key===' '){ e.preventDefault(); document.activeElement.click(); }
        if(e.key==='Escape'){ closeDD(); dispInput.focus(); }
      });

      // 외부 클릭 닫기
      document.addEventListener('click', (e)=>{ if(!timeWrap.contains(e.target)) closeDD(); });

      /* ===== 폼 전송 ===== */
      const form = document.getElementById('reservation');
      const submitBtn = document.getElementById('submitBtn');
      const checkbox = document.querySelector('.form-contents-privacy-checkbox');
      const visitDateInput = document.getElementById('visit-date');

      const toggleSubmit = () => { submitBtn.disabled = !checkbox.checked; };
      checkbox.addEventListener('change', toggleSubmit); toggleSubmit();

      const normalizePhone = (val) => (val||'').replace(/[^\d]/g,'');
      const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!checkbox.checked){ alert('개인정보 수집 및 이용에 동의해야 합니다.'); return; }

        const name  = form.elements.name.value.trim();
        const phone = normalizePhone(form.elements.phone.value);
        const vd    = visitDateInput.value.trim();
        const vt    = hiddenTime.value.trim(); // 선택한 시작시각 "HH:mm"

        if(!name){ alert('성함을 입력해 주세요.'); return; }
        if(!(phone.length===10 || phone.length===11)){ alert('연락처를 정확히 입력해 주세요.'); return; }
        if(!vd){ alert('방문일을 선택해 주세요.'); return; }
        if(!vt){ alert('방문 시간을 선택해 주세요.'); return; }

        const taggedName = `[${SITE_NAME}] ${name}`;
        const base = 'https://iudczcnhxfxquxkfckpiwumkai0fvjjb.lambda-url.ap-northeast-2.on.aws/';
        const params = new URLSearchParams({ name: taggedName, phone, vd, vt, sp:'01022844859', site:SITE_NAME });
        const url = `${base}?${params.toString()}`;

        submitBtn.disabled = true;
        const prev = submitBtn.textContent; submitBtn.textContent = '전송 중…';
        try{ fetch(url,{method:'GET',mode:'no-cors',keepalive:true}).catch(()=>{});}catch(_){}
        await sleep(400);
        alert(`${name}님, 방문예약이 접수되었습니다!`);
        form.reset(); hiddenTime.value=''; dispInput.value='';
        submitBtn.textContent = prev; toggleSubmit();
      });
    });


(function(){
  const items = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || items.length === 0){
    items.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      const once = el.hasAttribute('data-reveal-once'); // 이 속성이 있으면 1회만

      if (entry.isIntersecting) {
        // 들어올 때: 클래스 추가(재진입 시 다시 페이드)
        if (el._leaveTimer){ clearTimeout(el._leaveTimer); el._leaveTimer = null; }
        const baseDelay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
        el.style.transitionDelay = (baseDelay/1000) + 's';
        el.classList.add('is-revealed');

        if (once) io.unobserve(el); // 1회만 재생 원하는 경우
      } else {
        // 나갈 때: 약간의 지연 후 클래스 제거(깜빡임 방지)
        if (!once){
          el._leaveTimer = setTimeout(() => {
            el.classList.remove('is-revealed');
            el.style.transitionDelay = ''; // 초기화
          }, 150);
        }
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -12% 0px', // 하단에서 조금 더 나왔을 때 트리거
    threshold: 0.12
  });

  items.forEach(el => io.observe(el));
})();

