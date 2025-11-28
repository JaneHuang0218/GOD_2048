document.addEventListener('DOMContentLoaded', () => {
    
    function resizeGame() {
        const container = document.getElementById('game-container');
        const scale = Math.min(window.innerWidth / 1386, window.innerHeight / 640);
        container.style.transform = `scale(${scale})`;
    }
    window.addEventListener('resize', resizeGame);
    resizeGame();

    // 資料
    let maxTileEver = parseInt(localStorage.getItem('darwin_max_tile')) || 2;
    
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

    // 音效
    const bgMusic = document.getElementById('bg-music');
    const sfxClick = document.getElementById('sfx-click');
    const sfxMerge = document.getElementById('sfx-merge');
    const sfxVolcano = document.getElementById('sfx-volcano');
    const sfxFail = document.getElementById('sfx-fail');
    const sfxWin = document.getElementById('sfx-win');
    let isSoundOn = true;

    function playSfx(audio) { if(isSoundOn && audio) { audio.currentTime=0; audio.play().catch(()=>{}); } }
    
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.hover-effect') || e.target.closest('.level-btn-wrap')) playSfx(sfxClick);
        if(isSoundOn && bgMusic.paused) bgMusic.play().catch(()=>{});
    }, { capture: true });

    const btnToggleSound = document.getElementById('btn-toggle-sound');
    if(btnToggleSound) {
        btnToggleSound.addEventListener('click', (e) => {
            e.stopPropagation();
            isSoundOn = !isSoundOn;
            document.getElementById('img-sound').src = isSoundOn ? "images/01_lobby/btn_sound_on.png" : "images/01_lobby/btn_sound_off.png";
            if(isSoundOn) bgMusic.play(); else bgMusic.pause();
        });
    }

    // UI & Modal
    const globalIcons = document.getElementById('global-icons');
    const modalAchieve = document.getElementById('modal-achievement');
    const modalHelp = document.getElementById('modal-help');
    const modalTarget = document.getElementById('modal-target');
    const levelScreen = document.getElementById('level-select-screen');
    const modalComplete = document.getElementById('modal-complete');
    const modalGameOver = document.getElementById('modal-gameover');
    let isInGame = false;

    function toggleModal(targetModal) {
        const isTargetOpen = !targetModal.classList.contains('hidden');
        modalAchieve.classList.add('hidden');
        modalHelp.classList.add('hidden');
        if (!isTargetOpen) {
            targetModal.classList.remove('hidden');
            globalIcons.style.display = 'flex';
        } else {
            if(isInGame) globalIcons.style.display = 'none';
            else globalIcons.style.display = 'flex';
        }
    }

    document.getElementById('btn-open-achievement').addEventListener('click', () => { updateAchievementList(); toggleModal(modalAchieve); });
    document.getElementById('btn-open-help').addEventListener('click', () => { updateEvolutionBook(); toggleModal(modalHelp); });
    document.getElementById('btn-close-achievement').addEventListener('click', () => toggleModal(modalAchieve));

    // 上帝動畫
    const godStates = { 
        idle: 'images/04_game/mission.png', 
        random: ['1','2','3','4'].map(i => `images/04_game/alien_random/alien_random${i}.png`),
        victory: ['1','2','3','4'].map(i => `images/04_game/alien_victory/alien_victory${i}.png`),
        fail: ['1','2','3','4'].map(i => `images/04_game/alien_fail/alien_fail${i}.png`),
        newEl: ['1','2','3','4'].map(i => `images/04_game/alien_new_element/alien_new_element${i}.png`)
    };
    const godChar = document.getElementById('god-character');
    let godIdleInterval, godAnimTimer, isAnimating = false;

    function startGodIdle() {
        clearInterval(godIdleInterval);
        godIdleInterval = setInterval(() => { if(!isAnimating) playGodSequence(godStates.random); }, 4000);
    }
    function stopGodIdle() { clearInterval(godIdleInterval); }

    function playGodSequence(seqArr) {
        if(!godChar) return;
        isAnimating = true;
        let frame = 0;
        function nextFrame() {
            if(frame < seqArr.length) {
                godChar.src = seqArr[frame];
                frame++;
                godAnimTimer = setTimeout(nextFrame, 200);
            } else {
                if(!modalGameOver.classList.contains('hidden')) godChar.src = godStates.fail[3];
                else if(!modalComplete.classList.contains('hidden')) godChar.src = godStates.victory[3];
                else godChar.src = godStates.idle;
                isAnimating = false;
            }
        }
        nextFrame();
    }

    // 遊戲變數
    let maxLevelUnlocked = 1, currentLevel = 1, targetTile = 2048;
    let gameMode = 'endless', board = [], score = 0, moves = 0, maxTile = 2;
    let prevBoard = null; const size = 4;

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
        const item = evolutionData.find(e => e.val === goal) || evolutionData[0];
        document.getElementById('target-img').src = tileImages[goal];
        modalTarget.classList.remove('hidden');
    }

    document.getElementById('btn-target-menu').onclick = () => { modalTarget.classList.add('hidden'); levelScreen.classList.remove('active'); goHome(); };
    document.getElementById('btn-target-start').onclick = () => {
        modalTarget.classList.add('hidden');
        levelScreen.classList.remove('active');
        startGame('normal', targetTile);
    };

    document.getElementById('btn-back-home').onclick = goHome;
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
        globalIcons.style.display = 'none';
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
        board = Array(size * size).fill(0);
        score = 0;
        moves = gameMode === 'normal' ? 1000 : 0;
        maxTile = 2;
        prevBoard = null;
        updateAchievementList();
        updateEvolutionBook();
        addNewTile(); addNewTile();
        updateUI();
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
        board.forEach(v => {
            const t = document.createElement('div'); t.className = 'tile';
            if(v>0) {
                if(v > maxTile) maxTile = v;
                if(v > maxTileEver) {
                    maxTileEver = v;
                    localStorage.setItem('darwin_max_tile', maxTileEver);
                    updateEvolutionBook();
                }
                t.innerHTML = `<div class="tile-inner" style="background-image:url('${tileImages[v]}')"></div>`;
            }
            grid.appendChild(t);
        });
        updateAchievementList();
    }

    // 技能
    document.getElementById('btn-undo').onclick = () => {
        if(!prevBoard || score < 100) return;
        score -= 100; board = [...prevBoard]; updateUI();
    };
    document.getElementById('btn-volcano').onclick = () => {
        if(score < 500) return;
        let targets = board.map((v,i)=>(v>0&&v<=8)?i:-1).filter(i=>i!==-1);
        if(!targets.length) return;
        score -= 500; playSfx(sfxVolcano);
        const layer = document.getElementById('explosion-layer');
        layer.innerHTML = '';
        for(let i=0; i<4; i++) {
            if(targets.length) {
                let r = Math.floor(Math.random()*targets.length);
                let idx = targets[r];
                let row = Math.floor(idx/4), col = idx%4;
                const boom = document.createElement('div');
                boom.className = 'explode-effect';
                boom.style.top = (row*(116+8)) + 'px';
                boom.style.left = (col*(116+8)) + 'px';
                layer.appendChild(boom);
                board[idx] = 0; targets.splice(r, 1);
            }
        }
        setTimeout(() => layer.innerHTML = '', 600);
        updateUI();
    };

    // 核心邏輯
    function move(dir) {
        if(!modalComplete.classList.contains('hidden') || !modalGameOver.classList.contains('hidden')) return;
        prevBoard = [...board];
        let moved = false;
        let temp = [...board];
        let currentMax = maxTile;
        const rotate = (b) => { let n=Array(16).fill(0); for(let r=0;r<4;r++) for(let c=0;c<4;c++) n[c*4+(3-r)] = b[r*4+c]; return n; };
        let rots = 0;
        if(dir==='left') rots=2; if(dir==='up') rots=1; if(dir==='down') rots=3;
        for(let k=0; k<rots; k++) temp = rotate(temp);
        for(let r=0; r<4; r++) {
            let row = []; for(let c=0; c<4; c++) row.push(temp[r*4+c]);
            let fil = row.filter(v=>v);
            let res = [];
            for(let k=0; k<fil.length; k++) {
                if(fil[k]===fil[k+1]) { 
                    let newVal = fil[k]*2;
                    res.push(newVal); score+=newVal; playSfx(sfxMerge); k++;
                    if(newVal > maxTile) maxTile = newVal; 
                } else res.push(fil[k]);
            }
            while(res.length<4) res.unshift(0);
            for(let c=0; c<4; c++) temp[r*4+c] = res[c];
        }
        let back = (4-rots)%4; for(let k=0; k<back; k++) temp = rotate(temp);
        if(JSON.stringify(board)!==JSON.stringify(temp)) { board=temp; moved=true; }

        if(moved) {
            addNewTile(); updateUI();
            if (maxTile > currentMax) playGodSequence(godStates.newEl);
            else playGodSequence(godStates.random);

            if(gameMode==='normal') {
                moves--; if(moves<=0) showGameOver(false);
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
            playGodSequence(godStates.victory);
        } else {
            modalGameOver.classList.remove('hidden');
            playSfx(sfxFail);
            playGodSequence(godStates.fail);
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

    function updateAchievementList() {
        const list = document.getElementById('achievement-list-container');
        if(!list) return; list.innerHTML = '';
        const achs = [{t:"生命的火花",d:"合成單細胞",g:2},{t:"陸地霸主",d:"演化出恐龍",g:64},{t:"智慧曙光",d:"演化出野人",g:1024},{t:"機械飛昇",d:"成為生化人",g:32768},{t:"創世之神",d:"達到頂點",g:131072}];
        achs.forEach(a => {
            const done = maxTileEver >= a.g; 
            const cls = done ? 'ach-item completed' : 'ach-item';
            const st = done ? 'images/02_achievement/ach_finish_img.png' : 'images/02_achievement/ach_img.png';
            list.innerHTML += `<div class="${cls}"><div class="ach-col-icon"><img src="${tileImages[a.g]}"></div><div class="ach-col-title">${a.t}</div><div class="ach-col-desc">${a.d}</div><div class="ach-col-status"><img src="${st}"></div></div>`;
        });
    }
    function updateEvolutionBook() {
        const left = document.getElementById('evo-grid-left');
        const right = document.getElementById('evo-grid-right');
        if(!left) return;
        left.innerHTML = `<div class="book-item title-card"><img src="images/03_evolution/help_txt.png"></div>`;
        right.innerHTML = '';
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

    document.addEventListener('keydown', e => {
        if(document.getElementById('game-screen').classList.contains('active')) {
            if(e.key==='ArrowLeft') move('left'); if(e.key==='ArrowRight') move('right');
            if(e.key==='ArrowUp') move('up'); if(e.key==='ArrowDown') move('down');
        }
    });
    const grid = document.getElementById('grid-container');
    let tx=0, ty=0;
    if(grid) {
        grid.addEventListener('touchstart', e => { tx=e.touches[0].clientX; ty=e.touches[0].clientY; grid.style.transition='none'; }, {passive:false});
        grid.addEventListener('touchmove', e => { 
            e.preventDefault(); 
            let dx=e.touches[0].clientX-tx, dy=e.touches[0].clientY-ty;
            grid.style.transform = `translate(${Math.max(-15, Math.min(15, dx))}px, ${Math.max(-15, Math.min(15, dy))}px)`;
        }, {passive:false});
        grid.addEventListener('touchend', e => {
            grid.style.transition='transform 0.2s'; grid.style.transform='translate(0,0)';
            let dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
            if(Math.abs(dx)>Math.abs(dy)) { if(Math.abs(dx)>30) move(dx>0?'right':'left'); }
            else { if(Math.abs(dy)>30) move(dy>0?'down':'up'); }
        });
    }
    
    // 結算按鈕
    document.getElementById('btn-modal-close').addEventListener('click', goHome);
    document.getElementById('btn-modal-retry').addEventListener('click', () => {
        modalGameOver.classList.add('hidden');
        initBoard();
    });
});