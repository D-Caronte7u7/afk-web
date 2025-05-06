// ui.js
document.addEventListener('DOMContentLoaded', () => {
    // Manejo de tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
    
    // Configuración de los file inputs
    function setupFileInput(inputId, listId, processBtnId = null) {
        const upload = document.querySelector(`#${inputId}Upload`);
        const input = document.getElementById(inputId);
        const button = upload.querySelector('.upload-btn');
        
        // Click en el área de upload
        upload.addEventListener('click', (e) => {
            if (e.target !== button) {
                input.click();
            }
        });
        
        // Click en el botón
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            input.click();
        });
        
        input.addEventListener('change', () => {
            if (input.files.length > 0) {
                updateFileList(input, listId);
                
                if (processBtnId) {
                    document.getElementById(processBtnId).disabled = false;
                }
            }
        });
        
        // Drag and drop
        upload.addEventListener('dragover', (e) => {
            e.preventDefault();
            upload.classList.add('dragover');
        });
        
        upload.addEventListener('dragleave', () => {
            upload.classList.remove('dragover');
        });
        
        upload.addEventListener('drop', (e) => {
            e.preventDefault();
            upload.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                input.files = e.dataTransfer.files;
                const event = new Event('change');
                input.dispatchEvent(event);
            }
        });
    }
    
    // Configurar los file inputs
    setupFileInput('excelFile', 'fileList', 'processBtn');
    setupFileInput('dbFile', 'dbFileList');
    
    // Inicializar los componentes
    new TimeConverter();
});

function updateFileList(input, listId) {
    const fileList = document.getElementById(listId);
    fileList.innerHTML = '';
    
    if (input.files.length === 0) {
        fileList.innerHTML = '<div class="empty-message">No hay archivos seleccionados</div>';
        return;
    }
    
    const fileCount = document.createElement('div');
    fileCount.className = 'file-count';
    fileCount.textContent = `${input.files.length} archivo(s) seleccionado(s)`;
    fileList.appendChild(fileCount);
    
    Array.from(input.files).forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        const fileSize = document.createElement('span');
        fileSize.className = 'file-size';
        fileSize.textContent = formatFileSize(file.size);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            input.value = '';
            updateFileList(input, listId);
            
            if (listId === 'fileList') {
                document.getElementById('processBtn').disabled = true;
                document.getElementById('resultsCard').style.display = 'none';
            } else {
                document.getElementById('tableSelect').disabled = true;
                document.getElementById('exportBtn').disabled = true;
            }
        });
        
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeBtn);
        fileList.appendChild(fileItem);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}