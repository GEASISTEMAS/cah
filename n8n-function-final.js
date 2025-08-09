// ===== CÓDIGO FINAL PARA NODO FUNCTION N8N =====
// Dashboard Barbería - Lovable Integration
// Procesa Google Sheets + Google Calendar

console.log('🚀 === INICIANDO PROCESAMIENTO COMPLETO ===');

// Obtener todos los inputs
const inputs = $input.all();
console.log(`📊 Total de inputs: ${inputs.length}`);

// Estructuras de datos
let sheetsData = [];
let calendarData = [];
let resultado = {};

// ===== FUNCIONES AUXILIARES =====

function detectarTipoDatos(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return 'unknown';
    
    const firstItem = data[0];
    if (!firstItem || typeof firstItem !== 'object') return 'unknown';
    
    // Detectar Google Sheets por nombres de columnas
    const sheetFields = ['ID', 'Estatus', 'Nombre', 'Servicio', 'Precio del Servicio', 'Día', 'Hora'];
    const hasSheetField = sheetFields.some(field => firstItem.hasOwnProperty(field));
    
    // Detectar Google Calendar
    const calendarFields = ['summary', 'start', 'end'];
    const hasCalendarField = calendarFields.some(field => firstItem.hasOwnProperty(field));
    
    if (hasSheetField) return 'sheets';
    if (hasCalendarField) return 'calendar';
    return 'unknown';
}

function procesarFecha(fechaRaw) {
    if (!fechaRaw) return null;
    
    const fechaStr = fechaRaw.toString().trim();
    
    // Ya en formato YYYY-MM-DD
    if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) return fechaStr;
    
    // Formato DD/MM/YYYY
    if (fechaStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [dia, mes, año] = fechaStr.split('/');
        return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    // Intentar parsear como fecha
    try {
        const fecha = new Date(fechaStr);
        if (!isNaN(fecha.getTime())) {
            return fecha.toISOString().split('T')[0];
        }
    } catch (e) {
        console.log('❌ Error procesando fecha:', fechaStr);
    }
    
    return null;
}

