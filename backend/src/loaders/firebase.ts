import admin from 'firebase-admin';
import config from '../config';

export async function loadFirebase(): Promise<void> {
  if (admin.apps.length > 0) {
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.FIREBASE_PROJECT_ID,
      clientEmail: config.FIREBASE_CLIENT_EMAIL,
      // CRITICAL: private key is stored in .env as a single line with literal \n
      // The replace is mandatory — without it Firebase Auth throws 'error:09091064:PEM routines'
      privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  console.log('Firebase Admin SDK initialized');
}
