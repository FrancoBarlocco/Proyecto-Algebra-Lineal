// Estado del juego
let board = [];
let initialBoard = [];
let boardSize = 2;
let moves = 0;
let solution = null;
let showingSolution = false;
let solutionStep = 0;
let solutionButtons = []; // Array de índices de botones que deben presionarse
let currentSolutionStep = 0; // Paso actual de la solución mostrado
let userClickedHighlightedButton = false; // Si el usuario tocó el botón resaltado

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
    
    // Si el sistema es inconsistente, retornar un array de ceros (no hay solución)
    // Esto no debería pasar con tableros generados correctamente
    if (solucion === null) {
        return Array(tablero.length * tablero.length).fill(0);
    }
    
    return solucion;
}

// ==================== LÓGICA DEL JUEGO ====================

// Verificar si hay al menos una luz encendida
function hasAtLeastOneLightOn(tablero) {
    for (let i = 0; i < tablero.length; i++) {
        for (let j = 0; j < tablero[i].length; j++) {
            if (tablero[i][j] === 1) {
                return true;
            }
        }
    }
    return false;
}

// Aplicar un movimiento a un tablero (sin modificar el original)
function aplicarMovimiento(tablero, row, col, tamaño) {
    const nuevoTablero = tablero.map(fila => [...fila]);
    
    // Cambiar la luz clickeada
    nuevoTablero[row][col] = 1 - nuevoTablero[row][col];
    
    // Cambiar las adyacentes
    if (row > 0) nuevoTablero[row - 1][col] = 1 - nuevoTablero[row - 1][col];
    if (row < tamaño - 1) nuevoTablero[row + 1][col] = 1 - nuevoTablero[row + 1][col];
    if (col > 0) nuevoTablero[row][col - 1] = 1 - nuevoTablero[row][col - 1];
    if (col < tamaño - 1) nuevoTablero[row][col + 1] = 1 - nuevoTablero[row][col + 1];
    
    return nuevoTablero;
}

// Generar un tablero con solución garantizada
function generarTableroConSolucion(tamaño) {
    // Empezar con un tablero vacío (todas las luces apagadas)
    let tablero = [];
    for (let i = 0; i < tamaño; i++) {
        tablero[i] = [];
        for (let j = 0; j < tamaño; j++) {
            tablero[i][j] = 0;
        }
    }
    
    // Generar un número aleatorio de movimientos (entre 3 y tamaño*tamaño/2 para tener un juego interesante)
    const minMovimientos = Math.max(3, Math.floor(tamaño * tamaño * 0.3));
    const maxMovimientos = Math.floor(tamaño * tamaño * 0.7);
    const numMovimientos = Math.floor(Math.random() * (maxMovimientos - minMovimientos + 1)) + minMovimientos;
    
    // Aplicar movimientos aleatorios
    for (let m = 0; m < numMovimientos; m++) {
        const row = Math.floor(Math.random() * tamaño);
        const col = Math.floor(Math.random() * tamaño);
        tablero = aplicarMovimiento(tablero, row, col, tamaño);
    }
    
    // Asegurar que haya al menos una luz encendida
    if (!hasAtLeastOneLightOn(tablero)) {
        // Si no hay luces encendidas, aplicar un movimiento más
        const row = Math.floor(Math.random() * tamaño);
        const col = Math.floor(Math.random() * tamaño);
        tablero = aplicarMovimiento(tablero, row, col, tamaño);
    }
    
    return tablero;
}

