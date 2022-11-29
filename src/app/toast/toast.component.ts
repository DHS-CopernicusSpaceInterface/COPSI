import { Component, Injectable } from '@angular/core';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
@Injectable({
  providedIn: 'root'
})
export class ToastComponent {

  public message: string = '';
  constructor() {

  }

  showToast(message: string) {
    this.message = message;
    document.getElementById('toast-title-container-div')!.style.opacity = '1.0';
    document.getElementById('toast-title-container-div')!.style.top = '3rem';
    document.getElementById('toast-title')!.innerHTML = this.message;
    setTimeout(function(){
      document.getElementById('toast-title-container-div')!.style.opacity = '0.0';
      document.getElementById('toast-title-container-div')!.style.top = '2.5rem';
    }, 5000);
  }

  showInfoToast(message: string) {
    document.getElementById('toast-main-div')!.style.backgroundColor = '#419641';
    this.showToast(message);
  }
}

