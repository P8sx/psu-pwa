function O(){}function S(t,e){for(const n in e)t[n]=e[n];return t}function T(t){return t()}function K(){return Object.create(null)}function D(t){t.forEach(T)}function Q(t){return typeof t=="function"}function V(t,e){return t!=t?e==e:t!==e||t&&typeof t=="object"||typeof t=="function"}function X(t){return Object.keys(t).length===0}function C(t,...e){if(t==null){for(const i of e)i(void 0);return O}const n=t.subscribe(...e);return n.unsubscribe?()=>n.unsubscribe():n}function Y(t,e,n){t.$$.on_destroy.push(C(e,n))}function Z(t,e,n,i){if(t){const c=w(t,e,n,i);return t[0](c)}}function w(t,e,n,i){return t[1]&&i?S(n.ctx.slice(),t[1](i(e))):n.ctx}function $(t,e,n,i){if(t[2]&&i){const c=t[2](i(n));if(e.dirty===void 0)return c;if(typeof c=="object"){const o=[],l=Math.max(e.dirty.length,c.length);for(let s=0;s<l;s+=1)o[s]=e.dirty[s]|c[s];return o}return e.dirty|c}return e.dirty}function tt(t,e,n,i,c,o){if(c){const l=w(e,n,i,o);t.p(l,c)}}function et(t){if(t.ctx.length>32){const e=[],n=t.ctx.length/32;for(let i=0;i<n;i++)e[i]=-1;return e}return-1}function nt(t){const e={};for(const n in t)n[0]!=="$"&&(e[n]=t[n]);return e}function it(t,e){const n={};e=new Set(e);for(const i in t)!e.has(i)&&i[0]!=="$"&&(n[i]=t[i]);return n}let p=!1;function ct(){p=!0}function lt(){p=!1}function P(t,e,n,i){for(;t<e;){const c=t+(e-t>>1);n(c)<=i?t=c+1:e=c}return t}function H(t){if(t.hydrate_init)return;t.hydrate_init=!0;let e=t.childNodes;if(t.nodeName==="HEAD"){const r=[];for(let u=0;u<e.length;u++){const a=e[u];a.claim_order!==void 0&&r.push(a)}e=r}const n=new Int32Array(e.length+1),i=new Int32Array(e.length);n[0]=-1;let c=0;for(let r=0;r<e.length;r++){const u=e[r].claim_order,a=(c>0&&e[n[c]].claim_order<=u?c+1:P(1,c,j=>e[n[j]].claim_order,u))-1;i[r]=n[a]+1;const E=a+1;n[E]=r,c=Math.max(E,c)}const o=[],l=[];let s=e.length-1;for(let r=n[c]+1;r!=0;r=i[r-1]){for(o.push(e[r-1]);s>=r;s--)l.push(e[s]);s--}for(;s>=0;s--)l.push(e[s]);o.reverse(),l.sort((r,u)=>r.claim_order-u.claim_order);for(let r=0,u=0;r<l.length;r++){for(;u<o.length&&l[r].claim_order>=o[u].claim_order;)u++;const a=u<o.length?o[u]:null;t.insertBefore(l[r],a)}}function q(t,e){if(p){for(H(t),(t.actual_end_child===void 0||t.actual_end_child!==null&&t.actual_end_child.parentNode!==t)&&(t.actual_end_child=t.firstChild);t.actual_end_child!==null&&t.actual_end_child.claim_order===void 0;)t.actual_end_child=t.actual_end_child.nextSibling;e!==t.actual_end_child?(e.claim_order!==void 0||e.parentNode!==t)&&t.insertBefore(e,t.actual_end_child):t.actual_end_child=e.nextSibling}else(e.parentNode!==t||e.nextSibling!==null)&&t.appendChild(e)}function rt(t,e,n){p&&!n?q(t,e):(e.parentNode!==t||e.nextSibling!=n)&&t.insertBefore(e,n||null)}function st(t){t.parentNode&&t.parentNode.removeChild(t)}function ot(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function B(t){return document.createElement(t)}function x(t){return document.createTextNode(t)}function ut(){return x(" ")}function at(){return x("")}function ft(t,e,n,i){return t.addEventListener(e,n,i),()=>t.removeEventListener(e,n,i)}function L(t,e,n){n==null?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}const M=["width","height"];function _t(t,e){const n=Object.getOwnPropertyDescriptors(t.__proto__);for(const i in e)e[i]==null?t.removeAttribute(i):i==="style"?t.style.cssText=e[i]:i==="__value"?t.value=t[i]=e[i]:n[i]&&n[i].set&&M.indexOf(i)===-1?t[i]=e[i]:L(t,i,e[i])}function dt(t){return t.dataset.svelteH}function ht(t){let e;return{p(...n){e=n,e.forEach(i=>t.push(i))},r(){e.forEach(n=>t.splice(t.indexOf(n),1))}}}function pt(t){return Array.from(t.childNodes)}function I(t){t.claim_info===void 0&&(t.claim_info={last_index:0,total_claimed:0})}function N(t,e,n,i,c=!1){I(t);const o=(()=>{for(let l=t.claim_info.last_index;l<t.length;l++){const s=t[l];if(e(s)){const r=n(s);return r===void 0?t.splice(l,1):t[l]=r,c||(t.claim_info.last_index=l),s}}for(let l=t.claim_info.last_index-1;l>=0;l--){const s=t[l];if(e(s)){const r=n(s);return r===void 0?t.splice(l,1):t[l]=r,c?r===void 0&&t.claim_info.last_index--:t.claim_info.last_index=l,s}}return i()})();return o.claim_order=t.claim_info.total_claimed,t.claim_info.total_claimed+=1,o}function z(t,e,n,i){return N(t,c=>c.nodeName===e,c=>{const o=[];for(let l=0;l<c.attributes.length;l++){const s=c.attributes[l];n[s.name]||o.push(s.name)}o.forEach(l=>c.removeAttribute(l))},()=>i(e))}function mt(t,e,n){return z(t,e,n,B)}function F(t,e){return N(t,n=>n.nodeType===3,n=>{const i=""+e;if(n.data.startsWith(i)){if(n.data.length!==i.length)return n.splitText(i.length)}else n.data=i},()=>x(e),!0)}function bt(t){return F(t," ")}function yt(t,e){e=""+e,t.data!==e&&(t.data=e)}function gt(t,e){t.value=e??""}function xt(t,e,n,i){n==null?t.style.removeProperty(e):t.style.setProperty(e,n,"")}function vt(t,e,n){for(let i=0;i<t.options.length;i+=1){const c=t.options[i];if(c.__value===e){c.selected=!0;return}}(!n||e!==void 0)&&(t.selectedIndex=-1)}function Et(t,e){for(let n=0;n<t.options.length;n+=1){const i=t.options[n];i.selected=~e.indexOf(i.__value)}}function kt(t){const e=t.querySelector(":checked");return e&&e.__value}function wt(t,e,n){t.classList.toggle(e,!!n)}function R(t,e,{bubbles:n=!1,cancelable:i=!1}={}){return new CustomEvent(t,{detail:e,bubbles:n,cancelable:i})}function Nt(t,e){const n=[];let i=0;for(const c of e.childNodes)if(c.nodeType===8){const o=c.textContent.trim();o===`HEAD_${t}_END`?(i-=1,n.push(c)):o===`HEAD_${t}_START`&&(i+=1,n.push(c))}else i>0&&n.push(c);return n}function At(t,e){return new t(e)}let h;function m(t){h=t}function v(){if(!h)throw new Error("Function called outside component initialization");return h}function jt(t){v().$$.on_mount.push(t)}function Ot(t){v().$$.after_update.push(t)}function St(){const t=v();return(e,n,{cancelable:i=!1}={})=>{const c=t.$$.callbacks[e];if(c){const o=R(e,n,{cancelable:i});return c.slice().forEach(l=>{l.call(t,o)}),!o.defaultPrevented}return!0}}function Tt(t,e){const n=t.$$.callbacks[e.type];n&&n.slice().forEach(i=>i.call(this,e))}const d=[],k=[];let _=[];const y=[],A=Promise.resolve();let g=!1;function U(){g||(g=!0,A.then(G))}function Dt(){return U(),A}function W(t){_.push(t)}function Ct(t){y.push(t)}const b=new Set;let f=0;function G(){if(f!==0)return;const t=h;do{try{for(;f<d.length;){const e=d[f];f++,m(e),J(e.$$)}}catch(e){throw d.length=0,f=0,e}for(m(null),d.length=0,f=0;k.length;)k.pop()();for(let e=0;e<_.length;e+=1){const n=_[e];b.has(n)||(b.add(n),n())}_.length=0}while(d.length);for(;y.length;)y.pop()();g=!1,b.clear(),m(t)}function J(t){if(t.fragment!==null){t.update(),D(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(W)}}function Pt(t){const e=[],n=[];_.forEach(i=>t.indexOf(i)===-1?e.push(i):n.push(i)),n.forEach(i=>i()),_=e}export{Ct as $,D as A,K as B,G as C,Q as D,X as E,W as F,Pt as G,h as H,m as I,T as J,d as K,U as L,ct as M,lt as N,it as O,S as P,nt as Q,Tt as R,_t as S,ft as T,wt as U,ht as V,kt as W,Et as X,vt as Y,gt as Z,ot as _,$ as a,Nt as a0,dt as a1,St as a2,ut as b,Z as c,mt as d,B as e,pt as f,et as g,F as h,st as i,bt as j,rt as k,q as l,yt as m,O as n,Y as o,at as p,Ot as q,jt as r,V as s,x as t,tt as u,L as v,xt as w,k as x,At as y,Dt as z};