// Inicializar el juego
function initGame() {
    const sizeSelect = document.getElementById('size');
    boardSize = parseInt(sizeSelect.value);
    moves = 0;
    solution = null;
    showingSolution = false;
    solutionStep = 0;
    solutionButtons = [];
    currentSolutionStep = 0;
    userClickedHighlightedButton = false;
    
    // Generar tablero con solución garantizada
    board = generarTableroConSolucion(boardSize);
    initialBoard = board.map(row => [...row]);
    
    // Resetear botones del DOM
    document.getElementById('showSolution').textContent = 'Mostrar solución paso a paso';
    document.getElementById('showSolution').disabled = false;
    document.getElementById('showNextStep').style.display = 'none';
    
    updateDisplay();
    updateMessage('¡Juego nuevo! Apaga todas las luces.');
    document.getElementById('moves').textContent = 'Movimientos: 0';
    document.getElementById('solutionInfo').style.display = 'none';
}

// Actualizar la visualización del tablero
function updateDisplay() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    
    // Calcular el tamaño del contenedor para mantenerlo cuadrado
    // Tamaño de luz: 60px en desktop, 50px en móvil
    const isMobile = window.innerWidth <= 600;
    const lightSize = isMobile ? 50 : 60;
    const gap = 5;
    const padding = 20;
    
    // Configurar el grid con tamaño fijo para las columnas
    boardElement.style.gridTemplateColumns = `repeat(${boardSize}, ${lightSize}px)`;
    boardElement.style.gridTemplateRows = `repeat(${boardSize}, ${lightSize}px)`;
    
    // Calcular el tamaño del contenido (sin padding)
    const contentSize = (lightSize * boardSize) + (gap * (boardSize - 1));
    
    // Calcular el tamaño total del contenedor (con padding)
    const totalSize = contentSize + (padding * 2);
    
    // Aplicar el tamaño al contenedor para mantenerlo cuadrado
    boardElement.style.width = `${totalSize}px`;
    boardElement.style.height = `${totalSize}px`;
    
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
    if (showingSolution) {
        // Verificar si el usuario tocó el botón resaltado
        const index = row * boardSize + col;
        if (solutionButtons.length > 0 && currentSolutionStep < solutionButtons.length) {
            const highlightedIndex = solutionButtons[currentSolutionStep];
            if (index === highlightedIndex) {
                userClickedHighlightedButton = true;
                // Aplicar el cambio del tablero (toggle)
                board[row][col] = 1 - board[row][col];
                if (row > 0) board[row - 1][col] = 1 - board[row - 1][col];
                if (row < boardSize - 1) board[row + 1][col] = 1 - board[row + 1][col];
                if (col > 0) board[row][col - 1] = 1 - board[row][col - 1];
                if (col < boardSize - 1) board[row][col + 1] = 1 - board[row][col + 1];
                
                // Incrementar el contador de movimientos
                moves++;
                document.getElementById('moves').textContent = `Movimientos: ${moves}`;
                
                // Actualizar la visualización
                updateDisplay();
                
                // Remover el resaltado del botón actual
                const lights = document.querySelectorAll('.light');
                const light = Array.from(lights).find(
                    l => parseInt(l.dataset.row) === row && parseInt(l.dataset.col) === col
                );
                if (light) {
                    light.classList.remove('solution');
                }
                
                // Verificar si ganó el juego después de este movimiento
                if (checkWin()) {
                    showWinMessage();
                    // Ocultar el cuadrante de solución si se ganó
                    document.getElementById('solutionInfo').style.display = 'none';
                    showingSolution = false;
                } else {
                    // Mostrar el botón "mostrar siguiente paso"
                    document.getElementById('showNextStep').style.display = 'block';
                    updateMessage('Presiona "Mostrar siguiente paso" para continuar.');
                }
            }
        }
        // Si no tocó el botón resaltado, no hacer nada
        return;
    }
    
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
    // Limpiar estados previos de solución paso a paso
    showingSolution = false;
    solutionStep = 0;
    currentSolutionStep = 0;
    userClickedHighlightedButton = false;
    solutionButtons = [];
    
    // Limpiar resaltados anteriores del tablero
    const lights = document.querySelectorAll('.light');
    lights.forEach(light => light.classList.remove('solution'));
    
    // Resetear botones del DOM
    document.getElementById('showSolution').textContent = 'Mostrar solución paso a paso';
    document.getElementById('showSolution').disabled = false;
    document.getElementById('showNextStep').style.display = 'none';
    
    updateMessage('Resolviendo...');
    
    // Resolver localmente usando JavaScript
    solution = resolverLightsOut(board);
    showSolutionInfo();
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
    currentSolutionStep = 0;
    userClickedHighlightedButton = false;
    
    // Construir array de índices de botones que deben presionarse
    solutionButtons = [];
    solution.forEach((shouldPress, index) => {
        if (shouldPress === 1) {
            solutionButtons.push(index);
        }
    });
    
    // Ocultar el botón "mostrar siguiente paso" inicialmente
    document.getElementById('showNextStep').style.display = 'none';
    
    // Resaltar solo el primer botón
    if (solutionButtons.length > 0) {
        highlightSolutionButton(0);
    }
    
    updateMessage('Presiona el botón resaltado en verde para continuar.');
    document.getElementById('showSolution').textContent = 'Solución mostrada';
    document.getElementById('showSolution').disabled = true;
}

