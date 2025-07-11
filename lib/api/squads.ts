import { Squad } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.tmaxx.app';

export class SquadsAPI {
    private authToken: string;

    constructor(authToken: string) {
        this.authToken = authToken;
    }

    async getSquad(squadId: string): Promise<Squad> {
        const response = await fetch(`${API_BASE_URL}/squads/${squadId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch squad: ${response.statusText}`);
        }
        
        return response.json();
    }
} 