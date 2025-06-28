const ip = require('ip');
import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => ({
    name: 'NUSeek',
    slug: 'nuseek',
    extra: {
        EXPRESS_HOST_URL: process.env.EXPRESS_HOST_URL,
        SOCKET_HOST: `ws://${ip.address()}:3000`,
    },
});