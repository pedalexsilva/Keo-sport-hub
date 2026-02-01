/**
 * Formats a date string or Date object to "dd-mm-yyyy".
 * @param date - The date to format (string or Date object)
 * @returns The formatted date string in "dd-mm-yyyy" format, or original string if invalid
 */
export const formatDate = (date: string | Date | undefined | null): string => {
    if (!date) return '';

    try {
        const d = new Date(date);

        // Check if date is valid
        if (isNaN(d.getTime())) {
            return String(date);
        }

        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();

        return `${day}-${month}-${year}`;
    } catch (error) {
        console.error("Error formatting date:", error);
        return String(date);
    }
};

/**
 * Formats a date string or Date object to "dd-mm-yyyy HH:MM".
 * @param date - The date to format
 * @returns The formatted date and time string
 */
export const formatDateTime = (date: string | Date | undefined | null): string => {
    if (!date) return '';

    try {
        const d = new Date(date);

        if (isNaN(d.getTime())) {
            return String(date);
        }

        const dateStr = formatDate(d);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');

        return `${dateStr} ${hours}:${minutes}`;
    } catch (error) {
        return String(date);
    }
};
