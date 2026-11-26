'use strict';
// Key is intentionally only in this page's memory, never browser storage.
let voice=true,lastSpeech='',currentCase=null,transcript=[],mode='scenario',busy=false;
const main=document.getElementById('main'),notice=document.getElementById('notice');
const el=id=>document.getElementById(id);
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const header=(a,b)=>'<h1>'+escapeHTML(a)+'</h1><p>'+escapeHTML(b)+'</p>';
function getData(){try{const x=JSON.parse(localStorage.getItem('legalmind_web_progress')||'null');return x&&Array.isArray(x.cases)?x.cases:[]}catch{return []}}
function addData(item){const entries=getData();entries.unshift(item);try{localStorage.setItem('legalmind_web_progress',JSON.stringify({cases:entries.slice(0,50)}));}catch{notice.textContent='Unable to store progress locally'}}
function stats(){const entries=getData(),xp=entries.reduce((n,x)=>n+(Number(x.xp)||0),0);return {cases:entries.length,xp,rank:xp>=500?'SENIOR ATTORNEY':xp>=150?'ATTORNEY':'LAW STUDENT'}}
function stopVoice(){if('speechSynthesis' in window)window.speechSynthesis.cancel()}
function speak(text){lastSpeech=String(text||'').slice(0,6000);stopVoice();if(!voice||!('speechSynthesis' in window)||!lastSpeech)return;const u=new SpeechSynthesisUtterance(lastSpeech);u.rate=.94;window.speechSynthesis.speak(u)}
function page(p){if(busy)return;stopVoice();document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===p));if(p==='home')return home();if(p==='settings')return settings();if(p==='career')return career();if(p==='archives')return archives();mode=p;play()}
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>page(b.dataset.page)));
function home(){const x=stats();main.innerHTML=header('LEGALMIND','GITHUB PAGES PRACTICE DEMO // v0.6')+
'<div class="panel"><p>[ OK ] SYSTEM INITIALIZED</p><h2>WELCOME, COUNSEL</h2>'+
'<p>RANK: '+escapeHTML(x.rank)+' | XP: '+x.xp+' | CASES: '+x.cases+'</p>'+
'<p>Try sample fictional cases, scripted witnesses and checklist feedback. No API key required.</p>'+
'<button id="start">> BEGIN SCENARIO</button></div>';el('start').onclick=()=>page('scenario')}
function settings(){
 main.innerHTML=header('DEMO SETTINGS','GITHUB PAGES / FREE BROWSER VOICE')+
 '<section class="panel"><h2>PUBLIC DEMO MODE</h2><p>This version runs entirely in your browser on GitHub Pages. It contains fictional practice cases; no OpenAI requests are made and no API key is needed.</p>'+
 '<p>Live AI case generation and witness replies require deploying a separate secure Python backend. Never put an OpenAI key in publicly hosted JavaScript or a GitHub repository.</p></section>'+
 '<section class="panel"><h2>FREE TEXT-TO-SPEECH</h2><p>Uses voices built into your browser and operating system.</p>'+
 '<button id="togglevoice">'+(voice?'MUTE VOICE':'ENABLE VOICE')+'</button> '+
 '<button id="testvoice">TEST VOICE</button> <button id="stopvoice">STOP SPEAKING</button></section>';
 el('togglevoice').onclick=()=>{voice=!voice;stopVoice();el('togglevoice').textContent=voice?'MUTE VOICE':'ENABLE VOICE'};
 el('testvoice').onclick=()=>speak('LegalMind practice mode is ready.');
 el('stopvoice').onclick=stopVoice;
}
function career(){const x=stats();main.innerHTML=header('CAREER','PLAYER DOSSIER')+
'<section class="panel"><h2>'+escapeHTML(x.rank)+'</h2><p>XP: '+x.xp+'<br>Cases completed: '+x.cases+'</p>'+
'<p>Law Student → Attorney at 150 XP → Senior Attorney at 500 XP.</p></section>'}
function archives(){const entries=getData();main.innerHTML=header('CASE ARCHIVES','Saved in this browser only (demo)')+
(entries.length?entries.map(x=>'<section class="panel"><h2>'+escapeHTML(x.title)+'</h2><p>'+escapeHTML(x.date)+' • '+escapeHTML(x.mode)+' • '+Number(x.score)+'/100 • +'+Number(x.xp)+' XP</p>'+
'<p>YOUR ARGUMENT</p><p class="casefacts">'+escapeHTML(x.argument)+'</p><p>AI FEEDBACK</p><p class="casefacts">'+escapeHTML(x.feedback)+'</p></section>').join(''):'<p>[ EMPTY ] No completed cases yet.</p>')}
const DEMO_CASES=[
 {title:'The School Locker Search',facts:'During a school day, an administrator receives a report that a student may be carrying a missing school tablet. Without asking the student, the administrator opens the student’s assigned locker. The school handbook says lockers are school property, but it is unclear whether students were told searches could occur. The administrator finds a tablet similar to the missing one, but its ownership has not been confirmed.',question:'What facts matter when deciding whether the locker search was reasonable, and what arguments could each side raise?',witness_name:'School administrator',witness_background:'A school official who received the report.'},
 {title:'The Community Photo Dispute',facts:'A student photographs a public outdoor community event. A local business reposts one of the photos in an online advertisement without asking permission. The student posted the original image on a public social media page. The business says publicly visible photographs are free to reuse. No written license or agreement is known.',question:'What issues about copyright ownership, permission and potential defenses should be explored?',witness_name:'Business manager',witness_background:'The person who approved the advertisement.'},
 {title:'The Rental Agreement Question',facts:'A tenant and a landlord disagree over a repair requested by email. The lease mentions maintenance duties but does not clearly cover this issue. The tenant says the repair is urgent; the landlord says the tenant caused the problem. Both agree that the property is in the selected jurisdiction, but neither has provided photographs or an inspection report.',question:'What facts and legal obligations should be examined before drawing a conclusion?',witness_name:'Property manager',witness_background:'The person responsible for maintenance requests.'}
];
let caseIndex=0;
async function api(action,payload){
 if(action==='case'){
   const base=DEMO_CASES[caseIndex++%DEMO_CASES.length];
   return {...base,jurisdiction:payload.jurisdiction,category:payload.category,difficulty:payload.difficulty,mode:payload.mode};
 }
 if(action==='witness'){
   const q=String(payload.question||'').toLowerCase();
   let reply='I can only explain what I personally observed. I do not know every relevant fact.';
   if(q.includes('when')||q.includes('time'))reply='I remember the general sequence of events, but I do not have an exact time in front of me.';
   else if(q.includes('permission')||q.includes('consent'))reply='I cannot confirm that explicit permission was given. You would need to check the relevant records.';
   else if(q.includes('why')||q.includes('reason'))reply='I acted on the information available to me at the time, but I understand that details could affect the evaluation.';
   return {reply};
 }
 if(action==='grade'){
   // This is a transparent practice heuristic, NOT an AI assessment of legal accuracy.
   const words=String(payload.argument||'').trim().split(/\s+/).length;
   const mentionsUncertainty=/however|although|depends|uncertain|missing|more facts|on the other hand|could|might/i.test(payload.argument);
   const mentionsRule=/rule|law|amendment|rights|privacy|evidence|consent|permission|agreement|copyright|reasonable/i.test(payload.argument);
   const score=Math.min(85,Math.max(35,35+Math.min(25,Math.floor(words/3))+(mentionsUncertainty?15:0)+(mentionsRule?10:0)));
   return {score,feedback:'DEMO PRACTICE SCORE ONLY: Your response was reviewed with a simple completeness checklist, not a legal reasoning model. Consider both sides and identify unknown facts.',strength:'You completed a written response to the fictional case.',improvement:'Identify a relevant legal rule, explain how each known fact relates to it, and say which missing facts could change the outcome.'};
 }
 throw Error('Unknown demo action');
}
async function task(run){if(busy)return;busy=true;notice.textContent='[ WORKING ] CONTACTING AI...';
document.querySelectorAll('main button').forEach(b=>b.disabled=true);
try{await run();notice.textContent='[ OK ] READY'}catch(e){notice.textContent='[ ERROR ] '+e.message;const box=el('error');if(box)box.textContent='[ ERROR ] '+e.message}
finally{busy=false;document.querySelectorAll('main button').forEach(b=>b.disabled=false);
if(el('argument')&&el('argument').disabled&&el('submit'))el('submit').disabled=true}}
function play(){currentCase=null;transcript=[];
main.innerHTML=header(mode==='courtroom'?'COURTROOM SIMULATOR':'SCENARIO CHALLENGE',
'OFFLINE FICTIONAL PRACTICE // NO LIVE AI')+
'<section class="panel"><div class="grid"><div><label for="jurisdiction">JURISDICTION</label><select id="jurisdiction">'+
['North Carolina','Federal (U.S.)','South Carolina','California','New York'].map(x=>'<option>'+x+'</option>').join('')+'</select></div>'+
'<div><label for="category">LEGAL CATEGORY</label><select id="category">'+
['Constitutional Law','Criminal Law','Cyber Law','Civil Law','Business Law'].map(x=>'<option>'+x+'</option>').join('')+'</select></div>'+
'<div><label for="difficulty">DIFFICULTY</label><select id="difficulty">'+
['Easy','Medium','Hard','Expert'].map(x=>'<option'+(x==='Medium'?' selected':'')+'>'+x+'</option>').join('')+'</select></div></div>'+
'<button id="generate" class="action">GENERATE NEW CASE</button><p id="error" class="alert"></p></section><div id="casearea"></div>';
el('generate').onclick=()=>task(async()=>{const c=await api('case',{mode,jurisdiction:el('jurisdiction').value,category:el('category').value,difficulty:el('difficulty').value});currentCase=c;transcript=[];showCase();speak(c.title+'. '+c.facts+'. '+c.question)})}
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
'<button id="submit" class="action">'+(isCourt?'PRESENT ARGUMENT TO JUDGE':'SUBMIT FOR PRACTICE FEEDBACK')+'</button>'+
'<p id="error" class="alert"></p><div id="result" class="result"></div></section>';
el('replay').onclick=()=>speak(lastSpeech);el('stopspeech').onclick=stopVoice;
if(isCourt)el('ask').onclick=()=>task(async()=>{const question=el('question').value.trim();if(question.length<5)throw Error('Please ask a full question');if(transcript.length>=12)throw Error('Six-question limit reached');
const x=await api('witness',{case:currentCase,transcript,question});transcript.push({role:'player',text:question},{role:'witness',text:x.reply});
el('transcript').textContent+='\n\nYOU: '+question+'\nWITNESS: '+x.reply;el('question').value='';speak(x.reply)});
el('submit').onclick=()=>task(async()=>{const argument=el('argument').value.trim();if(argument.length<25)throw Error('Write at least 25 characters of reasoning');
const x=await api('grade',{case:currentCase,transcript,argument});const xp=Math.max(5,Math.floor(x.score/5));
el('result').textContent='DEMO CHECKLIST SCORE: '+x.score+'/100 | +'+xp+' XP\n\nPRACTICE FEEDBACK: '+x.feedback+'\n\nSTRENGTH: '+x.strength+'\n\nTO IMPROVE: '+x.improvement;
el('argument').disabled=true;addData({title:c.title,mode,date:new Date().toLocaleString(),score:x.score,xp,argument,feedback:x.feedback+'\n'+x.improvement});
speak('Your score is '+x.score+' out of one hundred. '+x.feedback+' '+x.improvement)})}
page('home');
