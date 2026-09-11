function getSvgPoint(evt){const pt=game.createSVGPoint();pt.x=evt.clientX;pt.y=evt.clientY;const out=pt.matrixTransform(game.getScreenCTM().inverse());return[out.x,out.y]}
let drag=null;
game.addEventListener('pointerdown',evt=>{
  const el=evt.target.closest?.('.piece');if(!el||solved)return;const id=Number(el.dataset.id);selected=id;const p=pieces[id];const [x,y]=getSvgPoint(evt);drag={id,pointerId:evt.pointerId,startX:x,startY:y,changed:false};game.setPointerCapture?.(evt.pointerId);render();evt.preventDefault();
});
game.addEventListener('pointermove',evt=>{
  if(!drag||drag.pointerId!==evt.pointerId)return;const p=pieces[drag.id],[x,y]=getSvgPoint(evt);p.dragX=x-drag.startX;p.dragY=y-drag.startY;if(Math.hypot(p.dragX,p.dragY)>3)drag.changed=true;render();evt.preventDefault();
});
function snapTranslation(p,anchorScreen){
  const target=svgToAxial(anchorScreen),anchorLocal=orient(DATA.cells[String(p.id)][0][0],p);const q0=Math.round(target[0]-anchorLocal[0]),r0=Math.round(target[1]-anchorLocal[1]);let best=null;
  for(let dq=-1;dq<=1;dq++)for(let dr=-1;dr<=1;dr++){
    const q=q0+dq,r=r0+dr,[sx,sy]=axialToSvg([anchorLocal[0]+q,anchorLocal[1]+r]);const d=(sx-anchorScreen[0])**2+(sy-anchorScreen[1])**2;if(!best||d<best.d)best={q,r,d};
  }return best;
}
function boardProximity([x,y]){const dx=Math.abs(x-BOARD_CX)/151,dy=Math.abs(y-BOARD_CY)/261;return dx+dy<1.28}
function finishDrag(evt){
  if(!drag||drag.pointerId!==evt.pointerId)return;const p=pieces[drag.id];
  if(drag.changed){
    const anchorBase=baseAnchorPoint(p),anchor=[anchorBase[0]+p.dragX,anchorBase[1]+p.dragY],snap=snapTranslation(p,anchor);const [px,py]=getSvgPoint(evt);
    if(boardProximity([px,py])){p.onBoard=true;p.q=snap.q;p.r=snap.r}
    else{const oldCenter=p.onBoard?(()=>{const pts=translatedCells(p).flat().map(axialToSvg);return[pts.reduce((s,v)=>s+v[0],0)/pts.length,pts.reduce((s,v)=>s+v[1],0)/pts.length]})():[p.trayX,p.trayY];p.onBoard=false;p.trayX=Math.max(90,Math.min(675,oldCenter[0]+p.dragX));p.trayY=Math.max(90,Math.min(600,oldCenter[1]+p.dragY))}
    markMove();
  }
  p.dragX=p.dragY=0;if(game.hasPointerCapture?.(evt.pointerId))game.releasePointerCapture(evt.pointerId);drag=null;render();evt.preventDefault();
}
game.addEventListener('pointerup',finishDrag);game.addEventListener('pointercancel',evt=>{if(!drag)return;const p=pieces[drag.id];p.dragX=p.dragY=0;if(game.hasPointerCapture?.(evt.pointerId))game.releasePointerCapture(evt.pointerId);drag=null;render()});
game.addEventListener('click',evt=>{const el=evt.target.closest?.('.piece');if(el){selected=Number(el.dataset.id);render()}});

document.addEventListener('keydown',evt=>{
  if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;const k=evt.key.toLowerCase();if(k==='q'){transformSelected('left');evt.preventDefault()}else if(k==='e'){transformSelected('right');evt.preventDefault()}else if(k==='f'){transformSelected('flip');evt.preventDefault()}
  else if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k)){
    const p=selectedPiece();if(!p?.onBoard||solved)return;const delta={arrowup:[0,-1],arrowdown:[0,1],arrowleft:[-1,1],arrowright:[1,-1]}[k];p.q+=delta[0];p.r+=delta[1];markMove();render();evt.preventDefault();
  }
});

document.getElementById('check').addEventListener('click',()=>{const a=analyze();if(a.win){win();return}if(a.overlapCells)toast('Todavía hay piezas superpuestas.');else if(a.insideCount<6)toast(`Aún faltan ${6-a.insideCount} pieza${6-a.insideCount===1?'':'s'} completamente dentro.`);else toast('Casi: revisa los bordes de las piezas.');});
const hints=[
  'La posición inicial está bloqueada a propósito: no basta con mover solo la pieza extra.',
  'Prueba a liberar primero una zona grande cerca de uno de los vértices agudos del diamante.',
  'No necesitas cubrir todo el tablero. La meta es que las seis piezas estén dentro, sin superposición.'
];
document.getElementById('hint').addEventListener('click',()=>{toast(hints[Math.min(hintLevel,hints.length-1)]);hintLevel=Math.min(hintLevel+1,hints.length-1)});
document.getElementById('colors').addEventListener('click',evt=>{useColors=!useColors;evt.currentTarget.textContent=useColors?'Piezas rojas':'Colores guía';render()});
document.getElementById('reset').addEventListener('click',()=>resetGame(true));
function resetGame(showToast=false){stopTimer();pieces=freshState();selected=DATA.extra_piece;moves=0;solved=false;startAt=null;elapsedMs=0;hintLevel=0;timerEl.textContent='00:00';if(winDialog.open)winDialog.close();render();if(showToast)toast('Tablero reiniciado.')}
function win(){if(solved)return;solved=true;stopTimer();const bestKey='martianDiamondBestMs',best=Number(localStorage.getItem(bestKey)||0);if(!best||elapsedMs<best)localStorage.setItem(bestKey,String(Math.round(elapsedMs)));const currentBest=Number(localStorage.getItem(bestKey)||elapsedMs);winText.textContent=`Tiempo: ${fmtTime(elapsedMs)} · Movimientos: ${moves}. Mejor tiempo en este dispositivo: ${fmtTime(currentBest)}.`;render();winDialog.showModal?.()}
document.getElementById('closeWin').addEventListener('click',()=>winDialog.close());document.getElementById('playAgain').addEventListener('click',()=>resetGame(false));

buildBoard();render();
