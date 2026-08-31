# Senior Engineer Repository Rules - Control Financiero 2026

## Principios de Desarrollo

1. **Separación de Responsabilidades (SoC):**
   - `index.html`: Únicamente marcado HTML5 semántico y accesible.
   - `styles.css`: Estilos visuales centralizados, variables CSS (tokens) y diseño responsivo sin librerías externas pesadas.
   - `app.js`: Lógica de negocio, gestión del estado de la aplicación y operaciones sobre `localStorage`.

2. **Calidad de Código y Mantenibilidad:**
   - Escribir JavaScript moderno (ES6+) estructurado, utilizando funciones puras cuando sea posible y constantes declarativas.
   - Nombres de clases CSS siguiendo la convención BEM o nomenclatura semántica clara.
   - Manejo defensivo de datos en `localStorage` (validación de JSON y manejo de fallos gracefully).

3. **Experiencia de Usuario (UX/UI Fintech):**
   - Interfaz Dark Mode tipo Fintech minimalista.
   - Retroalimentación inmediata en el cálculo de balances y adición/eliminación de movimientos.
   - Total privacidad: ningún dato sale del dispositivo del usuario.
