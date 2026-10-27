// ============================================================
// UTILIDADES DE FECHA
// ============================================================
const hoy = () => new Date().toISOString().split('T')[0];
const sumarDias = (fecha, dias) => {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
};

// ============================================================
// DATOS INICIALES (Libros de Wattpad)
// ============================================================
function datosIniciales() {
  const h = hoy();
  const libros = [
    { id: 'L1', titulo: 'After', autor: 'Anna Todd', anio: 2014, genero: 'romance', comentario: '', coleccion: false },
    { id: 'L2', titulo: 'Culpa Mía', autor: 'Mercedes Ron', anio: 2015, genero: 'romance', comentario: '', coleccion: false },
    { id: 'L3', titulo: 'El chico malo de la clase', autor: 'Wattpad Original', anio: 2018, genero: 'romance', comentario: '', coleccion: false },
    { id: 'L4', titulo: 'Mi ángel de la guarda', autor: 'Laura Nowlin', anio: 2013, genero: 'drama', comentario: '', coleccion: true },
    { id: 'L5', titulo: 'La chica del tren', autor: 'Paula Hawkins', anio: 2015, genero: 'misterio', comentario: '', coleccion: false },
    { id: 'L6', titulo: 'Todas las hadas del reino', autor: 'Wattpad Originals', anio: 2019, genero: 'fantasia', comentario: '', coleccion: true },
    { id: 'L7', titulo: '¿Y si te enamoras de mí?', autor: 'Whitney G.', anio: 2016, genero: 'romance', comentario: '', coleccion: false },
    { id: 'L8', titulo: 'Bajo la misma estrella', autor: 'John Green', anio: 2012, genero: 'drama', comentario: '', coleccion: false },
  ];
  
  const prestamos = [
    // Activo vencido (Prestado hace 20 días, límite hace 6 días)
    { id: 'P1', idLibro: 'L1', persona: 'Sofía Valdés', fechaPrestamo: sumarDias(h, -20), fechaLimite: sumarDias(h, -6), fechaDevolucion: null },
    // Activo vigente (Prestado hoy, límite en 14 días)
    { id: 'P2', idLibro: 'L3', persona: 'Valeria Gómez', fechaPrestamo: h, fechaLimite: sumarDias(h, 14), fechaDevolucion: null },
    // Devuelto a tiempo (límite hace 16 días, devuelto hace 18 días)
    { id: 'P3', idLibro: 'L5', persona: 'Camila Restrepo', fechaPrestamo: sumarDias(h, -30), fechaLimite: sumarDias(h, -16), fechaDevolucion: sumarDias(h, -18) },
    // Devuelto con retraso (límite hace 26 días, devuelto hace 20 días -> 6 días de retraso)
    { id: 'P4', idLibro: 'L7', persona: 'Daniela Torres', fechaPrestamo: sumarDias(h, -40), fechaLimite: sumarDias(h, -26), fechaDevolucion: sumarDias(h, -20) },
  ];
  
  return { libros, prestamos };
}

// ============================================================
// ESTADO
// ============================================================
let DB = { libros: [], prestamos: [] };
let filtros = { busqueda: '', estado: 'todos', genero: 'todos', orden: 'titulo', direccion: 'asc' };
let tema = 'claro';
let nombreUsuario = '';
let idLibroEditando = null;
let idLibroAEliminar = null;
let idLibroAPrestar = null;

