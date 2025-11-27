document.addEventListener('DOMContentLoaded', () => {
    
    // 1. 自動縮放
    function resizeGame() {
        const container = document.getElementById('game-container');
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const targetW = 1386;
        const targetH = 640;
        const scale = Math.min(winW / targetW, winH / targetH);
        container.style.transform = `scale(${scale})`;
    }
    window.addEventListener('resize', resizeGame);
    resizeGame();

    // 2. 音樂與音效
    const bgMusic = document.getElementById('bg-music');
    const sfxClick = document.getElementById('sfx-click');
    const btnToggleSound = document.getElementById('btn-toggle-sound');
    const btnGameSound = document.getElementById('btn-game-sound');
    const imgSound = document.getElementById('img-sound');
    const imgGameSound = document.getElementById('img-game-sound');
    let isSoundOn = true;

    function playClickSound() {
        if(isSoundOn && sfxClick) {
            sfxClick.currentTime = 0;
            sfxClick.play().catch(()=>{});
        }
    }

    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.hover-effect')) playClickSound();
        if(isSoundOn && bgMusic && bgMusic.paused) bgMusic.play().catch(e => {});
    }, { capture: true });

    function toggleSoundState(e) {
        if(e) e.stopPropagation();
        isSoundOn = !isSoundOn;
        const iconPath = isSoundOn ? "images/01_lobby/btn_sound_on.png" : "images/01_lobby/btn_sound_off.png";
        if(imgSound) imgSound.src = iconPath;
        if(imgGameSound) imgGameSound.src = iconPath;
        
        if (isSoundOn) bgMusic.play(); else bgMusic.pause();
    }
    if(btnToggleSound) btnToggleSound.addEventListener('click', toggleSoundState);
    if(btnGameSound) btnGameSound.addEventListener('click', toggleSoundState);

    // 3. UI 互動
    const globalIcons = document.getElementById('global-icons');
    const modalAchieve = document.getElementById('modal-achievement');
    const modalHelp = document.getElementById('modal-help');
    
    const btnOpenAchieve = document.getElementById('btn-open-achievement');
    const btnOpenHelp = document.getElementById('btn-open-help');
    const btnGameHelp = document.getElementById('btn-game-help');
    const btnCloseAchieve = document.getElementById('btn-close-achievement');
    
    let isInGame = false;

    function toggleModal(targetModal) {
        const isTargetOpen = !targetModal.classList.contains('hidden');
        modalAchieve.classList.add('hidden');
        modalHelp.classList.add('hidden');

        if (!isTargetOpen) {
            targetModal.classList.remove('hidden');
            if(globalIcons) globalIcons.style.display = 'flex';
        } else {
            if (isInGame) {
                if(globalIcons) globalIcons.style.display = 'none';
            } else {
                if(globalIcons) globalIcons.style.display = 'flex';
            }
        }
    }

    if(btnOpenAchieve) btnOpenAchieve.addEventListener('click', () => toggleModal(modalAchieve));
    if(btnOpenHelp) btnOpenHelp.addEventListener('click', () => toggleModal(modalHelp));
    if(btnGameHelp) btnGameHelp.addEventListener('click', () => toggleModal(modalHelp));
    if(btnCloseAchieve) btnCloseAchieve.addEventListener('click', () => toggleModal(modalAchieve));

    const bindBtn = (id, func) => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('click', func);
    };

    bindBtn('btn-normal', () => startGame('normal'));
    bindBtn('btn-endless', () => startGame('endless'));
    bindBtn('btn-back-home', goHome);
    bindBtn('btn-modal-close', goHome);
    bindBtn('btn-modal-retry', () => {
        document.getElementById('modal-gameover').classList.add('hidden');
        initBoard();
    });

    // 4. 遊戲與圖鑑
    const tileImages = {
        2: 'images/03_evolution/n2.png',
        4: 'images/03_evolution/n4.png',
        8: 'images/03_evolution/n8.png',
        16: 'images/03_evolution/n16.png',
        32: 'images/03_evolution/n32.png',
        64: 'images/03_evolution/n64.png',
        128: 'images/03_evolution/n128.png',
        256: 'images/03_evolution/n256.png',
        512: 'images/03_evolution/n512.png',
        1024: 'images/03_evolution/n1024.png',
        2048: 'images/03_evolution/n2048.png',
        4096: 'images/03_evolution/n4096.png',
        8192: 'images/03_evolution/n8192.png',
        16384: 'images/03_evolution/n16384.png',
        32768: 'images/03_evolution/n32768.png',
        65536: 'images/03_evolution/n65536.png',
        131072: 'images/03_evolution/n131072.png'
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

    const leftGrid = document.getElementById('evo-grid-left');
    const rightGrid = document.getElementById('evo-grid-right');
    if (leftGrid && rightGrid) {
        leftGrid.innerHTML = ''; rightGrid.innerHTML = '';
        const titleDiv = document.createElement('div');
        titleDiv.className = 'book-item title-card';
        titleDiv.innerHTML = `<img src="images/03_evolution/help_txt.png" alt="演化">`;
        leftGrid.appendChild(titleDiv);

        evolutionData.forEach((item, index) => {
            const wrapper = document.createElement('div');
            const numStr = (index + 1).toString().padStart(2, '0');
            if (item.isUnlocked) {
                wrapper.className = 'book-item';
                wrapper.innerHTML = `<img class="item-frame" src="images/03_evolution/sl_bg.png"><img class="item-creature" src="${tileImages[item.val]}"><div class="item-info"><span class="num-text">${numStr}</span><span class="name-text">${item.name}</span></div>`;
            } else {
                wrapper.className = 'book-item locked';
                wrapper.innerHTML = `<img class="item-frame" src="images/03_evolution/unknown.png">`;
            }
            if (index < 8) leftGrid.appendChild(wrapper); else rightGrid.appendChild(wrapper);
        });
    }

    // 遊戲核心
    const godStates = { idle: 'images/04_game/mission.png', thinking: 'images/04_game/alien_random/alien_random1.png', success: 'images/04_game/alien_victory/alien_victory1.png', fail: 'images/04_game/alien_fail/alien_fail1.png' };
    const bgWin = "url('images/02_achievement/ach_finish_bg.png')";
    const bgFail = "url('images/06_fail/lvl_failed.png')";
    const gridContainer = document.getElementById('grid-container');
    const scoreDisplay = document.getElementById('score-display');
    const movesDisplay = document.getElementById('moves-display');
    const godCharacter = document.getElementById('god-character');
    const modalGameOver = document.getElementById('modal-gameover');
    const modalBgLayer = document.getElementById('modal-bg-layer');

    const size = 4;
    let board = [];
    let score = 0;
    let moves = 0;
    let gameMode = 'endless'; 
    const maxMovesNormal = 1000;

    function startGame(mode) {
        gameMode = mode;
        isInGame = true;
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        if(globalIcons) globalIcons.style.display = 'none';
        initBoard();
    }

    function goHome() {
        isInGame = false;
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('start-screen').classList.add('active');
        document.getElementById('modal-gameover').classList.add('hidden');
        if(globalIcons) globalIcons.style.display = 'flex';
    }

    function initBoard() {
        board = Array(size * size).fill(0);
        score = 0;
        moves = gameMode === 'normal' ? maxMovesNormal : 0;
        updateUI();
        setGodState('idle');
        addNewTile();
        addNewTile();
        drawBoard();
    }

    function addNewTile() {
        let emptyTiles = [];
        board.forEach((val, index) => {
            if (val === 0) emptyTiles.push(index);
        });
        if (emptyTiles.length > 0) {
            let r = Math.floor(Math.random() * emptyTiles.length);
            board[emptyTiles[r]] = Math.random() > 0.9 ? 4 : 2;
        }
    }

    function drawBoard() {
        if(!gridContainer) return;
        gridContainer.innerHTML = '';
        board.forEach(value => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            if (value > 0) {
                const inner = document.createElement('div');
                inner.classList.add('tile-inner');
                const imgPath = tileImages[value] || tileImages[2];
                inner.style.backgroundImage = `url('${imgPath}')`;
                tile.appendChild(inner);
            }
            gridContainer.appendChild(tile);
        });
    }

    function updateUI() {
        if(scoreDisplay) scoreDisplay.innerText = score;
        if(movesDisplay) movesDisplay.innerText = (gameMode === 'normal') ? moves : "∞";
    }

    function setGodState(state) {
        if(godCharacter) {
            godCharacter.src = godStates[state];
            if (state !== 'idle') {
                setTimeout(() => {
                    if (!modalGameOver.classList.contains('active') && !checkGameOver()) {
                        godCharacter.src = godStates.idle;
                    }
                }, 1500);
            }
        }
    }

    function move(direction) {
        if (checkGameOver()) return;
        let hasMoved = false;
        let merged = false;
        let tempBoard = [...board];
        const rotateBoard = (b) => {
            let newB = Array(size*size).fill(0);
            for(let r=0; r<size; r++) for(let c=0; c<size; c++) newB[c*size + (size-1-r)] = b[r*size+c];
            return newB;
        };
        
        // ★★★ 修正後的方向邏輯 (解決上下相反) ★★★
        let rotations = 0;
        if (direction === 'left') rotations = 2;
        if (direction === 'up') rotations = 1;   // 修正：上是轉 1 次 (90度)
        if (direction === 'down') rotations = 3; // 修正：下是轉 3 次 (270度)

        for(let i=0; i<rotations; i++) tempBoard = rotateBoard(tempBoard);
        for (let r = 0; r < size; r++) {
            let row = [];
            for(let c=0; c<size; c++) row.push(tempBoard[r*size+c]);
            let filtered = row.filter(v => v !== 0);
            let newRow = [];
            for (let i = 0; i < filtered.length; i++) {
                if (i < filtered.length - 1 && filtered[i] === filtered[i+1]) {
                    let newVal = filtered[i] * 2;
                    newRow.push(newVal);
                    score += newVal;
                    merged = true;
                    i++;
                } else {
                    newRow.push(filtered[i]);
                }
            }
            while (newRow.length < size) newRow.unshift(0); 
            for(let c=0; c<size; c++) tempBoard[r*size+c] = newRow[c];
        }
        let backRotations = (4 - rotations) % 4;
        for(let i=0; i<backRotations; i++) tempBoard = rotateBoard(tempBoard);
        
        if (JSON.stringify(board) !== JSON.stringify(tempBoard)) {
            board = tempBoard;
            hasMoved = true;
        }
        if (hasMoved) {
            addNewTile();
            drawBoard();
            if (gameMode === 'normal') {
                moves--;
                if (moves <= 0) showGameOver(false);
            }
            updateUI();
            setGodState(merged ? 'success' : 'thinking');
            if (board.includes(131072)) showGameOver(true);
            else if (checkGameOver()) showGameOver(false);
        }
    }

    function checkGameOver() {
        if (board.includes(0)) return false;
        for (let i = 0; i < size * size; i++) {
            let r = Math.floor(i / size);
            let c = i % size;
            let current = board[i];
            if (c < size - 1 && current === board[i + 1]) return false;
            if (r < size - 1 && current === board[i + size]) return false;
        }
        return true;
    }

    function showGameOver(isWin) {
        modalGameOver.classList.remove('hidden');
        if (isWin) {
            modalBgLayer.style.backgroundImage = bgWin;
            setGodState('success');
        } else {
            modalBgLayer.style.backgroundImage = bgFail;
            setGodState('fail');
        }
    }

    document.addEventListener('keydown', (e) => {
        if (!document.getElementById('game-screen').classList.contains('active')) return;
        if (e.key === 'ArrowLeft') move('left');
        if (e.key === 'ArrowRight') move('right');
        if (e.key === 'ArrowUp') move('up');
        if (e.key === 'ArrowDown') move('down');
    });

    // ★★★ 拖動特效與方向修正 ★★★
    let touchStartX = 0;
    let touchStartY = 0;
    if(gridContainer){
        gridContainer.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            // 移除 transition 以便即時跟隨手指
            gridContainer.style.transition = 'none';
        }, {passive: false});

        gridContainer.addEventListener('touchmove', e => {
            e.preventDefault(); // 防止滾動
            let touchCurrentX = e.touches[0].clientX;
            let touchCurrentY = e.touches[0].clientY;
            let dx = touchCurrentX - touchStartX;
            let dy = touchCurrentY - touchStartY;
            
            // 限制最大移動距離 (視覺回饋)
            const maxDrag = 15; 
            let tx = Math.max(-maxDrag, Math.min(maxDrag, dx));
            let ty = Math.max(-maxDrag, Math.min(maxDrag, dy));
            
            gridContainer.style.transform = `translate(${tx}px, ${ty}px)`;
        }, {passive: false});

        gridContainer.addEventListener('touchend', e => {
            let touchEndX = e.changedTouches[0].clientX;
            let touchEndY = e.changedTouches[0].clientY;
            
            // 恢復原位
            gridContainer.style.transition = 'transform 0.2s ease-out';
            gridContainer.style.transform = 'translate(0, 0)';

            let dx = touchEndX - touchStartX;
            let dy = touchEndY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) move(dx > 0 ? 'right' : 'left');
            } else {
                // 這裡配合上面的 rotations 修正：dy > 0 是往下滑 (down)，dy < 0 是往上滑 (up)
                if (Math.abs(dy) > 30) move(dy > 0 ? 'down' : 'up');
            }
        });
    }
});