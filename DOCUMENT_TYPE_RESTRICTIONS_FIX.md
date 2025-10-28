# Fix: Restricciones por Tipo de Documento

## Objetivo
Establecer claramente que solo EPUBs y PDFs son para lectura colaborativa asíncrona, mientras que las Biblias XML/JSON solo se pueden compartir (no leer colaborativamente).

## Cambios Implementados

### ✅ **1. Botón "Leer Juntos" Condicional**

#### **Antes**
```typescript
// Todos los documentos tenían el botón de lectura colaborativa
<Button onClick={() => window.open(`/collaborative-reader/${doc.id}`)}>
  <Users className="h-4 w-4" />
</Button>
```

#### **Después**
```typescript
// Solo EPUBs y PDFs tienen el botón de lectura colaborativa
{(doc.file_type === 'epub' || doc.file_type === 'pdf') && (
  <Button 
    onClick={() => window.open(`/collaborative-reader/${doc.id}`)}
    title="Leer Juntos (Colaborativo)"
  >
    <Users className="h-4 w-4" />
  </Button>
)}
```

### ✅ **2. Botón "Crear Sesión" Inteligente**

#### **Antes**
```typescript
// Aparecía siempre, incluso sin documentos colaborativos
<Button onClick={() => createSession()}>
  Crear Sesión de Lectura Colaborativa
</Button>
```

#### **Después**
```typescript
// Solo aparece si hay EPUBs o PDFs
{userDocuments.some(doc => doc.file_type === 'epub' || doc.file_type === 'pdf') && (
  <Button onClick={() => createCollaborativeSession()}>
    Crear Sesión de Lectura Colaborativa
  </Button>
)}
```

### ✅ **3. Indicadores Visuales por Tipo**

#### **Biblias XML/JSON**
```
📖 Mi Biblia RVR60 (UPLOADED)
├── 📖 En Lector        ← Solo disponible en lector de Biblias
├── 📤 Compartir        ← Compartir con otros usuarios
└── 🗑️ Eliminar
```

#### **EPUBs y PDFs**
```
📚 Mi Devocional (EPUB)
├── 👥 Colaborativo     ← Nuevo indicador
├── 👥 Leer Juntos      ← Lectura colaborativa en tiempo real
├── 📤 Compartir        ← Compartir con otros usuarios
└── 🗑️ Eliminar
```

### ✅ **4. Validación en Lector Colaborativo**

```typescript
const loadDocument = async () => {
  const doc = await documentAPI.getById(documentId!);
  
  // Validar tipo de documento
  if (doc.file_type !== 'epub' && doc.file_type !== 'pdf') {
    toast.error('Este tipo de documento no soporta lectura colaborativa. Solo EPUBs y PDFs.');
    navigate('/bible');
    return;
  }
  
  // Contenido específico por tipo
  if (doc.file_type === 'epub') {
    setContent(generateEpubContent());
  } else if (doc.file_type === 'pdf') {
    setContent(generatePdfContent());
  }
};
```

### ✅ **5. Tooltips Descriptivos**

```typescript
// Botón colaborativo
title="Leer Juntos (Colaborativo)"

// Botón compartir
title={doc.is_bible ? "Compartir Biblia" : "Compartir Documento"}
```

## Tipos de Documento y Sus Capacidades

### 📖 **Biblias (XML/JSON)**
- ✅ **Lectura individual** en el lector de Biblias
- ✅ **Compartir** con otros usuarios
- ✅ **Resaltados personales**
- ✅ **Búsqueda de versículos**
- ❌ **Lectura colaborativa** (no disponible)

### 📚 **EPUBs**
- ✅ **Lectura individual**
- ✅ **Compartir** con otros usuarios
- ✅ **Lectura colaborativa** en tiempo real
- ✅ **Comentarios colaborativos**
- ✅ **Resaltados compartidos**
- ✅ **Reacciones con emojis**
- ✅ **Comentarios de audio**

