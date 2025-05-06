// Variables globales
let db = null;
const sqljsConfig = {
    locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${filename}`
};

// Función para mostrar mensajes de estado
function showStatus(message, type = 'status') {
    const statusDiv = document.getElementById('status');
    if (!statusDiv) {
        console.error('Elemento con ID "status" no encontrado');
        return;
    }
    
    // Crear icono según el tipo de mensaje
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i> ';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i> ';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i> ';
    }
    
    statusDiv.innerHTML = icon + message;
    statusDiv.className = `${type} status`;
    
    if (type !== 'error') {
        setTimeout(() => {
            if (statusDiv.innerHTML === icon + message) {
                statusDiv.textContent = '';
                statusDiv.className = 'status';
            }
        }, 5000);
    }
}

// Inicializar SQL.js
async function initSQLJS() {
    try {
        showStatus('Cargando SQL.js...', 'status');
        const SQL = await initSqlJs(sqljsConfig);
        showStatus('SQL.js cargado correctamente', 'success');
        return SQL;
    } catch (error) {
        showStatus(`Error al cargar SQL.js: ${error}`, 'error');
        return null;
    }
}

// Cargar base de datos
async function loadDatabase(file) {
    const loadingIndicator = document.getElementById('loading');
    try {
        loadingIndicator.style.display = 'block';
        showStatus('Cargando base de datos...', 'status');
        
        const SQL = await initSQLJS();
        if (!SQL) return;

        const reader = new FileReader();
        reader.onload = function() {
            try {
                const uint8Array = new Uint8Array(reader.result);
                db = new SQL.Database(uint8Array);
                populateTableList();
                showStatus('Base de datos cargada correctamente', 'success');
            } catch (error) {
                showStatus(`Error al cargar la base de datos: ${error}`, 'error');
            } finally {
                loadingIndicator.style.display = 'none';
            }
        };
        reader.onerror = () => {
            showStatus('Error al leer el archivo de la base de datos', 'error');
            loadingIndicator.style.display = 'none';
        };
        reader.readAsArrayBuffer(file);
    } catch (error) {
        showStatus(`Error: ${error}`, 'error');
        loadingIndicator.style.display = 'none';
    }
}

// Listar tablas disponibles
function populateTableList() {
    const tableSelect = document.getElementById('tableSelect');
    if (!tableSelect) {
        console.error('Elemento con ID "tableSelect" no encontrado');
        return;
    }
    
    tableSelect.innerHTML = '<option value="">-- Seleccione una tabla --</option>';
    
    try {
        const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
        if (tables.length > 0) {
            const tableNames = tables[0].values.flat();
            tableNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                tableSelect.appendChild(option);
            });
            tableSelect.disabled = false;
            document.getElementById('exportBtn').disabled = false;
        } else {
            showStatus('No se encontraron tablas en la base de datos', 'error');
        }
    } catch (error) {
        showStatus(`Error al leer las tablas: ${error}`, 'error');
    }
}

// Exportar a Excel
function exportToExcel() {
    const loadingIndicator = document.getElementById('loading');
    const tableName = document.getElementById('tableSelect')?.value;
    
    if (!tableName || !db) {
        showStatus('Por favor cargue una base de datos y seleccione una tabla', 'error');
        return;
    }

    try {
        loadingIndicator.style.display = 'block';
        showStatus(`Exportando tabla ${tableName}...`, 'status');
        
        // Obtener datos de la tabla
        const result = db.exec(`SELECT * FROM ${tableName}`);
        if (result.length === 0) {
            showStatus('La tabla está vacía', 'error');
            loadingIndicator.style.display = 'none';
            return;
        }

        const columns = result[0].columns;
        const data = result[0].values;

        // Crear hoja de trabajo
        const wsData = [
            columns, // Encabezados
            ...data  // Datos
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, tableName);
        
        // Exportar a archivo
        const date = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `${tableName}_export_${date}.xlsx`);
        
        showStatus(`Datos exportados correctamente a Excel`, 'success');
    } catch (error) {
        showStatus(`Error al exportar: ${error}`, 'error');
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const dbFileInput = document.getElementById('dbFile');
    const exportBtn = document.getElementById('exportBtn');

    if (!dbFileInput || !exportBtn) {
        console.error('Elementos requeridos no encontrados en el DOM');
        return;
    }

    dbFileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            updateFileList(e.target, 'dbFileList');
            loadDatabase(e.target.files[0]);
        }
    });

    exportBtn.addEventListener('click', exportToExcel);
});