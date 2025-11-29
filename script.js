document.addEventListener('DOMContentLoaded', () => {
    
    function resizeGame() {
        const container = document.getElementById('game-container');
        const scale = Math.min(window.innerWidth / 1386, window.innerHeight / 640);
        container.style.transform = `scale(${scale})`;
    }
    window.addEventListener('resize', resizeGame);
    resizeGame();

    let maxTileEver = parseInt(localStorage.getItem('darwin_max_tile')) || 2;

    // 音效
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
    let lastMoveTime = Date.now();
    let isPriorityDialogue = false;
    let priorityTimeout;

    // --- 對話庫 ---
    const godQuotes = {
        general: [
            "這鍋湯好像煮太久了...", "你確定那個不是突變嗎？", "我要不要加點辣椒醬？", "糟糕，手滑了一下...", 
            "演化論？那是我隨便寫的，別太認真。", "再合不出人，我就要滅世囉！", "看！有流星！...騙你的。", 
            "別讓我的實驗室爆炸，拜託。", "我是不是該去放個假？去火星怎麼樣？", "這隻長得有點像我前任...", 
            "再合一下，就一下！", "你的手指累了嗎？我看得都累了。", "這就是生命的奇蹟...", 
            "宇宙大爆炸其實是我打噴嚏造成的。", "今天天氣真好，適合演化。", "那個角落是不是發霉了？", 
            "我剛剛是不是眨眼了？錯過了什麼嗎？", "嗯...這一步很深奧，你看得懂嗎？", "不要碰我的培養皿！", 
            "你知道我在看著你嗎？一直在看著。", "我覺得加點水會更好。", "進化真是門藝術，也是門玄學。", 
            "小心那隻會咬人！", "我打賭你合不出神。", "上一局的玩家比你快喔。", 
            "你相信命運嗎？還是相信機率？", "這大概就是所謂的「緣分」吧。", "哎呀，那個基因好像接反了。", 
            "沒關係，失敗乃成功之母，雖然媽媽有點多。", "我記得我有設定存檔點... 應該吧？", 
            "別擔心，滅絕是常有的事。", "你想看恐龍跳舞嗎？", "人類什麼時候才會學會和平？", 
            "這實驗比我想像的還久。", "我的咖啡涼了...", "你有聽到什麼聲音嗎？可能是宇宙在膨脹。", 
            "如果生物會說話，它們一定在罵你。", "好無聊喔，來點災難如何？", "開玩笑的，我很有愛心。",
            "你知道這遊戲是誰做的嗎？反正不是我。", "按快一點，我趕時間！", "慢慢來，反正宇宙還很長。",
            "這個方塊看起來很孤單，幫它找個伴吧。", "我好像忘了餵我的寵物黑洞...", "別停下來！演化不能停！",
            "嘿，我在看著你喔，一直都在。","我覺得那隻生物長得有點像你的主管。","你知道嗎？恐龍其實原本是想做成粉紅色的。",
            "有人點外送嗎？我好像聞到雞排的味道。",
"演化就像煮湯，隨便亂加料有時候會變好喝。",
"我的手指有點痠... 喔對了我沒有手指。",
"這裡的 Wi-Fi 訊號怎麼這麼差？宇宙輻射干擾嗎？",
"你在猶豫什麼？閉上眼睛按下去就對了！",
"如果不小心毀滅世界，記得按『上一步』，我有給折扣。",
"其實我原本想把人類設計成有翅膀的，後來忘了。",
"這裡的背景音樂不錯吧？我選的。",
"如果我是你，我會往左滑... 騙你的，嘻嘻。",
"你相信外星人嗎？其實他們就在隔壁棚。",
"這局玩完要不要去喝杯珍奶？",
"那個... 你螢幕好像有點髒，要不要擦一下？",
"我創造了萬物，但我還是搞不懂為什麼襪子會少一隻。",
"別太嚴肅，這只是一個宇宙而已。",
"你有沒有覺得這個方塊長得很好吃？",
"啊！剛才那個細菌是不是對我比中指？",
"演化論？那其實是我的版本更新日誌啦。",
"我以前也想過創造皮卡丘，但是版權費太貴了。",
"不要一直盯著我看，我會害羞。",
"今天的運氣不錯，適合突變。",
"如果失敗了別氣餒，我第一次造世界的時候也忘了加地心引力。",
"快點快點，隔壁宇宙的上帝都在笑我們慢了。",
"你知道為什麼斑馬有條紋嗎？因為我當時筆沒水了。",
"好想睡覺... 上帝也會失眠嗎？",
"你的手指是上帝之手... 的代理人。",
"如果把這個生物放大一百倍，那就是哥吉拉了。",
"別晃了，裡面的生物都要暈車了！",
"這一步走得真妙！雖然我不知道你在幹嘛。",
"其實地球是圓的還是平的，看我心情而定。",
"你有沒有聽到貓叫聲？還是那是我的肚子在叫？",
"把這兩個合在一起... 蹦！驚喜！",
"我喜歡這個物種，留著當寵物好了。",
"為什麼長頸鹿脖子那麼長？因為上面空氣比較好啊。",
"你再不動作，我就要開始唱卡拉OK囉！",
"這遊戲比管理真的宇宙簡單多了，相信我。",
"哎呀，那個基因序列好像接反了... 算了沒差。",
"如果我有形體，我一定是全宇宙最帥的。",
"你在等良辰吉時嗎？",
"這個世界需要多一點愛，還有多一點高分。",
"小心！那隻生物看起來想咬你的手指。",
"其實我不討厭蟑螂，只是當時手滑多畫了幾筆。",
"你覺得如果人類有四隻手會比較方便嗎？",
"專心一點！雖然我也在發呆。",
"那個方塊在發光耶！喔，我看錯了。",
"我要不要現在降下一場糖果雨？",
"我覺得你的運氣來了，快合成！",
"這隻生物的表情看起來好無奈，像極了星期一的你。",
"你知道嗎？其實雲朵是棉花糖口味的。",
"我把幸運值調高了一點點，不用謝。",
"如果世界末日來了，記得帶上我。",
"為什麼沒有「獨角獸」？因為我把它們弄丟了。",
"這局如果破紀錄，我就... 就給你一個讚。",
"你看起來很專業，是演化系的嗎？",
"我想把天空換成紫色的，你覺得呢？",
"其實我也有選擇困難症，所以我創造了「隨機」。",
"動一下嘛，拜託拜託～",
"這就是所謂的神之操作嗎？"
            
        ],
        science: [
            "你知道嗎？章魚有三個心臟，兩個幫忙呼吸，一個幫忙全身。",
            "香蕉其實帶有微量的輻射，但你需要吃一千萬根才會死。",
            "蜂蜜是唯一一種不會變質的食物，三千年前的也能吃。",
            "樹懶消化一餐需要整整一個月的時間。",
            "你身體裡的碳原子，是恆星爆炸後的塵埃。",
            "海豚睡覺的時候，只會閉上一隻眼睛。",
            "貓咪其實是聽得懂你叫它的，只是它不想理你。",
            "長頸鹿的舌頭是黑色的，為了防曬。",
            "如果把你的DNA拉直，可以來回月球6000次。",
            "水母在這個地球上已經存在了6.5億年，比恐龍還久。",
            "豬其實抬頭看不了天空，生理構造限制。",
            "你知道嗎？你的胃壁每三天就會換新一次。",
            "牛有四個胃，這樣吃草比較有效率。",
            "鯊魚是沒有骨頭的，牠們只有軟骨。",
            "蝴蝶是用腳來嚐味道的喔！",
            "有些烏龜可以用屁股呼吸，很方便吧？",
            "鴕鳥的眼睛比它的腦袋還大。",
            "藍鯨的心臟有一輛小汽車那麼大。",
            "其實番茄是水果，不是蔬菜。",
            "北極熊的毛其實是透明的，不是白色的。",
            "你每分鐘會眨眼約15到20次。",
            "聲音在水中的傳播速度比在空氣中快四倍。",
            "閃電的溫度比太陽表面還要熱五倍。",
            "如果沒有口水，你是嚐不出食物味道的。",
            "考拉指紋跟人類幾乎一模一樣，警察都分不出來。",
            "大部分的灰塵其實是你掉下來的死皮。",
            "打噴嚏的速度可以超過時速160公里。",
            "人的大腦在晚上的活動比白天還活躍。",
            "你知道嗎？鑽石其實是可以燃燒的。"
        ],
        waiting: [
            "哈囉？有人在嗎？", "再不玩我就要睡著了...", "你在思考宇宙的奧秘嗎？", "時間是不等人的喔！",
            "快點快點！動起來！", "我等到花兒都謝了...", "螢幕壞了嗎？還是你睡著了？", "你可以的，動一下就好。",
            "不要讓生物等到發霉！", "嘿！醒醒！", "是不是該行動了？", "我在看著呢，別偷懶。",
            "你是在等流星許願嗎？", "生物們在抗議了！", "再不動我就要降下天罰囉 (開玩笑的)。", 
            "需要我幫你按嗎？可惜我碰不到螢幕。", "時間就是金錢，雖然這裡不用錢。", "這停頓... 是戰術性思考嗎？",
            "你是去上廁所了嗎？", "動一下嘛，拜託～"
        ],
        lowScore: ["還在玩泥巴啊？", "加油，離文明還很遠", "微生物的世界真單純", "快點讓他長出腳來！", "水裡比較好玩嗎？"],
        midScore: ["有點樣子了喔", "爬上陸地了沒？", "別讓恐龍滅絕了", "這就是適者生存", "哺乳類要崛起了！"],
        highScore: ["智慧的火花出現了！", "小心不要造出核彈", "人類真是麻煩的生物", "差不多可以飛向宇宙了", "你已經快超越我了！"]
    };

    const godSkillQuotes = {
        undo: ["後悔藥好吃嗎？", "時間倒流...作弊！", "好啦，再給你一次機會", "時光機啟動！", "這是最後一次喔 (騙你的)"],
        wave: ["洗香香囉！", "沖走不開心的事~", "咕嚕咕嚕...", "大浪來襲！", "海邊派對開始！"],
        volcano: ["烤肉派對開始！", "這就是熱情！", "蹦！世界清靜了", "岩漿來囉～", "太燙了嗎？"],
        lightning: ["天打雷劈！", "精準打擊 (笑)", "看誰運氣不好", "索爾是你？", "滋滋滋..."],
        tornado: ["轉吧七彩霓虹燈~", "暈了嗎？我也暈了", "大風吹~ 吹什麼？", "愛的魔力轉圈圈", "免費的雲霄飛車！"],
        ice: ["不准動！", "冷靜一下", "變成冰棒了", "急凍鳥！", "Freeze!"]
    };
    
    const godNewCreatureQuotes = {
        4: "軟趴趴的真可愛", 8: "有殼就不怕被吃了", 16: "會游泳了！", 32: "終於上岸了，恭喜！", 
        64: "哇！是大恐龍！吼～", 128: "這東西會偷吃起司", 256: "毛茸茸的，好想摸", 512: "跟我有點像...真帥",
        1024: "他們學會用火了！", 2048: "這物種會製造麻煩...", 4096: "腦袋變大了，智商up！",
        8192: "噁...這是什麼鬼東西", 16384: "這已經超越生物了吧？", 32768: "半人半機器，酷喔！",
        65536: "他們要飛去哪？", 131072: "嘿！那是我的位子！讓開！"
    };

    function startGodIdle() {
        clearInterval(godIdleInterval);
        
        function loop() {
            const delay = 3000 + Math.random() * 5000; 
            godIdleInterval = setTimeout(() => {
                if(!isPriorityDialogue && isInGame) {
                    // [修正] 即使在說話，如果不是優先對話，也可以做待機動作，不影響說話
                    if(!isAnimating) playGodSequence(godStates.random, 200);

                    if (Date.now() - lastMoveTime > 5000) {
                         if(Math.random() > 0.3) showGodDialog(godQuotes.waiting[Math.floor(Math.random() * godQuotes.waiting.length)]);
                    } else {
                        let dialogPool = [...godQuotes.general, ...godQuotes.science];
                        if (score < 1000) dialogPool = dialogPool.concat(godQuotes.lowScore);
                        else if (score < 5000) dialogPool = dialogPool.concat(godQuotes.midScore);
                        else dialogPool = dialogPool.concat(godQuotes.highScore);

                        showGodDialog(dialogPool[Math.floor(Math.random() * dialogPool.length)]);
                    }
                }
                loop();
            }, delay);
        }
        loop();
    }
    function stopGodIdle() { clearTimeout(godIdleInterval); }

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

    // ★ [新] 玩家操作時的快速反應
    function triggerGodReaction() {
        // 只做一次隨機動作，不進入循環，快速回饋
        if(!godChar) return;
        // 隨機選一張動作圖
        const randFrame = Math.floor(Math.random() * 4);
        godChar.src = godStates.random[randFrame];
        
        // 0.2秒後恢復
        setTimeout(() => {
            if(!isAnimating) godChar.src = godStates.idle;
        }, 200);
    }

    function showGodDialog(msg, isPriority = false) {
        if (!isPriority && isPriorityDialogue) return;

        const d = document.getElementById('god-dialog');
        d.innerText = msg; 
        d.classList.remove('hidden');
        
        if (isPriority) {
            isPriorityDialogue = true;
            clearTimeout(priorityTimeout);
            priorityTimeout = setTimeout(() => {
                d.classList.add('hidden');
                isPriorityDialogue = false;
            }, 2500);
        } else {
            setTimeout(()=>d.classList.add('hidden'), 2500);
        }
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
        lastMoveTime = Date.now();
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
        if(undoCooldown > 0) return showGodDialog(`冷卻中(${undoCooldown})`, true);
        if(!prevBoard || score < 300) return showGodDialog("分數不足", true);
        score -= 300; board = [...prevBoard]; undoCooldown = 10; lastMoveTime = Date.now();
        playSfx(sfxTime); updateUI(); showScoreEffect(300); 
        showGodDialog(godSkillQuotes.undo[Math.floor(Math.random()*godSkillQuotes.undo.length)], true);
        triggerGodReaction();
    };

    document.getElementById('skill-wave').onclick = () => {
        if(score < 500) return showGodDialog("分數不足", true);
        playSfx(sfxWave); score -= 500; lastMoveTime = Date.now();
        [0,1,4,5, 10,11,14,15].forEach(i => { if(board[i]>0 && frozenTurns[i]===0) { board[i]=0; addSkillOverlay(i, 'wave_block.png'); } });
        updateUI(); showScoreEffect(500);
        showGodDialog(godSkillQuotes.wave[Math.floor(Math.random()*godSkillQuotes.wave.length)], true);
        triggerGodReaction();
    };

    document.getElementById('skill-volcano').onclick = () => {
        if(score < 500) return showGodDialog("分數不足", true);
        playSfx(sfxExplode); score -= 500; lastMoveTime = Date.now();
        [2,3,6,7, 8,9,12,13].forEach(i => { if(board[i]>0 && frozenTurns[i]===0) { board[i]=0; addSkillOverlay(i, 'explode2.png'); } });
        updateUI(); showScoreEffect(500);
        showGodDialog(godSkillQuotes.volcano[Math.floor(Math.random()*godSkillQuotes.volcano.length)], true);
        triggerGodReaction();
    };

    document.getElementById('skill-lightning').onclick = () => {
        if(score < 1000) return showGodDialog("分數不足", true);
        const filled = board.map((v,i)=>(v>0 && frozenTurns[i]===0)?i:-1).filter(i=>i!==-1);
        if(!filled.length) return showGodDialog("無目標", true);
        playSfx(sfxThunder); score -= 1000; lastMoveTime = Date.now();
        const target = filled[Math.floor(Math.random()*filled.length)];
        board[target] = 0; addSkillOverlay(target, 'lightning_block.png');
        updateUI(); showScoreEffect(1000);
        showGodDialog(godSkillQuotes.lightning[Math.floor(Math.random()*godSkillQuotes.lightning.length)], true);
        triggerGodReaction();
    };

    document.getElementById('skill-typhoon').onclick = () => {
        if(score < 1000) return showGodDialog("分數不足", true);
        playSfx(sfxTornado); score -= 1000; lastMoveTime = Date.now();
        let movableIndices = [], movableValues = [];
        for(let i=0; i<16; i++) { if(frozenTurns[i] === 0) { movableIndices.push(i); movableValues.push(board[i]); } }
        for(let i = movableValues.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [movableValues[i], movableValues[j]] = [movableValues[j], movableValues[i]]; }
        movableIndices.forEach((idx, k) => { 
            board[idx] = movableValues[k]; 
            addSkillOverlay(idx, 'typhoon_block.png', 2500, 'tornado-fx'); 
        });
        document.querySelectorAll('.tile-inner').forEach(el => {
            el.classList.remove('tile-spin');
            void el.offsetWidth;
            el.classList.add('tile-spin');
        });
        updateUI(); showScoreEffect(1000);
        showGodDialog(godSkillQuotes.tornado[Math.floor(Math.random()*godSkillQuotes.tornado.length)], true);
        triggerGodReaction();
    };

    document.getElementById('skill-ice').onclick = () => {
        if(score < 2000) return showGodDialog("分數不足", true);
        isSelectingIce = true;
        showGodDialog("請點擊目標", true);
    };
    function handleTileClick(index) {
        if (isSelectingIce) {
            if (board[index] > 0) {
                score -= 2000; frozenTurns[index] = 11; isSelectingIce = false; lastMoveTime = Date.now();
                playSfx(sfxFrozen); updateUI(); showScoreEffect(2000);
                showGodDialog(godSkillQuotes.ice[Math.floor(Math.random()*godSkillQuotes.ice.length)], true);
                triggerGodReaction();
            } else { showGodDialog("請選擇生物", true); }
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
            lastMoveTime = Date.now();
            if(scoreAdd > 0) playSfx(sfxMerge);
            
            addNewTile();
            
            let isNewDiscovery = false;
            let currentMax = Math.max(...board);
            if (currentMax > maxTile) {
                maxTile = currentMax;
                isNewDiscovery = true;
                if(maxTile > maxTileEver) {
                    maxTileEver = maxTile;
                    localStorage.setItem('darwin_max_tile', maxTileEver);
                }
            }
            
            updateUI();

            if (isNewDiscovery) {
                playGodSequence(godStates.newEl, 200);
                if (godNewCreatureQuotes[maxTile]) {
                    showGodDialog(godNewCreatureQuotes[maxTile], true);
                }
            } else {
                // 觸發跟手動作
                triggerGodReaction();
            }

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