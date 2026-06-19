import { Component, Input, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { ExchangeService } from '../services/exchange.service';
import { forkJoin, Subscription } from 'rxjs';
import { DownloadProgress, ProductSearchService } from '../services/product-search.service';
import { AppConfig } from '../services/app.config';
import { DetailsConfig } from '../services/details.config';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastComponent } from '../toast/toast.component';
import _ from 'underscore';
import { AlertComponent } from '../alert/alert.component';

interface StacSearch {
  "datetime"?: string;
  "ids"?: [string?];
  "filter"?: {[key: string]: any};
  "fields"?: {[key: string]: any};
  "collections"?: [string?];
  "intersects"?: {[key: string]: any};
  "sortby": {[key: string]: any}[];
  "limit": number;
  "page": number;
}

declare let $: any;
let listContainer: any;
let listItemDiv: any;
let productListContainer: any;
let productListHeader: any;
let productListScrollThumb: any;
let advancedSearchContainer: any;
let advancedSearchMenu: any;
let advancedSearchScrollThumb: any;
let filterOutputDiv: any;
let filterOutputScrollableDiv: any;
let filterOutputScrollThumb: any;
let productDetailContainer: any;
let productDetailsContainerTitle: any;
let productDetailsItemListContainer: any;
let detailedView: any;
let simpleView: any;
let minimalView: any;
let prevPageButton: any;
let nextPageButton: any;
let copsyBlueColor: any;
let copsyBlueColor_RED: number;
let copsyBlueColor_GREEN: number;
let copsyBlueColor_BLUE: number;
let detailsPanelWidth: any;
let advancedSearchMagnifierIcon: any;
let advancedSearchSubmitIcon: any;

let footprintMenuContainer: any;
let footprintMenuScrollableDiv: any;
let footprintMenuScrollThumb: any;
let textSearchSuggestionsContainer: any;

let scrollDetailsLeft: any;
let scrollDetailsRight: any;

@Component({
    selector: 'app-search-bar',
    templateUrl: './search-bar.component.html',
    styleUrls: ['./search-bar.component.scss'],
    standalone: false
})
export class SearchBarComponent implements OnInit, OnDestroy, AfterViewInit {
  public productListSubscription!: Subscription;
  public showProductList: boolean = false;
  public productListRolled: boolean = false;
  public sortByOptions = AppConfig.settings.searchOptions.sortByOptions;
  public sortBy: string = this.sortByOptions[0].value;
  public orderByOptions = AppConfig.settings.searchOptions.orderByOptions;
  public orderBy: string = this.orderByOptions[0].value;
  public orderByStac: string = this.orderByOptions[0].stacValue;
  public platformDetailsList = AppConfig.settings.platformDetailsList;
  public advancedFilterIsActive: boolean = false;
  public advancedFilterOutputIsActive: boolean = false;
  public useMultipleAttributesInOption: boolean = AppConfig.settings.searchOptions.useMultipleAttributesInOption;
  public todayDate: string = '';

  public sensingStartEl: any;
  public sensingStopEl: any;
  public publicationStartEl: any;
  public publicationStopEl: any;
  public minPublicationStopDate: string = "";
  public maxPublicationStartDate: string = "";
  public missionEl: any;

  @Input()
  public filter: string = "";
  public parsedFilter: string = "";
  public productFilter: string = "";
  public attributeFilter: string = "";
  public geoFilter: string = "";
  public stacFilter: StacSearch = {
    "sortby": [
      {
        "field": "properties.published",
        "direction": "desc"
      }
    ],
    "limit": AppConfig.settings.searchOptions.productsPerPageStac,
    "page": 1
  };
  public stacFilterPrec: StacSearch = {...this.stacFilter};
/*
  public exFilter: any = {
    "datetime" : "2025-06-10T00:00:00Z/2025-08-25T23:59:59Z",
    "collections": ["SENTINEL-1", "SENTINEL-2", "SENTINEL-3", "SENTINEL-5P"],
    "intersects": {
        "type":"MultiPolygon",
        "coordinates":[
            [[
                [-180, -90],
                [-180,  90],
                [   0,  90],
                [   0, -90],
                [-180, -90]
            ]]
        ]
    },
    "sortby": [{
        "field": "properties.updated",
        "direction": "desc"
    }],
    "limit": 10,
    "page": 1
  };
*/
  public geoFilterIsActive: boolean = false;
  public filterOutputIsVisible: boolean = false;
  public filterOutputIsPinnedByDefault: boolean = AppConfig.settings.searchOptions.filterOutputIsPinnedByDefault;
  public filterParsingDivIsPinned: boolean = this.filterOutputIsPinnedByDefault;
  public showParseFilterTimeoutId: any;
  public filterParsingDivHeight: any;
  public selectedOptions: string[] = [];

  public parsedFilterPrec: string = "";
  public productFilterPrec: string = "";
  public attributeFilterPrec: string = "";
  public geoFilterPrec: string = "";

  public productList: any = {
    "@odata.count": 0,
    value: []
  };
  public productTotalNumber: number = 0;
  public productStartNumber: number = 0;
  public productEndNumber: number = 0;
  public currentPage: number = 0;
  public lastPage: number = 0;
  public prevPage: number = 0;
  public searchOptions: any;
  public canSubmitSearch: boolean = true;

  public searchBarWidth: number = 0;
  public listContainerTempWidth: any;
  public listIsReady: boolean = false;

  public lastViewStyle: string = "detailed";
  public showSimpleView: boolean = true;
  public showDetailedView: boolean = true;
  public lastListContainerHeight: number = 0;
  public lastQlDivBGColor: string = "";
  public lastQlDivBorderColor: string = "";

  public scrollListThumbPos: number = 0;
  public scrollListCounter: number = 0;
  public scrollListCounterThreshold: number = 750;
  public scrollListThumbTempPos: number = 0;
  public scrollListSize: number = 0;
  public listThumbColorTimeout: any;

  public scrollSearchThumbPos: number = 0;
  public scrollSearchSize: number = 0;

  public scrollFilterThumbPos: number = 0;
  public scrollFilterSize: number = 0;

  public scrollDetailThumbPos: number = 0;
  public scrollDetailSize: number = 0;

  public productDetailsContainerIsRolled: boolean = true;
  public selectedProducts: any = [];
  public propertiesList: any = DetailsConfig.settings.Properties;
  public attributesList: any = DetailsConfig.settings.Attributes;
  public stacPropertiesList: any = DetailsConfig.settings.StacProperties;
  public Object = Object;
  public Array = Array;

  public footprintMenuTimeoutId: any;
  public hoveredProductShownArray: any[] = [];
  public footprintMenuThumbPos: number = 0;
  public footprintMenuSize: number = 0;

  public comboTimeoutId: any;

  private odataVersion: string = AppConfig.settings.odataVersion;
  public gssSelectedProtocol: string = AppConfig.settings.searchOptions.defaultGssProtocol;
  public gssSelectedProtocolPrec: string = this.gssSelectedProtocol;
  public stacCollectionsList: string[] = [];
  public stacQueryablesList: any[] = [];
  public isOdataActive: boolean = false;
  public isStacActive: boolean = false;
  public downloadSubscription: Map<String, Subscription> = new Map();
  isLoggedSubscription!: Subscription;
  updateGeoSearchSubscription!: Subscription;
  updateGeoSearchStacSubscription!: Subscription;
  updateHoveredProductSubscription! : Subscription;
  zoomToListSubscription!: Subscription;
  showFootprintsMenuSubscription!: Subscription;
  updateGssProtocolSubscription!: Subscription;
  public gssProtocols = AppConfig.settings.searchOptions.gssSupportedProtocols;
  private isFirstMissionSelect = true;

  public isLogged: boolean = false;

  private typingTimeoutId: any;
  private typingTimeout: number = 750;
  private suggestionTimeoutId: any;
  private suggestionTimeout: number = 5000;
  public foundSuggestions: string[] = [];
  private foundSuggestionMaxNum: number = 8;
  public foundSuggestionSelected: number = -1;

  constructor(
    private exchangeService: ExchangeService,
    private productSearch: ProductSearchService,
    private sanitizer: DomSanitizer,
    private clipboard: Clipboard,
    private toast: ToastComponent,
    private alert: AlertComponent
    ) {
  }

  sanitizeImageUrl(imageUrl: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(imageUrl);
  }

  ngOnInit(): void {
    window.addEventListener("resize", () => {
      setTimeout(() => {
        this.checkFilterOutputHeight();
        this.setListView(this.lastViewStyle);
        this.checkAdvancedSearchThumbSize();
        this.checkScrollButtons();
      }, 250);
    });

    listContainer = document.getElementById('list-items-container')!;
    listItemDiv = document.getElementsByClassName('list-item-div')!;
    productListHeader = document.getElementById('product-list-header')!;
    productListContainer = document.getElementById('product-list-container')!;
    advancedSearchContainer = document.getElementById('advanced-search-scrollable-container')!;
    advancedSearchMenu = document.getElementById('advanced-search-menu')!;
    filterOutputDiv = document.getElementById('filter-output-div')!;
    filterOutputScrollableDiv = document.getElementById('filter-output-scrollable-div')!;
    this.sensingStartEl = document.getElementById('sensing-start')!;
    this.sensingStopEl = document.getElementById('sensing-stop')!;
    this.publicationStartEl = document.getElementById('publication-start')!;
    this.publicationStopEl = document.getElementById('publication-stop')!;
    this.missionEl = document.getElementsByClassName('collapsible-section')!;
    advancedSearchMagnifierIcon = document.getElementById('search-magnifier-icon')!;
    advancedSearchSubmitIcon = document.getElementById('advanced-search-submit-icon')!;
    productDetailContainer = document.getElementById('product-details-container')!;
    productDetailsContainerTitle = document.getElementById('product-details-container-title')!;
    productDetailsItemListContainer = document.getElementById('product-details-item-list-container')!;
    footprintMenuContainer = document.getElementById('footprint-menu-container')!;
    footprintMenuScrollableDiv = document.getElementById('footprint-menu-scrollable-div')!;
    textSearchSuggestionsContainer = document.getElementById('search-suggestion-div');

    let tempTodayDate = new Date();
    this.todayDate = [tempTodayDate.getFullYear(),
      (tempTodayDate.getMonth() + 1).toString().padStart(2, '0'),
      tempTodayDate.getDate().toString().padStart(2, '0')
    ].join('-');


    this.maxPublicationStartDate = this.todayDate;
    this.minPublicationStopDate = "";

    this.searchBarWidth = document.getElementById('search-bar-main-div')!.offsetWidth;
    copsyBlueColor = window.getComputedStyle(document.getElementById('get-properties-div')!).backgroundColor;
    let colorsOnly = copsyBlueColor.substring(
      copsyBlueColor.indexOf('(') + 1,
      copsyBlueColor.lastIndexOf(')')
    ).split(/,\s*/)
    copsyBlueColor_RED = colorsOnly[0];
    copsyBlueColor_GREEN = colorsOnly[1];
    copsyBlueColor_BLUE = colorsOnly[2];
    detailsPanelWidth = parseInt(window.getComputedStyle(document.getElementById('get-properties-div')!).width, 10);

    /* Product list scroll thumb */
    let askNextPage: boolean = false;
    let askPrevPage: boolean = false;
    let wheelListDeltaY: number = 0;
    productListScrollThumb = document.getElementById('product-list-scroll-thumb')!;
    this.dragElement(productListScrollThumb, listContainer);

    listContainer!.addEventListener('wheel', (e: any) => {
      wheelListDeltaY = e.deltaY;
      if (askNextPage) {
        if (wheelListDeltaY < 0) {
          askNextPage = false;
        } else {
          this.scrollListCounter += wheelListDeltaY;
          this.calcListThumbColor();
          if (this.scrollListCounter > this.scrollListCounterThreshold) {
            this.currentPage += 1;
            this.scrollListCounter = 0;
            askNextPage = false;
            this.loadPage(this.currentPage);
          }
        }
      }
      if (askPrevPage) {
        if (wheelListDeltaY > 0) {
          askPrevPage = false;
        } else {
          this.scrollListCounter += wheelListDeltaY;
          this.calcListThumbColor();
          if (this.scrollListCounter < -this.scrollListCounterThreshold) {
            this.currentPage -= 1;
            this.scrollListCounter = 0;
            askPrevPage = false;
            this.loadPage(this.currentPage);
          }
        }
      }
    });
    listContainer!.addEventListener('scroll', (e: any) => {
      askPrevPage = false;
      askNextPage = false;
      if (listContainer.clientHeight + listContainer.scrollTop >= listContainer.scrollHeight - 1) {
        if (this.currentPage < this.lastPage) {
          askNextPage = true;
        }
      }
      if (listContainer.scrollTop < 1) {
        if (this.currentPage > 0) {
          askPrevPage = true;
        }
      }
      this.scrollListThumbPos = this.calcThumbPos(listContainer, this.scrollListSize);
      this.setThumbPos(productListScrollThumb, this.scrollListThumbPos);
    });

    /* Advanced search scroll thumb */
    advancedSearchScrollThumb = document.getElementById('advanced-search-scroll-thumb')!;
    this.dragElement(advancedSearchScrollThumb, advancedSearchContainer);

    advancedSearchContainer!.addEventListener('scroll', (e: any) => {
      this.scrollSearchThumbPos = this.calcThumbPos(advancedSearchContainer, this.scrollSearchSize);
      this.setThumbPos(advancedSearchScrollThumb, this.scrollSearchThumbPos);
    });

    /* Filter Output scroll thumb */
    filterOutputScrollThumb = document.getElementById('filter-output-scroll-thumb')!;
    this.dragElement(filterOutputScrollThumb, filterOutputScrollableDiv);

    filterOutputScrollableDiv!.addEventListener('scroll', (e: any) => {
      this.scrollFilterThumbPos = this.calcThumbPos(filterOutputScrollableDiv, this.scrollFilterSize);
      this.setThumbPos(filterOutputScrollThumb, this.scrollFilterThumbPos);
    });

    /* Footprint Menu scroll thumb */
    footprintMenuScrollThumb = document.getElementById('footprints-menu-scroll-thumb')!;
    this.dragElement(footprintMenuScrollThumb, footprintMenuScrollableDiv);

    footprintMenuScrollableDiv!.addEventListener('scroll', (e: any) => {
      this.footprintMenuThumbPos = this.calcThumbPos(footprintMenuScrollableDiv, this.footprintMenuSize);
      this.setThumbPos(footprintMenuScrollThumb, this.footprintMenuThumbPos);
    });

    /* detail panel scroll wheel */
    productDetailsContainerTitle!.addEventListener('wheel', (e: any) => {
      if (e.deltaY > 0) this.onScrollDetailsRight();
      if (e.deltaY < 0) this.onScrollDetailsLeft();
    })
  }

