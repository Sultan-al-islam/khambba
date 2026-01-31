const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const bgm = document.getElementById("bgm");

// Game Variables (scaled in resizeCanvas)
let gravity, lift, velocity = 0, score = 0;
let gameOver = false, gameStarted = false, frame = 0;
let pipes = [];
const pipeWidth = 80;
const gapHeight = 280;

const playerImg = new Image();
playerImg.src = "player.png"; // Ensure this file exists
const player = { x: 0, y: 0, width: 100, height: 80 };

const linkBtn = { w: 220, h: 50, url: "https://bnpnama.info/" };

// 

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Dynamic Physics Scaling
    // Faster, Snappier Physics
    gravity = canvas.height * 0.0008; // Increased from 0.0006
    lift = canvas.height * -0.016;    // Increased from 0.013
    player.x = canvas.width * 0.15; // Player stays 15% from left

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
    if (gameOver) {
        // Check if the restart was triggered by a click outside the link button
        // handled in the mousedown event
    } else {
        if (!gameStarted) {
            gameStarted = true;
            bgm.play().catch(() => console.log("Audio needs user interaction"));
            bgm.volume = 0.4;
        }
        velocity = lift;
    }
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
        pipe.x -= (canvas.width * 0.006); // Pipe speed scales with width

        // Collision: Khambas (Poles)
        if (player.x + player.width - 15 > pipe.x && player.x + 15 < pipe.x + pipeWidth &&
            (player.y + 15 < pipe.top || player.y + player.height - 15 > canvas.height - pipe.bottom)) {
            gameOver = true;
            bgm.pause();
        }

        if (!pipe.passed && pipe.x + pipeWidth < player.x) {
            score++;
            pipe.passed = true;
        }
    });

    pipes = pipes.filter(p => p.x + pipeWidth > 0);
    if (frame % 80 === 0) createPipe();
    frame++;
}

function draw() {
    // Gradient Sky
    let g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#2980b9");
    g.addColorStop(1, "#6dd5fa");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Drawing Khambas
    pipes.forEach(pipe => {
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(pipe.x + pipeWidth / 2 - 8, 0, 16, pipe.top);
        ctx.fillRect(pipe.x, pipe.top - 20, pipeWidth, 12); // Cross-arm
        ctx.fillRect(pipe.x + pipeWidth / 2 - 8, canvas.height - pipe.bottom, 16, pipe.bottom);
        ctx.fillRect(pipe.x, canvas.height - pipe.bottom + 10, pipeWidth, 12);
    });

    // Player
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    // UI
    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    if (gameStarted && !gameOver) {
        ctx.font = "bold 60px Arial";
        ctx.fillText(score, canvas.width / 2, 80);
    }

    if (!gameStarted && !gameOver) {
        ctx.font = "bold 40px Arial";
        ctx.fillText("KHAMBA TAREK", canvas.width / 2, canvas.height / 2);
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

        // Link Button
        const btnX = canvas.width / 2 - linkBtn.w / 2;
        const btnY = canvas.height / 2 + 70;
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, linkBtn.w, linkBtn.h, 10);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText("To know Plan", canvas.width / 2, btnY + 32);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

playerImg.onload = loop;
playerImg.onerror = () => { console.error("Missing player.png"); loop(); };