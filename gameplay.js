const gpReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const gpMobile=window.matchMedia('(max-width: 700px)');
const gpFinePointer=window.matchMedia('(pointer: fine)');
const gpHero=document.querySelector('.gp-hero');
const gpHeroScene=document.querySelector('#gp-hero-scene');
const gpHeroTitle=document.querySelector('.gp-hero-title-wrap');
const mechanicsSection=document.querySelector('.mechanics');
const mechanicCopies=[...document.querySelectorAll('.mechanic-copy')];
const mechanicsPlayer=document.querySelector('#mechanics-player');
const mechanicsCounter=document.querySelector('.mechanics-progress');
const mechanicsMeter=document.querySelector('.mechanics-meter span');
const showcaseSection=document.querySelector('.showcase');
const showcaseTrack=document.querySelector('#showcase-track');

let gpPointerX=0,gpPointerY=0,gpCurrentX=0,gpCurrentY=0;
if(gpFinePointer.matches&&!gpReduced.matches){
  gpHero.addEventListener('pointermove',event=>{const rect=gpHero.getBoundingClientRect();gpPointerX=(event.clientX-rect.left)/rect.width-.5;gpPointerY=(event.clientY-rect.top)/rect.height-.5});
  gpHero.addEventListener('pointerleave',()=>{gpPointerX=0;gpPointerY=0});
  runVisibleParallax(gpHero,()=>{gpCurrentX+=(gpPointerX-gpCurrentX)*.08;gpCurrentY+=(gpPointerY-gpCurrentY)*.08;gpHeroScene.style.translate=`${gpCurrentX*14}px ${gpCurrentY*10}px`;gpHeroTitle.style.translate=`${-gpCurrentX*5}px ${-gpCurrentY*4}px`});
}

const mechanicFrames=[
  'source_assets/images/level1_player-walk-000.png',
  'source_assets/images/level1_player-jump-000.png',
  'source_assets/images/level1_player-jump-000.png',
  'source_assets/images/level1_player-idle-000.png'
];
let activeMechanic=0;
function setMechanic(index){
  if(index===activeMechanic)return;
  mechanicCopies[activeMechanic].classList.remove('active');
  mechanicCopies[activeMechanic].classList.add('leaving');
  const previous=mechanicCopies[activeMechanic];
  window.setTimeout(()=>previous.classList.remove('leaving'),700);
  activeMechanic=index;
  mechanicCopies[index].classList.add('active');
  mechanicsSection.dataset.active=String(index);
  mechanicsPlayer.src=mechanicFrames[index];
  mechanicsCounter.textContent=`0${index+1} — 04`;
  mechanicsMeter.style.width=`${25*(index+1)}%`;
}

let gpTicking=false;
function clamp(value,min,max){return Math.min(max,Math.max(min,value))}
function updateGameplayScroll(){
  gpTicking=false;
  const mobile=gpMobile.matches;
  const reduced=gpReduced.matches;
  if(!mobile){
    const rect=mechanicsSection.getBoundingClientRect();
    const range=Math.max(1,rect.height-innerHeight);
    const progress=clamp(-rect.top/range,0,.9999);
    setMechanic(Math.min(3,Math.floor(progress*4)));
    if(!reduced){
      const gallery=showcaseSection.getBoundingClientRect();
      const galleryRange=Math.max(1,gallery.height-innerHeight);
      const galleryProgress=clamp(-gallery.top/galleryRange,0,1);
      const galleryTravel=Math.max(0,showcaseTrack.scrollWidth-innerWidth*.91);
      showcaseTrack.style.transform=`translate3d(${-galleryProgress*galleryTravel}px,0,0)`;
      const heroProgress=clamp(-gpHero.getBoundingClientRect().top/innerHeight,0,1);
      gpHeroScene.style.scale=String(1+heroProgress*.08);
      gpHeroTitle.style.transform=`translateY(${-heroProgress*80}px)`;
      document.querySelectorAll('.level-visual').forEach((visual,i)=>{const r=visual.getBoundingClientRect();const p=clamp((innerHeight-r.top)/(innerHeight+r.height),0,1);visual.style.translate=`0 ${(p-.5)*(i+1)*25}px`});
    }
  }else{
    showcaseTrack.style.transform='';
    gpHeroScene.style.scale='';
    gpHeroTitle.style.transform='';
    document.querySelectorAll('.level-visual').forEach(visual=>visual.style.translate='');
  }
}
function scheduleGameplayScroll(){if(!gpTicking){gpTicking=true;requestAnimationFrame(updateGameplayScroll)}}
window.addEventListener('scroll',scheduleGameplayScroll,{passive:true});
window.addEventListener('resize',scheduleGameplayScroll,{passive:true});
gpReduced.addEventListener('change',scheduleGameplayScroll);
gpMobile.addEventListener('change',scheduleGameplayScroll);
updateGameplayScroll();

const challenge=document.querySelector('.challenge');
const challengeObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){challenge.classList.add('is-in-view');challengeObserver.disconnect()}}),{threshold:.2});
challengeObserver.observe(challenge);
