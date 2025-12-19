import { Component, OnInit } from '@angular/core';
import { AppConfig } from '../services/app.config';

let footerContainer: any;
let footerMainDiv: any;

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})
export class FooterComponent implements OnInit {

  public showInfo = false;
  public version = AppConfig.settings.version;
  public infoLogosLeft = AppConfig.settings.infoLogosLeft;
  public infoLogosRight = AppConfig.settings.infoLogosRight;

  constructor() { }

  ngOnInit(): void {
    footerContainer = document.getElementById('footer-container-div')!;
    footerMainDiv = document.getElementById('footer-main-div')!;
  }

  onInfoIconClicked(event: any) {
    this.showInfo = !this.showInfo;
    if (this.showInfo) {
      footerContainer.style.left = '0';
      footerMainDiv.style.display = 'flex';
      setTimeout(() => {
        footerMainDiv.style.marginRight = '0';
        footerMainDiv.style.opacity = '1.0';
      }, 10);
    } else {
      footerMainDiv.style.marginRight = '-0.5rem';
      footerMainDiv.style.opacity = '0.0';
      setTimeout(() => {
        footerContainer.style.left = 'auto';
        footerMainDiv.style.display = 'none';
      }, 250);
    }
    event.stopPropagation();
  }
}
