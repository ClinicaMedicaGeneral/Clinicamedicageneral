/* ================================================================
   cmg-catalogos.js — Catálogos base de CMG (personal, proveedores,
   medicamentos).

   Estas listas estaban escritas a mano dentro de Expediente-Doctor.html
   (PERSONAL_ATIENDE, los <option> de "Proveedor (laboratorio)" y
   MEDS_VISITA_CATS / MEDS_DESPACHO_CATS). Ahora viven acá por dos razones:

   1. Expediente-Doctor.html las usa como RESPALDO: si la colección de
      Firestore correspondiente está vacía (nadie la ha configurado todavía),
      el portal sigue mostrando exactamente lo mismo que mostraba antes. En
      cuanto la colección tiene al menos un documento, manda Firestore y
      estas listas dejan de usarse.
   2. Personal.html / Proveedores.html / Medicamentos.html las usan para el
      botón "Importar la lista actual", que copia este catálogo a Firestore
      de un solo clic para no tener que teclear ~100 medicamentos a mano.

   Al editar acá NO se cambia lo que ve la clínica si ya importó su catálogo:
   a partir de ese momento la fuente de verdad es Firestore y se edita desde
   los paneles.
   ================================================================ */
(function (global) {
  'use strict';

  /* ── Personal que puede figurar como "Atendido por" ──
     Las cuentas del sistema son compartidas (p. ej. "Caja · Enfermería"), así
     que el correo de la sesión NO identifica a la persona que atendió: cada
     etapa pide el nombre real y ese nombre es el que se guarda en el historial.
     Colección Firestore: /personal — tipo: 'medico' | 'enfermeria'. */
  var PERSONAL = [
    { nombre: 'Dr. Brian Rojas',        tipo: 'medico' },
    { nombre: 'Dr. Hermes Molina',      tipo: 'medico' },
    { nombre: 'Dr. Adony Álvarez',      tipo: 'medico' },
    { nombre: 'Enfermería (Ana Ruiz)',  tipo: 'enfermeria' },
    { nombre: 'Enfermería (Luz Ortíz)', tipo: 'enfermeria' }
  ];

  /* ── Laboratorios a los que CMG manda las muestras ──
     Colección Firestore: /proveedores */
  var PROVEEDORES = [
    { nombre: 'Labex',              contacto: '' },
    { nombre: 'Masterlab',          contacto: '' },
    { nombre: 'Laboratorio Rivera', contacto: '' }
  ];

  /* ── Categoría fija de la prueba de sensibilidad ──
     No es un medicamento: es un chequeo clínico previo a aplicar un
     inyectable. Por eso NO vive en el catálogo administrable y siempre se
     antepone a la lista de "aplicados en visita". El formulario de resultado
     de la prueba se ancla a este título (ver buildMedsCatsHtml). */
  var PRUEBA_SENSIBILIDAD_CAT = {
    titulo: '🧪 Prueba de sensibilidad',
    items: ['Prueba de sensibilidad']
  };

  /* ── Orden en que se muestran las categorías ──
     Las categorías que el admin cree y no estén acá se agregan al final, en
     orden alfabético. */
  var CATEGORIAS_VISITA = [
    '💉 Inyectable',
    '🧴 Insumos (Sueros)',
    '🏥 Sueroterapia (En Consultorio)',
    '💧 Gotas / Otros'
  ];
  var CATEGORIAS_DESPACHO = [
    '🥤 Suspensión',
    '💊 Tableta / Cápsula',
    '🧴 Tópico',
    '💧 Gotas'
  ];

  /* ── Catálogo de medicamentos ──
     Colección Firestore: /medicamentos
       nombre            : texto
       categoria         : una de CATEGORIAS_VISITA / CATEGORIAS_DESPACHO
       tipo              : 'visita' | 'despacho'  (en qué checklist aparece)
       orden             : entero — posición dentro de su categoría
       precio            : número (informativo por ahora — ver Medicamentos.html)
       excluidoDescuento : boolean (idem)

     `orden` existe porque dentro de una categoría el orden NO siempre es
     alfabético y eso importa: los sueros van agrupados por tipo y de mayor a
     menor volumen (1000 → 500 → 250 → 100 ml), que es como los busca
     enfermería. Firestore devuelve los documentos en orden de ID, así que sin
     este campo el checklist saldría barajado.

     Budoxigen aparece dos veces a propósito: es gota aplicada en consultorio
     y también se despacha, y cada checklist lo agrupa en su propia categoría. */
  function meds(categoria, tipo, nombres) {
    return nombres.map(function (n, i) {
      return { nombre: n, categoria: categoria, tipo: tipo, orden: i, precio: 0, excluidoDescuento: false };
    });
  }

  var MEDICAMENTOS = []
    .concat(meds(CATEGORIAS_VISITA[0], 'visita', [
      'Alergil', 'Amikacina', 'Antigripal - Antiviral IM', 'Astriaxona 1g', 'Bixicort',
      'Citicolina 500mg', 'Clevium', 'Complejo B', 'Dexametasona 8 mg', 'Dexketoprofeno',
      'Diazepam', 'Diclofenac Sodico', 'DICLO-NEURAXIN', 'Diclosona', 'Dipirona',
      'DOLGENAL AMP', 'Dramanyl', 'Epinefrina (Pinadrina 1 mg)', 'Esomeprazol 40 mg', 'Ferroin',
      'Furosemida', 'Gentamicina', 'Glirron', 'Hidrocortisona 100mg', 'Hidrocortisona 500mg',
      'Hioscina', 'Insulina Cristalina (UI - Unidad Internacional)', 'Labetalol', 'Levofloxacina 750mg / 150ml', 'Metoclopramida',
      'Metronidazol 500 MG (I.V.)', 'Onemer (Ketorolaco 30mg)', 'Orfenaflex', 'Paracetamol 10mg /100 ml (Benphamol)', 'Penicilina 1.2 millones',
      'Ranitidina', 'Rofemed 1g', 'Sertal Compuesto', 'Sulfato de Magnesio 10%', 'Tiamina',
      'TONVAL (Pantoprazol 40mg)', 'Tramadol', 'Ultra-Neuraxin', 'Vitamina K'
    ]))
    .concat(meds(CATEGORIAS_VISITA[1], 'visita', [
      'Suero Solución Salina 1000 ml', 'Suero Solución Salina 500 ml', 'Suero Solución Salina 250 ml', 'Suero Solución Salina 100 ml',
      'Suero Hartman 1000 ml', 'Suero Hartman 500 ml', 'Suero Hartman 250 ml', 'Suero Hartman 100 ml',
      'Suero Mixto 1000 ml', 'Suero Mixto 500 ml', 'Suero Mixto 250 ml', 'Suero Mixto 100 ml',
      'Suero Dextrosa 1000 ml', 'Suero Dextrosa 500 ml', 'Suero Dextrosa 250 ml', 'Suero Dextrosa 100 ml'
    ]))
    .concat(meds(CATEGORIAS_VISITA[2], 'visita', [
      'Suero de Glucosa'
    ]))
    .concat(meds(CATEGORIAS_VISITA[3], 'visita', [
      'Budoxigen'
    ]))
    .concat(meds(CATEGORIAS_DESPACHO[0], 'despacho', [
      'Acetaminofen', 'Acla-Med', 'Desloratadina 2.5 mg', 'Dilabrom HH', 'Kold-Grip',
      'Sales de Rehidratacion Oral', 'Tusivanz', 'VISCOF-D', 'CORIVIT'
    ]))
    .concat(meds(CATEGORIAS_DESPACHO[1], 'despacho', [
      'Acetaminofen 500 mg', 'Amoxicilina + Acido Clavulonico 875 mg / 125 mg (Caja de 14 unidades)', 'Azitromicina 500mg', 'Cetirizina 10 MG', 'Ciprofloxacina 500 MG',
      'Demoxil 500 mg', 'Desloratadina 5 MG', 'Difenac 75mg', 'DolFix (Diclofenaco Potásico 100 mg)', 'Fluconazol 150 mg', 'Gastrolev',
      'Hidrocloratiazida 25 MG', 'Hioscina 10 MG', 'Ibuprofeno 600 MG', 'KoldGrip', 'Levofloxacino 750 mg (Calox)',
      'Loratadina 10 MG (Lorat)', 'Paracetamol 750 MG', 'Rhinolar 5mg', 'Ultifenol Plus+'
    ]))
    .concat(meds(CATEGORIAS_DESPACHO[2], 'despacho', [
      'Ketoconazol 2%', 'Septidex', 'Sulfadiazina de Plata', 'Ultifenol Gel'
    ]))
    .concat(meds(CATEGORIAS_DESPACHO[3], 'despacho', [
      'Otan', 'Budoxigen'
    ]));

  /* ── Agrupa documentos planos de Firestore en el formato de categorías que
     consumen los checklists de Expediente-Doctor.html:
       [{ titulo: '💉 Inyectable', items: ['Alergil', ...] }, ...]
     Las categorías salen en el orden de `ordenPreferido` y las que el admin
     haya creado por su cuenta van al final, alfabéticas. Dentro de cada
     categoría manda `orden` (ver arriba); a igual orden, alfabético. ── */
  function agruparPorCategoria(docs, tipo, ordenPreferido) {
    var ordenCats = ordenPreferido || [];
    var porCat = {};
    (docs || []).forEach(function (m) {
      if (!m || !m.nombre || m.tipo !== tipo) return;
      var cat = m.categoria || 'Sin categoría';
      (porCat[cat] = porCat[cat] || []).push(m);
    });
    var cats = Object.keys(porCat).sort(function (a, b) {
      var ia = ordenCats.indexOf(a), ib = ordenCats.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
    return cats.map(function (c) {
      return {
        titulo: c,
        items: porCat[c].sort(function (a, b) {
          var oa = typeof a.orden === 'number' ? a.orden : 9999;
          var ob = typeof b.orden === 'number' ? b.orden : 9999;
          if (oa !== ob) return oa - ob;
          return (a.nombre || '').localeCompare(b.nombre || '');
        }).map(function (m) { return m.nombre; })
      };
    });
  }

  global.cmgCatalogos = {
    PERSONAL: PERSONAL,
    PROVEEDORES: PROVEEDORES,
    MEDICAMENTOS: MEDICAMENTOS,
    CATEGORIAS_VISITA: CATEGORIAS_VISITA,
    CATEGORIAS_DESPACHO: CATEGORIAS_DESPACHO,
    PRUEBA_SENSIBILIDAD_CAT: PRUEBA_SENSIBILIDAD_CAT,
    agruparPorCategoria: agruparPorCategoria
  };
})(window);