// Resaltar un botón específico de la solución
function highlightSolutionButton(stepIndex) {
    if (stepIndex >= solutionButtons.length) return;
    
    const lights = document.querySelectorAll('.light');
    // Remover todos los resaltados anteriores
    lights.forEach(light => light.classList.remove('solution'));
    
    // Resaltar el botón del paso actual
    const buttonIndex = solutionButtons[stepIndex];
    const row = Math.floor(buttonIndex / boardSize);
    const col = buttonIndex % boardSize;
    const light = Array.from(lights).find(
        l => parseInt(l.dataset.row) === row && parseInt(l.dataset.col) === col
    );
    if (light) {
        light.classList.add('solution');
    }
}

// Mostrar el siguiente paso de la solución
function showNextStep() {
    if (!userClickedHighlightedButton) return;
    
    currentSolutionStep++;
    
    if (currentSolutionStep < solutionButtons.length) {
        highlightSolutionButton(currentSolutionStep);
        userClickedHighlightedButton = false;
        document.getElementById('showNextStep').style.display = 'none';
        updateMessage('Presiona el botón resaltado en verde para continuar.');
    } else {
        // Se completaron todos los pasos
        document.getElementById('showNextStep').style.display = 'none';
        // Verificar si ganó el juego
        if (checkWin()) {
            showWinMessage();
            // Ocultar el cuadrante de solución si se ganó
            document.getElementById('solutionInfo').style.display = 'none';
            showingSolution = false;
        } else {
            updateMessage('¡Has completado todos los pasos de la solución!');
        }
    }
}

// Reiniciar el juego
function resetGame() {
    showingSolution = false;
    solutionStep = 0;
    currentSolutionStep = 0;
    userClickedHighlightedButton = false;
    solutionButtons = [];
    moves = 0;
    solution = null;
    if (initialBoard.length > 0) {
        board = initialBoard.map(row => [...row]);
    }
    document.getElementById('moves').textContent = 'Movimientos: 0';
    document.getElementById('solutionInfo').style.display = 'none';
    document.getElementById('showSolution').textContent = 'Mostrar solución paso a paso';
    document.getElementById('showSolution').disabled = false;
    document.getElementById('showNextStep').style.display = 'none';
    updateDisplay();
    updateMessage('Tablero reiniciado al estado inicial. Continúa jugando...');
}

// ==================== TUTORIAL ====================

let currentTutorialPage = 1;
const totalTutorialPages = 5;

// Abrir el modal del tutorial
function openTutorial() {
    const modal = document.getElementById('tutorialModal');
    modal.classList.add('active');
    currentTutorialPage = 1;
    showTutorialPage(1);
}

// Cerrar el modal del tutorial
function closeTutorial() {
    const modal = document.getElementById('tutorialModal');
    modal.classList.remove('active');
}

