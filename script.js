document.addEventListener('DOMContentLoaded', () => {
    
    function resizeGame() {
        const container = document.getElementById('game-container');
        const scale = Math.min(window.innerWidth / 1386, window.innerHeight / 640);
        container.style.transform = `scale(${scale})`;
    }
    window.addEventListener('resize', resizeGame);
    resizeGame();

    let maxTileEver = parseInt(localStorage.getItem('darwin_max_tile')) || 2;

    const bgMusic = document.getElementById('bg-music');
    const sfxClick = document.getElementById('sfx-click');
    const sfxMerge = document.getElementById('sfx-merge');
    const sfxWin = document.getElementById('sfx-win');
    const sfxFail = document.getElementById('sfx-fail');
    
    const sfxTime = document.getElementById('sfx-time');
    const sfxWave = document.getElementById('sfx-wave');
    const sfxThunder = document.getElementById('sfx-thunder');
    const sfxTornado = document.getElementById('sfx-tornado');
    const sfxFrozen = document.getElementById('sfx-frozen');
    const sfxExplode = document.getElementById('sfx-skill');

    const btnToggleSound = document.getElementById('btn-toggle-sound');
    const imgSound = document.getElementById('img-sound');
    let isSoundOn = true;

    function playSfx(audio) { if(isSoundOn && audio) { audio.currentTime=0; audio.play().catch(()=>{}); } }
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.hover-effect') || e.target.closest('.level-btn-wrap') || e.target.closest('.skill-btn')) playSfx(sfxClick);
        if(isSoundOn && bgMusic.paused) bgMusic.play().catch(()=>{});
    }, { capture: true });

    function toggleSoundState(e) {
        if(e) e.stopPropagation();
        isSoundOn = !isSoundOn;
        const path = isSoundOn ? "images/01_lobby/btn_sound_on.png" : "images/01_lobby/btn_sound_off.png";
        if(imgSound) imgSound.src = path;
        if(isSoundOn) bgMusic.play(); else bgMusic.pause();
    }
    if(btnToggleSound) btnToggleSound.addEventListener('click', toggleSoundState);

    const globalIcons = document.getElementById('global-icons');
    const modalAchieve = document.getElementById('modal-achievement');
    const modalHelp = document.getElementById('modal-help');
    const modalIntro = document.getElementById('modal-intro');
    const modalTarget = document.getElementById('modal-target');
    const levelScreen = document.getElementById('level-select-screen');
    const modalComplete = document.getElementById('modal-complete');
    const modalGameOver = document.getElementById('modal-gameover');
    
    let isInGame = false;

    function toggleModal(targetModal) {
        const isTargetOpen = !targetModal.classList.contains('hidden');
        modalAchieve.classList.add('hidden');
        modalHelp.classList.add('hidden');
        modalIntro.classList.add('hidden');

        if (!isTargetOpen) {
            targetModal.classList.remove('hidden');
            globalIcons.style.display = 'flex';
        } else {
            if(isInGame) globalIcons.style.display = 'flex';
            else globalIcons.style.display = 'flex';
        }
    }

    document.getElementById('btn-open-achievement').addEventListener('click', () => { updateAchievementList(); toggleModal(modalAchieve); });
    document.getElementById('btn-open-help').addEventListener('click', () => { updateEvolutionBook(); toggleModal(modalHelp); });
    document.getElementById('btn-open-intro').addEventListener('click', () => toggleModal(modalIntro));
    
    document.getElementById('btn-close-achievement').addEventListener('click', () => toggleModal(modalAchieve));
    document.getElementById('btn-close-intro').addEventListener('click', () => toggleModal(modalIntro));
    
    const godStates = { 
        idle: 'images/04_game/mission.png', 
        random: ['1','2','3','4'].map(i => `images/04_game/alien_random/alien_random${i}.png`),
        victory: ['1','2','3','4'].map(i => `images/04_game/alien_victory/alien_victory${i}.png`),
        fail: ['1','2','3','4'].map(i => `images/04_game/alien_fail/alien_fail${i}.png`),
        newEl: ['1','2','3','4'].map(i => `images/04_game/alien_new_element/alien_new_element${i}.png`)
    };
    const godChar = document.getElementById('god-character');
    let godIdleInterval, godAnimTimer, isAnimating = false;
    // 有趣的上帝對話
    const godQuotes = [
        "這鍋湯好像煮太久了...", "你確定那個不是突變嗎？", "我要不要加點辣椒醬？", "糟糕，手滑了一下...", 
        "演化論？那是我隨便寫的", "再合不出人，我就要滅世囉", "看！有流星！騙你的", "別讓我的實驗室爆炸",
        "我是不是該去放個假？", "這隻長得有點像我前任...", "再合一下，就一下！", "你的手指累了嗎？",
        "這就是生命的奇蹟 (哈欠)"
    ];

    function startGodIdle() {
        clearInterval(godIdleInterval);
        // 頻率加快：3000ms 檢查一次，60% 機率說話
        godIdleInterval = setInterval(() => { 
            if(!isAnimating) {
                playGodSequence(godStates.random, 200); 
                if(Math.random() > 0.4) showGodDialog(godQuotes[Math.floor(Math.random()*godQuotes.length)]);
            }
        }, 3000);
    }
    function stopGodIdle() { clearInterval(godIdleInterval); }

    function playGodSequence(seqArr, speed = 200) {
        if(!godChar) return;
        isAnimating = true;
        let frame = 0;
        function nextFrame() {
            if(frame < seqArr.length) {
                godChar.src = seqArr[frame];
                frame++;
                godAnimTimer = setTimeout(nextFrame, speed);
            } else {
                if(!modalGameOver.classList.contains('hidden')) { frame = 0; playGodSequence(godStates.fail, 500); }
                else if(!modalComplete.classList.contains('hidden')) { frame = 0; playGodSequence(godStates.victory, 500); }
                else { godChar.src = godStates.idle; isAnimating = false; }
            }
        }
        nextFrame();
    }

    const tileImages = {
        2: 'images/03_evolution/n2.png', 4: 'images/03_evolution/n4.png', 8: 'images/03_evolution/n8.png',
        16: 'images/03_evolution/n16.png', 32: 'images/03_evolution/n32.png', 64: 'images/03_evolution/n64.png',
        128: 'images/03_evolution/n128.png', 256: 'images/03_evolution/n256.png', 512: 'images/03_evolution/n512.png',
        1024: 'images/03_evolution/n1024.png', 2048: 'images/03_evolution/n2048.png', 4096: 'images/03_evolution/n4096.png',
        8192: 'images/03_evolution/n8192.png', 16384: 'images/03_evolution/n16384.png', 32768: 'images/03_evolution/n32768.png',
        65536: 'images/03_evolution/n65536.png', 131072: 'images/03_evolution/n131072.png'
    };
    const evolutionData = [
        { val: 2, name: "原蟲" }, { val: 4, name: "軟體" }, { val: 8, name: "甲殼" }, { val: 16, name: "魚類" },
        { val: 32, name: "兩棲" }, { val: 64, name: "爬蟲" }, { val: 128, name: "囓齒" }, { val: 256, name: "哺乳" },
        { val: 512, name: "靈長" }, { val: 1024, name: "野人" }, { val: 2048, name: "人類" }, { val: 4096, name: "天才" },
        { val: 8192, name: "喪屍" }, { val: 16384, name: "進化" }, { val: 32768, name: "生化" }, { val: 65536, name: "外星" },
        { val: 131072, name: "神" }
    ];

    let maxLevelUnlocked = 1, currentLevel = 1, targetTile = 2048;
    let gameMode = 'endless';
    let board = [], frozenTurns = [], score = 0, moves = 0, maxTile = 2;
    let prevBoard = null;
    let isSelectingIce = false;
    let undoCooldown = 0;

    document.getElementById('btn-normal').addEventListener('click', () => {
        document.getElementById('start-screen').classList.remove('active');
        levelScreen.classList.add('active');
        renderLevelGrid();
    });
    document.getElementById('btn-endless').addEventListener('click', () => startGame('endless'));
    document.getElementById('btn-close-level').addEventListener('click', () => {
        levelScreen.classList.remove('active');
        document.getElementById('start-screen').classList.add('active');
    });

    function renderLevelGrid() {
        const container = document.getElementById('level-grid-container');
        container.innerHTML = '';
        for(let i=1; i<=10; i++) {
            const btn = document.createElement('div');
            let bgSrc = 'images/05_level/lvl_icon_locked.png';
            let cls = 'level-btn-wrap locked';
            if (i < maxLevelUnlocked) { bgSrc = 'images/05_level/lvl_icon_clear.png'; cls = 'level-btn-wrap'; }
            else if (i === maxLevelUnlocked) { bgSrc = 'images/05_level/lvl_icon_open.png'; cls = 'level-btn-wrap'; }
            btn.className = cls;
            btn.innerHTML = `<img src="${bgSrc}" class="level-btn-bg"><span class="level-num">${i.toString().padStart(2,'0')}</span>`;
            if (i <= maxLevelUnlocked) btn.onclick = () => showTargetPopup(i);
            container.appendChild(btn);
        }
    }
    function showTargetPopup(level) {
        currentLevel = level;
        let goal = Math.pow(2, level + 2);
        if(goal > 131072) goal = 131072;
        targetTile = goal;
        document.getElementById('target-img').src = tileImages[goal];
        modalTarget.classList.remove('hidden');
    }
    document.getElementById('btn-target-menu').onclick = () => { modalTarget.classList.add('hidden'); levelScreen.classList.remove('active'); goHome(); };
    document.getElementById('btn-target-start').onclick = () => { modalTarget.classList.add('hidden'); levelScreen.classList.remove('active'); startGame('normal', targetTile); };

    document.getElementById('btn-back-home-top').onclick = goHome;
    document.getElementById('btn-fail-menu').onclick = goHome;
    document.getElementById('btn-fail-retry').onclick = () => { modalGameOver.classList.add('hidden'); initBoard(); };
    document.getElementById('btn-comp-menu').onclick = goHome;
    document.getElementById('btn-comp-retry').onclick = () => { modalComplete.classList.add('hidden'); stopConfetti(); initBoard(); };
    document.getElementById('btn-comp-next').onclick = () => {
        modalComplete.classList.add('hidden'); stopConfetti();
        if(maxLevelUnlocked < 10) { maxLevelUnlocked++; if(currentLevel < 10) currentLevel++; }
        showTargetPopup(currentLevel);
    };

    function startGame(mode, target) {
        gameMode = mode;
        if(target) targetTile = target;
        isInGame = true;
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        globalIcons.style.display = 'flex'; 
        startGodIdle();
        initBoard();
    }

    function goHome() {
        isInGame = false; stopGodIdle(); stopConfetti();
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('start-screen').classList.add('active');
        modalGameOver.classList.add('hidden');
        modalComplete.classList.add('hidden');
        globalIcons.style.display = 'flex';
    }

    function initBoard() {
        board = Array(16).fill(0); frozenTurns = Array(16).fill(0);
        score = 0; moves = gameMode === 'normal' ? 1000 : 0; maxTile = 2;
        prevBoard = null; isSelectingIce = false; undoCooldown = 0;
        updateAchievementList(); updateEvolutionBook();
        addNewTile(); addNewTile(); updateUI();
        godChar.src = godStates.idle;
    }

    function addNewTile() {
        let empty = [];
        board.forEach((v,i)=>{if(v===0)empty.push(i)});
        if(empty.length) board[empty[Math.floor(Math.random()*empty.length)]] = Math.random()>0.9?4:2;
    }

    function updateUI() {
        document.getElementById('score-display').innerText = score;
        document.getElementById('moves-display').innerText = gameMode==='normal'?moves:"∞";
        const grid = document.getElementById('grid-container');
        grid.innerHTML = '';
        
        const fxLayer = document.getElementById('fx-layer');
        const keepFx = Array.from(fxLayer.children).filter(el => !el.classList.contains('ice'));
        fxLayer.innerHTML = '';
        keepFx.forEach(el => fxLayer.appendChild(el));

        board.forEach((v, i) => {
            const t = document.createElement('div'); t.className = 'tile';
            t.dataset.index = i;
            
            if(v>0) {
                if(v > maxTile) maxTile = v;
                if(v > maxTileEver) { maxTileEver = v; localStorage.setItem('darwin_max_tile', maxTileEver); }
                const inner = document.createElement('div');
                inner.className = 'tile-inner';
                inner.style.backgroundImage = `url('${tileImages[v]}')`;
                t.appendChild(inner);
            }
            if (frozenTurns[i] > 0) {
                const ice = document.createElement('div');
                ice.className = 'skill-overlay ice';
                ice.style.backgroundImage = "url('images/04_game/ice_block.png')";
                const row = Math.floor(i / 4), col = i % 4;
                ice.style.top = (row * (116 + 8)) + 'px';
                ice.style.left = (col * (116 + 8)) + 'px';
                ice.innerHTML = `<span class="ice-counter">${frozenTurns[i]}</span>`;
                fxLayer.appendChild(ice);
            }
            t.addEventListener('click', () => handleTileClick(i));
            grid.appendChild(t);
        });
        
        // 更新 Undo 冷卻
        const cdUndo = document.getElementById('cd-undo');
        if(cdUndo) {
            if(undoCooldown > 0) {
                cdUndo.classList.remove('hidden');
                cdUndo.innerText = undoCooldown;
            } else {
                cdUndo.classList.add('hidden');
            }
        }
        updateAchievementList();
    }

    function showScoreEffect(val) {
        const ef = document.getElementById('score-effect');
        ef.innerText = `-${val}`;
        ef.style.animation='none'; ef.offsetHeight; ef.style.animation='floatUp 1s forwards';
    }
    function showGodDialog(msg) {
        const d = document.getElementById('god-dialog');
        d.innerText = msg; d.classList.remove('hidden');
        setTimeout(()=>d.classList.add('hidden'), 2000); // 稍微久一點
    }
    // 龍捲風 2.5s 閃爍
    function addSkillOverlay(idx, imgName, duration = 800, className = '') {
        const fxLayer = document.getElementById('fx-layer');
        const row = Math.floor(idx / 4), col = idx % 4;
        const fx = document.createElement('div');
        fx.className = `skill-overlay ${className}`;
        fx.style.backgroundImage = `url('images/04_game/${imgName}')`;
        fx.style.top = (row * (116 + 8)) + 'px';
        fx.style.left = (col * (116 + 8)) + 'px';
        fxLayer.appendChild(fx);
        setTimeout(() => fx.remove(), duration);
    }

    document.getElementById('skill-undo').onclick = () => {
        if(undoCooldown > 0) return showGodDialog(`冷卻中(${undoCooldown})`);
        if(!prevBoard || score < 300) return showGodDialog("分數不足");
        score -= 300; board = [...prevBoard]; undoCooldown = 10;
        playSfx(sfxTime); updateUI(); showScoreEffect(300); showGodDialog("時光倒流！");
    };

    document.getElementById('skill-wave').onclick = () => {
        if(score < 500) return showGodDialog("分數不足");
        playSfx(sfxWave); score -= 500;
        [0,1,4,5, 10,11,14,15].forEach(i => { if(board[i]>0 && frozenTurns[i]===0) { board[i]=0; addSkillOverlay(i, 'wave_block.png'); } });
        updateUI(); showScoreEffect(500);
    };
    document.getElementById('skill-volcano').onclick = () => {
        if(score < 500) return showGodDialog("分數不足");
        playSfx(sfxExplode); score -= 500;
        [2,3,6,7, 8,9,12,13].forEach(i => { if(board[i]>0 && frozenTurns[i]===0) { board[i]=0; addSkillOverlay(i, 'explode2.png'); } });
        updateUI(); showScoreEffect(500);
    };
    document.getElementById('skill-lightning').onclick = () => {
        if(score < 1000) return showGodDialog("分數不足");
        const filled = board.map((v,i)=>(v>0 && frozenTurns[i]===0)?i:-1).filter(i=>i!==-1);
        if(!filled.length) return showGodDialog("無目標");
        playSfx(sfxThunder); score -= 1000;
        const target = filled[Math.floor(Math.random()*filled.length)];
        board[target] = 0; addSkillOverlay(target, 'lightning_block.png');
        updateUI(); showScoreEffect(1000);
    };

    document.getElementById('skill-typhoon').onclick = () => {
        if(score < 1000) return showGodDialog("分數不足");
        playSfx(sfxTornado); score -= 1000;
        
        let movableIndices = [], movableValues = [];
        for(let i=0; i<16; i++) {
            if(frozenTurns[i] === 0) { movableIndices.push(i); movableValues.push(board[i]); }
        }
        // Shuffle
        for(let i = movableValues.length - 1; i > 0; i--){
            const j = Math.floor(Math.random() * (i + 1));
            [movableValues[i], movableValues[j]] = [movableValues[j], movableValues[i]];
        }
        // Apply
        movableIndices.forEach((idx, k) => { 
            board[idx] = movableValues[k]; 
            // [修正] 龍捲風特效持續 2500ms，並加上 spin class
            addSkillOverlay(idx, 'typhoon_block.png', 2500, 'tornado-spin');
        });
        updateUI(); showScoreEffect(1000);
    };

    document.getElementById('skill-ice').onclick = () => {
        if(score < 2000) return showGodDialog("分數不足");
        isSelectingIce = true;
        showGodDialog("請點擊目標");
    };
    function handleTileClick(index) {
        if (isSelectingIce) {
            if (board[index] > 0) {
                score -= 2000; frozenTurns[index] = 11; isSelectingIce = false;
                playSfx(sfxFrozen); updateUI(); showScoreEffect(2000);
            } else { showGodDialog("請選擇生物"); }
        }
    }

    function move(dir) {
        if(!modalComplete.classList.contains('hidden') || !modalGameOver.classList.contains('hidden') || isSelectingIce) return;
        if(!modalAchieve.classList.contains('hidden') || !modalHelp.classList.contains('hidden') || !modalIntro.classList.contains('hidden') || !modalTarget.classList.contains('hidden')) return;

        let tempPrevBoard = [...board];
        for(let i=0; i<16; i++) if(frozenTurns[i] > 0) frozenTurns[i]--;
        if(undoCooldown > 0) undoCooldown--;

        let moved = false;
        let scoreAdd = 0;
        let newBoard = [...board];
        let mergedObj = {};
        const idx = (r, c) => r * 4 + c;

        if (dir === 'left') {
            for (let r = 0; r < 4; r++) {
                for (let c = 1; c < 4; c++) {
                    if (newBoard[idx(r,c)] !== 0) {
                        let p = c;
                        while (p > 0) {
                            if(frozenTurns[idx(r, p)] > 0 || frozenTurns[idx(r, p-1)] > 0) break;
                            let curr = idx(r, p), prev = idx(r, p-1);
                            if (newBoard[prev] === 0) {
                                newBoard[prev] = newBoard[curr]; newBoard[curr] = 0; moved = true; p--;
                            } else if (newBoard[prev] === newBoard[curr] && !mergedObj[prev]) {
                                newBoard[prev] *= 2; newBoard[curr] = 0; mergedObj[prev] = true; scoreAdd += newBoard[prev]; moved = true; break;
                            } else break;
                        }
                    }
                }
            }
        } else if (dir === 'right') {
            for (let r = 0; r < 4; r++) {
                for (let c = 2; c >= 0; c--) {
                    if (newBoard[idx(r,c)] !== 0) {
                        let p = c;
                        while (p < 3) {
                            if(frozenTurns[idx(r, p)] > 0 || frozenTurns[idx(r, p+1)] > 0) break;
                            let curr = idx(r, p), next = idx(r, p+1);
                            if (newBoard[next] === 0) {
                                newBoard[next] = newBoard[curr]; newBoard[curr] = 0; moved = true; p++;
                            } else if (newBoard[next] === newBoard[curr] && !mergedObj[next]) {
                                newBoard[next] *= 2; newBoard[curr] = 0; mergedObj[next] = true; scoreAdd += newBoard[next]; moved = true; break;
                            } else break;
                        }
                    }
                }
            }
        } else if (dir === 'up') {
            for (let c = 0; c < 4; c++) {
                for (let r = 1; r < 4; r++) {
                    if (newBoard[idx(r,c)] !== 0) {
                        let p = r;
                        while (p > 0) {
                            if(frozenTurns[idx(p, c)] > 0 || frozenTurns[idx(p-1, c)] > 0) break;
                            let curr = idx(p, c), prev = idx(p-1, c);
                            if (newBoard[prev] === 0) {
                                newBoard[prev] = newBoard[curr]; newBoard[curr] = 0; moved = true; p--;
                            } else if (newBoard[prev] === newBoard[curr] && !mergedObj[prev]) {
                                newBoard[prev] *= 2; newBoard[curr] = 0; mergedObj[prev] = true; scoreAdd += newBoard[prev]; moved = true; break;
                            } else break;
                        }
                    }
                }
            }
        } else if (dir === 'down') {
            for (let c = 0; c < 4; c++) {
                for (let r = 2; r >= 0; r--) {
                    if (newBoard[idx(r,c)] !== 0) {
                        let p = r;
                        while (p < 3) {
                            if(frozenTurns[idx(p, c)] > 0 || frozenTurns[idx(p+1, c)] > 0) break;
                            let curr = idx(p, c), next = idx(p+1, c);
                            if (newBoard[next] === 0) {
                                newBoard[next] = newBoard[curr]; newBoard[curr] = 0; moved = true; p++;
                            } else if (newBoard[next] === newBoard[curr] && !mergedObj[next]) {
                                newBoard[next] *= 2; newBoard[curr] = 0; mergedObj[next] = true; scoreAdd += newBoard[next]; moved = true; break;
                            } else break;
                        }
                    }
                }
            }
        }

        if (moved) {
            prevBoard = tempPrevBoard;
            board = newBoard;
            score += scoreAdd;
            if(scoreAdd > 0) playSfx(sfxMerge);
            
            addNewTile();
            updateUI();
            if (maxTile > 2) playGodSequence(godStates.newEl); else playGodSequence(godStates.random);

            Object.keys(mergedObj).forEach(index => {
                const tile = document.querySelector(`.tile[data-index="${index}"] .tile-inner`);
                if(tile) {
                    tile.classList.remove('merged-anim');
                    void tile.offsetWidth; 
                    tile.classList.add('merged-anim');
                }
            });

            if(gameMode === 'normal') {
                moves--;
                if(moves <= 0) showGameOver(false);
                if(board.includes(targetTile)) showGameOver(true);
                else if(checkGameOver()) showGameOver(false);
            } else {
                if(checkGameOver()) showGameOver(false);
            }
        }
    }

    function checkGameOver() {
        if(board.includes(0)) return false;
        for(let i=0;i<16;i++) {
            if(i%4<3 && board[i]===board[i+1]) return false;
            if(i<12 && board[i]===board[i+4]) return false;
        }
        return true;
    }

    function showGameOver(win) {
        stopGodIdle();
        if(win) {
            modalComplete.classList.remove('hidden');
            document.getElementById('complete-creature').src = tileImages[maxTile];
            playSfx(sfxWin); startConfetti();
            playGodSequence(godStates.victory, 500);
        } else {
            modalGameOver.classList.remove('hidden');
            playSfx(sfxFail);
            playGodSequence(godStates.fail, 500);
        }
    }

    let confettiInterval;
    function startConfetti() {
        const c = document.getElementById('confetti-container');
        c.innerHTML = '';
        const colors = ['#d03269', '#f8c846', '#0d98bc', '#38b81c', '#7346b4', '#db6738'];
        confettiInterval = setInterval(() => {
            const p = document.createElement('div');
            p.className = 'confetti';
            p.style.left = Math.random()*100 + '%';
            p.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
            p.style.animationDuration = (Math.random()*1.5+1) + 's';
            c.appendChild(p);
            setTimeout(() => p.remove(), 2500);
        }, 100);
    }
    function stopConfetti() { clearInterval(confettiInterval); }

    document.addEventListener('keydown', e => {
        if(document.getElementById('game-screen').classList.contains('active')) {
            if(e.key==='ArrowLeft') move('left'); if(e.key==='ArrowRight') move('right');
            if(e.key==='ArrowUp') move('up'); if(e.key==='ArrowDown') move('down');
        }
    });

    let touchStartX = 0, touchStartY = 0, activeTile = null;
    const gridEl = document.getElementById('grid-container');
    if(gridEl) {
        gridEl.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
            activeTile = e.target.closest('.tile-inner');
            if(activeTile) activeTile.style.transition = 'none';
        }, {passive: false});
        gridEl.addEventListener('touchmove', e => {
            e.preventDefault();
            if (activeTile) {
                let dx = e.touches[0].clientX - touchStartX, dy = e.touches[0].clientY - touchStartY;
                let limit = 20;
                let tx = Math.max(-limit, Math.min(limit, dx)), ty = Math.max(-limit, Math.min(limit, dy));
                activeTile.style.transform = `translate(${tx}px, ${ty}px)`;
            }
        }, {passive: false});
        gridEl.addEventListener('touchend', e => {
            if (activeTile) {
                activeTile.style.transition = 'transform 0.2s ease-out';
                activeTile.style.transform = 'translate(0, 0)';
                activeTile = null;
            }
            let dx = e.changedTouches[0].clientX - touchStartX, dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy)) { if (Math.abs(dx) > 30) move(dx > 0 ? 'right' : 'left'); }
            else { if (Math.abs(dy) > 30) move(dy > 0 ? 'down' : 'up'); }
        });
    }

    function updateAchievementList() {
        const list = document.getElementById('achievement-list-container');
        if(!list) return; list.innerHTML = '';
        const achs = [
            {t:"黏糊糊的開始", d:"把一鍋熱湯變成了單細胞。小心別把它喝掉了！", g:2},
            {t:"隕石磁鐵", d:"演化出恐龍。希望能撐過下一次流星雨。", g:64},
            {t:"終於穿褲子了", d:"演化出原始人。雖然只有一塊布，但也是進步。", g:1024},
            {t:"電池充飽沒？", d:"成為生化人。現在你有 50% 的機率會生鏽。", g:32768},
            {t:"老闆好！", d:"達到演化的頂點。恭喜！你可以去創造自己的宇宙了。", g:131072}
        ];
        achs.forEach(a => {
            const done = maxTileEver >= a.g; 
            const cls = done ? 'ach-item completed' : 'ach-item';
            // [修正] 未達成使用 n-.png
            const icon = done ? tileImages[a.g] : 'images/03_evolution/n-.png';
            const st = done ? 'images/02_achievement/ach_finish_img.png' : 'images/02_achievement/ach_img.png';
            list.innerHTML += `<div class="${cls}"><div class="ach-col-icon"><img src="${icon}"></div><div class="ach-col-title">${a.t}</div><div class="ach-col-desc">${a.d}</div><div class="ach-col-status"><img src="${st}"></div></div>`;
        });
    }
    function updateEvolutionBook() {
        const left = document.getElementById('evo-grid-left');
        const right = document.getElementById('evo-grid-right');
        if(!left) return;
        left.innerHTML = ''; right.innerHTML = '';
        const titleCard = document.createElement('div'); titleCard.className = 'book-item title-card';
        titleCard.innerHTML = `<img src="images/03_evolution/help_txt.png">`;
        left.appendChild(titleCard);
        evolutionData.forEach((item, i) => {
            const unlocked = maxTileEver >= item.val;
            const num = (i+1).toString().padStart(2,'0');
            const w = document.createElement('div');
            if(unlocked) {
                w.className = 'book-item';
                w.innerHTML = `<img class="item-frame" src="images/03_evolution/sl_bg.png"><img class="item-creature" src="${tileImages[item.val]}"><div class="item-info"><span class="num-text">${num}</span><span class="name-text">${item.name}</span></div>`;
            } else {
                w.className = 'book-item locked';
                w.innerHTML = `<img class="item-frame" src="images/03_evolution/unknown.png"><div class="item-info"><span class="name-text">${item.name}</span></div>`;
            }
            if(i<8) left.appendChild(w); else right.appendChild(w);
        });
    }
});