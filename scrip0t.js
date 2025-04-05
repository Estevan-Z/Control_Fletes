document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.form-container')) {
        const pathParts = window.location.pathname.split('/');
        const conductor = pathParts[pathParts.length - 1].replace('.html', '');
        let fletes = JSON.parse(localStorage.getItem(`fletes_${conductor}`)) || [];
        const form = document.getElementById('flete-form');
        const tablaBody = document.querySelector('#fletes-table tbody');
        let fleteEditando = null;

        function formatearFecha(fechaStr) {
            if (!fechaStr) return '';
            const fecha = new Date(fechaStr);
            return fecha.toLocaleDateString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        function formatearPrecioCOP(precio) {
            if (precio === 0 || precio === '0') {
                return 'Sin costo';
            }
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(precio);
        }

        function calcularTotal() {
            return fletes.reduce((total, flete) => total + (parseFloat(flete.precio) || 0), 0);
        }

        function renderizarTabla() {
            tablaBody.innerHTML = '';
            
            if (fletes.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td colspan="8" style="text-align: center; padding: 2rem; color: var(--gray);">
                        <i class="fas fa-inbox"></i>
                        <p>No hay fletes registrados aún</p>
                    </td>
                `;
                tablaBody.appendChild(tr);
                
                // Ocultar total si no hay datos
                document.querySelector('.total-row').style.display = 'none';
                return;
            }
            
            fletes.forEach((flete, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatearFecha(flete.fecha)}</td>
                    <td>${flete.documento}</td>
                    <td>${flete.destino}</td>
                    <td>${flete.cliente}</td>
                    <td data-price="${flete.precio}">${formatearPrecioCOP(flete.precio)}</td>
                    <td>${flete.observacion || '-'}</td>
                    <td>
                        <button class="edit-btn" data-index="${index}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" data-index="${index}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                tablaBody.appendChild(tr);
            });

            // Mostrar fila de total
            const totalRow = document.querySelector('.total-row');
            totalRow.style.display = '';
            document.querySelector('.total-value').textContent = formatearPrecioCOP(calcularTotal());

            // Event listeners para botones
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    if (confirm('¿Estás seguro de eliminar este flete?')) {
                        const index = parseInt(this.getAttribute('data-index'));
                        fletes.splice(index, 1);
                        localStorage.setItem(`fletes_${conductor}`, JSON.stringify(fletes));
                        renderizarTabla();
                        mostrarNotificacion('Flete eliminado correctamente', 'success');
                    }
                });
            });

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    fleteEditando = index;
                    const flete = fletes[index];
                    
                    // Llenar formulario con datos a editar
                    document.getElementById('fecha').value = flete.fecha;
                    document.getElementById('documento').value = flete.documento;
                    document.getElementById('destino').value = flete.destino;
                    document.getElementById('cliente').value = flete.cliente;
                    document.getElementById('precio').value = flete.precio;
                    document.getElementById('observacion').value = flete.observacion || '';
                    
                    // Cambiar texto del botón
                    document.querySelector('button[type="submit"]').innerHTML = `
                        <i class="fas fa-save"></i> Actualizar Flete
                    `;
                    
                    // Scroll al formulario
                    document.querySelector('.form-container').scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            });
        }

        function mostrarNotificacion(mensaje, tipo) {
            const notificacion = document.createElement('div');
            notificacion.className = `notificacion ${tipo}`;
            notificacion.innerHTML = `
                <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                ${mensaje}
            `;
            document.body.appendChild(notificacion);
            setTimeout(() => notificacion.classList.add('mostrar'), 10);
            setTimeout(() => {
                notificacion.classList.remove('mostrar');
                setTimeout(() => document.body.removeChild(notificacion), 300);
            }, 3000);
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nuevoFlete = {
                fecha: document.getElementById('fecha').value,
                documento: document.getElementById('documento').value.trim(),
                destino: document.getElementById('destino').value.trim(),
                cliente: document.getElementById('cliente').value.trim(),
                precio: parseFloat(document.getElementById('precio').value) || 0,
                observacion: document.getElementById('observacion').value.trim()
            };

            if (!nuevoFlete.fecha || !nuevoFlete.documento || !nuevoFlete.destino || !nuevoFlete.cliente) {
                mostrarNotificacion('Por favor complete todos los campos requeridos', 'error');
                return;
            }

            if (isNaN(nuevoFlete.precio) || nuevoFlete.precio < 0) {
                mostrarNotificacion('El precio no puede ser negativo', 'error');
                return;
            }

            if (fleteEditando !== null) {
                // Actualizar flete existente
                fletes[fleteEditando] = nuevoFlete;
                mostrarNotificacion('Flete actualizado correctamente', 'success');
                fleteEditando = null;
            } else {
                // Agregar nuevo flete
                fletes.push(nuevoFlete);
                mostrarNotificacion('Flete registrado correctamente', 'success');
            }

            localStorage.setItem(`fletes_${conductor}`, JSON.stringify(fletes));
            form.reset();
            renderizarTabla();
            
            // Restaurar texto del botón
            document.querySelector('button[type="submit"]').innerHTML = `
                <i class="fas fa-save"></i> Guardar Flete
            `;
        });

        renderizarTabla();
        document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    }
});

// Estilos CSS adicionales para los nuevos elementos
const estiloAdicional = document.createElement('style');
estiloAdicional.textContent = `
    .edit-btn {
        background: #ffc107;
        color: #212529;
        border: none;
        padding: 0.6rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 0.9rem;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-right: 8px;
    }
    
    .edit-btn:hover {
        background: #e0a800;
        transform: translateY(-2px);
        box-shadow: 0 3px 10px rgba(255, 193, 7, 0.3);
    }
    
    .total-row {
        background-color: #f8f9fa;
        font-weight: bold;
    }
    
    .total-label {
        text-align: right;
        padding-right: 20px;
    }
    
    .total-value {
        color: var(--primary);
        font-size: 1.1rem;
    }
`;
document.head.appendChild(estiloAdicional);