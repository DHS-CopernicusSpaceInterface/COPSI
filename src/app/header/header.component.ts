import { Component, OnInit, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, style, animate, group, state } from '@angular/animations';
import { ExchangeService } from '../services/exchange.service';
import { Subscription, throwError } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import { AppConfig } from '../services/app.config';
import jwt_decode from 'jwt-decode';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    animations: [
        trigger('headerMenuAnimation', [
            state('open', style({
                /* 'top': '3rem', 'opacity': 1, 'visibility': 'visible' */
                'opacity': 1, 'visibility': 'visible'
            })),
            state('closed', style({
                /* 'top': '2.5rem', 'opacity': 0, 'visibility': 'hidden' */
                'opacity': 0, 'visibility': 'hidden'
            })),
            transition('closed => open', [
                animate('250ms ease-in')
            ]),
            transition('open => closed', [
                animate('250ms ease-out')
            ])
        ])
    ],
    standalone: false
})
export class HeaderComponent implements OnInit, OnDestroy {

  /* Base Map Styles Layer Data Array */
  /* Managed default OSM Tile layer */
  public mapLayers: any;

  public mapStyles = [
    'globe',
    'plane'
  ];
  public mapStyle: string = '';
  public mapLayer: string = '';
  public mapLayersPreviewpaths: any = AppConfig.settings.styles;
  /* [
    {
      "name": "Terrain",
      "path": "./assets/images/Preview_Terrain.png",
    },
    {
      "name": "OSM",
      "path": "./assets/images/Preview_OSM.png"
    },
    {
      "name": "Terrain_Light",
      "path": "./assets/images/Preview_Terrain_Light.png",
    },
    {
      "name": "Preview_Black_Marble",
      "path": "./assets/images/Preview_Black_Marble.png",
    },
    {
      "name": "Preview_Blue_Marble",
      "path": "./assets/images/Preview_Blue_Marble.png",
    },
    {
      "name": "Preview_S2_Cloudless",
      "path": "./assets/images/Preview_S2_Cloudless.png"
    }
  ]; */
  // public mapOverlays: any;
  // public mapOverlay: string = '';
  // public mapOverlaysPreviewpaths: any = [
  //   {
  //     "name": "No Overlay",
  //     "path": "./assets/images/Overlay_None.png",
  //   },
  //   {
  //     "name": "Overlay",
  //     "path": "./assets/images/Overlay_Bright.png"
  //   }
  // ];
  public mapLayerPrevious: string = '';
  //public mapOverlayPrevious: string = '';
  public showGeoSearchToolbar: boolean = AppConfig.settings.geoSearchSettings.showGeoSearchToolbar;
  public hideGeoSearchToolbar: boolean = false;

  public gssProtocols = AppConfig.settings.searchOptions.gssSupportedProtocols;
  //public gssSelectedProtocol = signal(AppConfig.settings.searchOptions.defaultGssProtocol || this.gssProtocols[0]);
  public gssSelectedProtocol: string = AppConfig.settings.searchOptions.defaultGssProtocol;

  isOdataSubscription!: Subscription;
  isStacSubscription!: Subscription;
  updateGssProtocolSubscription!: Subscription;
  public isOdataActive: boolean = false;
  public isStacActive: boolean = false;
  

  public showUser: boolean = false;
  public showUserTimeoutId: any;
  public showSettings: boolean = false;
  public showSettingsTimeoutId: any;
  public showStyles: boolean = false;
  public showStylesTimeoutId: any;
  public showLayers: boolean = false;
  public showLayersTimeoutId: any;
  //public showOverlays: boolean = false;
  //public showOverlaysTimeoutId: any;
  public showProtocols: boolean = false;
  public showProtocolsTimeoutId: any;
  public token: any;
  public name: string = '';
  public role: string = '';
  public centreInfo: any = AppConfig.settings.centreInfo;
  public editProfileUrl: string = "";
  public changePasswordUrl: string = "";
  public showUserEditButton: boolean = AppConfig.settings.headerSettings.showUserEditButton;
  public showPasswordChangeButton: boolean = AppConfig.settings.headerSettings.showPasswordChangeButton;

