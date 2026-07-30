/* ================================================================
   cmg-staff.js — Lista centralizada de acceso staff CMG
   Para agregar un nuevo admin permanente edita solo ADMIN_EMAILS.
   Los usuarios creados desde Admin-Usuarios.html obtienen acceso
   automáticamente a través de Firestore (colección /usuarios).
   ================================================================ */
(function (global) {
  'use strict';

  /* ── Cuentas bootstrap (siempre tienen acceso sin doc Firestore) ──
     Debe reflejar exactamente las cuentas activas en Admin-Usuarios.html. */
  var ADMIN_EMAILS = [
    'rubenwainwrightba@gmail.com',
    'skarleth.admoncmg@gmail.com',
    'administracion@clinicamedicacmg.net'
  ];

  var STAFF_EMAILS = ADMIN_EMAILS.concat([
    'reneherrerarojas667@gmail.com',
    'luzidaliaortiz2021@gmail.com',
    'ruizterann83@gmail.com',
    'caja.clinicacmg@gmail.com'
  ]);

  /* ── Lookup en Firestore /usuarios/{uid} ── */
  function firestoreRole(uid, cb) {
    var db = typeof cmgDb !== 'undefined' ? cmgDb : null;
    if (!db) { cb(null); return; }
    db.collection('usuarios').doc(uid).get()
      .then(function (doc) {
        cb(doc.exists && doc.data().estado === 'activo' ? doc.data().rol : null);
      })
      .catch(function () { cb(null); });
  }

  global.cmgStaff = {
    /* Sync — solo lista bootstrap */
    isAdmin: function (email) { return ADMIN_EMAILS.indexOf((email || '').toLowerCase()) !== -1; },
    isStaff: function (email) { return STAFF_EMAILS.indexOf((email || '').toLowerCase()) !== -1; },

    /* Async — bootstrap primero, luego Firestore */
    checkAdmin: function (user, cb) {
      if (!user) { cb(false); return; }
      if (ADMIN_EMAILS.indexOf((user.email || '').toLowerCase()) !== -1) { cb(true); return; }
      firestoreRole(user.uid, function (rol) { cb(rol === 'admin'); });
    },
    checkStaff: function (user, cb) {
      if (!user) { cb(false); return; }
      if (STAFF_EMAILS.indexOf((user.email || '').toLowerCase()) !== -1) { cb(true); return; }
      firestoreRole(user.uid, function (rol) { cb(!!rol); });
    },
    // checkDoctor: acceso al portal clínico (Expediente-Doctor.html). Mismo
    // criterio que isDoctor() en firestore.rules: rol medico | enf | admin.
    checkDoctor: function (user, cb) {
      if (!user) { cb(false); return; }
      if (STAFF_EMAILS.indexOf((user.email || '').toLowerCase()) !== -1) { cb(true); return; }
      firestoreRole(user.uid, function (rol) { cb(rol === 'medico' || rol === 'enf' || rol === 'admin'); });
    },
    // checkMedico: SOLO médico (rol medico | admin, o correos de doctores).
    // Mismo criterio que isMedicoTratante() en firestore.rules — enfermería
    // (rol enf) NO debe pasar esto. Se usa para ocultar/bloquear en el cliente
    // la Etapa de Consulta médica (diagnóstico/tratamiento), que solo puede
    // completar el médico tratante o un admin.
    checkMedico: function (user, cb) {
      if (!user) { cb(false); return; }
      var MEDICO_EMAILS = ADMIN_EMAILS.concat(['reneherrerarojas667@gmail.com']);
      if (MEDICO_EMAILS.indexOf((user.email || '').toLowerCase()) !== -1) { cb(true); return; }
      firestoreRole(user.uid, function (rol) { cb(rol === 'medico' || rol === 'admin'); });
    }
  };
})(window);
