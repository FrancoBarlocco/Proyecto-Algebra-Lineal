// Estado del juego
let board = [];
let boardSize = 5;
let moves = 0;
let solution = null;
let showingSolution = false;
let solutionStep = 0;

// ==================== LÓGICA DE RESOLUCIÓN ====================

function construirSistemaEcuaciones(tablero) {
    const n = tablero.length;
    const n2 = n * n;
    
    const A = Array(n2).fill(0).map(() => Array(n2).fill(0));
    const b = Array(n2).fill(0);
    
    for (let i = 0; i < n2; i++) {
        const fila = Math.floor(i / n);
        const col = i % n;
        b[i] = tablero[fila][col];
        
        // La luz misma
        A[i][i] = 1;
        
        // Luces adyacentes
        if (fila > 0) A[i][(fila - 1) * n + col] = 1;
        if (fila < n - 1) A[i][(fila + 1) * n + col] = 1;
        if (col > 0) A[i][fila * n + (col - 1)] = 1;
        if (col < n - 1) A[i][fila * n + (col + 1)] = 1;
    }
    
    return { A, b };
}

function eliminacionGaussianaZ2(A, b) {
    const m = A.length;
    const n = A[0].length;
    
    // Crear matriz aumentada
    const M = A.map((fila, i) => [...fila, b[i]]);
    
    let filaActual = 0;
    
    for (let col = 0; col < n; col++) {
        if (filaActual >= m) break;
        
        // Buscar pivote
        let filaPivote = null;
        for (let fila = filaActual; fila < m; fila++) {
            if (M[fila][col] === 1) {
                filaPivote = fila;
                break;
            }
        }
        
        if (filaPivote === null) continue;
        
        // Intercambiar filas
        if (filaPivote !== filaActual) {
            [M[filaActual], M[filaPivote]] = [M[filaPivote], M[filaActual]];
        }
        
        // Eliminar 1s en la columna
        for (let fila = 0; fila < m; fila++) {
            if (fila !== filaActual && M[fila][col] === 1) {
                for (let c = 0; c <= n; c++) {
                    M[fila][c] = (M[fila][c] + M[filaActual][c]) % 2;
                }
            }
        }
        
        filaActual++;
    }
    
    return M;
}

function resolverSistema(matrizEscalonada) {
    const m = matrizEscalonada.length;
    const n = matrizEscalonada[0].length - 1; // -1 porque la última columna es b
    const solucion = Array(n).fill(0);
    
    for (let fila = m - 1; fila >= 0; fila--) {
        let colPivote = null;
        for (let col = 0; col < n; col++) {
            if (matrizEscalonada[fila][col] === 1) {
                colPivote = col;
                break;
            }
        }
        
        if (colPivote === null) {
            if (matrizEscalonada[fila][n] !== 0) {
                return null; // Sistema inconsistente
            }
            continue;
        }
        
        let valor = matrizEscalonada[fila][n];
        for (let col = colPivote + 1; col < n; col++) {
            if (matrizEscalonada[fila][col] === 1) {
                valor = (valor + solucion[col]) % 2;
            }
        }
        
        solucion[colPivote] = valor;
    }
    
    return solucion;
}

function resolverLightsOut(tablero) {
    const { A, b } = construirSistemaEcuaciones(tablero);
    const matrizEscalonada = eliminacionGaussianaZ2(A, b);
    const solucion = resolverSistema(matrizEscalonada);
    
    if (solucion === null) {
        throw new Error("Sistema inconsistente");
    }
    
    return solucion;
}

// ==================== LÓGICA DEL JUEGO ====================

// Inicializar el juego
function initGame() {
    const sizeSelect = document.getElementById('size');
    boardSize = parseInt(sizeSelect.value);
    board = [];
    moves = 0;
    solution = null;
    showingSolution = false;
    solutionStep = 0;
    
    // Crear tablero aleatorio
    for (let i = 0; i < boardSize; i++) {
        board[i] = [];
        for (let j = 0; j < boardSize; j++) {
            board[i][j] = Math.random() > 0.5 ? 1 : 0;
        }
    }
    
    updateDisplay();
    updateMessage('¡Juego nuevo! Apaga todas las luces.');
    document.getElementById('moves').textContent = 'Movimientos: 0';
    document.getElementById('solutionInfo').style.display = 'none';
}

