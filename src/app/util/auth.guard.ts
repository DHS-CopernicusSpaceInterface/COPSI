import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private oauthService: OAuthService,
              private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

      let hasIdToken = this.oauthService.hasValidIdToken();
      console.log("hasIdToken", hasIdToken);
      let hasAccessToken = this.oauthService.hasValidAccessToken();
      console.log("hasAccessToken", hasAccessToken);
      if (hasIdToken && hasAccessToken) {
        console.log("logged");
        console.log(this.oauthService.getIdentityClaims());
        console.log(this.oauthService.getAccessToken());
        return true;
      } else {
        this.router.navigate(['/login']);
        console.log("NOT logged");
        return false;
      }
      
  }
  
}
