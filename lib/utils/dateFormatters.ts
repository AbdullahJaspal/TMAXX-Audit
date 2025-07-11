export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // If invalid date, return empty string
    if (isNaN(date.getTime())) {
        return '';
    }

    // Less than 1 hour ago
    if (diffInHours < 1) {
        if (diffInMinutes < 1) {
            return 'Just now';
        }
        return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
    }

    // Less than 24 hours ago
    if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? 'hr' : 'hrs'} ago`;
    }

    // Yesterday
    if (diffInDays === 1) {
        return 'Yesterday';
    }

    // Less than 7 days ago
    if (diffInDays < 7) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    }

    // More than 7 days ago
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    // Add ordinal suffix to day
    const ordinalSuffix = (d: number): string => {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    return `${month} ${day}${ordinalSuffix(day)}`;
} 