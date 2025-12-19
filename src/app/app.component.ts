import { Component, OnInit} from '@angular/core';
import { AuthConfig, OAuthInfoEvent, OAuthService, OAuthSuccessEvent } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks';
import { AppConfig } from './services/app.config';
import { ExchangeService } from './services/exchange.service';
import { authFlowConfig } from './services/oauth/auth.config';
import { ToastComponent } from './toast/toast.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements OnInit {

  title: string = 'COPSI';
  name: string = "";
  isFirst: boolean = false;
  ssoConfig: AuthConfig = new AuthConfig({});

  constructor( private oauthService: OAuthService,
    private exchangeService: ExchangeService,
    private toast: ToastComponent) {
  }

  ngOnInit(): void {
    this.initConfig();
    this.configureSSO();
    const userClaims: any = this.oauthService.getIdentityClaims();
    this.name = (userClaims && userClaims.name) ? userClaims.name : "";

    this.oauthService.events.subscribe(event => {
      if (event instanceof OAuthSuccessEvent) {
        if(event.type == 'token_received') {
          //console.log('token_received');
          if(this.isFirst){
            this.toast.showInfoToast('success', 'LOGIN SUCCESSFUL!')
            this.isFirst = false;
          }
          this.exchangeService.setIsLogged(true);
        }

      } else if (event instanceof OAuthInfoEvent) {
        if(event.type == 'token_expires' && AppConfig.settings?.keycloak.useSilentRefresh) {
          //console.log('token is expiring...');
          this.oauthService.refreshToken();
        }
      }
      else {
        console.warn(event);
      }
    });
  }

  initConfig() {
    if(AppConfig.settings.keycloak) {
      const keycloakSettings = AppConfig.settings.keycloak;
      keycloakSettings.redirectUri = window.location.origin + AppConfig.settings.baseUrl;
      //keycloakSettings.redirectUri = AppConfig.settings.keycloak.redirectUri;
      this.ssoConfig = keycloakSettings;
    } else {
      const keycloakSettings = authFlowConfig;
      keycloakSettings.redirectUri = window.location.origin + AppConfig.settings.baseUrl;
      //keycloakSettings.redirectUri = AppConfig.settings.keycloak.redirectUri;
      this.ssoConfig = keycloakSettings;
    }
  }

  configureSSO() {
      if(!(this.oauthService.hasValidAccessToken() && this.oauthService.hasValidIdToken()))  {
        this.isFirst = true;
      }
      this.oauthService.configure(this.ssoConfig);
      this.oauthService.tokenValidationHandler = new JwksValidationHandler();
      this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  get token() {
    let claims: any = this.oauthService.getIdentityClaims();
    return claims ? claims : null;
  }

}
