import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SpinnerComponent } from '../spinner/spinner.component';
import * as moment from 'moment';
import { ExchangeService } from '../services/exchange.service';
import { AlertComponent } from '../alert/alert.component';
import { AppConfig } from '../services/app.config';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  BAD_REQUEST_MSG = "Your request cannot be processed by the server. Please check the request's parameters and try again.";
  INTERNAL_SERVER_ERROR_MSG = "There was a problem processing your request.";
  SERVICE_GATEWAY_TIMEOUT_MSG = "The service is temporarily unavailable. Please try again later.";
  NOT_ALLOWED_MSG = "You are not authorized to perform this request.";
  NOT_FOUND_MSG = "Request or product not available on the server.";
  TOO_MANY_MSG = "Maximum number of requests exceeded. Please wait the completion of the ongoing requests.";
  PROTOCOL_UNAVAILABLE_MSG = "One of the selected GSS protocols is unavailable";
  QL_SUBPATH = "AttachedFiles";
  QL_SUBPATH_STAC = "quicklook";
  DOWNLOAD_SUBPATH = "$value";
  DOWNLOAD_SUBPATH_STAC = "download";
  NO_PREVIEW_SUBPATH = "assets/images/no-preview-1.png";
  constructor(private router: Router,
              private spinner: SpinnerComponent,
              private exchangeService: ExchangeService,
              private alert: AlertComponent
  ) {
    if (AppConfig.settings && AppConfig.settings.quicklookSubPath) {
      this.QL_SUBPATH = AppConfig.settings.quicklookSubPath;
    }
    if (AppConfig.settings && AppConfig.settings.quicklookSubPathStac) {
      this.QL_SUBPATH_STAC = AppConfig.settings.quicklookSubPathStac;
    }
    if (AppConfig.settings && AppConfig.settings.downloadSubPath) {
      this.DOWNLOAD_SUBPATH = AppConfig.settings.downloadSubPath;
    }
    if (AppConfig.settings && AppConfig.settings.downloadSubPathStac) {
      this.DOWNLOAD_SUBPATH_STAC = AppConfig.settings.downloadSubPathStac;
    }
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    /* Spinner Service On */
    const now = moment.now().toLocaleString();
    if(
      request.url.indexOf(this.DOWNLOAD_SUBPATH) < 0 &&
      request.url.indexOf(this.DOWNLOAD_SUBPATH_STAC) < 0 &&
      request.url.indexOf(this.QL_SUBPATH) < 0 &&
      request.url.indexOf(this.QL_SUBPATH_STAC) < 0 &&
      request.url.indexOf(this.NO_PREVIEW_SUBPATH) < 0 &&
      request.url.indexOf("/token") < 0
    ) {
      this.spinner.setOn(now);
    }
    return next.handle(request).pipe(
      tap(evt => {
        if (evt instanceof HttpResponse) {
          /* Spinner Service Off */
          if(request.url.indexOf(this.DOWNLOAD_SUBPATH) < 0) {
            this.spinner.setOff(now);
          }
        }
      }),
      catchError(err => {
        /* Spinner Service Off */
        if(request.url.indexOf(this.DOWNLOAD_SUBPATH) < 0) {
          this.spinner.setOff(now);
        }
        //console.log('Error Interceptor: ', err);
        if (err.url.indexOf(this.QL_SUBPATH) >= 0 || err.url.indexOf(this.QL_SUBPATH_STAC) >= 0) {
          return this.getSimplePlaceholderResponse(request);
        }

        switch (err.status) {
          case 401: {
            /* auto logout if 401 response returned from api */
            this.exchangeService.setIsLogged(false);
            break;
          }
          case 400: {
            if(request.url.indexOf(this.QL_SUBPATH) < 0) {
              this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.BAD_REQUEST_MSG);
            }
            break;
          }
          case 403: {
            if(request.url.indexOf(this.QL_SUBPATH) < 0) {
              this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.NOT_ALLOWED_MSG);
            }
            break;
          }
          case 404: {
            if(request.url.indexOf(this.QL_SUBPATH) < 0) {
              this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.NOT_FOUND_MSG);
            }
            this.reloadCurrentRoute();
            break;
          }
          case 429: {
            if(request.url.indexOf(this.QL_SUBPATH) < 0) {
              this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.TOO_MANY_MSG);
            }
            break;
          }
          case 500: {
            if(request.url.indexOf(this.QL_SUBPATH) < 0 && request.url.indexOf(this.QL_SUBPATH_STAC) < 0) {
              this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.INTERNAL_SERVER_ERROR_MSG + "<br><br>" + err.message);
            }
            break;
          }
          case 503: {
            if(request.url.indexOf(this.QL_SUBPATH) < 0) {
              this.alert.showErrorAlert("ERROR " + err.message, this.SERVICE_GATEWAY_TIMEOUT_MSG);
            }
            break;
          }
          case 504: {
            if(request.url.indexOf(this.QL_SUBPATH) < 0) {
              this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.SERVICE_GATEWAY_TIMEOUT_MSG);
            }
            break;
          }
          case 200: {
            // Manage stac communication error which answer with 200 and message: Http failure during parsing for...
            if(request.url.indexOf(this.QL_SUBPATH) < 0) {
              this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.INTERNAL_SERVER_ERROR_MSG + "<br><br>" + err.message);
            }
            break;
          }
          default: {
            console.log("PRINT ERROR: ", err);
            if(request.url.indexOf(this.QL_SUBPATH) < 0) {
              this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, this.INTERNAL_SERVER_ERROR_MSG + "<br><br>" + err.message);
            }
            break;
          }
        }
        return throwError(() => err);
      }));
  }

  private getSimplePlaceholderResponse(request: HttpRequest<any>): Observable<HttpEvent<any>> {
    const placeholderUrl = 'src/assets/images/no-preview-1.png';

    const httpResponse = new HttpResponse({
      body: null,
      headers: request.headers.set('Location', placeholderUrl),
      status: 200,
      statusText: 'OK',
      url: placeholderUrl
    });

    return of(httpResponse);
  }

  reloadCurrentRoute() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
        this.router.navigate([currentUrl]);
    });
  }
}
