import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { Observable } from 'rxjs';
import { ExchangeService } from '../services/exchange.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {

  constructor(private oauthService: OAuthService,
              private exchangeService: ExchangeService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

      let hasIdToken = this.oauthService.hasValidIdToken();
      let hasAccessToken = this.oauthService.hasValidAccessToken();
      if (hasIdToken && hasAccessToken) {
        //console.log("user is logged");
        //this.exchangeService.setIsLogged(true);
        return true;
      } else {
        //console.log("user is NOT logged");
        this.exchangeService.setIsLogged(false);
        return true;
      }

  }

}
