# biblioteca_digital
# 📚 Biblioteca Digital — Gestión de Libros y Préstamos

Aplicación web interactiva de una sola página (SPA) desarrollada como proyecto para la asignatura de **Programación Web**. Permite gestionar un catálogo de libros (específicamente con temática de Wattpad en esta versión), realizar préstamos, llevar un historial y configurar preferencias de usuario.

## ✨ Características Principales

* **Catálogo Dinámico:** Visualización de libros en tarjetas con búsqueda en tiempo real, filtros por estado (Disponibles, Prestados) y género, además de ordenamiento por título, autor o año.
* **Gestión de Préstamos:** Sistema que permite prestar libros (con un límite de 3 préstamos activos a la vez) y registrar devoluciones. Calcula automáticamente si un préstamo está vencido o si se devolvió con retraso.
* **Formulario Validado:** Permite agregar o editar libros. Incluye validaciones en tiempo real (longitud de título, año válido, evitar duplicados) y contador de caracteres para el comentario.
* **Resumen y Ajustes:** Panel con estadísticas de la biblioteca (libros totales, disponibles, prestados, vencidos y desglose por género). Permite cambiar el nombre del usuario y alternar entre tema claro y oscuro.
* **Persistencia de Datos:** Toda la información (libros, préstamos, tema, nombre y filtros) se guarda en el `localStorage` del navegador. Al recargar la página, el estado se mantiene intacto.
* **Diseño Responsivo y Accesible:** Interfaz adaptada a dispositivos móviles, con contraste de color adecuado (WCAG AA) y modales propios para interacciones.

## 🎨 Diseño y Estética

El proyecto cuenta con un diseño personalizado que combina:
* **Paleta de colores:** Morado profundo (`#4a148c`), dorado (`#c9a227`) y un fondo lila claro con patrones sutiles.
* **Tipografía:** Uso de fuentes serif (Georgia) para los títulos, aportando un toque elegante y clásico, combinado con fuentes sans-serif (Segoe UI) para el texto de lectura.
* **Detalles visuales:** Tarjetas con bordes superiores degradados, botones con efecto "contorno" que se rellenan al pasar el cursor, y modales con ornamentos dorados.
* **Modo Oscuro:** Totalmente integrado mediante variables CSS (`:root`), adaptando los colores para mantener el contraste y la legibilidad.

## 🛠️ Tecnologías Utilizadas

* **HTML5:** Estructura semántica (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
* **CSS3:** Variables (Custom Properties), Flexbox, CSS Grid, transiciones, animaciones (`@keyframes`), media queries (Mobile First) y `backdrop-filter`.
* **JavaScript (Vanilla):** Sin librerías ni frameworks externos. Uso de ES6+ (arrow functions, `let`/`const`, template literals, desestructuración).

## 🏗️ Arquitectura del Código (Separación de Responsabilidades)

Para facilitar el mantenimiento y cumplir con las buenas prácticas, el archivo `script.js` está dividido lógicamente en tres capas:

1. **Capa de Datos / Persistencia (`Storage`):** Se encarga exclusivamente de guardar y recuperar el estado (`DB`, `filtros`, `tema`, `nombreUsuario`) en el `localStorage` usando `JSON.stringify` y `JSON.parse`.
2. **Capa de Lógica de Negocio (`Biblioteca`):** Un objeto con funciones puras que no tocan el DOM. Aquí residen las reglas de negocio: calcular si un libro está disponible, validar datos, crear préstamos, verificar si un préstamo está vencido o calcular los días de retraso.
3. **Capa de Interfaz (`UI` y Eventos):** Se encarga de leer los datos y dibujar la pantalla. Utiliza `document.createElement` y `textContent` (evitando el uso de `innerHTML` por seguridad) para renderizar dinámicamente. Los eventos se manejan mediante **delegación de eventos** (escuchando clics desde el contenedor padre).

## 🚀 Cómo Ejecutar el Proyecto

1. Clona este repositorio o descarga los archivos en tu computadora.
2. Asegúrate de tener los tres archivos en la misma carpeta:
   * `index.html`
   * `styles.css`
   * `script.js`
3. Abre el archivo `index.html` en tu navegador web preferido (Chrome, Firefox, Edge, etc.). No necesitas un servidor local, ya que toda la lógica corre en el cliente.

### 🧹 ¿Cómo reiniciar los datos?
Si deseas borrar los libros agregados o volver a los préstamos de prueba iniciales, puedes hacerlo de dos formas:
* Entrando a la pestaña **"Resumen"** y haciendo clic en el botón **"Restablecer biblioteca"**.
* Abriendo la consola de desarrollador (F12), escribiendo `localStorage.clear()` y recargando la página (F5).

## 📝 Reglas de Negocio Implementadas

* Máximo 3 préstamos activos simultáneos en toda la biblioteca.
* Los libros marcados como "Ejemplar de colección" no se pueden prestar (el botón se deshabilita).
* Un libro con un préstamo activo no se puede editar para convertirlo en colección, ni se puede eliminar.
* Al eliminar un libro sin préstamos activos, se borra también todo su historial de préstamos.
* Los libros duplicados (mismo título y autor) están prohibidos.
* La fecha límite de préstamo es siempre de 14 días a partir de la fecha de préstamo.

---
*Desarrollado como proyecto académico para la asignatura de Programación Web.*
