import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Cropper from 'react-easy-crop';
import { ArrowRight, ArrowUpRight, Calendar, Camera, Check, Clock, Download, ImagePlus, LoaderCircle, MapPin, Menu, MessageCircle, Plus, RotateCcw, Share2, Upload, X } from 'lucide-react';
import './App.css';

const TEMPLATE_URL = '/assets/attendance-template.jpg';
const EMBLEM_URL = '/assets/epwf-emblem.png';
const REGISTER_URL = 'https://forms.gle/viUSfNhFc9x1bsQaA';
const SHARE_TITLE = 'Made for More · Annual Conference';
// Set this to the live address once the site is hosted. While it is empty, the share message leaves out the "generate yours" line.
const SITE_URL = '';
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1335;
const PHOTO_FRAME = { x: 292, y: 398, width: 481, height: 452 };
const NAME_FRAME = { x: 166, y: 905, width: 760, height: 60 };
// Saturday 5th December 2026, 9 AM West Africa Time (UTC+1).
const EVENT_START = new Date('2026-12-05T09:00:00+01:00').getTime();
// The page switches to a thank-you message after midnight that day.
const EVENT_END = new Date('2026-12-06T00:00:00+01:00').getTime();

const NAV_LINKS = [
  { href: '#details', label: 'Details' },
  { href: '#create', label: 'Get your DP' },
  { href: '#faq', label: 'FAQ' },
];

const FAQ = [
  { q: 'How do I register for the conference?', a: 'Tap Register now on this page to open the registration form. Making your attendance card is separate and does not register you.' },
  { q: 'Is it free to use?', a: 'Yes. Creating and downloading your attendance design is completely free.' },
  { q: 'Does my photo get uploaded anywhere?', a: 'No. Your photo is processed in your browser only. It is never sent to a server or saved in a database.' },
  { q: 'What do I get at the end?', a: 'A high-resolution PNG (1080 × 1335) with your photo and name, ready for WhatsApp, Instagram or your gallery.' },
  { q: 'How do I share it?', a: 'Tap Share design to use your phone’s share sheet, or download the PNG and post it yourself. There is also a prewritten WhatsApp message to invite friends.' },
  { q: 'Can I change my photo after adding it?', a: 'Yes. Use Adjust to re-crop it, or Change to pick a different photo, then generate your design again.' },
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function makeCropImage(imageSrc, pixelCrop) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(pixelCrop.width));
  canvas.height = Math.max(1, Math.round(pixelCrop.height));
  const context = canvas.getContext('2d');
  context.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

function roundedImage(context, image, x, y, width, height, radius) {
  context.save();
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.clip();
  context.drawImage(image, x, y, width, height);
  context.restore();
}

