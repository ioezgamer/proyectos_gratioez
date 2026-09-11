'use strict';

const NS='http://www.w3.org/2000/svg';
const H=Math.sqrt(3)/2, UNIT=43, BOARD_CX=300, BOARD_CY=340, N=7;
const OFFICIAL_COLORS=['#ff9f1c','#807cf0','#d6d600','#19ad93','#16a6d8','#63ff2d'];
const REDS=['#ea3f45','#e63a40','#ec4146','#e73a41','#ed4449','#e83b42'];
const pieceLayer=document.getElementById('pieces');
const gridLayer=document.getElementById('grid');
const game=document.getElementById('game');
const timerEl=document.getElementById('timer'), movesEl=document.getElementById('moves'), insideEl=document.getElementById('insideStat');
const statusText=document.getElementById('statusText'), statusDot=document.getElementById('statusDot'), selectedLabel=document.getElementById('selectedLabel');
const toastEl=document.getElementById('toast'), winDialog=document.getElementById('winDialog'), winText=document.getElementById('winText');

const cellKey=(cell)=>cell.map(v=>`${v[0]},${v[1]}`).sort().join('|');
const BOARD_CELLS=[];
for(let i=0;i<N;i++) for(let j=0;j<N;j++){
  const A=[j,i-j], B=[j,i-j+1], C=[j+1,i-j-1], D=[j+1,i-j];
  BOARD_CELLS.push([A,B,D],[A,C,D]);
}
const BOARD_SET=new Set(BOARD_CELLS.map(cellKey));

function rot([q,r]){return[-r,q+r]}
function refl([q,r]){return[q+r,-r]}
function orient(v,p){let out=[v[0],v[1]];if(p.flip)out=refl(out);for(let i=0;i<p.rot;i++)out=rot(out);return out}
function eu([q,r]){return[q+r/2,H*r]}
function axialToSvg([q,r]){const [x,y]=eu([q,r]);return[BOARD_CX+(x-3.5)*UNIT,BOARD_CY+y*UNIT]}
function svgToAxial([px,py]){const x=(px-BOARD_CX)/UNIT+3.5, y=(py-BOARD_CY)/UNIT;const r=y/H;return[x-r/2,r]}
function add(a,b){return[a[0]+b[0],a[1]+b[1]]}

function buildBoard(){
  const verts=[[0,0],[0,7],[7,0],[7,-7]].map(axialToSvg);
  document.getElementById('recess').setAttribute('d',`M${verts.map(v=>v.join(',')).join(' L')} Z`);
  const edges=new Map();
  for(const c of BOARD_CELLS){for(const [a,b] of [[c[0],c[1]],[c[1],c[2]],[c[2],c[0]]]){
    const k=[`${a[0]},${a[1]}`,`${b[0]},${b[1]}`].sort().join('|');edges.set(k,[a,b]);
  }}
  for(const [a,b] of edges.values()){
    const [x1,y1]=axialToSvg(a),[x2,y2]=axialToSvg(b);const line=document.createElementNS(NS,'line');
    line.setAttribute('x1',x1);line.setAttribute('y1',y1);line.setAttribute('x2',x2);line.setAttribute('y2',y2);gridLayer.appendChild(line);
  }
}

const traySlots=[[590,330],[600,470],[566,175],[610,540],[575,400],[625,205]];
function freshState(){
  return Array.from({length:6},(_,id)=>{
    const init=DATA.initial[String(id)];
    if(init) return {id,onBoard:true,q:init.q,r:init.r,rot:init.rot,flip:init.flip,trayX:traySlots[id][0],trayY:traySlots[id][1],dragX:0,dragY:0};
    return {id,onBoard:false,q:0,r:0,rot:0,flip:false,trayX:592,trayY:365,dragX:0,dragY:0};
  });
}
let pieces=freshState(), selected=DATA.extra_piece, moves=0, useColors=false, solved=false, startAt=null, elapsedMs=0, timerHandle=null, hintLevel=0;

function localCells(p){return DATA.cells[String(p.id)].map(c=>c.map(v=>orient(v,p)))}
function translatedCells(p,q=p.q,r=p.r){return localCells(p).map(c=>c.map(v=>[v[0]+q,v[1]+r]))}
function localBounds(p){
  const seen=new Map();for(const c of localCells(p))for(const v of c)seen.set(`${v[0]},${v[1]}`,v);
  const pts=[...seen.values()].map(v=>eu(v));const xs=pts.map(v=>v[0]),ys=pts.map(v=>v[1]);
  return {cx:(Math.min(...xs)+Math.max(...xs))/2,cy:(Math.min(...ys)+Math.max(...ys))/2};
}
function pointFor(p,v){
  const ov=orient(v,p);
  if(p.onBoard){const [x,y]=axialToSvg([ov[0]+p.q,ov[1]+p.r]);return[x+p.dragX,y+p.dragY]}
  const [x,y]=eu(ov),b=localBounds(p);return[p.trayX+(x-b.cx)*UNIT+p.dragX,p.trayY+(y-b.cy)*UNIT+p.dragY]
}
function baseAnchorPoint(p){const a=DATA.cells[String(p.id)][0][0];return pointFor({...p,dragX:0,dragY:0},a)}

function edgeData(p){
  const counts=new Map();
  for(const c of DATA.cells[String(p.id)]) for(const [a,b] of [[c[0],c[1]],[c[1],c[2]],[c[2],c[0]]]){
    const ka=`${a[0]},${a[1]}`,kb=`${b[0]},${b[1]}`,key=[ka,kb].sort().join('|');
    if(!counts.has(key))counts.set(key,{n:0,a,b});counts.get(key).n++;
  }
  return [...counts.values()].filter(e=>e.n===1);
}

function analyze(){
  const occupancy=new Map(), inside={};let insideCount=0;
  for(const p of pieces){
    if(!p.onBoard){inside[p.id]=false;continue}
    const cells=translatedCells(p);const keys=cells.map(cellKey);inside[p.id]=keys.every(k=>BOARD_SET.has(k));if(inside[p.id])insideCount++;
    for(const k of keys){if(!occupancy.has(k))occupancy.set(k,[]);occupancy.get(k).push(p.id)}
  }
  const overlapIds=new Set();let overlapCells=0;
  for(const ids of occupancy.values()) if(ids.length>1){overlapCells++;ids.forEach(id=>overlapIds.add(id))}
  return {inside,insideCount,overlapIds,overlapCells,win:insideCount===6&&overlapCells===0};
}
