export const templates = Object.freeze([
  {id:'story',name:'Bild & berättelse',description:'Luftig och ljus. För lokala företag, inredning och verksamheter med mycket att visa.',reference:'Mall 17',source:'https://www.figma.com/design/9Fp2kHtdlxKhsP6obpL9Df/?node-id=806-897'},
  {id:'studio',name:'Studio',description:'Mörk, stor typografi och ett bildgalleri. För kreativa företag, arkitektur och varumärken.',reference:'Lit Collective',source:'https://www.figma.com/design/fZEahfhBaRw9R48e53twLu/?node-id=4-3670'},
  {id:'services',name:'Tjänster',description:'Delad huvudsektion och tydliga erbjudanden. För teknik, rådgivning och tjänsteföretag.',reference:'Optinet',source:'https://www.figma.com/design/fZEahfhBaRw9R48e53twLu/?node-id=4-4523'},
  {id:'dining',name:'Café & restaurang',description:'Varmt papper, generösa matbilder och klassisk typografi. För caféer, restauranger och hotell.',reference:'Mat & gästfrihet'},
  {id:'wellness',name:'Hälsa & skönhet',description:'Lugn, ljus design med mjuka bildformer. För salonger, träning, kliniker och behandlingar.',reference:'Hälsa & välmående'},
  {id:'editorial',name:'Magasin & arkitektur',description:'Stor typografi, asymmetriska bildpar och en tydlig redaktionell rytm. För arkitekter, inredare och kultur.',reference:'Redaktionellt'},
  {id:'construction',name:'Bygg & hantverk',description:'Bilden först, kraftiga linjer och tydliga projektsektioner. För byggföretag, verkstäder och hantverkare.',reference:'Bygg & industri'},
  {id:'hospitality',name:'Hotell & upplevelser',description:'Panoramabild följd av en inramad introduktion och stora bildberättelser. För boenden, resor och upplevelser.',reference:'Resor & boende'},
  {id:'consulting',name:'Rådgivning & juridik',description:'Texten i fokus, en kompakt huvudbild och tydligt uppdelade innehållssektioner. För konsulter, jurister och redovisning.',reference:'Professionella tjänster'},
  {id:'retail',name:'Butik & sortiment',description:'Tydliga bildytor och ett luftigt sortimentsgalleri. För butiker, inredning och produkter.',reference:'Handel & produkter'},
]);

export function getTemplate(id) {
  return templates.find(template=>template.id===id) || templates[0];
}

