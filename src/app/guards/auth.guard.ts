import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";
import Swal from "sweetalert2";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root'})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if(!this.authService.isLoggedIn()) {
            this.authService.logout();
            return false;
        }
        const expectRoles: string[] = route.data['roles'];
        if(expectRoles && !this.authService.hasAnyRole(expectRoles)) {
            Swal.fire('Acceso denegado',
                `Hola ${this.authService.getUsername()} no tienes acceso a este recurso!`,
                'warning');
            return false;
        }
        return true;
    }
}