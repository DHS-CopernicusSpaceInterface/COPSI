import { enableProdMode } from '@angular/core';
import { platformBrowser } from '@angular/platform-browser';

import { AppModule } from './app/app.module';
import { environment } from './assets/environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowser().bootstrapModule(AppModule)
  .catch(err => console.error(err));
