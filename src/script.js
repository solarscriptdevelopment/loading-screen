document.title = `${CONFIG.serverName || ''}${CONFIG.serverNameHL || ''}`.trim() || 'Loading';

const logoEl = document.querySelector('.brand-logo');
if (CONFIG.logo) {
  document.getElementById('brand-logo-img').src = CONFIG.logo;
} else {
  logoEl.style.display = 'none';
}
const nameEl = document.getElementById('brand-name-el');
nameEl.textContent = CONFIG.serverName || '';
const hl = document.createElement('span');
hl.textContent = CONFIG.serverNameHL || '';
nameEl.appendChild(hl);
document.getElementById('brand-sub-el').textContent = CONFIG.serverSub || '';

if (CONFIG.theme) {
  const root = document.documentElement.style;
  if (CONFIG.theme.accent) {
    let hex = CONFIG.theme.accent.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    root.setProperty('--accent', CONFIG.theme.accent);
    root.setProperty('--accent-rgb', [0, 2, 4].map(i => parseInt(hex.substr(i, 2), 16)).join(', '));
  }
  if (CONFIG.theme.accent2) root.setProperty('--accent-2', CONFIG.theme.accent2);
}

const backgroundVideo = document.getElementById('background-video');
const customCursor = document.getElementById('custom-cursor');
const bgLayer = document.getElementById('bg');
const videoOverlay = document.getElementById('video-overlay');
let backgroundVideoStarted = false;

window.addEventListener('mousemove', (e) => {
  customCursor.style.left = `${e.clientX}px`;
  customCursor.style.top = `${e.clientY}px`;
});

function isYouTubeUrl(url) {
  return /(?:youtube\.com|youtu\.be)/i.test(url || '');
}

function getYouTubeEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    const id = parsed.hostname.includes('youtu.be')
      ? parsed.pathname.replace('/', '')
      : parsed.searchParams.get('v');

    if (!id) return null;

    const origin = window.location.origin || 'https://example.com';
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&modestbranding=1&playsinline=1&fs=0&iv_load_policy=3&disablekb=1&origin=${encodeURIComponent(origin)}`;
  } catch (e) {
    return null;
  }
}

function startYouTubeVideo(url) {
  const embedUrl = getYouTubeEmbedUrl(url);
  if (!embedUrl || !videoOverlay) return;

  videoOverlay.innerHTML = `
    <iframe
      src="${embedUrl}"
      title="Background video"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>`;
  videoOverlay.style.opacity = '1';
  if (bgLayer) bgLayer.style.display = 'none';

  if (backgroundVideo) {
    backgroundVideo.style.opacity = '0';
  }
}

function startBgVideo(src = CONFIG.bgVideo) {
  if (!src || !backgroundVideo || backgroundVideoStarted) return;
  backgroundVideoStarted = true;

  backgroundVideo.pause();
  backgroundVideo.currentTime = 0;
  backgroundVideo.muted = true;
  backgroundVideo.loop = true;
  backgroundVideo.autoplay = true;
  backgroundVideo.playsInline = true;
  backgroundVideo.preload = 'auto';
  backgroundVideo.volume = 0;
  backgroundVideo.defaultMuted = true;
  backgroundVideo.style.opacity = '0';
  backgroundVideo.style.display = 'block';

  const tryPlay = (attempt = 0) => {
    if (attempt > 40) return;

    const playPromise = backgroundVideo.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        backgroundVideo.style.opacity = '1';
        bgLayer.style.display = 'none';
      }).catch(() => {
        setTimeout(() => tryPlay(attempt + 1), 250);
      });
    } else {
      setTimeout(() => tryPlay(attempt + 1), 250);
    }
  };

  backgroundVideo.addEventListener('loadedmetadata', () => {
    backgroundVideo.style.opacity = '1';
    bgLayer.style.display = 'none';
    setTimeout(() => tryPlay(), 50);
  }, { once: true });

  backgroundVideo.addEventListener('loadeddata', () => {
    backgroundVideo.style.opacity = '1';
    bgLayer.style.display = 'none';
    setTimeout(() => tryPlay(), 50);
  }, { once: true });

  backgroundVideo.addEventListener('canplay', () => {
    backgroundVideo.style.opacity = '1';
    bgLayer.style.display = 'none';
    setTimeout(() => tryPlay(), 50);
  }, { once: true });

  backgroundVideo.addEventListener('error', () => {
    backgroundVideo.style.opacity = '0';
    bgLayer.style.display = 'block';
  });

  backgroundVideo.src = src;
  backgroundVideo.load();
  setTimeout(() => tryPlay(), 150);
}

const videoSource = CONFIG.videoLink || CONFIG.bgVideo;
if (videoSource) {
  if (isYouTubeUrl(videoSource)) {
    startYouTubeVideo(videoSource);
  } else {
    startBgVideo(videoSource);
  }
}

const socMap = {
  dc: { key: 'discord',   label: 'Discord',   title: 'Discord Server', btnText: 'Join Server' },
  ig: { key: 'instagram', label: 'Instagram', title: 'Instagram',      btnText: 'Follow'      },
  yt: { key: 'youtube',   label: 'YouTube',   title: 'YouTube',        btnText: 'Subscribe'   },
  tt: { key: 'tiktok',    label: 'TikTok',    title: 'TikTok',         btnText: 'Follow'      },
  tb: { key: 'tebex',     label: 'Store',     title: 'Tebex Store',    btnText: 'Shop Now'    },
};
const idMap = { dc:'s-dc', ig:'s-ig', yt:'s-yt', tt:'s-tt', tb:'s-tb' };
for (const [id, m] of Object.entries(socMap)) {
  const cfg = (CONFIG.socials || {})[m.key];
  if (!cfg || !cfg.href) {
    const el = document.getElementById(idMap[id]);
    if (el) el.style.display = 'none';
  }
}

let openSoc = null;
function soc(e, k) {
  e.preventDefault();
  if (openSoc === k) { closeSoc(); return; }
  openSoc = k;
  document.querySelectorAll('.soc').forEach(s => s.classList.remove('lit'));
  document.getElementById('s-' + k).classList.add('lit');
  const m = socMap[k];
  const cfg = (CONFIG.socials || {})[m.key] || {};
  document.getElementById('sc-label').textContent = m.label;
  document.getElementById('sc-title').textContent = m.title;
  document.getElementById('sc-desc').textContent  = cfg.desc || '';
  const btn = document.getElementById('sc-btn');
  btn.textContent = m.btnText + ' →';
  btn.href = cfg.href || '#';
  document.getElementById('soccard').classList.add('show');
}
function closeSoc() {
  openSoc = null;
  document.querySelectorAll('.soc').forEach(s => s.classList.remove('lit'));
  document.getElementById('soccard').classList.remove('show');
}
document.addEventListener('click', e => {
  if (openSoc && !e.target.closest('#topleft')) closeSoc();
});

const rulesPane = document.getElementById('pane-rules');
(CONFIG.rules || []).forEach((text, i) => {
  const div = document.createElement('div');
  div.className = 'rule';
  div.innerHTML = `<div class="rn">${String(i + 1).padStart(2, '0')}</div><div class="rt">${text}</div>`;
  rulesPane.appendChild(div);
});

const teamPane = document.getElementById('pane-team');
const defaultGradients = [
  'linear-gradient(120deg,#0a2a4a,#1a4a6a,#0d6080)',
  'linear-gradient(120deg,#2a1a0a,#6a3a1a,#804010)',
  'linear-gradient(120deg,#0a1a2a,#1a2a4a,#203060)',
  'linear-gradient(120deg,#1a0a2a,#3a1a5a,#501a70)',
  'linear-gradient(120deg,#0a2a1a,#1a5a3a,#106040)',
];
(CONFIG.team || []).forEach((member, i) => {
  const initials = (member.name || '').charAt(0).toUpperCase();
  const bannerStyle = member.banner
    ? `background-image:url('${member.banner}'); background-size:cover; background-position:center;`
    : `background:${defaultGradients[i % defaultGradients.length]};`;
  const avatarInner = member.avatar
    ? `<img src="${member.avatar}" alt="${member.name}">`
    : initials;
  const div = document.createElement('div');
  div.className = 'member';
  div.innerHTML = `
    <div class="m-banner" style="${bannerStyle}"></div>
    <div class="m-body">
      <div class="mav">${avatarInner}</div>
      <div><div class="mname">${member.name || ''}</div><div class="mrole">${member.role || ''}</div></div>
    </div>`;
  teamPane.appendChild(div);
});

const updatesPane = document.getElementById('pane-updates');
(CONFIG.updates || []).forEach((text, i) => {
  const div = document.createElement('div');
  div.className = 'upd';
  div.innerHTML = `<div class="utag">Update ${String(i + 1).padStart(2, '0')}</div><div class="utext">${text}</div>`;
  updatesPane.appendChild(div);
});

if (CONFIG.gallery && CONFIG.gallery.length) {
  const galleryEl = document.querySelector('#pane-gallery .gallery');
  galleryEl.innerHTML = '';
  CONFIG.gallery.forEach(src => {
    const div = document.createElement('div');
    div.className = 'gitem';
    div.innerHTML = `<img src="${src}" alt="Gallery image">`;
    galleryEl.appendChild(div);
  });
}

const tracks = CONFIG.tracks || [];
const audio = document.getElementById('audio');
const plFill = document.getElementById('pl-fill');
const volSlider = document.getElementById('vol-slider');
if (!tracks.length) document.getElementById('player').style.display = 'none';
let ti = 0, playing = false, shuffle = false, shuffleOrder = [];

function updatePlayIcon() {
  const ico = document.getElementById('pico');
  if (!ico) return;
  ico.innerHTML = playing
    ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'
    : '<path d="M8 5v14l11-7z"/>';
}

function buildShuffleOrder() {
  shuffleOrder = tracks.map((_, i) => i).sort(() => Math.random() - 0.5);
}

function loadTrack(i) {
  ti = ((i % tracks.length) + tracks.length) % tracks.length;
  const t = tracks[ti];
  document.getElementById('pl-track').textContent  = t.name;
  document.getElementById('pl-artist').textContent = t.artist;
  audio.src = t.src;
  audio.load();
  audio.volume = parseFloat(volSlider.value);
  plFill.style.width = '0%';
  const artEl = document.getElementById('pl-art');
  if (t.cover) {
    artEl.innerHTML = `<img src="${t.cover}" alt="cover">`;
  } else {
    artEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  }
  if (playing || !window.invokeNative) {
    const startPlayback = () => {
      audio.play().then(() => {
        playing = true;
        updatePlayIcon();
      }).catch(() => {
        setTimeout(() => {
          if (!audio.paused) return;
          audio.play().catch(() => {});
        }, 300);
      });
    };

    if (audio.readyState >= 2) {
      startPlayback();
    } else {
      audio.addEventListener('canplay', startPlayback, { once: true });
    }
  }
}

function getNextIndex() {
  if (!shuffle) return (ti + 1) % tracks.length;
  const pos = shuffleOrder.indexOf(ti);
  return shuffleOrder[(pos + 1) % shuffleOrder.length];
}
function getPrevIndex() {
  if (!shuffle) return (ti - 1 + tracks.length) % tracks.length;
  const pos = shuffleOrder.indexOf(ti);
  return shuffleOrder[(pos - 1 + shuffleOrder.length) % shuffleOrder.length];
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  plFill.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
});
audio.addEventListener('ended', () => loadTrack(getNextIndex()));
audio.addEventListener('error', () => {
  document.getElementById('pl-artist').textContent = 'File not found';
  playing = false;
  updatePlayIcon();
});
audio.addEventListener('play', () => {
  playing = true;
  updatePlayIcon();
});
audio.addEventListener('pause', () => {
  playing = false;
  updatePlayIcon();
});

function togP() {
  if (audio.paused) {
    audio.play().then(() => {
      playing = true;
      updatePlayIcon();
    }).catch(() => {});
  } else {
    audio.pause();
  }
}
function nextT() { loadTrack(getNextIndex()); }
function prevT() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  loadTrack(getPrevIndex());
}
function togShuffle() {
  shuffle = !shuffle;
  if (shuffle) buildShuffleOrder();
  document.getElementById('btn-shuffle').classList.toggle('active-btn', shuffle);
}
function seekTo(e) {
  if (!audio.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
}
function setVol(v) { audio.volume = parseFloat(v); }

if (tracks.length > 0) {
  loadTrack(0);
  const tryStart = () => {
    audio.play().then(() => {
      playing = true;
      updatePlayIcon();
    }).catch(() => {
      setTimeout(() => {
        if (!audio.paused) return;
        audio.play().catch(() => {});
      }, 300);
    });
  };

  if (audio.readyState >= 2) {
    tryStart();
  } else {
    audio.addEventListener('canplay', tryStart, { once: true });
  }
}
audio.volume = parseFloat(volSlider.value);

let activeTab = null;
function nav(id, el) {
  if (activeTab === id) {
    activeTab = null;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('panel').classList.remove('show');
    return;
  }
  activeTab = id;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('pane-' + id).classList.add('active');
  document.getElementById('panel').classList.add('show');
}

window.addEventListener('message', e => {
  const d = e.data;
  if (!d) return;
  if (d.eventName === 'loadProgress' && typeof d.loadFraction === 'number') {
    setP(d.loadFraction * 100);
  }
  if (d.eventName === 'loaded') {
    setP(100, 'Entering City');
    customCursor.style.display = 'none';
  }
  if (typeof d.progress === 'number') setP(d.progress * 100);
});

function setP(v, l) {
  v = Math.min(100, Math.max(0, v));
  document.getElementById('prog-fill').style.width = v + '%';
  document.getElementById('prog-pct').textContent  = Math.round(v) + '%';
  if (l) document.getElementById('prog-label').textContent = l;
}

if (!window.invokeNative) {
  let p = 0, ph = 0;
  const phases = [
    {l:'Connecting',e:12},{l:'Loading Assets',e:38},
    {l:'Streaming Resources',e:62},{l:'Running Scripts',e:84},{l:'Entering City',e:100}
  ];
  const iv = setInterval(() => {
    if (p >= 100) { clearInterval(iv); return; }
    p += Math.random() * 1.3 + 0.3;
    while (ph < phases.length - 1 && p >= phases[ph].e) ph++;
    setP(p, phases[ph].l);
  }, 75);
}