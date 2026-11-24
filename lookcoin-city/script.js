/* 每次打开或刷新页面都重置：清空余额、角色和注意力档案 */
try{['lookcoin-total','lookcoin-role','lookcoin-attention-archive'].forEach(k=>localStorage.removeItem(k));}catch(e){}
(()=>{
const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),mod=(v,d)=>((v%d)+d)%d;
const city=$('#city'),map=$('#map'),base=$('#base'),dots=$('#dots'),probe=$('#probe'),sampler=$('#sampler'),ctx=sampler.getContext('2d',{willReadFrequently:true});
const zones={commercial:{id:'commercial',name:'COMMERCIAL DISTRICT'},residential:{id:'residential',name:'RESIDENTIAL DISTRICT'},villa:{id:'villa',name:'VILLA DISTRICT'}};
let pixels=null,press=null,scanTimer=null,selectedZone=null;
const ROLES={
  ceo:{id:'ceo',label:'COMPANY CEO',short:'CEO',rate:5},
  'white-collar':{id:'white-collar',label:'WHITE-COLLAR WORKER',short:'WHITE COLLAR',rate:3},
  student:{id:'student',label:'STUDENT',short:'STUDENT',rate:2},
  'low-income':{id:'low-income',label:'LOW-INCOME WORKER',short:'LOW INCOME',rate:1}
};
let currentRole=localStorage.getItem('lookcoin-role')||'student',pendingRole=null;if(!ROLES[currentRole])currentRole='student';
const role=()=>ROLES[currentRole],roleRate=()=>role().rate;
const total=()=>Number(localStorage.getItem('lookcoin-total')||0);
function syncWallet(){const v=String(total()).padStart(4,'0');$('#map-total').textContent=v;$('#street-total').textContent=v;$('#market-total').textContent=v;$('#map-role').textContent=role().short;$('#map-rate').textContent=`${roleRate()} LC / SEC`;$('#street-role').textContent=`${role().short} · ${roleRate()} LC/SEC`;document.querySelectorAll('.market-item').forEach(item=>{item.disabled=Number(item.dataset.cost)>total()});document.querySelectorAll('.role-option').forEach(item=>item.classList.toggle('active',item.dataset.role===currentRole))}syncWallet();
const market=$('#market-panel'),marketScrim=$('#market-scrim'),marketToast=$('#market-toast');let toastTimer=null;
function toggleMarket(open){market.classList.toggle('open',open);marketScrim.classList.toggle('open',open);market.setAttribute('aria-hidden',String(!open));marketScrim.setAttribute('aria-hidden',String(!open));if(open){syncWallet();setTimeout(()=>$('#close-market').focus(),20)}else $('#open-market').focus()}
function marketMessage(message){marketToast.textContent=message;marketToast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>marketToast.classList.remove('show'),1900)}
$('#open-market').addEventListener('click',()=>toggleMarket(true));$('#close-market').addEventListener('click',()=>toggleMarket(false));marketScrim.addEventListener('click',()=>toggleMarket(false));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&market.classList.contains('open'))toggleMarket(false)});
document.querySelectorAll('.market-item').forEach(item=>item.addEventListener('click',()=>{const cost=Number(item.dataset.cost),name=item.dataset.item;if(total()<cost)return;localStorage.setItem('lookcoin-total',String(total()-cost));syncWallet();marketMessage(`${name} PURCHASED  −${cost.toLocaleString()} LC`)}));
function reveal(e){dots.style.setProperty('--x',`${e.clientX}px`);dots.style.setProperty('--y',`${e.clientY}px`);dots.classList.add('visible')}
function imagePoint(cx,cy){const r=map.getBoundingClientRect(),w=dots.naturalWidth||1672,h=dots.naturalHeight||941,s=Math.max(r.width/w,r.height/h),sw=w*s,sh=h*s,ox=(r.width-sw)/2,oy=(r.height-sh)/2,x=clamp(Math.round((cx-r.left-ox)/s),0,w-1),y=clamp(Math.round((cy-r.top-oy)/s),0,h-1);return{x,y,ix:x/w,iy:y/h}}
/* 分区按底图实际建筑划分（坐标为底图宽高的比例）：商业区≈25%（高楼群+右侧大体量街区），别墅区≈25%（左侧与左下低矮独栋），其余为住宅区≈50% */
const ZONE_COMMERCIAL=[[0.33,0.18],[1.0,0.16],[1.0,1.0],[0.94,1.0],[0.92,0.62],[0.81,0.49],[0.65,0.43],[0.52,0.42],[0.41,0.43],[0.36,0.50],[0.27,0.48],[0.25,0.31],[0.31,0.22]];
const ZONE_VILLA=[[0.0,0.25],[0.10,0.28],[0.20,0.42],[0.27,0.49],[0.38,0.53],[0.43,0.80],[0.36,1.0],[0.0,1.0]];
function inPoly(x,y,P){let inside=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,yi]=P[i],[xj,yj]=P[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside}return inside}
function classify(p){if(inPoly(p.ix,p.iy,ZONE_COMMERCIAL))return zones.commercial;if(inPoly(p.ix,p.iy,ZONE_VILLA))return zones.villa;return zones.residential}
function prepare(){if(!base.complete||!dots.complete||!dots.naturalWidth)return;const w=dots.naturalWidth,h=dots.naturalHeight;sampler.width=w;sampler.height=h*2;ctx.clearRect(0,0,w,h*2);ctx.drawImage(base,0,0,w,h);ctx.drawImage(dots,0,h,w,h);try{pixels=ctx.getImageData(0,0,w,h*2).data}catch(e){pixels=null}}
function rawDensity(p){if(!pixels)return 42;const w=dots.naturalWidth,h=dots.naturalHeight,r=58,step=4;let changed=0,count=0;for(let y=Math.max(0,p.y-r);y<=Math.min(h-1,p.y+r);y+=step)for(let x=Math.max(0,p.x-r);x<=Math.min(w-1,p.x+r);x+=step){if((x-p.x)**2+(y-p.y)**2>r**2)continue;const a=(y*w+x)*4,b=((y+h)*w+x)*4,la=pixels[a]*.299+pixels[a+1]*.587+pixels[a+2]*.114,lb=pixels[b]*.299+pixels[b+1]*.587+pixels[b+2]*.114;if(lb<la-24)changed++;count++}return clamp(Math.round(12+changed/Math.max(count,1)*330),8,96)}
function districtDensity(p,z){const raw=rawDensity(p);if(z.id==='commercial')return clamp(Math.round(raw*.48+48),62,96);if(z.id==='villa')return clamp(Math.round(raw*.26+6),8,28);return clamp(Math.round(raw*.42+22),28,61)}
function sample(cx,cy){const p=imagePoint(cx,cy),z=classify(p),density=districtDensity(p,z),variation=(Math.sin(p.x*.031)+Math.cos(p.y*.027))*.32,oldRevenue=Math.max(240,310+density*48+variation*55),revenue=oldRevenue/130,cardWidth=innerWidth<=700?214:242;selectedZone=z;probe.style.left=`${cx}px`;probe.style.top=`${cy}px`;probe.style.setProperty('--card-x',cx+cardWidth+42>innerWidth?`${-cardWidth-22}px`:'22px');probe.style.setProperty('--card-y',cy+232>innerHeight?'-214px':'22px');$('#coordinates').textContent=`${(p.ix*100).toFixed(1)} / ${(p.iy*100).toFixed(1)}`;$('#zone-name').textContent='SCANNING ZONE';$('#density').textContent=$('#revenue').textContent='SCANNING';const enter=$('#enter-zone');enter.disabled=true;enter.firstElementChild.textContent='SCANNING';probe.classList.remove('scanning');void probe.offsetWidth;probe.classList.add('visible','scanning');probe.setAttribute('aria-hidden','false');clearTimeout(scanTimer);scanTimer=setTimeout(()=>{$('#zone-name').textContent=z.name;$('#density').textContent=`${density} / 100`;$('#revenue').textContent=`$${revenue.toFixed(2)} / day`;enter.disabled=false;enter.firstElementChild.textContent='ENTER STREET VIEW';probe.classList.remove('scanning')},390)}
map.addEventListener('pointerenter',reveal);map.addEventListener('pointermove',e=>{reveal(e);if(press&&e.pointerId===press.id&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>7)press.moved=true});map.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')dots.classList.remove('visible')});map.addEventListener('pointerdown',e=>{reveal(e);press={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}});map.addEventListener('pointerup',e=>{if(press&&press.id===e.pointerId&&!press.moved)sample(e.clientX,e.clientY);if(e.pointerType==='touch')dots.classList.remove('visible');press=null});map.addEventListener('pointercancel',()=>press=null);map.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();sample(innerWidth/2,innerHeight/2)}});base.addEventListener('load',prepare);dots.addEventListener('load',prepare);if(base.complete&&dots.complete)prepare();

