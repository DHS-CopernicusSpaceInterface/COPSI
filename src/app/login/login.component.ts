import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Subscription } from 'rxjs';
import { AppConfig } from '../services/app.config';
import { ExchangeService } from '../services/exchange.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {

  public userIsLogged = false;  // temp variable to show login form
  public loginText = AppConfig.settings.loginSettings.text;
  public loginButtonText = AppConfig.settings.loginSettings.buttonText;
  isLoggedSubscription!: Subscription;

  constructor(private oauthService: OAuthService,
    private exchangeService: ExchangeService) {
  }

  ngOnInit(): void {
    if(this.oauthService.hasValidAccessToken()) {
      this.userIsLogged = true;
      this.exchangeService.setIsLogged(true);
    } else {
      this.userIsLogged = false
      this.exchangeService.setIsLogged(false);
    }
    this.setComponentVisibility(this.userIsLogged);
  }

  ngAfterViewInit(): void {
    this.isLoggedSubscription = this.exchangeService.isLoggedExchange.subscribe((value) => {
      if (typeof(value) === 'boolean') {
        this.setComponentVisibility(value);
      }
    });

  }

  ngOnDestroy(): void {
    this.isLoggedSubscription.unsubscribe();
  }

  onLoginClicked() {
    this.oauthService.initCodeFlow();
  }


  setComponentVisibility(isLogged: boolean) {
    if(isLogged) {
      document.getElementById('main-login-container')!.style.display = 'none';
    } else {
      document.getElementById('main-login-container')!.style.display = 'flex';
    }
  }


}
