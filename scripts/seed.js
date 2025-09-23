// @ts-check
// This script is not part of the app runtime, but is a tool to seed the database.
// To use it, run `node scripts/seed.js` from your terminal.

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp } = require('firebase/firestore');

// --- IMPORTANT ---
// 1. Make sure you have initialized a Firebase project.
// 2. Before running, paste your Firebase config object here.
const firebaseConfig = {
    "projectId": "studio-1410642569-45f02",
    "appId": "1:29217588201:web:b5d92a04055537ac07c178",
    "apiKey": "AIzaSyAmRJmvQtWL0eWKvIKq-BD3EsSUuwDzOJ4",
    "authDomain": "studio-1410642569-45f02.firebaseapp.com",
    "measurementId": "",
    "messagingSenderId": "29217588201"
};

const stores = [
  { id: 'store-1', name: 'Semarang Store', latitude: -6.9483907, longitude: 110.3775794 },
  { id: 'store-2', name: 'Downtown Central', latitude: -6.2088, longitude: 106.8456 }, // Jakarta
  { id: 'store-3', name: 'Beachside Outlet', latitude: 34.0194, longitude: -118.4912 },
];

const crewMembers = [
  { id: 'crew-1', name: 'Alex Johnson', storeId: 'store-2', address: '123 Main St, Los Angeles, CA 90012' },
  { id: 'crew-2', name: 'Maria Garcia', storeId: 'store-1', address: '456 Grand Ave, Los Angeles, CA 90012' },
  { id: 'crew-3', name: 'James Smith', storeId: 'store-3', address: '789 Ocean Front Walk, Santa Monica, CA 90401' },
  { id: 'crew-4', name: 'Patricia Williams', storeId: 'store-1', address: '101 Rosemont Ave, Pasadena, CA 91103' },
  { id: 'crew-5', name: 'David Lee', storeId: 'store-2', address: '210 Sunset Blvd, Los Angeles, CA 90012' },
];

const attendanceLogs = [
  {
    id: 'log-1',
    crewMemberId: 'crew-1',
    crewMemberName: 'Alex Johnson',
    storeId: 'store-2',
    storeName: 'Downtown Central',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
    type: 'in',
    photoURL: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
  },
  {
    id: 'log-2',
    crewMemberId: 'crew-1',
    crewMemberName: 'Alex Johnson',
    storeId: 'store-2',
    storeName: 'Downtown Central',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 1)),
    type: 'out',
    photoURL: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
  },
  {
    id: 'log-3',
    crewMemberId: 'crew-3',
    crewMemberName: 'James Smith',
    storeId: 'store-3',
    storeName: 'Beachside Outlet',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 4)),
    type: 'in',
    photoURL: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  },
];

const broadcastMessages = [
    {
      id: 'msg-1',
      message: 'Rapat tim jam 5 sore hari ini di ruang konferensi utama. Kehadiran wajib.',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
    },
    {
      id: 'msg-2',
      message: 'Harap diingat untuk membersihkan area kerja Anda sebelum pulang. Jaga kebersihan tempat kita!',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 2)),
    },
    {
      id: 'msg-3',
      message: 'Penjualan khusus akhir pekan ini! Diskon 20% untuk semua item. Beri tahu pelanggan Anda!',
      timestamp: new Date(new Date().setHours(new Date().getHours() - 5)),
    }
];

async function seedDatabase() {
    if (!firebaseConfig.projectId || firebaseConfig.projectId === "your-project-id") {
        console.error("Please paste your Firebase config into scripts/seed.js before running.");
        return;
    }
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log("Starting to seed database...");

    // Seed stores
    for (const store of stores) {
        try {
            const { id, ...data } = store;
            await setDoc(doc(db, "stores", id), data);
            console.log(`- Seeded store: ${store.name}`);
        } catch (error) {
            console.error(`Error seeding store ${store.name}:`, error);
        }
    }
    
    // Seed crew members
    for (const member of crewMembers) {
        try {
            const { id, ...data } = member;
            await setDoc(doc(db, "crew", id), data);
            console.log(`- Seeded crew member: ${member.name}`);
        } catch (error) {
            console.error(`Error seeding crew member ${member.name}:`, error);
        }
    }

    // Seed attendance logs
    for (const log of attendanceLogs) {
        try {
            const { id, timestamp, ...data } = log;
            // Convert JS Date to Firestore Timestamp
            const firestoreTimestamp = Timestamp.fromDate(timestamp);
            await setDoc(doc(db, "attendance", id), { ...data, timestamp: firestoreTimestamp });
            console.log(`- Seeded attendance log: ${log.id}`);
        } catch (error) {
            console.error(`Error seeding attendance log ${log.id}:`, error);
        }
    }

    // Seed broadcast messages
    for (const message of broadcastMessages) {
        try {
            const { id, timestamp, ...data } = message;
            const firestoreTimestamp = Timestamp.fromDate(timestamp);
            await setDoc(doc(db, "broadcasts", id), { ...data, timestamp: firestoreTimestamp });
            console.log(`- Seeded broadcast message: ${message.id}`);
        } catch (error) {
            console.error(`Error seeding broadcast message ${message.id}:`, error);
        }
    }

    console.log("\nDatabase seeding complete!");
    console.log("You can now run `npm run dev` to start the application.");
    
    // Force exit script
    process.exit(0);
}

seedDatabase();
