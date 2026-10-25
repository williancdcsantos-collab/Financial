import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,collection,doc,onSnapshot,setDoc,updateDoc,deleteDoc,writeBatch,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

var firebaseConfig={
  apiKey:"AIzaSyBdtEhF81Supt_dgT87V7VCKuCa-gKv8NM",
  authDomain:"take-b3f29.firebaseapp.com",
  projectId:"take-b3f29",
  storageBucket:"take-b3f29.firebasestorage.app",
  messagingSenderId:"1045120414080",
  appId:"1:1045120414080:web:cc33ba7ec910481f045165"
};
var ME="williamcdc.santos@gmail.com";
var fb=initializeApp(firebaseConfig),auth=getAuth(fb),db=getFirestore(fb);
var DEF={d:["Moradia","Mercado","Transporte","Alimentação fora","Saúde","Lazer","Estudos","Contas","Outros"],r:["Salário","Extra","Investimentos","Outros"]};
var S={pronto:false,user:false,p:"mes",ref:ymd(new Date()),view:"home",show:false,e:[],cats:{d:DEF.d.slice(),r:DEF.r.slice()},cards:[],m:null,erro:""};
var app=document.getElementById("app"),unE=null,unC=null,unK=null;
try{S.show=localStorage.getItem("finshow")==="1"}catch(x){}
if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(function(){})}
function p2(n){return String(n).padStart(2,"0")}
function ymd(d){return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate())}
function pd(s){return new Date(s+"T00:00:00")}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function brl(v){return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function val(v){return S.show?brl(v):"•••"}
function salvaCats(){setDoc(doc(db,"fin_config","cats"),S.cats).catch(function(){})}
function salvaCards(){setDoc(doc(db,"fin_config","cartoes"),{lista:S.cards}).catch(function(){})}

onAuthStateChanged(auth,function(u){
 if(unE){unE();unE=null}if(unC){unC();unC=null}if(unK){unK();unK=null}
 var em=u&&u.email?u.email.toLowerCase():null;
 if(em===ME){
  S.user=true;
  unE=onSnapshot(collection(db,"fin_lancamentos"),function(s){
   S.e=s.docs.map(function(d){var o=d.data();o.id=d.id;return o});S.erro="";if(!S.m)render();
  },function(){S.erro="Não foi possível carregar. Confira a conexão e as regras do banco.";render()});
  unC=onSnapshot(doc(db,"fin_config","cats"),function(s){
   if(s.exists()){var c=s.data();S.cats={d:c.d||DEF.d.slice(),r:c.r||DEF.r.slice()}}
   if(!S.m)render();
  },function(){});
  unK=onSnapshot(doc(db,"fin_config","cartoes"),function(s){
   S.cards=s.exists()?(s.data().lista||[]):[];
   if(!S.m)render();
  },function(){});
 }else{S.user=false;S.e=[];if(u)signOut(auth)}
 S.pronto=true;render();
});

function range(){
 var d=pd(S.ref),a,b;
 if(S.p==="dia"){a=b=d}
 else if(S.p==="semana"){a=new Date(d);a.setDate(d.getDate()-((d.getDay()+6)%7));b=new Date(a);b.setDate(a.getDate()+6)}
 else if(S.p==="mes"){a=new Date(d.getFullYear(),d.getMonth(),1);b=new Date(d.getFullYear(),d.getMonth()+1,0)}
 else{a=new Date(d.getFullYear(),0,1);b=new Date(d.getFullYear(),11,31)}
 return [a,b];
}
function shift(k){
 var d=pd(S.ref);
 if(S.p==="dia")d.setDate(d.getDate()+k);
 else if(S.p==="semana")d.setDate(d.getDate()+7*k);
 else if(S.p==="mes"){d.setDate(1);d.setMonth(d.getMonth()+k)}
 else d.setFullYear(d.getFullYear()+k);
 S.ref=ymd(d);
}
function label(){
 var r=range(),a=r[0],b=r[1];
 if(S.p==="dia")return a.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
 if(S.p==="semana")return p2(a.getDate())+"/"+p2(a.getMonth()+1)+" a "+p2(b.getDate())+"/"+p2(b.getMonth()+1);
 if(S.p==="mes")return a.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
 return String(a.getFullYear());
}
function lista(){var r=range(),a=ymd(r[0]),b=ymd(r[1]);return S.e.filter(function(x){return x.data>=a&&x.data<=b})}
function sum(l,t){return l.filter(function(x){return x.t===t}).reduce(function(s,x){return s+x.v},0)}
function dueDate(compra,c){
 var d=pd(compra),y=d.getFullYear(),m=d.getMonth(),dia=d.getDate(),vm;
 if(c.fecha){var cm=dia<=c.fecha?m:m+1;vm=c.vence>c.fecha?cm:cm+1}
 else vm=dia<=c.vence?m:m+1;
 var ult=new Date(y,vm+1,0).getDate();
 return ymd(new Date(y,vm,Math.min(c.vence,ult)));
}
var COR=["#d2563f","#2f4fd1","#e0a21b","#1f9d6b","#8e5bd6","#16a5b8","#e06aa0","#7a8699","#9aab3d","#c4733a"];
function mesAbr(d){return d.toLocaleDateString("pt-BR",{month:"short"}).replace(".","")}
function head(){
 var h='<div class="row sp"><h1>Finanças</h1><div class="row"><button data-act="eye">'+(S.show?"Ocultar valores":"Ver valores")+'</button><button data-act="sair">Sair</button></div></div>';
 h+='<div class="seg">'+[["home","Balanço"],["lanc","Lançamentos"],["fut","Futuro"],["aj","Ajustes"]].map(function(t){return '<button data-act="view" data-v="'+t[0]+'" class="'+(S.view===t[0]?"on":"")+'">'+t[1]+'</button>'}).join("")+'</div>';
 if(S.erro)h+='<p class="err">'+esc(S.erro)+'</p>';
 if(S.view==="aj"||S.view==="fut")return h;
 h+='<div class="seg" style="margin-top:0">'+[["dia","Dia"],["semana","Semana"],["mes","Mês"],["ano","Ano"]].map(function(t){return '<button data-act="per" data-v="'+t[0]+'" class="'+(S.p===t[0]?"on":"")+'">'+t[1]+'</button>'}).join("")+'</div>';
 return h+'<div class="row nav"><button data-act="nav" data-v="-1" aria-label="Anterior">‹</button><b>'+esc(label())+'</b><button data-act="nav" data-v="1" aria-label="Próximo">›</button></div>';
}
function graficoPeriodo(l){
 if(S.p==="dia"||!l.length)return "";
 var r=range(),n=S.p==="semana"?7:S.p==="mes"?r[1].getDate():12,rr=[],dd=[],i;
 for(i=0;i<n;i++){rr.push(0);dd.push(0)}
 l.forEach(function(x){var dt=pd(x.data),k=S.p==="semana"?Math.round((dt-r[0])/864e5):S.p==="mes"?dt.getDate()-1:dt.getMonth();(x.t==="r"?rr:dd)[k]+=x.v});
 var m=Math.max.apply(null,rr.concat(dd).concat([1])),lb=S.p==="semana"?["S","T","Q","Q","S","S","D"]:"JFMAMJJASOND".split(""),h='<div class="chart">';
 for(i=0;i<n;i++){
  var t=S.p==="mes"?((i%5===0)?i+1:""):lb[i];
  h+='<div class="col"><div class="pair"><i style="height:'+rr[i]/m*100+'%;background:var(--rec)"></i><i style="height:'+dd[i]/m*100+'%;background:var(--des)"></i></div><span>'+t+'</span></div>';
 }
 return h+'</div><div class="lbl" style="margin-top:8px"><span style="color:var(--rec)">■ Entradas</span><span style="color:var(--des)">■ Saídas</span></div>';
}
function rosca(l,vis){
 var D=sum(l,"d"),by={};
 l.filter(function(x){return x.t==="d"}).forEach(function(x){by[x.cat]=(by[x.cat]||0)+x.v});
 var ks=Object.keys(by).sort(function(a,b){return by[b]-by[a]});
 if(!ks.length||!D)return "";
 var acc=0,svg='<svg viewBox="0 0 42 42" width="180" height="180" role="img" aria-label="Despesas por categoria"><circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--line)" stroke-width="6"></circle>';
 ks.forEach(function(k,i){var p=by[k]/D*100;svg+='<circle cx="21" cy="21" r="15.9155" fill="none" stroke="'+COR[i%COR.length]+'" stroke-width="6" stroke-dasharray="'+p+' '+(100-p)+'" stroke-dashoffset="'+(25-acc)+'"></circle>';acc+=p});
 svg+='<text x="21" y="20.5" text-anchor="middle" font-size="3.2" fill="var(--muted)">Saídas</text>'+(vis?'<text x="21" y="25" text-anchor="middle" font-size="3.4" font-weight="700" fill="var(--ink)">'+brl(D)+'</text>':'')+'</svg>';
 var h='<div style="display:flex;justify-content:center;margin-bottom:12px">'+svg+'</div>';
 ks.forEach(function(k,i){h+='<div class="lbl" style="margin:6px 0"><span style="color:var(--ink)"><i style="display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:8px;background:'+COR[i%COR.length]+'"></i>'+esc(k)+'</span><span>'+Math.round(by[k]/D*100)+'%'+(vis?" · "+brl(by[k]):"")+'</span></div>'});
 return h;
}
function home(){
 var l=lista(),R=sum(l,"r"),D=sum(l,"d"),h="";
 var v,cor="var(--ink)",sd=R-D;
 if(!l.length){v="Nenhum lançamento neste período."}
 else if(!R){v="Só houve saída neste período.";cor="var(--des)"}
 else if(sd>=0){v="Sobrou "+Math.round(sd/R*100)+"% do que entrou.";cor="var(--rec)"}
 else{v="Saiu "+Math.round(-sd/R*100)+"% a mais do que entrou.";cor="var(--des)"}
 var mx=Math.max(R,D,1);
 h+='<div class="card"><div class="verd" style="color:'+cor+'">'+v+'</div>';
 h+='<div class="lbl"><span>Entrou</span><span>'+val(R)+'</span></div><div class="bar"><i style="width:'+R/mx*100+'%;background:var(--rec)"></i></div>';
 h+='<div class="lbl"><span>Saiu</span><span>'+val(D)+'</span></div><div class="bar"><i style="width:'+D/mx*100+'%;background:var(--des)"></i></div>';
 h+='<div class="lbl"><b>Saldo</b><b style="color:'+(sd<0?"var(--des)":"var(--rec)")+'">'+val(sd)+'</b></div></div>';
 var g=graficoPeriodo(l);
 if(g)h+='<div class="card"><h3>Ao longo do período</h3>'+g+'</div>';
 var ro=rosca(l,S.show);
 if(ro)h+='<div class="card"><h3>Para onde foi o dinheiro</h3>'+ro+'</div>';
 return h+'<button style="width:100%" data-act="rel">Resumo em PDF</button>';
}
function lanc(){
 var l=lista().sort(function(a,b){return b.data.localeCompare(a.data)});
 if(!l.length)return '<div class="empty">Nenhum lançamento neste período.</div>';
 var h='<div class="card">';
 l.forEach(function(x){
  var dt=pd(x.data).toLocaleDateString("pt-BR",{day:"numeric",month:"short"});
  var ex=x.cartao?" · "+esc(x.cartao)+(x.compra&&x.compra!==x.data?" (compra "+pd(x.compra).toLocaleDateString("pt-BR",{day:"numeric",month:"short"})+")":""):"";
  h+='<div class="item"><div><b>'+esc(x.titulo)+'</b><small>'+esc(x.cat)+" · "+dt+ex+'</small></div><div class="row"><b style="color:'+(x.t==="r"?"var(--rec)":"var(--des)")+'">'+(x.t==="r"?"+":"−")+val(x.v)+'</b><button class="x" data-act="elanc" data-id="'+x.id+'" aria-label="Editar">✎</button><button class="x" data-act="del" data-id="'+x.id+'" aria-label="Excluir">✕</button></div></div>';
 });
 return h+'</div><button style="width:100%" data-act="rel">Resumo em PDF</button>';
}
function ajustes(){
 var h='<div class="card"><h3>Cartões de crédito</h3>';
 if(!S.cards.length)h+='<p class="dica" style="margin:0 0 10px">Nenhum cartão cadastrado.</p>';
 S.cards.forEach(function(c){h+='<div class="item"><div><b>'+esc(c.nome)+'</b><small>'+(c.fecha?"fecha dia "+c.fecha+" · ":"")+"vence dia "+c.vence+'</small></div><div class="row"><button class="x" data-act="ecard" data-id="'+c.id+'" aria-label="Editar">✎</button><button class="x" data-act="dcard" data-id="'+c.id+'" aria-label="Excluir">✕</button></div></div>'});
 h+='<button style="width:100%;margin-top:10px" data-act="ncard">+ Novo cartão</button></div>';
 [["d","Categorias de despesa"],["r","Categorias de receita"]].forEach(function(g){
  h+='<div class="card"><h3>'+g[1]+'</h3>';
  S.cats[g[0]].forEach(function(c){h+='<div class="item"><b>'+esc(c)+'</b><div class="row"><button class="x" data-act="ecat" data-t="'+g[0]+'" data-v="'+esc(c)+'" aria-label="Renomear">✎</button><button class="x" data-act="dcat" data-t="'+g[0]+'" data-v="'+esc(c)+'" aria-label="Excluir">✕</button></div></div>'});
  h+='</div>';
 });
 return h;
}
function mesesFuturos(n){
 var t=new Date(),r=[],i;
 for(i=0;i<n;i++){
  var a=new Date(t.getFullYear(),t.getMonth()+i,1),b=new Date(t.getFullYear(),t.getMonth()+i+1,0);
  r.push({a:ymd(a),b:ymd(b),l:mesAbr(a)});
 }
 return r;
}
function noMes(m,f){return S.e.filter(function(x){return x.data>=m.a&&x.data<=m.b&&(!f||f(x))})}
function futuro(){
 var N=S.proj||6,ms=mesesFuturos(N),h="";
 h+='<div class="seg"><button data-act="proj" data-v="3" class="'+(N===3?"on":"")+'">3 meses</button><button data-act="proj" data-v="6" class="'+(N===6?"on":"")+'">6 meses</button></div>';
 var R=[],D=[],ac=[],s=0;
 ms.forEach(function(m){var l=noMes(m),r=sum(l,"r"),d=sum(l,"d");R.push(r);D.push(d);s+=r-d;ac.push(s)});
 var mx=Math.max.apply(null,R.concat(D).concat([1]));
 h+='<div class="card"><h3>Projeção de saldo</h3><div class="chart">';
 ms.forEach(function(m,i){h+='<div class="col"><div class="pair"><i style="height:'+R[i]/mx*100+'%;background:var(--rec)"></i><i style="height:'+D[i]/mx*100+'%;background:var(--des)"></i></div><span>'+m.l+'</span></div>'});
 h+='</div><div class="lbl" style="margin:8px 0"><span style="color:var(--rec)">■ Entradas</span><span style="color:var(--des)">■ Saídas</span></div>';
 ms.forEach(function(m,i){
  var sd=R[i]-D[i];
  h+='<div class="item"><div><b style="text-transform:capitalize">'+m.l+'</b><small>'+(R[i]||D[i]?(sd>=0?"fecha no azul":"fecha no vermelho"):"sem lançamentos")+'</small></div><div style="text-align:right"><b style="color:'+(ac[i]<0?"var(--des)":"var(--rec)")+'">'+val(ac[i])+'</b><small>acumulado</small></div></div>';
 });
 h+='<p class="dica">O acumulado soma as entradas e saídas lançadas a partir deste mês. Não inclui saldo que você já tenha em conta.</p></div>';
 h+='<div class="card"><h3>Faturas por cartão</h3>';
 if(!S.cards.length)h+='<p class="dica" style="margin:0">Nenhum cartão cadastrado.</p>';
 var vals=S.cards.map(function(c){return ms.map(function(m){return sum(noMes(m,function(x){return x.cartao===c.nome}),"d")})});
 var gm=Math.max.apply(null,[].concat.apply([],vals).concat([1]));
 S.cards.forEach(function(c,ci){
  h+='<div style="margin-bottom:16px"><div class="lbl" style="margin-bottom:6px"><b style="color:var(--ink)">'+esc(c.nome)+'</b><span>vence dia '+c.vence+'</span></div><div class="chart" style="height:80px">';
  ms.forEach(function(m,i){h+='<div class="col"><div class="pair" style="height:60px"><i style="height:'+vals[ci][i]/gm*100+'%;background:'+COR[ci%COR.length]+';max-width:22px"></i></div><span>'+m.l+'</span></div>'});
  h+='</div>'+(S.show?'<div class="lbl">'+vals[ci].map(function(v){return '<span>'+brl(v)+'</span>'}).join("")+'</div>':"")+'</div>';
 });
 h+='</div>';
 var comp=ms.map(function(m){return sum(noMes(m,function(x){return x.t==="d"&&(x.pg==="p"||x.pg==="c"||x.fixo)}),"d")});
 var cm=Math.max.apply(null,comp.concat([1]));
 h+='<div class="card"><h3>Já comprometido (parcelas, cartão e fixos)</h3><div class="chart" style="height:100px">';
 ms.forEach(function(m,i){h+='<div class="col"><div class="pair" style="height:80px"><i style="height:'+comp[i]/cm*100+'%;background:var(--des);max-width:22px"></i></div><span>'+m.l+'</span></div>'});
 h+='</div>'+(S.show?'<div class="lbl">'+comp.map(function(v){return '<span>'+brl(v)+'</span>'}).join("")+'</div>':"")+'</div>';
 return h;
}
function injetaEstilo(){
 if(document.getElementById("est-rel"))return;
 var s=document.createElement("style");
 s.id="est-rel";
 s.textContent="@media print{:root{--bg:#fff;--surface:#fff;--ink:#111;--muted:#555;--line:#ccc;--rec:#157a52;--des:#b8402b;color-scheme:light}body{background:#fff!important}main{padding:0!important;max-width:none!important}.noprint{display:none!important}.pb{break-before:page}.card{break-inside:avoid}}.tb{width:100%;border-collapse:collapse;font-size:.8rem}.tb th,.tb td{padding:5px 4px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.tb .n{text-align:right;white-space:nowrap}";
 document.head.appendChild(s);
}
function relatorio(){
 injetaEstilo();
 var l=lista().sort(function(a,b){return a.data.localeCompare(b.data)}),R=sum(l,"r"),D=sum(l,"d"),ac=0;
 var h='<div class="row sp noprint"><button data-act="relvolta">‹ Voltar</button><button class="pri" data-act="print">Imprimir / salvar PDF</button></div>';
 h+='<h1 style="margin-top:16px">Resumo financeiro</h1><p class="dica" style="text-transform:capitalize">'+esc(label())+'</p>';
 h+='<div class="card"><div class="lbl"><span>Entrou</span><b style="color:var(--rec)">'+brl(R)+'</b></div><div class="lbl"><span>Saiu</span><b style="color:var(--des)">'+brl(D)+'</b></div><div class="lbl"><b>Saldo</b><b>'+brl(R-D)+'</b></div></div>';
 h+='<h3>Fluxo de caixa</h3>';
 if(!l.length)h+='<p class="dica">Nenhum lançamento neste período.</p>';
 else{
  h+='<table class="tb"><tr><th>Data</th><th>Descrição</th><th class="n">Entrada</th><th class="n">Saída</th><th class="n">Saldo</th></tr>';
  l.forEach(function(x){
   ac+=x.t==="r"?x.v:-x.v;
   h+='<tr><td>'+pd(x.data).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})+'</td><td>'+esc(x.titulo)+'<br><span class="dica" style="margin:0">'+esc(x.cat)+(x.cartao?" · "+esc(x.cartao):"")+'</span></td><td class="n">'+(x.t==="r"?brl(x.v):"")+'</td><td class="n">'+(x.t==="d"?brl(x.v):"")+'</td><td class="n" style="color:'+(ac<0?"var(--des)":"var(--ink)")+'">'+brl(ac)+'</td></tr>';
  });
  h+='</table>';
 }
 h+='<div class="pb"></div><h3 style="margin-top:24px">Gráficos</h3>';
 var g=graficoPeriodo(l),ro=rosca(l,true);
 if(g)h+='<div class="card"><h3>Ao longo do período</h3>'+g+'</div>';
 if(ro)h+='<div class="card"><h3>Para onde foi o dinheiro</h3>'+ro+'</div>';
 if(!g&&!ro)h+='<p class="dica">Sem dados para gráficos neste período.</p>';
 return h;
  }
