/* ─── Unity Spirit Partners — ScrollCanvas Engine (Native Scroll-Snap) ─── */
'use strict';

const TOTAL_FRAMES = 672;
const LERP = 0.02;
const CONCURRENCY = 48;

const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent) || innerWidth < 768;
const FRAME_DIR = isMobile ? 'frames-mobile' : 'frames-webp';

/* ── DOM refs ── */
const loader = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');
const loaderPct = document.getElementById('loaderPct');
const pages = Array.from(document.querySelectorAll('.page'));
const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const burger = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');
const canvas = document.getElementById('scrollCanvas');
const ctx = canvas.getContext('2d');
const bottomBar = document.getElementById('bottomBar');
const bottomBarFill = document.getElementById('bottomBarFill');

/* ── State ── */
let targetFrame = 0, currentFrame = 0, isReady = false;
const frames = new Array(TOTAL_FRAMES);

/* ── Canvas sizing ── */
function resize(){
  const dpr = Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawFrame(Math.round(currentFrame));
}
addEventListener('resize', resize);

/* ── Frame loader ── */
function padNum(n){return String(n).padStart(6,'0')}

function loadFrame(index){
  return new Promise(resolve=>{
    const img = new Image();
    img.onload = ()=>{
      if(img.decode) img.decode().then(()=>{frames[index]=img;resolve()}).catch(()=>{frames[index]=img;resolve()});
      else {frames[index]=img;resolve()}
    };
    img.onerror = ()=>resolve();
    img.src = `${FRAME_DIR}/frame_${padNum(index+1)}.webp`;
  });
}

let preloaderDismissed = false;
const PRELOADER_THRESHOLD = 0.03;

async function loadAllFrames(){
  let loaded = 0;
  const queue = Array.from({length:TOTAL_FRAMES},(_,i)=>i);
  async function worker(){
    while(queue.length>0){
      const idx=queue.shift();
      if(idx===undefined)return;
      await loadFrame(idx);
      loaded++;
      const pct=Math.floor((loaded/TOTAL_FRAMES)*100);
      loaderFill.style.width=pct+'%';
      loaderPct.textContent=pct+'%';
      if(bottomBarFill) bottomBarFill.style.width=pct+'%';
      if(pct>=100 && bottomBar) setTimeout(()=>bottomBar.classList.add('done'),800);
      if(!preloaderDismissed && loaded/TOTAL_FRAMES>=PRELOADER_THRESHOLD){
        preloaderDismissed=true;
        isReady=true;
        drawFrame(0);
        loader.classList.add('hidden');
        pages[0].classList.add('is-active');
      }
    }
  }
  await Promise.all(Array.from({length:CONCURRENCY},()=>worker()));
}

/* ── Draw frame (cover fit) ── */
function drawFrame(idx){
  idx=Math.max(0,Math.min(TOTAL_FRAMES-1,idx));
  const img=frames[idx]; if(!img) return;
  const cw=innerWidth,ch=innerHeight;
  const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;
  const scale=Math.max(cw/iw,ch/ih);
  const sw=iw*scale,sh=ih*scale;
  ctx.clearRect(0,0,cw,ch);
  ctx.drawImage(img,(cw-sw)/2,(ch-sh)/2,sw,sh);
}

/* ── NATIVE SCROLL → frame mapping ── */
addEventListener('scroll',()=>{
  if(!isReady) return;
  const maxScroll=document.documentElement.scrollHeight-innerHeight;
  const progress=maxScroll>0?scrollY/maxScroll:0;
  targetFrame=progress*(TOTAL_FRAMES-1);
},{passive:true});

function scrollToPage(i){
  const p=pages[i];
  if(p) scrollTo({top:p.offsetTop,behavior:'smooth'});
}

/* ── Navigation ── */
navLinks.forEach(l=>l.addEventListener('click',e=>{
  e.preventDefault();
  scrollToPage(parseInt(l.dataset.section));
  mobileNav.classList.remove('open');
  burger.classList.remove('open');
}));
document.querySelectorAll('[data-section]').forEach(el=>{
  if(el.classList.contains('nav-link'))return;
  el.addEventListener('click',e=>{e.preventDefault();scrollToPage(parseInt(el.dataset.section))});
});
burger.addEventListener('click',()=>{burger.classList.toggle('open');mobileNav.classList.toggle('open')});

addEventListener('keydown',e=>{
  const cur=pages.findIndex(p=>p.classList.contains('is-active'));
  if(e.key==='ArrowDown'||e.key===' '){e.preventDefault();if(cur<pages.length-1)scrollToPage(cur+1)}
  if(e.key==='ArrowUp'){e.preventDefault();if(cur>0)scrollToPage(cur-1)}
});

