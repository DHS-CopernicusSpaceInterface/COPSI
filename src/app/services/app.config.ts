import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@assets/environments/environment';

const httpOptions = {
  headers: new HttpHeaders({
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  })
};

@Injectable()
export class AppConfig {
    static settings: any;
    constructor(private http: HttpClient) {}

    load() {
        const jsonFile = environment.configFile;
        return new Promise<void>((resolve, reject) => {
            firstValueFrom(this.http.get(jsonFile, httpOptions)).then((response : any) => {
               AppConfig.settings = response;
               resolve();
            }).catch((response: any) => {
               reject(`Could not load file '${jsonFile}': ${JSON.stringify(response)}`);
            });
        });
    }
}
