export type User = {
    id: number,
    name: string,
    email: string,
    password: string,
    last_seen: string, // ISO date string from timestamptz, remember to use Date()
    points: number,
    interests: string[]
}

export type Message = {
    id?: number,
    room_id: string,
    sender_id: number,
    receiver_id: number,
    content: string,
    created_at: string,
    is_read: boolean
}

export type ChatRoom = {
    id?: number,
    room_id: string,
    user1_id?: number,
    user2_id?: number,
    created_at?: string,
    last_message_id: number
}