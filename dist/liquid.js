/* Bifrost: procedural chrome, no photograph, video, or external dependency. */
(() => {
  'use strict';
  const canvas = document.querySelector('#cosmos');
  const button = document.querySelector('#motion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, hidden = document.hidden, raf = 0, time = 0, last = 0;
  let gl, program, resolution, clock, pointer, initialized = false, quality = Math.min(devicePixelRatio || 1, 1.65);
  const target = [0, 0], mouse = [0, 0];
  const vertex = `attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`;
  const fragment = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform vec2 pointer;
const float PI = 3.14159265359;
mat2 rotate(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float ribbon(vec3 p,float offset,float phase,float width){
  p.xy=rotate(.57)*p.xy;
  float y=p.y;
  float t=time*.105;
  p.x-=offset + .40*sin(y*1.08+t+phase) + .16*sin(y*2.17-t*.7+phase);
  p.z-=.26*sin(y*.92-t*.6+phase);
  p.xz=rotate(.78*sin(y*1.15+t+phase)+.28*sin(y*2.4-t*.4)+phase*.3)*p.xz;
  float w=width*(.88+.12*sin(y*1.7+t+phase));
  // Soft-edged sheet folded in depth; the contour itself, not a moving texture.
  float fold=.26*sin(p.x*4.5+y*.9+t)+.10*sin(p.x*8.-y*1.35+t*.8);
  float h=p.z-fold;
  vec2 q=vec2(abs(p.x)-w,abs(h)-.070);
  return (length(max(q,0.))+min(max(q.x,q.y),0.)-.055)*.48;
}
float scene(vec3 p){
  float a=ribbon(p,-1.12,0.,.78);
  float b=ribbon(p+vec3(0.,.0,.38),1.40,2.2,.63);
  float c=ribbon(p+vec3(0.,0.,-.32),-2.18,1.1,.20);
  return min(a,min(b,c));
}
vec3 normalAt(vec3 p){
  const vec2 e=vec2(.0014,0.);
  return normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));
}
vec3 environment(vec3 r){
  // Prismatic reflection bands: the spectrum follows the reflected angle.
  float az=atan(r.x,r.z),el=asin(clamp(r.y,-1.,1.));
  float warp=az+.24*sin(el*4.)+.1*sin(az*3.-el*2.);
  float band=.5+.5*sin(warp*3.1+el*1.6);
  // Warm photographic iridescence inspired by the supplied color reference.
  float hue=.5+.5*sin(warp*.85+el*1.3+time*.022);
  vec3 tint=mix(vec3(.38,.055,.57),vec3(1.,.105,.12),smoothstep(.02,.23,hue));
  tint=mix(tint,vec3(1.,.36,.075),smoothstep(.23,.42,hue));
  tint=mix(tint,vec3(1.,.78,.14),smoothstep(.42,.59,hue));
  tint=mix(tint,vec3(.07,.82,.66),smoothstep(.59,.78,hue));
  tint=mix(tint,vec3(.045,.68,.91),smoothstep(.78,.98,hue));
  // Neutral silver dominates; color belongs to localized reflected light sources.
  float coloredCard=smoothstep(.20,.75,sin(az*1.65-el*2.1+.8));
  float coloredEdge=exp(-pow((band-.68)*12.,2.));
  float colorMask=coloredCard*(.78+.20*coloredEdge);
  vec3 reflection=mix(vec3(.74,.77,.79),tint,colorMask);
  vec3 c=vec3(.014,.013,.014);
  c+=vec3(.045,.047,.050)*smoothstep(.28,.65,band);
  c+=reflection*.64*smoothstep(.50,.83,band);
  c+=mix(vec3(.79,.82,.84),tint, coloredCard*.94)*.88*smoothstep(.77,.96,band);
  c+=tint*coloredCard*exp(-pow((band-.59)*21.,2.))*.20;
  c+=vec3(1.12,1.08,1.02)*pow(max(0.,dot(r,normalize(vec3(-.6,1.,1.2)))),18.);
  c+=vec3(.95,.97,1.)*pow(max(0.,dot(r,normalize(vec3(1.,-.35,.8)))),30.);
  c+=vec3(1.2,.50,.20)*pow(max(0.,dot(r,normalize(vec3(-1.,-.6,.4)))),75.)*.5;
  c+=vec3(.97,.98,1.)*exp(-pow((band-.78)*32.,2.))*.78;
  return c;
}
vec3 stars(vec2 uv,float scale,float threshold){
  vec2 p=uv*scale,cell=floor(p),f=fract(p)-.5;
  float rnd=hash(cell),rnd2=hash(cell+31.4);
  f-=(vec2(rnd,rnd2)-.5)*.65;
  float d=length(f),seed=step(threshold,rnd);
  float core=exp(-d*d*780.);
  float rays=exp(-abs(f.x)*360.)*exp(-abs(f.y)*25.) + exp(-abs(f.y)*360.)*exp(-abs(f.x)*25.);
  float flash=.75+.25*sin(time*.45+rnd2*90.);
  vec3 tint=mix(vec3(.43,.66,1.),vec3(1.,.77,.55),rnd2);
  return tint*(core+rays*step(.988,rnd)*.5)*seed*flash;
}
void main(){
  vec2 uv=(gl_FragCoord.xy*2.-resolution)/resolution.y;
  vec2 screen=gl_FragCoord.xy/resolution;
  float aspect=resolution.x/resolution.y;
  vec2 parallax=pointer*.045;
  vec3 ro=vec3(parallax.x,parallax.y,5.6);
  vec3 rd=normalize(vec3(uv*1.18,-3.0));
  vec3 bg=vec3(.021,.013,.016);
  vec2 starUV=uv+vec2(time*.0008,-time*.00045)+parallax*.15;
  bg+=stars(starUV,24.,.79)*1.15 + stars(starUV+8.,11.,.985)*2.;
  float travel=0.;bool hit=false;vec3 p=ro;
  for(int i=0;i<100;i++){
    p=ro+rd*travel;
    float d=scene(p);
    if(d<.0018){hit=true;break;}
    travel+=max(d,.001);
    if(travel>11.)break;
  }
  vec3 col=bg;
  if(hit){
    vec3 n=normalAt(p),r=reflect(rd,n);
    float fresnel=pow(1.-max(dot(n,-rd),0.),3.);
    float ao=clamp(scene(p+n*.13)/.062,0.35,1.);
    col=environment(r)*(.72+.28*ao);
    col+=environment(reflect(rd,normalize(n+vec3(.01,.02,0.))))*.1*fresnel;
    col+=vec3(.13,.12,.14)*fresnel;
    float spec=pow(max(dot(r,normalize(vec3(-.4,.7,1.))),0.),260.);
    col+=vec3(1.2,1.,.8)*spec*.65;
  }
  // Sparse amber star flares, like the original photographic highlights.
  for(int j=0;j<7;j++){
    float k=float(j);
    vec2 center=vec2(sin(k*17.3+.4)*1.45,cos(k*9.7+.6)*.88);
    center+=vec2(.018*sin(time*.09+k),.012*cos(time*.07+k));
    vec2 q=rotate(.42)*(uv-center);
    float d=length(q);
    float flare=exp(-d*d*19000.)*1.8;
    flare+=exp(-abs(q.x)*1200.-abs(q.y)*48.)*.6;
    flare+=exp(-abs(q.y)*1200.-abs(q.x)*48.)*.6;
    float halo=exp(-d*90.)*.22;
    col+=vec3(1.1,.91,.70)*flare+vec3(1.,.24,.045)*halo;
    // Split light into small spectral fringes around the silver flare.
    float spread=.007+.003*sin(k*2.1);
    vec2 redQ=q-vec2(spread,0.);
    vec2 blueQ=q+vec2(spread,0.);
    float red=exp(-abs(redQ.x)*310.-abs(redQ.y)*105.);
    float blue=exp(-abs(blueQ.x)*310.-abs(blueQ.y)*105.);
    float gold=exp(-abs(q.y-spread*.8)*370.-abs(q.x)*115.);
    col+=vec3(1.,.15,.025)*red*.62;
    col+=vec3(.055,.38,1.)*blue*.68;
    col+=vec3(1.,.68,.08)*gold*.38;
  }
  // Pointlike film grain, sampled per pixel; no patterned noise or displacement.
  float grain=hash(gl_FragCoord.xy+floor(time*12.)*vec2(19.1,7.7))-.5;
  col=col/(vec3(1.)+col*.22);
  col=pow(max(col,0.),vec3(1.04));
  col*=1.10;
  float vignette=1.-.27*pow(length((screen-.5)*vec2(1.,.9)),1.5);
  col*=vignette;
  col=mix(col,vec3(.041,.025,.017),.035);
  col+=grain*.15*(.55+sqrt(max(col.r,max(col.g,col.b))));
  vec3 colorGrain=vec3(hash(gl_FragCoord.xy+13.7),hash(gl_FragCoord.xy+41.3),hash(gl_FragCoord.xy+87.1))-.5;
  col+=colorGrain*.047*smoothstep(.05,.45,max(col.r,max(col.g,col.b)));
  gl_FragColor=vec4(col,1.);
}`;
  function compile(type, source) {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(message);}
    return shader;
  }
  function resize() {
    const w=innerWidth,h=innerHeight;
    const pixelBudget=1800000;
    const ratio=Math.min(quality,Math.sqrt(pixelBudget/(w*h)));
    canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
    gl.viewport(0,0,canvas.width,canvas.height);
    render();
  }
  function render() {
    gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(clock,time);
    gl.uniform2f(pointer,mouse[0],mouse[1]);gl.drawArrays(gl.TRIANGLES,0,3);
  }
  let count=0,total=0;
  function frame(now) {
    raf=0;if(paused||hidden||!initialized)return;
    const delta=last?Math.min((now-last)/1000,.06):0;last=now;time+=delta;
    mouse[0]+=(target[0]-mouse[0])*.025;mouse[1]+=(target[1]-mouse[1])*.025;
    render();
    if(delta>0 && count<100){total+=delta;count++;if(count===100 && total/count>.034 && quality>.9){quality=.9;resize();}}
    raf=requestAnimationFrame(frame);
  }
  function sync() {
    button.setAttribute('aria-pressed',String(paused));
    button.setAttribute('aria-label',paused?'Resume animation':'Pause animation');
    button.innerHTML=paused?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3L13 8L5 13Z"/></svg>':'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3V13M11 3V13"/></svg>';
    if(raf)cancelAnimationFrame(raf);raf=0;last=0;
    if(initialized&&!paused&&!hidden)raf=requestAnimationFrame(frame);
  }
  function start() {
    gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'high-performance'});
    if(!gl)throw new Error('WebGL unavailable');
    program=gl.createProgram();
    gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    resolution=gl.getUniformLocation(program,'resolution');clock=gl.getUniformLocation(program,'time');pointer=gl.getUniformLocation(program,'pointer');
    initialized=true;button.hidden=false;
    resize();document.documentElement.classList.add('ready');sync();
  }
  try {start();} catch(error){console.error('Bifrost renderer:',error);button.hidden=true;document.documentElement.classList.add('fallback');}
  button.addEventListener('click',()=>{paused=!paused;sync();});
  addEventListener('resize',()=>{if(initialized&&!gl.isContextLost())resize();},{passive:true});
  addEventListener('pointermove',e=>{target[0]=(e.clientX/innerWidth-.5)*2;target[1]=-(e.clientY/innerHeight-.5)*2;},{passive:true});
  document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(initialized)sync();});
  reduced.addEventListener('change',e=>{paused=e.matches;if(initialized)sync();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();initialized=false;if(raf)cancelAnimationFrame(raf);button.hidden=true;document.documentElement.classList.add('fallback');});
  canvas.addEventListener('webglcontextrestored',()=>{try{start();document.documentElement.classList.remove('fallback');}catch{button.hidden=true;}});
})();
