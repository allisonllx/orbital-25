export type Message = {
    id: number,
    room_id: number,
    sender_id: number,
    receiver_id: number,
    content: string,
    created_at: string,
    is_read: boolean
}