import { useCallback } from 'react';
import { useDevice } from '@deriv-com/ui';

export const useMobileBridge = () => {
    const { isDesktop } = useDevice();
    
    const sendBridgeEvent = useCallback(async (event: 'trading:back' | 'trading:home', fallback?: () => void | Promise<void>) => {
        try {
            if (!isDesktop && window.DerivAppChannel?.postMessage) {
                const message: DerivAppChannelMessage = { event };
                window.DerivAppChannel.postMessage(JSON.stringify(message));
                return true; // Successfully sent via bridge
            } else if (fallback) {
                await fallback();
                return true; // Successfully executed fallback
            }
            return false; // No action taken
        } catch (error) {
            console.error('Failed to send bridge message:', error);
            // Execute fallback on error
            if (fallback) {
                try {
                    await fallback();
                    return true; // Fallback executed successfully
                } catch (fallbackError) {
                    console.error('Fallback execution failed:', fallbackError);
                    return false;
                }
            }
            return false;
        }
    }, [isDesktop]);
    
    const isBridgeAvailable = useCallback(() => {
        return !isDesktop && !!window.DerivAppChannel?.postMessage;
    }, [isDesktop]);
    
    return { 
        sendBridgeEvent, 
        isBridgeAvailable,
        isDesktop 
    };
};
