const header=document.querySelector('#site-header');
const menuButton=document.querySelector('#menu-toggle');
const mobileMenu=document.querySelector('#mobile-menu');
const dialog=document.querySelector('#notice-dialog');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=window.matchMedia('(pointer: fine)');

function runVisibleParallax(element, update){
  let frameId=0;
  let visible=false;
  function frame(){update();frameId=requestAnimationFrame(frame)}
  function sync(){
    const shouldRun=visible&&!document.hidden&&!reduced.matches;
    if(shouldRun&&!frameId)frameId=requestAnimationFrame(frame);
    else if(!shouldRun&&frameId){cancelAnimationFrame(frameId);frameId=0}
  }
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()},{rootMargin:'100px 0px'}).observe(element);
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
}

function updateHeader(){header.classList.toggle('scrolled',window.scrollY>24)}
updateHeader();window.addEventListener('scroll',updateHeader,{passive:true});

function closeMenu(){document.body.classList.remove('menu-open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');mobileMenu.inert=true}
menuButton.addEventListener('click',()=>{const open=!document.body.classList.contains('menu-open');document.body.classList.toggle('menu-open',open);menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');mobileMenu.inert=!open;if(open)mobileMenu.querySelector('a')?.focus()});
mobileMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('menu-open')){closeMenu();menuButton.focus()}});
document.addEventListener('keydown',e=>{
  if(e.key!=='Tab'||!document.body.classList.contains('menu-open'))return;
  const links=[...mobileMenu.querySelectorAll('a')];
  const first=menuButton;
  const last=links.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  else if(![first,...links].includes(document.activeElement)){e.preventDefault();links[0]?.focus()}
});

function openNotice(title,copy){document.querySelector('#dialog-title').innerHTML=title;document.querySelector('#dialog-copy').textContent=copy;dialog.showModal()}
const currentPage=document.body.classList.contains('characters-page')?'characters page':document.body.classList.contains('training-page')?'training page':document.body.classList.contains('gameplay-page')?'gameplay page':'homepage';
document.querySelectorAll('[data-future]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();closeMenu();const name=link.dataset.future;openNotice(`${name.toUpperCase()}<br>IS COMING.`,`The ${name} page is being built. Keep exploring the ${currentPage} for now.`)}));
document.querySelector('#play-button')?.addEventListener('click',()=>{window.location.href='play.html'});
if(dialog){dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());dialog.querySelector('.dialog-back').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()})}

document.body.classList.add('js-ready');
const revealItems=document.querySelectorAll('.reveal,.statement-line');
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
revealItems.forEach(el=>observer.observe(el));

if(!reduced.matches&&finePointer.matches){
  const hero=document.querySelector('.hero');const world=document.querySelector('#hero-world');const title=document.querySelector('#hero-title-wrap');
  if(hero&&world&&title){let mx=0,my=0,tx=0,ty=0;hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5});hero.addEventListener('pointerleave',()=>{mx=0;my=0});runVisibleParallax(hero,()=>{tx+=(mx-tx)*.07;ty+=(my-ty)*.07;world.style.translate=`${tx*17}px ${ty*13}px`;title.style.translate=`${-tx*8}px ${-ty*5}px`})}
  const button=document.querySelector('.play-button');if(button){button.addEventListener('pointermove',e=>{const r=button.getBoundingClientRect();button.style.translate=`${((e.clientX-r.left)/r.width-.5)*12}px ${((e.clientY-r.top)/r.height-.5)*8}px`});button.addEventListener('pointerleave',()=>button.style.translate='0 0')}
}
