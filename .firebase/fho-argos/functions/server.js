const { onRequest } = require('firebase-functions/v2/https');
  const server = import('firebase-frameworks');
  exports.ssrfhoargos = onRequest({"region":"southamerica-east1","secrets":["FIREBASE_CLIENT_EMAIL","FIREBASE_PRIVATE_KEY"]}, (req, res) => server.then(it => it.handle(req, res)));
  