document.addEventListener('DOMContentLoaded', () => {
    
    // 1. 縮放
    function resizeGame() {
        const container = document.getElementById('game-container');
        const scale = Math.min(window.innerWidth / 1386, window.innerHeight / 640);
        container.style.transform = `scale(${scale})`;
    }
    window.addEventListener('resize', resizeGame);
    resizeGame();

    // 2. 音樂
    const bgMusic = document.getElementById('bg-music');
    const sfxClick = document.getElementById('sfx-click');
    const btnToggleSound = document.getElementById('btn-toggle-sound');
    const imgSound = document.getElementById('img-sound');
    let isSoundOn = true;

    function playClick() { if(isSoundOn) { sfxClick.currentTime=0; sfxClick.play().catch(()=>{}); } }
    
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.hover-effect')) playClick();
        if(isSoundOn && bgMusic.paused) bgMusic.play().catch(()=>{});
    }, { capture: true });

    if(btnToggleSound) {
        btnToggleSound.addEventListener('click', (e) => {
            e.stopPropagation();
            isSoundOn = !isSoundOn;
            const path = isSoundOn ? "images/01_lobby/btn_sound_on.png" : "images/01_lobby/btn_sound_off.png";
            imgSound.src = path;
            if(isSoundOn) bgMusic.play(); else bgMusic.pause();
        });
    }

    // 3. UI 與 彈窗
    const globalIcons = document.getElementById('global-icons');
    const modalAchieve = document.getElementById('modal-achievement');
    const modalHelp = document.getElementById('modal-help');
    const modalTarget = document.getElementById('modal-target');
    const modalGameOver = document.getElementById('modal-gameover');
    
    let isInGame = false;

    function toggleModal(targetModal) {
        const wasHidden = targetModal.classList.contains('hidden');
        
        // 先全關
        modalAchieve.classList.add('hidden');
        modalHelp.classList.add('hidden');

        // 如果原本是隱藏的，現在就打開
        if (wasHidden) {
            targetModal.classList.remove('hidden');
        }
        // 只要有彈窗打開，全域按鈕就要顯示 (方便關閉)
        // 否則看現在是否在遊戲中決定顯示與否
        const anyOpen = !modalAchieve.classList.contains('hidden') || !modalHelp.classList.contains('hidden');
        
        if (anyOpen) {
            globalIcons.style.display = 'flex';
        } else {
            if (isInGame) globalIcons.style.display = 'none';
            else globalIcons.style.display = 'flex';
        }
    }

    document.getElementById('btn-open-achievement').addEventListener('click', () => {
        updateAchievementList();
        toggleModal(modalAchieve);
    });
    document.getElementById('btn-open-help').addEventListener('click', () => {
        updateEvolutionBook();
        toggleModal(modalHelp);
    });
    document.getElementById('btn-close-achievement').addEventListener('click', () => toggleModal(modalAchieve));

    // 4. 遊戲流程
    const tileImages = {
        2: 'images/03_evolution/n2.png', 4: 'images/03_evolution/n4.png', 8: 'images/03_evolution/n8.png',
        16: 'images/03_evolution/n16.png', 32: 'images/03_evolution/n32.png', 64: 'images/03_evolution/n64.png',
        128: 'images/03_evolution/n128.png', 256: 'images/03_evolution/n256.png', 512: 'images/03_evolution/n512.png',
        1024: 'images/03_evolution/n1024.png', 2048: 'images/03_evolution/n2048.png', 4096: 'images/03_evolution/n4096.png',
        8192: 'images/03_evolution/n8192.png', 16384: 'images/03_evolution/n16384.png', 32768: 'images/03_evolution/n32768.png',
        65536: 'images/03_evolution/n65536.png', 131072: 'images/03_evolution/n131072.png'
    };
    
    const evolutionData = [
        { val: 2, name: "原蟲", isUnlocked: true }, { val: 4, name: "軟體", isUnlocked: true },
        { val: 8, name: "甲殼", isUnlocked: true }, { val: 16, name: "魚類", isUnlocked: true },
        { val: 32, name: "兩棲", isUnlocked: true }, { val: 64, name: "爬蟲", isUnlocked: true },
        { val: 128, name: "囓齒", isUnlocked: true }, { val: 256, name: "哺乳", isUnlocked: true },
        { val: 512, name: "靈長", isUnlocked: true }, { val: 1024, name: "野人", isUnlocked: true },
        { val: 2048, name: "人類", isUnlocked: true }, { val: 4096, name: "天才", isUnlocked: false },
        { val: 8192, name: "喪屍", isUnlocked: false }, { val: 16384, name: "進化", isUnlocked: false },
        { val: 32768, name: "生化", isUnlocked: false }, { val: 65536, name: "外星", isUnlocked: false },
        { val: 131072, name: "神", isUnlocked: false }
    ];

    const achievements = [
        { title: "生命的火花", desc: "合成出單細胞", goal: 2 },
        { title: "陸地霸主", desc: "演化出恐龍", goal: 64 },
        { title: "智慧的曙光", desc: "演化出原始人", goal: 1024 },
        { title: "機械飛昇", desc: "成為生化人", goal: 32768 },
        { title: "創世之神", desc: "達到演化頂點", goal: 131072 }
    ];

    const size = 4;
    let board = [];
    let score = 0;
    let moves = 0;
    let maxTile = 2;
    let gameMode = 'endless';
    let prevBoard = null;
    let prevScore = 0;

    // 按鈕綁定
    document.getElementById('btn-endless').addEventListener('click', () => startGame('endless'));
    document.getElementById('btn-normal').addEventListener('click', () => {
        // 普通模式：先顯示目標，再開始
        const targetHTML = `<img src="${tileImages[2048]}" style="width:80px;"><p>目標：合成出 人類 (2048)</p>`;
        document.getElementById('target-content').innerHTML = targetHTML;
        modalTarget.classList.remove('hidden');
    });

    document.getElementById('btn-target-confirm').addEventListener('click', () => {
        modalTarget.classList.add('hidden');
        startGame('normal');
    });

    document.getElementById('btn-back-home').addEventListener('click', goHome);
    
    // 技能
    document.getElementById('btn-undo').addEventListener('click', () => {
        if(!prevBoard) return showDialog("無法上一步");
        if(score < 100) return showDialog("分數不足 (-100)");
        score -= 100;
        board = [...prevBoard];
        updateUI();
        showDialog("時光倒流！");
        showScoreEffect(100);
    });

    document.getElementById('btn-volcano').addEventListener('click', () => {
        if(score < 500) return showDialog("分數不足 (-500)");
        let targets = board.map((v, i) => (v > 0 && v <= 8) ? i : -1).filter(i => i !== -1);
        if(targets.length === 0) return showDialog("無低階生物");
        
        score -= 500;
        for(let i=0; i<4; i++) {
            if(targets.length) {
                let r = Math.floor(Math.random() * targets.length);
                board[targets[r]] = 0;
                targets.splice(r, 1);
            }
        }
        updateUI();
        showDialog("天火降臨！");
        showScoreEffect(500);
    });

    document.getElementById('btn-modal-retry').addEventListener('click', () => {
        modalGameOver.classList.add('hidden');
        initBoard();
    });
    document.getElementById('btn-modal-close').addEventListener('click', goHome);

    function startGame(mode) {
        gameMode = mode;
        isInGame = true;
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        globalIcons.style.display = 'none';
        initBoard();
    }

    function goHome() {
        isInGame = false;
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('start-screen').classList.add('active');
        modalGameOver.classList.add('hidden');
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
    }

    function addNewTile() {
        let empty = [];
        board.forEach((v, i) => { if(v===0) empty.push(i); });
        if(empty.length) board[empty[Math.floor(Math.random()*empty.length)]] = Math.random()>0.9?4:2;
    }

    function updateUI() {
        document.getElementById('score-display').innerText = score;
        document.getElementById('moves-display').innerText = gameMode === 'normal' ? moves : "∞";
        const grid = document.getElementById('grid-container');
        grid.innerHTML = '';
        board.forEach(v => {
            const t = document.createElement('div'); t.className = 'tile';
            if(v>0) {
                if(v > maxTile) maxTile = v;
                t.innerHTML = `<div class="tile-inner" style="background-image:url('${tileImages[v]}')"></div>`;
            }
            grid.appendChild(t);
        });
        updateAchievementList(); // 每次移動檢查成就
    }

    function showDialog(text) {
        const d = document.getElementById('god-dialog');
        d.innerText = text; d.classList.remove('hidden');
        setTimeout(()=>d.classList.add('hidden'), 1500);
    }

    function showScoreEffect(val) {
        const ef = document.getElementById('score-effect');
        ef.innerText = `-${val}`;
        ef.style.animation = 'none';
        ef.offsetHeight; 
        ef.style.animation = 'floatUp 1s forwards';
    }

    // 成就列表渲染
    function updateAchievementList() {
        const list = document.getElementById('achievement-list-container');
        if(!list) return;
        list.innerHTML = '';
        achievements.forEach(ach => {
            const done = maxTile >= ach.goal;
            const statusImg = done ? 'images/02_achievement/ach_finish_img.png' : 'images/02_achievement/ach_img.png';
            const cls = done ? 'ach-item completed' : 'ach-item';
            list.innerHTML += `
                <div class="${cls}">
                    <div class="ach-col-icon"><img src="${tileImages[ach.goal]}"></div>
                    <div class="ach-col-title">${ach.title}</div>
                    <div class="ach-col-desc">${ach.desc}</div>
                    <div class="ach-col-status"><img src="${statusImg}"></div>
                </div>`;
        });
    }

    // 圖鑑渲染
    function updateEvolutionBook() {
        const left = document.getElementById('evo-grid-left');
        const right = document.getElementById('evo-grid-right');
        if(!left) return;
        left.innerHTML = `<div class="book-item title-card"><img src="images/03_evolution/help_txt.png"></div>`;
        right.innerHTML = '';

        evolutionData.forEach((item, i) => {
            const unlocked = maxTile >= item.val;
            const num = (i+1).toString().padStart(2,'0');
            const w = document.createElement('div');
            if(unlocked) {
                w.className = 'book-item';
                w.innerHTML = `<img class="item-frame" src="images/03_evolution/sl_bg.png"><img class="item-creature" src="${tileImages[item.val]}"><div class="item-info"><span class="num-text">${num}</span><span class="name-text">${item.name}</span></div>`;
            } else {
                w.className = 'book-item locked';
                w.innerHTML = `<img class="item-frame" src="images/03_evolution/unknown.png"><div class="item-info"><span class="name-text">???</span></div>`;
            }
            if(i < 8) left.appendChild(w); else right.appendChild(w);
        });
    }

    // 2048 核心邏輯
    function move(dir) {
        prevBoard = [...board];
        prevScore = score;

        let moved = false;
        let temp = [...board];
        const rotate = (b) => {
            let n = Array(size*size).fill(0);
            for(let r=0; r<size; r++) for(let c=0; c<size; c++) n[c*size+(size-1-r)] = b[r*size+c];
            return n;
        };
        
        let rots = 0;
        if(dir==='left') rots=2; if(dir==='up') rots=1; if(dir==='down') rots=3;
        for(let k=0; k<rots; k++) temp = rotate(temp);

        for(let r=0; r<size; r++) {
            let row = [];
            for(let c=0; c<size; c++) row.push(temp[r*size+c]);
            let fil = row.filter(v=>v);
            let res = [];
            for(let k=0; k<fil.length; k++) {
                if(fil[k]===fil[k+1]) { res.push(fil[k]*2); score+=fil[k]*2; k++; }
                else res.push(fil[k]);
            }
            while(res.length<size) res.unshift(0);
            for(let c=0; c<size; c++) temp[r*size+c] = res[c];
        }
        
        let back = (4-rots)%4;
        for(let k=0; k<back; k++) temp = rotate(temp);

        if(JSON.stringify(board)!==JSON.stringify(temp)) {
            board = temp; moved = true;
        }

        if(moved) {
            addNewTile(); updateUI();
            if(gameMode==='normal') { moves--; if(moves<=0) showGameOver(false); }
            if(board.includes(2048) && gameMode==='normal') showGameOver(true); // 範例2048贏
        }
    }

    function showGameOver(win) {
        modalGameOver.classList.remove('hidden');
        const bg = win ? "url('images/02_achievement/ach_finish_bg.png')" : "url('images/06_fail/lvl_failed.png')";
        document.getElementById('modal-bg-layer').style.backgroundImage = bg;
    }

    document.addEventListener('keydown', e => {
        if(document.getElementById('game-screen').classList.contains('active')) {
            if(e.key==='ArrowLeft') move('left');
            if(e.key==='ArrowRight') move('right');
            if(e.key==='ArrowUp') move('up');
            if(e.key==='ArrowDown') move('down');
        }
    });
});