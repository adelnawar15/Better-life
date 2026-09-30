/* Pure local-data derivations. No storage, DOM, network, or fabricated activity. */
(function(root){
'use strict';
const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const valid=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&dateKey(new Date(d+'T12:00:00'))===d;
const add=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return dateKey(x)};
const diff=(a,b)=>Math.round((Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000);
const monday=d=>add(d,-((new Date(d+'T12:00:00').getDay()+6)%7));
const percentage=(n,d)=>d?Math.round(n/d*100):null;
const initialProjects=[['project-sports-center',"Children's Sports Center",'Primary'],['project-gymiki','Gymiki','Active'],['project-data-analysis','Data Analysis','Active'],['project-investing','Investing','Active']].map(([id,name,status])=>({id,name,status,manualProgress:null,milestone:'',taskIds:[],goalIds:[]}));
function migrateV3(raw){return {...raw,schemaVersion:4,projects:Array.isArray(raw.projects)?raw.projects.map(p=>({...p})):initialProjects.map(p=>({...p,taskIds:[],goalIds:[]}))}}
function history(db,h,today){
 const prefix=h.id+'-',logs=db.logs||{},dates=Object.keys(logs).filter(k=>k.startsWith(prefix)&&valid(k.slice(prefix.length))).map(k=>k.slice(prefix.length)).sort();
 const anchor=valid(h.journeyStartDate)?h.journeyStartDate:dates.find(d=>d<=today)||null;
 const declared=valid(h.journeyStartDate);
 const done=d=>h.tracking==='quantity'?Number(logs[prefix+d])>=Number(h.target||1):!!logs[prefix+d];
 const state=d=>d>today?'future':done(d)?'completed':d===today?'pending':Object.prototype.hasOwnProperty.call(logs,prefix+d)||(declared&&d>=anchor)?'missed':'unknown';
 const weekly=String(h.frequency).toLowerCase()==='weekly';
 const weekState=start=>{
  const days=Array.from({length:7},(_,i)=>add(start,i)),end=days[6];
  if(start>today)return 'future';
  if(days.some(d=>d<=today&&done(d)))return 'completed';
  if(end>=today)return 'pending';
  return days.every(d=>state(d)==='missed')?'missed':'unknown';
 };
 return {dates,anchor,declared,done,state,weekly,weekState};
}
function journey(db,h,today=dateKey()){
 const z=history(db,h,today),origin=z.anchor||today;
 const elapsed=Math.max(0,diff(today,origin)),cycle=Math.floor(elapsed/30),start=add(origin,cycle*30);
 const cells=Array.from({length:30},(_,i)=>{const date=add(start,i);return {date,number:i+1,state:z.weekly&&date<today&&!z.done(date)?'unknown':z.state(date),today:date===today}});
 const recent=Array.from({length:30},(_,i)=>add(today,i-29));
 const periods=z.weekly?[...new Set(recent.map(monday))].map(d=>({date:d,state:z.weekState(d)})):recent.map(d=>({date:d,state:z.state(d)}));
 const known=periods.filter(p=>['completed','missed'].includes(p.state)),completed=known.filter(p=>p.state==='completed').length;
 const current=z.weekly?monday(today):today,step=z.weekly?7:1,status=z.weekly?z.weekState:z.state;
 let cursor=status(current)==='completed'?current:add(current,-step),streak=0;
 // Bound by recorded history, never an arbitrary 14/30-day truncation.
 const first=z.dates.find(d=>d<=today)||today,lower=z.weekly?monday(first):first;
 while(cursor>=lower&&status(cursor)==='completed'){streak++;cursor=add(cursor,-step)}
 const cycleWeeks=[...new Set(cells.map(c=>monday(c.date)))].map(d=>({date:d,state:z.weekState(d)}));
 return {id:h.id,anchor:z.anchor,anchorLabel:z.declared?'Journey started':z.anchor?'Earliest recorded history':'No recorded history yet',start,end:add(start,29),cycle:cycle+1,position:!z.anchor||today<start?0:Math.min(30,diff(today,start)+1),cells,recent:recent.slice(-7).map(date=>({date,state:z.weekly&&date<today&&!z.done(date)?'unknown':z.state(date),today:date===today})),periods,cycleWeeks,weekly:z.weekly,streak,unit:z.weekly?'week':'day',completed,known:known.length,rate:percentage(completed,known.length),unknown:periods.filter(p=>p.state==='unknown').length,cycleCompleted:cells.filter(c=>c.state==='completed').length,todayDone:z.done(today),periodDone:status(current)==='completed',todayValue:(db.logs||{})[h.id+'-'+today]||0};
}
function projectState(db,p){
 const tasks=(db.tasks||[]).filter(t=>(p.taskIds||[]).includes(t.id)),goals=(db.goals||[]).filter(g=>(p.goalIds||[]).includes(g.id));
 const manual=p.manualProgress!==null&&p.manualProgress!==''&&p.manualProgress!==undefined&&Number.isFinite(Number(p.manualProgress));
 const progress=manual?Math.max(0,Math.min(100,Number(p.manualProgress))):tasks.length?percentage(tasks.filter(t=>t.done).length,tasks.length):null;
 return {...p,tasks,goals,progress,progressSource:manual?'Manual progress':tasks.length?'Linked tasks':'Progress not set'};
}
function selectDailyMode(s){
 if(s.checkin&&(['Calm','Recovery'].includes(s.checkin.intention)||['Low','Very Low'].includes(s.checkin.energy)))return 'Calm';
 if(s.habits.some(x=>!x.periodDone&&x.streak===0&&x.periods.slice(-3,-1).some(p=>p.state==='missed')))return 'Reset';
 const total=s.todayTasks.length+s.habits.length,done=s.todayTasks.filter(t=>t.done).length+s.habits.filter(h=>h.periodDone).length;
 if(total>0&&done===total)return 'Achievement';
 if(s.hour>=18)return 'Review';
 if(s.overdue.length>=3||s.topTasks.some(t=>t.priority==='High'))return 'Focus';
 if(s.topTasks.length||s.habits.some(h=>!h.periodDone))return 'Execution';
 return 'Focus';
}
const copy={Focus:['Make room for what matters.','One clear priority. One useful step.'],Execution:['Move one meaningful step forward.','Give the next small action your attention.'],Calm:['Keep today simple.','A little space can make the next step clearer.'],Reset:['Start again from here.','Your previous progress still counts.'],Review:['Notice what moved forward.','Take what helped into tomorrow.'],Achievement:['Consistency is building.','Pause and appreciate what you followed through on.']};
function buildDailyState(db,now=new Date()){
 const today=dateKey(now),tasks=db.tasks||[],todayTasks=tasks.filter(t=>t.date===today),overdue=tasks.filter(t=>!t.done&&t.date&&t.date<today);
 const order={High:0,Medium:1,Low:2};
 const topTasks=[...overdue,...todayTasks.filter(t=>!t.done)].sort((a,b)=>(order[a.priority]??1)-(order[b.priority]??1)||a.date.localeCompare(b.date)||(a.time||'99').localeCompare(b.time||'99')).slice(0,3);
 const habits=(db.habits||[]).map(h=>({...journey(db,h,today),habit:h})),projects=(db.projects||[]).map(p=>projectState(db,p)).filter(p=>['Primary','Active'].includes(p.status));
 const checkin=(db.checkins||[]).filter(c=>c.date===today).at(-1);
 const s={today,hour:now.getHours(),todayTasks,overdue,topTasks,habits,projects,checkin,focus:projects.find(p=>p.status==='Primary')||projects[0]||null};
 s.mode=selectDailyMode(s);s.message=copy[s.mode][Math.abs(diff(today,'2026-01-01'))%2];
 s.greeting=s.hour<12?'Good morning':s.hour<18?'Good afternoon':'Good evening';
 s.image=['Calm','Reset'].includes(s.mode)?'assets/calm-sky.webp':'assets/daily-landscape.webp';
 s.week=Array.from({length:7},(_,i)=>{const date=add(monday(today),i);return {date,today:date===today,future:date>today,activity:date<=today&&(tasks.some(t=>t.done&&(t.completedAt?dateKey(new Date(t.completedAt))===date:t.date===date))||habits.some(h=>history(db,h.habit,today).done(date)))}});
 return s;
}
const api={dateKey,valid,add,diff,monday,percentage,initialProjects,migrateV3,history,journey,projectState,selectDailyMode,buildDailyState};
if(typeof module!=='undefined')module.exports=api;root.BetterLifeDaily=api;
})(typeof globalThis!=='undefined'?globalThis:this);
