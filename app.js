const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const bgm = document.getElementById("bgm");

// Game Variables (scaled in resizeCanvas)
let gravity, lift, velocity = 0, score = 0;
let gameOver = false, gameStarted = false, frame = 0;
let pipes = [];
const pipeWidth = 80;
const gapHeight = 300; // Increased gap for easier play

const playerImg = new Image();
playerImg.src = "player.png"; 
const player = { x: 0, y: 0, width: 100, height: 80 };

const linkBtn = { w: 220, h: 50, url: "https://bnpnama.info/" };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // SLOW MOTION PHYSICS SETTINGS
    gravity = canvas.height * 0.0006; // Lower gravity = floaty feel
    lift = canvas.height * -0.012;    // Lower lift = gentler jumps
    player.x = canvas.width * 0.15; 

    if (!gameStarted) player.y = canvas.height / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function createPipe() {
    const minH = 100;
    const maxH = canvas.height - gapHeight - minH;
    const topH = Math.floor(Math.random() * (maxH - minH)) + minH;
    pipes.push({
        x: canvas.width,
        top: topH,
        bottom: canvas.height - topH - gapHeight,
        passed: false
    });
}

function handleInput() {
    if (gameOver) return;

    if (!gameStarted) {
        gameStarted = true;
        bgm.play().catch(() => console.log("Audio needs user interaction"));
        bgm.volume = 0.4;
    }
    // Set velocity to lift immediately so the first tap jumps
    velocity = lift;
}

// Input Listeners
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
    pipes = [];
    frame = 0;
    gameOver = false;
    gameStarted = false;
    bgm.currentTime = 0;
}

function update() {
    if (!gameStarted || gameOver) return;

    velocity += gravity;
    player.y += velocity;

    // Collision: Floor/Ceiling
    if (player.y + player.height > canvas.height || player.y < 0) {
        gameOver = true;
        bgm.pause();
    }

    pipes.forEach(pipe => {
        // SLOWER HORIZONTAL SPEED
        pipe.x -= (canvas.width * 0.004); 

        // Collision Logic
        if (player.x + player.width - 20 > pipe.x && player.x + 20 < pipe.x + pipeWidth &&
            (player.y + 20 < pipe.top || player.y + player.height - 20 > canvas.height - pipe.bottom)) {
            gameOver = true;
            bgm.pause();
        }

        if (!pipe.passed && pipe.x + pipeWidth < player.x) {
            score++;
            pipe.passed = true;
        }
    });

    pipes = pipes.filter(p => p.x + pipeWidth > 0);
    
    // SPAWN PIPES LESS FREQUENTLY (to match slow speed)
    if (frame % 120 === 0) createPipe(); 
    frame++;
}

function draw() {
    let g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#2980b9");
    g.addColorStop(1, "#6dd5fa");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    pipes.forEach(pipe => {
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(pipe.x + pipeWidth / 2 - 8, 0, 16, pipe.top);
        ctx.fillRect(pipe.x, pipe.top - 20, pipeWidth, 12); 
        ctx.fillRect(pipe.x + pipeWidth / 2 - 8, canvas.height - pipe.bottom, 16, pipe.bottom);
        ctx.fillRect(pipe.x, canvas.height - pipe.bottom + 10, pipeWidth, 12);
    });

    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    if (gameStarted && !gameOver) {
        ctx.font = "bold 60px Arial";
        ctx.fillText(score, canvas.width / 2, 80);
    }

    if (!gameStarted && !gameOver) {
        ctx.font = "bold 40px Arial";
        ctx.fillText("খাম্বা তারেক", canvas.width / 2, canvas.height / 2);
        ctx.font = "20px Arial";
        ctx.fillText("TAP TO FLY", canvas.width / 2, canvas.height / 2 + 50);
    }

    if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 50px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = "24px Arial";
        ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 10);

        const btnX = canvas.width / 2 - linkBtn.w / 2;
        const btnY = canvas.height / 2 + 70;
        ctx.fillStyle = "#e62f22";
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, linkBtn.w, linkBtn.h, 10);
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
playerImg.onerror = () => { console.error("Missing player.png"); loop(); };