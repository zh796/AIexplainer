import{t as e}from"./mermaid-parser.core-lVH-m5Dl.js";import{$t as t,B as n,F as r,Mn as i,Nt as a,Pt as o,Xt as s,_n as c,an as l,gn as u,gt as d,jn as f,nn as p,on as m,rn as h,tn as g,yn as _,yt as v}from"./_plugin-vue_export-helper-BFx8cnfE.js";import{t as y}from"./ordinal-hYBb2elL.js";import{t as b}from"./arc-Ow8XsW_K.js";import{t as x}from"./chunk-4BX2VUAB-CdKPyw0X.js";function S(e,t){return t<e?-1:t>e?1:t>=e?0:NaN}function C(e){return e}function w(){var e=C,t=S,n=null,r=o(0),i=o(a),s=o(0);function c(o){var c,l=(o=v(o)).length,u,d,f=0,p=Array(l),m=Array(l),h=+r.apply(this,arguments),g=Math.min(a,Math.max(-a,i.apply(this,arguments)-h)),_,y=Math.min(Math.abs(g)/l,s.apply(this,arguments)),b=y*(g<0?-1:1),x;for(c=0;c<l;++c)(x=m[p[c]=c]=+e(o[c],c,o))>0&&(f+=x);for(t==null?n!=null&&p.sort(function(e,t){return n(o[e],o[t])}):p.sort(function(e,n){return t(m[e],m[n])}),c=0,d=f?(g-l*b)/f:0;c<l;++c,h=_)u=p[c],x=m[u],_=h+(x>0?x*d:0)+b,m[u]={data:o[u],index:c,value:x,startAngle:h,endAngle:_,padAngle:y};return m}return c.value=function(t){return arguments.length?(e=typeof t==`function`?t:o(+t),c):e},c.sortValues=function(e){return arguments.length?(t=e,n=null,c):t},c.sort=function(e){return arguments.length?(n=e,t=null,c):n},c.startAngle=function(e){return arguments.length?(r=typeof e==`function`?e:o(+e),c):r},c.endAngle=function(e){return arguments.length?(i=typeof e==`function`?e:o(+e),c):i},c.padAngle=function(e){return arguments.length?(s=typeof e==`function`?e:o(+e),c):s},c}var T=g.pie,E={sections:new Map,showData:!1,config:T},D=E.sections,O=E.showData,k=structuredClone(T),A={getConfig:f(()=>structuredClone(k),`getConfig`),clear:f(()=>{D=new Map,O=E.showData,s()},`clear`),setDiagramTitle:_,getDiagramTitle:m,setAccTitle:c,getAccTitle:h,setAccDescription:u,getAccDescription:p,addSection:f(({label:e,value:t})=>{if(t<0)throw Error(`"${e}" has invalid value: ${t}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);D.has(e)||(D.set(e,t),i.debug(`added new section: ${e}, with value: ${t}`))},`addSection`),getSections:f(()=>D,`getSections`),setShowData:f(e=>{O=e},`setShowData`),getShowData:f(()=>O,`getShowData`)},j=f((e,t)=>{x(e,t),t.setShowData(e.showData),e.sections.map(t.addSection)},`populateDb`),M={parse:f(async t=>{let n=await e(`pie`,t);i.debug(n),j(n,A)},`parse`)},N=f(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,`getStyles`),P=f(e=>{let t=[...e.values()].reduce((e,t)=>e+t,0),n=[...e.entries()].map(([e,t])=>({label:e,value:t})).filter(e=>e.value/t*100>=1);return w().value(e=>e.value).sort(null)(n)},`createPieArcs`),F={parser:M,db:A,renderer:{draw:f((e,a,o,s)=>{i.debug(`rendering pie chart
`+e);let c=s.db,u=l(),f=r(c.getConfig(),u.pie),p=d(a),m=p.append(`g`);m.attr(`transform`,`translate(225,225)`);let{themeVariables:h}=u,[g]=n(h.pieOuterStrokeWidth);g??=2;let _=f.textPosition,v=b().innerRadius(0).outerRadius(185),x=b().innerRadius(185*_).outerRadius(185*_);m.append(`circle`).attr(`cx`,0).attr(`cy`,0).attr(`r`,185+g/2).attr(`class`,`pieOuterCircle`);let S=c.getSections(),C=P(S),w=[h.pie1,h.pie2,h.pie3,h.pie4,h.pie5,h.pie6,h.pie7,h.pie8,h.pie9,h.pie10,h.pie11,h.pie12],T=0;S.forEach(e=>{T+=e});let E=C.filter(e=>(e.data.value/T*100).toFixed(0)!==`0`),D=y(w).domain([...S.keys()]);m.selectAll(`mySlices`).data(E).enter().append(`path`).attr(`d`,v).attr(`fill`,e=>D(e.data.label)).attr(`class`,`pieCircle`),m.selectAll(`mySlices`).data(E).enter().append(`text`).text(e=>(e.data.value/T*100).toFixed(0)+`%`).attr(`transform`,e=>`translate(`+x.centroid(e)+`)`).style(`text-anchor`,`middle`).attr(`class`,`slice`);let O=m.append(`text`).text(c.getDiagramTitle()).attr(`x`,0).attr(`y`,-400/2).attr(`class`,`pieTitleText`),k=[...S.entries()].map(([e,t])=>({label:e,value:t})),A=m.selectAll(`.legend`).data(k).enter().append(`g`).attr(`class`,`legend`).attr(`transform`,(e,t)=>{let n=22*k.length/2;return`translate(216,`+(t*22-n)+`)`});A.append(`rect`).attr(`width`,18).attr(`height`,18).style(`fill`,e=>D(e.label)).style(`stroke`,e=>D(e.label)),A.append(`text`).attr(`x`,22).attr(`y`,14).text(e=>c.getShowData()?`${e.label} [${e.value}]`:e.label);let j=512+Math.max(...A.selectAll(`text`).nodes().map(e=>e?.getBoundingClientRect().width??0)),M=O.node()?.getBoundingClientRect().width??0,N=450/2-M/2,F=450/2+M/2,I=Math.min(0,N),L=Math.max(j,F)-I;p.attr(`viewBox`,`${I} 0 ${L} 450`),t(p,450,L,f.useMaxWidth)},`draw`)},styles:N};export{F as diagram};