(()=>{let e,t,o,n={};const a=e=>{n[e]&&Object.keys(n).forEach((t=>{n[t].classList.toggle("activeScreen",t===e)}))},c=async e=>{const o=await fetch(`/getGame?code=${t}`,{method:"get",headers:{Accept:"application/json"}}),n=await o.json();return 200===o.status&&n.state===e?n:new Promise((t=>{setTimeout((()=>t(c(e))),1e3)}))};window.onload=()=>{n={start:document.querySelector("#startScreen"),displayCode:document.querySelector("#displayCodeScreen"),inputCode:document.querySelector("#inputCodeScreen"),waiting:document.querySelector("#waitingScreen"),drawing:document.querySelector("#drawingScreen")};const r=document.querySelector("#newGameButton"),i=document.querySelector("#joinGameButton"),s=document.querySelector("#codeDisplay"),d=document.querySelector("#codeInput"),l=document.querySelector("#submitJoinCodeButton"),u=document.querySelector("#joinError"),m=document.querySelector("#whyAmIWaiting"),y=document.querySelector("#whatAmIDrawing"),p=document.querySelector("#submitDrawingButton");r.onclick=async()=>{r.disabled=!0;const n=await fetch("/newGame",{method:"post",headers:{Accept:"application/json"}}),i=await n.json();201===n.status?(t=i.code,s.innerHTML=`Tell Player 2 to join with code: ${t}`,a("displayCode"),({player1Scribbles:o}=await c(1)),e=o,m.innerHTML="Waiting for the other player to make a scribble...",y.innerHTML="Make a scribble!",a(e?"drawing":"waiting")):(r.disabled=!1,s.innerHTML=i.message)},i.onclick=()=>{a("inputCode")},l.onclick=async()=>{t=d.value.toUpperCase();const n=await fetch(`/joinGame?code=${t}`,{method:"post",headers:{Accept:"application/json"}}),c=await n.json();200===n.status?(({player1Scribbles:o}=c),e=!o,m.innerHTML="Waiting for the other player to make a scribble...",y.innerHTML="Make a scribble!",a(e?"drawing":"waiting")):u.innerHTML=c.message},p.onclick=async()=>{}}})();