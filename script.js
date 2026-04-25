const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const honorDisplay = document.getElementById('honorDisplay');
const shortcutsDisplay = document.getElementById('shortcutsDisplay');
const overlay = document.getElementById('overlay');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const modalInstructions = document.getElementById('modalInstructions');
const actionBtn = document.getElementById('actionBtn');

const tileSize = 30; // 21 * 30 = 630
const rows = 21;
const cols = 21;

let maze = [];
let player = { x: 1, y: 1 };
let honor = 100;
let shortcutsTaken = 0;
let isGameOver = false;
let gameStarted = false;

function generateMaze() {
    // Inicializar todo con paredes (1)
    maze = Array.from({ length: rows }, () => Array(cols).fill(1));
    
    // Algoritmo de backtracking iterativo
    const stack = [];
    maze[1][1] = 0;
    stack.push({ x: 1, y: 1 });
    
    const dirs = [
        { dx: 0, dy: -2 },
        { dx: 0, dy: 2 },
        { dx: -2, dy: 0 },
        { dx: 2, dy: 0 }
    ];
    
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const unvisitedNeighbors = [];
        
        for (const dir of dirs) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;
            
            if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && maze[ny][nx] === 1) {
                unvisitedNeighbors.push({ x: nx, y: ny, dx: dir.dx, dy: dir.dy });
            }
        }
        
        if (unvisitedNeighbors.length > 0) {
            // Elegir vecino al azar
            const next = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
            
            // Quitar pared entre current y next
            maze[current.y + next.dy / 2][current.x + next.dx / 2] = 0;
            maze[next.y][next.x] = 0;
            
            stack.push({ x: next.x, y: next.y });
        } else {
            stack.pop();
        }
    }
    
    // Asegurar meta
    maze[rows - 2][cols - 2] = 4;
    maze[rows - 2][cols - 3] = 0;
    maze[rows - 3][cols - 2] = 0;
    
    // Agregar Atajos / Trampas (2)
    let shortcutsAdded = 0;
    while (shortcutsAdded < 8) {
        const x = Math.floor(Math.random() * (cols - 2)) + 1;
        const y = Math.floor(Math.random() * (rows - 2)) + 1;
        
        if (maze[y][x] === 1) {
            // Verificar que separe dos caminos
            const isHorizontalWall = maze[y][x-1] === 0 && maze[y][x+1] === 0;
            const isVerticalWall = maze[y-1][x] === 0 && maze[y+1][x] === 0;
            
            if (isHorizontalWall || isVerticalWall) {
                maze[y][x] = 2; // Atajo
                shortcutsAdded++;
            }
        }
    }
}

let animationId;

function initGame() {
    generateMaze();
    player = { x: 1, y: 1 };
    honor = 100;
    shortcutsTaken = 0;
    isGameOver = false;
    gameStarted = true;
    
    // Resetear estado del modal
    modalInstructions.classList.remove('hidden-element');
    modalText.classList.add('hidden-element');
    actionBtn.innerText = "Empezar a Jugar";
    
    updateStats();
    overlay.classList.add('hidden');
    
    // Evitar múltiples bucles de dibujo
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    draw();
    
    // Quitar el foco del botón para que las flechas o espacio no lo vuelvan a presionar
    actionBtn.blur();
}

function updateStats() {
    honorDisplay.innerText = `${honor}%`;
    if (honor === 100) {
        honorDisplay.style.color = 'var(--primary)';
        honorDisplay.style.textShadow = '0 0 15px rgba(74, 222, 128, 0.5)';
    } else if (honor > 40) {
        honorDisplay.style.color = 'var(--gold)';
        honorDisplay.style.textShadow = '0 0 15px rgba(251, 191, 36, 0.5)';
    } else {
        honorDisplay.style.color = 'var(--danger)';
        honorDisplay.style.textShadow = '0 0 15px rgba(244, 63, 94, 0.5)';
    }
    shortcutsDisplay.innerText = shortcutsTaken;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar laberinto
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const tile = maze[y][x];
            
            if (tile === 1) {
                // Pared Sólida
                ctx.fillStyle = '#1e293b'; 
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                ctx.strokeStyle = 'rgba(255,255,255,0.03)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
            } else if (tile === 2) {
                // Atajo
                ctx.fillStyle = 'rgba(244, 63, 94, 0.1)';
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                
                const time = Date.now() / 250;
                const alpha = 0.4 + 0.6 * Math.abs(Math.sin(time));
                
                ctx.strokeStyle = `rgba(244, 63, 94, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(x * tileSize + 4, y * tileSize + 4, tileSize - 8, tileSize - 8);
            } else if (tile === 4) {
                // Meta (Verde)
                ctx.fillStyle = '#4ade80';
                const time = Date.now() / 200;
                const glow = 15 + 10 * Math.sin(time);
                
                ctx.shadowColor = '#4ade80';
                ctx.shadowBlur = glow;
                ctx.beginPath();
                ctx.arc(x * tileSize + tileSize/2, y * tileSize + tileSize/2, tileSize/2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0; // reset
            }
        }
    }
    
    // Dibujar jugador (Dorado)
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(player.x * tileSize + tileSize/2, player.y * tileSize + tileSize/2, tileSize/2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    if (!isGameOver) {
        animationId = requestAnimationFrame(draw);
    }
}

function movePlayer(dx, dy) {
    if (isGameOver || !gameStarted) return;
    
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    if (newX >= 0 && newX < cols && newY >= 0 && newY < rows) {
        const tile = maze[newY][newX];
        
        if (tile === 0 || tile === 3) {
            player.x = newX;
            player.y = newY;
        } else if (tile === 2) {
            // Toma atajo, rompe regla
            player.x = newX;
            player.y = newY;
            honor = Math.max(0, honor - 30);
            shortcutsTaken++;
            maze[newY][newX] = 0; // Se convierte en camino tras pasarlo
            updateStats();
            
            // Efecto de parpadeo de daño
            document.body.style.boxShadow = "inset 0 0 50px rgba(244, 63, 94, 0.5)";
            setTimeout(() => document.body.style.boxShadow = "none", 200);
            
        } else if (tile === 4) {
            player.x = newX;
            player.y = newY;
            checkWin();
        }
    }
}

function checkWin() {
    isGameOver = true;
    gameStarted = false;
    
    let title = '';
    let message = '';
    let titleColor = '';
    
    if (honor === 100) {
        title = "¡Victoria de la Integridad!";
        message = "Has completado el laberinto sin ceder a la tentación. Demostraste gran honor y perseverancia. Has alcanzado el verdadero final.";
        titleColor = "var(--primary)";
    } else {
        title = "Llegaste al Final... a un costo.";
        message = `Tomaste ${shortcutsTaken} atajo(s) prohibido(s). Llegaste más rápido, pero tu honor se redujo a ${honor}%. La verdadera victoria requiere esfuerzo y honestidad constante.`;
        titleColor = "var(--danger)";
    }
    
    modalTitle.innerText = title;
    modalTitle.style.color = titleColor;
    modalText.innerText = message;
    
    // Cambiar estado del modal a Game Over
    modalInstructions.classList.add('hidden-element');
    modalText.classList.remove('hidden-element');
    actionBtn.innerText = "Jugar de Nuevo";
    
    setTimeout(() => {
        overlay.classList.remove('hidden');
    }, 400);
}

window.addEventListener('keydown', (e) => {
    // Evitar scroll
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    
    switch(e.key) {
        case 'ArrowUp':
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
            movePlayer(1, 0);
            break;
    }
});

actionBtn.addEventListener('click', initGame);

// Configuración inicial visual
generateMaze();
draw();
