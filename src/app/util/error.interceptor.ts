import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { OAuthService, OAuthStorage } from 'angular-oauth2-oidc';
import { SpinnerComponent } from '../spinner/spinner.component';
import * as moment from 'moment';
import { ExchangeService } from '../services/exchange.service';
import { AlertComponent } from '../alert/alert.component';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  BAD_REQUEST_MSG = "Your request cannot be processed by the server. Please check the request's parameters and try again.";
  INTERNAL_SERVER_ERROR_MSG = "There was a problem processing your request.";
  SERVICE_GATEWAY_TIMEOUT_MSG = "The service is temporarily unavailable. Please try again later.";
  NOT_ALLOWED_MSG = "You are not authorized to perform this request.";
  NOT_FOUND_MSG = "Request or product not available on the server.";
  TOO_MANY_MSG = "Maximum number of requests exceeded. Please wait the completion of the ongoing requests.";
  constructor(private oauthStorage: OAuthStorage,
              private oauthService: OAuthService,
              private router: Router,
              private spinner: SpinnerComponent,
              private exchangeService: ExchangeService,
              private alert: AlertComponent
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    /* Spinner Service On */
    const now = moment.now().toLocaleString();
    this.spinner.setOn(now);
    return next.handle(request).pipe(
      tap(evt => {
        if (evt instanceof HttpResponse) {
          /* Spinner Service Off */
          this.spinner.setOff(now);
        }
      }),
      catchError(err => {
        /* Spinner Service Off */
        this.spinner.setOff(now);
        console.log('Error Interceptor: ', err);

        switch (err.status) {
          case 401: {
            /* auto logout if 401 response returned from api */
            console.log("ERROR 401: Not Authorized");
            this.oauthService.revokeTokenAndLogout();       
            this.exchangeService.setIsLogged(false);  
            break;  
          }
          case 400: {
            this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.BAD_REQUEST_MSG);
            /* Show alert on any other error */
            /*if (err.error.hasOwnProperty('error')) {
              this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, err.error.error.message);
            } else {
              this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, err.message);
            }*/
            break;
          }
          case 403: {
            this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.NOT_ALLOWED_MSG);
            break;
          }
          case 404: {
            this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.NOT_FOUND_MSG);    
            this.reloadCurrentRoute();
            break;
          }
          case 429: {
            this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.TOO_MANY_MSG);    
            break;
          }
          case 500: {
            this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.INTERNAL_SERVER_ERROR_MSG);
            break;
          }
          case 503: 
          case 504: {
            this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.SERVICE_GATEWAY_TIMEOUT_MSG);
            break;
          }
          default: {
            this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.INTERNAL_SERVER_ERROR_MSG);
            break;
          }      
        } 
        return throwError(err);
      }));
  }

  reloadCurrentRoute() {
    console.log('reloadCurrentRoute');
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
        this.router.navigate([currentUrl]);
    });
  }
}
