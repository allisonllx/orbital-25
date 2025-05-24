import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => ({
    name: 'NUSeek',
    slug: 'nuseek',
    extra: {
        EXPRESS_HOST_URL: process.env.EXPRESS_HOST_URL,
    },
});