function modal(){
 var M=S.m,F=M.f,h='<div class="sheet"><div>';
 if(M.k==="card"){
  h+='<div class="row sp"><h1>'+(M.id?"Editar cartão":"Novo cartão")+'</h1><button data-act="fecha">Cancelar</button></div>';
  h+='<label class="f" for="f-nome">Nome do cartão</label><input type="text" id="f-nome" value="'+esc(F.nome)+'" autocomplete="off">';
  h+='<label class="f" for="f-fecha">Dia do fechamento da fatura (opcional)</label><input type="number" id="f-fecha" min="1" max="31" value="'+esc(F.fecha)+'">';
  h+='<label class="f" for="f-vence">Dia do vencimento</label><input type="number" id="f-vence" min="1" max="31" value="'+esc(F.vence)+'">';
 }else if(M.k==="cat"){
  h+='<div class="row sp"><h1>Renomear categoria</h1><button data-act="fecha">Cancelar</button></div><label class="f" for="f-nome">Novo nome</label><input type="text" id="f-nome" value="'+esc(F.nome)+'" autocomplete="off"><p class="dica">Os lançamentos já feitos nesta categoria também serão renomeados.</p>';
 }else{
  var ed=!!M.id;
  h+='<div class="row sp"><h1>'+(ed?"Editar lançamento":"Novo lançamento")+'</h1><button data-act="fecha">Cancelar</button></div>';
  h+='<div class="seg"><button data-act="tipo" data-v="d" class="'+(F.t==="d"?"on":"")+'">Despesa</button><button data-act="tipo" data-v="r" class="'+(F.t==="r"?"on":"")+'">Receita</button></div>';
  h+='<input class="big" id="f-v" inputmode="decimal" placeholder="R$ 0,00" value="'+esc(F.v)+'" aria-label="Valor">';
  h+='<label class="f" for="f-titulo">Título (opcional)</label><input type="text" id="f-titulo" value="'+esc(F.titulo)+'" autocomplete="off">';
  h+='<label class="f">Categoria</label><div class="chips">'+S.cats[F.t].map(function(c){return '<button data-act="cat" data-v="'+esc(c)+'" class="'+(F.cat===c?"on":"")+'">'+esc(c)+'</button>'}).join("")+'<button data-act="nova">+ Nova</button></div>';
  if(F.nova)h+='<div class="row" style="margin-top:10px"><input type="text" id="g-nova" placeholder="Nome da categoria" autocomplete="off"><button class="pri" data-act="addcat">Criar</button></div>';
  h+='<label class="f" for="f-data">'+(ed?"Data":"Data da compra")+'</label><input type="date" id="f-data" value="'+esc(F.data)+'">';
  if(!ed){
   if(F.t==="d"){
    h+='<label class="f">Pagamento</label><div class="chips">'+[["v","À vista"],["c","Cartão de crédito"],["p","Parcelado"]].map(function(t){return '<button data-act="pg" data-v="'+t[0]+'" class="'+(F.pg===t[0]?"on":"")+'">'+t[1]+'</button>'}).join("")+'</div>';
    if(F.pg==="c"){
     h+='<label class="f">Cartão</label><div class="chips">'+S.cards.map(function(c){return '<button data-act="cartao" data-v="'+c.id+'" class="'+(F.cartao===c.id?"on":"")+'">'+esc(c.nome)+'</button>'}).join("")+'<button data-act="novocartao">+ Novo cartão</button></div>';
     if(F.cnova)h+='<div class="card" style="margin-top:10px"><input type="text" id="f-cn" placeholder="Nome do cartão" value="'+esc(F.cn)+'" autocomplete="off"><label class="f" for="f-cf">Dia do fechamento da fatura (opcional)</label><input type="number" id="f-cf" min="1" max="31" value="'+esc(F.cf)+'"><label class="f" for="f-cv">Dia do vencimento</label><input type="number" id="f-cv" min="1" max="31" value="'+esc(F.cv)+'"><button class="pri" style="width:100%;margin-top:14px" data-act="addcartao">Criar cartão</button></div>';
     var cd=S.cards.find(function(c){return c.id===F.cartao});
     if(cd&&F.data)h+='<p class="dica">Entra na fatura que vence em '+pd(dueDate(F.data,cd)).toLocaleDateString("pt-BR",{day:"numeric",month:"long"})+'.</p>';
     h+='<label class="f" for="f-n">Parcelas (1 = à vista no cartão)</label><input type="number" id="f-n" min="1" max="48" value="'+esc(F.n)+'">';
    }
    if(F.pg==="p")h+='<label class="f" for="f-n">Número de parcelas (valor total dividido por mês)</label><input type="number" id="f-n" min="2" max="48" value="'+esc(F.n)+'">';
   }
   if(F.t==="r"||F.pg==="v"){
    h+='<label class="f">Repetição</label><div class="chips"><button data-act="rep" class="'+(F.rep?"on":"")+'">Repetir todo mês</button></div>';
    if(F.rep)h+='<label class="f" for="f-ate">Repetir até</label><input type="date" id="f-ate" value="'+esc(F.ate)+'"><p class="dica">Cria um lançamento por mês, no mesmo dia, com o valor informado.</p>';
   }
  }
 }
 return h+'<p class="err" id="e"></p><button class="pri" style="width:100%;padding:15px" data-act="salvar">Salvar</button></div></div>';
}
function login(){
 app.innerHTML='<h1>Finanças</h1><p class="empty" style="padding:8px 0;text-align:left">Acesso restrito.</p><label class="f" for="em">E-mail</label><input type="email" id="em" autocomplete="username"><label class="f" for="pw">Senha</label><input type="password" id="pw" autocomplete="current-password"><p class="err" id="e"></p><button class="pri" style="width:100%;padding:15px" data-act="entrar">Entrar</button>';
 document.getElementById("pw").addEventListener("keydown",function(e){if(e.key==="Enter")entrar()});
}
function entrar(){
 var em=document.getElementById("em").value.trim(),pw=document.getElementById("pw").value,er=document.getElementById("e");
 if(!em||!pw){er.textContent="Preencha e-mail e senha.";return}
 er.textContent="Entrando…";
 signInWithEmailAndPassword(auth,em,pw).catch(function(){er.textContent="E-mail ou senha incorretos."});
}
function render(){
 if(!S.pronto)return;
 if(!S.user)return login();
 if(S.view==="rel"){app.innerHTML=relatorio();return}
 var corpo=S.view==="home"?home():S.view==="lanc"?lanc():S.view==="fut"?futuro():ajustes();
 app.innerHTML=head()+corpo+(S.view==="aj"?"":'<button class="pri fab" data-act="novo">+ Lançar</button>')+(S.m?modal():"");
}
function ler(){
 if(!S.m)return;
 var F=S.m.f;
 document.querySelectorAll('[id^="f-"]').forEach(function(el){F[el.id.slice(2)]=el.value});
}
function addMes(s,i){var d=pd(s),y=d.getFullYear(),m=d.getMonth()+i,dia=d.getDate(),u=new Date(y,m+1,0).getDate();return ymd(new Date(y,m,Math.min(dia,u)))}
function novoF(){return {t:"d",v:"",titulo:"",cat:"",data:ymd(new Date()),pg:"v",n:"2",nova:false,cartao:"",cnova:false,cn:"",cf:"",cv:"",rep:false,ate:""}}
app.addEventListener("click",function(e){
 var b=e.target.closest("[data-act]");if(!b)return;
 var a=b.dataset.act,v=b.dataset.v,id=b.dataset.id,x;
 if(a==="entrar"){entrar();return}
 if(a==="sair"){signOut(auth);return}
 if(a==="print"){window.print();return}
 if(a==="eye"){S.show=!S.show;try{localStorage.setItem("finshow",S.show?"1":"0")}catch(z){}}
 else if(a==="view")S.view=v;
 else if(a==="per")S.p=v;
 else if(a==="nav")shift(+v);
 else if(a==="proj")S.proj=+v;
 else if(a==="rel"){S.back=S.view;S.view="rel"}
 else if(a==="relvolta")S.view=S.back||"home";
 else if(a==="novo")S.m={k:"lanc",id:null,f:novoF()};
 else if(a==="elanc"){
  x=S.e.find(function(i){return i.id===id});
  if(x){var f=novoF();f.t=x.t;f.v=String(x.v).replace(".",",");f.titulo=x.titulo;f.cat=x.cat;f.data=x.data;S.m={k:"lanc",id:x.id,f:f}}
 }
 else if(a==="ncard")S.m={k:"card",id:null,f:{nome:"",fecha:"",vence:""}};
 else if(a==="ecard"){
  x=S.cards.find(function(c){return c.id===id});
  if(x)S.m={k:"card",id:x.id,f:{nome:x.nome,fecha:x.fecha?String(x.fecha):"",vence:String(x.vence)}};
 }
 else if(a==="dcard"){
  if(confirm("Excluir este cartão? Os lançamentos já feitos nele continuam.")){S.cards=S.cards.filter(function(c){return c.id!==id});salvaCards()}
 }
 else if(a==="ecat")S.m={k:"cat",id:null,t:b.dataset.t,old:v,f:{nome:v}};
 else if(a==="dcat"){
  if(confirm("Excluir esta categoria da lista? Os lançamentos antigos mantêm o nome.")){var tp=b.dataset.t;S.cats[tp]=S.cats[tp].filter(function(c){return c!==v});salvaCats()}
 }
 else if(a==="del"){if(confirm("Excluir este lançamento?"))deleteDoc(doc(db,"fin_lancamentos",id));return}
 else if(a==="fecha")S.m=null;
 else if(S.m){
  ler();var M=S.m,F=M.f,er=document.getElementById("e");
  if(a==="tipo"){F.t=v;F.cat="";if(v==="r")F.pg="v"}
  else if(a==="cat")F.cat=v;
  else if(a==="pg"){F.pg=v;if(v==="c")F.n="1";if(v==="p")F.n="2";if(v!=="v")F.rep=false}
  else if(a==="rep")F.rep=!F.rep;
  else if(a==="cartao")F.cartao=v;
  else if(a==="novocartao")F.cnova=true;
  else if(a==="nova")F.nova=true;
  else if(a==="addcat"){
   var nm=(document.getElementById("g-nova").value||"").trim();
   if(nm){if(S.cats[F.t].indexOf(nm)<0){S.cats[F.t].push(nm);salvaCats()}F.cat=nm;F.nova=false}
  }
  else if(a==="addcartao"){
   var nome=(F.cn||"").trim(),ve=parseInt(F.cv),fe=parseInt(F.cf)||0;
   if(!nome||!(ve>=1&&ve<=31)){er.textContent="Informe o nome e o dia do vencimento (1 a 31).";return}
   if(fe&&!(fe>=1&&fe<=31)){er.textContent="O dia do fechamento deve ser de 1 a 31.";return}
   var c={id:Date.now()+"",nome:nome,fecha:fe,vence:ve};
   S.cards.push(c);salvaCards();
   F.cartao=c.id;F.cnova=false;F.cn="";F.cf="";F.cv="";
  }
  else if(a==="salvar"){
   if(M.k==="card"){
    var n1=(F.nome||"").trim(),v1=parseInt(F.vence),f1=parseInt(F.fecha)||0;
    if(!n1||!(v1>=1&&v1<=31)){er.textContent="Informe o nome e o dia do vencimento (1 a 31).";return}
    if(f1&&!(f1>=1&&f1<=31)){er.textContent="O dia do fechamento deve ser de 1 a 31.";return}
    if(M.id)S.cards=S.cards.map(function(c){return c.id===M.id?{id:c.id,nome:n1,fecha:f1,vence:v1}:c});
    else S.cards.push({id:Date.now()+"",nome:n1,fecha:f1,vence:v1});
    salvaCards();S.m=null;
   }
   else if(M.k==="cat"){
    var nn=(F.nome||"").trim();
    if(!nn){er.textContent="Informe o nome.";return}
    if(nn!==M.old){
     var lst=S.cats[M.t].map(function(c){return c===M.old?nn:c});
     S.cats[M.t]=lst.filter(function(c,i){return lst.indexOf(c)===i});
     var bt=writeBatch(db);
     S.e.filter(function(y){return y.t===M.t&&y.cat===M.old}).forEach(function(y){bt.update(doc(db,"fin_lancamentos",y.id),{cat:nn})});
     bt.commit().catch(function(){});
     salvaCats();
    }
    S.m=null;
   }
   else{
    var tot=parseFloat(String(F.v).replace(/\./g,"").replace(",","."));
    if(isNaN(tot)){tot=parseFloat(String(F.v).replace(",","."))}
    if(!(tot>0)){er.textContent="Informe o valor.";return}
    if(!F.cat){er.textContent="Escolha uma categoria.";return}
    if(!F.data){er.textContent="Escolha a data.";return}
    if(M.id){
     b.disabled=true;
     updateDoc(doc(db,"fin_lancamentos",M.id),{t:F.t,v:Math.round(tot*100)/100,titulo:(F.titulo||"").trim()||F.cat,cat:F.cat,data:F.data})
      .then(function(){S.m=null;render()}).catch(function(){b.disabled=false;er.textContent="Não foi possível salvar. Tente de novo."});
     return;
    }
    if(F.rep){
     if(!F.ate||F.ate<F.data){er.textContent="Escolha uma data final igual ou depois da data inicial.";return}
     var datas=[],k;
     for(k=0;k<60;k++){var dk=addMes(F.data,k);if(dk>F.ate)break;datas.push(dk)}
     var br=writeBatch(db);
     datas.forEach(function(dk2){
      br.set(doc(collection(db,"fin_lancamentos")),{t:F.t,v:Math.round(tot*100)/100,titulo:(F.titulo||"").trim()||F.cat,cat:F.cat,data:dk2,compra:dk2,cartao:"",pg:"v",fixo:true,criado:serverTimestamp()});
     });
     b.disabled=true;
     br.commit().then(function(){S.m=null;S.ref=F.data;render()}).catch(function(){b.disabled=false;er.textContent="Não foi possível salvar. Tente de novo."});
     return;
    }
    var cd=F.t==="d"&&F.pg==="c"?S.cards.find(function(c){return c.id===F.cartao}):null;
    if(F.t==="d"&&F.pg==="c"&&!cd){er.textContent="Escolha o cartão ou crie um novo.";return}
    var n=1;
    if(F.t==="d"&&F.pg==="c")n=Math.max(1,Math.min(48,parseInt(F.n)||1));
    else if(F.t==="d"&&F.pg==="p")n=Math.max(2,Math.min(48,parseInt(F.n)||2));
    var first=cd?dueDate(F.data,cd):F.data,i,base=Math.floor(tot/n*100)/100,batch=writeBatch(db);
    for(i=0;i<n;i++){
     var vv=i===n-1?Math.round((tot-base*(n-1))*100)/100:base;
     batch.set(doc(collection(db,"fin_lancamentos")),{t:F.t,v:vv,titulo:((F.titulo||"").trim()||F.cat)+(n>1?" ("+(i+1)+"/"+n+")":""),cat:F.cat,data:addMes(first,i),compra:F.data,cartao:cd?cd.nome:"",pg:F.t==="d"?F.pg:"v",criado:serverTimestamp()});
    }
    b.disabled=true;
    batch.commit().then(function(){S.m=null;S.ref=first;render()}).catch(function(){b.disabled=false;er.textContent="Não foi possível salvar. Tente de novo."});
    return;
   }
  }
 }
 render();
});
