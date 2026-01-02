// Firebase Room Sync Utility for Study Rooms
import { database } from '@/lib/firebase';
import { ref, set, onValue, remove, serverTimestamp } from 'firebase/database';

export interface FirebaseRoom {
    id: string;
    name: string;
    topic: string;
    hostName: string;
    hostEmail: string;
    participants: number;
    createdAt: number;
}

// Save room to Firebase
export const saveRoomToFirebase = async (room: FirebaseRoom) => {
    const roomRef = ref(database, `rooms/${room.id}`);
    await set(roomRef, {
        ...room,
        createdAt: Date.now(),
        updatedAt: Date.now()
    });
};

// Delete room from Firebase
export const deleteRoomFromFirebase = async (roomId: string) => {
    const roomRef = ref(database, `rooms/${roomId}`);
    await remove(roomRef);
};

// Listen to all rooms
export const subscribeToRooms = (callback: (rooms: FirebaseRoom[]) => void) => {
    const roomsRef = ref(database, 'rooms');
    return onValue(roomsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const roomList = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            callback(roomList);
        } else {
            callback([]);
        }
    });
};
