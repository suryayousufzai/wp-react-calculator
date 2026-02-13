'use client';

import { useState, useCallback, useMemo, useEffect, FormEvent } from 'react';

// ── Types ──────────────────────────────────────────────
interface ServiceOption { id: string; label: string; desc: string; price: number; weeks: number; popular?: boolean; }
interface Category { id: string; title: string; subtitle: string; icon: string; multi: boolean; options: ServiceOption[]; }
interface Selections { [k: string]: string[]; }
interface CardData { number: string; name: string; expiry: string; cvc: string; }
type Step = 'configure' | 'review' | 'payment' | 'success';

// ── Data ──────────────────────────────────────────────
const CATEGORIES: Category[] = [
  { id: 'type', title: 'Project Type', subtitle: 'What are we building?', icon: '◈', multi: false, options: [
    { id: 'landing', label: 'Landing Page', desc: 'Single conversion-focused page', price: 900, weeks: 1 },
    { id: 'business', label: 'Business Site', desc: '5–10 pages, forms & CMS', price: 2800, weeks: 3, popular: true },
    { id: 'ecommerce', label: 'E-Commerce', desc: 'WooCommerce full store', price: 5500, weeks: 6 },
    { id: 'webapp', label: 'Web Application', desc: 'Custom app with authentication', price: 9500, weeks: 10 },
  ]},
  { id: 'design', title: 'Design Approach', subtitle: 'How should it look?', icon: '◉', multi: false, options: [
    { id: 'template', label: 'Premium Template', desc: 'Customised WordPress theme', price: 350, weeks: 1 },
    { id: 'custom', label: 'Custom Design', desc: 'Unique design from scratch', price: 1800, weeks: 2, popular: true },
    { id: 'system', label: 'Design System', desc: 'Full UI kit + Figma source files', price: 3200, weeks: 3 },
  ]},
  { id: 'features', title: 'Features', subtitle: 'Select all you need', icon: '◎', multi: true, options: [
    { id: 'forms', label: 'Advanced Forms', desc: 'Multi-step with email automation', price: 200, weeks: 0 },
    { id: 'blog', label: 'Blog & News', desc: 'Full blog with categories', price: 450, weeks: 1 },
    { id: 'multilang', label: 'Multilingual', desc: 'English + German + French', price: 650, weeks: 1 },
    { id: 'react', label: 'React Component', desc: 'Interactive calculator or quiz', price: 900, weeks: 1, popular: true },
    { id: 'api', label: 'API Integration', desc: 'CRM, maps, or payment gateway', price: 750, weeks: 1 },
    { id: 'seo', label: 'SEO Setup', desc: 'Schema, sitemap, meta optimisation', price: 320, weeks: 0 },
  ]},
  { id: 'perf', title: 'Performance', subtitle: 'Speed & security', icon: '◇', multi: true, options: [
    { id: 'basic', label: 'Standard (Caching + SSL)', desc: 'Solid foundation for any site', price: 220, weeks: 0 },
    { id: 'advanced', label: 'Advanced (CDN + 90+ score)', desc: 'PageSpeed 90+ guaranteed', price: 550, weeks: 1, popular: true },
    { id: 'security', label: 'Security Hardening', desc: 'Firewall, backups, monitoring', price: 420, weeks: 0 },
  ]},
  { id: 'support', title: 'Ongoing Support', subtitle: 'After launch care', icon: '◫', multi: false, options: [
    { id: 'none', label: 'No Support', desc: 'One-time delivery only', price: 0, weeks: 0 },
    { id: 'basic', label: '3-Month Basic', desc: 'Bug fixes & minor updates', price: 350, weeks: 0 },
    { id: 'full', label: '12-Month Premium', desc: 'Updates, backups & priority support', price: 1100, weeks: 0, popular: true },
  ]},
];

function fmt(n: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(n);
}

function fmtCard(v: string) {
  return v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
}
function fmtExpiry(v: string) {
  const d = v.replace(/\D/g, '');
  return d.length >= 2 ? d.slice(0,2) + '/' + d.slice(2,4) : d;
}

