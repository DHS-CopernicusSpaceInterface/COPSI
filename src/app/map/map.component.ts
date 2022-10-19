import { Component, OnDestroy, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ExchangeService } from '../exchange.service';
import { Subscription } from 'rxjs';

declare var mapboxgl: any;
declare let $: any;
declare let map: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {

  mapStyle = 'globe';
  productList: object = {};
  mapStyleSubscription!: Subscription;
  showLabelsSubscription!: Subscription;
  productListSubscription!: Subscription;

  constructor(private exchangeService: ExchangeService) {
  }

  ngOnInit(): void {
    this.mapStyleSubscription = this.exchangeService.selectedMapStyle.subscribe((value) => {
      if (typeof(value) === 'string') {
        this.mapStyle = value;
        this.initMap(this.mapStyle);
      }
    });
    this.showLabelsSubscription = this.exchangeService.selectedShowLabels.subscribe((value) => {
      if (typeof(value) === 'boolean') {
        this.changeMapDetails(value);
      }
    });
    this.productListSubscription = this.exchangeService.productListExchange.subscribe((value) => {
      if (typeof(value) === 'object') {
        this.productList = value;
        this.setProductList(this.productList);
      }
    });

    this.initMap('globe');
  }

  ngOnDestroy(): void {
    this.mapStyleSubscription.unsubscribe();
    this.showLabelsSubscription.unsubscribe();
    this.productListSubscription.unsubscribe();
  }

  initMap(map_style: string) {
    document.getElementById('map')!.innerHTML = "";
    mapboxgl.accessToken = environment.accessToken;
    map = new mapboxgl.Map({
      container: 'map',
      //style: 'mapbox://styles/spiderdab/cl8wvjdk3000315liyn5a5n0g',
      style: 'mapbox://styles/spiderdab/cl9cn3wtn007114mtpl68mvwd',
      center: [10.0, 45],
      zoom: 2.5,
      interactive: true,
      attributionControl: false,
      antialias: true,
      renderWorldCopies: false,
      projection: map_style // display the map as a 3D globe
    });


    map.on('load', () => {
      map.getStyle().layers.forEach((layer:any) => {
        if (layer.id.endsWith('label')) {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
      });

      map.addSource('footprints', {
        type: 'geojson',
        data: {
          "type": "FeatureCollection",
          "features": []
        }
      });
      map.addLayer({
        'id': 'footprints-fill',
        'type': 'fill',
        'source': 'footprints', // reference the data source
        'layout': {},
        'paint': {
        'fill-color': '#0080ff', // blue color fill
        'fill-opacity': 0.5
        }
      });
      map.addLayer({
        'id': 'footprints-outline',
        'type': 'line',
        'source': 'footprints',
        'layout': {},
        'paint': {
        'line-color': '#000',
        'line-width': 3
        }
      });
    });
  }

  changeMapDetails(showLabels: boolean) {
    if (showLabels) {
      map.getStyle().layers.forEach((layer:any) => {
        if (layer.id.endsWith('label')) {
          map.setLayoutProperty(layer.id, 'visibility', 'visible');
        }
      });
    } else {
      map.getStyle().layers.forEach((layer:any) => {
        if (layer.id.endsWith('label')) {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
      });
    }
  }

  setProductList(productList: any) {
    //console.log("SetProductList: " + JSON.stringify(productList, null, 2));
    const source = map.getSource('footprints');
    /* if (map != undefined && productList.products != null) {
      map.getSource('footprints').setData(
        {
          "type": "FeatureCollection",
          "features": [
            productList.products[0].geoJson
          ]
        }
      );
    } */
  }
}