const street=$('#street'),gaze=$('#gaze'),reticle=$('#reticle'),intro=$('#street-intro'),scanCard=$('#scan-card'),ring=$('#progress-ring'),IMAGE_RATIO=1774/887,WATCH_SECONDS=15;
const DISTRICTS={
  villa:{src:'LOOKCOIN_Villa_360_Panorama.webp',label:'VILLA DISTRICT',zone:'ZONE 01',load:18,ads:[
    {id:'villa-entry',label:'COMMUNITY ENTRY PANEL 01',x1:.263,x2:.303,y1:.46,y2:.62,reward:15},
    {id:'villa-utility',label:'STREET UTILITY PANEL 02',x1:.590,x2:.622,y1:.53,y2:.65,reward:15},
    {id:'villa-east',label:'COMMUNITY DISPLAY 03',x1:.943,x2:.995,y1:.40,y2:.66,reward:16}
  ],people:[{x1:.42,x2:.47,y1:.42,y2:.78},{x1:.71,x2:.75,y1:.45,y2:.76}]},
  residential:{src:'LOOKCOIN_Residential_360_Panorama.webp',label:'RESIDENTIAL DISTRICT',zone:'ZONE 02',load:41,ads:[
    {id:'res-store-west',label:'STREET RETAIL 01',x1:0,x2:.064,y1:.38,y2:.63,reward:15},
    {id:'res-shelter',label:'TRANSIT PANEL 02',x1:.222,x2:.304,y1:.445,y2:.69,reward:18},
    {id:'res-cube',label:'STREET DISPLAY 03',x1:.655,x2:.762,y1:.39,y2:.67,reward:20},
    {id:'res-board',label:'PAVEMENT PANEL 04',x1:.778,x2:.827,y1:.51,y2:.70,reward:16},
    {id:'res-store-east',label:'STREET RETAIL 05',x1:.927,x2:1,y1:.38,y2:.65,reward:15}
  ],people:[{x1:.10,x2:.16,y1:.39,y2:.79},{x1:.37,x2:.43,y1:.40,y2:.80},{x1:.54,x2:.60,y1:.41,y2:.80},{x1:.85,x2:.90,y1:.42,y2:.78}]},
  commercial:{src:'LOOKCOIN_Commercial_360_Panorama.webp',label:'COMMERCIAL DISTRICT',zone:'ZONE 03',load:86,ads:[
    {id:'com-west-screen',label:'MALL FACADE 01',x1:.052,x2:.165,y1:.10,y2:.33,reward:24},
    {id:'com-west-pillar',label:'RETAIL PILLAR 02',x1:.018,x2:.050,y1:.40,y2:.60,reward:18},
    {id:'com-tower',label:'TOWER DISPLAY 03',x1:.285,x2:.323,y1:.22,y2:.42,reward:20},
    {id:'com-street',label:'STREET DISPLAY 04',x1:.248,x2:.322,y1:.45,y2:.72,reward:20},
    {id:'com-center',label:'CENTRAL MEDIA WALL 05',x1:.458,x2:.552,y1:.29,y2:.48,reward:24},
    {id:'com-shelter',label:'TRANSIT PANEL 06',x1:.705,x2:.772,y1:.41,y2:.68,reward:19},
    {id:'com-east-screen',label:'MALL FACADE 07',x1:.760,x2:.907,y1:.12,y2:.35,reward:25},
    {id:'com-east-pillar',label:'RETAIL PILLAR 08',x1:.868,x2:.908,y1:.41,y2:.60,reward:18}
  ],people:[{x1:.17,x2:.22,y1:.40,y2:.80},{x1:.35,x2:.41,y1:.39,y2:.82},{x1:.57,x2:.63,y1:.39,y2:.81},{x1:.64,x2:.69,y1:.42,y2:.80},{x1:.91,x2:.97,y1:.40,y2:.82}]}
};
const state={x:0,zoom:1.55,active:null,dragging:false,pointerId:-1,startX:0,originX:0,progress:{},paid:{},completed:{},session:0,lastFrame:0,activePage:false,district:null,ads:[],people:[],gazeX:innerWidth/2,gazeY:innerHeight/2,gazeInside:false,archiveSaveClock:0,qsum:{},distracted:{},rained:{}};
const emptyAttention=()=>({ad:0,people:0,empty:0,districts:{villa:0,residential:0,commercial:0}});
function loadAttention(){try{const saved=JSON.parse(localStorage.getItem('lookcoin-attention-archive')||'null');if(!saved)return emptyAttention();return{ad:Number(saved.ad)||0,people:Number(saved.people)||0,empty:Number(saved.empty)||0,districts:{villa:Number(saved.districts?.villa)||0,residential:Number(saved.districts?.residential)||0,commercial:Number(saved.districts?.commercial)||0}}}catch{return emptyAttention()}}
let attention=loadAttention();
function saveAttention(){localStorage.setItem('lookcoin-attention-archive',JSON.stringify(attention));state.archiveSaveClock=0}
function formatTime(seconds){const value=Math.max(0,Math.floor(seconds)),h=Math.floor(value/3600),m=Math.floor(value%3600/60),s=value%60;return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function updateArchive(){/* 总数 = 各分项取整后相加，保证页面上数字加得起来 */const sum=Math.floor(attention.ad)+Math.floor(attention.people)+Math.floor(attention.empty);$('#archive-total').textContent=formatTime(sum);$('#archive-ad').textContent=formatTime(attention.ad);$('#archive-people').textContent=formatTime(attention.people);$('#archive-empty').textContent=formatTime(attention.empty);$('#archive-villa').textContent=formatTime(attention.districts.villa);$('#archive-residential').textContent=formatTime(attention.districts.residential);$('#archive-commercial').textContent=formatTime(attention.districts.commercial)}
function toggleArchive(open){if(open){updateArchive();$('#archive').classList.remove('hidden');setTimeout(()=>$('#close-archive').focus(),20)}else{$('#archive').classList.add('hidden');$('#open-archive').focus()}}
$('#open-archive').addEventListener('click',()=>toggleArchive(true));$('#close-archive').addEventListener('click',()=>toggleArchive(false));
const roleScrim=$('#role-scrim'),confirmScrim=$('#confirm-scrim'),resetScrim=$('#reset-scrim');
function toggleRole(open){roleScrim.classList.toggle('open',open);roleScrim.setAttribute('aria-hidden',String(!open));if(open){syncWallet();setTimeout(()=>$('#close-role').focus(),20)}else $('#open-role').focus()}
function toggleConfirm(open){confirmScrim.classList.toggle('open',open);confirmScrim.setAttribute('aria-hidden',String(!open));if(open)setTimeout(()=>$('#cancel-role').focus(),20)}
function toggleReset(open){resetScrim.classList.toggle('open',open);resetScrim.setAttribute('aria-hidden',String(!open));if(open)setTimeout(()=>$('#cancel-reset').focus(),20);else $('#open-reset').focus()}
$('#open-role').addEventListener('click',()=>toggleRole(true));$('#close-role').addEventListener('click',()=>toggleRole(false));roleScrim.addEventListener('click',e=>{if(e.target===roleScrim)toggleRole(false)});confirmScrim.addEventListener('click',e=>{if(e.target===confirmScrim)toggleConfirm(false)});
$('#open-reset').addEventListener('click',()=>toggleReset(true));$('#cancel-reset').addEventListener('click',()=>toggleReset(false));resetScrim.addEventListener('click',e=>{if(e.target===resetScrim)toggleReset(false)});
document.querySelectorAll('.role-option').forEach(item=>item.addEventListener('click',()=>{const next=item.dataset.role;if(next===currentRole){toggleRole(false);return}pendingRole=next;$('#pending-role').textContent=ROLES[next].label;toggleConfirm(true)}));
$('#cancel-role').addEventListener('click',()=>{pendingRole=null;toggleConfirm(false)});
$('#confirm-role').addEventListener('click',()=>{if(!pendingRole)return;currentRole=pendingRole;pendingRole=null;localStorage.setItem('lookcoin-role',currentRole);localStorage.setItem('lookcoin-total','0');state.progress={};state.paid={};state.completed={};state.qsum={};state.distracted={};state.rained={};state.session=0;$('#session-total').textContent='0';syncWallet();toggleConfirm(false);toggleRole(false);marketMessage(`ROLE SWITCHED — BALANCE RESET TO 0 LC`)});
$('#confirm-reset').addEventListener('click',()=>{currentRole='student';pendingRole=null;attention=emptyAttention();localStorage.setItem('lookcoin-role','student');localStorage.setItem('lookcoin-total','0');localStorage.setItem('lookcoin-attention-archive',JSON.stringify(attention));window.location.reload()});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(state.activePage){back();return}if(!$('#archive').classList.contains('hidden'))toggleArchive(false);else if(resetScrim.classList.contains('open'))toggleReset(false);else if(confirmScrim.classList.contains('open'))toggleConfirm(false);else if(roleScrim.classList.contains('open'))toggleRole(false)});
function geo(){const height=street.clientHeight*state.zoom;return{height,width:height*IMAGE_RATIO,top:(street.clientHeight-height)/2}}
function normX(x,w){while(x<=-w)x+=w;while(x>0)x-=w;return x}
function renderView(){street.style.setProperty('--pan-x',`${state.x}px`);street.style.setProperty('--pan-scale',state.zoom);$('#zoom-label').textContent=`−  ZOOM ${Math.round(state.zoom*100)}%  +`}
function findAd(cx,cy){if(state.dragging||!state.activePage||document.querySelector('#chat.open')||$('#panorama').classList.contains('loading'))return null;const r=street.getBoundingClientRect(),g=geo(),x=mod(cx-r.left-state.x,g.width)/g.width,y=(cy-r.top-g.top)/g.height;return state.ads.find(ad=>x>=ad.x1&&x<=ad.x2&&y>=ad.y1&&y<=ad.y2)||null}
function findPerson(cx,cy){if(state.dragging||!state.activePage||!state.gazeInside)return null;const r=street.getBoundingClientRect(),g=geo(),x=mod(cx-r.left-state.x,g.width)/g.width,y=(cy-r.top-g.top)/g.height;return state.people.find(person=>x>=person.x1&&x<=person.x2&&y>=person.y1&&y<=person.y2)||null}
function renderProgress(){if(!state.active)return;const elapsed=state.progress[state.active.id]||0,done=elapsed>=WATCH_SECONDS;ring.style.setProperty('--progress',`${elapsed/WATCH_SECONDS*360}deg`);$('#scan-status').textContent=done?'ATTENTION VERIFIED':'AD SURFACE DETECTED';$('#watch-time').textContent=done?'✓':(WATCH_SECONDS-elapsed).toFixed(1);$('#time-unit').textContent=done?'PAID':'SEC';$('#scan-instruction').textContent=done?'SETTLED':`VERIFICATION ${Math.round(eyes.q*100)}%`;const pend=done?0:Math.round(roleRate()*(state.qsum[state.active.id]||0));$('#reward').textContent=done?'PAID':`+${pend} LC PENDING`;$('#session-total').textContent=state.session+pend}
function setAd(ad){state.active=ad;scanCard.classList.toggle('visible',!!ad);gaze.classList.toggle('targeting',!!ad);reticle.classList.toggle('targeting',!!ad);if(ad){$('#ad-label').textContent=ad.label;renderProgress()}}
function addCoin(amount=1){if(amount)localStorage.setItem('lookcoin-total',String(total()+amount));state.session+=amount;$('#session-total').textContent=state.session;syncWallet();const coin=document.createElement('i');coin.textContent='●';coin.style.setProperty('--coin-x',`${Math.round(Math.random()*34-17)}px`);$('#coin-rain').appendChild(coin);setTimeout(()=>coin.remove(),1050)}
function enterZone(){if(!selectedZone)return;const district=DISTRICTS[selectedZone.id];state.district=selectedZone.id;state.ads=district.ads;state.people=district.people;state.x=0;state.zoom=1.55;state.active=null;state.session=0;state.gazeX=innerWidth/2;state.gazeY=innerHeight/2;state.gazeInside=false;$('#session-total').textContent='0';/* 先隐藏全景，等新街区图片解码完再显示，避免闪出上一个街区 */const pano=$('#panorama'),zoneId=selectedZone.id;pano.classList.add('loading');Promise.all([...document.querySelectorAll('.panorama-image')].map(img=>{if(!img.src.endsWith(district.src))img.src=district.src;return img.decode?img.decode().catch(()=>{}):Promise.resolve()})).then(()=>{if(state.district===zoneId)pano.classList.remove('loading')});$('#street-zone').innerHTML=`${district.label}&nbsp;&nbsp;—&nbsp;&nbsp;${district.zone}`;$('#visual-load').innerHTML=`VISUAL LOAD&nbsp;&nbsp;${district.load}%`;street.setAttribute('aria-label',`LOOKCOIN ${district.label.toLowerCase()} panoramic street view`);intro.classList.remove('off');city.classList.add('hidden');street.classList.remove('hidden');state.activePage=true;state.lastFrame=performance.now();renderView();syncWallet()}
function back(){clearDistraction();state.activePage=false;state.dragging=false;setAd(null);saveAttention();street.classList.add('hidden');city.classList.remove('hidden');gaze.classList.remove('visible');reticle.classList.remove('visible');syncWallet()}
$('#enter-zone').addEventListener('click',e=>{e.stopPropagation();enterZone()});$('#back-map').addEventListener('click',e=>{e.stopPropagation();back()});
street.addEventListener('pointermove',e=>{if(!state.activePage)return;const r=street.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;state.gazeX=e.clientX;state.gazeY=e.clientY;state.gazeInside=true;street.style.setProperty('--gaze-x',`${x}px`);street.style.setProperty('--gaze-y',`${y}px`);gaze.style.transform=`translate3d(${x}px,${y}px,0)`;reticle.style.transform=`translate3d(${x}px,${y}px,0)`;gaze.classList.add('visible');reticle.classList.add('visible');intro.classList.add('off');if(state.dragging&&state.pointerId===e.pointerId){const g=geo();state.x=normX(state.originX+e.clientX-state.startX,g.width);renderView();setAd(null)}else setAd(e.target.closest&&e.target.closest('#notify,#chat')?null:findAd(e.clientX,e.clientY))});
street.addEventListener('pointerdown',e=>{if(e.target.closest('button,#chat'))return;street.setPointerCapture(e.pointerId);state.dragging=true;state.pointerId=e.pointerId;state.startX=e.clientX;state.originX=state.x;street.classList.add('dragging');setAd(null)});
function endDrag(e){if(e.pointerId!==state.pointerId)return;state.dragging=false;street.classList.remove('dragging');setAd(findAd(e.clientX,e.clientY))}street.addEventListener('pointerup',endDrag);street.addEventListener('pointercancel',endDrag);street.addEventListener('pointerleave',()=>{state.gazeInside=false;gaze.classList.remove('visible');reticle.classList.remove('visible');setAd(null)});
street.addEventListener('wheel',e=>{if(!state.activePage)return;e.preventDefault();const old=geo(),r=street.getBoundingClientRect(),sx=e.clientX-r.left,p=mod(sx-state.x,old.width)/old.width;state.zoom=clamp(state.zoom-e.deltaY*.0012,1.12,2.45);const nw=street.clientHeight*state.zoom*IMAGE_RATIO;state.x=normX(sx-p*nw,nw);renderView();setAd(findAd(e.clientX,e.clientY))},{passive:false});
$('#reset-view').addEventListener('click',e=>{e.stopPropagation();state.x=0;state.zoom=1.55;intro.classList.remove('off');renderView()});
function recordAttention(dt){if(!state.activePage||!state.district||dt<=0)return;const category=state.active?'ad':findPerson(state.gazeX,state.gazeY)?'people':'empty';attention[category]+=dt;attention.districts[state.district]+=dt;state.archiveSaveClock+=dt;if(state.archiveSaveClock>=1)saveAttention()}
function animate(t){const elapsed=state.lastFrame?(t-state.lastFrame)/1000:0,dt=document.visibilityState==='visible'?Math.min(elapsed,5):0;if(state.activePage)recordAttention(dt);if(state.activePage)tickStrain(dt);if(state.activePage&&state.active&&!state.dragging&&!eyes.closed){const id=state.active.id,old=state.progress[id]||0;if(old<WATCH_SECONDS){const next=Math.min(WATCH_SECONDS,old+dt);state.progress[id]=next;state.qsum[id]=(state.qsum[id]||0)+(next-old)*eyes.q;const whole=Math.floor(next);if(whole>(state.rained[id]||0)){state.rained[id]=whole;addCoin(0)}if(next===WATCH_SECONDS){state.completed[id]=true;const pay=Math.round(roleRate()*WATCH_SECONDS*state.qsum[id]/WATCH_SECONDS);addCoin(pay);for(let k=0;k<6;k++)setTimeout(()=>addCoin(0),k*90);streetToast(`ATTENTION VERIFIED · +${pay} LC SETTLED`,'ok')}renderProgress()}}state.lastFrame=t;requestAnimationFrame(animate)}
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveAttention();state.lastFrame=performance.now()});window.addEventListener('beforeunload',saveAttention);renderView();requestAnimationFrame(animate);
/* 窗口尺寸变化时重新对齐全景（广告感应区跟着走） */
window.addEventListener('resize',()=>{if(!state.activePage)return;state.x=normX(state.x,geo().width);renderView()});
/* 地图加载完后在后台预加载三个街区全景，进入街景时不用等 */
window.addEventListener('load',()=>{Object.values(DISTRICTS).forEach(d=>{const i=new Image();i.src=d.src})});
/* 手机 / 平板提示：这个原型需要鼠标，引导用电脑打开 */
const mobileNote=$('#mobile-note');
if(matchMedia('(pointer:coarse)').matches&&!matchMedia('(any-pointer:fine)').matches){mobileNote.classList.remove('hidden')}
$('#mobile-continue').addEventListener('click',()=>mobileNote.classList.add('hidden'));
$('#mobile-copy-link').addEventListener('click',async e=>{const b=e.currentTarget;try{if(navigator.share){await navigator.share({title:'LOOKCOIN',url:location.href});return}await navigator.clipboard.writeText(location.href);b.textContent='LINK COPIED ✓'}catch{b.textContent=location.href}});
/* ===== 眼睛疲劳 + 干扰（Eye strain & distraction）===== */
const eyes={s:0,q:1,closed:false,forced:false,lastUI:0};
const strainEl=$('#strain'),veil=$('#strain .s-veil'),red=$('#strain .s-red'),veinSvg=$('#veins'),lids=$('#lids'),sToast=$('#street-toast');
const STRAIN_UP=1.6,STRAIN_DOWN=5; /* 每秒 %：累计盯广告约 60 秒才到满，移开约 20 秒恢复 */
function buildVeins(){const W=innerWidth,H=innerHeight;veinSvg.setAttribute('viewBox',`0 0 ${W} ${H}`);let d='';const cx=W/2,cy=H/2;
  const branch=(x,y,ang,len,w,depth)=>{let px=x,py=y;const seg=10+Math.random()*8;const n=Math.max(2,Math.floor(len/seg));let path=`M${px.toFixed(1)} ${py.toFixed(1)}`;
    for(let i=0;i<n;i++){ang+=(Math.random()-.5)*.7;px+=Math.cos(ang)*seg;py+=Math.sin(ang)*seg;path+=` L${px.toFixed(1)} ${py.toFixed(1)}`;
      if(depth<3&&Math.random()<.16)branch(px,py,ang+(Math.random()<.5?-1:1)*(.5+Math.random()*.6),len*(.35+Math.random()*.3),w*.6,depth+1)}
    d+=`<path d="${path}" stroke-width="${w.toFixed(2)}"/>`};
  for(let i=0;i<34;i++){const side=i%4;let x,y;if(side===0){x=Math.random()*W;y=-4}else if(side===1){x=W+4;y=Math.random()*H}else if(side===2){x=Math.random()*W;y=H+4}else{x=-4;y=Math.random()*H}
    const ang=Math.atan2(cy-y,cx-x)+(Math.random()-.5)*.9;branch(x,y,ang,Math.min(W,H)*(.05+Math.random()*.12),.4+Math.random()*.9,0)}
  veinSvg.innerHTML=`<g fill="none" stroke-linecap="round" stroke-linejoin="round">${d}</g>`}
