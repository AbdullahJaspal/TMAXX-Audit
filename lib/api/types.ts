export interface SquadMember {
    user_id: string;
    name: string;
    streak: number;
    boosted: boolean;
    avatar: string;
    is_owner: boolean;
}

export interface FeedItem {
    name: string;
    avatar: string;
    time: string;
    text: string;
}

export interface Squad {
    squad_id: string;
    name: string;
    invite_code: string;
    squad_streak: number;
    squad_habits: number;
    squad_energy: number;
    members: SquadMember[];
    feed: FeedItem[];
}

// Helper functions for member display
export const getDisplayName = (name: string | null | undefined): string => {
    return name?.trim() || 'Unknown Member';
};

export const getAvatarLetter = (name: string | null | undefined): string => {
    const displayName = getDisplayName(name);
    return displayName[0].toUpperCase();
}; 