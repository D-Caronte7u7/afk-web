class AlertSystem {
    constructor(playersDB = {}) {
        if (!playersDB) {
            console.warn('Se inicializó AlertSystem sin playersDB');
        }
        
        this.playersDB = playersDB || {};
        this.alertRules = [];
        this.initDefaultRules();
    }

    initDefaultRules() {
        // Regla modificada para ignorar tiempos 0
        this.addRule({
            id: 'high-afk',
            name: 'Alto Tiempo AFK',
            description: 'Jugadores con tiempo AFK superior al 50% del tiempo total (excluyendo 0/0)',
            condition: (player) => {
                // Ignorar si ambos tiempos son 0
                if (player.AfkTime === 0 && player.NonAfkTime === 0) return false;
                
                // Calcular proporción solo si hay tiempo total
                if (!player.TotalTime || player.TotalTime === 0) return false;
                return (player.AfkTime / player.TotalTime) > 0.5;
            },
            severity: 'warning'
        });

        // Regla modificada para tiempo AFK
        this.addRule({
            id: 'extreme-afk',
            name: 'AFK Extremo',
            description: 'Jugadores con más de 12 horas AFK (excluyendo 0/0)',
            condition: (player) => {
                if (player.AfkTime === 0 && player.NonAfkTime === 0) return false;
                return player.AfkTime > 12;
            },
            severity: 'danger'
        });

        // Regla modificada para baja actividad
        this.addRule({
            id: 'low-activity',
            name: 'Baja actividad',
            description: 'Menos de 1 hora activa (excluyendo 0/0)',
            condition: (player) => {
                if (player.AfkTime === 0 && player.NonAfkTime === 0) return false;
                return player.NonAfkTime < 1;
            },
            severity: 'info'
        });
    }

    addRule(rule) {
        if (!rule.id || !rule.condition) {
            console.error('Regla inválida:', rule);
            throw new Error('Las reglas deben tener un id y una condición');
        }
        this.alertRules.push(rule);
        return this;
    }

    analyze(data) {
        if (!Array.isArray(data)) {
            console.error('Se esperaba un array para analizar:', data);
            return [];
        }

        const alerts = [];
        
        data.forEach(player => {
            this.alertRules.forEach(rule => {
                try {
                    if (rule.condition(player)) {
                        alerts.push({
                            playerId: player.PlayerUUID,
                            playerName: player.PlayerName,
                            ruleId: rule.id,
                            ruleName: rule.name,
                            severity: rule.severity,
                            details: {
                                afkTime: player.AfkTime,
                                activeTime: player.NonAfkTime,
                                totalTime: player.TotalTime
                            },
                            timestamp: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error(`Error evaluando regla ${rule.id}:`, error);
                }
            });
        });

        return alerts;
    }
}