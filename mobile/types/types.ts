export type User = {
    id: number,
    name: string,
    email: string,
    password: string,
    last_seen: string,
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