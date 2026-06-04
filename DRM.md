# DRM — Documento de Requerimientos de Modificación
**Proyecto:** Clínica Médica General (CMG) — clinicamedicacmg.net
**Fecha:** 2026-06-04
**Fuente:** `Cambios a implementar en la pagina web.pdf`
**Repositorio:** https://github.com/ClinicaMedicaGeneral/Clinicamedicageneral.git (rama `main`)
**Auto-deploy:** Hostinger → GitHub (push a `main` despliega a producción)

---

## 1. Resumen ejecutivo

Este documento consolida los **12 cambios estéticos** y **11 cambios funcionales** solicitados por el cliente sobre la página web actual. Los cambios se aplican sobre el export del sitio (`CMG-Website-Export.zip`, descomprimido en `CMG-Website/`).

> **Importante:** Para el cambio **Estético #11** (Plan Familiar → Doctor 365) **NO** se debe tocar la lógica de cónyuge/dependientes — el sistema actual seguirá usándose en el futuro y hoy también funciona para el plan individual.

---

## 2. Cambios estéticos (UI / texto)

| # | Archivo | Cambio | Estado |
|---|---------|--------|--------|
| 1 | `Inicio.html` (hero) | Asegurar "y de tu familia" visible en el slogan principal | ✅ Ya presente |
| 2 | `Inicio.html` línea 88 | "Consulta médica, laboratorio y sueroterapias" → agregar "**y servicios médicos**" | Pendiente |
| 3 | `Inicio.html` línea 198 (sección Doctor 365) o `Sobre-nosotros.html` | Mismo agregado de "**y servicios médicos**" | Pendiente |
| 4 | `Inicio.html` banner promo "HOY EN CMG" | Servicio mostrado debe ser **aleatorio por sesión** (lavado de oído, extracción de uña, cauterización, etc.) | Pendiente |
| 5 | `Inicio.html` pilares | Agregar 4ta tarjeta **"Servicios"** (junto a Consultorio/Laboratorio/Sueroterapia) | Pendiente |
| 6 | `Cotizador.html` | Renombrar: **Dermatología → Cuidado de la piel**, **Ginecología → Cuidado de la mujer**, **Urología → Cuidado de las vías urinarias** | Pendiente |
| 7 | `Cotizador.html` (Retiro de puntos y similares por unidad) | Agregar la especificación "**(cada uno)**" | Pendiente |
| 8 | `Cotizador.html` → bloque "Cuidado de la piel" | Dejar solo 3 items: `Cauterización lunar/verruga L200`, `Cauterización de lesión grande L750`, `Cauterización en párpado L300` (sin "primera"). Borrar promoción y adicionales. | Pendiente |
| 9 | `Cotizacion-Sistema.html` línea 893 | `Notas adicionales` → **"Indicaciones especiales para la clínica"** | Pendiente |
| 10 | `Pruebas-Rapidas.html` | Reemplazar "**REACTIVO**" por "**POSITIVO**" en todos los resultados | Pendiente |
| 11 | `Doctor-365.html`, `Inicio.html` | "Plan Familiar Doctor 365" → **"Doctor 365"**. **No tocar** lógica de cónyuge/dependientes. | Pendiente |
| 12 | `Felicitaciones.html` línea 462 | "Ya formas parte de la familia Doctor 365" → "**Ya estás un paso más cerca de ser parte de la familia Doctor 365**" | Pendiente |

---

## 3. Cambios funcionales

### F1 · Cotización: eliminar "Válida hasta" y agregar disclaimers
- **Archivo:** `Cotizacion-Sistema.html`
- **Quitar:** input `Válida hasta` (línea 774) y la línea WhatsApp `📅 Válida hasta` (1476).
- **Agregar al pie del documento:**
  - "Cotización válida por 24 horas"
  - "Cotización sujeta a cambios"
  - "Precios pueden variar en los procedimientos"

### F2 · Médico tratante seleccionable + reglas Firestore
- **Archivos:** `Expediente-Doctor.html`, `firestore.rules`
- En los campos que pidan médico, dropdown con:
  - `Doctor Rojas` → `doctor_rojascmg@gmail.com`
  - `Doctor Hermes` → `doctor_hermescmg@gmail.com`
  - `Doctor Álvarez` → `doctor_alvarezcmg@gmail.com`
- `firestore.rules` → incluir los 3 correos en `isDoctor()` (autenticaciones se harán luego, pero permisos ya quedan listos).