/* ── IntersectionObserver for active page ── */
let lastIdx=-1;
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      const idx=pages.indexOf(entry.target);
      if(idx!==-1 && idx!==lastIdx){
        lastIdx=idx;
        pages.forEach((p,i)=>p.classList.toggle('is-active',i===idx));
        navLinks.forEach(l=>l.classList.toggle('active',parseInt(l.dataset.section)===idx));
      }
    }
  });
},{root:null,rootMargin:'-40% 0px -40% 0px'});
pages.forEach(p=>observer.observe(p));

/* ── Render loop ── */
function animate(){
  requestAnimationFrame(animate);
  currentFrame+=(targetFrame-currentFrame)*LERP;
  if(isReady) drawFrame(Math.round(currentFrame));
}
animate();

/* ── Init ── */
(async function init(){
  resize();
  await loadAllFrames();
  /* If threshold wasn't reached (tiny frame count), force reveal */
  if(!preloaderDismissed){
    preloaderDismissed=true;
    isReady=true;
    drawFrame(0);
    loader.classList.add('hidden');
    pages[0].classList.add('is-active');
  }
})();

/* ── Contact Form → Firestore + Telegram ── */
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const name = document.getElementById('inputName').value.trim();
    const phone = document.getElementById('inputPhone').value.trim();
    const niche = document.getElementById('inputNiche').value;
    const budget = document.getElementById('inputBudget').value;
    const message = document.getElementById('inputMessage').value.trim();

    if (!name || !phone) return;
    btn.disabled = true;
    btn.textContent = 'Sending...';

    const lead = {
      name, phone, niche, budget, message,
      source: 'unityspiritpartners.com',
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    /* 1. Save to Firestore */
    try {
      if (window.db) {
        await window.db.collection('leads').add(lead);
      }
    } catch (err) { console.warn('Firestore:', err); }

    /* 2. Send to Telegram */
    try {
      const TG_TOKEN = '8584091506:AAFHWXyPuCS-cQnPnPo8Hu5HGJm-0eHrDsw';
      const TG_CHAT = '8538272428';
      if (TG_CHAT) {
        const text = `🔔 New Lead — Unity Spirit Partners\n👤 ${name}\n📞 ${phone}\n🏷️ Niche: ${niche || '—'}\n💰 Budget: ${budget || '—'}\n💬 ${message || '—'}`;
        await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' })
        });
      }
    } catch (err) { console.warn('Telegram:', err); }

    /* 3. Success */
    btn.textContent = '✓ Request submitted! We\'ll respond within 2 hours.';
    btn.style.background = '#25D366'; btn.style.color = '#fff';
    form.reset();
    setTimeout(() => {
      btn.textContent = 'Get a Free Niche Audit';
      btn.style.background = ''; btn.style.color = '';
      btn.disabled = false;
    }, 5000);
  });
}

/* ── Case Video Carousel ── */
(function initCaseCarousel(){
  const scroll = document.getElementById('casesScroll');
  const prevBtn = document.getElementById('casesPrev');
  const nextBtn = document.getElementById('casesNext');
  if(!scroll) return;

  const cards = Array.from(scroll.querySelectorAll('a.case-card'));

  /* Autoplay videos when visible (both desktop & mobile) */
  const vObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const v = entry.target.querySelector('video');
      if(!v) return;
      if(entry.isIntersecting){ v.play().catch(()=>{}); }
      else { v.pause(); v.currentTime = 0; }
    });
  }, {threshold: 0.4});
  cards.forEach(c => vObs.observe(c));

  /* Arrow navigation */
  function scrollByCard(dir){
    const card = cards[0];
    if(!card) return;
    const w = card.offsetWidth + 20; // card width + gap
    scroll.scrollBy({left: dir * w, behavior:'smooth'});
  }
  if(prevBtn) prevBtn.addEventListener('click', e => { e.preventDefault(); scrollByCard(-1); });
  if(nextBtn) nextBtn.addEventListener('click', e => { e.preventDefault(); scrollByCard(1); });

  /* Drag to scroll (desktop) */
  let isDragging = false, startX = 0, scrollStart = 0, hasMoved = false;
  scroll.addEventListener('mousedown', e => {
    isDragging = true; hasMoved = false;
    startX = e.pageX; scrollStart = scroll.scrollLeft;
    scroll.classList.add('is-dragging');
  });
  addEventListener('mousemove', e => {
    if(!isDragging) return;
    const dx = e.pageX - startX;
    if(Math.abs(dx) > 5) hasMoved = true;
    scroll.scrollLeft = scrollStart - dx;
  });
  addEventListener('mouseup', () => {
    if(isDragging){
      isDragging = false;
      scroll.classList.remove('is-dragging');
    }
  });
  /* Prevent click on link if dragged */
  cards.forEach(card => {
    card.addEventListener('click', e => { if(hasMoved) e.preventDefault(); });
  });
})();
