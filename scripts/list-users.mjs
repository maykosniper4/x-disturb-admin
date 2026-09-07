import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, limit, query, startAfter } from 'firebase/firestore';

// Load variables strictly from .env.local (never hardcode keys)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        env[key] = val;
      }
    }
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error('Error: NEXT_PUBLIC_FIREBASE_API_KEY not found in environment or .env.local');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  console.log('Connecting to Firebase and fetching live users...');
  await signInAnonymously(auth);

  let lastDoc = null;
  const users = [];

  while (true) {
    const q = lastDoc
      ? query(collection(db, 'users'), startAfter(lastDoc), limit(1))
      : query(collection(db, 'users'), limit(1));

    const snapshot = await getDocs(q);
    if (snapshot.empty) break;

    snapshot.forEach((doc) => {
      lastDoc = doc;
      const data = doc.data();
      let created = 'N/A';
      if (data.createdAt?.toDate) {
        created = data.createdAt.toDate().toISOString().split('T')[0];
      } else if (data.createdAt?.seconds) {
        created = new Date(data.createdAt.seconds * 1000).toISOString().split('T')[0];
      }
      users.push({
        '#': users.length + 1,
        'Name': data.name || '(unnamed)',
        'Phone': (data.phoneNumber || '').trim(),
        'Category': data.category || 'N/A',
        'Referral Code': data.referralCode || 'N/A',
        'Active': data.isActive ? 'Yes' : 'No',
        'Created': created,
        'User ID': doc.id
      });
    });

    if (users.length >= 100) break;
  }

  console.log('\n======================================================');
  console.log('Total Registered Users in Firestore: ' + users.length);
  console.log('======================================================\n');
  console.table(users);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error fetching users:', err);
  process.exit(1);
});
