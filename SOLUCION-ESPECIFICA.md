# 🎯 Solución Específica - Datos Reales de Barbería

## 📊 Problemas Identificados con tus Datos

Basado en tu tabla de Google Sheets y el resultado actual del webhook, he identificado estos problemas:

### ❌ Problemas Actuales:
1. **Solo procesa Calendar, no Google Sheets** - Por eso solo ves 1 cita de Calendar
2. **Campos invertidos en Calendar** - Cliente y servicio están al revés
3. **No procesa precios** - Los precios de Sheets no se están extrayendo
4. **No filtra registros eliminados** - Debe ignorar estatus "eliminado"

### 📋 Tu Estructura de Datos Actual:
```
ID | Estatus | Nombre | Servicio | Precio del Servicio | Día | Hora | Numero Celular | Execution ID
```

## 🔧 Solución Implementada

### **PASO 1: Reemplazar el Código del Nodo Function**

1. Ve a tu flujo de N8N
2. Abre el nodo "Procesar y Formatear Datos"
3. **BORRA TODO** el código actual
4. **COPIA Y PEGA** el código del archivo `n8n-function-corregido.js`

### **PASO 2: Cambios Específicos Implementados**

#### ✅ Nombres de Columnas Correctos:
```javascript
// Antes (genérico):
const nombre = registro.Nombre || registro.Cliente || ...

// Ahora (específico para tu tabla):
const nombre = registro['Nombre'] || 'Sin nombre';
const servicio = registro['Servicio'] || 'Sin servicio';
const precioRaw = registro['Precio del Servicio'] || '0';
const estado = registro['Estatus'] || 'agendado';
const fechaRaw = registro['Día'];
const hora = procesarHora(registro['Hora']);
```

#### ✅ Procesamiento de Precios:
```javascript
function procesarPrecio(precioRaw) {
    // Convierte "250 Lps" → 250
    const numeroStr = precioRaw.replace(/[^\d.,]/g, '');
    return parseFloat(numeroStr.replace(',', '.')) || 0;
}
```

#### ✅ Filtro de Registros Eliminados:
```javascript
if (estado.toLowerCase() === 'eliminado') {
    console.log(`🗑️ Registro ${index} eliminado, saltando...`);
    return; // No procesar este registro
}
```

#### ✅ Corrección de Calendar:
```javascript
// Antes: cliente y servicio invertidos
cliente: evento.summary,
servicio: evento.description || 'Desde Calendar',

// Ahora: corregido
cliente: evento.description || evento.summary,
servicio: evento.summary,
```

## 📊 Resultado Esperado

Con los datos de tu tabla, deberías obtener algo así:

```json
{
  "2025-08-07": {
    "totalCitas": 1,
    "totalIngresos": 250,
    "citas": [
      {
        "id": "sheets-0",
        "cliente": "Aquiles Boy",
        "servicio": "Corte y barba de caballero",
        "hora": "22:26",
        "precio": 250,
        "estado": "agendado",
        "source": "sheets"
      }
    ]
  },
  "2025-08-08": {
    "totalCitas": 2,
    "totalIngresos": 370,
    "citas": [
      {
        "id": "sheets-1",
        "cliente": "Karim Benzema",
        "servicio": "Corte normal de niños",
        "hora": "11:00",
        "precio": 120,
        "estado": "agendado",
        "source": "sheets"
      },
      {
        "id": "sheets-2",
        "cliente": "Quique Alduvin",
        "servicio": "Corte y barba de caballero",
        "hora": "19:00",
        "precio": 250,
        "estado": "agendado",
        "source": "sheets"
      }
    ]
  },
  "2025-08-09": {
    "totalCitas": 2,
    "totalIngresos": 250,
    "citas": [
      {
        "id": "sheets-4",
        "cliente": "Quique Aldubín",
        "servicio": "Corte y barba de caballero",
        "hora": "10:00",
        "precio": 250,
        "estado": "agendado",
        "source": "sheets"
      },
      {
        "id": "calendar-0",
        "cliente": "Quique Aldubín",
        "servicio": "Corte y barba de caballero",
        "hora": "16:00",
        "precio": 0,
        "estado": "agendado",
        "source": "calendar"
      }
    ]
  }
}
```

## 🧪 Verificación

### **PASO 3: Probar la Solución**

1. **Abre `webhook-test.html`** en tu navegador
2. **Ejecuta "Probar Webhook"**
3. **Revisa si ahora muestra todos los registros**
4. **Ejecuta "Analizar Estructura"** para ver detalles
5. **Ejecuta "Test Completo"** para validación final

### **PASO 4: Troubleshooting**

Si aún no funciona, revisa en N8N:

1. **Logs del nodo Function** - Busca mensajes de error
2. **Datos de entrada** - Verifica que Google Sheets esté enviando datos
3. **Conexiones** - Confirma que ambos nodos (Sheets y Calendar) lleguen al Function

### **PASO 5: Debugging**

El código incluye logging detallado. En N8N verás:
```
=== INICIANDO PROCESAMIENTO DE DATOS CORREGIDO ===
📊 Total de inputs recibidos: 2
📋 Procesando input 1...
Propiedades del primer elemento: ID,Estatus,Nombre,Servicio,Precio del Servicio,Día,Hora,Numero Celular,Execution ID
🔍 Tipo detectado: sheets (5 elementos)
📝 Procesando Google Sheets...
Procesando precio: 250 Lps
Precio procesado: 250
✅ Procesado: Aquiles Boy - 2025-08-07 22:26 - $250
```

## 🎯 Integración con Lovable

Una vez que funcione, usa esta URL en tu dashboard:
```
https://n8n-easypanel-n8n.rnihuc.easypanel.host/webhook/dashboard/barberia
```

### Código React para Lovable:
```javascript
const [barberData, setBarberData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('https://n8n-easypanel-n8n.rnihuc.easypanel.host/webhook/dashboard/barberia');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setBarberData(data);
        setError(null);
      }
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
  
  // Actualizar cada 5 minutos
  const interval = setInterval(fetchData, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);

// Calcular totales
const totals = useMemo(() => {
  if (!barberData) return { citas: 0, ingresos: 0 };
  
  return Object.values(barberData).reduce((acc, fecha) => ({
    citas: acc.citas + fecha.totalCitas,
    ingresos: acc.ingresos + fecha.totalIngresos
  }), { citas: 0, ingresos: 0 });
}, [barberData]);
```

## ✅ Checklist Final

- [ ] Código del nodo Function actualizado con `n8n-function-corregido.js`
- [ ] Webhook probado con `webhook-test.html`
- [ ] Todos los registros de Sheets aparecen (excepto eliminados)
- [ ] Precios se calculan correctamente
- [ ] Calendar funciona sin campos invertidos
- [ ] URL lista para usar en Lovable

¡Con estos cambios tu webhook debería procesar correctamente todos los datos! 🎉