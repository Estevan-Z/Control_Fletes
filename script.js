let baseActual;

// Función principal que inicia la aplicación
function iniciarAplicacion(base) {
    baseActual = base;
    
    const form = document.getElementById('despachoForm');
    const limpiarBtn = document.getElementById('limpiar');
    const listaDespachos = document.getElementById('listaDespachos');
    
    const claveStorage = `fletes_${baseActual}`;
    let fletes = JSON.parse(localStorage.getItem(claveStorage)) || [];
    let editando = false;
    let idEdicion = null;
    
    // Mostrar fletes al cargar la página
    mostrarFletes();
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const documento = document.getElementById('documento').value;
        const fecha = document.getElementById('fecha').value;
        const origen = document.getElementById('origen').value;
        const destino = document.getElementById('destino').value;
        const cliente = document.getElementById('cliente').value;
        const cajas = parseInt(document.getElementById('cajas').value);
        const domicilios = parseInt(document.getElementById('domicilios').value);
        const precio = parseFloat(document.getElementById('precio').value);
        const observacion = document.getElementById('observacion').value;
        
        const flete = {
            id: Date.now(),
            documento,
            fecha,
            origen,
            destino,
            cliente,
            cajas,
            domicilios,
            precio,
            observacion,
            base: baseActual
        };
        
        if (editando) {
            // Editar flete existente
            const index = fletes.findIndex(f => f.id === idEdicion);
            fletes[index] = {...flete, id: idEdicion};
            editando = false;
            idEdicion = null;
        } else {
            // Agregar nuevo flete
            fletes.push(flete);
        }
        
        // Guardar en localStorage
        guardarFletes();
        
        // Mostrar fletes
        mostrarFletes();
        
        // Limpiar formulario
        form.reset();
    });
    
    // Evento para limpiar el formulario
    limpiarBtn.addEventListener('click', function() {
        form.reset();
        editando = false;
        idEdicion = null;
    });
    
    // Botón para exportar a Excel
    document.getElementById('exportarExcel').addEventListener('click', exportarAExcel);
    
    // Función para mostrar los fletes en la tabla
    function mostrarFletes() {
        listaDespachos.innerHTML = '';
        
        if (fletes.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="10" style="text-align: center;">No hay fletes registrados</td>`;
            listaDespachos.appendChild(row);
            return;
        }
        
        // Ordenar por fecha (más reciente primero)
        fletes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        fletes.forEach(flete => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${flete.documento}</td>
                <td>${formatearFecha(flete.fecha)}</td>
                <td>${flete.origen}</td>
                <td>${flete.destino}</td>
                <td>${flete.cliente}</td>
                <td>${flete.cajas}</td>
                <td>${flete.domicilios}</td>
                <td>$${flete.precio.toFixed(2)}</td>
                <td>${flete.observacion || '-'}</td>
                <td>
                    <button class="acciones-btn editar-btn" data-id="${flete.id}">Editar</button>
                    <button class="acciones-btn eliminar-btn" data-id="${flete.id}">Eliminar</button>
                </td>
            `;
            
            listaDespachos.appendChild(row);
        });
        
        document.querySelectorAll('.editar-btn').forEach(btn => {
            btn.addEventListener('click', editarFlete);
        });
        
        document.querySelectorAll('.eliminar-btn').forEach(btn => {
            btn.addEventListener('click', eliminarFlete);
        });
    }
    
    // Función para editar un flete
    function editarFlete(e) {
        const id = parseInt(e.target.getAttribute('data-id'));
        const flete = fletes.find(f => f.id === id);
        
        if (flete) {
            document.getElementById('documento').value = flete.documento;
            document.getElementById('fecha').value = flete.fecha;
            document.getElementById('origen').value = flete.origen;
            document.getElementById('destino').value = flete.destino;
            document.getElementById('cliente').value = flete.cliente;
            document.getElementById('cajas').value = flete.cajas;
            document.getElementById('domicilios').value = flete.domicilios;
            document.getElementById('precio').value = flete.precio;
            document.getElementById('observacion').value = flete.observacion || '';
            
            editando = true;
            idEdicion = id;
            
            // Scroll al formulario
            form.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Función para eliminar un flete
    function eliminarFlete(e) {
        if (confirm('¿Estás seguro de que quieres eliminar este flete?')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            fletes = fletes.filter(f => f.id !== id);
            
            guardarFletes();
            mostrarFletes();
        }
    }
    
    // Función para guardar fletes en localStorage
    function guardarFletes() {
        localStorage.setItem(claveStorage, JSON.stringify(fletes));
    }
    
    // Función para exportar a Excel
    function exportarAExcel() {
        if (fletes.length === 0) {
            alert('No hay fletes registrados para exportar');
            return;
        }

        // Preparar los datos para la exportación
        const datosExportar = fletes.map(flete => ({
            'Documento': flete.documento,
            'Fecha': formatearFecha(flete.fecha),
            'Origen': flete.origen,
            'Destino': flete.destino,
            'Cliente': flete.cliente,
            'Cajas': flete.cajas,
            'Domicilios': flete.domicilios,
            'Precio ($)': flete.precio,
            'Observación': flete.observacion || '-',
            'Base': flete.base
        }));

        // Crear libro de trabajo de Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExportar);
        
        // Agregar hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, "Fletes");
        
        // Generar archivo y descargar
        const fechaHoy = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Fletes_${baseActual}_${fechaHoy}.xlsx`);
    }
}

// Función para formatear la fecha
function formatearFecha(fechaStr) {
    const opciones = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Función para formatear números con separadores de miles
function formatearNumero(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}