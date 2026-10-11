const trainingReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const trainingMobile=window.matchMedia('(max-width: 700px)');
const trainingFlow=document.querySelector('.training-flow');
const trainingSpine=document.querySelector('#motion-spine-fill');
const moveStep=document.querySelector('.move-step');
const movePlayer=document.querySelector('#move-player');
const moveTrace=document.querySelector('#move-trace-fill');
const jumpStep=document.querySelector('.jump-step');
const jumpPlayer=document.querySelector('#jump-player');
const dodgeStep=document.querySelector('.dodge-step');
const safeRoute=document.querySelector('.safe-route path');
const surviveStep=document.querySelector('.survive-step');
const surviveWords=[...document.querySelectorAll('.survive-words span')];
const recap=document.querySelector('.training-recap');
const recapLine=document.querySelector('#recap-line-fill');
const recapRunner=document.querySelector('#recap-runner');
const controlDemo=document.querySelector('#control-demo');
const demoReadout=document.querySelector('#demo-readout');
const jumpDiagram=document.querySelector('.jump-diagram');
const controlKeys=[...document.querySelectorAll('.control-key[data-key]')];
const actionLabels={ArrowLeft:'MOVE / LEFT',ArrowRight:'MOVE / RIGHT',ArrowUp:'DIRECTION / UP',ArrowDown:'DIRECTION / DOWN',Space:'JUMP / SPACE'};
let keyTimer;

function triggerControl(key){
  if(!actionLabels[key])return;
  controlKeys.forEach(button=>button.classList.toggle('is-pressed',button.dataset.key===key));
  demoReadout.textContent=actionLabels[key];
  controlDemo.dataset.action='';
  jumpDiagram.classList.remove('is-jumping');
  if(!trainingReduced.matches){requestAnimationFrame(()=>{controlDemo.dataset.action=key;if(key==='Space')jumpDiagram.classList.add('is-jumping')})}
  clearTimeout(keyTimer);
  keyTimer=setTimeout(()=>{controlKeys.forEach(button=>button.classList.remove('is-pressed'));controlDemo.dataset.action='';jumpDiagram.classList.remove('is-jumping')},600);
}
controlKeys.forEach(button=>button.addEventListener('click',()=>triggerControl(button.dataset.key)));
document.addEventListener('keydown',event=>{
  if(document.body.classList.contains('menu-open')||document.querySelector('#notice-dialog').open)return;
  if(event.altKey||event.ctrlKey||event.metaKey||event.isComposing||event.target.closest('input,textarea,select,button,a,summary,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"]'))return;
  const key=event.code==='Space'?'Space':event.key;
  if(!actionLabels[key]||event.repeat)return;
  triggerControl(key);
});

function clamp(value,min,max){return Math.min(max,Math.max(min,value))}
function sectionProgress(section){const rect=section.getBoundingClientRect();return clamp((innerHeight-rect.top)/(innerHeight+rect.height),0,1)}
let ticking=false;
function updateTraining(){
  ticking=false;
  if(trainingReduced.matches){
    trainingSpine.style.height='100%';movePlayer.style.translate='';moveTrace.style.width='100%';jumpPlayer.style.translate='';safeRoute.style.strokeDashoffset='0';recapLine.style.width='100%';recapRunner.style.left='100%';surviveWords.forEach(word=>word.style.translate='');return;
  }
  const flowRect=trainingFlow.getBoundingClientRect();
  const flowProgress=clamp((innerHeight*.55-flowRect.top)/flowRect.height,0,1);
  trainingSpine.style.height=`${flowProgress*100}%`;
  const moveRect=moveStep.getBoundingClientRect();
  const moveRange=Math.max(1,moveRect.height-innerHeight);
  const moveProgress=trainingMobile.matches?sectionProgress(moveStep):clamp(-moveRect.top/moveRange,0,1);
  movePlayer.style.translate=`${moveProgress*(trainingMobile.matches?115:460)}px 0`;
  moveTrace.style.width=`${moveProgress*100}%`;
  const jumpProgress=sectionProgress(jumpStep);
  jumpPlayer.style.translate=`${jumpProgress*(trainingMobile.matches?45:90)}px ${-jumpProgress*(trainingMobile.matches?85:150)}px`;
  const dodgeProgress=sectionProgress(dodgeStep);
  safeRoute.style.strokeDashoffset=String(1000*(1-dodgeProgress));
  const dodgeShift=trainingMobile.matches?16:45;
  document.querySelector('.dodge-enemy').style.translate=`${(1-dodgeProgress)*dodgeShift}px 0`;
  document.querySelector('.dodge-warning').style.translate=`${(1-dodgeProgress)*-dodgeShift}px 0`;
  const surviveProgress=sectionProgress(surviveStep);
  if(!trainingMobile.matches){surviveWords.forEach((word,index)=>{if(index%2===0)word.style.translate=`${(2-index)*surviveProgress*22}px 0`})}
  const recapProgress=sectionProgress(recap);
  recapLine.style.width=`${recapProgress*100}%`;
  recapRunner.style.left=`${recapProgress*100}%`;
}
function scheduleTraining(){if(!ticking){ticking=true;requestAnimationFrame(updateTraining)}}
window.addEventListener('scroll',scheduleTraining,{passive:true});
window.addEventListener('resize',scheduleTraining,{passive:true});
trainingReduced.addEventListener('change',scheduleTraining);
trainingMobile.addEventListener('change',scheduleTraining);
updateTraining();