// ============================================================
// LÓGICA DE NEGOCIO
// ============================================================
const Biblioteca = {
  getPrestamoActivo(idLibro) {
    return DB.prestamos.find(p => p.idLibro === idLibro && p.fechaDevolucion === null) || null;
  },
  estaDisponible(libro) {
    return !libro.coleccion && !this.getPrestamoActivo(libro.id);
  },
  estaVencido(prestamo) {
    return prestamo.fechaDevolucion === null && prestamo.fechaLimite < hoy();
  },
  diasRetraso(prestamo) {
    if (prestamo.fechaDevolucion === null) {
      if (!this.estaVencido(prestamo)) return 0;
      const diff = new Date(hoy()) - new Date(prestamo.fechaLimite);
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    const diff = new Date(prestamo.fechaDevolucion) - new Date(prestamo.fechaLimite);
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  },
  contarActivos() {
    return DB.prestamos.filter(p => p.fechaDevolucion === null).length;
  },
  prestar(idLibro, persona) {
    if (this.contarActivos() >= 3) throw new Error('Máximo 3 préstamos activos a la vez.');
    if (this.getPrestamoActivo(idLibro)) throw new Error('El libro ya está prestado.');
    const libro = DB.libros.find(l => l.id === idLibro);
    if (!libro) throw new Error('Libro no encontrado.');
    if (libro.coleccion) throw new Error('Los libros de colección no se prestan.');
    const nuevo = {
      id: 'P' + Date.now(), idLibro, persona,
      fechaPrestamo: hoy(), fechaLimite: sumarDias(hoy(), 14), fechaDevolucion: null,
    };
    DB.prestamos.push(nuevo);
    return nuevo;
  },
  devolver(idPrestamo) {
    const p = DB.prestamos.find(x => x.id === idPrestamo);
    if (!p || p.fechaDevolucion) return null;
    p.fechaDevolucion = hoy();
    return p;
  },
  validarLibro(datos, idEditando = null) {
    const errores = {};
    if (datos.titulo.length < 3 || datos.titulo.length > 60) errores.titulo = 'Título de 3 a 60 caracteres.';
    if (!datos.autor.trim()) errores.autor = 'El autor es obligatorio.';
    if (isNaN(datos.anio) || datos.anio < 1000 || datos.anio > 2026) errores.anio = 'Año entre 1000 y 2026.';
    const dup = DB.libros.find(l =>
      l.id !== idEditando &&
      l.titulo.toLowerCase() === datos.titulo.toLowerCase() &&
      l.autor.toLowerCase() === datos.autor.toLowerCase()
    );
    if (dup) errores.titulo = 'Ya existe un libro con ese título y autor.';
    return errores;
  },
  agregarLibro(datos) {
    const libro = { id: 'L' + Date.now(), ...datos };
    DB.libros.push(libro);
    return libro;
  },
  editarLibro(id, datos) {
    const libro = DB.libros.find(l => l.id === id);
    if (!libro) return null;
    Object.assign(libro, datos);
    return libro;
  },
  eliminarLibro(id) {
    if (this.getPrestamoActivo(id)) throw new Error('El libro tiene un préstamo activo y no se puede eliminar.');
    DB.libros = DB.libros.filter(l => l.id !== id);
    DB.prestamos = DB.prestamos.filter(p => p.idLibro !== id);
  },
  filtrarYOrdenar(f) {
    let resultado = [...DB.libros];
    if (f.busqueda) {
      const q = f.busqueda.toLowerCase();
      resultado = resultado.filter(l =>
        l.titulo.toLowerCase().includes(q) || l.autor.toLowerCase().includes(q));
    }
    if (f.estado === 'disponibles') resultado = resultado.filter(l => this.estaDisponible(l));
    if (f.estado === 'prestados') resultado = resultado.filter(l => this.getPrestamoActivo(l.id));
    if (f.genero !== 'todos') resultado = resultado.filter(l => l.genero === f.genero);
    resultado.sort((a, b) => {
      const va = a[f.orden], vb = b[f.orden];
      const cmp = typeof va === 'string' ? va.localeCompare(vb, 'es') : va - vb;
      return f.direccion === 'asc' ? cmp : -cmp;
    });
    return resultado;
  },
  calcularResumen() {
    const total = DB.libros.length;
    const disponibles = DB.libros.filter(l => this.estaDisponible(l)).length;
    const prestados = DB.libros.filter(l => this.getPrestamoActivo(l.id)).length;
    const vencidos = DB.prestamos.filter(p => this.estaVencido(p)).length;
    const porGenero = {};
    DB.libros.forEach(l => { porGenero[l.genero] = (porGenero[l.genero] || 0) + 1; });
    return { total, disponibles, prestados, vencidos, porGenero };
  },
};

// ============================================================
// PERSISTENCIA
// ============================================================
const Storage = {
  guardar() {
    localStorage.setItem('biblioteca', JSON.stringify({ DB, filtros, tema, nombreUsuario }));
  },
  cargar() {
    const raw = localStorage.getItem('biblioteca');
    if (!raw) { DB = datosIniciales(); return; }
    try {
      const data = JSON.parse(raw);
      DB = data.DB || datosIniciales();
      filtros = data.filtros || filtros;
      tema = data.tema || 'claro';
      nombreUsuario = data.nombreUsuario || '';
    } catch { DB = datosIniciales(); }
  },
  resetear() {
    DB = datosIniciales();
    filtros = { busqueda: '', estado: 'todos', genero: 'todos', orden: 'titulo', direccion: 'asc' };
    tema = 'claro';
    nombreUsuario = '';
    this.guardar();
  },
};

// ============================================================
// INTERFAZ
// ============================================================
const UI = {
  renderTodo() {
    this.renderCatalogo();
    this.renderPrestamos();
    this.renderResumen();
    this.renderContadorMenu();
    this.renderSaludo();
    this.renderTema();
    this.renderGeneros();
  },
  renderGeneros() {
    const sel = document.querySelector('#filtro-genero');
    const generos = [...new Set(DB.libros.map(l => l.genero))].sort((a, b) => a.localeCompare(b, 'es'));
    sel.textContent = '';
    const optTodos = document.createElement('option');
    optTodos.value = 'todos'; optTodos.textContent = 'Todos los géneros';
    sel.append(optTodos);
    generos.forEach(g => {
      const o = document.createElement('option');
      o.value = g; o.textContent = g;
      sel.append(o);
    });
    sel.value = filtros.genero;
  },
  renderCatalogo() {
    const grid = document.querySelector('#grid-libros');
    grid.textContent = '';
    const libros = Biblioteca.filtrarYOrdenar(filtros);
    libros.forEach(libro => {
      const card = document.createElement('article');
      card.className = 'tarjeta';
      const prestamo = Biblioteca.getPrestamoActivo(libro.id);
      if (prestamo) card.classList.add('prestado');
      if (libro.coleccion) card.classList.add('coleccion');
      const h3 = document.createElement('h3');
      h3.textContent = libro.titulo;
      card.append(h3);
      const pAutor = document.createElement('p');
      pAutor.textContent = `${libro.autor} (${libro.anio})`;
      card.append(pAutor);
      const pGenero = document.createElement('p');
      pGenero.textContent = `Género: ${libro.genero}`;
      card.append(pGenero);
      const estado = document.createElement('p');
      estado.className = 'estado';
      if (libro.coleccion) {
        estado.textContent = 'De colección';
      } else if (prestamo) {
        estado.textContent = `Prestado a ${prestamo.persona} — Devolver antes del ${prestamo.fechaLimite}`;
        if (Biblioteca.estaVencido(prestamo)) {
          const tag = document.createElement('span');
          tag.className = 'etiqueta-vencido';
          tag.textContent = `Vencido (${Biblioteca.diasRetraso(prestamo)}d)`;
          estado.append(' ', tag);
        }
      } else {
        estado.textContent = 'Disponible';
      }
      card.append(estado);
      const acciones = document.createElement('div');
      acciones.className = 'acciones';
      const btnPrestar = document.createElement('button');
      if (prestamo) {
        btnPrestar.textContent = 'Devolver';
        btnPrestar.dataset.accion = 'devolver';
        btnPrestar.dataset.id = libro.id;
      } else {
        btnPrestar.textContent = 'Prestar';
        btnPrestar.dataset.accion = 'prestar';
        btnPrestar.dataset.id = libro.id;
        if (libro.coleccion) btnPrestar.disabled = true;
      }
      acciones.append(btnPrestar);
      const btnEditar = document.createElement('button');
      btnEditar.textContent = 'Editar';
      btnEditar.dataset.accion = 'editar';
      btnEditar.dataset.id = libro.id;
      acciones.append(btnEditar);
      const btnEliminar = document.createElement('button');
      btnEliminar.textContent = 'Eliminar';
      btnEliminar.className = 'peligro';
      btnEliminar.dataset.accion = 'eliminar';
      btnEliminar.dataset.id = libro.id;
      acciones.append(btnEliminar);
      card.append(acciones);
      grid.append(card);
    });
    document.querySelector('#contador-libros').textContent =
      `Mostrando ${libros.length} de ${DB.libros.length} libros`;
  },
  renderPrestamos() {
    const activosCont = document.querySelector('#lista-activos');
    const histCont = document.querySelector('#lista-historial');
    activosCont.textContent = '';
    histCont.textContent = '';
    const activos = DB.prestamos.filter(p => p.fechaDevolucion === null)
      .sort((a, b) => a.fechaLimite.localeCompare(b.fechaLimite));
    if (activos.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'No hay préstamos activos.';
      activosCont.append(p);
    } else {
      activos.forEach(p => {
        const libro = DB.libros.find(l => l.id === p.idLibro);
        if (!libro) return;
        const item = document.createElement('div');
        item.className = 'item-prestamo';
        if (Biblioteca.estaVencido(p)) item.classList.add('vencido');
        const info = document.createElement('div');
        info.className = 'info';
        const h4 = document.createElement('strong');
        h4.textContent = libro.titulo;
        info.append(h4);
        const d1 = document.createElement('p');
        d1.textContent = `Prestado a: ${p.persona}`;
        const d2 = document.createElement('p');
        d2.textContent = `Fecha límite: ${p.fechaLimite}`;
        info.append(d1, d2);
        if (Biblioteca.estaVencido(p)) {
          const tag = document.createElement('span');
          tag.className = 'etiqueta-vencido';
          tag.textContent = `Vencido (${Biblioteca.diasRetraso(p)} días)`;
          info.append(tag);
        }
        item.append(info);
        const btn = document.createElement('button');
        btn.textContent = 'Devolver';
        btn.dataset.accion = 'devolver-prestamo';
        btn.dataset.id = p.id;
        item.append(btn);
        activosCont.append(item);
      });
    }
    const historial = DB.prestamos.filter(p => p.fechaDevolucion !== null)
      .sort((a, b) => b.fechaDevolucion.localeCompare(a.fechaDevolucion));
    if (historial.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'No hay préstamos en el historial.';
      histCont.append(p);
    } else {
      historial.forEach(p => {
        const libro = DB.libros.find(l => l.id === p.idLibro);
        if (!libro) return;
        const item = document.createElement('div');
        item.className = 'item-prestamo';
        const info = document.createElement('div');
        info.className = 'info';
        const h4 = document.createElement('strong');
        h4.textContent = libro.titulo;
        info.append(h4);
        const d1 = document.createElement('p');
        d1.textContent = `Persona: ${p.persona}`;
        const d2 = document.createElement('p');
        d2.textContent = `Prestado: ${p.fechaPrestamo} — Devuelto: ${p.fechaDevolucion}`;
        info.append(d1, d2);
        const retraso = Biblioteca.diasRetraso(p);
        const d3 = document.createElement('p');
        d3.textContent = retraso === 0 ? 'Devuelto a tiempo' : `Devuelto con ${retraso} días de retraso`;
        info.append(d3);
        item.append(info);
        histCont.append(item);
      });
    }
  },
  renderResumen() {
    const cont = document.querySelector('#resumen');
    cont.textContent = '';
    const r = Biblioteca.calcularResumen();
    const p1 = document.createElement('p');
    p1.textContent = `Total de libros: ${r.total}`;
    const p2 = document.createElement('p');
    p2.textContent = `Disponibles: ${r.disponibles}`;
    const p3 = document.createElement('p');
    p3.textContent = `Prestados: ${r.prestados}`;
    const p4 = document.createElement('p');
    p4.textContent = `Vencidos: ${r.vencidos}`;
    const h4 = document.createElement('h4');
    h4.textContent = 'Libros por género:';
    const ul = document.createElement('ul');
    Object.entries(r.porGenero).forEach(([g, n]) => {
      const li = document.createElement('li');
      li.textContent = `${g}: ${n}`;
      ul.append(li);
    });
    cont.append(p1, p2, p3, p4, h4, ul);
  },
  renderContadorMenu() {
    document.querySelector('#contador-prestamos').textContent = Biblioteca.contarActivos();
  },
  renderSaludo() {
    document.querySelector('#saludo-usuario').textContent =
      nombreUsuario ? `Hola, ${nombreUsuario}` : '';
  },
  renderTema() {
    document.body.classList.toggle('tema-oscuro', tema === 'oscuro');
  },
};

// ============================================================
// MODALES Y MENSAJES
// ============================================================
function abrirModal(id) { document.querySelector(`#${id}`).classList.remove('oculto'); }
function cerrarModal(id) { document.querySelector(`#${id}`).classList.add('oculto'); }

function abrirModalPrestar(idLibro) {
  idLibroAPrestar = idLibro;
  document.querySelector('#error-prestar').textContent = '';
  document.querySelector('#nombre-persona').value = nombreUsuario || '';
  abrirModal('modal-prestar');
}

function abrirModalEliminar(idLibro) {
  const libro = DB.libros.find(l => l.id === idLibro);
  if (!libro) return;
  if (Biblioteca.getPrestamoActivo(idLibro)) {
    mostrarMensaje('mensaje-catalogo', 'No se puede eliminar: el libro tiene un préstamo activo.', true);
    return;
  }
  idLibroAEliminar = idLibro;
  document.querySelector('#mensaje-eliminar').textContent = `¿Eliminar «${libro.titulo}»?`;
  abrirModal('modal-eliminar');
}

function mostrarMensaje(id, texto, esError = false) {
  const el = document.querySelector(`#${id}`);
  if (!el) return;
  el.textContent = texto;
  el.classList.toggle('error', esError);
  setTimeout(() => { el.textContent = ''; el.classList.remove('error'); }, 4000);
}

// ============================================================
// FORMULARIO
// ============================================================
function limpiarFormulario() {
  document.querySelector('#form-libro').reset();
  idLibroEditando = null;
  document.querySelector('#titulo-formulario').textContent = 'Agregar libro';
  document.querySelector('#btn-guardar').textContent = 'Agregar libro';
  document.querySelector('#btn-cancelar-edicion').classList.add('oculto');
  document.querySelector('#restantes-comentario').textContent = '120';
  ['titulo', 'autor', 'anio'].forEach(c => document.querySelector(`#error-${c}`).textContent = '');
}

function cargarEnFormulario(idLibro) {
  const libro = DB.libros.find(l => l.id === idLibro);
  if (!libro) return;
  idLibroEditando = idLibro;
  document.querySelector('#campo-titulo').value = libro.titulo;
  document.querySelector('#campo-autor').value = libro.autor;
  document.querySelector('#campo-anio').value = libro.anio;
  document.querySelector('#campo-genero').value = libro.genero;
  document.querySelector('#campo-comentario').value = libro.comentario || '';
  document.querySelector('#campo-coleccion').checked = libro.coleccion;
  document.querySelector('#titulo-formulario').textContent = 'Editar libro';
  document.querySelector('#btn-guardar').textContent = 'Guardar cambios';
  document.querySelector('#btn-cancelar-edicion').classList.remove('oculto');
  document.querySelector('#restantes-comentario').textContent = 120 - (libro.comentario || '').length;
  document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
  document.querySelector('#vista-formulario').classList.add('activa');
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('activo'));
  document.querySelector('nav a[data-vista="formulario"]').classList.add('activo');
}