async function renderDesign(photoUrl, firstName) {
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  const context = canvas.getContext('2d');
  try { await document.fonts.load('700 46px "DM Sans"'); } catch { /* fall back to Arial */ }
  const background = await loadImage(TEMPLATE_URL);
  context.drawImage(background, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  if (photoUrl) {
    const photo = await loadImage(photoUrl);
    roundedImage(context, photo, PHOTO_FRAME.x, PHOTO_FRAME.y, PHOTO_FRAME.width, PHOTO_FRAME.height, 50);
  }

  const name = firstName.trim();
  if (name) {
    context.save();
    context.fillStyle = '#3a0f2a';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    let fontSize = 46;
    const setFont = () => { context.font = `700 ${fontSize}px "DM Sans", Arial, sans-serif`; };
    setFont();
    while (context.measureText(name).width > NAME_FRAME.width && fontSize > 20) {
      fontSize -= 1;
      setFont();
    }
    context.fillText(name, NAME_FRAME.x + NAME_FRAME.width / 2, NAME_FRAME.y + NAME_FRAME.height / 2 + 1, NAME_FRAME.width);
    context.restore();
  }
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the image. Please try again.')), 'image/png'));
}

function attendanceMessage(name) {
  const greeting = name?.trim() ? `${name.trim()} is attending` : 'I am attending';
  const parts = [
    `${greeting} the Annual Conference of the Effective Pastors’ Wives Forum, “Made for More” 🙌!`,
    'Join us on Saturday, 5th December 2026, at 9AM, at Rock Foundation Church, Tekobo Junction, Idi-Aba, Abeokuta.',
    'Powerful teaching, prayer & intercession, meaningful fellowship, and personal & ministry growth.',
    'Together We Grow • Together We Impact',
    `Register here: ${REGISTER_URL}`,
  ];
  if (SITE_URL) parts.push(`You can generate yours here: ${SITE_URL}`);
  parts.push('#MadeForMore #EPWFConference');
  return parts.join('\n\n');
}

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Counts down to the conference, then shows a live message and finally a thank-you.
function Countdown() {
  const now = useNow();
  const phase = now >= EVENT_END ? 'ended' : now >= EVENT_START ? 'live' : 'before';
  const diff = Math.max(0, EVENT_START - now);
  const units = [
    ['Days', Math.floor(diff / 86400000)],
    ['Hours', Math.floor(diff / 3600000) % 24],
    ['Minutes', Math.floor(diff / 60000) % 60],
    ['Seconds', Math.floor(diff / 1000) % 60],
  ];
  const heads = {
    before: ['Counting down', 'Until we gather.'],
    live: ['Happening now', 'We are together today.'],
    ended: ['Thank you', 'Until next time.'],
  };
  return (
    <>
      <div className="section-head center">
        <span className="eyebrow">{heads[phase][0]}</span>
        <h2 id="countdown-title">{heads[phase][1]}</h2>
      </div>
      {phase === 'before' && (
        <div className="countdown" role="timer" aria-label="Time until the Annual Conference begins">
          {units.map(([label, value]) => (
            <div className="count-box" key={label}>
              <strong>{String(value).padStart(2, '0')}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
      {phase === 'live' && <div className="countdown-live"><span className="live-dot" /> The Annual Conference is on today. Welcome!</div>}
      {phase === 'ended' && <div className="countdown-live">The Annual Conference has ended. Thank you for being part of it.</div>}
    </>
  );
}

function Ticker() {
  const items = ['MADE FOR MORE', 'ANNUAL CONFERENCE', 'SAT 5 DEC 2026', 'ABEOKUTA', 'TOGETHER WE GROW', 'TOGETHER WE IMPACT', 'I WILL BE ATTENDING'];
  const row = items.map((item) => <span key={item}>{item}<i aria-hidden="true">✦</i></span>);
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track"><div className="ticker-row">{row}</div><div className="ticker-row">{row}</div></div>
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [sourcePhoto, setSourcePhoto] = useState('');
  const [croppedPhoto, setCroppedPhoto] = useState('');
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.25);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [designBlob, setDesignBlob] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const photoPreview = croppedPhoto || '';
  const designUrl = useMemo(() => designBlob ? URL.createObjectURL(designBlob) : '', [designBlob]);

  useEffect(() => () => { if (designUrl) URL.revokeObjectURL(designUrl); }, [designUrl]);
  useEffect(() => {
    if (!sourcePhoto) return;
    setCropOpen(true);
  }, [sourcePhoto]);

  const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);

  function handleFile(event) {
    setError('');
    setSuccess('');
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file, such as JPG, PNG, or WebP.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('That image is larger than 15 MB. Please choose a smaller photo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSourcePhoto(String(reader.result));
      setCrop({ x: 0, y: 0 });
      setZoom(1.25);
    };
    reader.onerror = () => setError('We could not read that photo. Please try another one.');
    reader.readAsDataURL(file);
  }

  async function applyCrop() {
    if (!sourcePhoto || !croppedAreaPixels) return;
    try {
      const image = await makeCropImage(sourcePhoto, croppedAreaPixels);
      setCroppedPhoto(image);
      setDesignBlob(null);
      setCropOpen(false);
      setSourcePhoto('');
      setSuccess('Photo added. You can still change it or adjust the crop.');
    } catch {
      setError('We could not crop that photo. Please try another image.');
    }
  }

  async function generateDesign() {
    setError('');
    setSuccess('');
    if (!firstName.trim()) {
      setError('Enter your name to personalize your design.');
      return;
    }
    if (!croppedPhoto) {
      setError('Upload and position your photo before generating the design.');
      return;
    }
    setIsGenerating(true);
    try {
      const blob = await renderDesign(croppedPhoto, firstName);
      setDesignBlob(blob);
      setSuccess('Your attendance design is ready! Download it or share it with friends.');
    } catch (err) {
      setError(err?.message || 'Something went wrong while generating the design.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function downloadDesign() {
    if (!designBlob) return;
    const url = URL.createObjectURL(designBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `homecoming-2026-${firstName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'attendance'}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  // Shares the design image on its own.
  async function shareDesign() {
    if (!designBlob) return;
    setError('');
    const file = new File([designBlob], `homecoming-2026-${firstName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'attendance'}.png`, { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] }) && navigator.share) await navigator.share({ files: [file], title: SHARE_TITLE });
      else {
        await downloadDesign();
        setSuccess('Image downloaded. Attach it to your post or message to share it.');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') setError('Sharing was not available. Download the image and share it from your gallery.');
    }
  }

  // Shares the invite message as text only, through the device share sheet so any app can be chosen.
  async function shareMessage() {
    setError('');
    const message = attendanceMessage(firstName);
    try {
      if (navigator.share) {
        await navigator.share({ title: SHARE_TITLE, text: message });
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
    // Browsers without a share sheet (most desktops): fall back to WhatsApp.
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  function startAgain() {
    setFirstName(''); setSourcePhoto(''); setCroppedPhoto(''); setDesignBlob(null); setError(''); setSuccess('');
    document.getElementById('create')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <a className="skip-link" href="#create">Skip to the card creator</a>

      <header className="navbar">
        <div className="nav-inner">
          <a className="brand" href="#top" aria-label="Effective Pastors’ Wives Forum, home">
            <img src={EMBLEM_URL} alt="" className="brand-logo" width="60" height="60" />
            <span className="brand-text"><strong>Effective Pastors’ Wives Forum</strong><small>Annual Conference 2026</small></span>
          </a>
          <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main">
            {NAV_LINKS.map((link) => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>)}
            <a className="nav-cta mobile-only" href="#create" onClick={() => setMenuOpen(false)}>Create my card</a>
          </nav>
          <a className="nav-cta desktop-only" href="#create">Create my card <ArrowRight size={16} /></a>
          <button className="menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <span className="chip">Sat, 5 Dec 2026 · Abeokuta</span>
            <h1>EPWF Conference <span className="year">2026</span></h1>
            <p className="hero-theme">Made <span>for</span> More</p>
            <p className="hero-sub">The Annual Conference of the <strong>Effective Pastors’ Wives Forum</strong>. Make your personalized “I will be attending” card, share it, and invite someone to come with you.</p>
            <div className="hero-actions">
              <a className="btn btn-primary" href={REGISTER_URL} target="_blank" rel="noopener noreferrer">Register now <ArrowUpRight size={19} /></a>
              <a className="btn btn-ghost" href="#create">Create my card <ArrowRight size={19} /></a>
            </div>
            <div className="privacy-note"><span className="privacy-dot" /> Free to use. Your photo stays on your device.</div>
          </div>
          <div className="hero-art" aria-label="EPWF Annual Conference flyer">
            <div className="art-blob" />
            <img className="hero-flyer" src="/assets/epwf-flyer.jpg" alt="Flyer for the EPWF Annual Conference, Made for More, Saturday 5th December 2026 at Rock Foundation Church, Abeokuta" width="874" height="1080" />
            <span className="spark spark-one">✦</span><span className="spark spark-two">✧</span>
          </div>
        </section>

        <Ticker />

        <section className="countdown-section" aria-labelledby="countdown-title">
          <Countdown />
        </section>

        <section className="details" id="details" aria-labelledby="details-title">
          <div className="section-head">
            <span className="eyebrow">Plan your visit</span>
            <h2 id="details-title">The details.</h2>
          </div>
          <div className="card-grid">
            <article className="info-card">
              <span className="info-icon"><Calendar size={22} /></span>
              <h3>When</h3>
              <p className="info-big">Saturday, 5th December 2026</p>
              <p>The Annual Conference of the Effective Pastors’ Wives Forum.</p>
            </article>
            <article className="info-card">
              <span className="info-icon"><Clock size={22} /></span>
              <h3>Starts</h3>
              <p className="info-big">9 AM</p>
              <p>Powerful teaching, prayer &amp; intercession, meaningful fellowship, and personal &amp; ministry growth.</p>
            </article>
            <article className="info-card">
              <span className="info-icon"><MapPin size={22} /></span>
              <h3>Where</h3>
              <p className="info-big">Rock Foundation Church</p>
              <p>Tekobo Junction, Idi-Aba, Abeokuta.</p>
            </article>
          </div>
        </section>

        <section className="builder" id="create" aria-labelledby="builder-title">
          <div className="section-head">
            <span className="eyebrow">Get your DP</span>
            <h2 id="builder-title">Make it yours.</h2>
            <p>Just your name and a photo. That’s all you need.</p>
          </div>
          <div className="builder-grid">
            <div className="form-panel">
              <label className="field-label" htmlFor="first-name">Your name</label>
              <input id="first-name" className="name-input" value={firstName} onChange={(event) => { setFirstName(event.target.value.slice(0, 40)); setDesignBlob(null); }} placeholder="e.g. Pst. Mrs Funmilayo Adeyemi" maxLength={40} autoComplete="name" />
              <div className="field-meta"><span>Type it as you want it to appear, with or without a title (Pst., Rev., Mrs, etc.).</span><span>{firstName.length}/40</span></div>

              <div className="field-label photo-label">Your photograph</div>
              {croppedPhoto ? <div className="uploaded-row"><img src={croppedPhoto} alt="Your selected portrait" /><div className="uploaded-copy"><strong>Photo ready</strong><span>Looks good? You can still adjust it.</span></div><button type="button" className="text-button" onClick={() => { setSourcePhoto(croppedPhoto); setCrop({ x: 0, y: 0 }); setZoom(1); setCroppedAreaPixels(null); }}>Adjust</button><label className="text-button change-photo">Change<input type="file" accept="image/*" onChange={handleFile} /></label></div> : <label className="upload-box"><input type="file" accept="image/*" onChange={handleFile} /><span className="upload-icon"><ImagePlus size={25} /></span><strong>Upload a photo</strong><span>JPG, PNG or WebP · Up to 15 MB</span><span className="upload-action"><Upload size={16} /> Choose photo</span></label>}
              <div className="tip-box"><span className="tip-icon">✦</span><p><strong>Quick tip</strong><br />Choose a clear photo with your face visible. You can zoom and move it around in the next step.</p></div>
              {error && <p className="feedback error" role="alert">{error}</p>}
              {success && <p className="feedback success" role="status">{success}</p>}
              <button className="btn btn-primary full-button" onClick={generateDesign} disabled={isGenerating}>{isGenerating ? <><LoaderCircle className="spin" size={19} /> Creating your design…</> : <>Generate my design <ArrowRight size={19} /></>}</button>
              <button className="back-button" onClick={startAgain}>Start over</button>
            </div>

            <div className="preview-panel">
              <div className="preview-label"><span className="live-dot" /> <span>LIVE PREVIEW</span> <small>Updates as you type</small></div>
              <div className="poster-preview">
                <img className="poster-background" src={TEMPLATE_URL} alt="Made for More Annual Conference attendance design background" />
                {photoPreview && <img className="poster-person" src={photoPreview} alt="Your photo in the attendance card" />}
                <div className={`poster-name ${firstName.trim().length > 30 ? 'long-name' : ''}`}>{firstName.trim() || 'Pst. Mrs First Name Last Name'}</div>
              </div>
              <p className="preview-caption"><Check size={15} /> Your photo and name are added to the design in your browser.</p>
            </div>
          </div>

          {designUrl && <div className="result-panel">
            <div className="result-heading"><span className="result-check"><Check size={20} /></span><div><h3>Your design is ready!</h3><p>It’s time to spread the word and invite someone along.</p></div></div>
            <img className="final-design" src={designUrl} alt="Your completed Made for More attendance design" />
            <div className="result-actions"><button className="btn btn-primary" onClick={downloadDesign}><Download size={18} /> Download PNG</button><button className="btn btn-dark" onClick={shareDesign}><Share2 size={18} /> Share design</button><button className="btn btn-green" onClick={shareMessage}><MessageCircle size={18} /> Share message</button></div>
            <p className="share-hint"><strong>Share design</strong> sends your image. <strong>Share message</strong> sends the invite text. Share both so your friends see the design and the details.</p>
            <button className="back-button" onClick={startAgain}>Create another design</button>
          </div>}
        </section>

        <section className="faq" id="faq" aria-labelledby="faq-title">
          <div className="section-head">
            <span className="eyebrow">Questions</span>
            <h2 id="faq-title">Good to know.</h2>
          </div>
          <div className="faq-list">
            {FAQ.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>{item.q}<Plus size={20} aria-hidden="true" /></summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="closing">
          <div className="closing-inner">
            <h2>Don’t come alone.</h2>
            <p>Register, make your card, share it, and bring someone with you to be Made for More.</p>
            <div className="closing-actions">
              <a className="btn btn-primary" href={REGISTER_URL} target="_blank" rel="noopener noreferrer">Register now <ArrowUpRight size={19} /></a>
              <a className="btn" href="#create">Create my card <ArrowRight size={19} /></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand"><img src={EMBLEM_URL} alt="" width="44" height="44" /><span>Made for the <strong>Effective Pastors’ Wives Forum</strong></span></div>
          <div className="footer-meta">
            <span className="footer-tag">MADE FOR MORE · SAT 5 DEC 2026</span>
            <a className="footer-dev" href="https://aratoluwada.cv" target="_blank" rel="noopener noreferrer">Contact the developer <ArrowUpRight size={14} aria-hidden="true" /></a>
          </div>
        </div>
      </footer>

      {cropOpen && sourcePhoto && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setCropOpen(false); setSourcePhoto(''); } }}>
        <section className="crop-modal" role="dialog" aria-modal="true" aria-labelledby="crop-title">
          <div className="modal-header"><div><span className="eyebrow">Photo editor</span><h2 id="crop-title">Get your best angle.</h2><p>Drag to reposition · Zoom to frame your face.</p></div><button className="icon-button" aria-label="Close photo editor" onClick={() => { setCropOpen(false); setSourcePhoto(''); }}><X size={21} /></button></div>
          <div className="crop-stage"><Cropper image={sourcePhoto} crop={crop} zoom={zoom} aspect={PHOTO_FRAME.width / PHOTO_FRAME.height} minZoom={1} maxZoom={3.5} zoomSpeed={0.15} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} showGrid={false} restrictPosition={true} /></div>
          <div className="zoom-controls"><span>−</span><input aria-label="Zoom photo" type="range" min="1" max="3.5" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /><span>+</span><button className="reset-zoom" onClick={() => { setZoom(1); setCrop({ x: 0, y: 0 }); }}><RotateCcw size={15} /> Reset</button></div>
          <p className="crop-help">On your phone, you can also pinch to zoom and drag with one finger.</p>
          <div className="modal-actions"><button className="btn btn-dark" onClick={() => { setCropOpen(false); setSourcePhoto(''); }}>Cancel</button><button className="btn btn-primary" onClick={applyCrop}><Check size={18} /> Use this photo</button></div>
        </section>
      </div>}
    </>
  );
}

export default App;
