import { JwtPayload } from "../models/Auth.model";

export class JwtHelper {

    static decodeToken(token: string): JwtPayload | null {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (e) {
            return null;
        }
    }

    static isTokenExpired(token: string): boolean {
        const payload = this.decodeToken(token);
        if (!payload) return true;
        const now = Math.floor(Date.now() / 1000);
        return payload.exp < now;
    }
}