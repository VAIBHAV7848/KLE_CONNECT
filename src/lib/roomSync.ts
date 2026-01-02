// Firebase Room Sync Utility for Study Rooms
import { database } from '@/lib/firebase';
import { ref, set, onValue, remove, get } from 'firebase/database';

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

// Add participant to room
export const joinRoom = async (roomId: string, userId: string, userName: string) => {
    const participantRef = ref(database, `rooms/${roomId}/participants/${userId}`);
    await set(participantRef, {
        name: userName,
        joinedAt: Date.now()
    });

    // Update participant count
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
        const room = snapshot.val();
        const participantCount = room.participants ? Object.keys(room.participants).length : 1;
        await set(ref(database, `rooms/${roomId}/participantCount`), participantCount);
    }
};

// Remove participant from room
export const leaveRoom = async (roomId: string, userId: string) => {
    const participantRef = ref(database, `rooms/${roomId}/participants/${userId}`);
    await remove(participantRef);

    // Update participant count
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
        const room = snapshot.val();
        const participantCount = room.participants ? Object.keys(room.participants).length : 0;

        if (participantCount === 0) {
            // Delete room if empty
            await deleteRoomFromFirebase(roomId);
        } else {
            await set(ref(database, `rooms/${roomId}/participantCount`), participantCount);
        }
    }
};
