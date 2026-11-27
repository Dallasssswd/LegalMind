'use strict';
// Live AI uses the separately hosted HTTPS gateway. API keys remain in this tab's memory.
let voice=true,lastSpeech='',currentCase=null,transcript=[],mode='scenario',busy=false;
let apiKey='', gatewayUrl=String(window.LEGALMIND_GATEWAY_URL||'').trim();
const speechAvailable='speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const main=document.getElementById('main'),notice=document.getElementById('notice');
function connectionStatus(){document.getElementById('online').textContent=apiKey&&gatewayUrl?'● AI READY':'● SETUP REQUIRED'}
connectionStatus();
const el=id=>document.getElementById(id);
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const header=(a,b)=>'<h1>'+escapeHTML(a)+'</h1><p>'+escapeHTML(b)+'</p>';
function getData(){try{const x=JSON.parse(localStorage.getItem('legalmind_web_progress')||'null');return x&&Array.isArray(x.cases)?x.cases:[]}catch{return []}}
function addData(item){const entries=getData();entries.unshift(item);try{localStorage.setItem('legalmind_web_progress',JSON.stringify({cases:entries.slice(0,50)}));}catch{notice.textContent='Unable to store progress locally'}}
function stats(){const entries=getData(),xp=entries.reduce((n,x)=>n+(Number(x.xp)||0),0);return {cases:entries.length,xp,rank:xp>=500?'SENIOR ATTORNEY':xp>=150?'ATTORNEY':'LAW STUDENT'}}
function stopVoice(){if(speechAvailable)window.speechSynthesis.cancel()}
function speak(text){
 lastSpeech=String(text||'').slice(0,6000);stopVoice();
 if(!voice||!speechAvailable||!lastSpeech)return;
 const u=new SpeechSynthesisUtterance(lastSpeech);u.rate=.94;
 try{window.speechSynthesis.speak(u)}catch{notice.textContent='[ INFO ] Speech is unavailable in this browser'}
}
function page(p){
 if(busy)return;
 stopVoice();
 document.querySelectorAll('nav button').forEach(b=>{
   const selected=b.dataset.page===p;
   b.classList.toggle('active',selected);
   if(selected)b.setAttribute('aria-current','page');
   else b.removeAttribute('aria-current');
 });
 if(p==='home')home();
 else if(p==='settings')settings();
 else if(p==='career')career();
 else if(p==='archives')archives();
 else {mode=p;play()}
 window.scrollTo({top:0,behavior:'instant'});
}
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>page(b.dataset.page)));
function home(){const x=stats();main.innerHTML=header('LEGALMIND','AI LEGAL SIMULATION // v1.0')+
'<div class="panel"><p>[ OK ] SYSTEM INITIALIZED</p><h2>WELCOME, COUNSEL</h2>'+
'<p>RANK: '+escapeHTML(x.rank)+' | XP: '+x.xp+' | CASES: '+x.cases+'</p>'+
'<p>Create new AI-generated legal cases, question witnesses and receive feedback using your own OpenAI API key. Setup is required in Settings.</p>'+
'<button id="start">> BEGIN SCENARIO</button></div>';el('start').onclick=()=>page('scenario')}
function settings(){
  main.innerHTML=header('SETTINGS','PRIVATE SESSION KEY / SECURE HTTPS GATEWAY')+
   '<section class="panel"><h2>CONNECT LEGALMIND TO AI</h2>'+
   '<p>LegalMind needs a deployed HTTPS API gateway to work on GitHub Pages. Your OpenAI key stays in browser memory until refresh or closing the tab, and is sent to the gateway for each request. Only use a gateway you trust.</p>'+
   '<label for="gateway">GATEWAY URL (FROM THE REPOSITORY OWNER)</label>'+
   '<input id="gateway" type="url" placeholder="https://legalmind-gateway.example.workers.dev" autocomplete="off" spellcheck="false">'+
   '<label for="key">YOUR OPENAI API KEY</label>'+
   '<input id="key" type="password" maxlength="512" placeholder="sk-..." autocomplete="off" spellcheck="false">'+
   '<div class="row"><button id="usekey">CONNECT FOR THIS SESSION</button><button id="forget">DISCONNECT / CLEAR KEY</button></div>'+
   '<p id="connectionmsg" role="status" class="muted"></p>'+
   '<p class="tiny">Neither your key nor your gateway URL is stored in browser storage. OpenAI API usage is billed separately from ChatGPT. Never paste your key into a site you do not trust. A browser extension or compromised site could still access it.</p></section>'+
   '<section class="panel"><h2>FREE VOICE NARRATION</h2>'+
   '<button id="togglevoice">'+(voice?'MUTE VOICE':'ENABLE VOICE')+'</button> '+
   '<button id="testvoice">TEST VOICE</button> <button id="stopvoice">STOP SPEAKING</button>'+
   (speechAvailable?'':'<p class="alert">Your browser does not support speech playback; text features still work.</p>')+
   '</section>';
  el('gateway').value=gatewayUrl;
  el('connectionmsg').textContent=apiKey&&gatewayUrl?'[ CONNECTED ] Key and gateway selected for this session.':'[ OFFLINE ] Enter both fields to connect.';
  el('usekey').onclick=()=>{
    const nextUrl=el('gateway').value.trim().replace(/\/+$/,'');
    const nextKey=el('key').value.trim();
    let parsed;
    try{parsed=new URL(nextUrl)}catch{el('connectionmsg').textContent='[ ERROR ] Enter a valid HTTPS gateway URL.';return}
    if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.search||parsed.hash||parsed.pathname!=='/'||!parsed.hostname.endsWith('.workers.dev')){
      el('connectionmsg').textContent='[ ERROR ] Use the trusted Cloudflare Worker HTTPS root URL ending in .workers.dev.';return;
    }
    if(!nextKey.startsWith('sk-')||nextKey.length>512){
      el('connectionmsg').textContent='[ ERROR ] Enter your own valid-looking OpenAI key.';return;
    }
    gatewayUrl=nextUrl;apiKey=nextKey;el('key').value='';connectionStatus();
    el('connectionmsg').textContent='[ READY ] Session connected. Generate a case to verify API access.';
  };
  el('forget').onclick=()=>{apiKey='';el('key').value='';connectionStatus();el('connectionmsg').textContent='[ CLEARED ] Key discarded.'};
  el('togglevoice').onclick=()=>{voice=!voice;stopVoice();el('togglevoice').textContent=voice?'MUTE VOICE':'ENABLE VOICE'};
  el('testvoice').onclick=()=>speak('LegalMind voice is ready.');
  el('stopvoice').onclick=stopVoice;
}
function career(){const x=stats();main.innerHTML=header('CAREER','PLAYER DOSSIER')+
'<section class="panel"><h2>'+escapeHTML(x.rank)+'</h2><p>XP: '+x.xp+'<br>Cases completed: '+x.cases+'</p>'+
'<p>Law Student → Attorney at 150 XP → Senior Attorney at 500 XP.</p></section>'}
function archives(){const entries=getData();main.innerHTML=header('CASE ARCHIVES','Saved only in this browser (no cross-device sync)')+
(entries.length?entries.map(x=>'<section class="panel"><h2>'+escapeHTML(x.title)+'</h2><p>'+escapeHTML(x.date)+' • '+escapeHTML(x.mode)+' • '+Number(x.score)+'/100 • +'+Number(x.xp)+' XP</p>'+
'<p>YOUR ARGUMENT</p><p class="casefacts">'+escapeHTML(x.argument)+'</p><p>AI FEEDBACK</p><p class="casefacts">'+escapeHTML(x.feedback)+'</p></section>').join(''):'<p>[ EMPTY ] No completed cases yet.</p>')}
async function api(action,payload){
  if(!apiKey||!gatewayUrl)throw Error('Open Settings and connect your own API key and trusted gateway.');
  if(!['case','witness','grade'].includes(action))throw Error('Unknown action');
  let response;
  try{
    response=await fetch(gatewayUrl+'/api/'+action,{
      method:'POST',mode:'cors',credentials:'omit',cache:'no-store',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...payload,api_key:apiKey})
    });
  }catch{throw Error('Cannot connect to the gateway. Check its HTTPS address and deployment.')}
  let data;
  try{data=await response.json()}catch{throw Error('Gateway returned an unexpected response.')}
  if(!response.ok)throw Error(String(data.error||'AI request failed.').slice(0,180));
  return data;
}
async function task(run){if(busy)return;busy=true;notice.textContent='[ WORKING ] CONTACTING AI...';
document.querySelectorAll('main button').forEach(b=>b.disabled=true);
try{await run();notice.textContent='[ OK ] READY'}catch(e){notice.textContent='[ ERROR ] '+e.message;const box=el('error');if(box)box.textContent='[ ERROR ] '+e.message}
finally{busy=false;document.querySelectorAll('main button').forEach(b=>b.disabled=false);
if(el('argument')&&el('argument').disabled&&el('submit'))el('submit').disabled=true}}
function play(){currentCase=null;transcript=[];
main.innerHTML=header(mode==='courtroom'?'COURTROOM SIMULATOR':'SCENARIO CHALLENGE',
'AI-GENERATED FICTIONAL CASES')+
'<section class="panel"><div class="grid"><div><label for="jurisdiction">JURISDICTION</label><select id="jurisdiction">'+
['North Carolina','Federal (U.S.)','South Carolina','California','New York'].map(x=>'<option>'+x+'</option>').join('')+'</select></div>'+
'<div><label for="category">LEGAL CATEGORY</label><select id="category">'+
['Constitutional Law','Criminal Law','Cyber Law','Civil Law','Business Law'].map(x=>'<option>'+x+'</option>').join('')+'</select></div>'+
'<div><label for="difficulty">DIFFICULTY</label><select id="difficulty">'+
['Easy','Medium','Hard','Expert'].map(x=>'<option'+(x==='Medium'?' selected':'')+'>'+x+'</option>').join('')+'</select></div></div>'+
'<button id="generate" class="action">GENERATE NEW CASE</button><p id="error" class="alert"></p></section><div id="casearea"></div>';
el('generate').onclick=()=>task(async()=>{const c=await api('case',{mode,jurisdiction:el('jurisdiction').value,category:el('category').value,difficulty:el('difficulty').value});currentCase=c;transcript=[];showCase();el('casearea').scrollIntoView({block:'start'});speak(c.title+'. '+c.facts+'. '+c.question)})}
function showCase(){const c=currentCase,isCourt=mode==='courtroom';
el('casearea').innerHTML='<section class="panel"><p class="caption">'+escapeHTML(c.jurisdiction)+' / '+escapeHTML(c.category)+' / '+escapeHTML(c.difficulty)+'</p>'+
'<h2>'+escapeHTML(c.title)+'</h2><p class="casefacts">'+escapeHTML(c.facts)+'</p><p>LEGAL QUESTION: '+escapeHTML(c.question)+'</p>'+
'<button id="replay">REPLAY LAST AUDIO</button> <button id="stopspeech">STOP AUDIO</button></section>'+
(isCourt?'<section class="panel"><h2>WITNESS: '+escapeHTML(c.witness_name||'Fictional witness')+'</h2>'+
'<p>'+escapeHTML(c.witness_background)+'</p><div class="transcript" id="transcript">[ COURTROOM ] Ask the witness a question.</div>'+
'<label for="question">YOUR QUESTION (UP TO SIX)</label><input id="question" maxlength="650" placeholder="What did you observe?">'+
'<button id="ask" class="action">QUESTION WITNESS</button></section>':'')+
'<section class="panel"><h2>'+(isCourt?'CLOSING ARGUMENT':'YOUR LEGAL ANALYSIS')+'</h2>'+
'<textarea id="argument" maxlength="5000" placeholder="Explain legal issues, facts, and uncertainties..."></textarea>'+
'<button id="submit" class="action">'+(isCourt?'PRESENT ARGUMENT TO JUDGE':'SUBMIT ARGUMENT FOR AI EVALUATION')+'</button>'+
'<p id="error" class="alert"></p><div id="result" class="result"></div></section>';
el('replay').onclick=()=>speak(lastSpeech);el('stopspeech').onclick=stopVoice;
if(isCourt)el('ask').onclick=()=>task(async()=>{const question=el('question').value.trim();if(question.length<5)throw Error('Please ask a full question');if(transcript.length>=12)throw Error('Six-question limit reached');
const x=await api('witness',{case:currentCase,transcript,question});transcript.push({role:'player',text:question},{role:'witness',text:x.reply});
el('transcript').textContent+='\n\nYOU: '+question+'\nWITNESS: '+x.reply;el('question').value='';speak(x.reply)});
el('submit').onclick=()=>task(async()=>{const argument=el('argument').value.trim();if(argument.length<25)throw Error('Write at least 25 characters of reasoning');
const x=await api('grade',{case:currentCase,transcript,argument});const xp=Math.max(5,Math.floor(x.score/5));
el('result').textContent='AI FEEDBACK SCORE: '+x.score+'/100 | +'+xp+' XP\n\nJUDGE FEEDBACK: '+x.feedback+'\n\nSTRENGTH: '+x.strength+'\n\nTO IMPROVE: '+x.improvement;
el('argument').disabled=true;addData({title:c.title,mode,date:new Date().toLocaleString(),score:x.score,xp,argument,feedback:x.feedback+'\n'+x.improvement});
el('result').scrollIntoView({block:'nearest'});
speak('Your score is '+x.score+' out of one hundred. '+x.feedback+' '+x.improvement)})}
page('home');