// Applied after the shared content rules, before the customer's own fonts.
// Layout changes never reorder the source sections or detach their images.
export const templateContentCSS = `
html body:is([data-template="studio"],[data-template="services"]) .nav{background:#fff;color:#202420;border-color:#dce0d7;padding-inline:28px}
html body:is([data-template="studio"],[data-template="services"]) .nav-contact{border-color:#c5cec3}
html body[data-template="studio"][data-imported="true"] .content-gallery:nth-child(even){margin-top:70px}
html body[data-template="studio"][data-imported="true"] .content-gallery img{border-radius:0}
html body[data-template="services"][data-imported="true"] .content-gallery{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:64px}
html body[data-template="dining"][data-imported="true"] :is(.content-gallery,.content-editorial){grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:64px}
html body[data-template="dining"][data-imported="true"] :is(.content-gallery,.content-editorial):nth-child(even)>:first-child{order:2}
html body[data-template="wellness"][data-imported="true"] .card:not(.content-heading){padding:32px!important;border:1px solid #d8e2dc;border-radius:24px;background:#fff}
html body[data-template="retail"][data-imported="true"] .content-gallery{padding:0!important;border:0}
html body[data-template="retail"][data-imported="true"] .content-gallery img{background:#f5f5f2;border-radius:0}

html body[data-template="editorial"]{background:#f2f0ea;color:#242721}
html body[data-template="editorial"] .shell{max-width:1480px}
html body[data-template="editorial"] .nav{border-bottom:2px solid #242721}
html body[data-template="editorial"] .hero-copy{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);column-gap:64px;align-items:start;text-align:left;max-width:none;margin:64px 0 40px}
html body[data-template="editorial"] .hero-copy h1{grid-column:1;grid-row:2/5;margin:0;max-width:15ch;font-family:Georgia,serif;font-size:clamp(48px,6.8vw,100px);font-weight:400;line-height:1.03;letter-spacing:-.055em}
html body[data-template="editorial"] .eyebrow{grid-column:1/-1;justify-content:flex-start;margin-bottom:28px}
html body[data-template="editorial"] .hero-copy>p{grid-column:2;grid-row:2;margin:0 0 28px;padding-top:10px}
html body[data-template="editorial"] .hero-copy>.button{grid-column:2;grid-row:3;justify-self:start}
html body[data-template="editorial"] .button{border-radius:0}
html body[data-template="editorial"] .hero-image{border-radius:0;height:500px}
html body[data-template="editorial"][data-imported="true"] .content-gallery:nth-child(odd){grid-column:span 4}
html body[data-template="editorial"][data-imported="true"] .content-gallery:nth-child(even){grid-column:span 2}
html body[data-template="editorial"][data-imported="true"] .content-gallery img{height:380px;border-radius:0}
html body[data-template="editorial"] .contact{border-radius:0;background:#242721}

html body[data-template="construction"]{background:#f7f7f2;color:#20241f}
html body[data-template="construction"] .shell{max-width:1480px}
html body[data-template="construction"] .hero-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:56px;align-items:center;padding:56px 0;border-bottom:8px solid var(--accent)}
html body[data-template="construction"] .visual{grid-column:1;grid-row:1;min-width:0}
html body[data-template="construction"] .hero-copy{grid-column:2;grid-row:1;margin:0;text-align:left}
html body[data-template="construction"] .hero-copy h1{margin:0;max-width:17ch;font-size:clamp(42px,4.8vw,72px);line-height:1.04;font-weight:750;letter-spacing:-.04em}
html body[data-template="construction"] .hero-copy>p{margin:28px 0}
html body[data-template="construction"] .eyebrow{justify-content:flex-start}
html body[data-template="construction"] .hero-image{height:580px;border-radius:0}
html body[data-template="construction"] .button{border-radius:0}
html body[data-template="construction"][data-imported="true"] .card:not(.content-heading){border-top:3px solid #20241f}
html body[data-template="construction"][data-imported="true"] .content-gallery{grid-column:span 2}
html body[data-template="construction"][data-imported="true"] .content-gallery img{height:260px;border-radius:0}
html body[data-template="construction"] .contact{background:#20241f;border-radius:0;border-top:8px solid var(--accent)}

html body[data-template="hospitality"]{background:#f9f5ef;color:#39362d}
html body[data-template="hospitality"] .shell{max-width:1480px}
html body[data-template="hospitality"] .hero-layout{display:flex;flex-direction:column;padding-top:24px}
html body[data-template="hospitality"] .visual{order:-1;width:100%}
html body[data-template="hospitality"] .hero-image{height:560px;border-radius:140px 140px 0 0}
html body[data-template="hospitality"] .image-label{display:none}
html body[data-template="hospitality"] .hero-copy{position:relative;background:#f9f5ef;margin:-64px auto 0;padding:48px 64px!important;width:calc(100% - 120px);max-width:1040px;border:1px solid #d8d0c2}
html body[data-template="hospitality"] .hero-copy h1{font-family:Georgia,serif;font-weight:400;font-size:clamp(40px,4.8vw,68px);line-height:1.1;max-width:22ch}
html body[data-template="hospitality"] .hero-copy>p{color:#665f53}
html body[data-template="hospitality"] .button{border-radius:0}
html body[data-template="hospitality"][data-imported="true"] .content-gallery{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:64px;align-items:center}
html body[data-template="hospitality"][data-imported="true"] .content-gallery img{height:440px;border-radius:100px 100px 0 0}
html body[data-template="hospitality"] .contact{background:#39362d;border-radius:0;text-align:center;display:block}
html body[data-template="hospitality"] .contact-links{justify-content:center}
html body[data-template="hospitality"] .contact .button{margin-top:30px}

html body[data-template="consulting"]{background:#fff;color:#202e3a}
html body[data-template="consulting"] .shell{max-width:1240px}
html body[data-template="consulting"] .nav{border-bottom:1px solid #bfc8cf}
html body[data-template="consulting"] .hero-layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(0,1fr);gap:80px;align-items:center;padding:88px 0}
html body[data-template="consulting"] .hero-copy{margin:0;text-align:left}
html body[data-template="consulting"] .hero-copy h1{font-family:Georgia,serif;font-size:clamp(42px,4.8vw,66px);font-weight:400;margin:0;max-width:19ch;letter-spacing:-.04em}
html body[data-template="consulting"] .hero-copy>p{margin:28px 0;color:#4f606e}
html body[data-template="consulting"] .eyebrow{justify-content:flex-start;color:#4f606e}
html body[data-template="consulting"] .hero-image{height:400px;border-radius:0 90px 0 0}
html body[data-template="consulting"] .button{border-radius:4px}
html body[data-template="consulting"][data-imported="true"] .cards{counter-reset:section}
html body[data-template="consulting"][data-imported="true"] .card{position:relative;grid-column:1/-1;padding-left:72px!important;counter-increment:section}
html body[data-template="consulting"][data-imported="true"] .card::before{content:counter(section,decimal-leading-zero);position:absolute;left:0;top:38px;font-size:14px;font-variant-numeric:tabular-nums;color:#526675}
html body[data-template="consulting"][data-imported="true"] .content-gallery{display:grid;grid-template-columns:minmax(0,.65fr) minmax(0,1.35fr);gap:48px;align-items:center}
html body[data-template="consulting"][data-imported="true"] .content-gallery img{height:240px;border-radius:0}
html body[data-template="consulting"] .contact{border-radius:0;background:#202e3a}

html body:is([data-template="construction"],[data-template="consulting"]) .hero-layout:has(.no-image){display:block}
html body:is([data-template="construction"],[data-template="consulting"]) .hero-layout:has(.no-image) .hero-copy{max-width:850px}
html body[data-template="hospitality"] .hero-layout:has(.no-image) .hero-copy{margin-top:24px}
html body:is([data-template="editorial"],[data-template="construction"],[data-template="hospitality"],[data-template="consulting"]) .hero-copy .button{background:var(--accent);color:var(--accent-ink)}
@media(max-width:1000px){
 html body[data-template="construction"][data-imported="true"] .content-gallery{grid-column:span 3}
}
@media(max-width:760px){
 html body:is([data-template="studio"],[data-template="services"]) .nav{padding-inline:22px}
 html body[data-template="studio"][data-imported="true"] .content-gallery:nth-child(even){margin-top:0}
 html body:is([data-template="editorial"],[data-template="construction"],[data-template="consulting"]) .hero-layout{display:block;padding:36px 0}
 html body[data-template="editorial"] .hero-copy{display:block;margin:0 0 32px}
 html body:is([data-template="editorial"],[data-template="construction"],[data-template="hospitality"],[data-template="consulting"]) .hero-copy h1{font-size:clamp(34px,9vw,49px);line-height:1.12}
 html body[data-template="editorial"] .hero-copy>p{margin:24px 0;padding:0}
 html body:is([data-template="construction"],[data-template="consulting"]) .visual:not(.no-image){margin-top:32px}
 html body:is([data-template="editorial"],[data-template="construction"],[data-template="hospitality"],[data-template="consulting"]) .hero-image{height:340px}
 html body[data-template="hospitality"] .hero-image{border-radius:70px 70px 0 0}
 html body[data-template="hospitality"] .hero-copy{width:calc(100% - 24px);margin-top:-28px;padding:28px 20px!important}
 html body:is([data-template="services"],[data-template="dining"],[data-template="editorial"],[data-template="construction"],[data-template="hospitality"],[data-template="consulting"])[data-imported="true"] :is(.content-gallery,.content-editorial){grid-column:1/-1;grid-template-columns:minmax(0,1fr);gap:24px}
 html body[data-template="dining"][data-imported="true"] :is(.content-gallery,.content-editorial):nth-child(even)>:first-child{order:0}
 html body[data-template="wellness"][data-imported="true"] .card:not(.content-heading){padding:22px!important}
 html body[data-template="consulting"][data-imported="true"] .card{padding-left:0!important;padding-top:56px!important}
 html body[data-template="consulting"][data-imported="true"] .card::before{top:22px}
 html body:is([data-template="editorial"],[data-template="construction"],[data-template="hospitality"],[data-template="consulting"])[data-imported="true"] .content-gallery img{height:auto;max-height:380px}
}
`;