### F3 · Todos los campos de la consulta obligatorios
- **Archivo:** `Expediente-Doctor.html`
- Marcar `required` en TODOS los campos del formulario de consulta y validar antes de guardar/imprimir.

### F4 · Nota en hojas de resultados
- **Archivos:** `Pruebas-Rapidas.html`, `Ver-Prueba.html`, `Examenes-Laboratorio.html` y plantillas similares
- Agregar al pie: **"Empresa receptora solicitar verificación primero"**

### F5 · Unificar expedientes duplicados
- **Archivo:** `Expediente-Doctor.html`
- Acción staff para fusionar dos expedientes (cuando se crea por error). Mostrar columnas A/B y permitir elegir el dato correcto campo por campo. Confirmar antes de unir.

### F6 · Pruebas con estado "pendiente de resultado" (CRÍTICO operativo)
- **Archivo:** `Pruebas-Rapidas.html`
- Las pruebas no son instantáneas. Permitir **guardar como pendiente**, cerrar la orden y reabrir luego para confirmar el resultado e imprimir. Estado: `pendiente_resultado` → `confirmado_resultado` → `impreso`.

### F7 · "Conjunto de exámenes" multi-select
- **Archivo:** `Examenes-Laboratorio.html` (línea 252)
- Convertir "Tipo de examen" en **lista de selección múltiple**.
- Al elegir >1, el nombre del examen pasa a ser `Conjunto: <lista separada por coma>`.

### F8 · Dividir Plan/Tratamiento en dos secciones
- **Archivo:** `Expediente-Doctor.html` (línea 2324)
- Reemplazar campo libre `Plan / Tratamiento` por:
  1. **Medicamentos aplicados en la visita** — multi-select con catálogo fijo
  2. **Medicamentos de Despacho** — multi-select con catálogo fijo
- Catálogo inicial (basado en imagen del PDF): `Bixicort`, `Alergil`, `Cetirizina`, `Alergil Tabletas`.

### F9 · "Pago Liquidado en Caja"
- **Archivos:** `Expediente-Doctor.html`, `Admin-D365.html` (o nuevo módulo Caja)
- Tras completar consulta/servicio/suero, el paciente pasa a estado **"Pendiente de caja"**.
- Usuario administrativo ve resumen: Medicamentos en consultorio / Medicamentos de despacho / Servicios brindados.
- Botón **"Pago Liquidado en Caja"** cierra el flujo.

### F10 · Sección "Cliente especial" (discapacidades)
- **Archivo:** `Expediente-Doctor.html`
- Nueva sección en el expediente:
  - Checkbox/texto: "¿Tiene discapacidad?" + detalle.
  - Subida de documento (PDF/imagen) al expediente (Firebase Storage).

### F11 · Flujo de incapacidad al completar consulta
- **Archivo:** `Expediente-Doctor.html`
- Al **Completar consulta**, preguntar: **"¿Necesita incapacidad?"**
  - **No** → avanza normalmente.
  - **Sí** → abre formulario de constancia (plantilla en `C:\Users\Ruben Wainwright\Downloads\FORMATO DE CONSTANCIA (NO CAMBIAR).pdf`).

---

## 4. Plan de despliegue

1. Implementar cambios en este orden:
   - Estéticos 1–12 (rápidos, bajo riesgo)
   - F1, F3, F4, F7 (texto/validación, bajo riesgo)
   - F2 (firestore.rules — requiere desplegar reglas en Firebase aparte)
   - F8, F10, F11 (refactor de formulario)
   - F5, F6, F9 (cambios de modelo de datos — mayor riesgo)
2. **Commit + push** con:
   ```powershell
   git config user.email "rubenwainwrightba@gmail.com"
   git config user.name "Ruben Wainwright"
   git add .
   git commit -m "feat: implementar lote de cambios DRM 2026-06"
   git push origin main
   ```
3. **Reglas Firestore** se despliegan vía `firebase deploy --only firestore:rules` (no se ejecutan en auto-deploy de Hostinger).
4. Verificar en `clinicamedicacmg.net` tras unos minutos.

---

## 5. Riesgos / pendientes

- **F2:** las autenticaciones de los nuevos correos no están listas; solo se preparan los permisos.
- **F5 / F9:** implican cambios de modelo de datos en Firestore — validar con datos reales antes de marcar como "completado".
- **F11:** requiere acceso al PDF `FORMATO DE CONSTANCIA (NO CAMBIAR).pdf` para replicar el layout exacto.
- El flujo de "Pago Liquidado en Caja" introduce un rol nuevo (caja/admin) — confirmar permisos.
