/**
 * LegalMind API gateway for Cloudflare Workers.
 * BYOK: OpenAI keys are forwarded per request; never persisted or logged.
 * Deploy YOUR OWN Worker and use its HTTPS URL in LegalMind Settings.
 */
const ALLOWED_ORIGIN = "https://dallasssswd.github.io";
const MODEL = "gpt-4.1-mini";
const JURISDICTIONS = new Set(["North Carolina","Federal (U.S.)","South Carolina","California","New York"]);
const CATEGORIES = new Set(["Constitutional Law","Criminal Law","Cyber Law","Civil Law","Business Law"]);
const DIFFICULTIES = new Set(["Easy","Medium","Hard","Expert"]);
const GUIDANCE = "You are LegalMind, an educational legal reasoning game for teenagers. Generate fictional non-graphic scenarios suitable for minors. Never provide real legal advice. Do not invent statutes, quotes, case citations, or guarantee outcomes. State uncertainty and legal jurisdiction differences. Return only the JSON object requested.";

function respond(value, status=200, origin=ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(value), {status, headers:{
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "Access-Control-Allow-Origin": origin,
    "Vary":"Origin",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"no-referrer"
  }});
}
function required(obj,key,max=2000){
  const value=obj?.[key];
  if(typeof value!=="string" || !value.trim()) throw new Error("Missing "+key);
  return value.trim().slice(0,max);
}
function cleanCase(obj){
  const names=["title","facts","question","jurisdiction","category","difficulty","mode","witness_name","witness_background"];
  const result={};
  for(const name of names)result[name]=typeof obj?.[name]==="string"?obj[name].slice(0,2500):"";
  return result;
}
async function requestOpenAI(key,prompt){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),30000);
  let upstream;
  try{
    upstream=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",signal:controller.signal,headers:{
        "Authorization":"Bearer "+key,"Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:MODEL, instructions:GUIDANCE, input:prompt,
        text:{format:{type:"json_object"}}, store:false, max_output_tokens:1300
      })
    });
    if(!upstream.ok){
      if(upstream.status===401||upstream.status===403)throw new Error("OpenAI rejected that API key.");
      if(upstream.status===429)throw new Error("OpenAI rate or usage limit reached.");
      throw new Error("OpenAI request failed (HTTP "+upstream.status+"). Check model access and billing.");
    }
    const envelope=await upstream.json();
    const raw=(envelope.output||[]).flatMap(item=>item.content||[]).filter(item=>item.type==="output_text").map(item=>item.text||"").join("");
    const data=JSON.parse(raw);
    if(!data||typeof data!=="object"||Array.isArray(data))throw new Error("AI response was invalid. Try again.");
    return data;
  }finally{clearTimeout(timeout)}
}
async function handleAction(action,data){
  const key=data.api_key;
  if(typeof key!=="string"||!key.startsWith("sk-")||key.length>512)throw new Error("Enter a valid OpenAI API key in Settings.");
  if(action==="case"){
    const jurisdiction=required(data,"jurisdiction",80),category=required(data,"category",80),
          difficulty=required(data,"difficulty",30),mode=required(data,"mode",20);
    if(!JURISDICTIONS.has(jurisdiction)||!CATEGORIES.has(category)||!DIFFICULTIES.has(difficulty)||!["scenario","courtroom"].includes(mode))throw new Error("Invalid game settings.");
    const prompt="Create ONE "+difficulty+" fictional "+category+" case in "+jurisdiction+". "+(mode==="courtroom"?"Include one fictional witness who can be questioned. ":"")+
      "Write 90-150 words of facts, one legal issue question, and no solution. Return JSON string fields: title, facts, question, witness_name, witness_background.";
    const output=await requestOpenAI(key,prompt);
    return {title:required(output,"title",120),facts:required(output,"facts",2500),
      question:required(output,"question",500),witness_name:String(output.witness_name||"").slice(0,100),
      witness_background:String(output.witness_background||"").slice(0,600),
      jurisdiction,category,difficulty,mode};
  }
  if(!["witness","grade"].includes(action))throw new Error("Unknown action.");
  if(!data.case||typeof data.case!=="object"||Array.isArray(data.case))throw new Error("Missing case.");
  const gameCase=cleanCase(data.case);
  if(!Array.isArray(data.transcript))throw new Error("Invalid transcript.");
  const transcript=data.transcript.slice(-12).filter(x=>x&&typeof x==="object").map(x=>({
    role:String(x.role||"").slice(0,20),text:String(x.text||"").slice(0,650)
  }));
  if(action==="witness"){
    const question=required(data,"question",650);
    if(question.length<5)throw new Error("Ask a full question.");
    const answer=await requestOpenAI(key,
      "Act as a fictional courtroom witness in the provided case. Answer concisely, staying consistent with established facts. Do not invent decisive evidence. Return JSON with string key reply. Context: "+
      JSON.stringify({case:gameCase,transcript,question}));
    return {reply:required(answer,"reply",800)};
  }
  const argument=required(data,"argument",5000);
  if(argument.length<25)throw new Error("Write a longer argument before submitting.");
  const answer=await requestOpenAI(key,
    "Assess the student's argument for issue spotting, reasoning, balanced consideration of uncertainty. Do not invent citations or pretend to verify current law. Return JSON keys score (integer 0-100), feedback (2-4 sentences), strength (one sentence), improvement (one sentence). Context: "+
    JSON.stringify({case:gameCase,transcript,argument}));
  const score=Number(answer.score);
  if(!Number.isInteger(score)||score<0||score>100)throw new Error("AI returned an invalid score.");
  return {score,feedback:required(answer,"feedback",1500),
          strength:required(answer,"strength",700),improvement:required(answer,"improvement",700)};
}
export default {
 async fetch(request){
   const origin=request.headers.get("Origin");
   const url=new URL(request.url);
   if(request.method==="OPTIONS"){
     if(origin!==ALLOWED_ORIGIN)return respond({error:"Origin not allowed"},403);
     return new Response(null,{status:204,headers:{
       "Access-Control-Allow-Origin":ALLOWED_ORIGIN,"Access-Control-Allow-Methods":"POST, GET, OPTIONS",
       "Access-Control-Allow-Headers":"Content-Type","Access-Control-Max-Age":"600","Vary":"Origin"
     }});
   }
   if(request.method==="GET"&&url.pathname==="/health")return respond({ok:true,service:"LegalMind API gateway"});
   if(origin!==ALLOWED_ORIGIN)return respond({error:"Origin not allowed"},403);
   if(request.method!=="POST"||!["/api/case","/api/witness","/api/grade"].includes(url.pathname))return respond({error:"Not found"},404);
   if(!(request.headers.get("Content-Type")||"").startsWith("application/json"))return respond({error:"Expected JSON"},415);
   if(Number(request.headers.get("Content-Length")||0)>18000)return respond({error:"Request too large"},413);
   let data;
   try{data=await request.text();if(data.length>18000)return respond({error:"Request too large"},413);data=JSON.parse(data)}
   catch{return respond({error:"Invalid JSON"},400)}
   try{return respond(await handleAction(url.pathname.split("/")[2],data))}
   catch(err){return respond({error:err?.message||"Request failed"},400)}
 }
};
