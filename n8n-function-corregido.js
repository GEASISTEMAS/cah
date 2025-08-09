// ===== NODO FUNCTION CORREGIDO PARA N8N =====
// Versión actualizada para procesar correctamente los datos de Google Sheets

console.log('=== INICIANDO PROCESAMIENTO DE DATOS CORREGIDO ===');

// Obtener todos los inputs
const inputs = $input.all();
console.log(`📊 Total de inputs recibidos: ${inputs.length}`);

// Inicializar estructuras de datos
let sheetsData = [];
let calendarData = [];
let resultado = {};

// ===== FUNCIÓN PARA DETECTAR TIPO DE DATOS =====
function detectarTipoDatos(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return 'unknown';
    }
    
    const firstItem = data[0];
    if (!firstItem || typeof firstItem !== 'object') {
        return 'unknown';
    }
    
    console.log('Propiedades del primer elemento:', Object.keys(firstItem));
    
    // Detectar Google Sheets - usar los nombres exactos de las columnas
    const sheetFields = ['ID', 'Estatus', 'Nombre', 'Servicio', 'Precio del Servicio', 'Día', 'Hora', 'Numero Celular'];
    const hasSheetField = sheetFields.some(field => firstItem.hasOwnProperty(field));
    
    // Detectar Google Calendar
    const calendarFields = ['summary', 'start', 'end', 'description'];
    const hasCalendarField = calendarFields.some(field => firstItem.hasOwnProperty(field));
    
    if (hasSheetField) return 'sheets';
    if (hasCalendarField) return 'calendar';
    
    return 'unknown';
}

// ===== FUNCIÓN PARA PROCESAR FECHA =====
function procesarFecha(fechaRaw) {
    if (!fechaRaw) return null;
    
    const fechaStr = fechaRaw.toString().trim();
    console.log('Procesando fecha:', fechaStr);
    
    // Si ya está en formato YYYY-MM-DD
    if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return fechaStr;
    }
    
    // Si está en formato DD/MM/YYYY
    if (fechaStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const partes = fechaStr.split('/');
        const dia = partes[0].padStart(2, '0');
        const mes = partes[1].padStart(2, '0');
        const año = partes[2];
        return `${año}-${mes}-${dia}`;
    }
    
    // Intentar parsear como fecha
    try {
        const fecha = new Date(fechaStr);
        if (!isNaN(fecha.getTime())) {
            return fecha.toISOString().split('T')[0];
        }
    } catch (e) {
        console.log('Error procesando fecha:', e);
    }
    
    return null;
}

// ===== FUNCIÓN PARA PROCESAR HORA =====
function procesarHora(horaRaw) {
    if (!horaRaw) return '00:00';
    
    const horaStr = horaRaw.toString().trim();
    console.log('Procesando hora:', horaStr);
    
    // Si ya está en formato HH:MM o HH:MM:SS
    if (horaStr.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        const partes = horaStr.split(':');
        return `${partes[0].padStart(2, '0')}:${partes[1]}`;
    }
    
    // Si es un timestamp
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
        console.log('Error procesando hora:', e);
    }
    
    return '00:00';
}

// ===== FUNCIÓN PARA PROCESAR PRECIO =====
function procesarPrecio(precioRaw) {
    if (!precioRaw) return 0;
    
    const precioStr = precioRaw.toString().trim();
    console.log('Procesando precio:', precioStr);
    
    // Remover texto como "Lps" y extraer solo números
    const numeroStr = precioStr.replace(/[^\d.,]/g, '');
    const precio = parseFloat(numeroStr.replace(',', '.')) || 0;
    
    console.log('Precio procesado:', precio);
    return precio;
}

