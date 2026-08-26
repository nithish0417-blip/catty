const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
let W,H,dpr,playing=false,last=0,keys={},mouse={x:0,y:0,active:false};
let player,enemies=[],bullets=[],fish=[],particles=[],spawnTimer=0,gameTime=0,score=0,kills=0;
const upgrades=[
 {name:"Claw Damage",desc:"+25% attack damage",apply:p=>p.damage*=1.25},
 {name:"Swift Paws",desc:"+18% movement speed",apply:p=>p.speed*=1.18},
 {name:"Rapid Claws",desc:"Attack 20% faster",apply:p=>p.fireRate*=.8},
 {name:"Extra Life",desc:"+30 max HP and heal 30",apply:p=>{p.maxHp+=30;p.hp=Math.min(p.maxHp,p.hp+30)}},
 {name:"Magnet Paws",desc:"Much larger XP pickup range",apply:p=>p.magnet*=1.45},
 {name:"Double Shot",desc:"Fire an additional projectile",apply:p=>p.shots++},
];

function resize(){
 dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
 canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener('resize',resize);resize();
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
canvas.addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=true});
canvas.addEventListener('pointerdown',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=true});

function startGame(){document.getElementById('start').style.display='none';restart(true)}
function restart(silent=false){
 player={x:W/2,y:H/2,r:22,hp:100,maxHp:100,speed:245,damage:22,fireRate:0.48,fire:0,magnet:80,shots:1,inv:0,level:1,xp:0,nextXp:100};
 enemies=[];bullets=[];fish=[];particles=[];spawnTimer=0;gameTime=0;score=0;kills=0;playing=true;
 document.getElementById('message').style.display='none';document.getElementById('levelup').style.display='none';updateHud();
 if(!silent)requestAnimationFrame(loop);
}
function updateHud(){
 document.getElementById('hp').style.width=Math.max(0,player.hp/player.maxHp*100)+'%';
 document.getElementById('level').textContent=player.level||1;
 document.getElementById('kills').textContent=kills;
 document.getElementById('scoreVal').textContent=Math.floor(score);
 document.getElementById('xp').style.width=((player.xp||0)/(player.nextXp||100)*100)+'%';
}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function spawnEnemy(){
 const side=Math.floor(Math.random()*4), pad=55;
 let x,y;
 if(side===0){x=-pad;y=Math.random()*H}else if(side===1){x=W+pad;y=Math.random()*H}else if(side===2){x=Math.random()*W;y=-pad}else{x=Math.random()*W;y=H+pad}
 const t=gameTime;
 const elite=Math.random()<Math.min(.14,t/180);
 enemies.push({x,y,r:elite?27:18,hp:(elite?110:38)+t*.8,speed:(elite?48:62)+t*.12,elite});
}
function nearestEnemy(){
 let best=null,bd=Infinity;
 for(const e of enemies){let d=dist(player,e);if(d<bd){bd=d;best=e}}
 return best;
}
function shoot(){
 const target=nearestEnemy();if(!target)return;
 const a=Math.atan2(target.y-player.y,target.x-player.x), spread=.13;
 for(let i=0;i<player.shots;i++){
  const aa=a+(i-(player.shots-1)/2)*spread;
  bullets.push({x:player.x+Math.cos(aa)*18,y:player.y+Math.sin(aa)*18,vx:Math.cos(aa)*620,vy:Math.sin(aa)*620,r:5,damage:player.damage,life:1.5});
 }
}
function burst(x,y,n=8){
 for(let i=0;i<n;i++){let a=Math.random()*Math.PI*2,s=30+Math.random()*100;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.5+Math.random()*.5,r:2+Math.random()*4})}
}
function gainXP(v){
 player.xp=(player.xp||0)+v;
 if(player.xp>=(player.nextXp||100)){player.xp-=player.nextXp||100;player.level=(player.level||1)+1;player.nextXp=Math.floor((player.nextXp||100)*1.28);levelUp()}
}
function levelUp(){
 playing=false;
 const box=document.getElementById('choices');box.innerHTML='';
 [...upgrades].sort(()=>Math.random()-.5).slice(0,3).forEach(u=>{
  const d=document.createElement('div');d.className='choice';d.innerHTML=`<b>${u.name}</b><span>${u.desc}</span>`;
  d.onclick=()=>{u.apply(player);document.getElementById('levelup').style.display='none';playing=true;updateHud()};
  box.appendChild(d);
 });
 document.getElementById('levelup').style.display='flex';updateHud();
}
function damagePlayer(v){
 if(player.inv>0)return;
 player.hp-=v;player.inv=.7;burst(player.x,player.y,10);
 if(player.hp<=0)endGame();
}
function endGame(){
 playing=false;
 document.getElementById('gameoverTitle').textContent='GAME OVER';
 document.getElementById('finalText').innerHTML=`You survived <b>${Math.floor(gameTime)}s</b> and defeated <b>${kills}</b> enemies.<br>Score: <b>${Math.floor(score)}</b>`;
 document.getElementById('message').style.display='block';
}
function update(dt){
 gameTime+=dt;spawnTimer-=dt;
 if(spawnTimer<=0){spawnEnemy();spawnTimer=Math.max(.16,.72-gameTime*.002)}
 let dx=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0);
 let dy=(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0);
 if(dx||dy){let l=Math.hypot(dx,dy);player.x+=dx/l*player.speed*dt;player.y+=dy/l*player.speed*dt}
 player.x=Math.max(25,Math.min(W-25,player.x));player.y=Math.max(45,Math.min(H-25,player.y));
 player.inv=Math.max(0,player.inv-dt);
 player.fire-=dt;if(player.fire<=0){shoot();player.fire=player.fireRate}
 for(const e of enemies){
  const a=Math.atan2(player.y-e.y,player.x-e.x);e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt;
  if(dist(e,player)<e.r+player.r-3)damagePlayer(e.elite?22:12);
 }
 for(let i=bullets.length-1;i>=0;i--){
  const b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
  let hit=false;
  for(let j=enemies.length-1;j>=0;j--){
   const e=enemies[j];
   if(dist(b,e)<b.r+e.r){e.hp-=b.damage;hit=true;burst(b.x,b.y,3);
    if(e.hp<=0){kills++;score+=e.elite?80:20;fish.push({x:e.x,y:e.y,r:e.elite?9:7,val:e.elite?35:12});burst(e.x,e.y,e.elite?18:8);enemies.splice(j,1)}
    break;
   }
  }
  if(hit||b.life<=0||b.x<-30||b.x>W+30||b.y<-30||b.y>H+30)bullets.splice(i,1);
 }
 for(let i=fish.length-1;i>=0;i--){
  const f=fish[i],d=dist(f,player);
  if(d<player.magnet){let a=Math.atan2(player.y-f.y,player.x-f.x),s=80+(player.magnet-d)*5;f.x+=Math.cos(a)*s*dt;f.y+=Math.sin(a)*s*dt}
  if(d<player.r+f.r+3){gainXP(f.val);score+=f.val;fish.splice(i,1)}
 }
 for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.94;p.vy*=.94;p.life-=dt;if(p.life<=0)particles.splice(i,1)}
 updateHud();
}
function draw(){
 ctx.clearRect(0,0,W,H);
 // world
 ctx.fillStyle='#111521';ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='#1c2230';ctx.lineWidth=1;
 const grid=48,ox=(gameTime*10)%grid,oy=(gameTime*6)%grid;
 for(let x=-grid+ox;x<W+grid;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
 for(let y=-grid+oy;y<H+grid;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
 // shadows
 for(const f of fish){ctx.fillStyle='#59d7ff';ctx.shadowBlur=14;ctx.shadowColor='#59d7ff';ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,7);ctx.fill();ctx.shadowBlur=0}
 for(const b of bullets){ctx.fillStyle='#ffe78a';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill()}
 for(const e of enemies){
  ctx.save();ctx.translate(e.x,e.y);
  ctx.fillStyle=e.elite?'#b35cff':'#d9485f';ctx.shadowBlur=12;ctx.shadowColor=ctx.fillStyle;
  ctx.beginPath();ctx.arc(0,2,e.r,0,7);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='#17101b';ctx.beginPath();ctx.arc(-e.r*.35,-2,3,0,7);ctx.arc(e.r*.35,-2,3,0,7);ctx.fill();
  ctx.restore();
 }
 for(const p of particles){ctx.globalAlpha=Math.max(0,p.life*2);ctx.fillStyle='#ffdf8a';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();ctx.globalAlpha=1}
 // cat
 ctx.save();ctx.translate(player.x,player.y);let a=0;
 const target=nearestEnemy();if(target)a=Math.atan2(target.y-player.y,target.x-player.x);
 ctx.rotate(a);
 if(player.inv>0 && Math.floor(player.inv*14)%2===0)ctx.globalAlpha=.35;
 ctx.fillStyle='#f4a85b';ctx.beginPath();ctx.arc(0,3,20,0,7);ctx.fill();
 ctx.beginPath();ctx.moveTo(-17,-9);ctx.lineTo(-13,-29);ctx.lineTo(-3,-17);ctx.fill();
 ctx.beginPath();ctx.moveTo(17,-9);ctx.lineTo(13,-29);ctx.lineTo(3,-17);ctx.fill();
 ctx.fillStyle='#202331';ctx.beginPath();ctx.arc(-7,-2,3,0,7);ctx.arc(7,-2,3,0,7);ctx.fill();
 ctx.strokeStyle='#202331';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,5,7,.1,3);ctx.stroke();
 ctx.restore();
}
function loop(t){
 if(!last)last=t;const dt=Math.min(.033,(t-last)/1000);last=t;
 if(playing)update(dt);draw();
 requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
