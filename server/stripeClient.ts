// Stripe client wrapper for payment processing
// This is dynamically imported only when payment features are used

let stripe: any = null;

/**
 * Get Stripe publishable key for client-side initialization
 */
export function getStripePublishableKey(): string {
    const key = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!key) {
        throw new Error('STRIPE_PUBLISHABLE_KEY is not configured');
    }
    return key;
}

/**
 * Get uncachable Stripe instance (creates new instance each time)
 * This ensures we don't cache sensitive API keys
 */
export async function getUncachableStripeClient() {
    // Lazy-load Stripe SDK
    let Stripe: any;
    try {
        // @ts-ignore - Stripe is an optional dependency for payment features
        Stripe = (await import('stripe')).default;
    } catch (error) {
        console.error('Stripe SDK not installed. Run: npm install stripe');
        throw new Error('Stripe SDK is required for payment processing');
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    return new Stripe(stripeSecretKey, {
        apiVersion: '2024-12-18.acacia' as any,
        typescript: true,
    });
}

/**
 * Get cached Stripe instance (reuses same instance)
 */
export async function getStripeClient() {
    if (!stripe) {
        stripe = await getUncachableStripeClient();
    }
    return stripe;
}
