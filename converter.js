console.log('AlertSystem está definido?', typeof AlertSystem);

// En el constructor de TimeConverter, después de inicializar alertSystem
console.log('Sistema de alertas inicializado:', this.alertSystem);
console.log('Método analyze existe?', this.alertSystem?.analyze);

class TimeConverter {
    
    constructor() {
        this.tableContainer = document.getElementById('resultsTable');
        this.loadingIndicator = document.getElementById('loading');
        this.excelFileInput = document.getElementById('excelFile');
        this.processBtn = document.getElementById('processBtn');
        this.resultsCard = document.getElementById('resultsCard');
        this.statusDiv = document.getElementById('status');
        this.exportResultsBtn = document.getElementById('exportResults');
        this.totalHoursSummary = document.getElementById('totalHoursSummary');
        this.totalAfkHours = document.getElementById('totalAfkHours');
        this.alertsContainer = document.getElementById('alertsContainer');
        this.initAlertToggle();
        this.alertsExpanded = false; // Estado inicial

        if (!this.tableContainer || !this.loadingIndicator || !this.excelFileInput || 
            !this.processBtn || !this.resultsCard || !this.statusDiv) {
            console.error('Elementos requeridos no encontrados en el DOM');
            return;
        }

        this.playersDB = {
            "9fcdf4a6-2a41-47ef-9e5c-55a3cfdda3ca": "4nTH0nY_",
            "3d808c51-8a0a-4c5e-985f-92ff094aa0f0": "YaooXv",
            "fc6f0688-fff0-409a-88a2-e2e1a3d630ba": "DkFull",
            "88907ede-f3e8-4fed-bc2a-c3a449f17dfc": "gekyuume",
            "89bf9ad1-db0c-49a3-843a-3c712eb1e963": "yNitsu",
            "166e8aa6-1b1d-4363-a975-b7534a81a2d9": "Triliz_",
            "2d1ed19c-c621-43f7-9e82-ee4d7d6c0070": "Henyydis",
            "c1b4a6e4-2a85-4222-94d1-e4be6b8186d5": "Zheio",
            "99181ed0-af89-43da-86f0-841471383140": "Son3ca",
            "4e4738f1-c15a-4eee-ac77-149b63c586d8": "wyzo_",
            "7061a13b-e873-47c4-829a-ea79eda6ba09": "Colombianazzo",
            "729d55f7-c16a-4744-b878-758af6a23803": "Hhajime",
            "37f3f6bb-7a78-4819-9bc4-2b51ea31b9ce": "shirokun003",
            "c3775330-3d7b-40c3-a988-8c9c5bdf3bc5": "aelucasz",
            "3a18bc46-eb55-45ac-9b86-c2aaba1873f4": "arlug08",
            "67de80d7-2c9f-444a-a218-5ad95837c5b7": "seaofted",
            "214bf3ae-5b39-48be-b336-99f73a853cb6": "Night_Wolf_Gamer",
            "69b5db22-eaf3-4803-b850-609e6855ac26": "YellowLumberjack"
        };

        try {
            this.alertSystem = new AlertSystem(this.playersDB);
            console.log('Sistema de alertas inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando AlertSystem:', error);
            this.alertSystem = null;
        }

        this.init();
    }

    init() {
        this.excelFileInput.addEventListener('change', (e) => {
            this.processBtn.disabled = !e.target.files.length;
        });

        this.processBtn.addEventListener('click', async () => {
            if (this.excelFileInput.files.length > 0) {
                await this.processFile(this.excelFileInput.files[0]);
            }
        });
    }

    getPlayerName(uuid) {
        if (!uuid || uuid === 'N/A') return 'N/A';

        // Normalizar UUID
        const normalizedUUID = String(uuid).trim().toLowerCase();

        // Buscar coincidencia exacta
        const exactMatch = this.playersDB[uuid];
        if (exactMatch) return exactMatch;

        // Buscar coincidencia case-insensitive
        for (const key in this.playersDB) {
            if (key.toLowerCase() === normalizedUUID) {
                return this.playersDB[key];
            }
        }

        return uuid; // Devolver UUID original si no se encuentra
    }

