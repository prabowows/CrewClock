import type { Store, CrewMember, AttendanceLog, BroadcastMessage } from './types';

// Data toko, kru, dan log kehadiran sekarang akan dikelola di Firestore.
// File ini menyimpan data statis yang dapat digunakan untuk mengisi database (seeding).

export const stores: Store[] = [
  { id: 'store-1', name: 'Semarang Store', latitude: -6.9483907, longitude: 110.3775794 },
  { id: 'store-2', name: 'Downtown Central', latitude: 34.0522, longitude: -118.2437 },
  { id: 'store-3', name: 'Beachside Outlet', latitude: 34.0194, longitude: -118.4912 },
];

export const crewMembers: CrewMember[] = [
  { id: 'crew-1', name: 'Alex Johnson', storeId: 'store-2', address: '123 Main St, Los Angeles, CA 90012' },
  { id: 'crew-2', name: 'Maria Garcia', storeId: 'store-1', address: '456 Grand Ave, Los Angeles, CA 90012' },
  { id: 'crew-3', name: 'James Smith', storeId: 'store-3', address: '789 Ocean Front Walk, Santa Monica, CA 90401' },
  { id: 'crew-4', name: 'Patricia Williams', storeId: 'store-1', address: '101 Rosemont Ave, Pasadena, CA 91103' },
];

export const attendanceLogs: AttendanceLog[] = [
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


export const broadcastMessages: BroadcastMessage[] = [
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