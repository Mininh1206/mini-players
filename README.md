# Mini Players

**Mini Players** es una colección de minijuegos web clásicos y modernos desarrollados con tecnologías web actuales. El objetivo es proporcionar una plataforma rápida y divertida para jugar directamente desde el navegador, sirviendo también como un escaparate técnico de desarrollo de videojuegos web.

## 🎮 Juegos Disponibles

Actualmente, la plataforma cuenta con los siguientes títulos:

### **1. Tres en Raya (Tic Tac Toe)**

El clásico juego de estrategia para dos jugadores en el mismo dispositivo.

- **Tecnologías**: JavaScript (DOM Manipulation), HTML5, CSS3.
- **Características**: Detección de victoria/empate, indicador de turno, diseño responsive.

### **2. Juego de Memoria (Memory)**

Ejercita tu mente encontrando las parejas de cartas iguales.

- **Tecnologías**: JavaScript (Lógica de estado), DOM Manipulation.
- **Características**: Modos de 1 y 2 jugadores, temporizador, contador de movimientos, sistema de puntuación.

### **3. Buscaminas (Minesweeper)**

Clon del legendario juego de lógica de Windows.

- **Tecnologías**: **HTML5 Canvas API**, TypeScript.
- **Características**: 3 niveles de dificultad (Fácil, Medio, Difícil), sistema de banderas, "Chord reveal" (revelado rápido), gráficos renderizados en Canvas para mayor rendimiento.

### **4. Tetris**

Una recreación fiel del famoso juego de puzzle de encajar piezas.

- **Tecnologías**: **HTML5 Canvas API**, TypeScript.
- **Características**: Sistema de rotación y colisiones, pieza "siguiente" y "guardada" (Hold), puntuación clásica, aumento de velocidad progresivo.

---

## 🛠️ Tecnologías del Proyecto

Este proyecto está construido sobre un stack moderno optimizado para rendimiento y experiencia de desarrollador:

- **[Astro](https://astro.build/)**: Framework principal para la arquitectura "Islands Architecture", permitiendo un sitio web extremadamente rápido con hidratación parcial.
- **TypeScript**: Para una lógica de código robusta y tipada.
- **TailwindCSS**: Para un estilizado rápido, consistente y responsive.
- **React**: Utilizado en juegos con interfaces de usuario complejas (como Mini Troopers).
- **HTML5 Canvas**: Para juegos que requieren renderizado gráfico de alto rendimiento (Tetris, Buscaminas).

## 🚀 Instalación y Uso Local

Para ejecutar este proyecto en tu máquina local:

1. **Clonar el repositorio**:

    ```bash
    git clone https://github.com/Mininh1206/mini-players.git
    cd mini-players
    ```

2. **Instalar dependencias**:

    ```bash
    npm install
    ```

3. **Iniciar el servidor de desarrollo**:

    ```bash
    npm run dev
    ```

4. **Abrir en el navegador**:
    Visita `http://localhost:4321` para ver la aplicación.

## 📦 Comandos Disponibles

| Comando | Acción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local. |
| `npm run build` | Construye el sitio para producción. |
| `npm run preview` | Vista previa de la build de producción. |
| `npm run astro ...` | Ejecuta comandos CLI de Astro (como `astro add`). |

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Siéntete libre de usarlo y aprender de él.
