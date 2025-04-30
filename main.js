
document.addEventListener("DOMContentLoaded", () => {
    cargarOpcionesGrupo();
    mostrarGrupos();
    mostrarPosiciones();
    mostrarPartidosJugados();
    poblarFiltroEquipos();

  });
  
  function mostrarGrupos(filtroGrupo = "") {
    const container = document.getElementById("gruposGrid");
    container.innerHTML = "";
  
    for (let grupo in torneoData.grupos) {
      if (filtroGrupo && grupo !== filtroGrupo) continue;
  
      torneoData.grupos[grupo].forEach(equipo => {   
        container.innerHTML += `
          <div class="col">
            <div class="card h-100 text-center border-0 bg-dark text-light shadow-lg">
              <div class="card-body d-flex flex-column align-items-center">
                <img src="https://i.imgur.com/QvupOW2.png" alt="${equipo}" class="mb-3" style="width: 60px; height: 60px; object-fit: contain;">
                <h5 class="card-title mb-0">${equipo}</h5>
                <small class="mt-1">Grupo ${grupo}</small>
              </div>
            </div>
          </div>`;
      });
    }
  }
  
  function renderTablaPartidos(divId, partidos) {
    const html = partidos.map(p => {
      const resultadoColor = p.resultado ? determinarColor(p.resultado) : "-";
      return `<tr>
        <td>${formatearFecha(p.fecha)}</td>
        <td>${p.equipo1}</td>
        <td>${p.equipo2}</td>
        <td style="color:${resultadoColor}">${p.resultado || "-"}</td>
      </tr>`;
    }).join("");
  
    const tabla = `
      <table class="table table-bordered">
        <thead><tr><th>Fecha</th><th>Equipo 1</th><th>Equipo 2</th><th>Resultado</th></tr></thead>
        <tbody>${html}</tbody>
      </table>`;
    document.getElementById(divId).innerHTML = tabla;
  }

  function cargarOpcionesGrupo() {
    const select = document.getElementById("grupoSelect");
    select.innerHTML = `<option value="">Todos</option>`;
    for (let grupo in torneoData.grupos) {
      const option = document.createElement("option");
      option.value = grupo;
      option.textContent = `Grupo ${grupo}`;
      select.appendChild(option);
    }
  
    // Escuchar cambios en el select
    select.addEventListener("change", () => {
      mostrarGrupos(select.value);
    });
  }

  //Tabla de posiciones
  function calcularPosicionesDesdePartidos(partidos) {
    const posiciones = {};
  // Paso 1: Inicializar todos los equipos desde torneoData.grupos
  for (let grupo in torneoData.grupos) {
    posiciones[grupo] = {};
    torneoData.grupos[grupo].forEach(equipo => {
      posiciones[grupo][equipo] = {
        equipo,
        pj: 0,
        gf: 0,
        gc: 0,
        pts: 0
      };
    });
  }

  // Paso 2: Procesar partidos jugados
  partidos.forEach(partido => {
    if (!partido.resultado) return; // saltar si no se ha jugado

    const [goles1, goles2] = partido.resultado.split("-").map(Number);
    const { equipo1, equipo2, grupo } = partido;

    // Asegurar que los equipos están inicializados (por seguridad extra)
    if (!posiciones[grupo][equipo1]) {
      posiciones[grupo][equipo1] = { equipo: equipo1, pj: 0, gf: 0, gc: 0, pts: 0 };
    }
    if (!posiciones[grupo][equipo2]) {
      posiciones[grupo][equipo2] = { equipo: equipo2, pj: 0, gf: 0, gc: 0, pts: 0 };
    }

    // Actualizar stats
    posiciones[grupo][equipo1].pj += 1;
    posiciones[grupo][equipo2].pj += 1;

    posiciones[grupo][equipo1].gf += goles1;
    posiciones[grupo][equipo1].gc += goles2;

    posiciones[grupo][equipo2].gf += goles2;
    posiciones[grupo][equipo2].gc += goles1;

    if (goles1 > goles2) {
      posiciones[grupo][equipo1].pts += 3;
    } else if (goles1 < goles2) {
      posiciones[grupo][equipo2].pts += 3;
    } else {
      posiciones[grupo][equipo1].pts += 1;
      posiciones[grupo][equipo2].pts += 1;
    }
  });

  // Ordenar posiciones por grupo
  const posicionesFinales = {};
  for (let grupo in posiciones) {
    posicionesFinales[grupo] = Object.values(posiciones[grupo])
      .sort((a, b) =>
        b.pts !== a.pts
          ? b.pts - a.pts
          : (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf
      );
  }

  return posicionesFinales;
  }

  const posicionesCalculadas = calcularPosicionesDesdePartidos(torneoData.partidos);

  function mostrarPosiciones() {
    const container = document.getElementById("posicionesContent");
    container.innerHTML = "";
  
    const grupoSeleccionado = document.getElementById("filtroGrupo").value;
    const posicionesPorGrupo = calcularPosicionesDesdePartidos(torneoData.partidos);
  
    for (let grupo in posicionesPorGrupo) {
        if (grupoSeleccionado !== "todos" && grupoSeleccionado !== grupo) continue;

        const posiciones = posicionesPorGrupo[grupo];
      let html = `
        <h5 class="mt-4">Grupo ${grupo}</h5>
        <div class="table-responsive">
          <table class="table table-dark table-striped table-hover">
            <thead>
              <tr>
                 <th>#</th><th>Equipo</th><th>PJ</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th>
              </tr>
            </thead>
            <tbody>`;
  
            posiciones.forEach((p, index) => {
        const dg = p.gf - p.gc;
        const clasificado = index < 4 ? 'clasificado' : ''; // o 'clasificado'
        const esMiEquipo = p.equipo === equipoFavorito ? 'mi-equipo' : '';
        const clasesFila = `${clasificado} ${esMiEquipo}`.trim();
        html += `
          <tr class="${clasesFila}">
           <td>${index + 1}</td>
            <td>${p.equipo === equipoFavorito ? '⭐ ' : ''}${p.equipo}</td>
            <td>${p.pj}</td>
            <td>${p.gf}</td>
            <td>${p.gc}</td>
            <td>${dg}</td>
            <td><strong>${p.pts}</strong></td>
          </tr>`;
      });
  
      html += `</tbody></table></div>`;
      container.innerHTML += html;
    }
  }

  document.getElementById("filtroGrupo").addEventListener("change", () => {
    mostrarPosiciones(); // recarga las posiciones filtradas
  });

  const equipoFavorito = "Biloxi FC"; // escribe exactamente como aparece

  //Partidos jugados
  function mostrarPartidosJugados() {
    const equipoSeleccionado = document.getElementById("filtroEquipo").value;
    const container = document.getElementById("listaPartidosJugados");
    container.innerHTML = "";
  
    const partidosJugados = torneoData.partidos.filter(p => {
        const jugado = p.resultado;
        const filtraEquipo = !equipoSeleccionado || p.equipo1 === equipoSeleccionado || p.equipo2 === equipoSeleccionado;
        return jugado && filtraEquipo;
      });
  
    if (partidosJugados.length === 0) {
      container.innerHTML = "<p class='text-muted'>No hay partidos jugados aún.</p>";
      return;
    }
  
    // Agrupar por fecha
    const partidosPorFecha = {};
    partidosJugados.forEach(p => {
      if (!partidosPorFecha[p.fecha]) partidosPorFecha[p.fecha] = [];
      partidosPorFecha[p.fecha].push(p);
    });
  
    const fechasOrdenadas = Object.keys(partidosPorFecha).sort((a, b) => new Date(a) - new Date(b));
    let html = '';
  
    fechasOrdenadas.forEach(fecha => {
      html += `<h6 class="mt-4 text-secondary">${formatearFecha(fecha)}</h6>`;
      html += '<div class="row g-3">';
  
      partidosPorFecha[fecha].forEach(p => {
        const esMiEquipo = [p.equipo1, p.equipo2].includes(equipoFavorito);
        const estilo = esMiEquipo ? 'border-warning shadow-sm' : 'border-secondary';
  
        html += `
          <div class="col-md-6 col-lg-4">
            <div class="card card-futbol ${estilo} h-100">
              <div class="card-body text-center">
                <small class="d-block mb-2">Grupo ${p.grupo}</small>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="text-center w-40">
                    <img src="https://i.imgur.com/QvupOW2.png" alt="${p.equipo1}" class="img-fluid mb-1" style="height: 40px;">
                    <div class="${p.equipo1 === equipoFavorito ? 'fw-bold text-primary' : ''}">
                      ${p.equipo1}
                    </div>
                  </div>
                  <div class="fw-bold fs-5">${p.resultado}</div>
                  <div class="text-center w-40">
                    <img src="https://i.imgur.com/QvupOW2.png" alt="${p.equipo2}" class="img-fluid mb-1" style="height: 40px;">
                    <div class="${p.equipo2 === equipoFavorito ? 'fw-bold text-primary' : ''}">
                      ${p.equipo2}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>`;
      });
  
      html += '</div>';
    });
  
    container.innerHTML = html;
  }

  function formatearFecha(fechaStr) {
    const opciones = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', opciones);
  }

  function poblarFiltroEquipos() {
    const select = document.getElementById("filtroEquipo");
    if (!select) return;
  
    torneoData.equipos.forEach(e => {
      const option = document.createElement("option");
      option.value = e;
      option.textContent = e;
      select.appendChild(option);
    });
  }
