/* =========================================================
   Belajar Figma - RPG CORE GAME ENGINE
   Features:
   - Login Screen (Nama Pemain)
   - 2D Platformer / Side-scroller Physics
   - Custom Character Image Loader (Upload / Asset / Presets)
   - Dynamic Parallax World & Stations
   - Interactive RPG Quiz & XP Logic
   - Particles, Audio & Animations
   ========================================================= */

(function() {
  'use strict';

  // ── CONSTANTS ─────────────────────────────────────────
  const CANVAS_WIDTH = 960;
  const CANVAS_HEIGHT = 540;
  const WORLD_WIDTH = 3900;
  const GROUND_Y = 440;
  const MAX_XP = 100;

  // ── STATE ──────────────────────────────────────────────
  let playerXP = 100;
  let totalCorrect = 0;
  let totalAnswered = 0;
  let totalMonsterHits = 0;
  let playerName = 'Petualang';
  let isPaused = false;
  let isQuizActive = false;
  let activeStation = null;
  let cameraX = 0;
  let gameStartTime = 0;

  // Character — sekarang 100% digambar via kode (canvas), tidak ada file gambar sama sekali.
  // Index karakter yang dipilih (0-3, sesuai window.CHARACTER_PRESETS)
  let selectedCharIndex = 0;
  let playerScale = 0.85;

  // Monster / rintangan
  const MONSTER_DAMAGE = 6;      // XP yang hilang jika kena monster (lebih kecil dari salah jawab)
  const MONSTER_INVINCIBLE_MS = 1000;
  let playerInvincibleUntil = 0;

  // Key states
  const keys = { left: false, right: false, jump: false, interact: false };

  // Particles
  const particles = [];

  // ── DOM ELEMENTS ──────────────────────────────────────
  const canvas       = document.getElementById('gameCanvas');
  const ctx          = canvas.getContext('2d');
  const xpBarFill    = document.getElementById('xp-bar-fill');
  const xpNumbers    = document.getElementById('xp-numbers');
  const questCounter = document.getElementById('quest-counter');
  const interactionPrompt      = document.getElementById('interaction-prompt');
  const floatingTextContainer  = document.getElementById('floating-text-container');
  const hudAvatarCanvas        = document.getElementById('hud-avatar-canvas');

  // Quiz modal
  const quizModal          = document.getElementById('quiz-modal');
  const dialogStationTitle = document.getElementById('dialog-station-title');
  const dialogNpcName      = document.getElementById('dialog-npc-name');
  const dialogNpcIcon      = document.getElementById('dialog-npc-icon');
  const dialogXpReward     = document.getElementById('dialog-xp-reward');
  const dialogXpPenalty    = document.getElementById('dialog-xp-penalty');
  const dialogStory        = document.getElementById('dialog-story');
  const dialogQuestion     = document.getElementById('dialog-question');
  const dialogOptions      = document.getElementById('dialog-options');
  const dialogFeedback     = document.getElementById('dialog-feedback');
  const feedbackAlert      = document.getElementById('feedback-alert');
  const feedbackIcon       = document.getElementById('feedback-icon');
  const feedbackTitle      = document.getElementById('feedback-title');
  const feedbackExplanation = document.getElementById('feedback-explanation');
  const btnDialogContinue  = document.getElementById('btn-dialog-continue');

  // Character modal
  const charModal       = document.getElementById('character-modal');
  const charPreviewCanvas = document.getElementById('char-preview-canvas');
  const charScaleSlider = document.getElementById('char-scale-slider');
  const charScaleValue  = document.getElementById('char-scale-value');
  const btnApplyChar    = document.getElementById('btn-apply-character');
  const btnCloseCharModal = document.getElementById('btn-close-char-modal');
  const btnOpenCharModal  = document.getElementById('btn-character-modal');
  const avatarButton      = document.getElementById('avatar-button');

  // Other modals
  const guideModal      = document.getElementById('guide-modal');
  const btnOpenGuide    = document.getElementById('btn-guide-modal');
  const btnCloseGuide   = document.getElementById('btn-close-guide-modal');
  const btnCloseGuideAck = document.getElementById('btn-close-guide-ack');
  const gameoverModal   = document.getElementById('gameover-modal');
  const btnRestart      = document.getElementById('btn-restart-game');
  const victoryModal    = document.getElementById('victory-modal');
  const btnSoundToggle  = document.getElementById('btn-sound-toggle');
  const soundIcon       = document.getElementById('sound-icon');
  const soundLabel      = document.getElementById('sound-label');

  // Touch buttons
  const btnTouchLeft     = document.getElementById('btn-touch-left');
  const btnTouchRight    = document.getElementById('btn-touch-right');
  const btnTouchJump     = document.getElementById('btn-touch-jump');
  const btnTouchInteract = document.getElementById('btn-touch-interact');


  // ═══════════════════════════════════════════════════════
  //  PRESET CHARACTER SPRITES (Vector / Canvas 2D)
  // ═══════════════════════════════════════════════════════

  // Helper: bikin gradient linear vertikal untuk kesan "3D" (highlight atas → shadow bawah)
  function shadeGrad(pCtx, x, y, w, h, baseColor, shadowColor) {
    const g = pCtx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, lighten(baseColor, 0.28));
    g.addColorStop(0.5, baseColor);
    g.addColorStop(1, shadowColor);
    return g;
  }
  function lighten(hex, amt) {
    const c = hex.replace('#', '');
    const num = parseInt(c.length === 3 ? c.split('').map(x=>x+x).join('') : c, 16);
    let r = (num >> 16) + Math.round(255 * amt);
    let g = ((num >> 8) & 0xff) + Math.round(255 * amt);
    let b = (num & 0xff) + Math.round(255 * amt);
    r = Math.min(255, r); g = Math.min(255, g); b = Math.min(255, b);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // ═══════════════════════════════════════════════════════
  //  KARAKTER SISWA SMA — digambar 100% via kode (canvas
  //  gradient shading), TANPA file gambar sama sekali.
  //  Semua karakter memakai seragam putih-abu + jas
  //  almamater biru dongker yang seragam.
  // ═══════════════════════════════════════════════════════

  function getCharPreset(idx) {
    const list = window.CHARACTER_PRESETS || [];
    return list[idx] || list[0] || { skin:'#e3a877', skinShadow:'#b97e52', hair:'#26170d', hairStyle:'short', gender:'male' };
  }

  function drawUniformCharacter(pCtx, presetIdx, width, height, frameTick, isWalking, hurt) {
    if (frameTick === undefined) frameTick = 0;
    if (isWalking === undefined) isWalking = false;
    const P = getCharPreset(presetIdx);
    const U = window.UNIFORM_COLORS;
    const cx = width / 2;
    const cy = height / 2;
    const bob = isWalking ? Math.sin(frameTick * 0.28) * 2.5 : 0;
    const legSwing = isWalking ? Math.sin(frameTick * 0.28) * 9 : 0;
    const armSwing = isWalking ? Math.sin(frameTick * 0.28 + Math.PI) * 8 : 0;

    pCtx.save();
    if (hurt) pCtx.globalAlpha = 0.55;

    // Bayangan tanah
    pCtx.fillStyle = 'rgba(0,0,0,0.32)';
    pCtx.beginPath(); pCtx.ellipse(cx, height - 4, width*0.30, 5, 0, 0, Math.PI*2); pCtx.fill();

    // ── Kaki (celana / rok abu-abu) ──
    pCtx.fillStyle = shadeGrad(pCtx, cx-14, cy+10, 28, height-cy-14, U.pants, U.pantsShadow);
    pCtx.save();
    pCtx.translate(cx-7, cy+12); pCtx.rotate(legSwing*0.03);
    pCtx.fillRect(-4, 0, 8, height-cy-16+bob);
    pCtx.restore();
    pCtx.save();
    pCtx.translate(cx+7, cy+12); pCtx.rotate(-legSwing*0.03);
    pCtx.fillRect(-4, 0, 8, height-cy-16-bob);
    pCtx.restore();

    // Sepatu
    pCtx.fillStyle = U.shoes;
    pCtx.fillRect(cx-11, height-8, 10, 6);
    pCtx.fillRect(cx+1,  height-8, 10, 6);

    // ── Badan: kemeja putih ──
    const bodyY = cy - 20 + bob;
    pCtx.fillStyle = shadeGrad(pCtx, cx-16, bodyY, 32, 30, U.shirt, U.shirtShadow);
    pCtx.beginPath();
    pCtx.roundRect(cx-15, bodyY, 30, 30, 6);
    pCtx.fill();

    // ── Jas almamater biru dongker (terbuka di depan) ──
    pCtx.fillStyle = shadeGrad(pCtx, cx-17, bodyY-2, 15, 34, U.blazer, U.blazerShadow);
    pCtx.beginPath();
    pCtx.moveTo(cx-17, bodyY-2);
    pCtx.lineTo(cx-3, bodyY-2);
    pCtx.lineTo(cx-6, bodyY+30);
    pCtx.lineTo(cx-19, bodyY+30);
    pCtx.closePath(); pCtx.fill();

    pCtx.fillStyle = shadeGrad(pCtx, cx+3, bodyY-2, 15, 34, U.blazer, U.blazerShadow);
    pCtx.beginPath();
    pCtx.moveTo(cx+17, bodyY-2);
    pCtx.lineTo(cx+3, bodyY-2);
    pCtx.lineTo(cx+6, bodyY+30);
    pCtx.lineTo(cx+19, bodyY+30);
    pCtx.closePath(); pCtx.fill();

    // Kerah jas
    pCtx.fillStyle = U.blazerHi;
    pCtx.beginPath();
    pCtx.moveTo(cx-3, bodyY-2); pCtx.lineTo(cx-9, bodyY+6); pCtx.lineTo(cx-2, bodyY+4);
    pCtx.closePath(); pCtx.fill();
    pCtx.beginPath();
    pCtx.moveTo(cx+3, bodyY-2); pCtx.lineTo(cx+9, bodyY+6); pCtx.lineTo(cx+2, bodyY+4);
    pCtx.closePath(); pCtx.fill();

    // Lencana / badge dada (identitas sekolah)
    pCtx.fillStyle = U.badge;
    pCtx.beginPath(); pCtx.arc(cx-9, bodyY+10, 2.4, 0, Math.PI*2); pCtx.fill();

    // Dasi kecil
    pCtx.fillStyle = '#c0392b';
    pCtx.beginPath();
    pCtx.moveTo(cx, bodyY+2); pCtx.lineTo(cx-3, bodyY+9); pCtx.lineTo(cx, bodyY+14); pCtx.lineTo(cx+3, bodyY+9);
    pCtx.closePath(); pCtx.fill();

    // ── Lengan jas ──
    pCtx.save();
    pCtx.translate(cx-16, bodyY+4); pCtx.rotate(armSwing*0.025);
    pCtx.fillStyle = shadeGrad(pCtx, -4, 0, 8, 20, U.blazer, U.blazerShadow);
    pCtx.beginPath(); pCtx.roundRect(-4, 0, 8, 20, 4); pCtx.fill();
    pCtx.fillStyle = P.skin;
    pCtx.beginPath(); pCtx.arc(0, 21, 4, 0, Math.PI*2); pCtx.fill();
    pCtx.restore();

    pCtx.save();
    pCtx.translate(cx+16, bodyY+4); pCtx.rotate(-armSwing*0.025);
    pCtx.fillStyle = shadeGrad(pCtx, -4, 0, 8, 20, U.blazer, U.blazerShadow);
    pCtx.beginPath(); pCtx.roundRect(-4, 0, 8, 20, 4); pCtx.fill();
    pCtx.fillStyle = P.skin;
    pCtx.beginPath(); pCtx.arc(0, 21, 4, 0, Math.PI*2); pCtx.fill();
    pCtx.restore();

    // ── Kepala ──
    const headY = bodyY - 13;
    pCtx.fillStyle = shadeGrad(pCtx, cx-9, headY-9, 18, 18, P.skin, P.skinShadow);
    pCtx.beginPath(); pCtx.arc(cx, headY, 9, 0, Math.PI*2); pCtx.fill();

    // Rambut / hijab sesuai varian
    pCtx.fillStyle = shadeGrad(pCtx, cx-10, headY-13, 20, 12, P.hair, '#000000');
    if (P.hairStyle === 'hijab') {
      pCtx.beginPath();
      pCtx.moveTo(cx-11, headY+9);
      pCtx.quadraticCurveTo(cx-13, headY-12, cx, headY-13);
      pCtx.quadraticCurveTo(cx+13, headY-12, cx+11, headY+9);
      pCtx.quadraticCurveTo(cx, headY+2, cx-11, headY+9);
      pCtx.closePath(); pCtx.fill();
    } else if (P.hairStyle === 'ponytail') {
      pCtx.beginPath(); pCtx.arc(cx, headY-3, 9.5, Math.PI, 0, false); pCtx.fill();
      pCtx.beginPath(); pCtx.ellipse(cx+10, headY+2, 3, 8, 0.5, 0, Math.PI*2); pCtx.fill();
    } else if (P.hairStyle === 'spiky') {
      pCtx.beginPath();
      pCtx.moveTo(cx-9, headY-4);
      for (let i=-9;i<=9;i+=4.5) { pCtx.lineTo(i+cx, headY-13-((i/9)%2===0?4:0)); }
      pCtx.lineTo(cx+9, headY-4);
      pCtx.quadraticCurveTo(cx, headY-14, cx-9, headY-4);
      pCtx.fill();
    } else { // short
      pCtx.beginPath(); pCtx.arc(cx, headY-2, 9.3, Math.PI, 0, false); pCtx.fill();
    }

    // Wajah sederhana
    pCtx.fillStyle = '#2a2016';
    pCtx.beginPath(); pCtx.arc(cx-3, headY+1, 1, 0, Math.PI*2); pCtx.fill();
    pCtx.beginPath(); pCtx.arc(cx+3, headY+1, 1, 0, Math.PI*2); pCtx.fill();
    pCtx.strokeStyle = '#2a2016'; pCtx.lineWidth = 1;
    pCtx.beginPath(); pCtx.arc(cx, headY+3, 2.5, 0.15*Math.PI, 0.85*Math.PI); pCtx.stroke();

    pCtx.restore();
  }

  // Dipakai oleh player & preview: gambar karakter sesuai variant terpilih
  function drawCharacterToCanvas(destCtx, dX, dY, dW, dH, frameTick, isWalking, presetIdx) {
    if (presetIdx === undefined) presetIdx = 0;
    const tmp = document.createElement('canvas');
    tmp.width = 64; tmp.height = 76;
    drawUniformCharacter(tmp.getContext('2d'), presetIdx, 64, 76, frameTick, isWalking, false);
    destCtx.drawImage(tmp, dX - 6, dY - 10, dW + 12, dH + 14);
  }


  // ═══════════════════════════════════════════════════════
  //  PLAYER
  // ═══════════════════════════════════════════════════════

  const player = {
    x: 100,
    y: GROUND_Y - 64,
    width: 56,
    height: 64,
    vx: 0,
    vy: 0,
    speed: 5.0,
    jumpStrength: -13.5,
    gravity: 0.65,
    grounded: false,
    facingRight: true,
    frameTick: 0,
    isMoving: false,

    update() {
      this.vx = 0;
      if (!isPaused && !isQuizActive) {
        if (keys.left) {
          this.vx = -this.speed;
          this.facingRight = false;
          this.isMoving = true;
        } else if (keys.right) {
          this.vx = this.speed;
          this.facingRight = true;
          this.isMoving = true;
        } else {
          this.isMoving = false;
        }

        if (keys.jump && this.grounded) {
          this.vy = this.jumpStrength;
          this.grounded = false;
          window.soundEngine.play('jump');
          createDustParticles(this.x + this.width / 2, this.y + this.height, 8);
        }
      } else {
        this.isMoving = false;
      }

      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 20) this.x = 20;
      if (this.x > WORLD_WIDTH - 80) this.x = WORLD_WIDTH - 80;

      if (this.y + this.height >= GROUND_Y) {
        this.y = GROUND_Y - this.height;
        this.vy = 0;
        this.grounded = true;
      }

      if (this.isMoving) {
        this.frameTick++;
        if (this.frameTick % 16 === 0 && this.grounded) {
          window.soundEngine.play('step');
          createDustParticles(this.x + (this.facingRight ? 10 : this.width - 10), this.y + this.height, 2);
        }
      } else {
        this.frameTick = 0;
      }
    },

    draw(renderCtx) {
      renderCtx.save();
      const drawX = this.x - cameraX;
      const drawY = this.y;

      renderCtx.translate(drawX + this.width / 2, drawY + this.height / 2);
      if (!this.facingRight) renderCtx.scale(-1, 1);
      renderCtx.scale(playerScale, playerScale);

      const isHurtFlashing = Date.now() < playerInvincibleUntil && Math.floor(Date.now() / 90) % 2 === 0;

      drawUniformCharacter(
        renderCtx,
        selectedCharIndex,  // gunakan karakter yang dipilih pemain
        this.width,
        this.height,
        this.frameTick,
        this.isMoving,
        isHurtFlashing
      );

      renderCtx.restore();
    }
  };


  // ═══════════════════════════════════════════════════════
  //  MONSTERS (RINTANGAN)
  //  Menyentuh monster mengurangi XP sedikit (lebih ringan
  //  daripada salah jawab kuis), lalu pemain kebal sejenak.
  // ═══════════════════════════════════════════════════════

  const monsters = [
    { id:1, kind:'slime', x:380,  minX:320,  maxX:520,  width:38, height:30, speed:1.3, dir:1  },
    { id:2, kind:'bat',   x:980,  minX:900,  maxX:1220, width:36, height:26, speed:2.0, dir:-1, floatBase:GROUND_Y-90 },
    { id:3, kind:'slime', x:1680, minX:1600, maxX:1880, width:42, height:32, speed:1.5, dir:1  },
    { id:4, kind:'bat',   x:2380, minX:2300, maxX:2620, width:36, height:26, speed:2.2, dir:-1, floatBase:GROUND_Y-110 },
    { id:5, kind:'slime', x:3080, minX:3000, maxX:3300, width:44, height:34, speed:1.7, dir:1  }
  ];

  function updateMonsters() {
    if (isPaused || isQuizActive) return;
    monsters.forEach(m => {
      m.x += m.speed * m.dir;
      if (m.x < m.minX) { m.x = m.minX; m.dir = 1; }
      if (m.x > m.maxX) { m.x = m.maxX; m.dir = -1; }
    });
  }

  function drawMonster(mCtx, m) {
    const time = Date.now() * 0.004;
    const mx = m.x - cameraX;
    if (mx < -80 || mx > CANVAS_WIDTH + 80) return;

    mCtx.save();
    if (m.kind === 'slime') {
      const my = GROUND_Y - m.height + Math.abs(Math.sin(time + m.id)) * 4;
      mCtx.fillStyle = 'rgba(0,0,0,0.3)';
      mCtx.beginPath(); mCtx.ellipse(mx+m.width/2, GROUND_Y-3, m.width*0.42, 5, 0, 0, Math.PI*2); mCtx.fill();

      const grad = mCtx.createLinearGradient(mx, my, mx, my+m.height);
      grad.addColorStop(0, '#9b5de5');
      grad.addColorStop(1, '#5a189a');
      mCtx.fillStyle = grad;
      mCtx.beginPath();
      mCtx.moveTo(mx, my+m.height);
      mCtx.quadraticCurveTo(mx, my, mx+m.width/2, my);
      mCtx.quadraticCurveTo(mx+m.width, my, mx+m.width, my+m.height);
      mCtx.closePath(); mCtx.fill();

      mCtx.fillStyle = '#fff';
      mCtx.beginPath(); mCtx.arc(mx+m.width*0.35, my+m.height*0.55, 4, 0, Math.PI*2); mCtx.fill();
      mCtx.beginPath(); mCtx.arc(mx+m.width*0.65, my+m.height*0.55, 4, 0, Math.PI*2); mCtx.fill();
      mCtx.fillStyle = '#1a0826';
      mCtx.beginPath(); mCtx.arc(mx+m.width*0.35, my+m.height*0.55, 2, 0, Math.PI*2); mCtx.fill();
      mCtx.beginPath(); mCtx.arc(mx+m.width*0.65, my+m.height*0.55, 2, 0, Math.PI*2); mCtx.fill();
    } else { // bat
      const my = (m.floatBase || GROUND_Y-100) + Math.sin(time*2 + m.id) * 14;
      const wingFlap = Math.sin(time*10 + m.id) * 10;
      const grad = mCtx.createLinearGradient(mx, my-10, mx, my+10);
      grad.addColorStop(0, '#4a4a6a');
      grad.addColorStop(1, '#20202e');
      mCtx.fillStyle = grad;
      mCtx.beginPath(); mCtx.ellipse(mx+m.width/2, my, m.width*0.28, m.height*0.35, 0, 0, Math.PI*2); mCtx.fill();
      mCtx.beginPath();
      mCtx.moveTo(mx+m.width/2, my);
      mCtx.quadraticCurveTo(mx-6, my-wingFlap, mx-16, my-4);
      mCtx.quadraticCurveTo(mx-4, my+2, mx+m.width/2, my+4);
      mCtx.fill();
      mCtx.beginPath();
      mCtx.moveTo(mx+m.width/2, my);
      mCtx.quadraticCurveTo(mx+m.width+6, my-wingFlap, mx+m.width+16, my-4);
      mCtx.quadraticCurveTo(mx+m.width+4, my+2, mx+m.width/2, my+4);
      mCtx.fill();
      mCtx.fillStyle = '#ff4757';
      mCtx.beginPath(); mCtx.arc(mx+m.width/2-3, my-2, 1.4, 0, Math.PI*2); mCtx.fill();
      mCtx.beginPath(); mCtx.arc(mx+m.width/2+3, my-2, 1.4, 0, Math.PI*2); mCtx.fill();
    }
    mCtx.restore();
  }

  function getMonsterBounds(m) {
    if (m.kind === 'bat') {
      const time = Date.now() * 0.004;
      const my = (m.floatBase || GROUND_Y-100) + Math.sin(time*2 + m.id) * 14;
      return { x: m.x, y: my - m.height/2, w: m.width, h: m.height };
    }
    const time = Date.now() * 0.004;
    const my = GROUND_Y - m.height + Math.abs(Math.sin(time + m.id)) * 4;
    return { x: m.x, y: my, w: m.width, h: m.height };
  }

  function checkMonsterCollisions() {
    if (isPaused || isQuizActive) return;
    if (Date.now() < playerInvincibleUntil) return;

    for (const m of monsters) {
      const b = getMonsterBounds(m);
      const overlap =
        player.x < b.x + b.w &&
        player.x + player.width > b.x &&
        player.y < b.y + b.h &&
        player.y + player.height > b.y;

      if (overlap) {
        totalMonsterHits++;
        updateXP(-MONSTER_DAMAGE);
        triggerFloatingText('-' + MONSTER_DAMAGE + ' XP!', false);
        window.soundEngine.play('hit');
        triggerScreenShake();
        playerInvincibleUntil = Date.now() + MONSTER_INVINCIBLE_MS;
        // Sedikit dorongan menjauh dari monster
        player.vx = (player.x + player.width/2 < b.x + b.w/2) ? -4 : 4;
        player.vy = -5;
        break;
      }
    }
  }


  // ═══════════════════════════════════════════════════════
  //  STATIONS (QUIZ POINTS)
  // ═══════════════════════════════════════════════════════

  const stations = [
    { id:1, x:650,  width:80, height:100, type:'runestone', title:'Gerbang Pengetahuan I',     npcName:'Penjaga Gerbang Eldoria', npcIcon:'🧙‍♂️', answered:false },
    { id:2, x:1350, width:80, height:110, type:'crystal',   title:'Monolit Kristal Kuno',       npcName:'Roh Kristal Biru',        npcIcon:'💎',  answered:false },
    { id:3, x:2050, width:90, height:120, type:'tree',      title:'Pustaka Pohon Ajaib',         npcName:'Kakek Pohon Bijak',       npcIcon:'🌳',  answered:false },
    { id:4, x:2750, width:85, height:115, type:'alchemy',   title:'Menara Alkemis Bayangan',     npcName:'Penyihir Alkemis',        npcIcon:'🧪',  answered:false },
    { id:5, x:3450, width:100,height:130, type:'dragon',    title:'Altar Sang Naga Perak',        npcName:'Naga Penjaga Pusaka',     npcIcon:'🐉',  answered:false }
  ];

  const victoryPortal = { x: 3780, width: 90, height: 140 };


  // ═══════════════════════════════════════════════════════
  //  WORLD RENDERING
  // ═══════════════════════════════════════════════════════

  function drawStation(sCtx, station) {
    const sx = station.x - cameraX;
    const sy = GROUND_Y - station.height;
    const time = Date.now() * 0.003;
    const floatOffset = Math.sin(time + station.id) * 5;

    sCtx.save();
    sCtx.shadowColor = station.answered ? '#00e676' : '#f4c430';
    sCtx.shadowBlur  = station.answered ? 20 : 15;

    switch (station.type) {
      case 'runestone': {
        sCtx.fillStyle = '#4a5568';
        sCtx.beginPath();
        sCtx.roundRect(sx+15, sy+15, 50, station.height-15, [16,16,4,4]);
        sCtx.fill();
        sCtx.fillStyle = station.answered ? '#00e676' : '#63b3ed';
        sCtx.fillRect(sx+30, sy+35, 20, 4);
        sCtx.fillRect(sx+38, sy+45, 12, 4);
        sCtx.fillRect(sx+25, sy+55, 25, 4);
        sCtx.fillRect(sx+32, sy+65, 16, 4);
        break;
      }
      case 'crystal': {
        sCtx.fillStyle = station.answered ? '#2ecc71' : '#00b0ff';
        sCtx.beginPath();
        sCtx.moveTo(sx+40, sy+10+floatOffset);
        sCtx.lineTo(sx+65, sy+60+floatOffset);
        sCtx.lineTo(sx+40, sy+95+floatOffset);
        sCtx.lineTo(sx+15, sy+60+floatOffset);
        sCtx.closePath(); sCtx.fill();
        sCtx.fillStyle = '#2d3748';
        sCtx.fillRect(sx+20, sy+90, 40, 20);
        break;
      }
      case 'tree': {
        sCtx.fillStyle = '#5c4033';
        sCtx.fillRect(sx+30, sy+40, 28, station.height-40);
        sCtx.fillStyle = station.answered ? '#27ae60' : '#1e8449';
        sCtx.beginPath(); sCtx.arc(sx+44, sy+35, 40, 0, Math.PI*2); sCtx.fill();
        sCtx.fillStyle = station.answered ? '#f1c40f' : '#e67e22';
        sCtx.fillRect(sx+15, sy+45, 10, 14);
        break;
      }
      case 'alchemy': {
        sCtx.fillStyle = '#212f3d';
        sCtx.beginPath(); sCtx.arc(sx+42, sy+70, 30, 0, Math.PI); sCtx.fill();
        sCtx.fillStyle = station.answered ? '#00e676' : '#9b59b6';
        sCtx.beginPath(); sCtx.arc(sx+42, sy+65+floatOffset*0.5, 20, 0, Math.PI*2); sCtx.fill();
        break;
      }
      case 'dragon': {
        sCtx.fillStyle = '#7f8c8d';
        sCtx.fillRect(sx+15, sy+60, 70, station.height-60);
        sCtx.fillStyle = station.answered ? '#2ecc71' : '#f4c430';
        sCtx.beginPath();
        sCtx.moveTo(sx+50, sy+20+floatOffset);
        sCtx.lineTo(sx+75, sy+55+floatOffset);
        sCtx.lineTo(sx+25, sy+55+floatOffset);
        sCtx.closePath(); sCtx.fill();
        break;
      }
    }

    sCtx.shadowBlur = 0;
    const badgeY = sy - 15 + floatOffset;
    sCtx.fillStyle = station.answered ? 'rgba(0,230,118,0.9)' : 'rgba(244,196,48,0.9)';
    sCtx.beginPath(); sCtx.roundRect(sx+10, badgeY, 60, 20, 10); sCtx.fill();
    sCtx.fillStyle = '#0a0d18';
    sCtx.font = 'bold 10px Outfit, sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText(station.answered ? 'SELESAI' : 'KUIS RPG', sx+40, badgeY+14);
    sCtx.restore();
  }

  function drawVictoryPortal(pCtx) {
    const px = victoryPortal.x - cameraX;
    const py = GROUND_Y - victoryPortal.height;
    const time = Date.now() * 0.003;

    pCtx.save();
    pCtx.fillStyle = '#d4af37';
    pCtx.fillRect(px, py, 20, victoryPortal.height);
    pCtx.fillRect(px + victoryPortal.width - 20, py, 20, victoryPortal.height);
    pCtx.fillRect(px, py, victoryPortal.width, 24);

    const allAnswered = stations.every(s => s.answered);
    const grad = pCtx.createRadialGradient(px+45, py+70, 5, px+45, py+70, 45);
    if (allAnswered) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#f4c430');
      grad.addColorStop(1, 'rgba(255,215,0,0)');
    } else {
      grad.addColorStop(0, '#4a5568');
      grad.addColorStop(1, 'rgba(45,55,72,0)');
    }
    pCtx.fillStyle = grad;
    pCtx.beginPath();
    pCtx.ellipse(px+45, py+75, 30+Math.sin(time)*3, 50, 0, 0, Math.PI*2);
    pCtx.fill();

    pCtx.fillStyle = allAnswered ? '#ffd700' : '#a0aec0';
    pCtx.font = 'bold 12px Cinzel, serif';
    pCtx.textAlign = 'center';
    pCtx.fillText(allAnswered ? 'GERBANG KEMENANGAN' : 'SELESAIKAN SEMUA KUIS', px+45, py-12);
    pCtx.restore();
  }

  function drawBackground(bgCtx) {
    const skyGrad = bgCtx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0, '#090d20');
    skyGrad.addColorStop(0.6, '#17224d');
    skyGrad.addColorStop(1, '#2c3e6b');
    bgCtx.fillStyle = skyGrad;
    bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    bgCtx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137.5) - cameraX * 0.05) % CANVAS_WIDTH;
      const fx = sx < 0 ? sx + CANVAS_WIDTH : sx;
      const sy = (i * 47) % (GROUND_Y - 150);
      const r  = (i % 3 === 0) ? 1.5 : 1;
      bgCtx.globalAlpha = 0.4 + 0.5 * Math.sin(Date.now() * 0.002 + i);
      bgCtx.beginPath(); bgCtx.arc(fx, sy, r, 0, Math.PI*2); bgCtx.fill();
    }
    bgCtx.globalAlpha = 1.0;

    bgCtx.fillStyle = '#182042';
    bgCtx.beginPath(); bgCtx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= CANVAS_WIDTH; x += 60) {
      const wx = x + cameraX * 0.1;
      const my = GROUND_Y - 180 - Math.sin(wx * 0.003) * 60 - Math.cos(wx * 0.007) * 40;
      bgCtx.lineTo(x, my);
    }
    bgCtx.lineTo(CANVAS_WIDTH, GROUND_Y); bgCtx.closePath(); bgCtx.fill();

    bgCtx.fillStyle = '#1c2850';
    bgCtx.beginPath(); bgCtx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
      const wx = x + cameraX * 0.25;
      bgCtx.lineTo(x, GROUND_Y - 90 - Math.sin(wx * 0.008) * 35);
    }
    bgCtx.lineTo(CANVAS_WIDTH, GROUND_Y); bgCtx.closePath(); bgCtx.fill();

    bgCtx.fillStyle = '#1a1f33';
    bgCtx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    bgCtx.fillStyle = '#1b4d3e';
    bgCtx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 10);
    bgCtx.fillStyle = '#2ecc71';
    bgCtx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 3);
    bgCtx.fillStyle = '#2d3748';
    for (let x = -(cameraX % 60); x < CANVAS_WIDTH; x += 60) {
      bgCtx.beginPath(); bgCtx.roundRect(x, GROUND_Y+12, 45, 12, 4); bgCtx.fill();
    }
  }


  // ═══════════════════════════════════════════════════════
  //  PARTICLE EFFECTS
  // ═══════════════════════════════════════════════════════

  function createDustParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y: y - 2,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 1.5,
        radius: Math.random() * 3 + 1,
        alpha: 0.6, color: '#a0aec0', life: 20
      });
    }
  }

  function createSparkleParticles(x, y, count, color) {
    color = color || '#ffd700';
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 4 - 1,
        radius: Math.random() * 4 + 2,
        alpha: 1.0, color, life: 35
      });
    }
  }

  function updateAndDrawParticles(pCtx) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.alpha -= 1 / p.life;
      if (p.alpha <= 0) { particles.splice(i, 1); continue; }
      pCtx.save();
      pCtx.globalAlpha = Math.max(0, p.alpha);
      pCtx.fillStyle = p.color;
      pCtx.beginPath(); pCtx.arc(p.x - cameraX, p.y, p.radius, 0, Math.PI*2); pCtx.fill();
      pCtx.restore();
    }
  }


  // ═══════════════════════════════════════════════════════
  //  FLOATING TEXT (+XP / -XP)
  // ═══════════════════════════════════════════════════════

  function triggerFloatingText(text, isGain) {
    const el = document.createElement('div');
    el.className = 'floating-text ' + (isGain ? 'floating-gain' : 'floating-loss');
    el.innerText = text;

    const canvasRect    = canvas.getBoundingClientRect();
    const containerRect = canvas.parentElement.getBoundingClientRect();
    const scaleX = canvasRect.width  / CANVAS_WIDTH;
    const scaleY = canvasRect.height / CANVAS_HEIGHT;

    const px = (canvasRect.left - containerRect.left) + (player.x + player.width / 2 - cameraX) * scaleX;
    const py = (canvasRect.top  - containerRect.top)  + (player.y - 10) * scaleY;

    el.style.left = px + 'px';
    el.style.top  = py + 'px';

    floatingTextContainer.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1300);
  }


  // ═══════════════════════════════════════════════════════
  //  SCREEN SHAKE
  // ═══════════════════════════════════════════════════════

  function triggerScreenShake() {
    const container = document.getElementById('canvas-container');
    container.classList.remove('shake-screen');
    void container.offsetWidth;
    container.classList.add('shake-screen');
    setTimeout(() => container.classList.remove('shake-screen'), 450);
  }


  // ═══════════════════════════════════════════════════════
  //  XP & HUD UPDATE
  // ═══════════════════════════════════════════════════════

  function updateXP(amount) {
    playerXP += amount;
    if (playerXP > MAX_XP) playerXP = MAX_XP;
    if (playerXP < 0) playerXP = 0;

    const pct = (playerXP / MAX_XP) * 100;
    xpBarFill.style.width = pct + '%';
    xpNumbers.innerText   = playerXP + ' / ' + MAX_XP + ' XP';

    if (pct <= 25) xpBarFill.classList.add('danger');
    else           xpBarFill.classList.remove('danger');

    if (playerXP <= 0) setTimeout(triggerGameOver, 500);
  }

  function updateQuestHUD() {
    const done = stations.filter(s => s.answered).length;
    questCounter.innerText = done + ' / ' + stations.length + ' Pos';
  }


  // ═══════════════════════════════════════════════════════
  //  INTERACTION DETECTION
  // ═══════════════════════════════════════════════════════

  function checkInteractions() {
    if (isQuizActive || isPaused) {
      interactionPrompt.classList.add('hidden');
      return;
    }

    const playerCenterX = player.x + player.width / 2;
    let nearStation = null;

    for (const station of stations) {
      if (station.answered) continue; // pos yang sudah dijawab tidak bisa dikerjakan lagi
      const stationCenterX = station.x + station.width / 2;
      if (Math.abs(playerCenterX - stationCenterX) < 90) {
        nearStation = station;
        break;
      }
    }

    if (nearStation) {
      activeStation = nearStation;
      interactionPrompt.classList.remove('hidden');

      const canvasRect    = canvas.getBoundingClientRect();
      const containerRect = canvas.parentElement.getBoundingClientRect();
      const scaleX = canvasRect.width  / CANVAS_WIDTH;
      const scaleY = canvasRect.height / CANVAS_HEIGHT;

      const sx = (canvasRect.left - containerRect.left) + (nearStation.x + nearStation.width/2 - cameraX) * scaleX;
      const sy = (canvasRect.top  - containerRect.top)  + (GROUND_Y - nearStation.height - 25) * scaleY;

      interactionPrompt.style.left = sx + 'px';
      interactionPrompt.style.top  = sy + 'px';

      if (keys.interact) {
        keys.interact = false;
        openQuizDialog(nearStation);
      }
    } else {
      activeStation = null;
      interactionPrompt.classList.add('hidden');
    }

    // Check victory portal
    if (playerCenterX >= victoryPortal.x) {
      if (stations.every(s => s.answered)) triggerVictory();
    }
  }


  // ═══════════════════════════════════════════════════════
  //  QUIZ MODAL
  // ═══════════════════════════════════════════════════════

  function openQuizDialog(station) {
    if (station.answered) {
      triggerFloatingText('Pos ini sudah selesai ✓', true);
      return;
    }
    const qData = QUIZ_QUESTIONS.find(q => q.id === station.id) || QUIZ_QUESTIONS[0];
    isQuizActive = true;
    window.soundEngine.play('interact');

    dialogStationTitle.innerText = station.title;
    dialogNpcName.innerText      = station.npcName;
    dialogNpcIcon.innerText      = station.npcIcon;
    dialogXpReward.innerText     = qData.xpReward;
    dialogXpPenalty.innerText    = qData.xpPenalty;
    dialogStory.innerText        = '"' + qData.story + '"';
    dialogQuestion.innerText     = qData.question;

    dialogFeedback.classList.add('hidden');
    dialogOptions.innerHTML = '';

    const optionKeys = ['A','B','C','D'];
    qData.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = '<span class="option-key">' + optionKeys[idx] + '</span><span class="option-text">' + optText + '</span>';
      btn.addEventListener('click', () => handleAnswerSelected(station, qData, idx, btn));
      dialogOptions.appendChild(btn);
    });

    quizModal.classList.remove('hidden');
  }

  function handleAnswerSelected(station, qData, selectedIdx, clickedBtn) {
    const allBtns = dialogOptions.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);

    totalAnswered++;
    const isCorrect = (selectedIdx === qData.correctIndex);

    // Pos ini dianggap SELESAI setelah dijawab, baik benar maupun salah —
    // supaya pemain tetap bisa lanjut ke gerbang & finish walau ada
    // jawaban yang meleset (XP tetap berkurang untuk jawaban salah).
    station.answered = true;

    if (isCorrect) {
      clickedBtn.classList.add('correct');
      totalCorrect++;
      updateXP(qData.xpReward);
      triggerFloatingText('+' + qData.xpReward + ' XP!', true);
      createSparkleParticles(player.x + player.width/2, player.y + player.height/2, 25, '#00e676');
      window.soundEngine.play('correct');
      feedbackAlert.className    = 'feedback-alert';
      feedbackIcon.innerText     = '🎉';
      feedbackTitle.innerText    = 'Jawaban Tepat Sekali!';
      feedbackExplanation.innerText = qData.explanation;
    } else {
      clickedBtn.classList.add('wrong');
      allBtns[qData.correctIndex].classList.add('correct');
      updateXP(-qData.xpPenalty);
      triggerFloatingText('-' + qData.xpPenalty + ' XP!', false);
      triggerScreenShake();
      window.soundEngine.play('wrong');
      feedbackAlert.className    = 'feedback-alert wrong';
      feedbackIcon.innerText     = '⚠️';
      feedbackTitle.innerText    = 'Belum Tepat!';
      feedbackExplanation.innerText = qData.explanation;
    }

    updateQuestHUD();
    dialogFeedback.classList.remove('hidden');
  }

  btnDialogContinue.addEventListener('click', () => {
    quizModal.classList.add('hidden');
    isQuizActive = false;
  });

  interactionPrompt.addEventListener('click', () => {
    if (activeStation && !isQuizActive && !isPaused) openQuizDialog(activeStation);
  });


  // ═══════════════════════════════════════════════════════
  //  GAME OVER & VICTORY
  // ═══════════════════════════════════════════════════════

  function triggerGameOver() {
    isPaused = true;
    quizModal.classList.add('hidden');
    window.soundEngine.play('gameover');
    const done = stations.filter(s => s.answered).length;
    document.getElementById('gameover-answered').innerText = done + ' / ' + stations.length;
    gameoverModal.classList.remove('hidden');
  }

  btnRestart.addEventListener('click', () => {
    gameoverModal.classList.add('hidden');
    playerXP = MAX_XP;
    updateXP(0);
    player.x = 100;
    player.y = GROUND_Y - player.height;
    player.vx = player.vy = 0;
    isPaused = false;
    isQuizActive = false;
    gameStartTime = Date.now();
  });

  function triggerVictory() {
    isPaused = true;
    window.soundEngine.play('win');
    document.getElementById('victory-xp').innerText = playerXP + ' / ' + MAX_XP + ' XP';
    const acc = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 100;
    document.getElementById('victory-accuracy').innerText = acc + '%';
    createSparkleParticles(victoryPortal.x + 45, GROUND_Y - 70, 50, '#f4c430');
    resetSubmitScoreUI(acc);
    victoryModal.classList.remove('hidden');
  }

  // ═══════════════════════════════════════════════════════
  //  PAPAN PERINGKAT (LEADERBOARD)
  // ═══════════════════════════════════════════════════════

  const leaderboardListEl   = document.getElementById('leaderboard-list');
  const leaderboardStatusEl = document.getElementById('leaderboard-status');
  const leaderboardPanelEl  = document.getElementById('leaderboard-panel');
  const submitScoreSection  = document.getElementById('submit-score-section');
  const btnSubmitScore      = document.getElementById('btn-submit-score');
  const leaderboardModal    = document.getElementById('leaderboard-modal');
  const leaderboardModalList = document.getElementById('leaderboard-modal-list');
  const btnOpenLeaderboard  = document.getElementById('btn-leaderboard-modal');
  const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard-modal');

  let pendingAccuracy = 100;

  function resetSubmitScoreUI(acc) {
    pendingAccuracy = acc;
    if (submitScoreSection) submitScoreSection.classList.remove('hidden');
    if (leaderboardPanelEl) leaderboardPanelEl.classList.add('hidden');
    if (btnSubmitScore) {
      btnSubmitScore.disabled = false;
      btnSubmitScore.innerText = '✅ Submit Skor ke Peringkat';
    }
  }

  function renderLeaderboardRows(container, list) {
    if (!container) return;
    container.innerHTML = '';
    if (!list.length) {
      const empty = document.createElement('p');
      empty.className = 'leaderboard-empty';
      empty.innerText = 'Belum ada skor. Jadilah yang pertama!';
      container.appendChild(empty);
      return;
    }
    list.forEach((entry, i) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-row' + (entry.name === playerName && i < 3 ? ' is-me' : '');
      const mins = Math.floor((entry.timeSeconds||0) / 60);
      const secs = Math.floor((entry.timeSeconds||0) % 60);
      row.innerHTML =
        '<span class="lb-rank">' + (i+1) + '</span>' +
        '<span class="lb-name">' + escapeHtml(entry.name || 'Petualang') + '</span>' +
        '<span class="lb-xp">' + Math.round(entry.xp) + ' XP</span>' +
        '<span class="lb-acc">' + Math.round(entry.accuracy) + '%</span>' +
        '<span class="lb-time">' + mins + ':' + String(secs).padStart(2,'0') + '</span>';
      container.appendChild(row);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  }

  async function submitAndShowLeaderboard(accuracy) {
    if (btnSubmitScore) {
      btnSubmitScore.disabled = true;
      btnSubmitScore.innerText = 'Mengirim…';
    }
    const timeSeconds = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;
    const entry = {
      name: playerName,
      xp: playerXP,
      accuracy: accuracy,
      correct: totalCorrect,
      total: totalAnswered,
      timeSeconds: timeSeconds
    };
    const result = await window.Leaderboard.submitScore(entry);
    const top = await window.Leaderboard.fetchTop(10);

    if (submitScoreSection) submitScoreSection.classList.add('hidden');
    if (leaderboardPanelEl) leaderboardPanelEl.classList.remove('hidden');
    renderLeaderboardRows(leaderboardListEl, top.list);
    if (leaderboardStatusEl) {
      leaderboardStatusEl.innerText = top.remote
        ? '🌐 Terkirim ke peringkat global'
        : '💾 Tersimpan di peringkat lokal (perangkat ini saja)';
    }
  }

  if (btnSubmitScore) {
    btnSubmitScore.addEventListener('click', () => submitAndShowLeaderboard(pendingAccuracy));
  }

  async function openLeaderboardModal() {
    if (!leaderboardModal) return;
    leaderboardModal.classList.remove('hidden');
    if (leaderboardModalList) leaderboardModalList.innerHTML = '<p class="leaderboard-empty">Memuat…</p>';
    const top = await window.Leaderboard.fetchTop(10);
    renderLeaderboardRows(leaderboardModalList, top.list);
  }

  if (btnOpenLeaderboard) btnOpenLeaderboard.addEventListener('click', openLeaderboardModal);
  if (btnCloseLeaderboard) btnCloseLeaderboard.addEventListener('click', () => leaderboardModal.classList.add('hidden'));

  const btnLeaderboardGameover = document.getElementById('btn-leaderboard-gameover');
  if (btnLeaderboardGameover) btnLeaderboardGameover.addEventListener('click', openLeaderboardModal);


  // ═══════════════════════════════════════════════════════
  //  CHARACTER CUSTOMIZER
  // ═══════════════════════════════════════════════════════

  function renderAllPresetMiniPreviews() {
    (window.CHARACTER_PRESETS || []).forEach((preset, idx) => {
      const pcv = document.getElementById('preset-' + preset.id);
      if (pcv) {
        const pctx = pcv.getContext('2d');
        pctx.clearRect(0,0,48,48);
        pctx.save();
        pctx.translate(24, 30);
        pctx.scale(1.15, 1.15);
        drawUniformCharacter(pctx, idx, 40, 46, 0, false, false);
        pctx.restore();
      }
    });
  }

  function updateHUDAvatar() {
    const hctx = hudAvatarCanvas.getContext('2d');
    hctx.clearRect(0, 0, 44, 44);
    hctx.save();
    hctx.translate(22, 22);
    hctx.scale(0.72, 0.72);
    drawCharacterToCanvas(hctx, -22, -26, 44, 52, 0, false, selectedCharIndex);
    hctx.restore();
  }

  function updateCharacterPreview() {
    const pctx = charPreviewCanvas.getContext('2d');
    pctx.clearRect(0, 0, 96, 96);
    pctx.save();
    pctx.translate(48, 48);
    pctx.scale(playerScale, playerScale);
    drawCharacterToCanvas(pctx, -24, -28, 48, 56, 0, false, selectedCharIndex);
    pctx.restore();
    updateHUDAvatar();
  }

  // ── Scale Slider ──
  charScaleSlider.addEventListener('input', (e) => {
    playerScale = parseFloat(e.target.value);
    charScaleValue.innerText = Math.round(playerScale * 100) + '%';
    updateCharacterPreview();
  });

  // ── Preset Cards (pilih karakter) ──
  document.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedCharIndex = parseInt(card.dataset.charIndex, 10) || 0;
      updateCharacterPreview();
      // Sinkronkan dengan kartu pilihan karakter di layar login (jika masih ada di DOM)
      document.querySelectorAll('.char-select-card').forEach(c => {
        c.classList.toggle('active', parseInt(c.dataset.index, 10) === selectedCharIndex);
      });
    });
  });

  // ── Open/Close Char Modal ──
  const openCharModal  = () => { charModal.classList.remove('hidden'); updateCharacterPreview(); };
  const closeCharModal = () => charModal.classList.add('hidden');

  btnOpenCharModal.addEventListener('click', openCharModal);
  avatarButton.addEventListener('click', openCharModal);
  btnCloseCharModal.addEventListener('click', closeCharModal);
  btnApplyChar.addEventListener('click', closeCharModal);

  // ── Guide Modal ──
  btnOpenGuide.addEventListener('click',    () => guideModal.classList.remove('hidden'));
  btnCloseGuide.addEventListener('click',   () => guideModal.classList.add('hidden'));
  btnCloseGuideAck.addEventListener('click',() => guideModal.classList.add('hidden'));

  // ── Sound Toggle ──
  btnSoundToggle.addEventListener('click', () => {
    const active = window.soundEngine.toggleMute();
    soundIcon.innerText  = active ? '🔊' : '🔇';
    soundLabel.innerText = active ? 'Suara' : 'Mute';
  });


  // ═══════════════════════════════════════════════════════
  //  KEYBOARD & TOUCH CONTROLS
  // ═══════════════════════════════════════════════════════

  window.addEventListener('keydown', (e) => {
    if (isQuizActive) {
      if (['1','2','3','4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const btns = dialogOptions.querySelectorAll('.option-btn');
        if (btns[idx] && !btns[idx].disabled) btns[idx].click();
      }
      return;
    }
    switch(e.code) {
      case 'ArrowLeft': case 'KeyA': keys.left    = true; break;
      case 'ArrowRight':case 'KeyD': keys.right   = true; break;
      case 'ArrowUp':   case 'KeyW': case 'Space': keys.jump = true; break;
      case 'KeyE':                   keys.interact = true; break;
    }
  });

  window.addEventListener('keyup', (e) => {
    switch(e.code) {
      case 'ArrowLeft': case 'KeyA': keys.left    = false; break;
      case 'ArrowRight':case 'KeyD': keys.right   = false; break;
      case 'ArrowUp':   case 'KeyW': case 'Space': keys.jump = false; break;
      case 'KeyE':                   keys.interact = false; break;
    }
  });

  function setupTouchBtn(btn, keyProp) {
    if (!btn) return;
    const on  = (e) => { e.preventDefault(); keys[keyProp] = true;  };
    const off = (e) => { e.preventDefault(); keys[keyProp] = false; };
    btn.addEventListener('touchstart', on,  { passive: false });
    btn.addEventListener('touchend',   off, { passive: false });
    btn.addEventListener('mousedown',  on);
    btn.addEventListener('mouseup',    off);
    btn.addEventListener('mouseleave', off);
  }

  setupTouchBtn(btnTouchLeft,     'left');
  setupTouchBtn(btnTouchRight,    'right');
  setupTouchBtn(btnTouchJump,     'jump');
  setupTouchBtn(btnTouchInteract, 'interact');


  // ═══════════════════════════════════════════════════════
  //  CANVAS & GAME LOOP
  // ═══════════════════════════════════════════════════════

  function resizeCanvas() {
    canvas.width  = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  }

  function gameLoop() {
    player.update();
    updateMonsters();
    checkMonsterCollisions();

    const targetCamX = player.x + player.width / 2 - CANVAS_WIDTH / 2;
    cameraX += (targetCamX - cameraX) * 0.1;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > WORLD_WIDTH - CANVAS_WIDTH) cameraX = WORLD_WIDTH - CANVAS_WIDTH;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground(ctx);
    stations.forEach(s => drawStation(ctx, s));
    drawVictoryPortal(ctx);
    monsters.forEach(m => drawMonster(ctx, m));
    updateAndDrawParticles(ctx);
    player.draw(ctx);
    checkInteractions();

    requestAnimationFrame(gameLoop);
  }


  // ═══════════════════════════════════════════════════════
  //  LOGIN SCREEN
  // ═══════════════════════════════════════════════════════

  function setupLoginScreen() {
    const loginScreen   = document.getElementById('login-screen');
    const gameWrapper   = document.getElementById('game-wrapper');
    const nameInput     = document.getElementById('player-name-input');
    const btnStart      = document.getElementById('btn-start-game');
    const loginError    = document.getElementById('login-error');
    const playerDisplay = document.getElementById('player-name-display');

    // Karakter digambar langsung via kode — tidak perlu preload gambar apa pun.
    setupCharSelectScreen();

    setTimeout(() => nameInput.focus(), 300);

    function startGame() {
      const name = nameInput.value.trim();
      if (!name) {
        loginError.classList.remove('hidden');
        nameInput.style.borderColor = '#ff4757';
        setTimeout(() => { nameInput.style.borderColor = ''; }, 1500);
        nameInput.focus();
        return;
      }

      playerName = name;
      playerDisplay.innerText = playerName;
      document.title = 'Belajar Figma – ' + playerName;

      // Animasi fade-out login
      loginScreen.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
      loginScreen.style.opacity    = '0';
      loginScreen.style.transform  = 'scale(1.04)';

      setTimeout(() => {
        loginScreen.style.display = 'none';
        gameWrapper.classList.remove('hidden');

        gameStartTime = Date.now();
        resizeCanvas();
        renderAllPresetMiniPreviews();
        charScaleSlider.value    = String(playerScale);
        charScaleValue.innerText = Math.round(playerScale * 100) + '%';
        updateCharacterPreview();
        updateXP(0);
        updateQuestHUD();
        requestAnimationFrame(gameLoop);
      }, 450);
    }

    btnStart.addEventListener('click', startGame);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startGame();
      loginError.classList.add('hidden');
    });
  }


  // ═══════════════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════
  //  LOGIN CHARACTER SELECT
  // ═══════════════════════════════════════════════════════

  function drawCharSelectPreview(index) {
    const canvas = document.getElementById('char-select-canvas-' + index);
    if (!canvas) return;
    const ctx2 = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx2.clearRect(0, 0, w, h);
    ctx2.save();
    ctx2.translate(w/2, h/2 + 6);
    ctx2.scale(1.5, 1.5);
    drawUniformCharacter(ctx2, index, 40, 46, 0, false, false);
    ctx2.restore();
  }

  function setupCharSelectScreen() {
    // Gambar semua 4 preview karakter
    for (let i = 0; i < 4; i++) {
      drawCharSelectPreview(i);
    }

    // Event click untuk setiap kartu
    document.querySelectorAll('.char-select-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.index, 10);
        selectedCharIndex = idx;

        // Update active state
        document.querySelectorAll('.char-select-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });
  }

  function init() {
    setupLoginScreen();
  }

  window.addEventListener('load', init);
  window.addEventListener('resize', resizeCanvas);

})();