// Saltar el tutorial (cerrar el modal)
function skipTutorial() {
    closeTutorial();
}

// Mostrar una página específica del tutorial
function showTutorialPage(pageNumber) {
    // Ocultar todas las páginas
    for (let i = 1; i <= totalTutorialPages; i++) {
        const page = document.getElementById(`tutorialPage${i}`);
        if (page) {
            page.style.display = 'none';
        }
    }
    
    // Mostrar la página actual
    const currentPage = document.getElementById(`tutorialPage${pageNumber}`);
    if (currentPage) {
        currentPage.style.display = 'block';
    }
    
    // Actualizar el indicador de página (en la parte superior izquierda)
    document.getElementById('pageIndicator').textContent = `${pageNumber} / ${totalTutorialPages}`;
    
    // Actualizar botones de navegación según la página
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const skipBtn = document.getElementById('skipTutorial');
    const navContainer = document.querySelector('.tutorial-navigation');
    
    // Primera página: mostrar "Saltar" centrado y "Siguiente" a la derecha
    if (pageNumber === 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'inline-block';
        nextBtn.textContent = 'Siguiente';
        nextBtn.disabled = false;
        skipBtn.style.display = 'inline-block';
        navContainer.classList.add('tutorial-navigation-first-page');
    } else {
        // Botón Anterior: visible desde página 2 en adelante
        prevBtn.style.display = 'inline-block';
        prevBtn.disabled = false;
        
        // Botón Siguiente/Comenzar: visible en todas las páginas excepto la primera
        nextBtn.style.display = 'inline-block';
        nextBtn.disabled = false;
        
        // Botón Saltar: siempre visible
        skipBtn.style.display = 'inline-block';
        
        navContainer.classList.remove('tutorial-navigation-first-page');
        
        // En la última página, cambiar "Siguiente" por "Comenzar"
        if (pageNumber === totalTutorialPages) {
            nextBtn.textContent = 'Comenzar';
        } else {
            nextBtn.textContent = 'Siguiente';
        }
    }
}

// Ir a la página anterior
function prevTutorialPage() {
    if (currentTutorialPage > 1) {
        currentTutorialPage--;
        showTutorialPage(currentTutorialPage);
    }
}

// Ir a la página siguiente
function nextTutorialPage() {
    if (currentTutorialPage < totalTutorialPages) {
        currentTutorialPage++;
        showTutorialPage(currentTutorialPage);
    } else {
        // Si estamos en la última página, "Comenzar" cierra el tutorial
        closeTutorial();
    }
}

// Event listeners
document.getElementById('newGame').addEventListener('click', initGame);
document.getElementById('solve').addEventListener('click', solveGame);
document.getElementById('reset').addEventListener('click', resetGame);
document.getElementById('showSolution').addEventListener('click', showSolutionStepByStep);
document.getElementById('showNextStep').addEventListener('click', showNextStep);

// Iniciar nuevo juego automáticamente al cambiar la dimensión del tablero
document.getElementById('size').addEventListener('change', initGame);

// Event listeners del tutorial
document.getElementById('tutorialBtn').addEventListener('click', openTutorial);
document.getElementById('closeTutorial').addEventListener('click', closeTutorial);
document.getElementById('skipTutorial').addEventListener('click', skipTutorial);
document.getElementById('prevPage').addEventListener('click', prevTutorialPage);
document.getElementById('nextPage').addEventListener('click', nextTutorialPage);

// Cerrar el modal al hacer clic fuera de él
document.getElementById('tutorialModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeTutorial();
    }
});

// Cerrar el modal con la tecla Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('tutorialModal');
        if (modal.classList.contains('active')) {
            closeTutorial();
        }
    }
});

// Listener para redimensionamiento de ventana
window.addEventListener('resize', () => {
    if (board.length > 0) {
        updateDisplay();
    }
});

// Inicializar al cargar
initGame();
