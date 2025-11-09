"""
Backend para resolver el juego Lights Out usando álgebra lineal sobre Z₂
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)


def construir_sistema_ecuaciones(tablero):
    """Construye el sistema de ecuaciones lineales sobre Z₂"""
    n = len(tablero)
    n2 = n * n
    
    A = np.zeros((n2, n2), dtype=int)
    b = np.zeros(n2, dtype=int)
    
    for i in range(n2):
        fila = i // n
        col = i % n
        b[i] = tablero[fila][col]
        
        A[i][i] = 1
        
        # Luces adyacentes
        if fila > 0:
            A[i][(fila - 1) * n + col] = 1
        if fila < n - 1:
            A[i][(fila + 1) * n + col] = 1
        if col > 0:
            A[i][fila * n + (col - 1)] = 1
        if col < n - 1:
            A[i][fila * n + (col + 1)] = 1
    
    return np.column_stack([A, b])


def eliminacion_gaussiana_z2(matriz_aumentada):
    """Eliminación gaussiana sobre Z₂"""
    m, n = matriz_aumentada.shape
    n_vars = n - 1
    M = matriz_aumentada.copy()
    fila_actual = 0
    
    for col in range(n_vars):
        if fila_actual >= m:
            break
        
        fila_pivote = None
        for fila in range(fila_actual, m):
            if M[fila, col] == 1:
                fila_pivote = fila
                break
        
        if fila_pivote is None:
            continue
        
        if fila_pivote != fila_actual:
            M[[fila_actual, fila_pivote]] = M[[fila_pivote, fila_actual]]
        
        for fila in range(m):
            if fila != fila_actual and M[fila, col] == 1:
                M[fila] = (M[fila] + M[fila_actual]) % 2
        
        fila_actual += 1
    
    return M


def resolver_sistema(matriz_escalonada):
    """Resuelve el sistema de ecuaciones"""
    m, n = matriz_escalonada.shape
    n_vars = n - 1
    solucion = np.zeros(n_vars, dtype=int)
    
    for fila in range(m - 1, -1, -1):
        col_pivote = None
        for col in range(n_vars):
            if matriz_escalonada[fila, col] == 1:
                col_pivote = col
                break
        
        if col_pivote is None:
            if matriz_escalonada[fila, n_vars] != 0:
                return None
            continue
        
        valor = matriz_escalonada[fila, n_vars]
        for col in range(col_pivote + 1, n_vars):
            if matriz_escalonada[fila, col] == 1:
                valor = (valor + solucion[col]) % 2
        
        solucion[col_pivote] = valor
    
    return solucion


def resolver_lights_out(tablero):
    """Resuelve el juego Lights Out"""
    tablero = np.array(tablero, dtype=int)
    matriz_aumentada = construir_sistema_ecuaciones(tablero)
    matriz_escalonada = eliminacion_gaussiana_z2(matriz_aumentada)
    solucion = resolver_sistema(matriz_escalonada)
    
    if solucion is None:
        raise ValueError("El sistema no tiene solución única")
    
    return solucion.tolist()


@app.route('/solve', methods=['POST'])
def solve():
    """Endpoint para resolver el juego"""
    try:
        data = request.json
        tablero = data.get('tablero')
        
        if not tablero:
            return jsonify({'error': 'No se proporcionó el tablero'}), 400
        
        solucion = resolver_lights_out(tablero)
        return jsonify({'solucion': solucion, 'mensaje': 'Solución encontrada'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Endpoint de salud"""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Servidor Lights Out iniciado")
    print("📍 http://localhost:5000")
    print("📝 Abre index.html en tu navegador")
    print("=" * 50)
    app.run(debug=True, port=5000)