  ngAfterViewInit(): void {
    this.checkTypedFilter();
    this.isLoggedSubscription = this.exchangeService.isLoggedExchange.subscribe((value) => {
      if (typeof(value) === 'boolean') {
        let shouldCheck = !this.isLogged;
        this.isLogged = value;
        this.exchangeService.setGssProtocol(this.gssSelectedProtocol);
        if (shouldCheck) {

          this.checkGssProtocols();
        }
      }
    });
    this.updateGeoSearchSubscription = this.exchangeService.geoSearchOutputExchange.subscribe((value) => {
      if (typeof(value) === 'string') {
        this.geoSearchUpdate(value);
      }
    });
    this.updateGeoSearchStacSubscription = this.exchangeService.geoSearchOutputStacExchange.subscribe((value) => {
      if (typeof(value) === 'object') {
        this.geoSearchUpdateStac(value);
      }
    });
    this.updateHoveredProductSubscription = this.exchangeService.hoveredProductExchange.subscribe((value) => {
      this.updateHoveredProduct(value);
    });
    this.zoomToListSubscription = this.exchangeService.zoomToProductIdOnListExchange.subscribe((value) => {
      if (typeof(value) === 'string') {
        this.zoomToList(value);
      }
    });
    this.showFootprintsMenuSubscription = this.exchangeService.footprintMenuEventExchange.subscribe((value) => {
      this.showFootprintsMenu(value);
    });
    this.updateGssProtocolSubscription = this.exchangeService.selectedGssProtocol.subscribe((value) => {
      if (typeof(value) === 'string') {
        this.hideProductListContainer();
        this.gssSelectedProtocolPrec = this.gssSelectedProtocol;
        this.gssSelectedProtocol = value;
        if (this.gssSelectedProtocol !== this.gssSelectedProtocolPrec) {
          this.gssSelectedProtocolPrec = this.gssSelectedProtocol;
          for (let i = this.selectedProducts.length - 1; i >= 0; i--) {
            this.onHideProductDetails(this.selectedProducts[i].Id, this.selectedProducts[i].productListIndex);
          }
          this.productTotalNumber = 0;
          this.showProductList = false;
          this.listIsReady = true;
          this.productListRolled = false;
          this.productList = {
            "@odata.count": 0,
            value: []
          };
          this.exchangeService.setProductList(this.productList);

          setTimeout(() => {
            this.onShowHideButtonClick(null);
            this.parseAdvancedFilter();
            this.checkTypedFilter();
          }, 10);
        }
        setTimeout(() => {
          this.checkFilterOutputHeight();
        }, 50);
      }
    });

    scrollDetailsLeft = document.getElementById('scroll-details-left')!;
    scrollDetailsRight = document.getElementById('scroll-details-right')!;

    if (this.missionEl.length == 1) {
      let header = this.missionEl[0].querySelector('.collapsible-header-div');
      let missionInput = header.querySelector('.checkbox');
      missionInput.click();
    }
  }

  ngOnDestroy(): void {
    this.productListSubscription.unsubscribe();
    this.isLoggedSubscription.unsubscribe();
    this.updateGeoSearchSubscription.unsubscribe();
    this.updateHoveredProductSubscription.unsubscribe();
    this.zoomToListSubscription.unsubscribe();
    this.showFootprintsMenuSubscription.unsubscribe();
    if (this.downloadSubscription.size > 0) {
      this.downloadSubscription.forEach(sub => {
        sub.unsubscribe();
      });
    }
    this.updateGeoSearchStacSubscription.unsubscribe();
    this.updateGssProtocolSubscription.unsubscribe();
  }

  onTextSearchKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (this.foundSuggestionSelected === -1) {
        this.onAdvancedSearchSubmit(event);
      } else {
        this.insertSuggestedStacFilter(this.foundSuggestions[this.foundSuggestionSelected]);
        this.foundSuggestionSelected = -1;
        document.getElementById('search-input')?.focus();
      }
    }
    if (event.key === 'ArrowDown') {
      this.foundSuggestionSelected += 1;
      if (this.foundSuggestionSelected > this.foundSuggestionMaxNum - 1) this.foundSuggestionSelected = this.foundSuggestionMaxNum - 1;
      clearTimeout(this.suggestionTimeoutId);
      this.suggestionTimeoutId = setTimeout(() => {
        this.hideTextSearchSuggestionDiv();
      }, this.suggestionTimeout);
    }
    if (event.key === 'ArrowUp') {
      this.foundSuggestionSelected -= 1;
      if (this.foundSuggestionSelected < -1) this.foundSuggestionSelected = -1;
      clearTimeout(this.suggestionTimeoutId);
      this.suggestionTimeoutId = setTimeout(() => {
        this.hideTextSearchSuggestionDiv();
      }, this.suggestionTimeout);
    }
  }

  checkTypedFilter() {
    /* Filter parsing while typing */
    let searchFilterTextDiv: any = document.getElementById('search-input')!;
    let parseFilterTimeoutId: any;
    ['input', 'click'].forEach((inputEvent: any) => {
      searchFilterTextDiv.addEventListener(inputEvent, (e: any) => {
        this.checkFilterParsingToggle();
        clearTimeout(parseFilterTimeoutId);
        parseFilterTimeoutId = setTimeout(() => {
          this.parsedFilter = this.productSearch.parseFilter(e.target.value);
          this.parseAdvancedFilter();
          setTimeout(() => {
            this.checkFilterOutputHeight();
          }, 50);
        }, 750);
      })
    });

    ['wheel', 'mousemove', 'click'].forEach((inputEvent: any) => {
      filterOutputDiv.addEventListener(inputEvent, (e: any) => {
        this.checkFilterParsingToggle();
        clearTimeout(parseFilterTimeoutId);
        parseFilterTimeoutId = setTimeout(() => {
          this.parsedFilter = this.productSearch.parseFilter(e.target.value);
          setTimeout(() => {
            this.checkFilterOutputHeight();
          }, 50);
        }, 750);
      })
    });
  }

  checkGssProtocols() {
    const calls: Record<string, any> = {
      ...(this.gssProtocols.includes('OData') && {
        odata: this.productSearch.checkOdataService()
      }),
      ...(this.gssProtocols.includes('STAC') && {
        stac: this.productSearch.getCollections()
      }),
      ...(this.gssProtocols.includes('STAC') && {
        stacQueryables: this.productSearch.getQueryables()
      })
    };
    if (Object.keys(calls).length === 0) {
      advancedSearchSubmitIcon.classList.add('invalid');
      advancedSearchMagnifierIcon.classList.add('invalid');
      this.canSubmitSearch = false;
      this.alert.showErrorAlert("GSS PROTOCOL ERROR", "No correct GSS protocols have been set.");
      return;
    }

    forkJoin(calls).subscribe({
      next: (res: any) => {
        if (res.odata) {
          //console.log("res.odata: ", res.odata);
          if (res.odata.error) {
            console.log("res.odata.error: ", res.odata.error);
            this.isOdataActive = false;
            console.log("OData failed: ", res.odata.details ?? "");
          } else if (res.odata.data.status == 200 && res.odata.data.body.hasOwnProperty('$Version')) {
            this.isOdataActive = true;
          } else {
            this.isOdataActive = false;
          };
        }
        if (res.stac) {
          //console.log("res.stac: ", res.stac);
          if (res.stac.error) {
            console.log("res.stac.error: ", res.stac.error);
            this.isStacActive = false;
            console.log("STAC failed: ", res.stac.details ?? "");
          } else if (res.stac.data.hasOwnProperty("collections")) {
            this.stacCollectionsList = res.stac.data.collections.map((obj: any) => obj.id);
            this.isStacActive = true;
            if (res.stacQueryables) {
              console.log("Queryables: ", res.stacQueryables);
              if (res.stacQueryables.error) {
                console.log("res.stac.error: ", res.stacQueryables.error);
                this.isStacActive = false;
                console.log("STAC failed: ", res.stacQueryables.details ?? "");
              } else if (res.stacQueryables.data.hasOwnProperty("properties")) {
                this.stacQueryablesList = Object.entries(res.stacQueryables.data.properties)
                  .filter(([key]) => key !== 'geometry')
                  .map(([key, value]) => ({
                    name: key,
                    ...(value as Record<string, any>)
                  }));
                this.isStacActive = true;
              } else {
                this.isStacActive = false;
              }
            }
          } else {
            this.isStacActive = false;
          }
        }

        if (this.isLogged) {
          console.log("Check for OData module availability: ", this.isOdataActive);
          console.log("Check for STAC module availability: ", this.isStacActive);
        }
        this.exchangeService.setOdataActive(this.isOdataActive);
        this.exchangeService.setStacActive(this.isStacActive);
        if (this.gssSelectedProtocol === "OData" && this.isOdataActive === false) {
          if (this.gssProtocols.includes('STAC')) {
            this.exchangeService.setGssProtocol("STAC");
          } else {
            console.log("ERROR: OData is not available, but STAC is not set as an alternative");
          }
        }
        if (this.gssSelectedProtocol === "STAC" && this.isStacActive === false) {
          console.log("CHECK HERE!");
          if (this.gssProtocols.includes('OData')) {
            this.exchangeService.setGssProtocol("OData");
          } else {
            console.log("ERROR: STAC is not available, but OData is not set as an alternative");
          }
        }
        if (!this.isOdataActive && !this.isStacActive && this.isLogged) {
          advancedSearchSubmitIcon.classList.add('invalid');
          advancedSearchMagnifierIcon.classList.add('invalid');
          this.canSubmitSearch = false;
          this.alert.showErrorAlert("GSS PROTOCOL ERROR", "Both STAC and OData protocols seem to be inactive.");
        } else {
          advancedSearchSubmitIcon.classList.remove('invalid');
          advancedSearchMagnifierIcon.classList.remove('invalid');
          this.canSubmitSearch = true;
        }
      },
      error: (err: any) => {
        this.isOdataActive = false;
        this.isStacActive = false;
        console.error(err);
      }
    })
  }

  checkFilterOutputHeight() {
    this.filterParsingDivHeight = filterOutputDiv!.clientHeight;
    if (this.filterParsingDivIsPinned) {
      productListContainer!.style.top = (58 + this.filterParsingDivHeight) + 'px';
      advancedSearchMenu!.style.top = (58 + this.filterParsingDivHeight) + 'px';
      if (filterOutputDiv!.classList.contains('unpinned')) {
        filterOutputDiv!.classList.replace('unpinned', 'pinned');
      }
    }
    filterOutputScrollThumb.style.visibility = 'visible';
    this.checkFilterOutputThumbSize();
  }

  checkFilterParsingToggle() {
    /* Makes filter output visible for [configured] seconds or until it is pinned */
    if (filterOutputDiv!.classList.contains('hidden')) {
      filterOutputDiv!.classList.replace('hidden', 'visible');
    }
    clearTimeout(this.showParseFilterTimeoutId);
    if (this.filterParsingDivIsPinned == false) {
      this.showParseFilterTimeoutId = setTimeout(() => {
        filterOutputDiv!.classList.replace('visible', 'hidden');
      }, AppConfig.settings.searchOptions.hideFilterOutputTimeout);
    }
  }

  onShowAdvancedSearch(event: any) {
    if (advancedSearchMenu.classList.contains('hidden')) {
      advancedSearchMenu.classList.replace('hidden', 'visible');
      this.productListRolled = false;
    } else {
      advancedSearchMenu.classList.replace('visible', 'hidden');
      this.productListRolled = true;
    }
    this.onShowHideButtonClick(null);
    this.checkFilterOutputHeight();
    setTimeout(() => {
      if (this.filterParsingDivIsPinned) {
        this.checkFilterParsingToggle();
      }
    }, 250);
  }

  onCopyOutputClicked (event: any) {
    let filterOutput: string = "";
    if (this.gssSelectedProtocol === "OData") {
      filterOutput = filterOutputScrollableDiv.textContent;
    } else {
      filterOutput = JSON.stringify(this.stacFilter, null, 2);
    }
    this.clipboard.copy(filterOutput);
    this.toast.showInfoToast('success', 'FILTER OUTPUT COPIED');
  }

  getStringified(obj: any) {
    return JSON.stringify(obj, null, 2)
  }

  onPushPinToggle (event: any) {
    let pinIcon = document.getElementById('pin-search-filter-output-icon')!;
    if (pinIcon.classList.contains('unpinned')) {
      pinIcon.classList.replace('unpinned', 'pinned');
      pinIcon.title = 'Unpin search filter output';
      this.filterParsingDivIsPinned = true;
      productListContainer!.style.top = (58 + this.filterParsingDivHeight) + 'px';
      advancedSearchMenu!.style.top = (58 + this.filterParsingDivHeight) + 'px';
      if (filterOutputDiv!.classList.contains('unpinned')) {
        filterOutputDiv!.classList.replace('unpinned', 'pinned');
      }
      clearTimeout(this.showParseFilterTimeoutId);
    } else {
      pinIcon.classList.replace('pinned', 'unpinned');
      pinIcon.title = 'Pin search filter output';
      this.filterParsingDivIsPinned = false;
      productListContainer!.style.top = (48) + 'px';
      advancedSearchMenu!.style.top = (48) + 'px';
      if (filterOutputDiv!.classList.contains('pinned')) {
        filterOutputDiv!.classList.replace('pinned', 'unpinned');
      }
      clearTimeout(this.showParseFilterTimeoutId);
      this.showParseFilterTimeoutId = setTimeout(() => {
        filterOutputDiv!.classList.replace('visible', 'hidden');
      }, 250);
    }
    setTimeout(() => {
      this.checkFilterOutputHeight();
      this.checkAdvancedSearchThumbSize();
    }, 300);
  }

  onTextSearchChanged(event: any) {
    const inputEl = event.target;
    const inputWordsArr = inputEl.value.split(' ');
    const inputText = inputWordsArr[inputWordsArr.length - 1];
    if (inputText === "" || inputWordsArr.length === 0) {
      clearTimeout(this.typingTimeoutId);
      this.hideTextSearchSuggestionDiv();
      return;
    }
    clearTimeout(this.typingTimeoutId);
    clearTimeout(this.suggestionTimeoutId);
    this.typingTimeoutId = setTimeout(() => {
      this.foundSuggestionSelected = -1;
      this.foundSuggestions = this.stacQueryablesList.map(item => item.name).filter(item => item.includes(inputText)).slice(0, this.foundSuggestionMaxNum);
      textSearchSuggestionsContainer?.classList.remove('display-none');
      setTimeout(() => {this.showTextSearchSuggestionsDiv();}, 10);
      this.suggestionTimeoutId = setTimeout(() => {
        this.hideTextSearchSuggestionDiv();
      }, this.suggestionTimeout);
    }, this.typingTimeout);
  }
  onTextSearchSuggestionDivMouseOver(event: any) {
    clearTimeout(this.suggestionTimeoutId);
  }
  onTextSearchSuggestionDivMouseLeave(event: any) {
    clearTimeout(this.suggestionTimeoutId);
    this.suggestionTimeoutId = setTimeout(() => {
      this.hideTextSearchSuggestionDiv();
    }, this.suggestionTimeout);
  }
  onTextSearchSuggestedMouseOver(event: any, i: number) {
    this.foundSuggestionSelected = i;
    setTimeout(() => {
      clearTimeout(this.suggestionTimeoutId);
    }, 10)
  }
  onTextSearchSuggestionMouseClick(event: any) {
    const text = event.target.innerText;
    this.insertSuggestedStacFilter(text);
    document.getElementById('search-input')?.focus();
    this.foundSuggestionSelected = -1;
    this.suggestionTimeoutId = setTimeout(() => {
      this.hideTextSearchSuggestionDiv();
    }, 250);
  }
  showTextSearchSuggestionsDiv() {
    if (this.foundSuggestions.length > 0) {
      textSearchSuggestionsContainer?.classList.remove('hidden');
    }
  }
  hideTextSearchSuggestionDiv() {
    textSearchSuggestionsContainer?.classList.add('hidden');
    setTimeout(() => {
      textSearchSuggestionsContainer?.classList.add('display-none');
    }, 250);
  }
  insertSuggestedStacFilter(text: string) {
    // cleanup last typed characters
    this.filter = this.filter.slice(0, this.filter.lastIndexOf(' ') > -1 ? this.filter.lastIndexOf(' ') : 0);
    // insert text into search filter
    this.filter = this.filter === '' ? text + ' = ' : this.filter + ' ' + text + ' = ';
    this.hideTextSearchSuggestionDiv();
    this.parseAdvancedFilterStac();
  }

  onAdvancedSearchClear() {
    [].forEach.call(this.platformDetailsList, (mission: any) => {
      [].forEach.call(mission.filters, (filter: any) => {
        filter.selectedValues = [];
      });
    });
    let comboButtonClear = document.getElementsByClassName("combo-select-button");
    [].forEach.call(comboButtonClear, (button: any) => {
      button.classList.remove('selected');
    });
    let checkboxToClear = document.getElementsByClassName("checkbox");
    let inputsToClear = document.getElementsByClassName("input");
    let datesToClear = document.getElementsByClassName("date");
    [].forEach.call(checkboxToClear, (el:any) => {
      if (el.checked) {
        el.click();
      }
    });

    [].forEach.call(inputsToClear, (el:any) => {
      el.value = "";
      el.setCustomValidity("");
    });
    [].forEach.call(datesToClear, (el:any) => {
      el.value = "";
      el.setCustomValidity("");
    });
    if (advancedSearchMagnifierIcon.classList.contains('invalid')) {
      advancedSearchMagnifierIcon.classList.remove('invalid');
    }
    if (advancedSearchSubmitIcon.classList.contains('invalid')) {
      advancedSearchSubmitIcon.classList.remove('invalid');
    }
    this.productFilter = "";
    this.attributeFilter = "";
    this.advancedFilterOutputIsActive = false;
    this.parseAdvancedFilter();
  }

  onAdvancedSearchSubmit(event: any) {
    this.hideProductListContainer();
    this.parseAdvancedFilter();
    if (this.canSubmitSearch) {
      setTimeout(() => {
        if (this.selectedProducts.length > 0) {
          if ((
              this.gssSelectedProtocol === "OData" && (
              this.parsedFilterPrec != this.parsedFilter ||
              this.productFilterPrec != this.productFilter ||
              this.attributeFilterPrec != this.attributeFilter ||
              this.geoFilterPrec != this.geoFilter)
            ) || (
              this.gssSelectedProtocol === "STAC" && !_.isEqual(this.stacFilterPrec, this.stacFilter)
            )
          ) {
            this.toast.showInfoToast('info', 'FILTER CHANGED. REMOVING PRODUCT DETAILS');
            for (let i = this.selectedProducts.length - 1; i >= 0; i--) {
              this.onHideProductDetails(this.selectedProducts[i].Id, this.selectedProducts[i].productListIndex);
            }
          }
        }
        if (this.gssSelectedProtocol === "OData") {
          this.parsedFilterPrec = this.parsedFilter;
          this.productFilterPrec = this.productFilter;
          this.attributeFilterPrec = this.attributeFilter;
          this.geoFilterPrec = this.geoFilter;
        } else {
          this.stacFilterPrec = {...this.stacFilter};
        }
      }, 50);

      if (this.gssSelectedProtocol === "OData") {
        if (this.productFilter === "" && this.attributeFilter === "") {
          this.advancedFilterIsActive = false;
        } else {
          this.advancedFilterIsActive = true;
        }
      }

      /* Hide Advanced Search Panel */
      if (advancedSearchMenu.classList.contains('visible')) {
        this.onShowAdvancedSearch(event);
      }
      if (productListContainer.classList.contains('visible')) {
        this.onShowHideButtonClick(event);
      }

      /* Send Search */
      this.onSearch(event);
    } else {
      if (!this.isOdataActive && !this.isStacActive) {
        this.toast.showInfoToast('error', 'NO GSS PROTOCOL AVAILABLE');
      } else {
        this.toast.showInfoToast('error', 'PLEASE CHECK INPUT: INVALID FIELDS');
      }
    }
  }

  onDateClicked(event: any) {
    /* uncomment to show picker calendar on date click */
    //event.target.showPicker();
  }

  onMissionFilterButtonClicked(event: any) {
    let header = event.target.closest(".collapsible-header-div");
    var content = header.nextElementSibling;
    if (header.classList.contains("active")) {
      header.classList.remove("active");
      if (content.style.maxHeight){
        content.style.maxHeight = null;
        let contentDiv = header.nextElementSibling;
        let selectsToClear = contentDiv.getElementsByTagName("select");
        let inputsToClear = contentDiv.getElementsByTagName("input");
        [].forEach.call(selectsToClear, (el:any) => {
          el.selectedIndex = 0;
        });
        [].forEach.call(inputsToClear, (el:any) => {
          el.value = "";
        });
      }
    } else {
      header.classList.add("active");
      content.style.maxHeight = "10000px";
    }
    if (this.missionEl.length > 1 || (this.missionEl.length == 1 && !this.isFirstMissionSelect)) {
      this.parseAdvancedFilter();
    }
    this.isFirstMissionSelect = false;
  }

  onSortByChanged(event: any) {
    this.sortBy = AppConfig.settings.searchOptions.sortByOptions.filter((option: any) => option.name === (event.target as HTMLInputElement).value)[0].value;
    this.stacFilter.sortby[0]['direction'] = this.sortBy.toLowerCase();
    this.parseAdvancedFilter();
  }

  onOrderByChanged(event: any) {
    this.orderBy = AppConfig.settings.searchOptions.orderByOptions.filter((option: any) => option.name === (event.target as HTMLInputElement).value)[0].value;
    this.orderByStac = AppConfig.settings.searchOptions.orderByOptions.filter((option: any) => option.name === (event.target as HTMLInputElement).value)[0].stacValue;
    this.stacFilter.sortby[0]['field'] = this.orderByStac.toLowerCase();
    this.parseAdvancedFilter();
  }

  showComboSelect(event: any) {
    let tempComboDivArray = document.getElementsByClassName('combo-select-container');
    [].forEach.call(tempComboDivArray, (div:any) => {
      div.classList.replace('visible', 'hidden');
    });
    clearTimeout(this.comboTimeoutId);
    let tempComboDiv = event.target.nextElementSibling;
    tempComboDiv.classList.replace('hidden', 'visible');

    setTimeout(() => {
      tempComboDiv.style.maxHeight = '20rem';
      tempComboDiv.style.opacity = 1.0;
    }, 10);
    setTimeout(() => {
      this.checkAdvancedSearchThumbSize();
    }, 250);
    this.hideAllComboBox();
  }
  hideAllComboBox() {
    let tempComboDivArray = document.getElementsByClassName('combo-select-container');
    this.comboTimeoutId = setTimeout(() => {
      [].forEach.call(tempComboDivArray, (div:any) => {
        div.style.maxHeight = '0rem';
        div.style.opacity = 0.0;
        setTimeout(() => {
          div.classList.replace('visible', 'hidden');
        }, 220);
      });
      setTimeout(() => {
        this.checkAdvancedSearchThumbSize();
      }, 250);
    }, 1000);
  }
  onComboHover() {
    clearTimeout(this.comboTimeoutId);
  }
  onComboLeave() {
    this.hideAllComboBox();
  }

  onComboButtonSelected(filter: any, value: string, event: any) {
    filter.selectedValues.push(value);
    event.target.classList.add('selected');
    this.parseAdvancedFilter();
  }

  onComboFilterRemove(selectedValues: string[], index: number, event: any) {
    let tempParentElement = event.target.parentElement.parentElement.parentElement!;
    let tempComboDiv = this.getNextSibling(tempParentElement, ".combo-select-container")!;
    [].forEach.call(tempComboDiv.children, (buttonDiv: any) => {
      if (buttonDiv.children[0].innerHTML === selectedValues[index]) {
        buttonDiv.children[0].classList.remove('selected');
      }
    });
    selectedValues.splice(index, 1);
    this.parseAdvancedFilter();
  }

  onComboFilterRemoveFromList(selectedValues: string[], value: string, event: any) {
    let tempButton = this.getPreviousSibling(event.target, '.combo-select-button')!;
    tempButton.classList.remove('selected');
    [].forEach.call(selectedValues, (selectedValue: any, index: number) => {
      if (selectedValue === value) {
        selectedValues.splice(index, 1);
      }
    });
    this.parseAdvancedFilter();
  }

  parseAdvancedFilter() {
    /* Parse Product Filter (Content and Publication Periods) */
    this.productFilter = "";

    this.sensingStartEl = document.getElementById('sensing-start')!;
    this.sensingStopEl = document.getElementById('sensing-stop')!;
    this.publicationStartEl = document.getElementById('publication-start')!;
    this.publicationStopEl = document.getElementById('publication-stop')!;
    this.missionEl = document.getElementsByClassName('collapsible-section')!;

    let bracketOpen: boolean = false;
    this.canSubmitSearch = true;
    if (advancedSearchSubmitIcon.classList.contains('invalid')) {
      advancedSearchSubmitIcon.classList.remove('invalid');
    }
    if (advancedSearchMagnifierIcon.classList.contains('invalid')) {
      advancedSearchMagnifierIcon.classList.remove('invalid');
    }

    /* Check for GSS modules availability */
    if (!this.isOdataActive && !this.isStacActive) {
      advancedSearchSubmitIcon.classList.add('invalid');
      advancedSearchMagnifierIcon.classList.add('invalid');
      this.canSubmitSearch = false;
    }
    /* Parse sensing dates */
    if (this.sensingStartEl.value !== "") {
      if (this.sensingStopEl.value === "" || (this.sensingStartEl.value <= this.sensingStopEl.value)) {
        this.sensingStartEl.setCustomValidity("");
        if (!bracketOpen) {
          this.productFilter += "(";
          bracketOpen = true;
        }
        this.productFilter += "ContentDate/Start ge " + this.sensingStartEl.value + "T00:00:00.000Z";
      } else {
        advancedSearchSubmitIcon.classList.add('invalid');
        advancedSearchMagnifierIcon.classList.add('invalid');
        this.sensingStartEl.setCustomValidity("Please check Sensing Start Date: Start Date > Stop Date");
        this.canSubmitSearch = false;
      }
    }
    if (this.sensingStopEl.value !== "") {
      if (this.sensingStartEl.value === "" || (this.sensingStartEl.value <= this.sensingStopEl.value)) {
        this.sensingStopEl.setCustomValidity("");
        if (this.productFilter !== "") {
          this.productFilter += " and ";
        } else if (!bracketOpen) {
          this.productFilter += "(";
          bracketOpen = true;
        }
        this.productFilter += "ContentDate/End le " + this.sensingStopEl.value + "T23:59:59.999Z";
      } else {
        advancedSearchSubmitIcon.classList.add('invalid');
        advancedSearchMagnifierIcon.classList.add('invalid');
        this.sensingStopEl.setCustomValidity("Please check Sensing Stop Date: Stop Date < Start Date");
        this.canSubmitSearch = false;
      }
    }

    /* Parse publication dates */
    if (this.publicationStartEl.value !== "") {
      if (this.publicationStopEl.value === "" || (this.publicationStartEl.value <= this.publicationStopEl.value)) {
        this.publicationStartEl.setCustomValidity("");
        if (this.productFilter !== "") {
          this.productFilter += " and ";
        } else if (!bracketOpen) {
          this.productFilter += "(";
          bracketOpen = true;
        }
        this.productFilter += "PublicationDate ge " + this.publicationStartEl.value + "T00:00:00.000Z";
      } else {
        advancedSearchSubmitIcon.classList.add('invalid');
        advancedSearchMagnifierIcon.classList.add('invalid');
        this.publicationStartEl.setCustomValidity("Please check Publication Start Date: Start Date > Stop Date");
        this.canSubmitSearch = false;
      }
    }
    if (this.publicationStopEl.value !== "") {
      if (this.publicationStartEl.value === "" || (this.publicationStartEl.value <= this.publicationStopEl.value)) {
        this.publicationStopEl.setCustomValidity("");
        if (this.productFilter !== "") {
          this.productFilter += " and ";
        } else if (!bracketOpen) {
          this.productFilter += "(";
          bracketOpen = true;
        }
        this.productFilter += "PublicationDate le " + this.publicationStopEl.value + "T23:59:59.999Z";
      } else {
        advancedSearchSubmitIcon.classList.add('invalid');
        advancedSearchMagnifierIcon.classList.add('invalid');
        this.publicationStopEl.setCustomValidity("Please check Publication Stop Date: Stop Date < Start Date");
        this.canSubmitSearch = false;
      }
    }
    if (bracketOpen) {
      this.productFilter += ")";
      bracketOpen = false;
    }

    /* Parse Attribute Filter */
    this.attributeFilter = "";
    [].forEach.call(this.missionEl, (el:any, i:any) => {
      let bracketOpenInner: boolean = false;
      if (el.getElementsByTagName('input')[0].checked && this.gssSelectedProtocol === 'OData') {
        /* a mission has been selected */
        if (this.attributeFilter !== "") {
          this.attributeFilter += " or "
        }
        this.attributeFilter += "(";
        bracketOpenInner = true;
        this.attributeFilter += "Attributes/" + this.platformDetailsList[i].attributeType +
          "/any(att:att/Name eq '" + this.platformDetailsList[i].attributeName +
          "' and att/" + this.platformDetailsList[i].attributeType + "/Value eq '" + this.platformDetailsList[i].value + "')";

        /* Check every attribute in the mission */
        let contentDiv = el.getElementsByClassName('content');
        [].forEach.call(contentDiv, (missionDiv:any) => {
          let missionItems = missionDiv.getElementsByClassName('advanced-search-filter-div');
          [].forEach.call(missionItems, (item:any, k:any) => {
            /* for each attribute in the mission */
            let bracketOpenMissionInner: boolean = false;
            if (this.platformDetailsList[i].filters[k].hasOwnProperty('selectedValues')) {
              [].forEach.call(this.platformDetailsList[i].filters[k].selectedValues, (selectedValue: any) => {
                if (this.useMultipleAttributesInOption) {
                  this.attributeFilter += (bracketOpenMissionInner ? ", " : " and Attributes/" + this.platformDetailsList[i].filters[k].attributeType +
                  "/any(att:att/Name eq '" + this.platformDetailsList[i].filters[k].attributeName + "' and att/" + this.platformDetailsList[i].filters[k].attributeType + "/Value in (") +
                    (this.platformDetailsList[i].filters[k].attributeType === "OData.CSC.StringAttribute" ? "'" + selectedValue + "'" : selectedValue);
                    bracketOpenMissionInner = true;
                } else {
                  this.attributeFilter += (bracketOpenMissionInner ? " or " : " and (") + "Attributes/" + this.platformDetailsList[i].filters[k].attributeType +
                    "/any(att:att/Name eq '" + this.platformDetailsList[i].filters[k].attributeName +
                    "' and att/" + this.platformDetailsList[i].filters[k].attributeType + "/Value eq " +
                    (this.platformDetailsList[i].filters[k].attributeType === "OData.CSC.StringAttribute" ? "'" + selectedValue + "'" : selectedValue) + ")";
                    bracketOpenMissionInner = true;
                }
              });
            }
            if (bracketOpenMissionInner) {
              if (this.useMultipleAttributesInOption) {
                this.attributeFilter += ")";
              }
              this.attributeFilter += ")";
              bracketOpenMissionInner = false;
            }

            let inputs = item.getElementsByTagName('input');
            [].forEach.call(inputs, (input:any) => {
              let gotValue: boolean = false;
              let value: string = "";
              let gotMinValue: boolean = false;
              let gotMaxValue: boolean = false;
              if (input !== undefined) {
                value = input.value;
                if (value !== "") {
                  if (input.classList.contains("input-min")) {
                    let maxValueEl = this.getNextSibling(input, ".input-max")!;
                    if(maxValueEl.value === "" || Number(maxValueEl.value) >= Number(input.value)) {
                      gotMinValue = true;
                      gotValue = true;
                      input.setCustomValidity("");
                    } else {
                      advancedSearchSubmitIcon.classList.add('invalid');
                      advancedSearchMagnifierIcon.classList.add('invalid');
                      input.setCustomValidity("Please check input: Min Value > Max Value");
                      this.canSubmitSearch = false;
                    }
                  }
                  if (input.classList.contains("input-max")) {
                    let minValueEl = this.getPreviousSibling(input, ".input-min")!;
                    if(minValueEl.value === "" || Number(minValueEl.value) <= Number(input.value)) {
                      gotMaxValue = true;
                      gotValue = true;
                      input.setCustomValidity("");
                    } else {
                      advancedSearchSubmitIcon.classList.add('invalid');
                      advancedSearchMagnifierIcon.classList.add('invalid');
                      input.setCustomValidity("Please check input: Max Value < Min Value");
                      this.canSubmitSearch = false;
                    }
                  } else {
                    gotValue = true;
                  }
                }
              }
              if (gotValue) {
                this.attributeFilter += " and Attributes/" + this.platformDetailsList[i].filters[k].attributeType +
                  "/any(att:att/Name eq '" + this.platformDetailsList[i].filters[k].attributeName +
                  "' and att/" + this.platformDetailsList[i].filters[k].attributeType + (gotMinValue ? "/Value ge " : (gotMaxValue ? "/Value le " : "/Value eq ")) +
                  (this.platformDetailsList[i].filters[k].attributeType === "OData.CSC.StringAttribute" ? "'" + value + "'" : value) + ")";
              }
            });
          });
        });
        if (bracketOpenInner) {
          this.attributeFilter += ")";
          bracketOpenInner = false;
        }
      }
    });

    if (this.productFilter === "" && this.attributeFilter === "") {
      this.advancedFilterOutputIsActive = false;
    } else {
      this.advancedFilterOutputIsActive = true;
    }

    this.checkFilterParsingToggle();
    if (this.gssSelectedProtocol === 'STAC') {
      this.parseAdvancedFilterStac();
    }
    setTimeout(() => {
      this.checkFilterOutputHeight();
      this.checkAdvancedSearchThumbSize();
    }, 200);
  }

  parseAdvancedFilterStac() {
    delete this.stacFilter.filter;
    this.stacFilter.collections = [];
    this.stacFilter.ids = [];
    this.stacFilter.datetime = "";

    this.canSubmitSearch = true;

    /* Parsing name (ids) */
    if (this.filter !== "") {
      const filterWordsArr = this.filter.split(' ');
      let isQueryable: boolean[] = Array(filterWordsArr.length).fill(false);
      let filtersNumber: number = 0;
      let firstOperator: string = "and";

      filterWordsArr.forEach((filterWordItem: any, index: number) => {
        // Check if it is a queryable filter
        [].forEach.call(this.stacQueryablesList, (queryableItem: any) => {
          // if it is a valid queryable filter, insert text into stac filter output
          if (filterWordItem.toLowerCase() === queryableItem.name.toLowerCase()) {
            filtersNumber += 1;
            if (filterWordsArr.length -1 >= index + (filterWordsArr[index + 1].toLowerCase() === 'isnull' ? 1 : 2)) {
              // mark this and the next 2 words as part of the queryable filter
              isQueryable[index] = isQueryable[index + 1] = true;
              if (filterWordsArr[index + 1].toLowerCase() !== 'isnull') {
                isQueryable[index + 2] = true;
              }

              // Check stac queryable filter type
              let queryValue: any;
              if (queryableItem.type === 'string') {
                if (filterWordsArr[index + 1].toLowerCase() === 'in') {
                  let tempValue = filterWordsArr[index + 2];
                  queryValue = (tempValue.startsWith('[') && tempValue.endsWith(']')) ? tempValue.slice(1, -1).split(',') : tempValue;
                } else if (filterWordsArr[index + 1].toLowerCase() === 'isnull') {
                  queryValue = null;
                } else {
                  queryValue = filterWordsArr[index + 2];
                }
              } else if (queryableItem.type === 'number') {
                if (filterWordsArr[index + 1].toLowerCase() === 'between' || filterWordsArr[index + 1].toLowerCase() === 'in') {
                  queryValue = [parseInt(filterWordsArr[index + 2]), parseInt(filterWordsArr[index + 3])];
                  isQueryable[index + 3] = true;
                } else if (filterWordsArr[index + 1].toLowerCase() === 'isnull') {
                  queryValue = null;
                } else {
                  queryValue = parseInt(filterWordsArr[index + 2]);
                }
              } else if (queryableItem.type === 'timestamp') {
                if (filterWordsArr[index + 1].toLowerCase() === 'isnull') {
                  queryValue = null;
                } else {
                  const inputValue = filterWordsArr[index + 2].replace('/', '-');
                  queryValue = new Date(inputValue).toISOString();
                }
              } else if (queryableItem.type === 'boolean') {
                if (filterWordsArr[index + 1].toLowerCase() === 'isnull') {
                  queryValue = null;
                } else {
                  // Accept as true:  value = 1 OR value = true OR value = True
                  queryValue = filterWordsArr[index + 2];
                }
              }

              if (filtersNumber === 1) {
                this.stacFilter.filter = {
                  op: filterWordsArr[index + 1].toLowerCase() === 'isnull' ? 'isNull' : filterWordsArr[index + 1].toLowerCase(),
                  args: [
                    {
                      property: filterWordsArr[index]
                    }
                  ]
                }
                if (filterWordsArr[index + 1].toLowerCase() !== 'isnull') {
                  let tempValue: any = null;
                  Array.isArray(queryValue)
                    ? (filterWordsArr[index + 1].toLowerCase() === 'between'
                      ? tempValue = queryValue[0]
                      : (filterWordsArr[index + 1].toLowerCase() === 'in'
                        ? tempValue = queryValue
                        : tempValue = queryValue[0]))
                    : tempValue = queryValue;
                  this.stacFilter.filter['args'].push(queryableItem.type === 'timestamp' ? {"timestamp": tempValue} : tempValue);

                  if (Array.isArray(queryValue) && filterWordsArr[index + 1].toLowerCase() === 'between') {
                    this.stacFilter.filter['args'].push(queryValue[1]);
                  }
                }
              } else if (filtersNumber === 2) {
                let singleFilter = this.stacFilter.filter;
                this.stacFilter.filter = {op: firstOperator, args: []};
                this.stacFilter.filter['args'].push(singleFilter);
                this.stacFilter.filter['args'].push({
                  op: filterWordsArr[index + 1].toLowerCase() === 'isnull' ? 'isNull' : filterWordsArr[index + 1].toLowerCase(),
                  args: [
                    {
                      property: filterWordsArr[index]
                    }
                  ]
                });
                if (filterWordsArr[index + 1].toLowerCase() !== 'isnull') {
                  let tempValue: any = null;
                  Array.isArray(queryValue) ? (filterWordsArr[index + 1].toLowerCase() === 'between' ? tempValue = queryValue[0] : filterWordsArr[index + 1].toLowerCase() === 'in' ? tempValue = queryValue : tempValue = queryValue[0]) : tempValue = queryValue;
                  this.stacFilter.filter['args'][this.stacFilter.filter['args'].length - 1]['args'].push(queryableItem.type === 'timestamp' ? {"timestamp": tempValue} : tempValue);
                  if (Array.isArray(queryValue) && filterWordsArr[index + 1].toLowerCase() === 'between') {
                    this.stacFilter.filter['args'][this.stacFilter.filter['args'].length - 1]['args'].push(queryValue[1]);
                  }
                }
              } else {
                this.stacFilter.filter!['args'].push({
                  op: filterWordsArr[index + 1].toLowerCase() === 'isnull' ? 'isNull' : filterWordsArr[index + 1].toLowerCase(),
                  args: [
                    {
                      property: filterWordsArr[index]
                    }
                  ]
                });
                if (filterWordsArr[index + 1].toLowerCase() !== 'isnull') {
                  let tempValue: any = null;
                  Array.isArray(queryValue) ? (filterWordsArr[index + 1].toLowerCase() === 'between' ? tempValue = queryValue[0] : filterWordsArr[index + 1].toLowerCase() === 'in' ? tempValue = queryValue : tempValue = queryValue[0]) : tempValue = queryValue;
                  this.stacFilter.filter!['args'][this.stacFilter.filter!['args'].length - 1]['args'].push(queryableItem.type === 'timestamp' ? {"timestamp": tempValue} : tempValue);
                  if (Array.isArray(queryValue) && filterWordsArr[index + 1].toLowerCase() === 'between') {
                    this.stacFilter.filter!['args'][this.stacFilter.filter!['args'].length - 1]['args'].push(queryValue[1]);
                  }
                }
              }
            }
          }
        });

        // perform other checks if the word is not part of a queryable filter
        if (!isQueryable[index]) {
            if (["and", "or"].includes(filterWordsArr[index])) {
              isQueryable[index] = true;
              firstOperator = filterWordsArr[index].toLowerCase();
            }
        }
      });
      if (filtersNumber > 1) {
        this.stacFilter.filter!['op'] = firstOperator;
      }
      isQueryable.forEach((isQueryableItem: boolean, index: number) => {
        if (!isQueryableItem && filterWordsArr[index] != '') {
          if (!this.stacFilter.ids) this.stacFilter.ids = [];
          this.stacFilter.ids.push(filterWordsArr[index]);
        }
      });
    }

    /* Check for GSS modules availability */
    if (!this.isOdataActive && !this.isStacActive) {
      advancedSearchSubmitIcon.classList.add('invalid');
      advancedSearchMagnifierIcon.classList.add('invalid');
      this.canSubmitSearch = false;
    }

    /* Parsing sensing datetime */
    if (this.sensingStartEl.value !== "") {
      if (this.sensingStopEl.value === "" || (this.sensingStartEl.value <= this.sensingStopEl.value)) {
        this.sensingStartEl.setCustomValidity("");
        this.stacFilter.datetime = this.sensingStartEl.value + "T00:00:00.000Z/";
      } else {
        advancedSearchSubmitIcon.classList.add('invalid');
        advancedSearchMagnifierIcon.classList.add('invalid');
        this.sensingStartEl.setCustomValidity("Please check Sensing Start Date: Start Date > Stop Date");
        this.canSubmitSearch = false;
      }
    }
    if (this.sensingStopEl.value !== "") {
      if (this.sensingStartEl.value === "") {
        this.stacFilter.datetime += "/" + this.sensingStopEl.value + "T23:59:59.999Z";
      } else if ((this.sensingStartEl.value <= this.sensingStopEl.value)) {
        this.sensingStopEl.setCustomValidity("");
        this.stacFilter.datetime += this.sensingStopEl.value + "T23:59:59.999Z";
      } else {
        advancedSearchSubmitIcon.classList.add('invalid');
        advancedSearchMagnifierIcon.classList.add('invalid');
        this.sensingStopEl.setCustomValidity("Please check Sensing Stop Date: Stop Date < Start Date");
        this.canSubmitSearch = false;
      }
    }

    /* Parsing publication datetime */
    if (this.publicationStartEl.value !== "") {
      if (!this.stacFilter.hasOwnProperty('filter')) {
        this.stacFilter.filter = {op: "and", args: []};
      }
      this.publicationStartEl.setCustomValidity("");
      this.stacFilter.filter!['args'].push({
        op: '>=',
        args: [
          {
            property: 'published'
          },
          {"timestamp": new Date(this.publicationStartEl.value).toISOString()}
        ]
      });
    }
    if (this.publicationStopEl.value !== "") {
      if (this.publicationStartEl.value === "") {
      } else if (this.publicationStartEl.value <= this.publicationStopEl.value) {
        this.publicationStopEl.setCustomValidity("");
        if (!this.stacFilter.hasOwnProperty('filter')) {
          this.stacFilter.filter = {op: "and", args: []};
        }
        this.publicationStartEl.setCustomValidity("");
        this.stacFilter.filter!['args'].push({
          op: '<=',
          args: [
            {
              property: 'published'
            },
            {"timestamp": new Date(this.publicationStopEl.value + 'T23:59:59.999Z').toISOString()}
          ]
        });
      } else {
        advancedSearchSubmitIcon.classList.add('invalid');
        advancedSearchMagnifierIcon.classList.add('invalid');
        this.publicationStartEl.setCustomValidity("Please check Publication Stop Date: Stop Date < Start Date");
        this.canSubmitSearch = false;
      }
    }

    /* Parsing collections */
    [].forEach.call(this.missionEl, (el:any, i:any) => {
      if (el.getElementsByTagName('input')[0].checked) {
        this.stacFilter.collections?.push(this.stacCollectionsList[i]);

        /* Check every attribute in the mission */
        let contentDiv = el.getElementsByClassName('content');
        [].forEach.call(contentDiv, (missionDiv:any) => {
          let missionItems = missionDiv.getElementsByClassName('advanced-search-filter-div');
          [].forEach.call(missionItems, (item:any, k:any) => {
            // for each attribute in the mission

            let inputs = item.getElementsByTagName('input');
            [].forEach.call(inputs, (input:any) => {
              let gotValue: boolean = false;
              let value: string = "";
              let gotMinValue: boolean = false;
              let gotMaxValue: boolean = false;
              if (input !== undefined) {
                value = input.value;
                if (value !== "") {
                  if (input.classList.contains("input-min")) {
                    let maxValueEl = this.getNextSibling(input, ".input-max")!;
                    if(maxValueEl.value === "" || Number(maxValueEl.value) >= Number(input.value)) {
                      gotMinValue = true;
                      gotValue = true;
                      input.setCustomValidity("");
                    } else {
                      advancedSearchSubmitIcon.classList.add('invalid');
                      advancedSearchMagnifierIcon.classList.add('invalid');
                      input.setCustomValidity("Please check input: Min Value > Max Value");
                      this.canSubmitSearch = false;
                    }
                  }
                  if (input.classList.contains("input-max")) {
                    let minValueEl = this.getPreviousSibling(input, ".input-min")!;
                    if(minValueEl.value === "" || Number(minValueEl.value) <= Number(input.value)) {
                      gotMaxValue = true;
                      gotValue = true;
                      input.setCustomValidity("");
                    } else {
                      advancedSearchSubmitIcon.classList.add('invalid');
                      advancedSearchMagnifierIcon.classList.add('invalid');
                      input.setCustomValidity("Please check input: Max Value < Min Value");
                      this.canSubmitSearch = false;
                    }
                  } else {
                    gotValue = true;
                  }
                }
              }
              if (gotValue) {
                if (!this.stacFilter.hasOwnProperty('filter')) {
                  this.stacFilter.filter = {op: "and", args: []};
                }
                if (this.stacFilter.filter) {
                  this.stacFilter.filter['args'].push({
                    op: "=",
                    args: [{
                      property: this.stacQueryablesList[k].name
                    }, value]
                  });
                }
              }
            });
          });
        });

      }
    });

    /* Cleaning empty parameters */
    if (this.stacFilter.ids.length == 0) {
      delete this.stacFilter.ids;
    }
    if (this.stacFilter.collections.length == 0) {
      delete this.stacFilter.collections;
    }
    if (this.stacFilter.datetime == "") {
      delete this.stacFilter.datetime;
    }
  }

  getNextSibling(elem: any, selector: any) {
    var sibling = elem.nextElementSibling;
    if (!selector) return sibling;
    while (sibling) {
      if (sibling.matches(selector)) return sibling;
      sibling = sibling.nextElementSibling
    }
  };
  getPreviousSibling(elem: any, selector: any) {
    var sibling = elem.previousElementSibling;
    if (!selector) return sibling;
    while (sibling) {
      if (sibling.matches(selector)) return sibling;
      sibling = sibling.previousElementSibling;
    }
  };


  checkAdvancedSearchThumbSize() {
    this.calcSearchThumbSize();
    this.setThumbSize(advancedSearchScrollThumb, this.scrollSearchSize);
    this.scrollSearchThumbPos = this.calcThumbPos(advancedSearchContainer, this.scrollSearchSize);
    this.setThumbPos(advancedSearchScrollThumb, this.scrollSearchThumbPos);
  }

  checkFilterOutputThumbSize() {
    this.calcFilterThumbSize();
    this.setThumbSize(filterOutputScrollThumb, this.scrollFilterSize);
    this.scrollFilterThumbPos = this.calcThumbPos(filterOutputScrollableDiv, this.scrollFilterSize);
    this.setThumbPos(filterOutputScrollThumb, this.scrollFilterThumbPos);
  }

  checkFootprintsMenuThumbSize() {
    this.calcFootprintsMenuThumbSize();
    this.setThumbSize(footprintMenuScrollThumb, this.footprintMenuSize);
    this.footprintMenuThumbPos = this.calcThumbPos(footprintMenuScrollableDiv, this.footprintMenuSize);
    this.setThumbPos(footprintMenuScrollThumb, this.footprintMenuThumbPos);
  }

  onSearch(event: any) {
    this.listIsReady = false;
    this.showProductList = true;
    this.currentPage = this.prevPage = 0;

    if (this.gssSelectedProtocol === "OData") {
      this.searchOptions = {
        filter: this.filter,
        productFilter: this.productFilter,
        attributeFilter: this.attributeFilter,
        geoFilter: this.geoFilter,
        top: AppConfig.settings.searchOptions.productsPerPage,
        skip: 0,
        order: this.orderBy,
        sort: this.sortBy
      }
    } else {
      this.stacFilter.sortby[0]['direction'] = this.sortBy.toLowerCase();
      this.stacFilter.limit = AppConfig.settings.searchOptions.productsPerPageStac;
      this.stacFilter.page = 1;
      this.searchOptions = {
        filter: this.filter,
        productFilter: this.productFilter,
        attributeFilter: this.attributeFilter,
        geoFilter: this.geoFilter,
        top: this.stacFilter.limit,
        skip: 0,
        order: this.orderBy,
        sort: this.sortBy
      }
    }
    this.loadPage(this.currentPage);
    this.productListRolled = false;
    event.stopPropagation();
  }

  showProductListContainer() {
    if (productListContainer!.classList.contains('hidden')) {
      productListContainer!.classList.replace('hidden', 'visible');
    }
    if (this.filterParsingDivIsPinned) {
      productListContainer!.style.top = (58 + this.filterParsingDivHeight) + 'px';
    } else {
      productListContainer!.style.top = (48) + 'px';
    }
  }
  hideProductListContainer() {
    if (productListContainer!.classList.contains('visible')) {
      productListContainer!.classList.replace('visible', 'hidden');
    }
    if (this.filterParsingDivIsPinned) {
      productListContainer!.style.top = (58 + this.filterParsingDivHeight) + 'px';
    } else {
      productListContainer!.style.top = (48) + 'px';
    }
  }

  loadPage(page: number) {
    this.productList.value.forEach((product: any, index: number) => {
      if (product.isSelected === true) {
        this.exchangeService.selectProductOnMap(index, false);
      }
    });
    if (this.gssSelectedProtocol === "OData") {
      /* OData */
      this.searchOptions.skip = page * this.searchOptions.top;
      let searchReturn = this.productSearch.search(this.searchOptions).subscribe(
        (res: any) => {
          let tempProductDetailsZoomToListButtons = document.getElementsByClassName('zoom-to-list')!;
          if (tempProductDetailsZoomToListButtons.length > 0) {
            [].forEach.call(tempProductDetailsZoomToListButtons, (button: any) => {
              button.classList.add('is-not-in-list');
              button.title = 'Product not visible in this pagination';
            });
          }
          this.productTotalNumber = res['@odata.count'];
          this.lastPage = Math.floor((this.productTotalNumber / this.searchOptions.top) % 1 == 0 ? (this.productTotalNumber / this.searchOptions.top) - 1 : (this.productTotalNumber / this.searchOptions.top));
          if ("status" in res) {
            /* response error */
            this.productList = {
              "@odata.count": 0,
              value: []
            };
            this.exchangeService.setProductList(this.productList);
          } else if (this.productTotalNumber == 0) {
            /* 0 products found */
            this.showProductList = true;
            this.listIsReady = true;
            this.productListRolled = true;
            this.productList = {
              "@odata.count": 0,
              value: []
            };
            this.exchangeService.setProductList(this.productList);
            setTimeout(() => {
              this.onShowHideButtonClick(null);
              this.showProductListContainer();
            }, 10);
          } else {
            /* got a list */
            this.productList = res;
            console.log("this.productList: ", this.productList);
            if (this.productList.value) {
              this.productList.value.forEach((product: any) => {
                product.isSelected = false;
                product.download = {};
                product.tags = [];
                if ("Attributes" in product) {
                  product.Attributes.forEach((attribute: any) => {
                    if (attribute.Name == "platformShortName") {
                      product.platformShortName = attribute.Value;
                    }
                    if (attribute.Name == "platformSerialIdentifier") {
                      product.platformSerialIdentifier = attribute.Value;
                    }
                  });
                  product.Attributes.forEach((attribute: any) => {
                    this.platformDetailsList.forEach((platform: any) => {
                      if (product.platformShortName == platform.value) {
                        platform.tags.forEach((tag: any) => {
                          if (attribute.Name == tag.name) {
                            product.tags.push({name: tag.name, value: attribute.Value, color: tag.color, title: tag.title});
                          }
                        });
                      }
                    });
                  });
                };
                this.productSearch.getQL(product.Id).subscribe({
                  next: (res: any) => {
                    if ("type" in res) {
                      product.hasQL = true;
                      product.qlURL = this.sanitizeImageUrl(URL.createObjectURL(res));
                    } else {
                      product.hasQL = false;
                      product.qlURL = "";
                    }
                  },
                  error: (e) => {}
                });

                /* Check if selected products are in the list */
                [].forEach.call(this.selectedProducts ,(sel: any, index: number) => {
                  sel.isInList = false;
                  if (product.Id === sel.Id) {
                    setTimeout(() => {
                      product.isSelected = true;
                      product.download = sel.download;
                      sel.isInList = true;
                      listItemDiv[sel.productListIndex].classList.add('selected');
                      let tempButton: any = tempProductDetailsZoomToListButtons[index];
                      tempButton.classList.remove('is-not-in-list');
                      tempButton.title = 'Show Product In List';
                      this.exchangeService.selectProductOnMap(sel.productListIndex, true);
                    }, 0);
                  }
                });
              });
            }
            this.exchangeService.setProductList(this.productList);

            this.listIsReady = true;
            this.productListRolled = true;
            this.productStartNumber = page * this.searchOptions.top + 1;
            this.productEndNumber = page * this.searchOptions.top + this.searchOptions.top;
            if (this.productEndNumber > this.productTotalNumber) {
              this.productEndNumber = this.productTotalNumber;
            }
            if (page > this.prevPage) {
              listContainer.scrollTop = 0;
            } else if (page < this.prevPage) {
              setTimeout(() => {
                listContainer.scrollTop = 99999;
              }, 10);
            } else {
              listContainer.scrollTop = 0;
            }
            this.prevPage = page;
            setTimeout(() => {
              prevPageButton = document.getElementById('load-prev')!;
              nextPageButton = document.getElementById('load-next')!;

              /* Check if page buttons should be visible */
              if (this.currentPage == 0) {
                prevPageButton.classList.remove('active');
                if (this.currentPage < this.lastPage) {
                  nextPageButton.classList.add('active');
                } else {
                  nextPageButton.classList.remove('active');
                }
              } else if (this.currentPage == this.lastPage) {
                nextPageButton.classList.remove('active');
                if (this.currentPage > 0) {
                prevPageButton.classList.add('active');
                }
              } else {
                prevPageButton.classList.add('active');
                nextPageButton.classList.add('active');
              }
              this.onShowHideButtonClick(null);
              this.setListView(this.lastViewStyle);
              this.showProductListContainer();
            }, 10);
          }
        }
      );
    } else {
      /* STAC */
      this.stacFilter.page = page + 1;
      let searchReturn = this.productSearch.searchStac(this.stacFilter).subscribe(
        (res: any) => {
          let tempProductDetailsZoomToListButtons = document.getElementsByClassName('zoom-to-list')!;
          if (tempProductDetailsZoomToListButtons.length > 0) {
            [].forEach.call(tempProductDetailsZoomToListButtons, (button: any) => {
              button.classList.add('is-not-in-list');
              button.title = 'Product not visible in this pagination';
            });
          }
          this.productTotalNumber = res.numberMatched;

          if (this.productTotalNumber == 0) {
            /* 0 products found */
            this.showProductList = true;
            this.listIsReady = true;
            this.productListRolled = true;
            this.productList = {
              "@odata.count": 0,
              value: []
            };
            this.exchangeService.setProductList(this.productList);
            setTimeout(() => {
              this.onShowHideButtonClick(null);
              this.showProductListContainer();
            }, 10);
          } else {
            /* got a list */
            this.lastPage = Math.floor((this.productTotalNumber / this.searchOptions.top) % 1 == 0 ? (this.productTotalNumber / this.searchOptions.top) - 1 : (this.productTotalNumber / this.searchOptions.top));
            if (res.hasOwnProperty("type") && res.type === "FeatureCollection") {
              /* got a valid response */
              this.productList = {
                "@odata.count": this.productTotalNumber,
                value: []
              };
              console.log("Products found:", res.features);
              res.features.forEach((feature: any) => {
                let tempProduct: any = {};
                // First add parsed properties
                tempProduct.Name = feature.hasOwnProperty('id') ? feature.id : "";
                tempProduct.platformShortName = (feature.hasOwnProperty('properties') && feature.properties.hasOwnProperty('constellation')) ? feature.properties.constellation.toUpperCase() : "";
                tempProduct.platformSerialIdentifier = feature.hasOwnProperty('id') ? this.getPlatformSerialIdentifierFromProductId(feature.id) : "";
                tempProduct.ContentDate = (feature.hasOwnProperty('properties') && feature.properties.hasOwnProperty('start_datetime')) ? {
                  Start: feature.properties.start_datetime,
                  End: feature.properties.end_datetime
                } : {Start: "", End: ""};
                // Add autoconverted properties
                Object.entries(this.stacPropertiesList).forEach(([key, value]) => {
                  if (key == 'Id') {
                    tempProduct[<string>key] = (feature.hasOwnProperty('properties') && feature.properties.hasOwnProperty('uuid')) ? feature.properties.uuid : "N/D";
                  } else {
                    tempProduct[<string>key] = feature.properties[<string>value];
                  }
                })

                // Set other empty props
                tempProduct.isSelected = false;
                if (feature.hasOwnProperty('assets') && feature.assets.hasOwnProperty('product')) {
                  tempProduct.download = {
                    url: feature.assets.product.hasOwnProperty('href') ? feature.assets.product.href : "",
                    type: feature.assets.product.hasOwnProperty('type') ? feature.assets.product.type: ""
                  };
                }
                tempProduct.tags = [];
                // Add Tags
                Object.entries(feature.properties).forEach(([propKey, propValue]) => {
                  this.platformDetailsList.forEach((platform: any) => {
                    if (feature.hasOwnProperty('properties') && feature.properties.hasOwnProperty('constellation')) {
                      if (feature.properties.constellation.toLowerCase() === platform.value.toLowerCase()) {
                        Object.entries(platform.stacTags).forEach(([tagKey, tagValue]) => {
                          if (propKey == tagValue) {
                            tempProduct.tags.push({
                              name: propKey,
                              value: propValue,
                              color: platform.tags.filter((tag: any) => tag.name === tagKey)[0]?.color,
                              title: platform.tags.filter((tag: any) => tag.name === tagKey)[0]?.title
                            });
                          }
                        });
                      }
                    }
                  });
                });

                // Add Attributes
                tempProduct.Attributes = [];
                Object.entries(feature.properties).forEach(([key, value]) => {
                  tempProduct.Attributes.push({Name: key, Value: value});
                });

                // Add Footprint
                tempProduct.GeoFootprint = feature.hasOwnProperty('geometry') ? feature.geometry : "";

                // Add QLs
                this.productSearch.getQLStac(tempProduct.Name).subscribe({
                  next: (resQL: any) => {
                    if ("type" in resQL) {
                      tempProduct.hasQL = true;
                      tempProduct.qlURL = this.sanitizeImageUrl(URL.createObjectURL(resQL));
                    } else {
                      tempProduct.hasQL = false;
                      tempProduct.qlURL = "";
                    }
                  },
                  error: (e) => {}
                });

                [].forEach.call(this.selectedProducts ,(sel: any, index: number) => {
                  sel.isInList = false;
                  if (tempProduct.Id === sel.Id) {
                    setTimeout(() => {
                      tempProduct.isSelected = true;
                      tempProduct.download = sel.download;
                      sel.isInList = true;
                      listItemDiv[sel.productListIndex].classList.add('selected');
                      let tempButton: any = tempProductDetailsZoomToListButtons[index];
                      tempButton.classList.remove('is-not-in-list');
                      tempButton.title = 'Show Product In List';
                      this.exchangeService.selectProductOnMap(sel.productListIndex, true);
                    }, 0);
                  }
                });
                this.productList.value.push(tempProduct);
              });
              this.exchangeService.setProductList(this.productList);
              this.listIsReady = true;
              this.productListRolled = true;
              this.productStartNumber = page * this.stacFilter.limit + 1;
              this.productEndNumber = page * this.stacFilter.limit + this.stacFilter.limit;
              if (this.productEndNumber > this.productTotalNumber) {
                this.productEndNumber = this.productTotalNumber;
              }
              if (page > this.prevPage) {
                listContainer.scrollTop = 0;
              } else if (page < this.prevPage) {
                setTimeout(() => {
                  listContainer.scrollTop = 99999;
                }, 10);
              } else {
                listContainer.scrollTop = 0;
              }
              this.prevPage = page;
              setTimeout(() => {
                prevPageButton = document.getElementById('load-prev')!;
                nextPageButton = document.getElementById('load-next')!;
                /* Check if page buttons should be visible */
                if (this.currentPage == 0) {
                  prevPageButton.classList.remove('active');
                  if (this.currentPage < this.lastPage) {
                    nextPageButton.classList.add('active');
                  } else {
                    nextPageButton.classList.remove('active');
                  }
                } else if (this.currentPage == this.lastPage) {
                  nextPageButton.classList.remove('active');
                  if (this.currentPage > 0) {
                  prevPageButton.classList.add('active');
                  }
                } else {
                  prevPageButton.classList.add('active');
                  nextPageButton.classList.add('active');
                }
                this.onShowHideButtonClick(null);
                this.setListView(this.lastViewStyle);
                this.showProductListContainer();
              }, 10);

            } else {
              /* response error */
              this.productList = {
                "@odata.count": 0,
                value: []
              };
              this.exchangeService.setProductList(this.productList);
            }
          }
        }
      );
    }
  }

  hoverProduct(e: any) {
    let hoveredProduct = $(e.currentTarget).index();
    this.exchangeService.showProductOnMap(hoveredProduct);
    if ($(e.currentTarget)[0].classList.contains('hover') == false) {
      $(e.currentTarget)[0].classList.add('hover');
    }
  }
  leaveProduct(e: any) {
    let hoveredProduct = -1;
    this.exchangeService.showProductOnMap(hoveredProduct);
    if ($(e.currentTarget)[0].classList.contains('hover')) {
      $(e.currentTarget)[0].classList.remove('hover');
    }
  }

  loadPageFromButtons(page: number) {
    if (page == 1) {
      if (this.currentPage < this.lastPage) {
        nextPageButton.style.color = copsyBlueColor;
        this.currentPage += page;
        this.loadPage(this.currentPage);
        setTimeout(() => {nextPageButton.style.color = "white"}, 1000);
      }
    }
    if (page == -1) {
      if (this.currentPage > 0) {
        prevPageButton.style.color = copsyBlueColor;
        this.currentPage += page;
        this.loadPage(this.currentPage);
        setTimeout(() => {prevPageButton.style.color = "white"}, 1000);
      }
    }
  }

  onShowHideButtonClick(event: any) {
    if (this.listIsReady) {
      if (this.productListRolled) {
        this.productListRolled = false;
        if (advancedSearchMenu.classList.contains('visible')) {
          advancedSearchMenu.classList.replace('visible', 'hidden');
        }
        if (this.productTotalNumber > 0) {
          productListContainer.style.bottom = '0';
          listContainer.style.visibility = 'visible';
        } else {
          productListContainer.style.bottom = 'auto';
          listContainer.style.visibility = 'hidden';
        }
        listContainer.style.opacity = '1.0';
        productListHeader.style.visibility = 'visible';
        productListHeader.style.opacity = '1.0';
        productListContainer.style.left = '0.5rem';
        this.calcListThumbSize();
        productListContainer!.style.gap = '0';
      } else {
        this.productListRolled = true;
        listContainer.style.visibility = 'hidden';
        listContainer.style.opacity = '0.0';
        productListHeader.style.visibility = 'hidden';
        productListHeader.style.opacity = '0.0';
        productListContainer.style.left = (-productListContainer.clientWidth - productListScrollThumb.clientWidth - 2).toString() + 'px';
        productListScrollThumb.style.visibility = 'hidden';
        productListContainer!.style.gap = '0 0.75rem';
      }
    }
    if (event != null) event.stopPropagation();
  }

  simplifyBytes(bytes: number) {
    let result: string = "";
    if (bytes > 1000000000) {
      return (bytes / 1000000000).toFixed(2) + " GB";
    } else if (bytes > 1000000) {
      return (bytes / 1000000).toFixed(2) + " MB";
    } else if (bytes > 1000) {
      return (bytes / 1000).toFixed(2) + " KB";
    }
    return result;
  }

  beautifyTag(tag:string) {
    return tag.toString().replace(/_/g, " ");
  }

  setListView(view: string) {
    if (this.showProductList) {
      detailedView = document.getElementById('detailed-view')!;
      simpleView = document.getElementById('simple-view')!;
      minimalView = document.getElementById('minimal-view')!;
      var els = document.getElementsByClassName('ql-div')!;
      if (view === 'detailed') {
        this.showDetailedView = this.showSimpleView = true;
        detailedView.style.color = copsyBlueColor;
        simpleView.style.color = "white";
        minimalView.style.color = "white";
        [].forEach.call(els, (el:any) => {
          el.style.backgroundColor = this.lastQlDivBGColor;
          el.style.borderColor = this.lastQlDivBorderColor;
        });
      } else if (view === 'simple') {
        this.showDetailedView = false;
        this.showSimpleView = true;
        detailedView.style.color = "white";
        simpleView.style.color = copsyBlueColor;
        minimalView.style.color = "white";
        [].forEach.call(els, (el:any) => {
          el.style.backgroundColor = this.lastQlDivBGColor;
          el.style.borderColor = this.lastQlDivBorderColor;
        });
      } else {
        this.showDetailedView = false;
        this.showSimpleView = false;
        detailedView.style.color = "white";
        simpleView.style.color = "white";
        minimalView.style.color = copsyBlueColor;
        var tempEl = <HTMLElement>els[0];
        this.lastQlDivBGColor = tempEl.style.backgroundColor;
        this.lastQlDivBorderColor = tempEl.style.borderColor;
        [].forEach.call(els, (el: any)  => {
          el.style.backgroundColor = "transparent";
          el.style.border = "transparent";
        });
      }
      this.lastViewStyle = view;
      setTimeout(() => {
        this.calcListThumbSize();
        this.scrollListThumbPos = this.calcThumbPos(listContainer, this.scrollListSize);
        this.setThumbSize(productListScrollThumb, this.scrollListSize);
        this.setThumbPos(productListScrollThumb, this.scrollListThumbPos);
      }, 10);
    }
  }

  downloadProduct(id: string, name: string): void {
    this.toast.showInfoToast('success', 'DOWNLOADING PRODUCT...');
    let downloadUrl: string = "";
    let productInSelectedList = this.selectedProducts.filter((product: any) => product.Id === id)[0];
    let productInList = this.productList.value.filter((product: any) => product.Id === id)[0];
    if (this.gssSelectedProtocol === "OData") {
      downloadUrl = AppConfig.settings.serviceUrl + `/odata/${this.odataVersion}/Products(${id})/$value`;
    } else {
      downloadUrl = productInList.download.url;
    }
    console.log('Download of file ' + name + ' started.');

    this.downloadSubscription.set(id ,this.productSearch.download(downloadUrl, name).subscribe({
      next: (res: DownloadProgress) => {
        if (productInSelectedList != null) {
          productInSelectedList.download.state = res.state;
          productInSelectedList.download.progress = res.progress || 0;
        }
        productInList.download.state = res.state;
        productInList.download.progress = res.progress || 0;
      },
      complete: () => {
        console.log('Download of file ' + name + ' completed!');
      },
      error: (error) => {
        if (productInSelectedList != null) {
          delete productInSelectedList.download.state;
          delete productInSelectedList.download.progress;
        }
        delete productInList.download.state;
        delete productInList.download.progress;
      }
    }));
  }

  unsubscribeDownload(id: string) {
    if (this.downloadSubscription != null) {
      let productInSelectedList = this.selectedProducts.filter((product: any) => product.Id === id)[0];
      if (productInSelectedList != null) {
        productInSelectedList.download.state = null;
        this.downloadSubscription.get(id)!.unsubscribe();
        this.toast.showInfoToast('error', 'DOWNLOAD STOPPED!');
      } else {
        this.productList.value.forEach((product: any) => {
          if (product.Id == id) {
            product.download.state = null;
            this.downloadSubscription.get(id)!.unsubscribe();
            this.toast.showInfoToast('error', 'DOWNLOAD STOPPED!');
          }
        });
      }
    }
  }

  geoSearchUpdate(geoSearchOutput: string) {
    if (geoSearchOutput !== "") {
      this.geoFilter = geoSearchOutput;
      this.geoFilterIsActive = true;
    } else {
      this.geoFilter = "";
      this.geoFilterIsActive = false;
    }
    this.checkFilterParsingToggle();
    setTimeout(() => {
      this.checkFilterOutputHeight();
      this.checkAdvancedSearchThumbSize();
    }, 200);
  }

  geoSearchUpdateStac(geoSearchObj: {}) {
    this.stacFilter.intersects = geoSearchObj;
    if (_.isEmpty(this.stacFilter.intersects)) {
      delete this.stacFilter.intersects;
    }
  }

  updateHoveredProduct(infos: any) {
    this.removeAllHoveredProducts();
    if (infos !== undefined) {
      for (var i = 0; i < listItemDiv.length; i++) {
        infos.forEach((info: any) => {
          if (info.index === i) {
            if (listItemDiv[i].classList.contains('hover') == false) {
              listItemDiv[i].classList.add('hover');
            }
          }
        });
      };
    }
  }

  removeAllHoveredProducts() {
    for (let product of listItemDiv) {
      if (product.classList.contains('hover')) {
        product.classList.remove('hover');
      }
    };
  }

  zoomToList(id: string) {
    if (this.productListRolled) {
      this.onShowHideButtonClick(null);
      this.showProductListContainer();
    }

    let tempId = this.productList.value.findIndex((product: any) => (product.Id === id));
    let tempProductFrameHeight: number;
    let productsInClientHeight: number;
    if (this.productTotalNumber < this.searchOptions.top) {
      tempProductFrameHeight = listContainer.scrollHeight / this.productTotalNumber;
      productsInClientHeight = listContainer.clientHeight / tempProductFrameHeight;
      listContainer.scrollTop =
        ((listContainer.scrollHeight - listContainer.clientHeight) / (this.productTotalNumber - productsInClientHeight)) *
        (tempId) - Math.floor(Math.floor(productsInClientHeight/2) * tempProductFrameHeight);
    } else {
      tempProductFrameHeight = listContainer.scrollHeight / this.searchOptions.top;
      productsInClientHeight = listContainer.clientHeight / tempProductFrameHeight;
      listContainer.scrollTop =
        ((listContainer.scrollHeight - listContainer.clientHeight) / (this.searchOptions.top - productsInClientHeight)) *
        (tempId) - Math.floor(Math.floor(productsInClientHeight/2) * tempProductFrameHeight);
    }
  }

  calcListThumbSize() {
    if (listContainer.scrollHeight > listContainer.clientHeight) {
      productListScrollThumb.style.visibility = 'visible';
      this.scrollListSize = listContainer.clientHeight * listContainer.clientHeight / listContainer.scrollHeight;
    } else {
      productListScrollThumb.style.visibility = 'hidden';
    }
  }

  calcSearchThumbSize() {
    if (advancedSearchContainer.scrollHeight > advancedSearchContainer.clientHeight) {
      advancedSearchScrollThumb.style.visibility = 'visible';
      this.scrollSearchSize = advancedSearchContainer.clientHeight * advancedSearchContainer.clientHeight / advancedSearchContainer.scrollHeight;
    } else {
      advancedSearchScrollThumb.style.visibility = 'hidden';
    }
  }

  calcFilterThumbSize() {
    if (filterOutputScrollableDiv.scrollHeight > filterOutputScrollableDiv.clientHeight) {
      filterOutputScrollThumb.style.visibility = 'visible';
      this.scrollFilterSize = filterOutputScrollableDiv.clientHeight * filterOutputScrollableDiv.clientHeight / filterOutputScrollableDiv.scrollHeight;
    } else {
      filterOutputScrollThumb.style.visibility = 'hidden';
    }
  }
  calcFootprintsMenuThumbSize() {
    if (footprintMenuScrollableDiv.scrollHeight > footprintMenuScrollableDiv.clientHeight) {
      footprintMenuScrollThumb.style.visibility = 'visible';
      this.footprintMenuSize = footprintMenuScrollableDiv.clientHeight * footprintMenuScrollableDiv.clientHeight / footprintMenuScrollableDiv.scrollHeight;
    } else {
      footprintMenuScrollThumb.style.visibility = 'hidden';
    }
  }

  calcListThumbColor() {
    clearTimeout(this.listThumbColorTimeout);
    this.listThumbColorTimeout = setTimeout(() => {
      this.scrollListCounter = 0;
      productListScrollThumb!.style.backgroundColor = '#fff';
    }, 500);

    let red = (255 - Math.round(Math.abs(this.scrollListCounter) * (255 - copsyBlueColor_RED) / this.scrollListCounterThreshold)).toString(16).padStart(2, "0");
    let green = (255 - Math.round(Math.abs(this.scrollListCounter) * (255 - copsyBlueColor_GREEN) / this.scrollListCounterThreshold)).toString(16).padStart(2, "0");
    let blue = (255 - Math.round(Math.abs(this.scrollListCounter) * (255 - copsyBlueColor_BLUE) / this.scrollListCounterThreshold)).toString(16).padStart(2, "0");
    let color: string = '#' + red + green + blue;
    productListScrollThumb!.style.backgroundColor = color;
  }

  calcThumbPos(container: any, scrollSize: any) {
     return container.scrollTop * (container.clientHeight - scrollSize) / (container.scrollHeight - container.clientHeight);
  }

  setThumbPos(el: any, pos: number) {
    el!.style.top = pos.toString() + 'px';
  }

  setThumbSize(el: any, size: number) {
    el.style.height = size.toString() + "px";
  }

  dragElement(elmnt: any, container: any) {
    var yDiff = 0, yPos = 0;
    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e: any) {
      e = e || window.event;
      e.preventDefault();
      yPos = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e: any) {
      container.style.scrollBehavior = "auto";
      e = e || window.event;
      e.preventDefault();
      yDiff = yPos - e.clientY;
      yPos = e.clientY;
      container.scrollTop = container.scrollTop - (yDiff * container.scrollHeight / container.clientHeight);
      container.style.scrollBehavior = "smooth";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  onShowProductDetails(id: string, index: number) {
    let tempSelectedProductFromList = this.productList.value.filter((product: any) => product.Id === id)[0];
    if (tempSelectedProductFromList !== null) {
      this.selectedProducts.push(tempSelectedProductFromList);
      let currentSelectedProduct = this.selectedProducts.filter((product: any) => product.Id === id)[0];
      currentSelectedProduct.isSelected = true;
      currentSelectedProduct.productListIndex = index;
      currentSelectedProduct.isInList = true;

      this.productDetailsContainerIsRolled = false;

      if (productDetailContainer!.classList.contains('hidden')) {
        productDetailContainer!.classList.replace('hidden', 'visible');
      }

      listItemDiv[index].classList.add('selected');
      let tempUnfilteredProductAttributes: any = currentSelectedProduct.Attributes;
      if (this.gssSelectedProtocol === "OData") {
        let tempAttributeListFiltered: any = this.attributesList.filter((platformAttributeObject: any) => platformAttributeObject.platformShortName === currentSelectedProduct.platformShortName);
        let tempAttributesToFilter: any;
        if (tempAttributeListFiltered.length > 0) {
          tempAttributesToFilter = tempAttributeListFiltered[0].Attributes;
          currentSelectedProduct.Attributes = [];
          tempUnfilteredProductAttributes.forEach((unfilteredAttribute: any) => {
            tempAttributesToFilter.forEach((attributeNameToFilter: any) => {
              if (attributeNameToFilter === unfilteredAttribute.Name) {
                currentSelectedProduct.Attributes.push(unfilteredAttribute);
              }
            });
          });

        } else {
          console.error("Couldn't find any matching attribute.. please check details config.");
        }
      }
      this.exchangeService.selectProductOnMap(currentSelectedProduct.productListIndex, true);
      // Refresh map
      this.exchangeService.setProductList(this.productList);

      setTimeout(() => {
        this.onScrollDetailsLast();
      }, 50);
    } else {
      this.toast.showInfoToast('error', 'PRODUCT NOT SELECTABLE!');
    }
  }

  onZoomToProduct(id: string) {
    this.exchangeService.zoomToProduct(id);
  }

  onHideProductDetails(id: string, index: number) {
    if (this.productList.value[index].Id === id) {
      listItemDiv[index].classList.remove('selected');
      this.productList.value[index].isSelected = false;
      this.exchangeService.selectProductOnMap(index, false);
    }
    for (var i = 0; i < this.selectedProducts.length; i++) {
      if (this.selectedProducts[i].Id === id) {
        this.selectedProducts.splice(i, 1);
      }
    }
    if (this.selectedProducts.length == 0) {
      this.selectedProducts = [];
      if (productDetailContainer.classList.contains('visible')) {
        productDetailContainer.classList.replace('visible', 'hidden');
      }
    }
    this.checkScrollButtons();
    this.exchangeService.setProductList(this.productList);
  }

  onHideAllProductDetails() {
    this.productDetailsContainerIsRolled = true;
    if (productDetailContainer!.classList.contains('visible')) {
      productDetailContainer!.classList.replace('visible', 'hidden');
    }
  }

  onShowAllProductDetails() {
    this.productDetailsContainerIsRolled = false;
    if (productDetailContainer!.classList.contains('hidden')) {
      productDetailContainer!.classList.replace('hidden', 'visible');
    }
  }

  checkScrollButtons() {
    /* Check if scroll buttons should be visible */
    setTimeout(() => {
      if (productDetailsItemListContainer.scrollWidth > productDetailsItemListContainer.clientWidth) {
        if (productDetailsItemListContainer.scrollLeft > 0) {
          scrollDetailsLeft.classList.add('active');
          if (productDetailsItemListContainer.scrollLeft == (productDetailsItemListContainer.scrollWidth - productDetailsItemListContainer.clientWidth)) {
            scrollDetailsRight.classList.remove('active');
          } else {
            scrollDetailsRight.classList.add('active');
          }
        } else {
          scrollDetailsLeft.classList.remove('active');
          scrollDetailsRight.classList.add('active');
        }
      } else {
        scrollDetailsLeft.classList.remove('active');
        scrollDetailsRight.classList.remove('active');
      }
    }, 650);
  }
  onScrollDetailsLeft() {
    productDetailsItemListContainer.scrollLeft -= detailsPanelWidth;
    this.checkScrollButtons();
  }
  onScrollDetailsRight() {
    productDetailsItemListContainer.scrollLeft += detailsPanelWidth;
    this.checkScrollButtons();
  }
  onScrollDetailsLast() {
    productDetailsItemListContainer.scrollLeft = 99999;
    this.checkScrollButtons();
  }

  copyUrl(id: string) {
    let copyUrl: string = "";
    if (this.gssSelectedProtocol == "OData") {
      copyUrl = (AppConfig.settings.serviceUrl) ? AppConfig.settings.serviceUrl + `/odata/${this.odataVersion}/Products(${id})`: window.location.origin + `/odata/${this.odataVersion}/Products(${id})`;
    } else {
      copyUrl = this.productList.value.filter((product: any) => product.Id == id)[0].download.url;
    }
    this.clipboard.copy(copyUrl);
    this.toast.showInfoToast('success', 'PRODUCT URL COPIED!');
  }



  /* Footprints Menu */
  showFootprintsMenu(obj: {event: any, array: any[]}) {
    let event: any = obj.event;
    let hoveredProductsArray: any[] = obj.array;
    this.hideFootprintMenu();
    if (event === null) {
      return;
    }
    clearTimeout(this.footprintMenuTimeoutId);
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    footprintMenuContainer.style.left = (event.center.x + 20) + 'px';
    footprintMenuContainer.style.top = (event.center.y - 15) + 'px';

    this.hoveredProductShownArray = hoveredProductsArray;
    setTimeout(() => {
      if (footprintMenuContainer.classList.contains('hidden')) {
        footprintMenuContainer.classList.replace('hidden', 'visible');
      }
      if (viewportHeight - (event.center.y + footprintMenuContainer.offsetHeight) < 0) {
        footprintMenuContainer.style.top = (viewportHeight - footprintMenuContainer.offsetHeight - 8) + 'px';
      }
      if (viewportWidth - (event.center.x + footprintMenuContainer.offsetWidth) < 0) {
        footprintMenuContainer.style.left = (viewportWidth - footprintMenuContainer.offsetWidth - 8) + 'px';
      }
      setTimeout(() => {
        this.checkFootprintsMenuThumbSize();
      }, 50);
    }, 50);
    this.footprintMenuTimeoutId = setTimeout(() => {
      this.hideFootprintMenu();
    }, 3000);
  }

  onMouseEnterFootprintMenu() {
    clearTimeout(this.footprintMenuTimeoutId);
  }
  onMouseLeaveFootprintMenu() {
    this.footprintMenuTimeoutId = setTimeout(() => {
      this.hideFootprintMenu();
    }, 500);
  }
  hideFootprintMenu() {
    footprintMenuContainer.style.left = '-400px';
    footprintMenuContainer.style.top = '-400px';
    if (footprintMenuContainer.classList.contains('visible')) {
      footprintMenuContainer.classList.replace('visible', 'hidden');
    }
  }

  onMouseOverTooltipProductTable(tooltipProduct: any) {
    let tempIndex = this.productList.value.findIndex((product: any) => {
      return product.Id === tooltipProduct.Id
    });
    setTimeout(() => {
      this.exchangeService.showProductOnMap(tempIndex);
      this.updateHoveredProduct([{index: tempIndex}]);
    }, 0);
  }

  onMouseLeaveTooltipProductTable() {
    this.exchangeService.showProductOnMap(-1);
    this.updateHoveredProduct([{index: -1}]);
  }

  onZoomToList(product: any) {
    this.zoomToList(product.Id);
  }



  /* Auxiliary functions */
  returnOptionNameFromValue(val: any, options: any) {
    return options.filter((option: any) => option.value === val)[0].name;
  }

  beautifyCamelCase(text: any) {
    let words = text.split(/(?=[A-Z])/);
    for(var i = 0; i < words.length; i++) {
      let tempWord = words[i];
      tempWord = tempWord.trim();
      words[i] = tempWord.charAt(0).toUpperCase() + tempWord.slice(1);
    }
    return words.join(" ");
  }

  getTypeOf(obj: any) {
    return typeof obj;
  }

  convertStacJsonToOutputString(json: StacSearch) {
    let outJson: any = {...json};
    if (outJson.hasOwnProperty('datetime') && outJson.datetime === "") delete outJson.datetime;
    if (outJson.hasOwnProperty('fields') && this.Object.keys(outJson.fields).length === 0) delete outJson.fields;
    if (outJson.hasOwnProperty('collections') && outJson.collections?.length === 0) delete outJson.collections;
    if (outJson.hasOwnProperty('filter') && this.Object.keys(outJson.filter).length === 0) delete outJson.filter;
    if (outJson.hasOwnProperty('intersects') && this.Object.keys(outJson.intersects).length === 0) delete outJson.intersects;
    if (outJson.hasOwnProperty('sortby')) delete outJson.sortby;
    if (outJson.hasOwnProperty('limit')) delete outJson.limit;
    if (outJson.hasOwnProperty('page')) delete outJson.page;
    return JSON.stringify(outJson, null, 2);
  }

  getPlatformShortNameFromProductId(id: string):string {
    let tempPlatform = id.split("_")[0];
    return tempPlatform === "S5P" ? tempPlatform : tempPlatform.slice(0, -1);
  }
  getPlatformSerialIdentifierFromProductId(id: string):string {
    let tempPlatform = id.split("_")[0];
    return tempPlatform === "S5P" ? "" : tempPlatform.slice(2);
  }
}
