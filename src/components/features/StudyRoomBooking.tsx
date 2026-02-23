import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2, Calendar, Clock } from 'lucide-react';

interface BookingProps {
    roomId: string;
    roomName: string;
}

export const StudyRoomBooking: React.FC<BookingProps> = ({ roomId, roomName }) => {
    const [loading, setLoading] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const handleBooking = async () => {
        if (!startTime || !endTime) {
            toast({ title: "Error", description: "Please select both start and end times", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            // Using the RPC function for conflict prevention as requested
            const { data, error } = await supabase.rpc('book_study_room', {
                request_room_id: roomId,
                request_start: new Date(startTime).toISOString(),
                request_end: new Date(endTime).toISOString(),
            });

            if (error) throw error;

            const result = data as { success: boolean; error?: string; booking_id?: string };

            if (result.success) {
                toast({ title: "Success", description: `Room ${roomName} booked successfully!` });
            } else {
                toast({ title: "Booking Failed", description: result.error, variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass p-6 rounded-2xl border border-primary/20 space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Book {roomName}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Start Time</label>
                    <input
                        type="datetime-local"
                        className="w-full p-2 bg-muted rounded-md outline-none focus:ring-2 ring-primary/50"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">End Time</label>
                    <input
                        type="datetime-local"
                        className="w-full p-2 bg-muted rounded-md outline-none focus:ring-2 ring-primary/50"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                    />
                </div>
            </div>

            <Button
                onClick={handleBooking}
                disabled={loading}
                className="w-full gap-2"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                Confirm Booking
            </Button>
        </div>
    );
};