  public styleContainer: any;
  public layerContainer: any;
  //public overlayContainer: any;
  //public overlayButton: any;
  public protocolContainer: any;
  constructor(
    private exchangeService: ExchangeService,
    private oauthService: OAuthService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const userClaims: any = this.oauthService.getIdentityClaims();
    if (userClaims) {
      this.name = (userClaims && userClaims.preferred_username) ? userClaims.preferred_username : "";
      this.token = this.oauthService.getAccessToken();
      let tokenDecodedObj = this.decodeToken(this.token);
      this.role = tokenDecodedObj.resource_access[tokenDecodedObj.azp].roles[0];
    }
    this.mapLayers = AppConfig.settings.styles;
    this.mapStyle = AppConfig.settings.mapSettings.projection;
    this.mapLayer = this.mapLayers[0].name;
    //this.mapOverlays = AppConfig.settings.overlays;
    //this.mapOverlay = this.mapOverlays[0].name;
    this.editProfileUrl = AppConfig.settings.keycloak.editProfileUrl.replace('<issuer>', AppConfig.settings.keycloak.issuer).replace('<clientId>', AppConfig.settings.keycloak.clientId);
    this.changePasswordUrl = AppConfig.settings.keycloak.changePasswordUrl.replace('<issuer>', AppConfig.settings.keycloak.issuer).replace('<clientId>', AppConfig.settings.keycloak.clientId);

    this.styleContainer = document.getElementById("style-container")!;
    this.layerContainer = document.getElementById("layer-container")!;
    this.protocolContainer = document.getElementById("protocol-container")!;
    //this.overlayContainer = document.getElementById("overlay-container")!;
    //this.overlayButton = document.getElementById("map-overlay")!;

    this.isOdataSubscription = this.exchangeService.isOdataActiveExchange.subscribe((value) => {
      if (typeof(value) == 'boolean') {
        this.isOdataActive = value;
      }
    });

    this.isStacSubscription = this.exchangeService.isStacActiveExchange.subscribe((value) => {
      if (typeof(value) == 'boolean') {
        this.isStacActive = value;
      }
    });

    this.updateGssProtocolSubscription = this.exchangeService.selectedGssProtocol.subscribe((value) => {
      if (typeof(value) === 'string') {
        //this.gssSelectedProtocol.set(value);
        this.gssSelectedProtocol = value;
        this.cd.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.isOdataSubscription.unsubscribe();
    this.isStacSubscription.unsubscribe();
    this.updateGssProtocolSubscription.unsubscribe();
  }

  onUserMenuIconClick(event: any) {
    const userClaims: any = this.oauthService.getIdentityClaims();
    if (userClaims) {
      this.name = (userClaims.preferred_username) ? userClaims.preferred_username : "";
      this.token = this.oauthService.getAccessToken();
      let tokenDecodedObj = this.decodeToken(this.token);
      this.role = (tokenDecodedObj.hasOwnProperty('resource_access') && tokenDecodedObj.resource_access.hasOwnProperty(tokenDecodedObj.azp)) ? tokenDecodedObj.resource_access[tokenDecodedObj.azp].roles[0] : "unavailable";
    }
    this.showUser = !this.showUser;
    this.showSettings = false;
    this.setUserMenuTimeout();
    event.stopPropagation();
  }

  onSettingsMenuIconClick(event: any) {
    this.showSettings = !this.showSettings;
    this.showUser = false;
    this.setSettingsMenuTimeout();
    event.stopPropagation();
  }

  onMapStyleButtonClicked() {
    if (this.showStyles) {
      this.showStyles = false;
      this.styleContainer.style.display = 'none';
      this.exchangeService.hideGeoSearchToolbar(false);
    } else {
      this.exchangeService.hideGeoSearchToolbar(true);
      this.styleContainer.style.display = 'flex';
      this.showStyles = true;
      this.showLayers = false;
      this.showProtocols = false;
      //this.showOverlays = false;
      this.layerContainer.style.display = 'none';
      this.protocolContainer.style.display = 'none';
      //this.overlayContainer.style.display = 'none';
      this.setStylesTimeout();
    }
  }
  onMapStyleChanged(view: string) {
    this.mapStyle = view;
    this.exchangeService.setMapStyle(view);
    this.cd.detectChanges();
  }

  onMapLayerButtonClicked() {
    if (this.showLayers) {
      this.showLayers = false;
      this.layerContainer.style.display = 'none';
      this.exchangeService.hideGeoSearchToolbar(false);
    } else {
      this.exchangeService.hideGeoSearchToolbar(true);
      this.layerContainer.style.display = 'flex';
      this.showStyles = false;
      this.showProtocols = false;
      this.showLayers = true;
      //this.showOverlays = false;
      this.styleContainer.style.display = 'none';
      this.protocolContainer.style.display = 'none';
      //this.overlayContainer.style.display = 'none';
      this.setLayersTimeout();
    }
  }
  onMapLayerChanged(layer: string) {
    this.mapLayerPrevious = this.mapLayer;
    this.mapLayer = layer;
    this.exchangeService.setMapLayer(layer);
    // if (layer === 'OSM') {
    //   this.onMapOverlayChanged(this.mapOverlays[0].name);
    //   this.overlayButton.classList.add('disabled');
    // } else {
    //   if (this.overlayButton.classList.contains('disabled')) {
    //     this.overlayButton.classList.remove('disabled');
    //   }
    //   if (this.mapOverlayPrevious != this.mapOverlays[0].name && this.mapLayerPrevious === 'OSM') {
    //     this.onMapOverlayChanged(this.mapOverlayPrevious);
    //   }
    // }
    this.cd.detectChanges();
  }

  onGssProtocolChanged(protocolSel: string) {
    //this.gssSelectedProtocol.set(protocolSel);
    //this.exchangeService.setGssProtocol(this.gssSelectedProtocol());
    this.gssSelectedProtocol = protocolSel;
    this.exchangeService.setGssProtocol(this.gssSelectedProtocol);
    this.cd.detectChanges();
  }

  // onMapOverlayButtonClicked() {
  //   if (this.showOverlays) {
  //     this.showOverlays = false;
  //     this.overlayContainer.style.display = 'none';
  //     this.exchangeService.hideGeoSearchToolbar(false);
  //   } else {
  //     this.exchangeService.hideGeoSearchToolbar(true);
  //     this.overlayContainer.style.display = 'flex';
  //     this.showStyles = false;
  //     this.showLayers = false;
  //     this.showOverlays = true;
  //     this.styleContainer.style.display = 'none';
  //     this.layerContainer.style.display = 'none';
  //     this.setOverlaysTimeout();
  //   }
  // }
  // onMapOverlayChanged(overlay: string) {
  //   this.mapOverlayPrevious = this.mapOverlay;
  //   this.mapOverlay = overlay;
  //   this.exchangeService.setMapOverlay(overlay);
  // }

  onShowGeoSearchToolbarClicked(event: any) {
    this.showGeoSearchToolbar = !this.showGeoSearchToolbar;
    this.exchangeService.hideGeoSearchToolbar(!this.showGeoSearchToolbar);
    event.stopPropagation();
  }

  onGssProtocolButtonClicked(event: any) {
    if (this.showProtocols) {
      this.showProtocols = false;
      this.protocolContainer.style.display = 'none';
      this.exchangeService.hideGeoSearchToolbar(false);
    } else {
      this.exchangeService.hideGeoSearchToolbar(true);
      this.protocolContainer.style.display = 'flex';
      this.showStyles = false;
      this.showLayers = false;
      this.showProtocols = true;
      //this.showOverlays = false;
      this.styleContainer.style.display = 'none';
      this.layerContainer.style.display = 'none';
      //this.overlayContainer.style.display = 'none';
      this.setProtocolsTimeout();
    }
  }

  onUserMenuHover(event: any) {
    clearTimeout(this.showUserTimeoutId);
    event.stopPropagation();
  }

  onSettingsMenuHover(event: any) {
    clearTimeout(this.showSettingsTimeoutId);
    event.stopPropagation();
  }

  onStylesMenuHover(event: any) {
    clearTimeout(this.showSettingsTimeoutId);
    clearTimeout(this.showStylesTimeoutId);
    event.stopPropagation();
  }
  onStyleMenuLeave(event: any) {
    this.setSettingsMenuTimeout();
    this.setStylesTimeout();
    event.stopPropagation();
  }

  onLayersMenuHover(event: any) {
    clearTimeout(this.showSettingsTimeoutId);
    clearTimeout(this.showLayersTimeoutId);
    event.stopPropagation();
  }
  onLayerMenuLeave(event: any) {
    this.setSettingsMenuTimeout();
    this.setLayersTimeout();
    event.stopPropagation();
  }

  onOverlaysMenuHover(event: any) {
    clearTimeout(this.showSettingsTimeoutId);
    //clearTimeout(this.showOverlaysTimeoutId);
    event.stopPropagation();
  }
  onOverlaysMenuLeave(event: any) {
    this.setSettingsMenuTimeout();
    //this.setOverlaysTimeout();
    event.stopPropagation();
  }

  onProtocolMenuHover(event: any) {
    clearTimeout(this.showSettingsTimeoutId);
    clearTimeout(this.showProtocolsTimeoutId);
    event.stopPropagation();
  }
  onProtocolMenuLeave(event: any) {
    this.setSettingsMenuTimeout();    
    this.setProtocolsTimeout();
    event.stopPropagation();
  }

  onEditProfileClicked() {
    window.open(this.editProfileUrl, "_blank");
  }

  onChangePasswordClicked() {
    window.open(this.changePasswordUrl, "_blank");
  }

  onLogoutClicked() {
    this.oauthService.logOut();
  }

  setUserMenuTimeout() {
    clearTimeout(this.showUserTimeoutId);
    this.showUserTimeoutId = setTimeout(() => {
      this.showUser = false;
    }, AppConfig.settings.headerSettings.menuAutoHideTimeout);
  }

  setSettingsMenuTimeout() {
    clearTimeout(this.showSettingsTimeoutId);
    this.showSettingsTimeoutId = setTimeout(() => {
      this.showSettings = false;
    }, AppConfig.settings.headerSettings.menuAutoHideTimeout);
  }

  setStylesTimeout() {
    clearTimeout(this.showStylesTimeoutId);
    this.showStylesTimeoutId = setTimeout(() => {
      this.showStyles = false;
      if (this.showLayers == false && this.showProtocols == false && this.showGeoSearchToolbar) {
        this.exchangeService.hideGeoSearchToolbar(false);
      }
      this.styleContainer.style.display = 'none';
    }, AppConfig.settings.headerSettings.menuAutoHideTimeout);
  }

  setLayersTimeout() {
    clearTimeout(this.showLayersTimeoutId);
    this.showLayersTimeoutId = setTimeout(() => {
      this.showLayers = false;
      if (this.showStyles == false && this.showProtocols == false && this.showGeoSearchToolbar) {
        this.exchangeService.hideGeoSearchToolbar(false);
      }
      this.layerContainer.style.display = 'none';
    }, AppConfig.settings.headerSettings.menuAutoHideTimeout);
  }

  setProtocolsTimeout() {
    clearTimeout(this.showProtocolsTimeoutId);
    this.showProtocolsTimeoutId = setTimeout(() => {
      this.showProtocols = false;
      if (this.showStyles == false && this.showLayers == false && this.showGeoSearchToolbar) {
        this.exchangeService.hideGeoSearchToolbar(false);
      }
      this.protocolContainer.style.display = 'none';
    }, AppConfig.settings.headerSettings.menuAutoHideTimeout);
  }

  // setOverlaysTimeout() {
  //   clearTimeout(this.showOverlaysTimeoutId);
  //   this.showOverlaysTimeoutId = setTimeout(() => {
  //     this.showOverlays = false;
  //     if (this.showStyles == false && this.showLayers == false && this.showGeoSearchToolbar) {
  //       this.exchangeService.hideGeoSearchToolbar(false);
  //     }
  //     this.overlayContainer.style.display = 'none';
  //   }, AppConfig.settings.headerSettings.menuAutoHideTimeout);
  // }

  decodeToken(token: any) {
    try {
        const decodedToken:any = jwt_decode(token); //decodes and verifies the token extracted form the header
        return decodedToken;
    } catch (error) {
        console.error({ 'level': 'error', 'message': { 'Token not valid!': error } });
        return throwError(error);
    }
  }
}
