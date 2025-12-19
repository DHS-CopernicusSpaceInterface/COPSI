import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {
  private mapStyle = new BehaviorSubject<any>({});
  selectedMapStyle = this.mapStyle.asObservable();

  private productList = new BehaviorSubject<any>({});
  productListExchange = this.productList.asObservable();

  private isLogged = new BehaviorSubject<any>({});
  isLoggedExchange = this.isLogged.asObservable();

  private mapLayer = new BehaviorSubject<any>({});
  selectedMapLayer = this.mapLayer.asObservable();

  // private mapOverlay = new BehaviorSubject<any>({});
  // selectedMapOverlay = this.mapOverlay.asObservable();

  private gssProtocol = new BehaviorSubject<any>({});
  selectedGssProtocol = this.gssProtocol.asObservable();

  private isOdataActive = new BehaviorSubject<any>({});
  isOdataActiveExchange = this.isOdataActive.asObservable();

  private isStacActive = new BehaviorSubject<any>({});
  isStacActiveExchange = this.isStacActive.asObservable();

  private showProductIndex = new BehaviorSubject<any>({});
  showProductOnMapExchange = this.showProductIndex.asObservable();

  private selectedProductIndex = new BehaviorSubject<any>({});
  selectProductOnMapExchange = this.selectedProductIndex.asObservable();

  private rectDrawing = new BehaviorSubject<any>({});
  startRectDrawingExchange = this.rectDrawing.asObservable();

  private polygonDrawing = new BehaviorSubject<any>({});
  startPolygonDrawingExchange = this.polygonDrawing.asObservable();

  private pointDrawing = new BehaviorSubject<any>({});
  startPointDrawingExchange = this.pointDrawing.asObservable();

  private cancelDrawing = new BehaviorSubject<any>({});
  cancelDrawingExchange = this.cancelDrawing.asObservable();

  private geoSearchOutput = new BehaviorSubject<any>({});
  geoSearchOutputExchange = this.geoSearchOutput.asObservable();

  private geoSearchOutputStac = new BehaviorSubject<any>({});
  geoSearchOutputStacExchange = this.geoSearchOutputStac.asObservable();

  private hoveredProduct = new BehaviorSubject<any>({});
  hoveredProductExchange = this.hoveredProduct.asObservable();

  private productIdOnMap = new BehaviorSubject<any>({});
  zoomToProductIdOnMapExchange = this.productIdOnMap.asObservable();

  private productIdOnList = new BehaviorSubject<any>({});
  zoomToProductIdOnListExchange = this.productIdOnList.asObservable();

  private footprintMenuEvent = new BehaviorSubject<any>({});
  footprintMenuEventExchange = this.footprintMenuEvent.asObservable();

  private hideGeoSearchToolbarEvent = new BehaviorSubject<any>({});
  hideGeoSearchToolbarExchange = this.hideGeoSearchToolbarEvent.asObservable();

  private showGeoSearchToolbarEvent = new BehaviorSubject<any>({});
  showGeoSearchToolbarExchange = this.showGeoSearchToolbarEvent.asObservable();

  constructor() { }

  setMapStyle(mapStyle: string) {
    this.mapStyle.next(mapStyle);
  }

  setProductList(productList: object) {
    this.productList.next(productList);
  }

  setIsLogged(isLogged: boolean) {
    this.isLogged.next(isLogged);
  }

  setMapLayer(mapLayer: string) {
    this.mapLayer.next(mapLayer);
  }

  // setMapOverlay(mapOverlay: string) {
  //   this.mapOverlay.next(mapOverlay);
  // }

  setGssProtocol(gssProtocol: string) {
    this.gssProtocol.next(gssProtocol);
  }

  setOdataActive(isOdataActive: boolean) {
    this.isOdataActive.next(isOdataActive);
  }

  setStacActive(isStacActive: boolean) {
    this.isStacActive.next(isStacActive);
  }

  showProductOnMap(showProductIndex: any) {
    this.showProductIndex.next(showProductIndex);
  }

  selectProductOnMap(selectedProductIndex: number, selected: boolean) {
    this.selectedProductIndex.next({selectedProductIndex, selected});
  }

  startRectDrawing(rectDrawing: boolean) {
    this.rectDrawing.next(rectDrawing);
  }

  startPolygonDrawing(polygonDrawing: boolean) {
    this.polygonDrawing.next(polygonDrawing);
  }

  startPointDrawing(pointDrawing: boolean) {
    this.pointDrawing.next(pointDrawing);
  }

  cancelPolygonDrawing(cancelDrawing: boolean) {
    this.cancelDrawing.next(cancelDrawing);
  }

  updateGeoSearch(geoSearchOutput: string) {
    this.geoSearchOutput.next(geoSearchOutput);
  }

  updateGeoSearchStac(geoSearchOutput: {}) {
    this.geoSearchOutputStac.next(geoSearchOutput);
  }

  updateHoveredProduct(hoveredProduct: any) {
    this.hoveredProduct.next(hoveredProduct);
  }

  zoomToProduct(productId: string) {
    this.productIdOnMap.next(productId);
  }

  zoomToList(productId: string) {
    this.productIdOnList.next(productId);
  }

  showFootprintsMenu(event: any, array: any[]) {
    this.footprintMenuEvent.next({event, array});
  }

  hideGeoSearchToolbar(hide: boolean) {
    this.hideGeoSearchToolbarEvent.next(hide);
  }

  showGeoSearchToolbar(show: boolean) {
    this.showGeoSearchToolbarEvent.next(show);
  }
}
