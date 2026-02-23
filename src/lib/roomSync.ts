// Supabase Room Sync Utility for Study Rooms
import { supabase } from '@/lib/supabase';

export interface Room {
    id: string;
    name: string;
    topic: string;
    hostId: string | null;
    participants: number;
    createdAt: string;
}

export interface RoomParticipant {
    id: string;
    roomId: string;
    userId: string;
    userName: string;
    joinedAt: string;
}

// Save room to Supabase
export const saveRoomToSupabase = async (room: Omit<Room, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
        .from('rooms')
        .insert({
            name: room.name,
            host_id: room.hostId,
        })
        .select()
        .maybeSingle();

    if (error) {
        console.error('Error saving room:', error);
        throw error;
    }

    if (!data) {
        throw new Error('Room was not created');
    }

    return data;
};

// Delete room from Supabase
export const deleteRoomFromSupabase = async (roomId: string) => {
    const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

    if (error) {
        console.error('Error deleting room:', error);
        throw error;
    }
};

// Listen to all rooms
export const subscribeToRooms = (callback: (rooms: Room[]) => void) => {
    const subscription = supabase
        .channel('rooms_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'rooms' },
            async () => {
                // Fetch all rooms on any change
                const { data, error } = await supabase
                    .from('rooms')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    const roomList: Room[] = data.map((room: any) => ({
                        id: room.id,
                        name: room.name,
                        topic: room.topic || 'General',
                        hostId: room.host_id,
                        participants: room.participants || 0,
                        createdAt: room.created_at,
                    }));
                    callback(roomList);
                }
            }
        )
        .subscribe();

    // Initial fetch
    supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
            if (!error && data) {
                const roomList: Room[] = data.map((room: any) => ({
                    id: room.id,
                    name: room.name,
                    topic: room.topic || 'General',
                    hostId: room.host_id,
                    participants: room.participants || 0,
                    createdAt: room.created_at,
                }));
                callback(roomList);
            }
        });

    return () => {
        subscription.unsubscribe();
    };
};

// Add participant to room
export const joinRoom = async (roomId: string, userId: string, userName: string) => {
    // Add to room_participants
    const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
            room_id: roomId,
            user_id: userId,
            user_name: userName,
        });

    if (participantError) {
        console.error('Error joining room:', participantError);
        throw participantError;
    }

    // Update participant count
    const { data: participants } = await supabase
        .from('room_participants')
        .select('id')
        .eq('room_id', roomId);

    await supabase
        .from('rooms')
        .update({ participants: participants?.length || 1 })
        .eq('id', roomId);
};

// Remove participant from room
export const leaveRoom = async (roomId: string, userId: string) => {
    // Remove from room_participants
    const { error: participantError } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

    if (participantError) {
        console.error('Error leaving room:', participantError);
        throw participantError;
    }

    // Check remaining participants
    const { data: participants } = await supabase
        .from('room_participants')
        .select('id')
        .eq('room_id', roomId);

    const participantCount = participants?.length || 0;

    if (participantCount === 0) {
        // Delete room if empty
        await deleteRoomFromSupabase(roomId);
    } else {
        // Update participant count
        await supabase
            .from('rooms')
            .update({ participants: participantCount })
            .eq('id', roomId);
    }
};

// Get room by name
export const getRoomByName = async (roomName: string): Promise<Room | null> => {
    const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('name', roomName)
        .maybeSingle();

    if (error || !data) {
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        topic: data.topic || 'General',
        hostId: data.host_id,
        participants: data.participants || 0,
        createdAt: data.created_at,
    };
};

// Legacy exports for backward compatibility
export const saveRoomToFirebase = saveRoomToSupabase;
export const deleteRoomFromFirebase = deleteRoomFromSupabase;
