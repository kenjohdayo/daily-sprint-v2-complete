// Daily Sprint V2 - Core Game Logic
// This script implements a simple timing-based sprint game with daily missions,
// streak rewards, cosmetic trails and offline persistence.

(function () {
  'use strict';

  /*** Utility functions ***/
  function pad(num, size = 2) {
    let s = String(num);
    while (s.length < size) s = '0' + s;
    return s;
  }

  // Get current date in JST as YYYYMMDD string
  function getJSTDate() {
    const now = new Date();
    // convert local time to UTC then to JST (+9h)
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 9 * 60 * 60000);
  }

  function getTodayKey() {
    const d = getJSTDate();
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
  }

  // Local storage helper
  const STORAGE_KEY = 'dailySprintV2State';

  function loadState() {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (json) {
        return JSON.parse(json);
      }
    } catch (e) {
      console.error('Error loading state', e);
    }
    return null;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state', e);
    }
  }

  /*** Mission and cosmetic definitions ***/
  const DAILY_MISSIONS = [
    {
      id: 'M1',
      type: 'perfect',
      target: 1,
      desc: 'Perfect判定を1回出す',
      reward: { coins: 20, tickets: 0 }
    },
    {
      id: 'M2',
      type: 'streak',
      target: 3,
      desc: '連続成功を3回達成',
      reward: { coins: 30, tickets: 0 }
    },
    {
      id: 'M3',
      type: 'plays',
      target: 5,
      desc: '5回クリアする',
      reward: { coins: 0, tickets: 1 }
    }
  ];

  // Cosmetic items (trail colours). Some items require tickets instead of coins.
  const COSMETICS = [
    { id: 'T01', name: 'ネオンブルー', type: 'color', color: '#00A9E0', costCoins: 20, costTickets: 0 },
    { id: 'T02', name: 'ネオングリーン', type: 'color', color: '#00E676', costCoins: 20, costTickets: 0 },
    { id: 'T03', name: 'ネオンピンク', type: 'color', color: '#FF4081', costCoins: 20, costTickets: 0 },
    { id: 'T04', name: 'ゴールド', type: 'color', color: '#FFD700', costCoins: 50, costTickets: 0 },
    { id: 'T05', name: 'シルバー', type: 'color', color: '#C0C0C0', costCoins: 40, costTickets: 0 },
    { id: 'T06', name: 'レインボー', type: 'gradient', colors: ['#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#8A2BE2'], costCoins: 0, costTickets: 2 },
    { id: 'T07', name: 'ファイア', type: 'gradient', colors: ['#FF4500', '#FFA500', '#FFFF00'], costCoins: 0, costTickets: 1 },
    { id: 'T08', name: 'アイスブルー', type: 'color', color: '#7FDBFF', costCoins: 30, costTickets: 0 },
    { id: 'T09', name: 'パープル', type: 'color', color: '#B10DC9', costCoins: 20, costTickets: 0 },
    { id: 'T10', name: 'グリーン', type: 'color', color: '#2ECC40', costCoins: 20, costTickets: 0 },
    { id: 'T11', name: 'レッド', type: 'color', color: '#FF4136', costCoins: 20, costTickets: 0 },
    { id: 'T12', name: 'イエロー', type: 'color', color: '#FFDC00', costCoins: 20, costTickets: 0 },
    { id: 'T13', name: 'ピンク', type: 'color', color: '#F012BE', costCoins: 20, costTickets: 0 },
    { id: 'T14', name: 'アクア', type: 'color', color: '#39CCCC', costCoins: 20, costTickets: 0 },
    { id: 'T15', name: 'グレー', type: 'color', color: '#AAAAAA', costCoins: 10, costTickets: 0 },
    { id: 'T16', name: 'ブラック', type: 'color', color: '#111111', costCoins: 10, costTickets: 0 },
    { id: 'T17', name: 'ホワイト', type: 'color', color: '#FFFFFF', costCoins: 10, costTickets: 0 },
    { id: 'T18', name: 'ミント', type: 'color', color: '#01FF70', costCoins: 20, costTickets: 0 },
    { id: 'T19', name: 'ラベンダー', type: 'color', color: '#B497BD', costCoins: 20, costTickets: 0 },
    { id: 'T20', name: 'ブロンズ', type: 'color', color: '#CD7F32', costCoins: 30, costTickets: 0 }
  ];

  /*** Game constants ***/
  const TARGET_TIME = 10.0; // seconds: ideal sprint duration
  const PERFECT_THRESHOLD = 0.05; // within 0.05s of target
  const GREAT_THRESHOLD = 0.15;
  const GOOD_THRESHOLD = 0.30;
  const NEARMISS_THRESHOLD = 0.60;

  // Reward values for each judgement
  const REWARD_PERFECT = { coins: 15, tickets: 1 };
  const REWARD_GREAT = { coins: 10, tickets: 0 };
  const REWARD_GOOD = { coins: 5, tickets: 0 };

  // Streak multiplier: each consecutive success adds 10% up to 100%
  function streakMultiplier(streak) {
    return 1 + Math.min(streak, 10) * 0.10;
  }

  /*** State initialization ***/
  let state = loadState();
  const todayKey = getTodayKey();
  if (!state) {
    state = {
      coins: 0,
      tickets: 0,
      owned: ['default'],
      selectedCosmetic: 'default',
      today: todayKey,
      bestTimeToday: null,
      bestTimeAll: null,
      streak: 0,
      bestStreak: 0,
      streakShieldUsed: false,
      missions: JSON.parse(JSON.stringify(DAILY_MISSIONS)),
      logs: {}
    };
  } else {
    // date rollover: if saved state is from previous day, reset daily stats and missions
    if (state.today !== todayKey) {
      state.today = todayKey;
      state.bestTimeToday = null;
      state.streak = 0;
      state.streakShieldUsed = false;
      state.missions = JSON.parse(JSON.stringify(DAILY_MISSIONS));
    }
  }

  // Ensure logs contain entry for today
  if (!state.logs[todayKey]) {
    state.logs[todayKey] = { plays: 0, clears: 0, perfects: 0, totalTime: 0, sessions: 0, lastSession: null };
  }

  // Save initial state
  saveState();

  /*** DOM References ***/
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const resultCanvas = document.getElementById('resultCanvas');
  const rctx = resultCanvas.getContext('2d');

  const startScreen = document.getElementById('startScreen');
  const resultScreen = document.getElementById('resultScreen');
  const cosmeticScreen = document.getElementById('cosmeticScreen');

  const coinDisplay = document.getElementById('coin-display');
  const ticketDisplay = document.getElementById('ticket-display');
  const streakDisplay = document.getElementById('streak-display');
  const missionSummary = document.getElementById('mission-summary');
  const dailyInfo = document.getElementById('daily-info');
  const bestTodayEl = document.getElementById('best-today');
  const bestAllEl = document.getElementById('best-all');

  // Buttons
  const startButton = document.getElementById('startButton');
  const retryButton = document.getElementById('retryButton');
  const saveButton = document.getElementById('saveButton');
  const customizeButton = document.getElementById('customizeButton');
  const closeCosmeticButton = document.getElementById('closeCosmetic');

  // Cosmetic list container
  const cosmeticList = document.getElementById('cosmetic-list');

  /*** Canvas size setup ***/
  let dpr = window.devicePixelRatio || 1;

  function resizeCanvas() {
    // match canvas size to displayed size for crispness
    let rect = canvas.getBoundingClientRect();
    // Fallback if rect has zero width/height (not yet laid out)
    let cssW = rect.width;
    let cssH = rect.height;
    if (cssW === 0 || cssH === 0) {
      cssW = window.innerWidth;
      // Subtract HUD height if present
      const hud = document.getElementById('hud');
      const hudRect = hud ? hud.getBoundingClientRect() : { height: 0 };
      cssH = window.innerHeight - hudRect.height;
    }
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    // Reset any existing transforms then scale to device pixel ratio
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  // Similarly for result canvas
  function resizeResultCanvas() {
    let rect = resultCanvas.getBoundingClientRect();
    let cssW = rect.width;
    let cssH = rect.height;
    if (cssW === 0 || cssH === 0) {
      cssW = window.innerWidth * 0.8;
      cssH = window.innerHeight * 0.75;
    }
    resultCanvas.width = cssW * dpr;
    resultCanvas.height = cssH * dpr;
    rctx.setTransform(1, 0, 0, 1, 0, 0);
    rctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    resizeResultCanvas();
    if (!gameRunning) {
      drawStartScreen();
    }
  });

  /*** State display helpers ***/
  function updateHUD() {
    coinDisplay.textContent = `🥇 ${state.coins}`;
    ticketDisplay.textContent = `🎟️ ${state.tickets}`;
    streakDisplay.textContent = `Streak: ${state.streak}`;
    dailyInfo.textContent = `Today: ${todayKey.substr(0, 4)}/${todayKey.substr(4, 2)}/${todayKey.substr(6, 2)}`;
    bestTodayEl.textContent = state.bestTimeToday !== null ? state.bestTimeToday.toFixed(2) : '--';
    bestAllEl.textContent = state.bestTimeAll !== null ? state.bestTimeAll.toFixed(2) : '--';
    // Missions summary
    missionSummary.innerHTML = '';
    state.missions.forEach((m) => {
      const span = document.createElement('span');
      const progress = Math.min(m.count || 0, m.target);
      span.textContent = `${m.desc}: ${progress}/${m.target}${m.completed ? ' ✔' : ''}`;
      missionSummary.appendChild(span);
    });
  }

  /*** Audio feedback ***/
  let audioCtx;
  function playSound(type) {
    // Lazy initialize audio context on first user interaction
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return; // audio not supported
      }
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    if (type === 'perfect') {
      oscillator.frequency.value = 880;
    } else if (type === 'great') {
      oscillator.frequency.value = 660;
    } else if (type === 'good') {
      oscillator.frequency.value = 440;
    } else {
      oscillator.frequency.value = 220;
    }
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
  }

  /*** Vibration feedback ***/
  function vibrate(duration) {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }

  /*** Game state variables ***/
  let gameRunning = false;
  let startTime = 0;
  let progress = 0;
  let requestId = null;
  let runTapHandler = null;

  /*** Drawing functions ***/
  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Get current gauge colour based on selected cosmetic
  function getCurrentTrailGradient() {
    const selected = state.selectedCosmetic;
    const cosmetic = COSMETICS.find((c) => c.id === selected);
    if (cosmetic) {
      if (cosmetic.type === 'color') {
        return cosmetic.color;
      } else if (cosmetic.type === 'gradient') {
        // Create gradient across the width of canvas
        const gradient = ctx.createLinearGradient(0, 0, canvas.width / dpr, 0);
        const stopCount = cosmetic.colors.length;
        cosmetic.colors.forEach((col, idx) => {
          gradient.addColorStop(idx / (stopCount - 1), col);
        });
        return gradient;
      }
    }
    // Default colour
    return '#1E90FF';
  }

  function drawGauge(progress) {
    // Draw background bar
    const barWidth = canvas.width / dpr * 0.9;
    const barHeight = 20;
    const barX = (canvas.width / dpr - barWidth) / 2;
    const barY = (canvas.height / dpr) / 2;
    // background
    ctx.fillStyle = '#ddd';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    // fill
    ctx.fillStyle = getCurrentTrailGradient();
    const fillWidth = barWidth * Math.min(progress, 1);
    ctx.fillRect(barX, barY, fillWidth, barHeight);
    // marker
    ctx.fillStyle = '#fff';
    const markerX = barX + barWidth * Math.min(progress, 1);
    ctx.beginPath();
    ctx.arc(markerX, barY + barHeight / 2, barHeight, 0, 2 * Math.PI);
    ctx.fill();
  }

  /*** Game loop ***/
  function gameLoop(timestamp) {
    if (!gameRunning) return;
    if (startTime === 0) {
      startTime = timestamp;
      // Start of a new session: increment sessions and record last session time
      const todayLog = state.logs[todayKey];
      if (!todayLog.lastSession || (timestamp - todayLog.lastSession) > 30 * 60 * 1000) {
        todayLog.sessions++;
      }
      todayLog.lastSession = timestamp;
    }
    const elapsed = (timestamp - startTime) / 1000;
    progress = elapsed / TARGET_TIME;
    clearCanvas();
    ctx.fillStyle = '#e3e7f1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGauge(progress);
    if (elapsed >= TARGET_TIME + GOOD_THRESHOLD) {
      // Too late -> fail
      endGame('fail', elapsed);
      return;
    }
    requestId = requestAnimationFrame(gameLoop);
  }

  /*** End of game / evaluation ***/
  function endGame(result, actualTime) {
    // Cancel animation frame and mark not running
    if (requestId) {
      cancelAnimationFrame(requestId);
      requestId = null;
    }
    gameRunning = false;
    // Update logs
    const todayLog = state.logs[todayKey];
    todayLog.plays++;
    todayLog.totalTime += actualTime;
    if (result !== 'fail') {
      todayLog.clears++;
    }
    if (actualTime > 0 && Math.abs(actualTime - TARGET_TIME) <= PERFECT_THRESHOLD) {
      todayLog.perfects++;
    }
    // Determine judgement and rewards
    const diff = Math.abs(actualTime - TARGET_TIME);
    let judgement;
    let success = false;
    let earnedCoins = 0;
    let earnedTickets = 0;
    if (result !== 'fail') {
      success = true;
      if (diff <= PERFECT_THRESHOLD) {
        judgement = 'Perfect';
      } else if (diff <= GREAT_THRESHOLD) {
        judgement = 'Great';
      } else {
        judgement = 'Good';
      }
      // Update streak and best streak
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      // Rewards with streak multiplier
      const mult = streakMultiplier(state.streak);
      let base;
      if (judgement === 'Perfect') base = REWARD_PERFECT;
      else if (judgement === 'Great') base = REWARD_GREAT;
      else base = REWARD_GOOD;
      earnedCoins = Math.floor(base.coins * mult);
      earnedTickets = Math.floor(base.tickets * mult);
      state.coins += earnedCoins;
      state.tickets += earnedTickets;
      // Update best times
      if (state.bestTimeToday === null || actualTime < state.bestTimeToday) {
        state.bestTimeToday = actualTime;
      }
      if (state.bestTimeAll === null || actualTime < state.bestTimeAll) {
        state.bestTimeAll = actualTime;
      }
      // Mission progress
      state.missions.forEach((m) => {
        if (!m.count) m.count = 0;
        if (!m.completed) {
          if (m.type === 'perfect' && judgement === 'Perfect') {
            m.count++;
          } else if (m.type === 'streak' && state.streak >= m.target) {
            // only increment once when threshold reached
            m.count = m.target;
          } else if (m.type === 'plays') {
            m.count++;
          }
          if (m.count >= m.target) {
            m.completed = true;
            state.coins += m.reward.coins;
            state.tickets += m.reward.tickets;
          }
        }
      });
    } else {
      // fail: check streak shield
      if (!state.streakShieldUsed) {
        // use shield
        state.streakShieldUsed = true;
        // keep streak
      } else {
        state.streak = 0;
      }
      earnedCoins = 0;
      earnedTickets = 0;
    }
    // Save state
    saveState();
    // Update HUD display
    updateHUD();
    // Draw result card on its own canvas
    drawResultCard(judgement, actualTime, diff, earnedCoins, earnedTickets, success);
    // Show result screen and hide others
    resultScreen.classList.remove('hidden');
    startScreen.classList.add('hidden');
    cosmeticScreen.classList.add('hidden');
  }

  /*** Result card drawing on its own canvas ***/
  function drawResultCard(judgement, actualTime, diff, coinsEarned, ticketsEarned, success) {
    // Resize result canvas to match CSS
    resizeResultCanvas();
    const w = resultCanvas.width / dpr;
    const h = resultCanvas.height / dpr;
    rctx.clearRect(0, 0, w, h);
    // Card background
    rctx.fillStyle = '#fff';
    // Draw rectangular card background. Avoid using roundRect to ensure compatibility.
    rctx.fillRect(10, 10, w - 20, h - 20);
    // Title
    rctx.fillStyle = '#0b3d91';
    rctx.font = '24px sans-serif';
    rctx.textAlign = 'center';
    rctx.fillText('結果', w / 2, 50);
    // Judgement
    rctx.font = '32px sans-serif';
    let colour;
    if (judgement === 'Perfect') colour = '#FFD700';
    else if (judgement === 'Great') colour = '#4CAF50';
    else if (judgement === 'Good') colour = '#2196F3';
    else colour = '#F44336';
    rctx.fillStyle = colour;
    rctx.fillText(judgement, w / 2, 100);
    // Time text
    rctx.fillStyle = '#333';
    rctx.font = '20px sans-serif';
    rctx.fillText(`記録: ${actualTime.toFixed(2)}s`, w / 2, 140);
    rctx.fillText(`差: ${diff.toFixed(2)}s`, w / 2, 170);
    // Streak info
    rctx.fillText(`連続成功: ${state.streak}`, w / 2, 200);
    // Coins/tickets earned
    rctx.fillText(`獲得コイン: ${coinsEarned}`, w / 2, 240);
    rctx.fillText(`獲得チケット: ${ticketsEarned}`, w / 2, 270);
    // Mission progress summary
    let y = 320;
    rctx.font = '16px sans-serif';
    rctx.fillStyle = '#555';
    state.missions.forEach((m) => {
      const progress = Math.min(m.count || 0, m.target);
      const line = `${m.desc}: ${progress}/${m.target}${m.completed ? '\u2714' : ''}`;
      rctx.fillText(line, w / 2, y);
      y += 24;
    });
    // Encouraging text for near miss
    if (!success && diff <= NEARMISS_THRESHOLD) {
      rctx.fillStyle = '#F57C00';
      rctx.font = '20px sans-serif';
      rctx.fillText('惜しい！もう少し！', w / 2, h - 60);
    }
  }

  // Add roundRect if not supported (polyfill)
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (w < 0) { x = x + w; w = -w; }
      if (h < 0) { y = y + h; h = -h; }
      const minSize = Math.min(w, h);
      if (r > minSize / 2) r = minSize / 2;
      // Arc corner radius
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  /*** User interactions ***/
  function handleTap(ev) {
    // Only process taps when a run is active. Ignore if not playing.
    if (!gameRunning) return;
    const now = performance.now();
    const elapsed = (now - startTime) / 1000;
    // Determine result
    let diff = Math.abs(elapsed - TARGET_TIME);
    let result = 'tap';
    let judgement;
    if (diff <= PERFECT_THRESHOLD) {
      judgement = 'Perfect';
    } else if (diff <= GREAT_THRESHOLD) {
      judgement = 'Great';
    } else if (diff <= GOOD_THRESHOLD) {
      judgement = 'Good';
    } else {
      judgement = 'Fail';
    }
    // Provide immediate audio/haptic feedback
    if (judgement !== 'Fail') {
      playSound(judgement.toLowerCase());
      vibrate(50);
    } else {
      playSound('fail');
      vibrate(100);
    }
    endGame(judgement === 'Fail' ? 'fail' : 'success', elapsed);
  }

  function startRun() {
    // Remove any existing tap handler from a previous run
    if (runTapHandler) {
      canvas.removeEventListener('pointerdown', runTapHandler);
      runTapHandler = null;
    }
    // Reset variables
    gameRunning = true;
    startTime = 0;
    progress = 0;
    // Hide overlays
    startScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    cosmeticScreen.classList.add('hidden');
    // Set up run-specific tap handler on the game canvas. This will end the run on the first tap.
    runTapHandler = function (ev) {
      // Prevent unintended zoom on touch devices
      if (ev.pointerType === 'touch') {
        ev.preventDefault();
      }
      handleTap(ev);
      // Remove the handler after one tap
      canvas.removeEventListener('pointerdown', runTapHandler);
      runTapHandler = null;
    };
    // Use pointerdown event for consistent tap handling across mouse and touch
    canvas.addEventListener('pointerdown', runTapHandler, { passive: false });
    // Kick off loop
    requestId = requestAnimationFrame(gameLoop);
  }

  // Retry simply starts a new run
  function onRetry() {
    startRun();
  }

  // Save result card as image
  function onSaveImage() {
    const url = resultCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `result_${todayKey}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /*** Cosmetic shop rendering and interactions ***/
  function openCosmeticShop() {
    cosmeticList.innerHTML = '';
    COSMETICS.forEach((item) => {
      const li = document.createElement('li');
      const owned = state.owned.includes(item.id);
      li.className = owned ? '' : 'locked';
      // Visual preview
      const preview = document.createElement('div');
      preview.style.width = '24px';
      preview.style.height = '24px';
      preview.style.borderRadius = '4px';
      if (item.type === 'color') {
        preview.style.background = item.color;
      } else if (item.type === 'gradient') {
        // gradient preview using CSS linear-gradient
        const stops = item.colors.map((c, i) => {
          return `${c} ${(i / (item.colors.length - 1)) * 100}%`;
        }).join(', ');
        preview.style.background = `linear-gradient(90deg, ${stops})`;
      }
      li.appendChild(preview);
      // Name
      const nameSpan = document.createElement('span');
      nameSpan.textContent = `${item.name}`;
      nameSpan.style.flex = '1';
      nameSpan.style.marginLeft = '8px';
      li.appendChild(nameSpan);
      // Button
      const btn = document.createElement('button');
      if (owned) {
        if (state.selectedCosmetic === item.id) {
          btn.textContent = '選択中';
          btn.disabled = true;
        } else {
          btn.textContent = '選択';
        }
      } else {
        // Show cost
        let costStr = '';
        if (item.costCoins > 0) costStr += `${item.costCoins}🥇`;
        if (item.costTickets > 0) {
          if (costStr) costStr += ' / ';
          costStr += `${item.costTickets}🎟️`;
        }
        btn.textContent = costStr;
      }
      btn.addEventListener('click', () => {
        if (!owned) {
          // Attempt purchase
          if (item.costCoins <= state.coins && item.costTickets <= state.tickets) {
            state.coins -= item.costCoins;
            state.tickets -= item.costTickets;
            state.owned.push(item.id);
            state.selectedCosmetic = item.id;
            saveState();
            updateHUD();
            openCosmeticShop();
          } else {
            alert('資金が足りません');
          }
        } else {
          // Select
          state.selectedCosmetic = item.id;
          saveState();
          updateHUD();
          openCosmeticShop();
        }
      });
      li.appendChild(btn);
      cosmeticList.appendChild(li);
    });
    cosmeticScreen.classList.remove('hidden');
    startScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
  }

  /*** Draw start screen gauge for decoration ***/
  function drawStartScreen() {
    clearCanvas();
    ctx.fillStyle = '#e3e7f1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw gauge with 0 progress for decoration
    drawGauge(0);
  }

  /*** Event listeners binding ***/
  function bindEvents() {
    // Bind button interactions. Use stopPropagation to prevent these clicks from also
    // triggering the global tap handler.
    startButton.addEventListener('click', (e) => {
      e.stopPropagation();
      startRun();
    });
    retryButton.addEventListener('click', (e) => {
      e.stopPropagation();
      onRetry();
    });
    saveButton.addEventListener('click', (e) => {
      e.stopPropagation();
      onSaveImage();
    });
    customizeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      openCosmeticShop();
    });
    closeCosmeticButton.addEventListener('click', (e) => {
      e.stopPropagation();
      cosmeticScreen.classList.add('hidden');
      startScreen.classList.remove('hidden');
    });

    // We don't attach global tap listeners here. They will be attached per-run in startRun().
  }

  /*** Service worker registration ***/
  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch((err) => {
        console.warn('ServiceWorker registration failed', err);
      });
    }
  }

  /*** Initialization ***/
  function init() {
    resizeCanvas();
    resizeResultCanvas();
    updateHUD();
    drawStartScreen();
    bindEvents();
    registerSW();
  }

  // Kick-off after DOM content loaded
  document.addEventListener('DOMContentLoaded', init);
})();
