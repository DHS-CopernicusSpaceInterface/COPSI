import { Component, Injectable, OnInit } from '@angular/core';

declare var $: any;

@Component({
    selector: 'app-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.scss'],
    standalone: false
})
@Injectable({
    providedIn: 'root'
})
export class AlertComponent implements OnInit {

  public alertTitle: string = 'Generic Error'
  public alertMessage: string = 'Alert!';
  constructor() { }

  ngOnInit() {
  }

  showInfoAlert (message: string) {
    //this.showAlert(message);
  }

  showSuccessAlert (message: string) {
    //this.showAlert(message);
  }

  showWarningAlert (message: string) {
    //this.showAlert(message);
  }

  showErrorAlert (title: string, message: string) {
    this.alertTitle = title;
    this.alertMessage = message;
    document.getElementById('title')!.innerHTML = this.alertTitle;
    document.getElementById('message')!.innerHTML = this.alertMessage;
    document.getElementById('main-alert-container')!.style.display = 'flex';
  }

  dismiss() {    
    document.getElementById('main-alert-container')!.style.display = 'none';
  }
}
