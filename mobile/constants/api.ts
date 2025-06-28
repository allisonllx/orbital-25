import Constants from "expo-constants";

export const API_HOST =
    Constants.expoConfig?.extra?.EXPRESS_HOST_URL ?? 'http://localhost:3000';