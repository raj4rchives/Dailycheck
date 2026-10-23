const $=id=>document.getElementById(id);
const settings=['days','lectures','hw','dpp','pyq','questions','rev'];
const storeKey='examytrack-v1';
let state=JSON.parse(localStorage.getItem(storeKey)||'null')||{
  settings:{days:20,lectures:4,hw:1,dpp:1,pyq:1,questions:30,rev:1},checks:{},theme:'dark'
};
settings.forEach(k=>$(k).value=state.settings[k]);
document.body.dataset.theme=state.theme;

function save(){localStorage.setItem(storeKey,JSON.stringify(state));}
function countBlocks(n){return Math.ceil(Number(n||0)/10)}
function boxes(day,type,count){
  const wrap=document.createElement('div'); wrap.className='checks';
  for(let i=0;i<count;i++){
    const b=document.createElement('button'); b.className='box';
    const key=`${day}-${type}-${i}`;
    if(state.checks[key]) b.classList.add('checked');
    b.onclick=()=>{state.checks[key]=!state.checks[key];b.classList.toggle('checked');save();updateProgress()};
    wrap.appendChild(b);
  }
  return wrap;
}
function render(){
  const s=state.settings, t=$('tracker'); t.innerHTML='';
  const head=t.insertRow(); ['DAY','LECTURES','HW / MODULE','DPP','PYQ','QUESTIONS (10 = 1 □)','REV'].forEach(x=>{const c=head.insertCell();c.outerHTML=`<th>${x}</th>`});
  for(let d=1;d<=s.days;d++){
    const r=t.insertRow(), c=r.insertCell();
    c.innerHTML=`<span class="dayNum">DAY ${d}</span><span class="sub">JEE TRACK</span>`;
    const vals=[['lec',s.lectures],['hw',s.hw],['dpp',s.dpp],['pyq',s.pyq],['q',countBlocks(s.questions)],['rev',s.rev]];
    vals.forEach(([type,n])=>r.insertCell().appendChild(boxes(d,type,n)));
  }
  updateProgress();
}
function buildPrintPages(){
  const root=document.getElementById('printPages');
  root.innerHTML='';
  const s=state.settings;
  const pages=Math.ceil(s.days/20);

  function makeTable(start,end){
    const table=document.createElement('table');
    const head=table.insertRow();
    ['DAY','LECTURES','HW / MODULE','DPP','PYQ','QUESTIONS (10 = 1 □)','REV'].forEach(x=>{
      const c=head.insertCell();
      c.outerHTML=`<th>${x}</th>`;
    });

    for(let d=start;d<=end;d++){
      const r=table.insertRow();
      const c=r.insertCell();
      c.innerHTML=`<span class="dayNum">DAY ${d}</span><span class="sub">JEE TRACK</span>`;
      const vals=[['lec',s.lectures],['hw',s.hw],['dpp',s.dpp],['pyq',s.pyq],['q',countBlocks(s.questions)],['rev',s.rev]];
      vals.forEach(([type,n])=>r.insertCell().appendChild(boxes(d,type,n)));
    }
    return table;
  }

  for(let p=0;p<pages;p++){
    const start=p*20+1;
    const end=Math.min((p+1)*20,s.days);
    const page=document.createElement('div');
    page.className='printPage';

    const panel=document.createElement('section');
    panel.className='panel';

    const head=document.createElement('div');
    head.className='trackerHead';
    head.innerHTML=`
      <div>
        <div class="eyebrow">YOUR DAILY PLAN · EXAMYTRACK</div>
        <h2>Days ${start}–${end} Checklist</h2>
        <div class="pageLabel">Page ${p+1} of ${pages} · 20 days per A4 page</div>
      </div>
      <div class="progress">${document.getElementById('progress').textContent}</div>`;
    panel.appendChild(head);

    const wrap=document.createElement('div');
    wrap.className='tableWrap';
    wrap.appendChild(makeTable(start,end));
    panel.appendChild(wrap);
    page.appendChild(panel);
    root.appendChild(page);
  }
}

function updateProgress(){
  const s=state.settings;
  let total=s.days*(s.lectures+s.hw+s.dpp+s.pyq+countBlocks(s.questions)+s.rev), done=0;
  for(let d=1;d<=s.days;d++){
    for(const [type,n] of [['lec',s.lectures],['hw',s.hw],['dpp',s.dpp],['pyq',s.pyq],['q',countBlocks(s.questions)],['rev',s.rev]])
      for(let i=0;i<n;i++) if(state.checks[`${d}-${type}-${i}`]) done++;
  }
  $('progress').textContent=(total?Math.round(done/total*100):0)+'%';
  if(document.getElementById('printPages')) buildPrintPages();
}
$('generate').onclick=()=>{
  settings.forEach(k=>state.settings[k]=Math.max(0,Number($(k).value)||0));
  state.settings.days=Math.min(365,Math.max(1,state.settings.days));
  save();render();
};
$('clear').onclick=()=>{
  if(confirm('Clear all ticks?')){state.checks={};save();render();}
};
$('print').onclick=()=>{buildPrintPages();window.print();};
$('themeBtn').onclick=()=>$('themeMenu').classList.toggle('open');
document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{
  state.theme=b.dataset.theme;document.body.dataset.theme=state.theme;save();$('themeMenu').classList.remove('open');
});
render();