export default function Calculator() {
  const [step, setStep] = useState<Step>('configure');
  const [catIndex, setCatIndex] = useState(0);
  const [sel, setSel] = useState<Selections>({});
  const [card, setCard] = useState<CardData>({ number: '', name: '', expiry: '', cvc: '' });
  const [paying, setPaying] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [wpConnected, setWpConnected] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWpConnected(true), 800);
    return () => clearTimeout(t);
  }, []);

  const toggle = useCallback((catId: string, optId: string, multi: boolean) => {
    setSel(prev => {
      const cur = prev[catId] || [];
      if (multi) {
        return { ...prev, [catId]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId] };
      }
      return { ...prev, [catId]: cur[0] === optId ? [] : [optId] };
    });
  }, []);

  const isSelected = useCallback((catId: string, optId: string) => (sel[catId] || []).includes(optId), [sel]);

  const quote = useMemo(() => {
    let total = 0; let weeks = 0;
    const items: { cat: string; label: string; price: number }[] = [];
    for (const cat of CATEGORIES) {
      for (const id of (sel[cat.id] || [])) {
        const opt = cat.options.find(o => o.id === id);
        if (!opt) continue;
        total += opt.price;
        weeks = Math.max(weeks, opt.weeks);
        items.push({ cat: cat.title, label: opt.label, price: opt.price });
      }
    }
    const projType = CATEGORIES[0].options.find(o => o.id === (sel['type']||[])[0]);
    if (projType) weeks += projType.weeks;
    const discount = total > 5000 ? total * 0.1 : 0;
    return { total: Math.round(total - discount), gross: total, discount: Math.round(discount), weeks: Math.max(weeks,1), items };
  }, [sel]);

  const hasSelections = Object.values(sel).some(a => a.length > 0);
  const currentCat = CATEGORIES[catIndex];
  const isLastCat = catIndex === CATEGORIES.length - 1;

  const handlePayment = async (e: FormEvent) => {
    e.preventDefault();
    setPaying(true);
    await new Promise(r => setTimeout(r, 2200));
    setPaying(false);
    setStep('success');
  };

  const S = {
    // Layout
    page: { minHeight:'100vh', background:'#faf6f0', fontFamily:"'Outfit',sans-serif" } as React.CSSProperties,
    // Header
    header: { padding:'18px 48px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #e8ddd0', background:'rgba(250,246,240,0.95)', backdropFilter:'blur(12px)', position:'sticky' as const, top:0, zIndex:100 } as React.CSSProperties,
    logo: { fontFamily:"'Playfair Display',serif", fontSize:'22px', fontWeight:700, color:'#1a1208', letterSpacing:'-0.3px' } as React.CSSProperties,
    logoSpan: { color:'#c9a84c' } as React.CSSProperties,
    badge: (on:boolean) => ({ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'20px', background: on ? 'rgba(34,197,94,0.1)' : 'rgba(201,168,76,0.1)', border:`1px solid ${on ? 'rgba(34,197,94,0.3)':'rgba(201,168,76,0.3)'}`, fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color: on ? '#16a34a':'#b8860b', transition:'all 0.5s' }) as React.CSSProperties,
    dot: (on:boolean) => ({ width:'6px', height:'6px', borderRadius:'50%', background: on ? '#22c55e':'#c9a84c', boxShadow: on ? '0 0 6px #22c55e':'none', animation: on ? 'none':'pulse 1.5s infinite' }) as React.CSSProperties,
    // Main
    main: { maxWidth:'1160px', margin:'0 auto', padding:'52px 32px' } as React.CSSProperties,
    hero: { textAlign:'center' as const, marginBottom:'56px' } as React.CSSProperties,
    eyebrow: { fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', letterSpacing:'0.2em', color:'#c9a84c', textTransform:'uppercase' as const, marginBottom:'14px' } as React.CSSProperties,
    h1: { fontFamily:"'Playfair Display',serif", fontSize:'clamp(38px,5vw,64px)', fontWeight:700, color:'#1a1208', letterSpacing:'-1.5px', lineHeight:1.05, marginBottom:'16px' } as React.CSSProperties,
    h1em: { fontStyle:'italic', color:'#c9a84c' } as React.CSSProperties,
    sub: { fontSize:'16px', color:'#7a6a55', maxWidth:'480px', margin:'0 auto', lineHeight:1.7 } as React.CSSProperties,
    // Grid
    grid: { display:'grid', gridTemplateColumns: hasSelections ? '1fr 360px':'1fr', gap:'28px', alignItems:'start' } as React.CSSProperties,
    // Card
    card: { background:'#fff', border:'1px solid #e8ddd0', borderRadius:'20px', padding:'36px', boxShadow:'0 2px 24px rgba(26,18,8,0.06)' } as React.CSSProperties,
    // Progress
    progressWrap: { marginBottom:'32px' } as React.CSSProperties,
    progressTrack: { height:'3px', background:'#ede8e0', borderRadius:'2px', overflow:'hidden' } as React.CSSProperties,
    progressBar: { height:'100%', background:'linear-gradient(90deg, #c9a84c, #e8c96c)', borderRadius:'2px', transition:'width 0.5s ease' } as React.CSSProperties,
    // Steps dots
    stepsDots: { display:'flex', gap:'8px', marginBottom:'10px' } as React.CSSProperties,
    dot2: (active:boolean, done:boolean) => ({ width: active ? '24px':'8px', height:'8px', borderRadius:'4px', background: done ? '#c9a84c' : active ? '#1a1208':'#e0d8cc', transition:'all 0.3s' }) as React.CSSProperties,
    // Category header
    catEye: { fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#c9a84c', letterSpacing:'0.15em', textTransform:'uppercase' as const, marginBottom:'6px' } as React.CSSProperties,
    catTitle: { fontFamily:"'Playfair Display',serif", fontSize:'32px', fontWeight:700, color:'#1a1208', letterSpacing:'-0.5px', marginBottom:'6px' } as React.CSSProperties,
    catSub: { fontSize:'14px', color:'#7a6a55', marginBottom:'28px' } as React.CSSProperties,
    // Options grid
    optGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'12px', marginBottom:'32px' } as React.CSSProperties,
    opt: (sel:boolean) => ({ padding:'20px', borderRadius:'14px', border:`2px solid ${sel ? '#c9a84c':'#e8ddd0'}`, background: sel ? 'rgba(201,168,76,0.06)':'#faf8f5', cursor:'pointer', transition:'all 0.2s', position:'relative' as const }) as React.CSSProperties,
    optLabel: (sel:boolean) => ({ fontFamily:"'Playfair Display',serif", fontSize:'16px', fontWeight:600, color: sel ? '#b8860b':'#1a1208', marginBottom:'5px' }) as React.CSSProperties,
    optDesc: { fontSize:'12px', color:'#9a8a75', lineHeight:1.5, marginBottom:'12px' } as React.CSSProperties,
    optPrice: (sel:boolean) => ({ fontFamily:"'JetBrains Mono',monospace", fontSize:'13px', color: sel ? '#c9a84c':'#7a6a55', fontWeight:500 }) as React.CSSProperties,
    popularBadge: { position:'absolute' as const, top:'10px', right:'10px', fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', padding:'3px 7px', background:'#c9a84c', color:'#fff', borderRadius:'3px', letterSpacing:'0.05em' } as React.CSSProperties,
    checkmark: { position:'absolute' as const, bottom:'14px', right:'14px', width:'20px', height:'20px', borderRadius:'50%', background:'#c9a84c', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700 } as React.CSSProperties,
    // Buttons
    btnRow: { display:'flex', gap:'12px' } as React.CSSProperties,
    btnPrimary: { flex:2, padding:'15px 28px', borderRadius:'10px', background:'#1a1208', border:'none', color:'#faf6f0', fontFamily:"'Outfit',sans-serif", fontSize:'14px', fontWeight:600, cursor:'pointer', transition:'all 0.2s', letterSpacing:'0.02em' } as React.CSSProperties,
    btnSecondary: { flex:1, padding:'15px 20px', borderRadius:'10px', background:'transparent', border:'1.5px solid #e0d8cc', color:'#7a6a55', fontFamily:"'Outfit',sans-serif", fontSize:'14px', cursor:'pointer', transition:'all 0.2s' } as React.CSSProperties,
    btnGold: { width:'100%', padding:'16px', borderRadius:'10px', background:'linear-gradient(135deg, #c9a84c, #e8c96c)', border:'none', color:'#1a1208', fontFamily:"'Outfit',sans-serif", fontSize:'15px', fontWeight:700, cursor:'pointer', transition:'all 0.2s', letterSpacing:'0.02em' } as React.CSSProperties,
    // Quote sidebar
    sidebar: { position:'sticky' as const, top:'90px' } as React.CSSProperties,
    sideCard: { background:'#fff', border:'1px solid #e8ddd0', borderRadius:'20px', padding:'28px', boxShadow:'0 2px 24px rgba(26,18,8,0.06)', marginBottom:'16px' } as React.CSSProperties,
    sideLabel: { fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#b0a090', letterSpacing:'0.15em', textTransform:'uppercase' as const, marginBottom:'16px' } as React.CSSProperties,
    bigPrice: { fontFamily:"'Playfair Display',serif", fontSize:'48px', fontWeight:700, color:'#1a1208', letterSpacing:'-2px', lineHeight:1 } as React.CSSProperties,
    // Line items
    lineItem: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f0ebe3' } as React.CSSProperties,
    lineLabel: { fontSize:'13px', color:'#7a6a55' } as React.CSSProperties,
    linePrice: { fontFamily:"'JetBrains Mono',monospace", fontSize:'13px', color:'#1a1208' } as React.CSSProperties,
    // Payment
    payLabel: { display:'block', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#9a8a75', letterSpacing:'0.08em', textTransform:'uppercase' as const, marginBottom:'6px' } as React.CSSProperties,
    payInput: { width:'100%', padding:'13px 16px', borderRadius:'10px', border:'1.5px solid #e8ddd0', background:'#faf8f5', color:'#1a1208', fontSize:'14px', fontFamily:"'Outfit',sans-serif", outline:'none', transition:'border-color 0.2s', marginBottom:'16px' } as React.CSSProperties,
  };

  // ── Render Steps ──────────────────────────────────────

  if (step === 'success') return (
    <div style={S.page}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} .fadeUp{animation:fadeUp 0.6s ease forwards}`}</style>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'24px', padding:'40px' }}>
        <div style={{ fontSize:'72px' }}>✦</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(32px,5vw,52px)', fontWeight:700, color:'#1a1208', letterSpacing:'-1.5px', textAlign:'center' }}>
          Payment <em style={{ color:'#c9a84c' }}>Successful</em>
        </h2>
        <p style={{ fontSize:'16px', color:'#7a6a55', textAlign:'center', maxWidth:'420px', lineHeight:1.7 }}>
          Thank you, <strong style={{ color:'#1a1208' }}>{name}</strong>! Your WordPress project is confirmed.
          We'll reach out within 24 hours to begin onboarding.
        </p>
        <div style={{ background:'#fff', border:'1px solid #e8ddd0', borderRadius:'16px', padding:'24px 36px', textAlign:'center' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#b0a090', marginBottom:'8px' }}>TOTAL CHARGED</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'40px', fontWeight:700, color:'#1a1208' }}>{fmt(quote.total)}</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#22c55e', marginTop:'8px' }}>✓ WordPress Post #{Math.floor(Math.random()*9000)+1000} Created</div>
        </div>
        <button style={S.btnGold} onClick={() => { setStep('configure'); setSel({}); setCatIndex(0); setEmail(''); setName(''); setCard({number:'',name:'',expiry:'',cvc:''}); }}>
          Start New Project
        </button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200%}100%{background-position:200%}}
        .fadeUp{animation:fadeUp 0.4s ease forwards}
        .opt-hover:hover{transform:translateY(-2px);box-shadow:0 4px 20px rgba(201,168,76,0.12)}
        .btn-hover:hover{transform:translateY(-1px)}
        .btn-dark:hover{background:#2d2010!important}
        input:focus{border-color:#c9a84c!important;box-shadow:0 0 0 3px rgba(201,168,76,0.12)}
        .card-vis{perspective:1000px}
        .card-inner{transition:transform 0.6s;transform-style:preserve-3d}
        .card-inner.flipped{transform:rotateY(180deg)}
        .card-face{backface-visibility:hidden;-webkit-backface-visibility:hidden}
        .card-back{transform:rotateY(180deg)}
      `}</style>

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.logo}>WP<span style={S.logoSpan}>Studio</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={S.badge(wpConnected)}>
            <div style={S.dot(wpConnected)} />
            {wpConnected ? '✓ WordPress Connected' : 'Connecting...'}
          </div>
          <a href="https://github.com/suryayousufzai/wp-react-calculator" target="_blank"
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#9a8a75', textDecoration:'none', padding:'8px 14px', border:'1px solid #e0d8cc', borderRadius:'8px' }}>
            GitHub ↗
          </a>
        </div>
      </header>

      <main style={S.main}>
        {/* HERO */}
        <div style={S.hero} className="fadeUp">
          <div style={S.eyebrow}>WordPress Project Calculator</div>
          <h1 style={S.h1}>
            Build Something<br />
            <em style={S.h1em}>Extraordinary</em>
          </h1>
          <p style={S.sub}>Configure your project, get an instant quote, and pay securely — all integrated with WordPress REST API.</p>
        </div>

        {/* STEP TABS */}
        {step !== 'configure' && (
          <div style={{ display:'flex', gap:'8px', marginBottom:'28px', justifyContent:'center' }}>
            {(['configure','review','payment'] as Step[]).map((s, i) => (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ padding:'8px 20px', borderRadius:'20px', background: step===s ? '#1a1208' : ['configure','review','payment'].indexOf(step) > i ? '#c9a84c':'#e8ddd0', color: step===s ? '#faf6f0' : ['configure','review','payment'].indexOf(step) > i ? '#fff':'#9a8a75', fontFamily:"'Outfit',sans-serif", fontSize:'13px', fontWeight:500, transition:'all 0.3s' }}>
                  {i+1}. {s.charAt(0).toUpperCase()+s.slice(1)}
                </div>
                {i < 2 && <div style={{ width:'24px', height:'1px', background:'#e0d8cc' }} />}
              </div>
            ))}
          </div>
        )}

        <div style={S.grid} className="fadeUp">
          {/* LEFT PANEL */}
          <div>
            {step === 'configure' && (
              <div style={S.card} key={catIndex}>
                {/* Progress */}
                <div style={S.progressWrap}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                    <div style={S.stepsDots}>
                      {CATEGORIES.map((_, i) => <div key={i} style={S.dot2(i===catIndex, i<catIndex)} />)}
                    </div>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#b0a090' }}>
                      {catIndex+1} / {CATEGORIES.length}
                    </span>
                  </div>
                  <div style={S.progressTrack}>
                    <div style={{ ...S.progressBar, width:`${((catIndex)/CATEGORIES.length)*100}%` }} />
                  </div>
                </div>

                {/* Category */}
                <div style={S.catEye}>{currentCat.icon} {currentCat.title}</div>
                <div style={S.catTitle}>{currentCat.subtitle}</div>
                <div style={S.catSub}>{currentCat.multi ? 'Select all that apply' : 'Choose one option'}</div>

                {/* Options */}
                <div style={S.optGrid}>
                  {currentCat.options.map(opt => {
                    const s = isSelected(currentCat.id, opt.id);
                    return (
                      <div key={opt.id} style={S.opt(s)} className="opt-hover"
                        onClick={() => toggle(currentCat.id, opt.id, currentCat.multi)}>
                        {opt.popular && <div style={S.popularBadge}>POPULAR</div>}
                        <div style={S.optLabel(s)}>{opt.label}</div>
                        <div style={S.optDesc}>{opt.desc}</div>
                        <div style={S.optPrice(s)}>{opt.price === 0 ? 'Included' : `+ ${fmt(opt.price)}`}</div>
                        {s && <div style={S.checkmark}>✓</div>}
                      </div>
                    );
                  })}
                </div>

                <div style={S.btnRow}>
                  {catIndex > 0 && (
                    <button style={S.btnSecondary} className="btn-hover" onClick={() => setCatIndex(p => p-1)}>← Back</button>
                  )}
                  <button style={S.btnPrimary} className="btn-hover btn-dark"
                    onClick={() => isLastCat ? setStep('review') : setCatIndex(p => p+1)}>
                    {isLastCat ? 'Review My Quote →' : 'Continue →'}
                  </button>
                </div>
              </div>
            )}

            {step === 'review' && (
              <div style={S.card} className="fadeUp">
                <div style={S.catEye}>◈ Quote Review</div>
                <div style={S.catTitle}>Your Project Summary</div>
                <div style={S.catSub}>Review your selections before proceeding to payment</div>
                
                {/* Line items */}
                <div style={{ marginBottom:'28px' }}>
                  {quote.items.map((item, i) => (
                    <div key={i} style={S.lineItem}>
                      <div>
                        <div style={{ fontSize:'11px', color:'#b0a090', fontFamily:"'JetBrains Mono',monospace", marginBottom:'2px' }}>{item.cat}</div>
                        <div style={{ fontSize:'14px', color:'#1a1208', fontWeight:500 }}>{item.label}</div>
                      </div>
                      <div style={S.linePrice}>{item.price === 0 ? 'Free' : fmt(item.price)}</div>
                    </div>
                  ))}
                  {quote.discount > 0 && (
                    <div style={{ ...S.lineItem, borderColor:'transparent' }}>
                      <div style={{ fontSize:'14px', color:'#16a34a', fontWeight:500 }}>Volume Discount (10%)</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'13px', color:'#16a34a' }}>−{fmt(quote.discount)}</div>
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'16px 0 0', borderTop:'2px solid #1a1208' }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'20px', fontWeight:700, color:'#1a1208' }}>Total</div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'24px', fontWeight:700, color:'#1a1208' }}>{fmt(quote.total)}</div>
                  </div>
                </div>

                {/* Contact fields */}
                <div style={{ marginBottom:'24px' }}>
                  <label style={S.payLabel}>Your Name</label>
                  <input style={S.payInput} value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" />
                  <label style={S.payLabel}>Email Address</label>
                  <input style={{ ...S.payInput, marginBottom:0 }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@company.com" />
                </div>

                <div style={S.btnRow}>
                  <button style={S.btnSecondary} className="btn-hover" onClick={() => setStep('configure')}>← Edit</button>
                  <button style={S.btnPrimary} className="btn-hover btn-dark" onClick={() => setStep('payment')}
                    disabled={!name || !email}>
                    Proceed to Payment →
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div style={S.card} className="fadeUp">
                <div style={S.catEye}>◈ Secure Payment</div>
                <div style={S.catTitle}>Pay with Card</div>
                <div style={{ fontSize:'14px', color:'#7a6a55', marginBottom:'28px', display:'flex', alignItems:'center', gap:'6px' }}>
                  <span>🔒</span> SSL encrypted · Powered by Stripe
                </div>

                {/* Visual Credit Card */}
                <div className="card-vis" style={{ marginBottom:'28px' }}>
                  <div className={`card-inner ${cardFlipped ? 'flipped':''}`} style={{ width:'100%', height:'200px', position:'relative' }}>
                    {/* Front */}
                    <div className="card-face" style={{ position:'absolute', inset:0, borderRadius:'16px', background:'linear-gradient(135deg, #1a1208 0%, #3d2a10 50%, #1a1208 100%)', padding:'28px', color:'#faf6f0', boxShadow:'0 20px 60px rgba(26,18,8,0.3)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px' }}>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'20px', fontWeight:700 }}>WP<span style={{ color:'#c9a84c' }}>Studio</span></div>
                        <div style={{ width:'44px', height:'32px', borderRadius:'4px', background:'linear-gradient(135deg, #c9a84c, #e8c96c)', opacity:0.9 }} />
                      </div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'18px', letterSpacing:'3px', marginBottom:'24px', color: card.number ? '#fff':'rgba(255,255,255,0.3)' }}>
                        {card.number || '•••• •••• •••• ••••'}
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                        <div>
                          <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:'4px' }}>CARD HOLDER</div>
                          <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:'14px', fontWeight:500, color: card.name ? '#fff':'rgba(255,255,255,0.3)' }}>
                            {card.name || 'YOUR NAME'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:'4px' }}>EXPIRES</div>
                          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'14px', color: card.expiry ? '#fff':'rgba(255,255,255,0.3)' }}>
                            {card.expiry || 'MM/YY'}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Back */}
                    <div className="card-face card-back" style={{ position:'absolute', inset:0, borderRadius:'16px', background:'linear-gradient(135deg, #2d1a06, #1a1208)', boxShadow:'0 20px 60px rgba(26,18,8,0.3)' }}>
                      <div style={{ height:'48px', background:'#000', marginTop:'32px' }} />
                      <div style={{ padding:'20px 28px', display:'flex', justifyContent:'flex-end', alignItems:'center', gap:'12px' }}>
                        <div style={{ flex:1, height:'36px', background:'rgba(255,255,255,0.1)', borderRadius:'4px' }} />
                        <div style={{ width:'56px', height:'36px', borderRadius:'4px', background:'#faf6f0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'JetBrains Mono',monospace", fontSize:'14px', fontWeight:600, color:'#1a1208' }}>
                          {card.cvc || 'CVC'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Form */}
                <form onSubmit={handlePayment}>
                  <label style={S.payLabel}>Card Number</label>
                  <input style={S.payInput} value={card.number} placeholder="4242 4242 4242 4242"
                    onChange={e => setCard(p => ({...p, number: fmtCard(e.target.value)}))}
                    onFocus={() => setCardFlipped(false)} maxLength={19} required />
                  <label style={S.payLabel}>Cardholder Name</label>
                  <input style={S.payInput} value={card.name} placeholder="John Smith"
                    onChange={e => setCard(p => ({...p, name: e.target.value}))}
                    onFocus={() => setCardFlipped(false)} required />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div>
                      <label style={S.payLabel}>Expiry Date</label>
                      <input style={S.payInput} value={card.expiry} placeholder="MM/YY"
                        onChange={e => setCard(p => ({...p, expiry: fmtExpiry(e.target.value)}))}
                        onFocus={() => setCardFlipped(false)} maxLength={5} required />
                    </div>
                    <div>
                      <label style={S.payLabel}>CVC</label>
                      <input style={S.payInput} value={card.cvc} placeholder="123"
                        onChange={e => setCard(p => ({...p, cvc: e.target.value.replace(/\D/g,'').slice(0,3)}))}
                        onFocus={() => setCardFlipped(true)}
                        onBlur={() => setCardFlipped(false)} maxLength={3} required />
                    </div>
                  </div>

                  <div style={{ padding:'14px 18px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'10px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'14px', color:'#7a6a55' }}>Total to be charged</span>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'22px', fontWeight:700, color:'#1a1208' }}>{fmt(quote.total)}</span>
                  </div>

                  <div style={S.btnRow}>
                    <button type="button" style={S.btnSecondary} className="btn-hover" onClick={() => setStep('review')}>← Back</button>
                    <button type="submit" style={{ ...S.btnGold, flex:2 }} className="btn-hover" disabled={paying}>
                      {paying ? (
                        <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                          <span style={{ width:'16px', height:'16px', border:'2px solid rgba(26,18,8,0.3)', borderTopColor:'#1a1208', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }} />
                          Processing Payment...
                        </span>
                      ) : `Pay ${fmt(quote.total)} →`}
                    </button>
                  </div>
                  <p style={{ textAlign:'center', fontSize:'12px', color:'#b0a090', marginTop:'14px' }}>
                    🔒 This is a portfolio demo. No real payment is processed.
                  </p>
                </form>
              </div>
            )}
          </div>

          {/* QUOTE SIDEBAR */}
          {hasSelections && (
            <div style={S.sidebar} className="fadeUp">
              <div style={S.sideCard}>
                <div style={S.sideLabel}>Your Estimate</div>
                <div style={S.bigPrice}>{fmt(quote.total)}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#b0a090', marginTop:'6px', marginBottom:'20px' }}>
                  Range: {fmt(Math.round(quote.total*0.9))} – {fmt(Math.round(quote.total*1.15))}
                </div>

                {/* Stats row */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'20px' }}>
                  {[
                    { v: `${quote.weeks}w`, l: 'Timeline' },
                    { v: `${quote.items.length}`, l: 'Services' },
                    { v: quote.discount > 0 ? '−10%' : '—', l: 'Discount' },
                  ].map(s => (
                    <div key={s.l} style={{ background:'#faf6f0', borderRadius:'10px', padding:'12px', textAlign:'center' }}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'20px', fontWeight:700, color: s.l==='Discount'&&quote.discount>0 ? '#16a34a':'#1a1208' }}>{s.v}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#b0a090', marginTop:'2px' }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Items */}
                <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                  {quote.items.map((item,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', borderRadius:'8px', background:'#faf6f0' }}>
                      <div>
                        <div style={{ fontSize:'11px', color:'#b0a090' }}>{item.cat}</div>
                        <div style={{ fontSize:'13px', color:'#1a1208', fontWeight:500 }}>{item.label}</div>
                      </div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#7a6a55', whiteSpace:'nowrap', paddingLeft:'8px' }}>
                        {item.price===0 ? 'Free' : fmt(item.price)}
                      </div>
                    </div>
                  ))}
                </div>

                {quote.discount > 0 && (
                  <div style={{ marginTop:'10px', padding:'10px 14px', background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'8px', display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'13px', color:'#16a34a' }}>Volume discount</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'13px', color:'#16a34a' }}>−{fmt(quote.discount)}</span>
                  </div>
                )}
              </div>

              {/* WP API info */}
              <div style={{ padding:'16px 18px', background:'rgba(201,168,76,0.05)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'12px' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#c9a84c', marginBottom:'8px' }}>WP REST API</div>
                <div style={{ fontSize:'12px', color:'#9a8a75', lineHeight:1.7 }}>
                  Config loaded from <code style={{ background:'#faf6f0', padding:'1px 5px', borderRadius:'3px', color:'#7a6a55' }}>wp-json/acf/v3/</code><br />
                  Quotes saved to <code style={{ background:'#faf6f0', padding:'1px 5px', borderRadius:'3px', color:'#7a6a55' }}>quote_submissions</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tech footer */}
        <div style={{ marginTop:'60px', textAlign:'center' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#c0b5a5', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'12px' }}>Built With</div>
          <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:'8px' }}>
            {['TypeScript','React 19','Next.js 15','Custom Hooks','WordPress REST API','Stripe UI','useMemo','useCallback'].map(t => (
              <span key={t} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', padding:'5px 12px', background:'#fff', border:'1px solid #e8ddd0', color:'#9a8a75', borderRadius:'4px' }}>{t}</span>
            ))}
          </div>
          <div style={{ marginTop:'16px', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#c0b5a5' }}>
            Built by <span style={{ color:'#c9a84c' }}>Surya Yousufzai</span> · Fribourg, Switzerland
          </div>
        </div>
      </main>
    </div>
  );
}
