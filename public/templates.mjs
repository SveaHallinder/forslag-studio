export const templates = Object.freeze([
  {id:'story',name:'Bild & berättelse',description:'Luftig och ljus. För lokala företag, inredning och verksamheter med mycket att visa.',reference:'Mall 17',source:'https://www.figma.com/design/9Fp2kHtdlxKhsP6obpL9Df/?node-id=806-897'},
  {id:'studio',name:'Studio',description:'Mörk, stor typografi och ett bildgalleri. För kreativa företag, arkitektur och varumärken.',reference:'Lit Collective',source:'https://www.figma.com/design/fZEahfhBaRw9R48e53twLu/?node-id=4-3670'},
  {id:'services',name:'Tjänster',description:'Delad huvudsektion och tydliga erbjudanden. För teknik, rådgivning och tjänsteföretag.',reference:'Optinet',source:'https://www.figma.com/design/fZEahfhBaRw9R48e53twLu/?node-id=4-4523'},
]);

export function getTemplate(id) {
  return templates.find(template=>template.id===id) || templates[0];
}

// Each layout uses the same customer content and retains the original anchor IDs.
export const templateCSS = `
body[data-template="studio"]{background:#101211;color:#f4f4ef}
[data-template="studio"] .shell{max-width:1440px;padding:0 64px}
[data-template="studio"] .demo-note{background:#1c201d;border-bottom:1px solid #333b34;color:#c9d1c7}
[data-template="studio"] .nav{height:108px;border-bottom:1px solid #394039}
[data-template="studio"] .brand img,[data-template="services"] .brand img{background:#fff;padding:7px 12px;border-radius:4px}
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
`;
