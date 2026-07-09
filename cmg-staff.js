/* ================================================================
   cmg-staff.js — Lista centralizada de acceso staff CMG
   Para agregar un nuevo admin permanente edita solo ADMIN_EMAILS.
   Los usuarios creados desde Admin-Usuarios.html obtienen acceso
   automáticamente a través de Firestore (colección /usuarios).
   ================================================================ */
(function (global) {
  'use strict';

  /* ── Cuentas bootstrap (siempre tienen acceso sin doc Firestore) ── */
  var ADMIN_EMAILS = [
    'rubenwainwrightba@gmail.com',
    'ventasymercadeocmg@gmail.com',
    'skarleth.admoncmg@gmail.com',
    'administracion@clinicamedicacmg.net'
  ];

  var STAFF_EMAILS = ADMIN_EMAILS.concat([
    'expedientes.clinicamedicacmg@gmail.com',
    'luz_cmg@gmail.com',
    'ana_cmg@gmail.com',
    'doctor_rojascmg@gmail.com',
    'doctor_hermescmg@gmail.com',
    'doctor_alvarezcmg@gmail.com'
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
    }
  };
})(window);
