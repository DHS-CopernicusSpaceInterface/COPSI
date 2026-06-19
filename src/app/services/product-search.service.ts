import { Injectable, DestroyRef, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { catchError, filter, map, tap } from 'rxjs/operators';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { AppConfig } from '../services/app.config';
import { ExchangeService } from './exchange.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

export interface DownloadProgress {
  state: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  progress?: number;
  blob?: Blob;
}

@Injectable({
  providedIn: 'root'
})
export class ProductSearchService {
  private gssSelectedProtocol: string = "";
  private exchangeService = inject(ExchangeService);
  private destroyRef = inject(DestroyRef);
  private isLogged = false;

  constructor(
    private http: HttpClient,
  ) {
    this.exchangeService.selectedGssProtocol
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (value) => {
          if (typeof(value) === 'string') {
            this.gssSelectedProtocol = value;
          }
        },
        error: (error) => {
          console.error('Error on processing:', error);
        }
      });
    this.exchangeService.isLoggedExchange
      .subscribe({
        next: (value) => {
          if (typeof(value) === 'boolean') {
            this.isLogged = value;
          }
        },
        error: (error) => {
          console.error('Error on getting logged status', error);
        }
      })
  }

  parseFilter(str: string) {
    let processedString='';
    if (this.gssSelectedProtocol === "OData") {
      /* ODATA */
      let filterArray: any = [];
      const regexContains = /^\*(.*)\*/;
      const regexStartsWith = /[^;]+\*(?=$|;)/;
      const regexEndsWith = /^\*(.*)/;
      const logicTestArray = [
        "and", "AND", "or", "OR", "("
      ];
      let filterPortions: string[] = str.split(' ');


      try {
        filterPortions.forEach((portion: string) => {
          if(regexContains.test(portion)) {
            if (!logicTestArray.includes(filterArray[filterArray.length - 1]) && filterArray.length > 0) {
              filterArray.push("and");
            }
            filterArray.push(`contains(Name, '${portion.replace(/\*/g,'')}')`);
          } else if (regexEndsWith.test(portion)) {
            if (!logicTestArray.includes(filterArray[filterArray.length - 1]) && filterArray.length > 0) {
              filterArray.push("and");
            }
            filterArray.push(`endswith(Name, '${portion.replace(/\*/g,'')}')`);
          } else if (regexStartsWith.test(portion)) {
            if (!logicTestArray.includes(filterArray[filterArray.length - 1]) && filterArray.length > 0) {
              filterArray.push("and");
            }
            filterArray.push(`startswith(Name, '${portion.replace(/\*/g,'')}')`);
          } else {
            filterArray.push(portion);
          }
        });
        processedString = filterArray.join(' ');

      } catch (error) {
        console.error("Error converting Filter!");
        console.error(error);
      }
    } else {
      /* STAC */
      processedString = str;
    }
    return processedString;
  }

  getProductsCount(url:string) {
    return this.http.get<any>(
      url,
      httpOptions
    )
  }

  getProducts(url:string) {
    return this.http.get<any>(
      url,
      httpOptions
    )
  }
  getProductsStac(url: string, body: any) {
    return this.http.post<any>(
      url,
      body,
      httpOptions
    )
  }

  /*
   search(searchOptions: any) is used to trigger the odata/${this.odataVersion}/Products request
   searchOptions = {
    filter: string (OData filter syntax),
    top: number,
    skip: number,
    order: string (must be a Products entity Property),
    sort: string (asc|desc)
   }
  */
  search(searchOptions: any) {
    let order = 'PublicationDate';
    let sort = 'desc';
    let skip = 0;
    let productsCountUrl = AppConfig.settings.serviceUrl + `/odata/${AppConfig.settings.odataVersion}/Products?$count=true&$top=1`;
    let productsUrl = AppConfig.settings.serviceUrl + `/odata/${AppConfig.settings.odataVersion}/Products?$expand=Attributes`;
    //The option $count=true requires only the $filter parameter. No $orderby or $skip is needed for the count.
    //The $top is fixed to 1
    let filter = "";
    let checkWildcard = (searchOptions && searchOptions.filter) ? searchOptions.filter.replace(/\*/g, '') : '';
    if(searchOptions && searchOptions.filter && searchOptions.filter.trim() && checkWildcard) {
      filter = this.parseFilter(searchOptions.filter);
    }
    if(searchOptions && searchOptions.productFilter) {
      filter = (filter) ? filter + ' and (' + searchOptions.productFilter + ')' : searchOptions.productFilter
    }
    if(searchOptions && searchOptions.attributeFilter) {
      filter = (filter) ? filter + ' and (' + searchOptions.attributeFilter + ')' : searchOptions.attributeFilter
    }
    if(searchOptions && searchOptions.geoFilter) {
      filter = (filter) ? filter + ' and ' + searchOptions.geoFilter : searchOptions.geoFilter
    }
    if(filter) {
      productsUrl+='&$filter=' + filter;
      productsCountUrl+='&$filter=' + filter;
    }
    if(searchOptions && searchOptions.top) {
      productsUrl+='&$top=' + searchOptions.top;
    } else {
      productsUrl+='&$top=' + AppConfig.settings.searchOptions.pageSize;
    }
    if(searchOptions && searchOptions.skip ) {
      skip = searchOptions.skip;
    }
    if(searchOptions && searchOptions.order ) {
      order = searchOptions.order;
    }
    if(searchOptions && searchOptions.sort ) {
      sort = searchOptions.sort;
    }
    productsUrl+='&$skip=' + skip + '&$orderby=' + order + ' ' + sort.toLowerCase();

    console.log("Sent search using OData Filter Object: ", searchOptions);

    return forkJoin({
      count: this.getProductsCount(productsCountUrl).pipe(map((res) => res), catchError(e => of(e))),
      products: this.getProducts(productsUrl).pipe(map((res) => res), catchError(e => of(e)))
    })
    .pipe(
      map((response: { count: object; products: object }) => {
        const count: any = response.count;
        const products: any = response.products;
        let result: any = products;
        if (!result.hasOwnProperty('@odata.count')) {
          result['@odata.count'] = count['@odata.count'];
        }

        return(result);
      })
    )
  }

  searchStac(stacFilter: any) {
    let productsUrl = AppConfig.settings.serviceUrlStac + '/stac/search';
    console.log("Sent search using STAC Filter Object: ", stacFilter);
    return this.getProductsStac(productsUrl, stacFilter).pipe(map((res) => res), catchError(e => of(e)));
  }

  /* getQL(uuid: string) is used to check if there is a quicklook for that product id */
  getQL(uuid: string) {
    let uuidURL = AppConfig.settings.quicklookURL.replace('<base_url>', AppConfig.settings.serviceUrl).replace('<odata_version>', AppConfig.settings.odataVersion).replace('<uuid>', uuid);

    return this.http.get(
      uuidURL, {
        responseType: 'blob'
      })
    .pipe(
      catchError(e => of(e)));
  }

  /* getQLStac(productName: string) is used to check if there is a quicklook for that product id */
  getQLStac(productName: string) {
    let quicklookURL = AppConfig.settings.quicklookURLStac.replace('<base_url>', AppConfig.settings.serviceUrlStac).replace('<productName>', productName);

    return this.http.get(
      quicklookURL, {
        responseType: 'blob'
      })
    .pipe(
      catchError(err => {
        return this.http.get("assets/images/no-preview-1.png", { responseType: 'blob' });
      }));
  }



  private mapHttpEvent(event: HttpEvent<Blob>): DownloadProgress | null {
    switch (event.type) {
      case HttpEventType.Sent:
        return { state: 'PENDING' };

      case HttpEventType.DownloadProgress:
        if (event.total) {
          const progress = Math.round((event.loaded / event.total) * 100);
          return {
            state: 'IN_PROGRESS',
            progress
          };
        }
        return { state: 'IN_PROGRESS' };

      case HttpEventType.Response:
        return {
          state: 'DONE',
          progress: 100,
          blob: (event.body === null ? undefined : event.body)
        };

      default:
        return null;
    }
  }

  download(url: string, filename: string): Observable<DownloadProgress> {
    return this.http.get(url, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob'
    }).pipe(
      map(event => this.mapHttpEvent(event)),
      filter(progress => progress !== null),
      tap(progress => {
        if (progress.state === 'DONE' && progress.blob) {
          this.saveWithLink(progress.blob, filename);
        }
      })
    );
  }

  checkOdataService() {
    if (!this.isLogged) return of({ error: false, data: null });
    const url = AppConfig.settings.serviceUrl + `/odata/${AppConfig.settings.odataVersion}/$metadata`;
    return this.http.get<any>(url, { observe: 'response' }).pipe(
      map(res => ({
        error: false,
        data: res
      })),
      catchError(e => of({
        error: true,
        data: null,
        details: e
      }))
    );
  }

  getCollections() {
    if (!this.isLogged) return of({ error: false, data: null });
    const url = AppConfig.settings.serviceUrlStac + '/stac/collections';
    return this.http.get<any>(url, httpOptions).pipe(
      map(res => ({
        error: false,
        data: res
      })),
      catchError(e => of({
        error: true,
        data: null,
        details: e
      }))
    );
  }

  getQueryables() {
    if (!this.isLogged) return of({ error: false, data: null });
    const url = AppConfig.settings.serviceUrlStac + '/stac/queryables';
    return this.http.get<any>(url, httpOptions).pipe(
      map(res => ({
        error: false,
        data: res
      })),
      catchError(e => of({
        error: true,
        data: null,
        details: e
      }))
    );
  }

  private saveWithLink(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
