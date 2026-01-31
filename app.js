const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const bgm = document.getElementById("bgm");

// Game Variables
let gravity, lift, velocity = 0, score = 0;
let gameOver = false, gameStarted = false, frame = 0;
let pipes = [];
const pipeWidth = 60; 
const gapHeight = 300; 

// Money System
let totalMoney = parseInt(localStorage.getItem("khambaCoins")) || 0;
let sessionMoney = 0;

const playerImg = new Image();
playerImg.src = "player.png"; 
const player = { x: 0, y: 0, width: 85, height: 65 };

const linkBtn = { w: 220, h: 50, url: "https://bnpnama.info/" };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // --- SLOW MOTION PHYSICS ---
    gravity = canvas.height * 0.00035; 
    lift = canvas.height * -0.009;    
    player.x = canvas.width * 0.15; 

    if (!gameStarted) player.y = canvas.height / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function createPipe() {
    const minH = 120;
    const maxH = canvas.height - gapHeight - minH;
    const topH = Math.floor(Math.random() * (maxH - minH)) + minH;
    
    pipes.push({
        x: canvas.width,
        top: topH,
        bottom: canvas.height - topH - gapHeight,
        passed: false,
        hasCoin: Math.random() > 0.3, // 70% chance for a coin
        coinCollected: false,
        coinAnim: 0
    });
}

function handleInput() {
    if (gameOver) return;
    if (!gameStarted) {
        gameStarted = true;
        bgm.play().catch(() => console.log("Interaction needed for audio"));
        bgm.volume = 0.4;
    }
    velocity = lift;
}

// Event Listeners
canvas.addEventListener("mousedown", (e) => {
    if (gameOver) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const btnX = canvas.width / 2 - linkBtn.w / 2;
        const btnY = canvas.height / 2 + 70;

        if (mouseX > btnX && mouseX < btnX + linkBtn.w && mouseY > btnY && mouseY < btnY + linkBtn.h) {
            window.open(linkBtn.url, "_blank");
        } else {
            resetGame();
        }
    } else {
        handleInput();
    }
});

window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        if (gameOver) resetGame(); else handleInput();
    }
});

function resetGame() {
    player.y = canvas.height / 2;
    velocity = 0;
    score = 0;
    sessionMoney = 0;
    pipes = [];
    frame = 0;
    gameOver = false;
    gameStarted = false;
    bgm.currentTime = 0;
}

function update() {
    if (!gameStarted || gameOver) return;

    velocity += gravity;
    if (velocity > 10) velocity = 10; 
    player.y += velocity;

    // Boundary Collision
    if (player.y + player.height > canvas.height || player.y < 0) {
        gameOver = true;
        bgm.pause();
    }

    pipes.forEach(pipe => {
        // Slower Horizontal Speed
        pipe.x -= (canvas.width * 0.0035); 
        pipe.coinAnim += 0.1;

        // Collision Logic for Electric Pole Structure
        // (Wider at the cross-arms)
        const crossArmYTop = pipe.top - 40;
        const crossArmYBottom = canvas.height - pipe.bottom + 10;

        if (player.x + player.width - 20 > pipe.x - 10 && player.x + 20 < pipe.x + pipeWidth + 10) {
            if (player.y + 20 < pipe.top || player.y + player.height - 20 > canvas.height - pipe.bottom) {
                gameOver = true;
                bgm.pause();
            }
        }

        // Score
        if (!pipe.passed && pipe.x + pipeWidth < player.x) {
            score++;
            pipe.passed = true;
        }

        // Money Collection
        if (pipe.hasCoin && !pipe.coinCollected) {
            const coinX = pipe.x + pipeWidth / 2;
            const coinY = pipe.top + gapHeight / 2;
            const dx = (player.x + player.width / 2) - coinX;
            const dy = (player.y + player.height / 2) - coinY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 50) {
                pipe.coinCollected = true;
                totalMoney += 10;
                sessionMoney += 10;
                localStorage.setItem("khambaCoins", totalMoney);
            }
        }
    });

    pipes = pipes.filter(p => p.x + pipeWidth + 100 > 0);
    // Spawn less frequently due to slower speed
    if (frame % 130 === 0) createPipe(); 
    frame++;
}

