/* ============================================================
   CMG · Firebase Initialization
   Requiere: firebase-app-compat + firebase-auth-compat +
             firebase-firestore-compat cargados antes de este script.
   ============================================================ */
(function () {
  var config = {
    apiKey           : 'AIzaSyDDQgAYZn-xj0eZY_N7Flbks4annkAP3gw',
    authDomain       : 'clinica-medica-general.firebaseapp.com',
    projectId        : 'clinica-medica-general',
    storageBucket    : 'clinica-medica-general.firebasestorage.app',
    messagingSenderId: '932619628471',
    appId            : '1:932619628471:web:9a57d62b673165f0fec232'
  };
  if (!firebase.apps.length) firebase.initializeApp(config);
  window.cmgAuth = firebase.auth();
  window.cmgDb   = firebase.firestore();
})();