// ============================================================
// EVENTOS
// ============================================================
function configurarEventos() {
  document.querySelector('#menu').addEventListener('click', (e) => {
    const link = e.target.closest('a[data-vista]');
    if (!link) return;
    e.preventDefault();
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.querySelector(`#vista-${link.dataset.vista}`).classList.add('activa');
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('activo'));
    link.classList.add('activo');
  });

  document.querySelector('#grid-libros').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-accion]');
    if (!btn) return;
    const { accion, id } = btn.dataset;
    if (accion === 'prestar') abrirModalPrestar(id);
    if (accion === 'devolver') {
      const p = Biblioteca.getPrestamoActivo(id);
      if (!p) return;
      const devuelto = Biblioteca.devolver(p.id);
      Storage.guardar();
      UI.renderTodo();
      const retraso = Biblioteca.diasRetraso(devuelto);
      mostrarMensaje('mensaje-catalogo', retraso === 0 ? 'Libro devuelto a tiempo.' : `Libro devuelto con ${retraso} días de retraso.`);
    }
    if (accion === 'editar') cargarEnFormulario(id);
    if (accion === 'eliminar') abrirModalEliminar(id);
  });

  document.querySelector('#vista-prestamos').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-accion="devolver-prestamo"]');
    if (!btn) return;
    const p = Biblioteca.devolver(btn.dataset.id);
    if (!p) return;
    Storage.guardar();
    UI.renderTodo();
    const retraso = Biblioteca.diasRetraso(p);
    mostrarMensaje('mensaje-prestamos', retraso === 0 ? 'Libro devuelto a tiempo.' : `Libro devuelto con ${retraso} días de retraso.`);
  });

  document.querySelector('#busqueda').addEventListener('input', (e) => {
    filtros.busqueda = e.target.value;
    Storage.guardar();
    UI.renderCatalogo();
  });
  document.querySelector('#filtros-estado').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-estado]');
    if (!btn) return;
    filtros.estado = btn.dataset.estado;
    document.querySelectorAll('#filtros-estado .filtro').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    Storage.guardar();
    UI.renderCatalogo();
  });
  document.querySelector('#filtro-genero').addEventListener('change', (e) => {
    filtros.genero = e.target.value;
    Storage.guardar();
    UI.renderCatalogo();
  });
  document.querySelector('#orden').addEventListener('change', (e) => {
    filtros.orden = e.target.value;
    Storage.guardar();
    UI.renderCatalogo();
  });
  document.querySelector('#direccion').addEventListener('change', (e) => {
    filtros.direccion = e.target.value;
    Storage.guardar();
    UI.renderCatalogo();
  });

  document.querySelector('#form-prestar').addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.querySelector('#nombre-persona').value.trim();
    if (nombre.length < 2 || nombre.length > 40) {
      document.querySelector('#error-prestar').textContent = 'Nombre de 2 a 40 caracteres.';
      return;
    }
    try {
      Biblioteca.prestar(idLibroAPrestar, nombre);
      Storage.guardar();
      UI.renderTodo();
      cerrarModal('modal-prestar');
      mostrarMensaje('mensaje-catalogo', `Préstamo registrado a ${nombre}.`);
    } catch (err) {
      document.querySelector('#error-prestar').textContent = err.message;
    }
  });

  document.querySelector('#btn-confirmar-eliminar').addEventListener('click', () => {
    try {
      Biblioteca.eliminarLibro(idLibroAEliminar);
      Storage.guardar();
      UI.renderTodo();
      cerrarModal('modal-eliminar');
      mostrarMensaje('mensaje-catalogo', 'Libro eliminado.');
    } catch (err) {
      cerrarModal('modal-eliminar');
      mostrarMensaje('mensaje-catalogo', err.message, true);
    }
    idLibroAEliminar = null;
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cerrar-modal]');
    if (!btn) return;
    btn.closest('.modal').classList.add('oculto');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modalAbierto = document.querySelector('.modal:not(.oculto)');
    if (modalAbierto) { modalAbierto.classList.add('oculto'); return; }
    limpiarFormulario();
  });

  document.querySelector('#campo-comentario').addEventListener('input', (e) => {
    document.querySelector('#restantes-comentario').textContent = 120 - e.target.value.length;
  });

  document.querySelector('#form-libro').addEventListener('submit', (e) => {
    e.preventDefault();
    const datos = {
      titulo: document.querySelector('#campo-titulo').value.trim(),
      autor: document.querySelector('#campo-autor').value.trim(),
      anio: parseInt(document.querySelector('#campo-anio').value, 10),
      genero: document.querySelector('#campo-genero').value,
      comentario: document.querySelector('#campo-comentario').value.trim(),
      coleccion: document.querySelector('#campo-coleccion').checked,
    };
    if (idLibroEditando && datos.coleccion) {
      const libro = DB.libros.find(l => l.id === idLibroEditando);
      if (libro && Biblioteca.getPrestamoActivo(libro.id)) {
        mostrarMensaje('mensaje-formulario', 'No se puede marcar como colección: tiene préstamo activo.', true);
        return;
      }
    }
    const errores = Biblioteca.validarLibro(datos, idLibroEditando);
    ['titulo', 'autor', 'anio'].forEach(c => {
      document.querySelector(`#error-${c}`).textContent = errores[c] || '';
    });
    if (Object.keys(errores).length > 0) {
      const primero = Object.keys(errores)[0];
      const input = document.querySelector(`#campo-${primero}`);
      if (input) input.focus();
      return;
    }
    if (idLibroEditando) {
      Biblioteca.editarLibro(idLibroEditando, datos);
      mostrarMensaje('mensaje-formulario', 'Cambios guardados.');
    } else {
      Biblioteca.agregarLibro(datos);
      mostrarMensaje('mensaje-formulario', 'Libro agregado.');
    }
    Storage.guardar();
    limpiarFormulario();
    UI.renderTodo();
  });

  document.querySelector('#btn-cancelar-edicion').addEventListener('click', limpiarFormulario);

  document.querySelector('#btn-tema').addEventListener('click', () => {
    tema = tema === 'claro' ? 'oscuro' : 'claro';
    Storage.guardar();
    UI.renderTema();
  });

  document.querySelector('#campo-usuario').addEventListener('input', (e) => {
    nombreUsuario = e.target.value.trim();
    Storage.guardar();
    UI.renderSaludo();
  });

  document.querySelector('#btn-restablecer').addEventListener('click', () => {
    Storage.resetear();
    document.querySelector('#campo-usuario').value = '';
    UI.renderTodo();
    UI.renderCatalogo();
    mostrarMensaje('mensaje-resumen', 'Biblioteca restablecida.');
  });
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  Storage.cargar();
  document.querySelector('#busqueda').value = filtros.busqueda;
  document.querySelectorAll('#filtros-estado .filtro').forEach(b => {
    b.classList.toggle('activo', b.dataset.estado === filtros.estado);
  });
  document.querySelector('#orden').value = filtros.orden;
  document.querySelector('#direccion').value = filtros.direccion;
  document.querySelector('#campo-usuario').value = nombreUsuario;
  configurarEventos();
  UI.renderTodo();
});