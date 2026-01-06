/**
 * Share utilities for copying and sharing content
 */

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
                textArea.remove();
                return true;
            } catch (error) {
                textArea.remove();
                return false;
            }
        }
    } catch (error) {
        console.error('Failed to copy:', error);
        return false;
    }
}

export async function shareTask(taskId: string, taskTitle: string): Promise<boolean> {
    const url = `${window.location.origin}/task/${taskId}`;
    const text = `${taskTitle} - Tharwa`;

    // Try native share API first (mobile)
    if (navigator.share) {
        try {
            await navigator.share({ title: text, url });
            return true;
        } catch (error) {
            // User cancelled or share failed - fallback to copy
            if ((error as Error).name !== 'AbortError') {
                return copyToClipboard(url);
            }
            return false;
        }
    }

    // Fallback to copy
    return copyToClipboard(url);
}

export function getTaskUrl(taskId: string): string {
    return `${window.location.origin}/task/${taskId}`;
}
