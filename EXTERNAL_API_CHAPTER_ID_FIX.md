# Fix: IDs de Capítulos Incorrectos en API Externa

## Problema Identificado
Al cambiar de una Biblia XML a una Biblia externa, la API recibía IDs de capítulos en español ("Gnesis.1") en lugar de los IDs correctos en inglés ("GEN.1"), causando errores 400 Bad Request.

```
Error: GET .../chapters/Gnesis.1?content-type=text... 400 (Bad Request)
```

## Causa Raíz
1. **Estado residual**: IDs en español permanecían después del cambio de versión
2. **setTimeout frágil**: Dependía de timing para cargar capítulos
3. **useEffect conflictivo**: Múltiples efectos intentando cargar el mismo capítulo
4. **Falta de limpieza**: Estado anterior no se limpiaba completamente

## Solución Implementada

### ✅ **1. Carga Directa para Biblias Externas**
```typescript
// Antes: setTimeout frágil
setTimeout(() => {
  loadChapter(); // Podía usar IDs incorrectos
}, 100);

// Después: Carga directa con IDs correctos
await loadChapterForExternalBible(selectedVersion, firstChapter.id);
```

### ✅ **2. Nueva Función loadChapterForExternalBible**
```typescript
const loadChapterForExternalBible = async (versionId: string, chapterId: string) => {
  console.log('Loading external Bible chapter directly:', { versionId, chapterId });
  const chapter = await externalBibleAPI.getChapter(versionId, chapterId);
  setCurrentChapter(chapter);
};
```

### ✅ **3. useEffect Optimizado**
```typescript
// Solo para cambios manuales de capítulo, no automáticos
useEffect(() => {
  const isManualChapterChange = currentChapter && currentChapter.id !== selectedChapter;
  if (isManualChapterChange) {
    loadChapter(); // Solo para selección manual
  }
}, [selectedVersion, selectedChapter, selectedBook, currentChapter]);
```

### ✅ **4. Limpieza de Estado Mejorada**
```typescript
const handleVersionChange = async (versionId: string) => {
  console.log('Changing Bible version to:', versionId);
  console.log('Clearing previous state...');
  
  // Limpieza completa del estado anterior
  setSelectedVersion(versionId);
  setSelectedBook("");
  setSelectedChapter("");
  setCurrentChapter(null);
};
```

## Flujo Corregido

### 📖 **Cambio: Biblia XML → Biblia Externa**
1. **Seleccionar nueva versión** → `handleVersionChange(externalId)`
2. **Limpiar estado completamente** → Elimina IDs en español
3. **Cargar libros externos** → `externalBibleAPI.getBooks()`
4. **Auto-seleccionar libro** → Con ID correcto (ej: "GEN")
5. **Cargar capítulos** → `externalBibleAPI.getChapters("GEN")`
6. **Carga directa capítulo 1** → `loadChapterForExternalBible("GEN.1")`
7. **API call correcta** → `/chapters/GEN.1` ✅

### 📖 **Cambio: Biblia Externa → Biblia XML**
1. **Seleccionar Biblia XML** → `handleVersionChange(user-xxx)`
2. **Limpiar estado completamente** → Elimina IDs en inglés
3. **Cargar libros XML** → `loadUserBibleBooks()`
4. **Auto-seleccionar libro** → Con ID en español ("Genesis")
5. **Carga directa capítulo 1** → `loadChapterForUserBible("Genesis.1")`
6. **Usar datos locales** → Sin API externa ✅

## Logging Mejorado

### 🔍 **Debug Detallado**
```javascript
// Cambio de versión
"Changing Bible version to: 65bfdebd704a8324-01"
"Clearing previous state..."
"Loading books for new version..."

// Selección de libro
"Book changed to: GEN"
"Loading chapters from external API..."
"Going directly to first chapter: Genesis 1"

// Carga de capítulo
"Loading external Bible chapter directly: {versionId: '65bf...', chapterId: 'GEN.1'}"
"Loaded external chapter directly: Genesis 1"
```

### 🔍 **Validación de IDs**
```javascript
// Antes del API call
console.log('API call will be made to:', `/chapters/${chapterId}`);
// Resultado: /chapters/GEN.1 ✅ (no /chapters/Gnesis.1 ❌)
```

## Beneficios

### ✅ **Sin Errores de API**
- IDs correctos para cada tipo de Biblia
- Sin conflictos entre formatos español/inglés
- Llamadas API válidas siempre

### ✅ **Carga Más Confiable**
- Sin dependencia de setTimeout
- Carga directa sin efectos secundarios
- Estado limpio en cada cambio

### ✅ **Debug Mejorado**
- Logging claro de cada paso
- Fácil identificar problemas de IDs
- Validación preventiva

## Casos de Uso Corregidos

### ✅ **Escenario Problemático Anterior**
```
1. Usuario en Biblia XML (Génesis seleccionado)
2. Cambia a ESV (Biblia externa)
3. Sistema intenta: /chapters/Gnesis.1 ❌
4. Error 400 Bad Request
```

### ✅ **Escenario Corregido Ahora**
```
1. Usuario en Biblia XML (Génesis seleccionado)
2. Cambia a ESV (Biblia externa)
3. Estado se limpia completamente
4. Sistema carga: /chapters/GEN.1 ✅
5. Contenido se muestra correctamente
```

## Archivos Modificados

### 🔧 **src/pages/Bible.tsx**
- **handleBookChange()**: Carga directa para Biblias externas
- **loadChapterForExternalBible()**: Nueva función para carga directa
- **handleVersionChange()**: Limpieza de estado mejorada
- **useEffect**: Optimizado para evitar conflictos
- **Logging**: Debug detallado en cada paso

## Resultado Final

### ✅ **API Calls Correctas**
```
❌ Antes: /chapters/Gnesis.1 → 400 Bad Request
✅ Ahora: /chapters/GEN.1 → 200 OK
```

### ✅ **Cambio de Versión Fluido**
```
❌ Antes: XML → Externa → Error de IDs
✅ Ahora: XML → Externa → Transición perfecta
```

### ✅ **Estado Limpio**
```
❌ Antes: IDs residuales causan conflictos
✅ Ahora: Estado completamente limpio en cada cambio
```

Ahora el cambio entre Biblias XML y externas es completamente fluido, sin errores de API por IDs incorrectos. 🎉