// Each layout uses the same customer content and retains the original anchor IDs.
export const templateCSS = `
body[data-template="studio"]{background:#101211;color:#f4f4ef}
[data-template="studio"] .shell{max-width:1440px;padding:0 64px}
[data-template="studio"] .demo-note{background:#1c201d;border-bottom:1px solid #333b34;color:#c9d1c7}
[data-template="studio"] .nav{height:108px;border-bottom:1px solid #394039}
[data-template="studio"] .nav-contact{border-radius:0;border-color:#687568}
[data-template="studio"] .hero-copy{margin:100px 0 72px;text-align:left;max-width:1010px}
[data-template="studio"] .eyebrow{justify-content:flex-start;color:#b7c6b3}
[data-template="studio"] h1{font-weight:300;font-size:clamp(48px,6.8vw,96px);line-height:1.04;letter-spacing:-.065em;max-width:1050px;white-space:pre-line}
[data-template="studio"] .hero-copy>p{margin:30px 0;color:#b7c0b5;max-width:610px}
[data-template="studio"] .button{border:1px solid #899184;border-radius:0;background:transparent;color:#f4f4ef;font-weight:400;padding:17px 24px}
[data-template="studio"] .button:hover{background:#252b26}
[data-template="studio"] .button.accent{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
[data-template="studio"] .hero-image{height:auto;aspect-ratio:2/1;border-radius:0;max-height:640px;object-fit:cover}
[data-template="studio"] .image-label{border-radius:0;background:#101211bd}
[data-template="studio"] .benefits{max-width:none;margin:0;padding:48px 0;border:0;border-bottom:1px solid #3a423a;border-radius:0;background:transparent;gap:35px}
[data-template="studio"] .benefit h3{color:#f0f4ec;font-size:20px;font-weight:400}
[data-template="studio"] .benefit p,[data-template="studio"] .card p,[data-template="studio"] .about p,[data-template="studio"] .section-top>p{color:#b5bfb2}
[data-template="studio"] .section-kicker{color:#b5bfb2}
[data-template="studio"] .section{padding:90px 0}
[data-template="studio"] .section h2{font-size:clamp(34px,4.3vw,58px);font-weight:300}
[data-template="studio"] .cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:64px 36px}
[data-template="studio"] .card:nth-child(even){padding-top:95px}
[data-template="studio"] .card img{height:auto;aspect-ratio:4/3;border-radius:0;background:#252b26}
[data-template="studio"] .card-meta{border-top:1px solid #424b40;padding-top:20px}
[data-template="studio"] .card h3{font-size:23px;font-weight:400}
[data-template="studio"] .card-number{color:#c0cbbb}
[data-template="studio"] .card-placeholder{border-radius:0;background:#1b221c;border-color:#3c473a;color:#a8b5a0}
[data-template="studio"] .about{border-color:#3a4337;gap:60px}
[data-template="studio"] .contact{border:0;border-top:1px solid #3a4337;background:transparent;border-radius:0;padding:70px 0;margin:0 0 40px}
[data-template="studio"] .contact h2{font-size:clamp(38px,5vw,68px);font-weight:300}
[data-template="studio"] .footer{color:#abb6a4;border-top:1px solid #3a4337;padding-top:25px}
[data-template="studio"] .brand-name{color:#e8eee2}
[data-template="studio"] .no-image{margin:0}

body[data-template="services"]{background:#f8f9f6;color:#17241f}
[data-template="services"] .shell{max-width:none;padding:0}
[data-template="services"] .demo-note{background:#111f1a;color:#cdd8cf;border-bottom:1px solid #38483e}
[data-template="services"] .nav{background:#111f1a;color:#f4f7f1;height:100px;padding:0 max(40px,calc((100vw - 1200px)/2))}
[data-template="services"] .nav-contact{border-color:#637b6a}
[data-template="services"] .hero-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:60px;background:#111f1a;color:#f4f7f1;padding:70px max(40px,calc((100vw - 1200px)/2)) 90px;align-items:center}
[data-template="services"] .hero-layout:has(.no-image){grid-template-columns:1fr}
[data-template="services"] .hero-copy{max-width:780px;margin:0;text-align:left}
[data-template="services"] h1{font-size:clamp(43px,5.3vw,74px);font-weight:650;line-height:1.03;text-transform:uppercase;letter-spacing:-.045em;white-space:pre-line}
[data-template="services"] .hero-copy>p{margin:24px 0 30px;color:#c0cec1;font-size:16px;line-height:1.8}
[data-template="services"] .eyebrow{justify-content:flex-start;color:#c9d7c8;line-height:1.6}
[data-template="services"] .eyebrow:before{width:7px;height:7px;flex-shrink:0;border-radius:50%;background:var(--accent)}
[data-template="services"] .hero-copy .button{background:var(--accent);color:var(--accent-ink)}
[data-template="services"] .hero-image{height:540px;border-radius:4px;object-position:center var(--hero-position)}
[data-template="services"] .visual{min-width:0}
[data-template="services"] .no-image{display:none}
[data-template="services"] .image-label{border-radius:3px;font-size:10px;text-transform:uppercase;letter-spacing:.08em}
[data-template="services"] main>.benefits{max-width:1200px;margin:0 auto;padding:45px 0;border:0;border-bottom:1px solid #cbd3c7;border-radius:0;background:transparent}
[data-template="services"] .benefit h3{font-size:18px}
[data-template="services"] .section{max-width:1200px;margin:0 auto;padding:85px 0}
[data-template="services"] .section-top{margin-bottom:48px}
[data-template="services"] .section h2{font-size:clamp(32px,3.7vw,50px);font-weight:500;max-width:690px}
[data-template="services"] .cards{display:flex;flex-direction:column;gap:0}
[data-template="services"] .card{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;gap:70px;padding:42px 0;border-top:1px solid #d7ddd2}
[data-template="services"] .card:nth-child(even)>:first-child{order:2}
[data-template="services"] .card img{height:370px;border-radius:3px}
[data-template="services"] .card-meta{margin:0;gap:30px}
[data-template="services"] .card h3{font-size:clamp(24px,2.6vw,35px);line-height:1.2;font-weight:550;margin:0 0 20px}
[data-template="services"] .card p{font-size:15px;line-height:1.8}
[data-template="services"] .card-number{font-size:12px;order:-1;border-bottom:2px solid #596e4e;padding:6px 0;color:#4f674b}
[data-template="services"] .card-placeholder{height:250px;border-radius:3px}
[data-template="services"] .about{gap:70px;border-top:1px solid #cbd3c7}
[data-template="services"] .contact{background:#111f1a;border-radius:0;padding:80px max(40px,calc((100vw - 1200px)/2));margin:0}
[data-template="services"] .contact h2{font-size:clamp(36px,4vw,60px);font-weight:450}
[data-template="services"] .footer{max-width:1200px;margin:0 auto;padding:28px 0}

@media(max-width:1280px){[data-template="services"] main>.benefits,[data-template="services"] .section,[data-template="services"] .footer{margin-left:40px;margin-right:40px}}
@media(max-width:760px){
  [data-template="studio"] .shell{padding:0 22px}
  [data-template="studio"] .nav{height:82px}
  [data-template="studio"] .hero-copy{margin:55px 0 42px}
  [data-template="studio"] h1{font-size:49px}
  [data-template="studio"] .hero-image{aspect-ratio:4/3}
  [data-template="studio"] .benefits{grid-template-columns:1fr;gap:25px;padding:32px 0}
  [data-template="studio"] .section{padding:56px 0}
  [data-template="studio"] .cards{grid-template-columns:1fr;gap:36px}
  [data-template="studio"] .card:nth-child(even){padding-top:0}
  [data-template="studio"] .card-meta{margin-top:17px}
  [data-template="studio"] .about{gap:25px}
  [data-template="studio"] .contact{padding:40px 0}
  [data-template="services"] .nav{height:82px;padding:0 22px}
  [data-template="services"] .hero-layout{grid-template-columns:1fr;gap:38px;padding:38px 22px 42px}
  [data-template="services"] h1{font-size:43px}
  [data-template="services"] .hero-image{height:350px}
  [data-template="services"] main>.benefits{grid-template-columns:1fr;margin:0 22px;padding:32px 0}
  [data-template="services"] .section{margin:0 22px;padding:52px 0}
  [data-template="services"] .section-top{margin-bottom:25px}
  [data-template="services"] .card{grid-template-columns:1fr;gap:25px;padding:28px 0}
  [data-template="services"] .card:nth-child(even)>:first-child{order:0}
  [data-template="services"] .card img{height:270px}
  [data-template="services"] .card-meta{gap:19px}
  [data-template="services"] .card h3{margin-bottom:12px}
  [data-template="services"] .about{gap:25px}
  [data-template="services"] .contact{padding:45px 22px}
  [data-template="services"] .footer{margin:0 22px}
}
@media print{[data-template="studio"] .hero-copy{margin:35px 0}[data-template="studio"] .card:nth-child(even){padding-top:0}[data-template="services"] .hero-image{height:300px}[data-template="services"] .card{break-inside:avoid}}

/* Industry layouts preserve the same content, images and working navigation. */
html body[data-template="dining"]{background:#f5f0e7;color:#342b24}
html body[data-template="dining"] .shell{max-width:1380px}
html body[data-template="dining"] .hero-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:64px;align-items:center;padding:64px 0}
html body[data-template="dining"] .hero-copy{margin:0;text-align:left}
html body[data-template="dining"] h1,html body[data-template="dining"] .card h3,html body[data-template="dining"] .contact h2{font-family:Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:-.045em}
html body[data-template="dining"] .hero-copy h1{margin-left:0;font-size:clamp(40px,5.5vw,76px)}
html body[data-template="dining"] .hero-copy>p{margin:24px 0;color:#65584b}
html body[data-template="dining"] .eyebrow{justify-content:flex-start;color:#65584b}
html body[data-template="dining"] .hero-image{height:560px;border-radius:46% 46% 8px 8px}
html body[data-template="dining"] .button{border-radius:4px}
html body[data-template="dining"] .cards{display:flex;flex-direction:column;gap:0}
html body[data-template="dining"] .card{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:64px;padding:48px 0;border-top:1px solid #d6cabc;align-items:center}
html body[data-template="dining"] .card:nth-child(even)>img{order:2}
html body[data-template="dining"] .card img{border-radius:8px;object-fit:contain;max-height:480px;height:auto}
html body[data-template="dining"] .card h3{font-size:36px}
html body[data-template="dining"] .card p{color:#65584b;font-size:16px;line-height:1.85}
html body[data-template="dining"] .contact{background:#342b24;border-radius:8px}
html body[data-template="wellness"]{background:#f5f8f5;color:#233c35}
html body[data-template="wellness"] .hero-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:64px;align-items:center;padding:76px 0}
html body[data-template="wellness"] .hero-copy{margin:0;text-align:left}
html body[data-template="wellness"] .hero-copy h1{margin-left:0;font-weight:450;letter-spacing:-.04em;font-size:clamp(38px,5vw,66px)}
html body[data-template="wellness"] .hero-copy>p{margin:24px 0;color:#52675f}
html body[data-template="wellness"] .eyebrow{justify-content:flex-start;color:#52675f}
html body[data-template="wellness"] .hero-image{height:550px;border-radius:160px 32px 160px 32px}
html body[data-template="wellness"] .cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}
html body[data-template="wellness"] .card{display:block;padding:28px!important;border:1px solid #d8e2dc;border-radius:24px;background:#fff}
html body[data-template="wellness"] .card img{height:300px;object-fit:contain;border-radius:16px;margin-bottom:28px}
html body[data-template="wellness"] .card h3{font-size:28px;font-weight:500}
html body[data-template="wellness"] .card p{color:#52675f;font-size:16px;line-height:1.85}
html body[data-template="wellness"] .contact{background:#233c35;border-radius:32px}
html body[data-template="retail"]{background:#fff;color:#202420}
html body[data-template="retail"] .shell{max-width:1440px}
html body[data-template="retail"] .hero-copy{max-width:950px;margin:68px auto 40px}
html body[data-template="retail"] .hero-copy h1{font-size:clamp(40px,5.5vw,76px);font-weight:650;letter-spacing:-.05em}
html body[data-template="retail"] .hero-image{height:560px;border-radius:0}
html body[data-template="retail"] .button{border-radius:0}
html body[data-template="retail"] .cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:40px 28px}
html body[data-template="retail"] .card{display:block;padding:0!important;border:0}
html body[data-template="retail"] .card img{width:100%;height:300px;object-fit:contain;border-radius:0;background:#f5f5f2;margin-bottom:24px}
html body[data-template="retail"] .card h3{font-size:26px;line-height:1.2}
html body[data-template="retail"] .card p{font-size:15px;line-height:1.8;color:#586058}
html body[data-template="retail"] .contact{border-radius:0;background:#202420}
html body:is([data-template="dining"],[data-template="wellness"]) .hero-layout:has(.no-image){display:block}
html body:is([data-template="dining"],[data-template="wellness"]) .hero-layout:has(.no-image) .hero-copy{max-width:850px}
html body:is([data-template="dining"],[data-template="wellness"],[data-template="retail"]) .hero-copy .button{background:var(--accent);color:var(--accent-ink)}
html body:is([data-template="dining"],[data-template="wellness"],[data-template="retail"]) .card:not(:has(img)){display:block}
html body:is([data-template="dining"],[data-template="wellness"],[data-template="retail"]) .card-meta{margin:0;min-width:0}
html body:is([data-template="dining"],[data-template="wellness"],[data-template="retail"]) .card-placeholder{display:none}
@media(max-width:1000px){html body[data-template="retail"] .cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){
 html body:is([data-template="dining"],[data-template="wellness"]) .hero-layout{grid-template-columns:1fr;gap:32px;padding:40px 0}
 html body:is([data-template="dining"],[data-template="wellness"],[data-template="retail"]) .hero-copy h1{font-size:clamp(34px,9vw,49px);line-height:1.12}
 html body:is([data-template="dining"],[data-template="wellness"],[data-template="retail"]) .hero-image{height:350px}
 html body[data-template="dining"] .hero-image{border-radius:42% 42% 8px 8px}
 html body[data-template="wellness"] .hero-image{border-radius:90px 24px 90px 24px}
 html body[data-template="dining"] .card{grid-template-columns:1fr;gap:24px;padding:32px 0}
 html body[data-template="dining"] .card:nth-child(even)>img{order:0}
 html body:is([data-template="wellness"],[data-template="retail"]) .cards{grid-template-columns:1fr;gap:24px}
 html body[data-template="wellness"] .card{padding:22px!important}
 html body:is([data-template="dining"],[data-template="wellness"],[data-template="retail"]) .card h3{font-size:28px}
}
`;
