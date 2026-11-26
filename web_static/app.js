'use strict';
// Key is intentionally only in this page's memory, never browser storage.
let apiKey='',voice=true,lastSpeech='',currentCase=null,transcript=[],mode='scenario',busy=false;
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
function home(){const x=stats();main.innerHTML=header('LEGALMIND','WEB-BASED LEGAL SIMULATION SYSTEM // v0.5')+
'<div class="panel"><p>[ OK ] SYSTEM INITIALIZED</p><h2>WELCOME, COUNSEL</h2>'+
'<p>RANK: '+escapeHTML(x.rank)+' | XP: '+x.xp+' | CASES: '+x.cases+'</p>'+
'<p>Generate fictional cases, question witnesses and present legal arguments to an AI judge.</p>'+
'<button id="start">> BEGIN SCENARIO</button></div>';el('start').onclick=()=>page('scenario')}
function settings(){main.innerHTML=header('SETTINGS','SESSION-ONLY KEY • FREE BROWSER VOICE')+
'<section class="panel"><h2>OPENAI API KEY</h2><p>Key stays in this page’s temporary memory, not browser storage or the server database.</p>'+
'<label for="key">API KEY (MASKED)</label><input id="key" type="password" autocomplete="off" spellcheck="false" maxlength="512" placeholder="sk-...">'+
'<div class="row"><button id="usekey">USE KEY FOR THIS SESSION</button><button id="forget">FORGET KEY</button></div>'+
'<p id="keymsg">'+(apiKey?'[ READY ] Session key entered':'[ OFFLINE ] Enter a new key')+'</p></section>'+
'<section class="panel"><h2>TEXT-TO-SPEECH</h2><p>Free voices from your browser and operating system.</p>'+
'<button id="togglevoice">'+(voice?'MUTE VOICE':'ENABLE VOICE')+'</button> '+
'<button id="testvoice">TEST VOICE</button> <button id="stopvoice">STOP SPEAKING</button></section>'+
'<p class="tiny">Use only on localhost or a trusted HTTPS site. Your API key is sent to the local backend for every AI request and then to OpenAI. API usage can cost money; voice playback is free. Revoke any previously exposed API key.</p>';
el('usekey').onclick=()=>{const s=el('key').value.trim();if(!s.startsWith('sk-')){el('keymsg').textContent='[ ERROR ] Enter a valid-looking API key';return}apiKey=s;el('key').value='';el('keymsg').textContent='[ READY ] Key entered for this tab until refresh/close';el('online').textContent='● KEY READY'};
el('forget').onclick=()=>{apiKey='';el('key').value='';el('keymsg').textContent='[ CLEARED ] Key discarded';el('online').textContent='● OFFLINE'};
el('togglevoice').onclick=()=>{voice=!voice;stopVoice();el('togglevoice').textContent=voice?'MUTE VOICE':'ENABLE VOICE'};
el('testvoice').onclick=()=>speak('LegalMind web narration is ready.');
el('stopvoice').onclick=stopVoice}
function career(){const x=stats();main.innerHTML=header('CAREER','PLAYER DOSSIER')+
'<section class="panel"><h2>'+escapeHTML(x.rank)+'</h2><p>XP: '+x.xp+'<br>Cases completed: '+x.cases+'</p>'+
'<p>Law Student → Attorney at 150 XP → Senior Attorney at 500 XP.</p></section>'}
function archives(){const entries=getData();main.innerHTML=header('CASE ARCHIVES','Saved in this browser, not shared with the Windows app')+
(entries.length?entries.map(x=>'<section class="panel"><h2>'+escapeHTML(x.title)+'</h2><p>'+escapeHTML(x.date)+' • '+escapeHTML(x.mode)+' • '+Number(x.score)+'/100 • +'+Number(x.xp)+' XP</p>'+
'<p>YOUR ARGUMENT</p><p class="casefacts">'+escapeHTML(x.argument)+'</p><p>AI FEEDBACK</p><p class="casefacts">'+escapeHTML(x.feedback)+'</p></section>').join(''):'<p>[ EMPTY ] No completed cases yet.</p>')}
async function api(action,payload){if(!apiKey)throw Error('Open Settings and enter your API key first.');const response=await fetch('/api/'+action,{
method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
body:JSON.stringify({...payload,api_key:apiKey})});let data;try{data=await response.json()}catch{throw Error('Invalid response from server')}
if(!response.ok)throw Error(data.error||'API request failed');return data}
async function task(run){if(busy)return;busy=true;notice.textContent='[ WORKING ] CONTACTING AI...';
document.querySelectorAll('main button').forEach(b=>b.disabled=true);
try{await run();notice.textContent='[ OK ] READY'}catch(e){notice.textContent='[ ERROR ] '+e.message;const box=el('error');if(box)box.textContent='[ ERROR ] '+e.message}
finally{busy=false;document.querySelectorAll('main button').forEach(b=>b.disabled=false);
if(el('argument')&&el('argument').disabled&&el('submit'))el('submit').disabled=true}}
function play(){currentCase=null;transcript=[];
main.innerHTML=header(mode==='courtroom'?'COURTROOM SIMULATOR':'SCENARIO CHALLENGE',
'AI-GENERATED FICTIONAL LEGAL EDUCATION')+
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
'<button id="submit" class="action">'+(isCourt?'PRESENT ARGUMENT TO JUDGE':'SUBMIT FOR AI GRADING')+'</button>'+
'<p id="error" class="alert"></p><div id="result" class="result"></div></section>';
el('replay').onclick=()=>speak(lastSpeech);el('stopspeech').onclick=stopVoice;
if(isCourt)el('ask').onclick=()=>task(async()=>{const question=el('question').value.trim();if(question.length<5)throw Error('Please ask a full question');if(transcript.length>=12)throw Error('Six-question limit reached');
const x=await api('witness',{case:currentCase,transcript,question});transcript.push({role:'player',text:question},{role:'witness',text:x.reply});
el('transcript').textContent+='\n\nYOU: '+question+'\nWITNESS: '+x.reply;el('question').value='';speak(x.reply)});
el('submit').onclick=()=>task(async()=>{const argument=el('argument').value.trim();if(argument.length<25)throw Error('Write at least 25 characters of reasoning');
const x=await api('grade',{case:currentCase,transcript,argument});const xp=Math.max(5,Math.floor(x.score/5));
el('result').textContent='SCORE: '+x.score+'/100 | +'+xp+' XP\n\nJUDGE FEEDBACK: '+x.feedback+'\n\nSTRENGTH: '+x.strength+'\n\nTO IMPROVE: '+x.improvement;
el('argument').disabled=true;addData({title:c.title,mode,date:new Date().toLocaleString(),score:x.score,xp,argument,feedback:x.feedback+'\n'+x.improvement});
speak('Your score is '+x.score+' out of one hundred. '+x.feedback+' '+x.improvement)})}
page('home');
