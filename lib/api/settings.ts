const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.tmaxx.app';

export class SettingsAPI {
    private authToken: string;

    constructor(authToken: string) {
        this.authToken = authToken;
    }

    async deleteAccount(): Promise<{ success: boolean; error?: string; message?: string; debug?: any }> {
        try {
            const response = await fetch(`${API_BASE_URL}/accounts/delete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                },
            });

            const responseData = await response.json().catch(() => null);
            
            if (!response.ok) {
                console.error('[SettingsAPI] Delete account failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseData,
                    headers: Object.fromEntries(response.headers.entries())
                });
                
                return { 
                    success: false, 
                    error: responseData?.message || 'Failed to delete account',
                    debug: {
                        status: response.status,
                        statusText: response.statusText,
                        responseData
                    }
                };
            }

            return { 
                success: true,
                message: 'Your account deletion request has been received. Your account will be permanently deleted within 7 days. If you did not mean to make this request, please email hello@tmaxx.app ASAP.\n\nIf you purchased your subscription through Apple or Google, please contact them to update your renewal settings.'
            };
        } catch (error) {
            console.error('[SettingsAPI] Unexpected error during account deletion:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
                debug: error
            };
        }
    }
}