### 📄 **PDFs**
- ✅ **Lectura individual**
- ✅ **Compartir** con otros usuarios
- ✅ **Lectura colaborativa** en tiempo real
- ✅ **Comentarios colaborativos**
- ✅ **Resaltados compartidos**
- ✅ **Reacciones con emojis**
- ✅ **Comentarios de audio**

### 📝 **TXT**
- ✅ **Lectura individual**
- ✅ **Compartir** con otros usuarios
- ❌ **Lectura colaborativa** (no disponible)

## Experiencia de Usuario

### 📖 **Usuario con Solo Biblias**
```
Mi Biblioteca
├── 📖 Biblia RVR60 (XML)     [👁️] [📤] [🗑️]
├── 📖 Biblia NVI (JSON)      [👁️] [📤] [🗑️]
└── Sin botón "Crear Sesión Colaborativa"
```

### 📚 **Usuario con EPUBs/PDFs**
```
Mi Biblioteca
├── 📚 Devocional (EPUB)      [👁️] [👥] [📤] [🗑️]
├── 📄 Estudio (PDF)          [👁️] [👥] [📤] [🗑️]
└── [👥 Crear Sesión de Lectura Colaborativa]
```

### 📖📚 **Usuario Mixto**
```
Mi Biblioteca
├── 📖 Biblia RVR60 (XML)     [👁️] [📤] [🗑️]      ← Solo compartir
├── 📚 Devocional (EPUB)      [👁️] [👥] [📤] [🗑️]  ← Colaborativo
├── 📄 Estudio (PDF)          [👁️] [👥] [📤] [🗑️]  ← Colaborativo
└── [👥 Crear Sesión de Lectura Colaborativa]
```

## Casos de Uso Clarificados

### ✅ **Lectura Colaborativa (EPUBs/PDFs)**
```
Escenario: Estudio grupal con devocional EPUB
1. Usuario sube devocional EPUB
2. Ve botón "👥 Leer Juntos"
3. Crea sesión colaborativa
4. Invita participantes
5. Leen juntos con comentarios en tiempo real
```

### ✅ **Compartir Biblia (XML/JSON)**
```
Escenario: Compartir Biblia personal
1. Usuario sube Biblia XML
2. Ve botón "📤 Compartir"
3. Comparte con amigo por email
4. Amigo puede usar la Biblia en su lector personal
5. Cada uno lee individualmente (no colaborativo)
```

## Mensajes de Error

### ❌ **Intento de Lectura Colaborativa con Biblia**
```
"Este tipo de documento no soporta lectura colaborativa. Solo EPUBs y PDFs."
→ Redirige automáticamente a Mi Biblioteca
```

### ℹ️ **Sin Documentos Colaborativos**
```
"Sube un EPUB o PDF para crear una sesión colaborativa"
→ Botón no aparece hasta que haya documentos válidos
```

## Archivos Modificados

### 🔧 **src/pages/Bible.tsx**
- **Botón colaborativo condicional**: Solo para EPUBs y PDFs
- **Indicadores visuales**: "👥 Colaborativo" para documentos válidos
- **Botón crear sesión**: Solo aparece con documentos válidos
- **Tooltips descriptivos**: Clarifica la función de cada botón

### 🔧 **src/pages/CollaborativeReader.tsx**
- **Validación de tipo**: Rechaza documentos no colaborativos
- **Contenido específico**: Diferente para EPUB vs PDF
- **Redirección automática**: Vuelve a biblioteca si tipo inválido

## Resultado Final

### ✅ **Claridad de Funcionalidad**
```
❌ Antes: Confusión sobre qué documentos son colaborativos
✅ Ahora: Clara distinción visual y funcional por tipo
```

### ✅ **Experiencia Intuitiva**
```
❌ Antes: Botones que no funcionan para ciertos tipos
✅ Ahora: Solo botones relevantes para cada tipo de documento
```

### ✅ **Prevención de Errores**
```
❌ Antes: Usuarios intentando colaborar con Biblias
✅ Ahora: Validación automática y mensajes claros
```

Ahora la distinción entre documentos colaborativos (EPUBs/PDFs) y Biblias compartibles (XML/JSON) es clara y funcional. 📖📚✨