// Actualizar la visualización del tablero
function updateDisplay() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const light = document.createElement('div');
            light.className = `light ${board[i][j] === 1 ? 'on' : 'off'}`;
            light.dataset.row = i;
            light.dataset.col = j;
            light.addEventListener('click', () => toggleLight(i, j));
            boardElement.appendChild(light);
        }
    }
}

// Cambiar el estado de una luz y sus adyacentes
function toggleLight(row, col) {
    if (showingSolution) return;
    
    // Cambiar la luz clickeada
    board[row][col] = 1 - board[row][col];
    
    // Cambiar las adyacentes
    if (row > 0) board[row - 1][col] = 1 - board[row - 1][col];
    if (row < boardSize - 1) board[row + 1][col] = 1 - board[row + 1][col];
    if (col > 0) board[row][col - 1] = 1 - board[row][col - 1];
    if (col < boardSize - 1) board[row][col + 1] = 1 - board[row][col + 1];
    
    moves++;
    updateDisplay();
    updateMessage('Continúa jugando...');
    document.getElementById('moves').textContent = `Movimientos: ${moves}`;
    
    // Verificar si ganó
    if (checkWin()) {
        showWinMessage();
    }
}

// Verificar si todas las luces están apagadas
function checkWin() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === 1) return false;
        }
    }
    return true;
}

// Mostrar mensaje de victoria
function showWinMessage() {
    const message = document.getElementById('message');
    message.textContent = `¡Ganaste en ${moves} movimientos! 🎉`;
    message.style.color = '#48bb78';
    message.style.fontWeight = 'bold';
}

// Actualizar mensaje
function updateMessage(text) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.style.color = '#333';
    message.style.fontWeight = 'normal';
}

// Resolver el juego (ahora completamente local)
function solveGame() {
    try {
        updateMessage('Resolviendo...');
        
        // Resolver localmente usando JavaScript
        solution = resolverLightsOut(board);
        showSolutionInfo();
        
    } catch (error) {
        updateMessage(`Error: ${error.message}`);
        console.error('Error:', error);
    }
}

// Mostrar información de la solución
function showSolutionInfo() {
    const solutionInfo = document.getElementById('solutionInfo');
    solutionInfo.style.display = 'block';
    
    // Contar cuántas luces hay que presionar
    const count = solution.filter(x => x === 1).length;
    document.getElementById('solutionText').textContent = 
        `Se deben presionar ${count} luces para resolver el juego.`;
    
    updateMessage('Solución encontrada. Presiona "Mostrar solución paso a paso" para verla.');
}

// Mostrar solución paso a paso
function showSolutionStepByStep() {
    if (!solution) return;
    
    showingSolution = true;
    solutionStep = 0;
    
    const lights = document.querySelectorAll('.light');
    
    // Marcar las luces que deben presionarse
    solution.forEach((shouldPress, index) => {
        if (shouldPress === 1) {
            const row = Math.floor(index / boardSize);
            const col = index % boardSize;
            const light = Array.from(lights).find(
                l => parseInt(l.dataset.row) === row && parseInt(l.dataset.col) === col
            );
            if (light) {
                light.classList.add('solution');
            }
        }
    });
    
    updateMessage('Las luces marcadas en verde son las que debes presionar. Presiona "Reiniciar" para volver a jugar.');
    document.getElementById('showSolution').textContent = 'Solución mostrada';
    document.getElementById('showSolution').disabled = true;
}

// Reiniciar el juego
function resetGame() {
    showingSolution = false;
    solutionStep = 0;
    moves = 0;
    document.getElementById('moves').textContent = 'Movimientos: 0';
    document.getElementById('solutionInfo').style.display = 'none';
    document.getElementById('showSolution').textContent = 'Mostrar solución paso a paso';
    document.getElementById('showSolution').disabled = false;
    updateDisplay();
    updateMessage('Juego reiniciado. Continúa jugando...');
}

// Event listeners
document.getElementById('newGame').addEventListener('click', initGame);
document.getElementById('solve').addEventListener('click', solveGame);
document.getElementById('reset').addEventListener('click', resetGame);
document.getElementById('showSolution').addEventListener('click', showSolutionStepByStep);

// Inicializar al cargar
initGame();