function procesarHora(horaRaw) {
    if (!horaRaw) return '00:00';
    
    const horaStr = horaRaw.toString().trim();
    
    // Formato HH:MM o HH:MM:SS
    if (horaStr.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        const partes = horaStr.split(':');
        return `${partes[0].padStart(2, '0')}:${partes[1]}`;
    }
    
    // Timestamp
    try {
        const fecha = new Date(horaRaw);
        if (!isNaN(fecha.getTime())) {
            return fecha.toLocaleTimeString('es-HN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }
    } catch (e) {
        // Ignorar error
    }
    
    return '00:00';
}

function procesarPrecio(precioRaw) {
    if (!precioRaw) return 0;
    
    const precioStr = precioRaw.toString().trim();
    // Remover "Lps" y otros caracteres, mantener solo números y puntos/comas
    const numeroStr = precioStr.replace(/[^\d.,]/g, '');
    return parseFloat(numeroStr.replace(',', '.')) || 0;
}

// ===== PROCESAR INPUTS =====

for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    console.log(`\n📋 Procesando input ${i + 1}...`);
    
    if (!input.json) {
        console.log(`⚠️ Input ${i + 1} sin datos JSON`);
        continue;
    }
    
    let data = input.json;
    
    // Convertir a array si es necesario
    if (!Array.isArray(data)) {
        if (typeof data === 'object' && data !== null) {
            const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
            if (arrayKeys.length > 0) {
                data = data[arrayKeys[0]];
            } else {
                data = [data];
            }
        } else {
            continue;
        }
    }
    
    const tipoDatos = detectarTipoDatos(data);
    console.log(`🔍 Tipo: ${tipoDatos} (${data.length} elementos)`);
    
    if (tipoDatos === 'sheets') {
        sheetsData = data;
    } else if (tipoDatos === 'calendar') {
        calendarData = data;
    }
}

console.log(`\n📊 Datos encontrados:`);
console.log(`- Google Sheets: ${sheetsData.length} registros`);
console.log(`- Google Calendar: ${calendarData.length} eventos`);

// ===== PROCESAR GOOGLE SHEETS =====
if (sheetsData.length > 0) {
    console.log('\n📝 Procesando Google Sheets...');
    
    sheetsData.forEach((registro, index) => {
        if (!registro) return;
        
        // Extraer campos con nombres exactos
        const nombre = registro['Nombre'] || 'Sin nombre';
        const servicio = registro['Servicio'] || 'Sin servicio';
        const precioRaw = registro['Precio del Servicio'] || '0';
        const estado = registro['Estatus'] || 'agendado';
        const fechaRaw = registro['Día'];
        const horaRaw = registro['Hora'];
        
        // Procesar fecha
        const fecha = procesarFecha(fechaRaw);
        if (!fecha) {
            console.log(`⚠️ Registro ${index} sin fecha válida: ${fechaRaw}`);
            return;
        }
        
        // Filtrar eliminados
        if (estado.toLowerCase() === 'eliminado') {
            console.log(`🗑️ Registro ${index} eliminado, omitiendo...`);
            return;
        }
        
        const hora = procesarHora(horaRaw);
        const precio = procesarPrecio(precioRaw);
        
        // Inicializar fecha si no existe
        if (!resultado[fecha]) {
            resultado[fecha] = {
                totalCitas: 0,
                totalIngresos: 0,
                citas: []
            };
        }
        
        // Agregar cita
        resultado[fecha].citas.push({
            id: `sheets-${index}`,
            cliente: nombre,
            servicio: servicio,
            hora: hora,
            precio: precio,
            estado: estado.toLowerCase(),
            source: 'sheets',
            telefono: registro['Numero Celular'] || ''
        });
        
        resultado[fecha].totalCitas += 1;
        resultado[fecha].totalIngresos += precio;
        
        console.log(`✅ Procesado: ${nombre} - ${fecha} ${hora} - $${precio}`);
    });
}

// ===== PROCESAR GOOGLE CALENDAR =====
if (calendarData.length > 0) {
    console.log('\n📅 Procesando Google Calendar...');
    
    calendarData.forEach((evento, index) => {
        if (!evento || !evento.summary) return;
        
        console.log(`\nEvento ${index}:`, {
            summary: evento.summary,
            description: evento.description,
            start: evento.start
        });
        
        // Extraer fecha
        const startDate = evento.start?.date || evento.start?.dateTime;
        if (!startDate) {
            console.log(`⚠️ Evento ${index} sin fecha`);
            return;
        }
        
        const fecha = startDate.split('T')[0];
        
        // Extraer hora
        let hora = '00:00';
        if (evento.start?.dateTime) {
            try {
                const dateObj = new Date(evento.start.dateTime);
                hora = dateObj.toLocaleTimeString('es-HN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            } catch (e) {
                console.log('❌ Error procesando hora del calendario:', e);
            }
        }
        
        // Inicializar fecha si no existe
        if (!resultado[fecha]) {
            resultado[fecha] = {
                totalCitas: 0,
                totalIngresos: 0,
                citas: []
            };
        }
        
        // Determinar cliente y servicio
        // Si hay description, usarla como cliente y summary como servicio
        // Si no hay description, summary es el cliente
        let cliente = evento.summary;
        let servicio = 'Servicio desde Calendar';
        
        if (evento.description && evento.description.trim()) {
            cliente = evento.description.trim();
            servicio = evento.summary;
        }
        
        // Agregar evento del calendar
        resultado[fecha].citas.push({
            id: `calendar-${index}`,
            cliente: cliente,
            servicio: servicio,
            hora: hora,
            precio: 0, // Calendar no tiene precios
            estado: 'agendado',
            source: 'calendar',
            telefono: ''
        });
        
        resultado[fecha].totalCitas += 1;
        
        console.log(`✅ Calendar: ${cliente} - ${fecha} ${hora}`);
    });
}

// ===== VALIDACIÓN Y RESULTADO FINAL =====
const totalFechas = Object.keys(resultado).length;
console.log(`\n📊 Resumen final: ${totalFechas} fechas procesadas`);

if (totalFechas === 0) {
    console.log('❌ Sin datos procesables');
    return [{
        json: {
            error: 'No se encontraron datos válidos',
            debug: {
                totalInputs: inputs.length,
                sheetsRecords: sheetsData.length,
                calendarEvents: calendarData.length,
                sheetsColumns: sheetsData.length > 0 ? Object.keys(sheetsData[0]) : [],
                calendarColumns: calendarData.length > 0 ? Object.keys(calendarData[0]) : []
            }
        }
    }];
}

// Ordenar fechas y mostrar resumen
const fechasOrdenadas = Object.keys(resultado).sort();
const resultadoOrdenado = {};

let totalCitasGlobal = 0;
let totalIngresosGlobal = 0;

fechasOrdenadas.forEach(fecha => {
    resultadoOrdenado[fecha] = resultado[fecha];
    totalCitasGlobal += resultado[fecha].totalCitas;
    totalIngresosGlobal += resultado[fecha].totalIngresos;
    
    console.log(`📅 ${fecha}: ${resultado[fecha].totalCitas} citas, $${resultado[fecha].totalIngresos.toFixed(2)}`);
});

console.log(`\n🎯 TOTALES GLOBALES:`);
console.log(`- Total citas: ${totalCitasGlobal}`);
console.log(`- Total ingresos: $${totalIngresosGlobal.toFixed(2)}`);
console.log(`- Fechas con citas: ${fechasOrdenadas.length}`);

console.log('\n✅ Procesamiento completado exitosamente');

// Retornar resultado final
return [{ json: resultadoOrdenado }];