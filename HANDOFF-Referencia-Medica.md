# Handoff: Referencia Médica (Especialista / Emergencia)

Construido primero en Ancla (`R3ads/web/portal-clinico/`) el 2026-09-26, a
pedido de los doctores de CMG — reemplaza las referencias hechas a mano
(hoja con membrete + firma) por un documento formal, con el mismo patrón
que ya usa "Constancia Médica" en este mismo repo.

Pendiente: portar esto mismo a `CMG-Website/`. Esta nota es la guía para
hacerlo en la sesión de CMG, sin tener que releer todo Ancla.

## Qué es

Un tercer tipo de documento clínico (junto a Constancia Médica y
Resultado-EKG): el médico elige un **dropdown Tipo: Especialista |
Emergencia**, llena historia/examen/diagnóstico/tratamiento, y se genera un
documento HTML imprimible (A4), igual de formal que la Constancia.

Disponible desde **3 lugares**, calcado de dónde ya se emite Constancia:
1. **Formulario de Consulta** (al finalizar) — toggle embebido "¿Necesita
   referencia?" No/Sí, igual que el de incapacidad.
2. **Caja** — botón "Emitir referencia" en la tarjeta de cada registro
   pendiente de caja (junto al de "Emitir constancia").
3. **Historial** — botón "Emitir referencia" en cada consulta pasada. A
   diferencia de Constancia (que en Historial solo se *ve*, no se crea),
   Referencia sí se puede **crear** desde ahí — el médico puede decidir
   referir revisando el historial días después.

## Campos del documento

Tipo (Especialista/Emergencia) · Destino (hospital/especialidad) ·
Antecedentes patológicos personales · Historia de la enfermedad actual
(motivo) · Examen físico/hallazgos · Signos vitales (PA/FC/FR/Temp) ·
Impresión diagnóstica/sospecha · Tratamiento ya iniciado · Recomendación.
Automático: número (`REF-YYYYMMDD-####`), fecha, médico que emite.

## Archivos y funciones en Ancla (referencia de implementación)

- **`Referencia-Medica.html`** (nuevo) — calcado 1:1 de
  `Constancia-Medica.html`: mismo layout de hoja A4, mismo patrón de
  `?id=` + auth guard + `r3adsModulos.exigir(...)`. Solo cambia el set de
  campos y que el título/badge cambian según `tipo`.
- **`Expediente-Doctor.html`** — todo lo agregado vive cerca de las
  funciones equivalentes de Constancia/Incapacidad:
  - `buildReferenciaSectionHtml(prefix)` / `buildReferenciaCamposHtml(prefix)`
    / `wireReferenciaToggle(prefix)` / `collectReferenciaData(prefix,
    faltantes, necesitaSiempre)` — mismo patrón que
    `buildIncapSectionHtml`/`wireIncapToggle`/`collectIncapData`, justo
    después de esas en el archivo.
  - `prepararReferencia(consultaId, paciente, datosReferencia, emitidaPor)`
    — mismo patrón que `prepararConstancia`, justo después de ella.
  - `abrirEmitirReferenciaModal(consultaId, pacienteInfo, onDone)` — modal
    independiente para Caja/Historial (Consulta usa el toggle embebido en
    vez de este modal), ubicado justo después de
    `abrirEmitirConstanciaCajaModal`.
  - Wiring en `guardarConsulta()` (la función que finaliza una consulta):
    junto a `collectIncapData('cons', ...)` / `prepararConstancia(...)` se
    agregó `collectReferenciaData('cons', ...)` / `prepararReferencia(...)`,
    incluido en el mismo `batch` y con su propio `window.open`.
  - Wiring en la tarjeta de Caja (dentro de `renderCajaTab`): botón
    `data-caja-referencia` junto al `data-caja-constancia` existente.
  - Wiring en Historial (`renderHistorialItemConsulta` +
    `renderHistorialUnificado`): botón `data-emitir-referencia` junto al
    link de "Ver constancia".

## Colección Firestore

`referencias/{id}` — incluye `consultaId`, `codigoPaciente`, datos del
paciente (nombre/tipoId/DNI/fechaNacimiento/edad), `tipo`, `destino`,
`antecedentes`, `motivo`, `examenFisico`, `signosVitales` (objeto
`{pa,fc,fr,temp}`), `diagnostico`, `tratamiento`, `recomendacion`,
`emitidaPor`, `emitidaPorEmail`, `emitidaEn`, `createdAt`, `numero`.
En Ancla además lleva `clinicId` (ver abajo, no aplica en CMG).

En la consulta (`consultas/{id}`) se agregan dos campos:
`tieneReferencia` (bool) y `referenciaId` (string|null) — mismo patrón que
`tieneConstancia`/`constanciaId`.

## Ajustes al portar a CMG (single-tenant, sin clinicId)

1. **Quitar `clinicId`** de `prepararReferencia()` y de todos los objetos
   `data` — CMG no tiene ese campo en ninguna colección.
2. **`Referencia-Medica.html`**: quitar `r3adsStaff.resolveClinicId(...)` /
   `CLINIC_ID` / `r3adsModulos.exigir(...)` (CMG no tiene módulos por
   clínica) — el auth guard de CMG es el mismo que ya usa
   `Constancia-Medica.html` en este repo (revisarlo ahí y copiar ese
   bloque, no el de Ancla).
3. **`firestore.rules` de CMG**: agregar un bloque `match
   /referencias/{id}` calcado del bloque `match /constancias/{id}` que ya
   existe en `CMG-Website/firestore.rules` (usa `isDoctor()`/`isCaja()`
   sin parámetro de clínica, con las listas de correos hardcodeadas — NO
   usar el estilo de Ancla con `clinicId`).
4. **`Expediente-Doctor.html` de CMG**: mismo texto de las funciones
   nuevas de Ancla, pero:
   - `prepararReferencia`: quitar `clinicId: CLINIC_ID,`.
   - `abrirEmitirReferenciaModal` y el wiring de Caja/Historial: cambiar
     `esMedicoTratanteClient()` por el chequeo de doctor que ya use la
     copia de CMG (probablemente una función sin parámetro, o la
     constante `DOCTOR_EMAILS` — revisar cómo está resuelto ahí para
     `abrirEmitirConstanciaCajaModal`, que es idéntica en estructura, y
     copiar ese mismo criterio).
   - Todo lo demás (HTML de los campos, ids, nombres de función) es
     copiable literal.
5. **Storage**: esta feature no sube archivos a Storage (es HTML puro,
   igual que Constancia), así que no toca `storage.rules`.

## Qué NO se portó (fuera de alcance, ver conversación de Ancla)

- No se integró en el flujo de "Completar servicio" (prefix `serv`/
  `servfin`) — solo en Consulta, Caja e Historial, que fue lo pedido
  explícitamente.
- No se probó el flujo interactivo end-to-end con datos reales (se
  verificó solo que el código carga sin errores de consola y que el
  documento renderiza bien con datos de prueba) — probarlo con un
  paciente real antes de dar por cerrado el port a CMG también.
