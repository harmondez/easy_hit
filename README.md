# 🃏 Easy Hit | Card Forge

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Web-orange)

**Easy Hit | Card Forge** es una herramienta de desarrollo para diseñadores de juegos TCG (Trading Card Games). Permite crear, balancear y visualizar cartas personalizadas en tiempo real, respetando un sistema de presupuesto técnico para evitar cartas "rotas".

---

## 🚀 Live Demo

Puedes probar la forja de cartas directamente en tu navegador aquí:
👉 **[PROBAR EASY HIT FORGE](https://harmondez.github.io/easy_hit/)**

---

## 🛠️ Características Principales

- **Diseño TCG Realista**: Interfaz basada en el formato físico de cartas coleccionables.
- **Sistema de Balanceo**: Lógica de puntos integrada (Presupuesto máximo de 7400 pts) entre HP, DEF y ATQ.
- **Preview en Tiempo Real**: Visualiza los cambios de nombre, imagen, elementos y stats instantáneamente.
- **Biblioteca Local**: Guarda tus creaciones en una galería dinámica durante la sesión.

## 📊 Mecánicas de Balanceo (The 7400 Rule)

Para asegurar un juego justo, cada carta debe ser forjada bajo un presupuesto estricto:
- **Puntos Totales**: 7400
- **Stats Variables**: 
  - `HP` (Vida)
  - `DEF` (Defensa)
  - `ATQ` (Ataque)
- **Validación**: El botón de "Forjar Carta" se bloquea automáticamente si superas el límite de puntos.

## 💻 Stack Tecnológico

- **HTML5**: Estructura semántica.
- **CSS3**: Diseño "Dark Mode" con Flexbox y Grid.
- **JavaScript (Vanilla)**: Lógica de cálculo y manipulación del DOM sin dependencias externas.

## 🛠️ Instalación Local

Si quieres ejecutar este proyecto localmente para hacer modificaciones:

1. Clona el repositorio:
   ```bash
   git clone [https://github.com/harmondez/easy_hit.git](https://github.com/harmondez/easy_hit.git)

2. Entra en la carpeta:

cd easy_hit

3. Abre el archivo index.html en tu navegador preferido.

📜 Licencia
Este proyecto está bajo la Licencia MIT. Siéntete libre de usarlo, modificarlo y compartirlo.

Desarrollado con 🥪🥤⌚ por Harmondez