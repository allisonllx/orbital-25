const ip = require('ip');
import 'dotenv/config';
import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config } : ConfigContext): ExpoConfig => {
    const apiHost = process.env.EXPRESS_HOST_URL ?? `http://${ip.address()}:3000`;

    const socketHost =
        (process.env.SOCKET_HOST ?? apiHost).replace(/^http(s?):/, 'ws$1:'); // ws://ip:3000 or wss://prod

        return {
            ...config,
            name: 'NUSeek',
            slug: 'nuseek',
            owner: 'allisonllx',     
            runtimeVersion: { policy: 'appVersion' },        
            extra: {
                ...config.extra,  // preserve extras if any
                apiUrl: process.env.EXPO_PUBLIC_API_URL ?? apiHost,
                EXPRESS_HOST_URL: apiHost,
                SOCKET_HOST: socketHost,
            },
          } as ExpoConfig;
};