function draw() {
    let g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#2980b9");
    g.addColorStop(1, "#6dd5fa");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    pipes.forEach(pipe => {
        const poleColor = "#2c3e50";
        const armColor = "#34495e";
        const insulatorColor = "#ecf0f1";
        const armW = pipeWidth + 30;

        // --- DRAW TOP ELECTRIC POLE ---
        ctx.fillStyle = poleColor;
        ctx.fillRect(pipe.x + pipeWidth / 2 - 8, 0, 16, pipe.top); // Main Pole
        ctx.fillStyle = armColor;
        ctx.fillRect(pipe.x - 15, pipe.top - 40, armW, 12); // Cross-arm
        ctx.fillStyle = insulatorColor;
        ctx.fillRect(pipe.x - 10, pipe.top - 55, 8, 15); // Insulators
        ctx.fillRect(pipe.x + pipeWidth / 2 - 4, pipe.top - 55, 8, 15);
        ctx.fillRect(pipe.x + pipeWidth + 2, pipe.top - 55, 8, 15);

        // --- DRAW BOTTOM ELECTRIC POLE ---
        ctx.fillStyle = poleColor;
        ctx.fillRect(pipe.x + pipeWidth / 2 - 8, canvas.height - pipe.bottom, 16, pipe.bottom); // Main Pole
        ctx.fillStyle = armColor;
        ctx.fillRect(pipe.x - 15, canvas.height - pipe.bottom + 25, armW, 12); // Cross-arm
        ctx.fillStyle = insulatorColor;
        ctx.fillRect(pipe.x - 10, canvas.height - pipe.bottom + 10, 8, 15); // Insulators
        ctx.fillRect(pipe.x + pipeWidth / 2 - 4, canvas.height - pipe.bottom + 10, 8, 15);
        ctx.fillRect(pipe.x + pipeWidth + 2, canvas.height - pipe.bottom + 10, 8, 15);

        // Coin (৳)
        if (pipe.hasCoin && !pipe.coinCollected) {
            const hover = Math.sin(pipe.coinAnim) * 8;
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath();
            ctx.arc(pipe.x + pipeWidth / 2, pipe.top + gapHeight / 2 + hover, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "center";
            ctx.fillText("৳", pipe.x + pipeWidth / 2, pipe.top + gapHeight / 2 + hover + 7);
        }
    });

    // Draw Player
    ctx.save();
    let rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, velocity * 0.08));
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(rotation);
    ctx.drawImage(playerImg, -player.width / 2, -player.height / 2, player.width, player.height);
    ctx.restore();

    // UI
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.font = "bold 24px Arial";
    ctx.fillText("চান্দা : ৳" + totalMoney, 30, 50);

    if (gameStarted && !gameOver) {
        ctx.textAlign = "center";
        ctx.font = "bold 70px Arial";
        ctx.fillText(score, canvas.width / 2, 100);
    }

    if (!gameStarted && !gameOver) {
        ctx.textAlign = "center";
        ctx.font = "bold 50px Arial";
        ctx.fillText("খাম্বা তারেক", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "20px Arial";
        ctx.fillText("TAP TO FLY", canvas.width / 2, canvas.height / 2 + 40);
    }

    if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "bold 50px Arial";
        ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 80);
        
        ctx.font = "24px Arial";
        ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = "#f1c40f";
        ctx.fillText("Total চান্দা Collection: +৳" + sessionMoney, canvas.width / 2, canvas.height / 2 + 20);

        const btnX = canvas.width / 2 - linkBtn.w / 2;
        const btnY = canvas.height / 2 + 70;
        ctx.fillStyle = "#e62f22";
        ctx.beginPath();
        if(ctx.roundRect) ctx.roundRect(btnX, btnY, linkBtn.w, linkBtn.h, 10); else ctx.rect(btnX, btnY, linkBtn.w, linkBtn.h);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText("His Plan", canvas.width / 2, btnY + 32);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

playerImg.onload = loop;
playerImg.onerror = () => { loop(); };