import type { BroadcastMessage } from './types';

// Data toko, kru, dan log kehadiran sekarang akan dikelola di Firestore.
// File ini hanya menyimpan data statis untuk pesan siaran.

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
