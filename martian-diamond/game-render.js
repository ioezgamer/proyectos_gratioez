function render(){
  pieceLayer.replaceChildren();const a=analyze();insideEl.textContent=`${a.insideCount}/6`;
  for(const p of pieces){
    const g=document.createElementNS(NS,'g');g.classList.add('piece');if(p.id===selected)g.classList.add('selected');if(p.onBoard&&!a.inside[p.id])g.classList.add('invalid');if(a.overlapIds.has(p.id))g.classList.add('overlap');
    if(p.dragX||p.dragY)g.classList.add('dragging');g.dataset.id=p.id;g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label',p.id===DATA.extra_piece?'Pieza extra con marciano':`Pieza ${p.id+1}`);g.setAttribute('filter','url(#pieceShadow)');
    const fill=(useColors?OFFICIAL_COLORS:REDS)[p.id];
    for(const c of DATA.cells[String(p.id)]){
      const poly=document.createElementNS(NS,'polygon');poly.classList.add('cell');poly.setAttribute('fill',fill);poly.setAttribute('points',c.map(v=>pointFor(p,v).join(',')).join(' '));g.appendChild(poly);
    }
    for(const e of edgeData(p)){
      const [x1,y1]=pointFor(p,e.a),[x2,y2]=pointFor(p,e.b);const line=document.createElementNS(NS,'line');line.classList.add('edge');line.setAttribute('x1',x1);line.setAttribute('y1',y1);line.setAttribute('x2',x2);line.setAttribute('y2',y2);g.appendChild(line);
    }
    if(p.id===DATA.extra_piece){
      const pts=[];for(const c of DATA.cells[String(p.id)])for(const v of c)pts.push(pointFor(p,v));const cx=pts.reduce((s,v)=>s+v[0],0)/pts.length,cy=pts.reduce((s,v)=>s+v[1],0)/pts.length;
      const alien=document.createElementNS(NS,'g');alien.classList.add('alien-mark');alien.setAttribute('aria-hidden','true');alien.innerHTML=`<ellipse cx="${cx}" cy="${cy}" rx="10" ry="13"/><path d="M${cx-6},${cy-3} q3,-3 5,1 M${cx+6},${cy-3} q-3,-3 -5,1 M${cx-3},${cy+5} q3,3 6,0"/>`;g.appendChild(alien);
    }
    pieceLayer.appendChild(g);
  }
  movesEl.textContent=moves;selectedLabel.textContent=selected===DATA.extra_piece?'Seleccionada: pieza extra':`Seleccionada: pieza ${selected+1}`;
  updateStatus(a);
  if(a.win&&!solved)win();
}

function updateStatus(a){
  statusDot.className='status-dot';
  if(a.win){statusDot.classList.add('ok');statusText.textContent='Perfecto: las seis piezas están dentro y ninguna se superpone.';return}
  if(a.overlapCells){statusDot.classList.add('bad');statusText.textContent=`Hay ${a.overlapCells} zona${a.overlapCells===1?'':'s'} de solapamiento. Se muestran con contorno claro.`;return}
  if(a.insideCount<6){statusText.textContent=`${a.insideCount} de 6 piezas están completamente dentro. La pieza extra exige reorganizar el conjunto.`;return}
  statusText.textContent='Todas están dentro. Ajusta las piezas hasta eliminar cualquier contacto superpuesto.';
}

function startTimer(){if(startAt!==null||solved)return;startAt=performance.now();timerHandle=setInterval(updateTimer,250)}
function updateTimer(){const ms=elapsedMs+(startAt===null?0:performance.now()-startAt);const s=Math.floor(ms/1000),m=Math.floor(s/60);timerEl.textContent=`${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function stopTimer(){if(startAt!==null){elapsedMs+=performance.now()-startAt;startAt=null}clearInterval(timerHandle);timerHandle=null;updateTimer()}
function fmtTime(ms){const s=Math.floor(ms/1000),m=Math.floor(s/60);return `${m}:${String(s%60).padStart(2,'0')}`}
function markMove(){startTimer();moves++;movesEl.textContent=moves}
function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>toastEl.classList.remove('show'),2600)}

function selectedPiece(){return pieces.find(p=>p.id===selected)}
function transformSelected(kind){const p=selectedPiece();if(!p||solved)return;startTimer();if(kind==='left')p.rot=(p.rot+5)%6;else if(kind==='right')p.rot=(p.rot+1)%6;else p.flip=!p.flip;markMove();render()}
document.getElementById('rotateLeft').addEventListener('click',()=>transformSelected('left'));
document.getElementById('rotateRight').addEventListener('click',()=>transformSelected('right'));
document.getElementById('flip').addEventListener('click',()=>transformSelected('flip'));
