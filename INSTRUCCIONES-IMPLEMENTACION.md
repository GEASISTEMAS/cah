# 🔧 Guía de Implementación - Webhook N8N para Dashboard Lovable

## 📋 Problema Identificado

El nodo "Procesar y Formatear Datos" en tu flujo de N8N no muestra información porque:
1. La lógica de procesamiento es muy compleja
2. No maneja correctamente los inputs múltiples
3. Falta validación de datos
4. No hay debugging visible

## 🚀 Solución Paso a Paso

### PASO 1: Probar el Webhook Actual

1. **Abre el archivo `webhook-test.html`** que se creó en tu workspace
2. **Ejecuta la página** en tu navegador
3. **Haz clic en "Probar Webhook"** para ver qué datos está devolviendo actualmente
4. **Analiza los resultados** para confirmar el problema

### PASO 2: Actualizar el Nodo Function en N8N

1. **Ve a tu flujo de N8N**
2. **Abre el nodo "Procesar y Formatear Datos"**
3. **BORRA todo el código actual**
4. **COPIA Y PEGA** el código del archivo `n8n-function-mejorado.js`
5. **Guarda los cambios**

### PASO 3: Verificar las Conexiones

Asegúrate de que las conexiones estén correctas:
```
Webhook1 → Leer Google Sheets1 → Procesar y Formatear Datos
Webhook1 → Obtener Eventos Calendar → Procesar y Formatear Datos
```

### PASO 4: Probar el Flujo Mejorado

1. **Ejecuta el webhook manualmente** desde N8N
2. **Revisa los logs** del nodo Function mejorado
3. **Confirma que los datos se procesan correctamente**

### PASO 5: Validar con la Herramienta de Test

1. **Regresa a `webhook-test.html`**
2. **Ejecuta el test completo**
3. **Verifica que ahora muestre los datos correctamente**
4. **Revisa el formato para Lovable**

## 📊 Formato de Datos Esperado

El webhook ahora devuelve datos en este formato:

```json
{
  "2024-12-19": {
    "totalCitas": 3,
    "totalIngresos": 150.00,
    "citas": [
      {
        "id": "sheets-0",
        "cliente": "Juan Pérez",
        "servicio": "Corte + Barba",
        "hora": "09:00",
        "precio": 50,
        "estado": "confirmado",
        "source": "sheets"
      }
    ]
  }
}
```

## 🎯 Integración con Lovable

### URL de Producción
```
https://n8n-easypanel-n8n.rnihuc.easypanel.host/webhook/dashboard/barberia
```

### Código para Lovable (React)

```javascript
// Función para obtener datos del webhook
const fetchBarberData = async () => {
  try {
    const response = await fetch('https://n8n-easypanel-n8n.rnihuc.easypanel.host/webhook/dashboard/barberia');
    const data = await response.json();
    
    // Procesar datos para el dashboard
    const processedData = {
      totalCitas: 0,
      totalIngresos: 0,
      citasPorFecha: data
    };
    
    // Calcular totales
    Object.values(data).forEach(fecha => {
      processedData.totalCitas += fecha.totalCitas;
      processedData.totalIngresos += fecha.totalIngresos;
    });
    
    return processedData;
  } catch (error) {
    console.error('Error fetching barber data:', error);
    return null;
  }
};

// Usar en tu componente
const [barberData, setBarberData] = useState(null);

useEffect(() => {
  fetchBarberData().then(setBarberData);
}, []);
```

## ✅ Checklist de Verificación

- [ ] Código del nodo Function actualizado
- [ ] Webhook probado con herramienta de test
- [ ] Datos se muestran correctamente
- [ ] Formato compatible con Lovable
- [ ] URL de producción copiada
- [ ] Integración en Lovable completada

## 🔧 Troubleshooting

### Si el webhook no responde:
1. Verifica que N8N esté ejecutándose
2. Confirma que el workflow esté activo
3. Revisa las credenciales de Google Sheets y Calendar

### Si los datos no se procesan:
1. Revisa los logs del nodo Function en N8N
2. Confirma que Google Sheets tenga datos
3. Verifica que Calendar tenga eventos

### Si Lovable no recibe datos:
1. Verifica CORS en N8N (allowedOrigins: "*")
2. Confirma que la URL sea correcta
3. Revisa la consola del navegador para errores

## 📞 Próximos Pasos

1. **Implementa el código mejorado** en N8N
2. **Prueba con la herramienta de test**
3. **Integra en tu dashboard de Lovable**
4. **Configura actualizaciones automáticas** (opcional)

¡Tu webhook estará listo para producción! 🎉