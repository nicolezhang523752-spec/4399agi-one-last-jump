const startButton=document.querySelector('#start-game');
const gameShell=document.querySelector('#game-shell');
const placeholder=document.querySelector('#game-placeholder');
const message=document.querySelector('#game-message');
const loading=document.querySelector('#game-loading');
const statusLabel=document.querySelector('#game-status');
const gameInstruction=document.querySelector('#game-instruction');
const fullscreenButton=document.querySelector('#fullscreen-game');
const restartButton=document.querySelector('#restart-game');
const pauseButton=document.querySelector('#pause-game');
const resumeButton=document.querySelector('#resume-game');
const pauseOverlay=document.querySelector('#pause-overlay');
const retryButton=document.querySelector('#retry-game');
const prefersLessMotion=matchMedia('(prefers-reduced-motion: reduce)');
const launchHero=document.querySelector('.launch-hero');
let frame=null;
let loadTimeout=null;
let gameInputActive=false;
let gameLoaded=false;
let pauseReady=false;
let gamePaused=false;
let pausePending=false;
const gameKeys=new Set([' ','Space','Spacebar','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
function isInteractiveTarget(target){return target?.nodeType===1&&typeof target.closest==='function'&&!!target.closest('input,textarea,select,button,a,summary,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"],[role="textbox"],[role="combobox"]')}
function preventGamePageScroll(event){if(!gameKeys.has(event.key)||event.altKey||event.ctrlKey||event.metaKey||event.isComposing||isInteractiveTarget(event.target))return;event.preventDefault()}
document.addEventListener('keydown',event=>{if(gameInputActive&&(document.activeElement===frame||gameShell.contains(document.activeElement)))preventGamePageScroll(event)},true);
document.addEventListener('keydown',event=>{
  if(event.repeat||event.altKey||event.ctrlKey||event.metaKey||document.body.classList.contains('menu-open'))return;
  if(!['Escape','KeyP'].includes(event.code)||!frame||!pauseReady)return;
  if(!gamePaused&&!gameInputActive)return;
  event.preventDefault();
  requestPause(!gamePaused);
},true);
document.addEventListener('focusin',event=>{if(!gameShell.contains(event.target))gameInputActive=false});
document.addEventListener('pointerdown',event=>{if(!gameShell.contains(event.target))gameInputActive=false});
gameShell.addEventListener('focusin',()=>{gameInputActive=true});
launchHero.addEventListener('transitionend',event=>{if(event.propertyName==='height'&&gameInputActive)gameShell.scrollIntoView({behavior:prefersLessMotion.matches?'instant':'smooth',block:'center'})});
function protectGameFrame(){try{const gameWindow=frame.contentWindow;gameWindow.addEventListener('keydown',preventGamePageScroll,true);gameWindow.document.addEventListener('pointerdown',event=>{gameInputActive=true;if(event.button===2)gameInstruction.hidden=true})}catch{/* An external game host may not allow access to its iframe. */}}
function setStatus(label){statusLabel.textContent=label}
function resetPause(){gameLoaded=false;pauseReady=false;gamePaused=false;pausePending=false;pauseOverlay.hidden=true;pauseButton.hidden=true;pauseButton.textContent='PAUSE ⏸';gameShell.dataset.paused='false'}
function requestPause(paused){if(!frame||!gameLoaded||!pauseReady||pausePending)return;pausePending=true;frame.contentWindow.postMessage({type:'4399agi:set-pause',paused},location.origin)}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame?.contentWindow)return;
  const data=event.data;
  if(data?.type==='4399agi:run-complete'){
    if(gameLoaded)window.AGI_SCORE_SUBMIT?.(data);
    return;
  }
  if(data?.type==='4399agi:pause-ready'){pauseReady=true;pauseButton.hidden=!gameLoaded;return}
  if(data?.type==='4399agi:toggle-pause'){if(gameLoaded&&pauseReady)requestPause(!gamePaused);return}
  if(data?.type!=='4399agi:pause-state')return;
  pausePending=false;
  gamePaused=data.paused===true;
  gameShell.dataset.paused=String(gamePaused);
  if(Number.isFinite(data.gameTime))gameShell.dataset.gameTime=String(data.gameTime);
  pauseOverlay.hidden=!gamePaused;
  pauseButton.textContent=gamePaused?'RESUME ▶':'PAUSE ⏸';
  setStatus(gamePaused?'PAUSED':'GAME LOADED');
  if(gamePaused)resumeButton.focus();else frame.focus();
});
pauseButton.addEventListener('click',()=>requestPause(!gamePaused));
resumeButton.addEventListener('click',()=>requestPause(false));
function showError(title,copy){clearTimeout(loadTimeout);resetPause();gameInputActive=false;gameInstruction.hidden=true;loading.hidden=true;placeholder.hidden=true;message.hidden=false;document.querySelector('#message-title').innerHTML=title;document.querySelector('#message-copy').innerHTML=copy;setStatus('GAME UNAVAILABLE');fullscreenButton.hidden=true;restartButton.hidden=true;frame?.remove();frame=null}
function setLoading(){resetPause();document.querySelector('#score-feedback').hidden=true;gameInstruction.hidden=true;message.hidden=true;placeholder.hidden=true;loading.hidden=false;setStatus('LOADING GAME')}
function startGame(){document.body.classList.add('game-entered');gameShell.scrollIntoView({behavior:prefersLessMotion.matches?'instant':'smooth',block:'center'});gameShell.focus({preventScroll:true});gameInputActive=true;setLoading();if(frame)frame.remove();frame=document.createElement('iframe');frame.title='4399AGI — One Last Jump playable game';frame.allowFullscreen=true;frame.allow='fullscreen; gamepad';frame.src='game/index.html';frame.addEventListener('load',()=>{const gameDocument=frame.contentDocument;if(!gameDocument?.querySelector('meta[name="generator"][content="Scirra Construct"]')){showError('GAME FAILED<br>TO LOAD.','The game could not be loaded from this preview. Run the local website server and try again.');return}clearTimeout(loadTimeout);loading.hidden=true;gameLoaded=true;pauseButton.hidden=!pauseReady;setStatus('GAME LOADED');gameInstruction.hidden=false;fullscreenButton.hidden=!document.fullscreenEnabled;restartButton.hidden=false;protectGameFrame();frame.focus();gameInputActive=true});frame.addEventListener('error',()=>showError('GAME FAILED<br>TO LOAD.','The game could not be loaded. Try again, or check the exported game files.'));loadTimeout=setTimeout(()=>showError('GAME FAILED<br>TO LOAD.','The game is taking too long to load. Check the exported game files, then try again.'),20000);gameShell.append(frame)}
startButton.addEventListener('click',startGame);
retryButton.addEventListener('click',startGame);
restartButton.addEventListener('click',()=>{if(!frame)return;setLoading();clearTimeout(loadTimeout);loadTimeout=setTimeout(()=>showError('GAME FAILED<br>TO LOAD.','The game did not restart. Check the exported game files, then try again.'),20000);frame.src=`game/index.html?restart=${Date.now()}`});
fullscreenButton.addEventListener('click',async()=>{if(!frame||!document.fullscreenEnabled)return;try{if(document.fullscreenElement)await document.exitFullscreen();else await gameShell.requestFullscreen()}catch{fullscreenButton.hidden=true}});
document.addEventListener('fullscreenchange',()=>{fullscreenButton.textContent=document.fullscreenElement?'EXIT FULLSCREEN ↙':'FULLSCREEN ↗'});
