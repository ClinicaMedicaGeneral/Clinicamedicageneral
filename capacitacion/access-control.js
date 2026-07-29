/* ============================================================
   CMG · Capacitación — Control de acceso centralizado
   Única fuente de verdad para qué rol puede entrar a cada módulo
   de capacitación (index.html, caja.html, enfermeria.html,
   medico.html, admin.html). Nada de listas de correos por página:
   todo se resuelve por el rol en /usuarios/{uid}, con el mismo
   bootstrap de admins que usa firestore.rules.
   Requiere: firebase-init.js cargado antes de este script.
   ============================================================ */
(function (global) {
  // Cuentas bootstrap: siempre admin, sin depender de un doc en Firestore.
  var ADMIN_EMAILS = [
    'rubenwainwrightba@gmail.com',
    'ventasymercadeocmg@gmail.com',
    'skarleth.admoncmg@gmail.com',
    'administracion@clinicamedicacmg.net'
  ];

  // Matriz de acceso por rol (mismo valor que /usuarios/{uid}.rol):
  //   caja, enf  → módulo Caja + módulo Caja · Enfermería
  //   medico     → solo módulo Médico
  //   admin      → todos los módulos
  var ACCESS = {
    caja:   { caja: true,  admin: false, enf: true,  medico: false },
    enf:    { caja: true,  admin: false, enf: true,  medico: false },
    medico: { caja: false, admin: false, enf: false, medico: true  },
    admin:  { caja: true,  admin: true,  enf: true,  medico: true  }
  };

  // Resuelve el rol efectivo del usuario autenticado.
  // Bootstrap admin → 'admin' sin consultar Firestore.
  // Si no, lee /usuarios/{uid}; exige estado:'activo'.
  function resolveRole(user) {
    var email = (user.email || '').toLowerCase();
    if (ADMIN_EMAILS.indexOf(email) !== -1) return Promise.resolve('admin');
    return cmgDb.collection('usuarios').doc(user.uid).get().then(function (doc) {
      return (doc.exists && doc.data().estado === 'activo') ? doc.data().rol : null;
    });
  }

  // Protege una página de módulo: exige login y que el rol tenga acceso a moduleKey
  // ('caja' | 'enf' | 'medico' | 'admin'). Redirige a Auth si no hay sesión,
  // a Inicio si el rol no tiene permiso. onGranted(rol) corre si el acceso es válido.
  function guardModule(moduleKey, returnTo, onGranted) {
    cmgAuth.onAuthStateChanged(function (user) {
      if (!user) { global.location.href = '../Auth.html?returnTo=' + returnTo; return; }
      resolveRole(user).then(function (rol) {
        var perms = ACCESS[rol];
        if (!perms || !perms[moduleKey]) { global.location.href = '../Inicio.html'; return; }
        if (onGranted) onGranted(rol);
      }).catch(function () { global.location.href = '../Inicio.html'; });
    });
  }

  global.CmgCapacitacion = {
    ADMIN_EMAILS: ADMIN_EMAILS,
    ACCESS: ACCESS,
    resolveRole: resolveRole,
    guardModule: guardModule
  };
})(window);