// ===== PROCESAR CADA INPUT =====
for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    console.log(`\n📋 Procesando input ${i + 1}...`);
    
    if (!input.json) {
        console.log(`⚠️ Input ${i + 1} no tiene datos JSON`);
        continue;
    }
    
    let data = input.json;
    
    // Si el json no es array, convertirlo
    if (!Array.isArray(data)) {
        if (typeof data === 'object' && data !== null) {
            // Buscar arrays dentro del objeto
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
    console.log(`🔍 Tipo detectado: ${tipoDatos} (${data.length} elementos)`);
    
    if (tipoDatos === 'sheets') {
        sheetsData = data;
    } else if (tipoDatos === 'calendar') {
        calendarData = data;
    }
}

console.log(`\n📊 Datos finales:`);
console.log(`- Google Sheets: ${sheetsData.length} registros`);
console.log(`- Google Calendar: ${calendarData.length} eventos`);

// ===== PROCESAR DATOS DE GOOGLE SHEETS =====
if (sheetsData.length > 0) {
    console.log('\n📝 Procesando Google Sheets...');
    
    sheetsData.forEach((registro, index) => {
        if (!registro) return;
        
        console.log(`\nRegistro ${index}:`, JSON.stringify(registro, null, 2));
        
        // Extraer campos usando los nombres exactos de las columnas
        const nombre = registro['Nombre'] || 'Sin nombre';
        const servicio = registro['Servicio'] || 'Sin servicio';
        const precioRaw = registro['Precio del Servicio'] || '0';
        const estado = registro['Estatus'] || 'agendado';
        
        // Procesar fecha usando el nombre exacto de la columna
        const fechaRaw = registro['Día'];
        const fecha = procesarFecha(fechaRaw);
        
        if (!fecha) {
            console.log(`⚠️ Registro ${index} sin fecha válida:`, fechaRaw);
            return;
        }
        
        // Procesar hora
        const hora = procesarHora(registro['Hora']);
        
        // Procesar precio
        const precio = procesarPrecio(precioRaw);
        
        // Filtrar registros eliminados
        if (estado.toLowerCase() === 'eliminado') {
            console.log(`🗑️ Registro ${index} eliminado, saltando...`);
            return;
        }
        
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
            cliente: nombre.toString(),
            servicio: servicio.toString(),
            hora: hora,
            precio: precio,
            estado: estado.toString().toLowerCase(),
            source: 'sheets'
        });
        
        resultado[fecha].totalCitas += 1;
        resultado[fecha].totalIngresos += precio;
        
        console.log(`✅ Procesado: ${nombre} - ${fecha} ${hora} - $${precio}`);
    });
}

// ===== PROCESAR DATOS DE GOOGLE CALENDAR =====
if (calendarData.length > 0) {
    console.log('\n📅 Procesando Google Calendar...');
    
    calendarData.forEach((evento, index) => {
        if (!evento || !evento.summary) return;
        
        console.log(`\nEvento ${index}:`, JSON.stringify(evento, null, 2));
        
        // Extraer fecha
        const startDate = evento.start?.date || evento.start?.dateTime;
        if (!startDate) {
            console.log(`⚠️ Evento ${index} sin fecha de inicio`);
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
                console.log('Error procesando hora del calendario:', e);
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
        
        // CORREGIR: El summary debería ser el cliente, no el servicio
        // La descripción debería ser el servicio, no el cliente
        resultado[fecha].citas.push({
            id: `calendar-${index}`,
            cliente: evento.description || evento.summary, // Usar description como cliente
            servicio: evento.summary, // Usar summary como servicio
            hora: hora,
            precio: 0,
            estado: 'agendado',
            source: 'calendar'
        });
        
        resultado[fecha].totalCitas += 1;
        
        console.log(`✅ Procesado: ${evento.description || evento.summary} - ${fecha} ${hora}`);
    });
}

// ===== VALIDAR RESULTADO =====
const totalFechas = Object.keys(resultado).length;
console.log(`\n📊 Resumen final:`);
console.log(`- Fechas procesadas: ${totalFechas}`);

if (totalFechas === 0) {
    console.log('❌ No se procesaron datos');
    return [{
        json: {
            error: 'No se encontraron datos válidos para procesar',
            debug: {
                totalInputs: inputs.length,
                sheetsRecords: sheetsData.length,
                calendarEvents: calendarData.length,
                mensaje: 'Revisa que los datos de Google Sheets y Calendar estén llegando correctamente',
                sheetsColumns: sheetsData.length > 0 ? Object.keys(sheetsData[0]) : [],
                calendarColumns: calendarData.length > 0 ? Object.keys(calendarData[0]) : []
            }
        }
    }];
}

// Ordenar fechas
const fechasOrdenadas = Object.keys(resultado).sort();
const resultadoOrdenado = {};
fechasOrdenadas.forEach(fecha => {
    resultadoOrdenado[fecha] = resultado[fecha];
    console.log(`📅 ${fecha}: ${resultado[fecha].totalCitas} citas, $${resultado[fecha].totalIngresos.toFixed(2)}`);
});

console.log('\n✅ Procesamiento completado exitosamente');
console.log('Resultado final:', JSON.stringify(resultadoOrdenado, null, 2));

// Retornar resultado
return [{ json: resultadoOrdenado }];