    async processFile(file) {
        try {
            this.showLoading(true);
            this.resultsCard.style.display = 'block';
            showStatus('Procesando archivo...', 'status');
            
            const jsonData = await this.readExcelFile(file);
            const processedData = this.processData(jsonData);
            
            console.log('Datos procesados (filtrados):', processedData);

            // Verificación segura del sistema de alertas
            let alerts = [];
            if (this.alertSystem && typeof this.alertSystem.analyze === 'function') {
                alerts = this.alertSystem.analyze(processedData);
                console.log('Alertas generadas:', alerts);
            } else {
                console.warn('El sistema de alertas no está disponible');
            }
            
            this.displayResults(processedData, jsonData.length, alerts);
            
            const totalAfk = processedData.reduce((sum, row) => sum + row.AfkTime, 0);
            this.totalAfkHours.textContent = totalAfk;
            this.totalHoursSummary.style.display = 'flex';
            
            showStatus('Archivo procesado correctamente', 'success');
            
        } catch (error) {
            console.error('Error procesando archivo:', error);
            showStatus(`Error al procesar el archivo: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            // Configurar eventos una sola vez
            reader.onload = (e) => {
                try {
                    // Usar Web Workers para archivos grandes (> 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        this.processLargeFile(e.target.result)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        resolve(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Error al leer el archivo'));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    // Para archivos grandes (opcional)
    async processLargeFile(arrayBuffer) {
        // Implementación con Web Worker si es necesario
        return new Promise((resolve) => {
            // Simular procesamiento en segundo plano
            setTimeout(() => {
                const data = new Uint8Array(arrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                resolve(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]));
            }, 0);
        });
    }

    processData(jsonData) {
        return jsonData
            .map(row => {
                const playerUUID = String(row.PlayerUuid || row.PlayerUUID || '').trim();
                const playerName = this.getPlayerName(playerUUID);
                
                // Solo procesar si el jugador está en la DB
                if (playerName === playerUUID) {
                    return null;
                }
    
                const afkMs = parseFloat(row.AfkTime) || 0;
                const nonAfkMs = parseFloat(row.NonAfkTime) || 0;
                const afkHours = this.msToRoundedHours(afkMs);
                const nonAfkHours = this.msToRoundedHours(nonAfkMs);
                
                // Si ambos son 0, no incluir en los resultados
                if (afkHours === 0 && nonAfkHours === 0) {
                    return null;
                }
                
                return {
                    PlayerUUID: playerUUID,
                    PlayerName: playerName,
                    AfkTime: afkHours,
                    NonAfkTime: nonAfkHours,
                    TotalTime: afkHours + nonAfkHours
                };
            })
            .filter(row => row !== null);
    }

    msToRoundedHours(ms) {
        return Math.round(ms / (1000 * 60 * 60));
    }

    displayResults(data, totalRecords, alerts = null) {
        if (data.length === 0) {
            showStatus('No hay registros de jugadores conocidos', 'error');
            this.tableContainer.innerHTML = '';
            this.exportResultsBtn.disabled = true;
            return;
        }

        // Limpiar contenedores primero
        this.tableContainer.innerHTML = '';
        const alertsContainer = document.getElementById('alertsContainer');
        alertsContainer.innerHTML = '';

        // Mostrar alertas si existen
        if (alerts && alerts.length > 0) {
            this.displayAlerts(alerts);
        }

        // Generar tabla de resultados
        this.tableContainer.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th class="sortable-header" data-sort="PlayerName">
                            Jugador <i class="fas fa-sort"></i>
                        </th>
                        <th class="sortable-header" data-sort="AfkTime">
                            Tiempo AFK (horas) <i class="fas fa-sort"></i>
                        </th>
                        <th class="sortable-header" data-sort="NonAfkTime">
                            Tiempo Activo (horas) <i class="fas fa-sort"></i>
                        </th>
                        <th class="sortable-header" data-sort="TotalTime">
                            Tiempo Total (horas) <i class="fas fa-sort"></i>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(row => `
                        <tr>
                            <td>${row.PlayerName}</td>
                            <td>${row.AfkTime}</td>
                            <td>${row.NonAfkTime}</td>
                            <td>${row.TotalTime}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="summary">Mostrando ${data.length} de ${totalRecords} registros</div>
        `;

        this.exportResultsBtn.disabled = false;
        this.exportResultsBtn.onclick = () => this.exportResults(data);
        this.setupSorting(data);
    }

    initAlertToggle() {
        const toggleBtn = document.getElementById('alertsToggle');
        const alertsContainer = document.getElementById('alertsContainer');
        
        if (toggleBtn && alertsContainer) {
            toggleBtn.addEventListener('click', () => {
                this.alertsExpanded = !this.alertsExpanded;
                
                // Usar classList para mejor compatibilidad
                alertsContainer.classList.toggle('expanded', this.alertsExpanded);
                
                // Animación más suave
                const toggleIcon = toggleBtn.querySelector('.toggle-icon');
                if (toggleIcon) {
                    toggleIcon.style.transform = this.alertsExpanded 
                        ? 'rotate(180deg)' 
                        : 'rotate(0deg)';
                }
                
                // Forzar repintado para asegurar la animación
                void alertsContainer.offsetHeight;
            });
        }
    }


    displayAlerts(alerts) {
        const alertsContainer = document.getElementById('alertsContainer');
        const alertsCount = document.getElementById('alertsCount');
        
        // Limpiar contenedor
        alertsContainer.innerHTML = '';
        
        // Filtrar alertas válidas
        const validAlerts = alerts.filter(alert => 
            !(alert.details.afkTime === 0 && alert.details.activeTime === 0)
        );

        // Actualizar contador
        alertsCount.textContent = validAlerts.length;
        alertsCount.className = 'badge ' + (validAlerts.length > 0 ? 'danger' : 'success');

        if (validAlerts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="no-alerts">
                    <i class="fas fa-check-circle"></i>
                    No se encontraron alertas importantes
                </div>
            `;
            return;
        }

        // Agrupar alertas por jugador
        const playersAlerts = {};
        validAlerts.forEach(alert => {
            if (!playersAlerts[alert.playerId]) {
                playersAlerts[alert.playerId] = {
                    name: alert.playerName,
                    alerts: []
                };
            }
            playersAlerts[alert.playerId].alerts.push(alert);
        });

        // Construir HTML
        let html = '';
        Object.values(playersAlerts).forEach(player => {
            html += `
                <div class="player-alerts">
                    <div class="player-header">
                        <span class="player-name">${player.name}</span>
                        <span class="alert-count">${player.alerts.length} alertas</span>
                    </div>
                    <ul class="alert-list">
                        ${player.alerts.map(alert => `
                            <li class="alert-item ${alert.severity}">
                                <span class="alert-icon"></span>
                                <span class="alert-text">
                                    ${alert.ruleName}
                                    <small>(AFK: ${alert.details.afkTime}h, Activo: ${alert.details.activeTime}h)</small>
                                </span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        });

        alertsContainer.innerHTML = html;
        
        // Configurar estado inicial
        alertsContainer.classList.remove('expanded');
        const toggleIcon = document.querySelector('.toggle-icon');
        if (toggleIcon) {
            toggleIcon.style.transform = 'rotate(0deg)';
        }
        this.alertsExpanded = false;
    }
    
    getAlertIconClass(severity) {
        const icons = {
            danger: 'fa-skull-crossbones',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        return icons[severity] || 'fa-bell';
    }

    displayAlertSummary(alerts) {
        const summary = this.alertSystem.getAlertSummary(alerts);
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert-summary';

        alertContainer.innerHTML = `
            <div class="alert-header">
                <h3><i class="fas fa-bell"></i> Resumen de Alertas</h3>
                <span class="badge danger">${summary.danger} Críticas</span>
                <span class="badge warning">${summary.warning} Advertencias</span>
                <span class="badge info">${summary.info} Informativas</span>
            </div>
            <div class="alert-details" style="display:none;">
                ${this.renderAlertDetails(alerts)}
            </div>
            <button class="toggle-alerts">Mostrar Detalles</button>
        `;

        // Insertar antes de la tabla
        this.tableContainer.parentNode.insertBefore(alertContainer, this.tableContainer);

        // Evento para mostrar/ocultar detalles
        alertContainer.querySelector('.toggle-alerts').addEventListener('click', (e) => {
            const details = alertContainer.querySelector('.alert-details');
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
            e.target.textContent = details.style.display === 'none' ? 'Mostrar Detalles' : 'Ocultar Detalles';
        });
    }

    renderAlertDetails(alerts) {
        let html = '';

        // Alertas por severidad
        ['danger', 'warning', 'info'].forEach(severity => {
            if (alerts[severity].length > 0) {
                html += `<div class="alert-severity ${severity}">
                    <h4>${severity === 'danger' ? 'Críticas' : severity === 'warning' ? 'Advertencias' : 'Informativas'}</h4>
                    <ul>
                        ${alerts[severity].map(alert => `
                            <li>
                                <strong>${alert.playerName}</strong>: ${alert.ruleName}
                                <span class="alert-data">(AFK: ${alert.details.afkTime}h, Activo: ${alert.details.activeTime}h)</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>`;
            }
        });

        return html;
    }


    setupSorting(data) {
        // Usar delegación de eventos en lugar de múltiples listeners
        this.tableContainer.addEventListener('click', (e) => {
            const header = e.target.closest('.sortable-header');
            if (!header) return;

            const sortKey = header.dataset.sort;
            const isAsc = !header.classList.contains('sorted-asc');

            // Resetear todos los headers
            document.querySelectorAll('.sortable-header').forEach(h => {
                h.classList.remove('sorted-asc', 'sorted-desc');
                const icon = h.querySelector('i');
                icon.className = 'fas fa-sort';
            });

            // Ordenar datos (optimizado para grandes conjuntos)
            const sortedData = this.sortData([...data], sortKey, isAsc);

            // Actualizar UI
            header.classList.add(isAsc ? 'sorted-asc' : 'sorted-desc');
            const icon = header.querySelector('i');
            icon.className = isAsc ? 'fas fa-sort-up' : 'fas fa-sort-down';

            // Volver a renderizar
            this.displayResults(sortedData, data.length);
        });
    }

    // Función separada para ordenamiento optimizado
    sortData(data, sortKey, isAsc) {
        return data.sort((a, b) => {
            if (['AfkTime', 'NonAfkTime', 'TotalTime'].includes(sortKey)) {
                return isAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
            }
            return isAsc
                ? a[sortKey].localeCompare(b[sortKey])
                : b[sortKey].localeCompare(a[sortKey]);
        });
    }

    exportResults(data) {
        try {
            const exportData = data.map(row => ({
                'Jugador': row.PlayerName,
                'UUID': row.PlayerUUID,
                'Tiempo AFK (horas)': row.AfkTime,
                'Tiempo Activo (horas)': row.NonAfkTime,
                'Tiempo Total (horas)': row.TotalTime
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Tiempos_Procesados");

            const date = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(wb, `tiempos_filtrados_${date}.xlsx`);

            // Liberar memoria
            exportData.length = 0;

            showStatus('Resultados filtrados exportados correctamente', 'success');
        } catch (error) {
            showStatus(`Error al exportar resultados: ${error.message}`, 'error');
        }
    }

    showLoading(show) {
        this.loadingIndicator.style.display = show ? 'block' : 'none';
        this.processBtn.disabled = show;
    }


    // En TimeConverter
    addCustomAlertRule(ruleConfig) {
        this.alertSystem.addRule({
            id: `custom-${Date.now()}`,
            name: ruleConfig.name || 'Regla Personalizada',
            description: ruleConfig.description || '',
            condition: (player) => {
                // Evaluar condición dinámica
                const fieldValue = player[ruleConfig.field];
                switch (ruleConfig.operator) {
                    case '>': return fieldValue > ruleConfig.value;
                    case '<': return fieldValue < ruleConfig.value;
                    case '>=': return fieldValue >= ruleConfig.value;
                    case '<=': return fieldValue <= ruleConfig.value;
                    case '==': return fieldValue == ruleConfig.value;
                    default: return false;
                }
            },
            severity: ruleConfig.severity || 'warning'
        });
    }

    exportAlerts(alerts, format = 'json') {
        const data = {
            meta: {
                generatedAt: new Date().toISOString(),
                totalAlerts: alerts.danger.length + alerts.warning.length + alerts.info.length
            },
            alerts: {
                danger: alerts.danger,
                warning: alerts.warning,
                info: alerts.info
            },
            players: alerts.players
        };

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            saveAs(blob, `alertas_${new Date().toISOString().slice(0, 10)}.json`);
        } else if (format === 'csv') {
            // Convertir a CSV
            let csv = 'Jugador,Tipo Alerta,Severidad,Tiempo AFK,Tiempo Activo\n';
            Object.values(alerts.players).forEach(player => {
                player.alerts.forEach(alert => {
                    csv += `"${player.name}","${alert.ruleName}","${alert.severity}",${alert.details.afkTime},${alert.details.activeTime}\n`;
                });
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            saveAs(blob, `alertas_${new Date().toISOString().slice(0, 10)}.csv`);
        }
    }
}

// Inicializar el conversor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const requiredElements = [
        'resultsTable', 'loading', 'excelFile',
        'processBtn', 'resultsCard', 'status'
    ];

    const allElementsExist = requiredElements.every(id => document.getElementById(id));

    if (allElementsExist) {
        new TimeConverter();
    } else {
        console.error('No se pueden inicializar los componentes - Faltan elementos requeridos');
    }
});