buildVeins();addEventListener('resize',buildVeins);
function blink(ms){if(eyes.closed)return;eyes.closed=true;lids.classList.add('closed');setTimeout(()=>{lids.classList.remove('closed');setTimeout(()=>{eyes.closed=false;eyes.forced=false},120)},ms)}
function tickStrain(dt){if(!dt)return;const watching=state.active&&!state.dragging&&!eyes.closed&&!(state.completed[state.active.id]);
  eyes.s=clamp(eyes.s+(watching?STRAIN_UP:-STRAIN_DOWN)*dt/100,0,1);const s=eyes.s;
  eyes.q=1-.4*Math.max(0,(s-.4)/.6);
  if(Math.abs(s-(eyes.drawn??-1))>.01||(s===0&&eyes.drawn!==0)){eyes.drawn=s;veil.style.opacity=(s*.4).toFixed(3);red.style.opacity=Math.max(0,(s-.5)*.6).toFixed(3);veinSvg.style.opacity=(Math.min(1,Math.max(0,(s-.7)/.3))*.4).toFixed(3)}
  
  if(s>.75&&!eyes.closed&&Math.random()<dt*(s-.7)*.9)blink(140+Math.random()*80);
  if(s>=.99&&!eyes.closed){eyes.forced=true;eyes.s=.85;blink(500);streetToast('YOUR EYES NEED REST · LOOK AWAY TO RECOVER','warn')}
  const now=performance.now();if(now-eyes.lastUI>200){eyes.lastUI=now;const d=DISTRICTS[state.district];$('#visual-load').innerHTML=`VISUAL LOAD&nbsp;&nbsp;${d?d.load:0}%&nbsp;&nbsp;·&nbsp;&nbsp;<b class="${s>.75?'hot':''}">EYE STRAIN&nbsp;&nbsp;${Math.round(s*100)}%</b>`}}
function streetToast(msg,kind){sToast.textContent=msg;sToast.className='show '+(kind||'');clearTimeout(sToast._t);sToast._t=setTimeout(()=>sToast.className='',2600)}
function clearDistraction(){lids.classList.remove('closed');eyes.closed=false;eyes.s=0;eyes.drawn=-1;veil.style.opacity=0;red.style.opacity=0;veinSvg.style.opacity=0}
})();
