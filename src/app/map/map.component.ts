import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ExchangeService } from '../services/exchange.service';
import { Subscription } from 'rxjs';
/* Map Imports */
import { Deck, MapView, _GlobeView as GlobeView, COORDINATE_SYSTEM, FlyToInterpolator } from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer, GeoJsonLayer, ScatterplotLayer, SolidPolygonLayer } from '@deck.gl/layers';
import { wktToGeoJSON } from '@terraformer/wkt';
import { AppConfig } from '../services/app.config';
import { ToastComponent } from '../toast/toast.component';
import { FootprintsCustomizationConfig as FCConfig } from '../services/footprints_customization.config';

let canvasContainer: any;
let contextMenuContainer: any;
let deckGlobe: any;
let deckPlane: any;
let mapProjection: string = 'plane';
let initialProjection: string = 'globe';
let initialViewState: any;

/* Data to inject to the GeoJsonLayer */
let geojsonData: any = {
  "type": "FeatureCollection",
  "features": [
  ]
};

/* Base Map Styles Layer Data Array */
/* Managed default OSM Tile layer */
let mapLayers: any;
let selectedMapStyleIndex = 0;

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    standalone: false
})
export class MapComponent implements OnInit, OnDestroy, AfterViewInit {

  public platformDetailsList = AppConfig.settings.platformDetailsList;
  public customAttributesList = FCConfig.settings.customAttributesList;
  public currentProjection: string = "";
  public canDrawRect: boolean = false;
  public canDrawPolygon: boolean = false;
  public canDragPolygon: boolean = false;
  public drawPointAdded: boolean = false;
  public isHoveringOnPoints: boolean = false;
  public isHoveringOnPolygon: boolean = false;
  public isHoveringOnFootprint: boolean = false;
  public canShowFootprintsMenu: boolean = true;
  public canDragMap: boolean = true;
  public startDragCoordinates: number[] = [];
  public tempDrawPolygonArray: Array<Array<any>> = [[]];
  public geoSearchSettings: any = AppConfig.settings.geoSearchSettings;
  public geoSearchPolygonPresent: boolean = false;
  public geoSearchOutput: string = "";
  public contextMenuTimeoutId: any;
  public hoveredProductsArray: any[] = [];
  public hoveredObject: any = {};
  public maxPickableObjectsDepth: number = AppConfig.settings.footprints.maxPickableObjectsDepth;
  public showGeoSearchToolbar: boolean = AppConfig.settings.geoSearchSettings.showGeoSearchToolbar;
  public hideGeoSearchToolbar: boolean = false;
  public footprintAltitudeFactor: number = 10000000;
  public footprintAltitudeAddendum: number = 100000000;
  public footprintSelectedAltitudeAddendum: number = 500000000;
  public polygonAltitudeAddendum: number = 1000000000;
  public circlesAltitudeAddendum: number = 5000000000;
  public footprintZoomMultiplierFactor: number = 0;
  public selectedMapStyle: string = "OSM";
  public mapAttributionIsVisible: boolean = true;
  public mapAttributionShowTimeout: number = 5000;

  public drawGeoSearchCirclesData = [
    {
      "coordinates": [0, 90],
      "radius": 0
    }
  ];
  public drawGeoSearchPolygonData: any = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            []
          ]
        },
        "properties": {
          "fillColor": this.geoSearchSettings.fillColor,
          "borderColor": this.geoSearchSettings.borderColor
        }
      }
    ]
  };

  onDrawRectButtonClicked(val: boolean) {
    this.toast.showInfoToast('info', 'CLICK ON MAP TO PLACE FIRST VERTEX');
    this.canShowFootprintsMenu = false;
    this.canDrawRect = true;
    this.canDragPolygon = false;
    this.drawGeoSearchPolygonData = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": {
            "type": "Polygon",
            "coordinates": [[]]
          },
          "properties": {
            "fillColor": this.geoSearchSettings.fillColorActive,
            "borderColor": this.geoSearchSettings.borderColorActive
          }
        }
      ]
    };
    this.drawGeoSearchCirclesData = [
      {
        "coordinates": [0, 90],
        "radius": 0
      }
    ];
    this.tempDrawPolygonArray = [[]];
    this.geoSearchPolygonPresent = true;
    this.changeDrawLayer();
    this.hideContextMenu();
  }

  onDrawPolygonButtonClicked(val: boolean) {
    this.toast.showInfoToast('info', 'CLICK ON MAP TO PLACE FIRST VERTEX');
    this.canShowFootprintsMenu = false;
    this.canDrawPolygon = true;
    this.canDragPolygon = false;
    this.drawGeoSearchPolygonData = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": {
            "type": "Polygon",
            "coordinates": [[]]
          },
          "properties": {
            "fillColor": this.geoSearchSettings.fillColorActive,
            "borderColor": this.geoSearchSettings.borderColorActive
          }
        }
      ]
    };
    this.drawGeoSearchCirclesData = [
      {
        "coordinates": [0, 90],
        "radius": 0
      }
    ];
    this.tempDrawPolygonArray = [[]];
    this.geoSearchPolygonPresent = true;
    this.changeDrawLayer();
    this.hideContextMenu();
  }

  onCancelDrawingButtonClicked(val: boolean) {
    this.toast.showInfoToast('success', 'POLYGON DELETED');
    this.drawGeoSearchPolygonData = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": {
            "type": "Polygon",
            "coordinates": [[]]
          },
          "properties": {
            "fillColor": this.geoSearchSettings.fillColorActive,
            "borderColor": this.geoSearchSettings.borderColorActive
          }
        }
      ]
    };
    this.drawGeoSearchCirclesData = [
      {
        "coordinates": [0, 90],
        "radius": 0
      }
    ];
    this.tempDrawPolygonArray = [[]];
    this.canDrawRect = false;
    this.canDrawPolygon = false;
    this.canDragPolygon = false;
    this.geoSearchPolygonPresent = false;
    this.changeDrawLayer();
    this.geoSearchOutput = this.convertCoordinatesToGeographicQueryString(this.drawGeoSearchCirclesData);
    this.exchangeService.updateGeoSearchStac({});
    this.exchangeService.updateGeoSearch(this.geoSearchOutput);
    this.hideContextMenu();
    this.canShowFootprintsMenu = true;
  }

  convertCoordinatesToGeographicQueryString(points: any) {
  /*     Geographic Criteria example from ICD:
    Https://<service-root-uri>/odata/<odata-version>/Products?$filter=OData.CSC.Intersects(
      area=geography'SRID=4326;POLYGON((
        -127.8 45.2,
        -138.8 45.2,
        -138.8 56.2,
        -127.8 45.2
      ))'
    )
  */

    let outputArray: string = "";
    if (points.length > 2) {
      outputArray = "OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((";
      [].forEach.call(points, (point: any, idx: any) => {
        outputArray += point[0] + " " + point[1];
        if (idx !== points.length - 1) {
          outputArray += ",";
        };
      })
      outputArray += "))')";
    } else if (points.length === 2) {
      outputArray = "OData.CSC.Intersects(area=geography'SRID=4326;MULTIPOLYGON(";
      [].forEach.call(points, (arrayOfPoints: any, kdx: any) => {
        if (kdx > 0) {
          outputArray += ",";
        }
        outputArray += "((";
        [].forEach.call(arrayOfPoints[0], (point: any, idx: any) => {
          outputArray += point[0] + " " + point[1];
          if (idx !== arrayOfPoints[0].length - 1) {
            outputArray += ",";
          };
        })
        outputArray += "))";
      })
      outputArray += ")')";
    }

    return outputArray;
  }

  onClickOnMap(info: any, event: any) {
    if (event.rightButton === true) {
      return;
    }
    this.hideContextMenu();
    let tempPolygonJson: any;

    if (this.canDrawRect) {
      let tempPolygonArray = this.tempDrawPolygonArray;
      let tempPointsArray = this.drawGeoSearchCirclesData;

      /* Check if a point has passed the 180° meridian */
      if (info.coordinate[0] > 180) {
        info.coordinate[0] = -360 + info.coordinate[0];
      }
      if (info.coordinate[0] < -180) {
        info.coordinate[0] = 360 + info.coordinate[0];
      }

      if (info.coordinate[1] > this.geoSearchSettings.latitudeLimit) info.coordinate[1] = this.geoSearchSettings.latitudeLimit;
      if (info.coordinate[1] < -this.geoSearchSettings.latitudeLimit) info.coordinate[1] = -this.geoSearchSettings.latitudeLimit;

      if(tempPolygonArray[0].length == 0) {
        /* First point */
        tempPolygonArray[0].push(info.coordinate, info.coordinate, info.coordinate, info.coordinate, info.coordinate);
        tempPointsArray = [{"coordinates": info.coordinate, "radius": this.geoSearchSettings.defaultCircleRadius }];
        this.drawGeoSearchCirclesData = tempPointsArray;
        this.drawPointAdded = true;
        this.changeDrawLayer();
        this.tempDrawPolygonArray = tempPolygonArray;
        this.toast.showInfoToast('info', 'CLICK ON MAP TO FINISH');
      } else {
        let isCrossing: boolean = false;
        let tempArrayMulti: any;

        /* Close rectangle */
        tempPolygonArray[0].splice(1, 3, [info.coordinate[0], tempPolygonArray[0][0][1]], info.coordinate, [tempPolygonArray[0][0][0], info.coordinate[1]]);

        /* calc points */
        tempPointsArray = [
          tempPointsArray[0],
          {"coordinates": [info.coordinate[0], tempPolygonArray[0][0][1]], "radius": this.geoSearchSettings.defaultCircleRadius },
          {"coordinates": info.coordinate, "radius": this.geoSearchSettings.defaultCircleRadius },
          {"coordinates": [tempPolygonArray[0][0][0], info.coordinate[1]], "radius": this.geoSearchSettings.defaultCircleRadius }
        ];

        this.drawGeoSearchCirclesData = tempPointsArray;
        this.canDrawRect = false;
        this.canDragPolygon = true;
        /* Check if polygon is crossing the 180° meridian  */
        for (var i = 0; i < tempPolygonArray[0].length - 1; i++) {
          if (this.checkDaylineCrossing([tempPolygonArray[0][i], tempPolygonArray[0][i+1]])) {
            isCrossing = true;
            break;
          }
        }
        if (isCrossing) {
          tempArrayMulti = this.divideCrossingPolygonArray(tempPolygonArray);
          this.geoSearchOutput = this.convertCoordinatesToGeographicQueryString(tempArrayMulti);
          tempPolygonJson = {
            "type": "FeatureCollection",
            "features": [
              {
                "type": "Feature",
                "geometry": {
                  "type": "MultiPolygon",
                  "coordinates": tempArrayMulti
                },
                "properties": {
                  "fillColor": this.geoSearchSettings.fillColor,
                  "borderColor": this.geoSearchSettings.borderColor
                }
              }
            ]
          };
        } else {
          this.geoSearchOutput = this.convertCoordinatesToGeographicQueryString(tempPolygonArray[0]);
          tempPolygonJson = {
            "type": "FeatureCollection",
            "features": [
              {
                "type": "Feature",
                "geometry": {
                  "type": "Polygon",
                  "coordinates": tempPolygonArray
                },
                "properties": {
                  "fillColor": this.geoSearchSettings.fillColor,
                  "borderColor": this.geoSearchSettings.borderColor
                }
              }
            ]
          };
        }

        this.drawGeoSearchPolygonData = tempPolygonJson;
        this.changeDrawLayer();

        this.exchangeService.updateGeoSearchStac(this.drawGeoSearchPolygonData.features[0].geometry);
        this.exchangeService.updateGeoSearch(this.geoSearchOutput);
        this.canShowFootprintsMenu = true;
        this.tempDrawPolygonArray = tempPolygonArray;
      }
    } else if (this.canDrawPolygon) {

      if (info.coordinate[1] > this.geoSearchSettings.latitudeLimit) info.coordinate[1] = this.geoSearchSettings.latitudeLimit;
      if (info.coordinate[1] < -this.geoSearchSettings.latitudeLimit) info.coordinate[1] = -this.geoSearchSettings.latitudeLimit;

      let tempPolygonArray = this.tempDrawPolygonArray;

      let tempPointsArray = this.drawGeoSearchCirclesData;
      let tempFillColor = this.geoSearchSettings.fillColorActive;
      let tempBorderColor = this.geoSearchSettings.borderColorActive;
      if(tempPolygonArray[0].length == 0) {
        /* First point */
        this.toast.showInfoToast('info', 'CLICK ON MAP TO DRAW NEXT VERTEX');
        tempPolygonArray[0].push(info.coordinate, info.coordinate, info.coordinate);
        tempPointsArray = [{"coordinates": info.coordinate, "radius": this.geoSearchSettings.bigCircleRadius }];
        this.drawGeoSearchCirclesData = tempPointsArray;
        this.drawPointAdded = true;
        this.changeDrawLayer();
        this.tempDrawPolygonArray = tempPolygonArray;
      } else {
        let isCrossing: boolean = false;
        let tempArrayMulti: any;
        if (info.layer != null && info.layer.id === "scatterplot-layer" && info.index === 0) {
          /* Closing polygon */
          if (tempPolygonArray[0].length < 5) {
            this.onCancelDrawingButtonClicked(true);
            this.toast.showInfoToast('error', 'POLYGON DELETED: AT LEAST 3 VERTEX NEEDED');
            return;
          }
          this.toast.showInfoToast('success', 'POLYGON IS VALID');
          tempPolygonArray[0].splice(-2, 1);
          tempPointsArray = [];
          for (var i = 0; i < this.drawGeoSearchCirclesData.length; i++) {
            tempPointsArray.push({"coordinates": this.drawGeoSearchCirclesData[i].coordinates, "radius": this.geoSearchSettings.defaultCircleRadius });
          }
          tempFillColor = this.geoSearchSettings.fillColor;
          tempBorderColor = this.geoSearchSettings.borderColor;
          this.canDrawPolygon = false;
          this.canDragPolygon = true;

          /* Check if polygon is crossing the 180° meridian  */
          for (var i = 0; i < tempPolygonArray[0].length - 1; i++) {
            if (this.checkDaylineCrossing([tempPolygonArray[0][i], tempPolygonArray[0][i+1]])) {
              isCrossing = true;
              break;
            }
          }
          if (isCrossing) {
            tempArrayMulti = this.divideCrossingPolygonArray(tempPolygonArray);
            this.geoSearchOutput = this.convertCoordinatesToGeographicQueryString(tempArrayMulti);
          } else {
            this.geoSearchOutput = this.convertCoordinatesToGeographicQueryString(tempPolygonArray[0]);
          }

          this.exchangeService.updateGeoSearchStac({type: (isCrossing ? "MultiPolygon" : "Polygon"), coordinates: (isCrossing ? tempArrayMulti : tempPolygonArray)});
          this.exchangeService.updateGeoSearch(this.geoSearchOutput);
          this.canShowFootprintsMenu = true;
        } else {
          /* Adding a vertex */
          tempPolygonArray[0].length === 3 ?
            this.toast.showInfoToast('info', 'CLICK ON MAP TO DRAW NEXT VERTEX') :
            this.toast.showInfoToast('info', 'CLICK ON FIRST POINT TO CLOSE POLYGON');

          /* Check if polygon is crossing the 180° meridian  */
          let crossPointsNumber: number = 0;
          for (var i = 0; i < tempPolygonArray[0].length - 1; i++) {
            if (this.checkDaylineCrossing([tempPolygonArray[0][i], tempPolygonArray[0][i+1]])) {
              isCrossing = true;
              crossPointsNumber++;
            }
          }
          if (crossPointsNumber <= 1) {
            info.coordinate[0] = this.limitPolygonTo180(info.coordinate[0], this.tempDrawPolygonArray[0]);
            tempPolygonArray[0].splice(-2, 0, info.coordinate);
            isCrossing = false;
          } else {
            tempPolygonArray[0].splice(-2, 0, info.coordinate);
          }
          if (isCrossing) {
            tempArrayMulti = this.divideCrossingPolygonArray(tempPolygonArray);
          }
          tempPointsArray = tempPointsArray.concat([{"coordinates": info.coordinate, "radius": this.geoSearchSettings.smallCircleRadius }]);
        }

        this.drawPointAdded = true;
        if (isCrossing) {
          tempPolygonJson = {
            "type": "FeatureCollection",
            "features": [
              {
                "type": "Feature",
                "geometry": {
                  "type": "MultiPolygon",
                  "coordinates": tempArrayMulti
                },
                "properties": {
                  "fillColor": tempFillColor,
                  "borderColor": tempBorderColor
                }
              }
            ]
          };
        } else {
          tempPolygonJson = {
            "type": "FeatureCollection",
            "features": [
              {
                "type": "Feature",
                "geometry": {
                  "type": "Polygon",
                  "coordinates": tempPolygonArray
                },
                "properties": {
                  "fillColor": tempFillColor,
                  "borderColor": tempBorderColor
                }
              }
            ]
          };
        }
        this.drawGeoSearchPolygonData = tempPolygonJson;
        this.drawGeoSearchCirclesData = tempPointsArray;
        this.tempDrawPolygonArray = tempPolygonArray;
        this.changeDrawLayer();
      }
    } else if (this.canShowFootprintsMenu) {
      if (info.index === -1) return;
      this.exchangeService.showFootprintsMenu(event, this.hoveredProductsArray);
    }
  }

  onHoverOnMap(info: any) {
    if (info.viewport !== undefined) {
      this.hoveredProductsArray = [];
      /* set bools to change cursor type */
      this.isHoveringOnPoints = false;
      this.isHoveringOnPolygon = false;
      this.isHoveringOnFootprint = false;
      if (info.layer !== null) {
        if (info.layer.id === 'scatterplot-layer') {
          this.isHoveringOnPoints = true;
          this.isHoveringOnPolygon = false;
          this.isHoveringOnFootprint = false;
        } else if (info.layer.id === 'draw-layer') {
          this.isHoveringOnPoints = false;
          this.isHoveringOnPolygon = true;
          this.isHoveringOnFootprint = false;
        } else if (info.layer.id === 'geojson-layer-selected') {
          this.isHoveringOnPoints = false;
          this.isHoveringOnPolygon = false;
          if (info.index > -1) {
            this.isHoveringOnFootprint = true;
          } else {
            this.hideProductFootprint();
          }
        }
      }

      if (this.canDrawRect || this.canDrawPolygon) {
        this.hideProductFootprint();
        this.exchangeService.updateHoveredProduct(undefined);
      }

      if (this.canDrawRect) {
        let tempJson: any;
        let isCrossing: boolean = false;

        if (info.coordinate[1] > this.geoSearchSettings.latitudeLimit) info.coordinate[1] = this.geoSearchSettings.latitudeLimit;
        if (info.coordinate[1] < -this.geoSearchSettings.latitudeLimit) info.coordinate[1] = -this.geoSearchSettings.latitudeLimit;

        /* Check if a point has passed the 180° meridian */
        for (let i = 0; i < this.tempDrawPolygonArray[0].length; i++) {
          if (this.tempDrawPolygonArray[0][i][0] > 180) {
            this.tempDrawPolygonArray[0][i][0] = -360 + this.tempDrawPolygonArray[0][i][0];
          }
          if (this.tempDrawPolygonArray[0][i][0] < -180) {
            this.tempDrawPolygonArray[0][i][0] = 360 + this.tempDrawPolygonArray[0][i][0];
          }
        }

        if(this.tempDrawPolygonArray[0].length > 0 && this.tempDrawPolygonArray[0].length <= 5) {
          /* Check if a point has passed the 180° meridian */
          if (info.coordinate[0] > 180) {
            info.coordinate[0] = -360 + info.coordinate[0];
          }
          if (info.coordinate[0] < -180) {
            info.coordinate[0] = 360 + info.coordinate[0];
          }
          this.tempDrawPolygonArray[0].splice(-4, 3, [info.coordinate[0], this.tempDrawPolygonArray[0][0][1]], info.coordinate, [this.tempDrawPolygonArray[0][0][0], info.coordinate[1]]);
        }

        /* Check if polygon is crossing the 180° meridian */
        for (var i = 0; i < this.tempDrawPolygonArray[0].length - 1; i++) {
          if (this.checkDaylineCrossing([this.tempDrawPolygonArray[0][i], this.tempDrawPolygonArray[0][i+1]])) {
            isCrossing = true;
            break;
          }
        }

        if (isCrossing) {
          if(this.tempDrawPolygonArray[0].length > 0 && this.tempDrawPolygonArray[0].length <= 5) {
            let tempArrayMulti = this.divideCrossingPolygonArray(this.tempDrawPolygonArray);
            tempJson = {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": tempArrayMulti
                  },
                  "properties": {
                    "fillColor": this.geoSearchSettings.fillColorActive,
                    "borderColor": this.geoSearchSettings.borderColorActive
                  }
                }
              ]
            };
          }
        } else {
          if(this.tempDrawPolygonArray[0].length > 0 && this.tempDrawPolygonArray[0].length <= 5) {
            tempJson = {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": this.tempDrawPolygonArray
                  },
                  "properties": {
                    "fillColor": this.geoSearchSettings.fillColorActive,
                    "borderColor": this.geoSearchSettings.borderColorActive
                  }
                }
              ]
            };
          }
        }
        this.drawGeoSearchPolygonData = tempJson;


      } else if (this.canDrawPolygon) {
        let tempJson: any;
        let isCrossing: boolean = false;

        if (info.coordinate[1] > this.geoSearchSettings.latitudeLimit) info.coordinate[1] = this.geoSearchSettings.latitudeLimit;
        if (info.coordinate[1] < -this.geoSearchSettings.latitudeLimit) info.coordinate[1] = -this.geoSearchSettings.latitudeLimit;

        if(this.tempDrawPolygonArray[0].length > 0) {
          /* Check if a point has passed the 180° meridian */
          if (info.coordinate[0] > 180) {
            info.coordinate[0] = -360 + info.coordinate[0];
          }
          if (info.coordinate[0] < -180) {
            info.coordinate[0] = 360 + info.coordinate[0];
          }
          this.tempDrawPolygonArray[0].splice(-2, 1, info.coordinate);
        }
        /* Check if polygon is crossing the 180° meridian */
        let crossPointsNumber: number = 0;
        for (var i = 0; i < this.tempDrawPolygonArray[0].length - 1; i++) {
          if (this.checkDaylineCrossing([this.tempDrawPolygonArray[0][i], this.tempDrawPolygonArray[0][i+1]])) {
            isCrossing = true;
            crossPointsNumber++;
          }
        }
        if (crossPointsNumber === 1) {
          info.coordinate[0] = this.limitPolygonTo180(info.coordinate[0], this.tempDrawPolygonArray[0]);
          isCrossing = false;
        }
        if (isCrossing) {
          if(this.tempDrawPolygonArray[0].length > 0) {
            let tempArrayMulti = this.divideCrossingPolygonArray(this.tempDrawPolygonArray);
            tempJson = {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": tempArrayMulti
                  },
                  "properties": {
                    "fillColor": this.geoSearchSettings.fillColorActive,
                    "borderColor": this.geoSearchSettings.borderColorActive
                  }
                }
              ]
            };
            this.drawGeoSearchPolygonData = tempJson;
          }
        } else {
          if(this.tempDrawPolygonArray[0].length > 0) {
            tempJson = {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": this.tempDrawPolygonArray
                  },
                  "properties": {
                    "fillColor": this.geoSearchSettings.fillColorActive,
                    "borderColor": this.geoSearchSettings.borderColorActive
                  }
                }
              ]
            };
            this.drawGeoSearchPolygonData = tempJson;
          }
        }
      } else if (this.canShowFootprintsMenu) {
        /* MultiProduct Picking */
        let infos: any = undefined;
        if (this.isHoveringOnFootprint) {
          if (this.currentProjection == 'globe') {
            infos = deckGlobe.pickMultipleObjects({x: info.x, y: info.y, radius: 1, depth: this.maxPickableObjectsDepth});
          } else {
            infos = deckPlane.pickMultipleObjects({x: info.x, y: info.y, radius: 1, depth: this.maxPickableObjectsDepth});
          }
          let tempHoveredIndexesArray: any[] = [-1];
          if (infos.length > 0) {
            infos = infos.filter((obj: any) => (obj.layer.id === "geojson-layer-selected"));
            /* Uncomment to select only identical footprints: */
            //infos = infos.filter((obj: any) => (this.arrayEquals(obj.object.geometry.coordinates[0], info.object.geometry.coordinates[0])));

            infos.forEach((info: any) => {
              tempHoveredIndexesArray.push(info.index);
            });
            this.hoveredProductsArray = this.productList.value.filter((product: any, index: number) => (tempHoveredIndexesArray.includes(index)));
          }
          this.showProductFootprint(tempHoveredIndexesArray);
          this.exchangeService.updateHoveredProduct(infos);
        } else {
          this.exchangeService.updateHoveredProduct(undefined);
        }
      }
      this.changeDrawLayer();
    }
  }

  limitPolygonTo180(xCoord: number, polygonArray: any):number {
    if(polygonArray.length > 3) {
      /* Limit drawing segments to 180° */
      let pointBefore = polygonArray[polygonArray.length - 3][0];
      let pointAfter = polygonArray[0][0];

      if (xCoord >= 0) {
        if (pointAfter < 0 || pointBefore < 0) {
          if (xCoord - pointBefore > 180) {
            xCoord = 180 + pointBefore;
          }
          if (xCoord - pointAfter > 180) {
            xCoord = 180 + pointAfter;
          }
        }
      } else if (xCoord < 0) {
        if (pointAfter >= 0 && pointBefore >= 0) {
          if (xCoord -  pointBefore < -180) {
            xCoord = -180 + pointBefore;
          }
          if (xCoord - pointAfter < -180) {
            xCoord = -180 + pointAfter;
          }
        }
      }
    }
    return xCoord;
  }

  onPointDragStart() {
    if (this.canDragPolygon) {
      deckGlobe.setProps({
        controller: {keyboard: false, inertia: true, doubleClickZoom: false, dragPan: false}
      });
      deckPlane.setProps({
        controller: {keyboard: false, inertia: true, doubleClickZoom: false, dragPan: false}
      });
      this.canShowFootprintsMenu = false;
    }
  }

  onPointDrag(info: any) {
    if (this.canDragPolygon) {
      if (info.layer != null && info.layer.id === "scatterplot-layer") {
        let tempPolygonJson: any;

        let tempPolygonArray = this.tempDrawPolygonArray;
        let precPolygonArray = this.tempDrawPolygonArray;

        let tempPointsArray = [];
        let precPointsArray = this.drawGeoSearchCirclesData;

        let isCrossing: boolean = false;

        let tempFillColor = this.geoSearchSettings.fillColorActive;
        let tempBorderColor = this.geoSearchSettings.borderColorActive;
        if (info.coordinate[1] > this.geoSearchSettings.latitudeLimit) info.coordinate[1] = this.geoSearchSettings.latitudeLimit;
        if (info.coordinate[1] < -this.geoSearchSettings.latitudeLimit) info.coordinate[1] = -this.geoSearchSettings.latitudeLimit;

        tempPolygonArray[0][info.index] = (info.coordinate);
        if (info.index == 0) {
          tempPolygonArray[0][tempPolygonArray[0].length - 1] = (info.coordinate);
        }

        /* Check if a point has passed the 180° meridian */
        for (let i = 0; i < this.tempDrawPolygonArray[0].length; i++) {
          if (precPolygonArray[0][i][0] > 0 && tempPolygonArray[0][i][0] > 180) {
            tempPolygonArray[0][i][0] = -360 + tempPolygonArray[0][i][0];
          }
          if (precPolygonArray[0][i][0] < 0 && tempPolygonArray[0][i][0] < -180) {
            tempPolygonArray[0][i][0] = 360 + tempPolygonArray[0][i][0];
          }
        }

        /* Check if polygon is crossing the 180° meridian */
        for (var i = 0; i < tempPolygonArray[0].length - 1; i++) {
          if (this.checkDaylineCrossing([tempPolygonArray[0][i], tempPolygonArray[0][i+1]])) {
            isCrossing = true;
            break;
          }
        }
        if (isCrossing) {
          let tempArrayMulti = this.divideCrossingPolygonArray(tempPolygonArray);
          tempPolygonJson = {
            "type": "FeatureCollection",
            "features": [
              {
                "type": "Feature",
                "geometry": {
                  "type": "MultiPolygon",
                  "coordinates": tempArrayMulti
                },
                "properties": {
                  "fillColor": tempFillColor,
                  "borderColor": tempBorderColor
                }
              }
            ]
          };
        } else {
          tempPolygonJson = {
            "type": "FeatureCollection",
            "features": [
              {
                "type": "Feature",
                "geometry": {
                  "type": "Polygon",
                  "coordinates": tempPolygonArray
                },
                "properties": {
                  "fillColor": tempFillColor,
                  "borderColor": tempBorderColor
                }
              }
            ]
          };
        }

        for (var i = 0; i < this.drawGeoSearchCirclesData.length; i++) {
          if (i === info.index) {
            tempPointsArray.push({"coordinates": info.coordinate, "radius": this.geoSearchSettings.smallCircleRadius });
          } else {
            tempPointsArray.push({"coordinates": this.drawGeoSearchCirclesData[i].coordinates, "radius": this.geoSearchSettings.defaultCircleRadius });
          }
          if (precPointsArray[i].coordinates[0] > 0 && tempPointsArray[i].coordinates[0] > 180) {
            tempPointsArray[i].coordinates[0] = -360 + tempPointsArray[i].coordinates[0];
          }
          if (precPointsArray[i].coordinates[0] < 0 && tempPointsArray[i].coordinates[0] < -180) {
            tempPointsArray[i].coordinates[0] = 360 + tempPointsArray[i].coordinates[0];
          }
        }

        this.drawGeoSearchPolygonData = tempPolygonJson;
        this.drawGeoSearchCirclesData = tempPointsArray;
        this.tempDrawPolygonArray = tempPolygonArray;
        this.canDrawPolygon = false;
        this.changeDrawLayer();
      }
    }
  }

  onPointDragEnd() {
    if (this.canDragPolygon) {
      let isCrossing: boolean = false;
      let tempArrayMulti: any;
      let tempPolygonArray = this.tempDrawPolygonArray;
      let tempPolygonJson = this.drawGeoSearchPolygonData;
      let tempPointsArray = [];

      /* Check if polygon is crossing the 180° meridian  */
      for (var i = 0; i < tempPolygonArray[0].length - 1; i++) {
        if (this.checkDaylineCrossing([tempPolygonArray[0][i], tempPolygonArray[0][i+1]])) {
          isCrossing = true;
          break;
        }
      }
      if (isCrossing) {
        tempArrayMulti = this.divideCrossingPolygonArray(tempPolygonArray);
        this.geoSearchOutput = this.convertCoordinatesToGeographicQueryString(tempArrayMulti);
        tempPolygonJson = {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "geometry": {
                "type": "MultiPolygon",
                "coordinates": tempArrayMulti
              },
              "properties": {
                "fillColor": this.geoSearchSettings.fillColor,
                "borderColor": this.geoSearchSettings.borderColor
              }
            }
          ]
        };
      } else {
        this.geoSearchOutput = this.convertCoordinatesToGeographicQueryString(tempPolygonArray[0]);
        tempPolygonJson = {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "geometry": {
                "type": "Polygon",
                "coordinates": tempPolygonArray
              },
              "properties": {
                "fillColor": this.geoSearchSettings.fillColor,
                "borderColor": this.geoSearchSettings.borderColor
              }
            }
          ]
        };
      }

      for (var i = 0; i < this.drawGeoSearchCirclesData.length; i++) {
        tempPointsArray.push({"coordinates": this.drawGeoSearchCirclesData[i].coordinates, "radius": this.geoSearchSettings.defaultCircleRadius });
      }

      this.drawGeoSearchPolygonData = tempPolygonJson;
      this.drawGeoSearchCirclesData = tempPointsArray;
      this.changeDrawLayer();
      this.tempDrawPolygonArray = tempPolygonArray;
      this.exchangeService.updateGeoSearchStac(this.drawGeoSearchPolygonData.features[0].geometry);
      this.exchangeService.updateGeoSearch(this.geoSearchOutput);

      deckGlobe.setProps({
        controller: {keyboard: false, inertia: true, doubleClickZoom: false, dragPan: true}
      });
      deckPlane.setProps({
        controller: {keyboard: false, inertia: true, doubleClickZoom: false, dragPan: true}
      });
      this.canShowFootprintsMenu = true;
    }
  }

  onPolygonDragStart(info: any) {
    if (this.canDragPolygon) {
      this.startDragCoordinates = info.coordinate;
      deckGlobe.setProps({
        controller: {keyboard: false, inertia: true, doubleClickZoom: false, dragPan: false}
      });
      deckPlane.setProps({
        controller: {keyboard: false, inertia: true, doubleClickZoom: false, dragPan: false}
      });
      this.canShowFootprintsMenu = false;
    }
  }

  onPolygonDrag(info: any) {
    if (this.canDragPolygon) {
      if (info.layer != null && info.layer.id === "draw-layer") {
        let tempDeltaDragCoordinates: number[] = [(info.coordinate[0] - this.startDragCoordinates[0]), (info.coordinate[1] - this.startDragCoordinates[1])];
        this.startDragCoordinates = info.coordinate;
        let tempPolygonArray: Array<Array<any>> = [[]];
        let precPolygonArray = this.tempDrawPolygonArray;
        let tempPointsArray = [];
        let precPointsArray = this.drawGeoSearchCirclesData;
        let tempFillColor = this.geoSearchSettings.fillColorActive;
        let tempBorderColor = this.geoSearchSettings.borderColorActive;
        let canMovePolygon: boolean = true;

        for (let i = 0; i < this.tempDrawPolygonArray[0].length; i++) {
          if (this.tempDrawPolygonArray[0][i][1] + tempDeltaDragCoordinates[1] > this.geoSearchSettings.latitudeLimit
          || this.tempDrawPolygonArray[0][i][1] + tempDeltaDragCoordinates[1] < -this.geoSearchSettings.latitudeLimit) {
            canMovePolygon = false;
          }
        }
        if (canMovePolygon) {
          let tempPolygonJson: any;
          let isCrossing: boolean = false;
          for (let i = 0; i < this.tempDrawPolygonArray[0].length; i++) {
            tempPolygonArray[0].push(
              [
                this.tempDrawPolygonArray[0][i][0] + tempDeltaDragCoordinates[0],
                this.tempDrawPolygonArray[0][i][1] + tempDeltaDragCoordinates[1]
              ]
            );
          }

          /* Check if a point has passed the 180° meridian */
          for (let i = 0; i < this.tempDrawPolygonArray[0].length; i++) {
            if (precPolygonArray[0][i][0] > 0 && tempPolygonArray[0][i][0] > 180) {
              tempPolygonArray[0][i][0] = -360 + tempPolygonArray[0][i][0];
            }
            if (precPolygonArray[0][i][0] < 0 && tempPolygonArray[0][i][0] < -180) {
              tempPolygonArray[0][i][0] = 360 + tempPolygonArray[0][i][0];
            }
          }

          /* Check if polygon is crossing the 180° meridian */
          for (var i = 0; i < tempPolygonArray[0].length - 1; i++) {
            if (this.checkDaylineCrossing([tempPolygonArray[0][i], tempPolygonArray[0][i+1]])) {
              isCrossing = true;
              break;
            }
          }
          if (isCrossing) {
            let tempArrayMulti = this.divideCrossingPolygonArray(tempPolygonArray);
            tempPolygonJson = {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": tempArrayMulti
                  },
                  "properties": {
                    "fillColor": tempFillColor,
                    "borderColor": tempBorderColor
                  }
                }
              ]
            };
          } else {
            tempPolygonJson = {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": tempPolygonArray
                  },
                  "properties": {
                    "fillColor": tempFillColor,
                    "borderColor": tempBorderColor
                  }
                }
              ]
            };
          }

          for (var i = 0; i < this.drawGeoSearchCirclesData.length; i++) {
            tempPointsArray.push(
              {
                "coordinates":
                  [
                    this.drawGeoSearchCirclesData[i].coordinates[0] + tempDeltaDragCoordinates[0], this.drawGeoSearchCirclesData[i].coordinates[1] + tempDeltaDragCoordinates[1]
                  ],
                "radius": this.geoSearchSettings.smallCircleRadius
              }
            );
            if (precPointsArray[i].coordinates[0] > 0 && tempPointsArray[i].coordinates[0] > 180) {
              tempPointsArray[i].coordinates[0] = -360 + tempPointsArray[i].coordinates[0];
            }
            if (precPointsArray[i].coordinates[0] < 0 && tempPointsArray[i].coordinates[0] < -180) {
              tempPointsArray[i].coordinates[0] = 360 + tempPointsArray[i].coordinates[0];
            }
          }
          this.drawGeoSearchPolygonData = tempPolygonJson;
          this.drawGeoSearchCirclesData = tempPointsArray;
          this.tempDrawPolygonArray = tempPolygonArray;
        }

        this.canDrawPolygon = false;
        this.changeDrawLayer();
      }
    }
  }

  onPolygonDragEnd() {
    if (this.canDragPolygon) {
      let isCrossing: boolean = false;
      let tempArrayMulti: any;
      let tempPolygonArray = this.tempDrawPolygonArray;
      let tempPolygonJson = this.drawGeoSearchPolygonData;
      let tempPointsArray = [];

      /* Check if polygon is crossing the 180° meridian  */
      for (var i = 0; i < tempPolygonArray[0].length - 1; i++) {
        if (this.checkDaylineCrossing([tempPolygonArray[0][i], tempPolygonArray[0][i+1]])) {
          isCrossing = true;
          break;
        }
      }
      if (isCrossing) {
        tempArrayMulti = this.divideCrossingPolygonArray(tempPolygonArray);
        this.geoSearchOutput = this.convertCoordinatesToGeographicQueryString(tempArrayMulti);
        tempPolygonJson = {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "geometry": {
                "type": "MultiPolygon",
                "coordinates": tempArrayMulti
              },
              "properties": {
                "fillColor": this.geoSearchSettings.fillColor,
                "borderColor": this.geoSearchSettings.borderColor
              }
            }
          ]
        };
      } else {
        this.geoSearchOutput = this.convertCoordinatesToGeographicQueryString(tempPolygonArray[0]);
        tempPolygonJson = {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "geometry": {
                "type": "Polygon",
                "coordinates": tempPolygonArray
              },
              "properties": {
                "fillColor": this.geoSearchSettings.fillColor,
                "borderColor": this.geoSearchSettings.borderColor
              }
            }
          ]
        };
      }

      for (var i = 0; i < this.drawGeoSearchCirclesData.length; i++) {
        tempPointsArray.push({"coordinates": this.drawGeoSearchCirclesData[i].coordinates, "radius": this.geoSearchSettings.defaultCircleRadius });
      }

      this.drawGeoSearchPolygonData = tempPolygonJson;
      this.drawGeoSearchCirclesData = tempPointsArray;
      this.changeDrawLayer();
      this.tempDrawPolygonArray = tempPolygonArray;

      this.exchangeService.updateGeoSearchStac(this.drawGeoSearchPolygonData.features[0].geometry);
      this.exchangeService.updateGeoSearch(this.geoSearchOutput);

      deckGlobe.setProps({
        controller: {keyboard: false, inertia: true, doubleClickZoom: false, dragPan: true}
      });
      deckPlane.setProps({
        controller: {keyboard: false, inertia: true, doubleClickZoom: false, dragPan: true}
      });
      this.canShowFootprintsMenu = true;
    }
  }


  public mapLayers: any = AppConfig.settings.styles;
  public drawTileLayer = (selectedMapStyleIndex === 0 ? true : false);

  public productList: any;
  public mapStyleSubscription!: Subscription;
  public mapLayerSubscription!: Subscription;
  public showLabelsSubscription!: Subscription;
  public productListSubscription!: Subscription;
  public showProductIndexSubscription!: Subscription;
  public selectedProductIdSubscription!: Subscription;
  public startRectDrawingSubscription!: Subscription;
  public startPolygonDrawingSubscription!: Subscription;
  public cancelDrawingSubscription!: Subscription;
  public zoomToProductSubscription!: Subscription;
  public hideGeoSearchToolbarSubscription! : Subscription;

  public fallBackFootprintColor: number[] = this.rgbConvertToArray(AppConfig.settings.footprints.fallBackColor);
  public fallBackFootprintBorderColor: number[] = this.rgbConvertToArray(AppConfig.settings.footprints.fallBackBorderColor);
  public fallBackFootprintHoverColor: number[] = this.rgbConvertToArray(AppConfig.settings.footprints.fallBackHoverColor);
  public fallBackFootprintHoverBorderColor: number[] = this.rgbConvertToArray(AppConfig.settings.footprints.fallBackHoverBorderColor);
  public selectedFootprintBorderColor: number[] = this.rgbConvertToArray(AppConfig.settings.footprints.selectedBorderColor);

  public defaultFootprintBorderWidth: number = AppConfig.settings.footprints.defaultBorderWidth;
  public selectedFootprintBorderWidth: number = AppConfig.settings.footprints.selectedBorderWidth;
  public hoveredFootprintBorderWidth: number = AppConfig.settings.footprints.hoveredBorderWidth;
  public selectedFootprintIndex: number[] = [-1];
  public selectedProductIndexes: number[] = [];

  public worldBackgroundFeature = {
    "type": "FeatureCollection",
    "name": "background",
    "features": [
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-180, -90],
            [-180,  90],
            [ 180,  90],
            [ 180, -90],
            [-180, -90]
          ]]
        }
      }
    ]
  }

  /* Base Map Layer */
  public mapLayerPlane: any;
  public mapLayerGlobe: any;

  // Old style globe background (Sea)
  /* public backgroundLayerGlobe = new SolidPolygonLayer({
    id: 'background-globe',
    data: [[
      [0, -80],
      [0, 80],
      [80, 80],
      [80, -80],
      [0, -80]
    ]],
    getPolygon: (d: any) => d,
    getPolygonOffset: (layerIndex:any) => [this.footprintZoomMultiplierFactor, 10000000000],
    stroked: false,
    filled: true,
    //fp64: true,
    //extruded: true,
    //getElevation: 100000,
    visible: !this.drawTileLayer,
    getFillColor: this.mapLayers[selectedMapStyleIndex].seaColor
  }) */

  public backgroundLayerGlobe = new GeoJsonLayer({
    id: 'background-globe',
    data: this.worldBackgroundFeature,
    stroked: false,
    filled: true,
    visible: !this.drawTileLayer,
    pickable: false,
    extruded: false,
    getFillColor: this.mapLayers[selectedMapStyleIndex].seaColor,
    getLineColor: this.mapLayers[selectedMapStyleIndex].borderColor,
    getPolygonOffset: (layerIndex:any) => [this.footprintZoomMultiplierFactor, -(layerIndex.layerIndex * this.footprintAltitudeFactor + this.footprintAltitudeAddendum)],
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 1,
    lineWidthMaxPixels: this.defaultFootprintBorderWidth,
    getLineWidth: 1,
    wrapLongitude: true,
    highlightedObjectIndex: -1,
    fp64: true,
    parameters: {
      depthTest: false
    }
  });

  public backgroundLayerPlane = new SolidPolygonLayer({
    id: 'background-plane',
    data: [
      [[-180, 90], [0, 90], [180, 90], [180, -90], [0, -90], [-180, -90]]
    ],
    getPolygon: (d: any) => d,
    getPolygonOffset: (layerIndex:any) => [this.footprintZoomMultiplierFactor, -(layerIndex.layerIndex * this.footprintAltitudeFactor + this.footprintAltitudeAddendum)],
    stroked: false,
    filled: true,
    visible: !this.drawTileLayer,
    getFillColor: this.mapLayers[selectedMapStyleIndex].seaColor
  })

  public geoJsonMapLayerGlobe = new GeoJsonLayer({
    id: 'geo-json-map-layer-globe',
    // data: AppConfig.settings.baseUrl + 'assets/world-maps/world-countries.geojson', // Highly detailed map
    data: AppConfig.settings.baseUrl + 'assets/world-maps/ne_50m_admin_0_countries.geojson', // Medium-high detailed map
    // data: AppConfig.settings.baseUrl + 'assets/world-maps/ne_110m_admin_0_countries.geojson', // Mediumly detailed map
    // data: AppConfig.settings.baseUrl + 'assets/world-maps/ne_110m_land.geojson', // Lowly detailed map
    stroked: true,
    filled: true,
    visible: !this.drawTileLayer,
    pickable: false,
    extruded: false,
    getFillColor: this.mapLayers[selectedMapStyleIndex].terrainColor,
    getLineColor: this.mapLayers[selectedMapStyleIndex].borderColor,
    getPolygonOffset: (layerIndex:any) => [this.footprintZoomMultiplierFactor, -(layerIndex.layerIndex * this.footprintAltitudeFactor + this.footprintAltitudeAddendum)],
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 1,
    lineWidthMaxPixels: this.defaultFootprintBorderWidth,
    getLineWidth: 1,
    wrapLongitude: true,
    highlightedObjectIndex: -1,
    fp64: true,
    onDataLoad: () => {
      if (this.currentProjection === 'globe') {
        let mapGlobe = document.getElementById('map-globe')!;
        if (mapGlobe.classList.contains('loading')) mapGlobe.classList.remove('loading');
      }
    }
  });

  public geoJsonMapLayerPlane = new GeoJsonLayer({
    id: 'geo-json-map-layer-plane',
    // data: AppConfig.settings.baseUrl + 'assets/world-maps/world-countries.geojson', // Highly detailed map
    data: AppConfig.settings.baseUrl + 'assets/world-maps/ne_50m_admin_0_countries.geojson', // Medium-high detailed map
    // data: AppConfig.settings.baseUrl + 'assets/world-maps/ne_110m_admin_0_countries.geojson', // Mediumly detailed map
    // data: AppConfig.settings.baseUrl + 'assets/world-maps/ne_110m_land.geojson', // Lowly detailed map
    stroked: true,
    filled: true,
    visible: !this.drawTileLayer,
    pickable: false,
    extruded: false,
    getFillColor: this.mapLayers[selectedMapStyleIndex].terrainColor,
    getLineColor: this.mapLayers[selectedMapStyleIndex].borderColor,
    getPolygonOffset: (layerIndex:any) => [this.footprintZoomMultiplierFactor, -(layerIndex.layerIndex * this.footprintAltitudeFactor + this.footprintAltitudeAddendum)],
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 1,
    lineWidthMaxPixels: this.defaultFootprintBorderWidth,
    getLineWidth: 1,
    wrapLongitude: true,
    highlightedObjectIndex: -1,
    fp64: true,
    onViewportLoad: () => {
      if (this.currentProjection === 'plane') {
        let mapPlane = document.getElementById('map-plane')!;
        if (mapPlane.classList.contains('loading')) mapPlane.classList.remove('loading');
      }
    }
  });

  public geojsonLayerPlane = new GeoJsonLayer({
    id: 'geojson-layer',
    data: geojsonData,
    pickable: false,
    stroked: true,
    visible: true,
    filled: true,
    extruded: false,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 1,
    lineWidthMaxPixels: this.defaultFootprintBorderWidth,
    getLineWidth: this.defaultFootprintBorderWidth,
    getFillColor: (d:any, f:any) => d.properties.Color,
    getLineColor: (d:any, f:any) => d.properties.BorderColor,
    getPolygonOffset: (layerIndex:any) => [this.footprintZoomMultiplierFactor, -(layerIndex.layerIndex * this.footprintAltitudeFactor + this.footprintAltitudeAddendum)],
    wrapLongitude: true,
    highlightedObjectIndex: -1,
    fp64: true
  })

  public geojsonLayerPlaneSelected = new GeoJsonLayer({
    id: 'geojson-layer-selected',
    data: geojsonData,
    pickable: true,
    stroked: true,
    visible: true,
    filled: true,
    extruded: false,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 1,
    lineWidthMaxPixels: this.selectedFootprintBorderWidth,
    getLineWidth: this.hoveredFootprintBorderWidth,
    getFillColor: [0, 0, 0, 0],
    getLineColor: [0, 0, 0, 0],
    getPolygonOffset: (layerIndex:any) => [this.footprintZoomMultiplierFactor, -(layerIndex.layerIndex * this.footprintAltitudeFactor + this.footprintSelectedAltitudeAddendum)],
    wrapLongitude: true,
    highlightedObjectIndex: -1,
    fp64: true
  })

  public geojsonLayerGlobe = new GeoJsonLayer({
    id: 'geojson-layer',
    data: geojsonData,
    pickable: false,
    stroked: true,
    visible: true,
    filled: true,
    extruded: false,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 1,
    lineWidthMaxPixels: this.defaultFootprintBorderWidth,
    getLineWidth: this.defaultFootprintBorderWidth,
    getFillColor: (d:any, f:any) => d.properties.Color,
    getLineColor: (d:any, f:any) => d.properties.BorderColor,
    getPolygonOffset: (layerIndex:any) => [this.footprintZoomMultiplierFactor, -(layerIndex.layerIndex * this.footprintAltitudeFactor + this.footprintAltitudeAddendum)],
    wrapLongitude: true,
    highlightedObjectIndex: -1,
    fp64: true
  })

  public geojsonLayerGlobeSelected = new GeoJsonLayer({
    id: 'geojson-layer-selected',
    data: geojsonData,
    pickable: true,
    stroked: true,
    visible: true,
    filled: true,
    extruded: false,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 1,
    lineWidthMaxPixels: this.selectedFootprintBorderWidth,
    getLineWidth: this.hoveredFootprintBorderWidth,
    getFillColor: [0, 0, 0, 0],
    getLineColor: [0, 0, 0, 0],
    getPolygonOffset: (layerIndex:any) => [this.footprintZoomMultiplierFactor, -(layerIndex.layerIndex * this.footprintAltitudeFactor + this.footprintSelectedAltitudeAddendum)],
    wrapLongitude: true,
    highlightedObjectIndex: -1,
    fp64: true
  })

  public drawPolygonLayerGlobe = new GeoJsonLayer({
    id: 'draw-layer',
    data: this.drawGeoSearchPolygonData,
    pickable: true,
    stroked: true,
    visible: true,
    filled: true,
    extruded: false,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 1,
    lineWidthMaxPixels: 2,
    getLineWidth: 2,
    getFillColor: (d: any) => d.properties.fillColor,
    getLineColor: (d: any) => d.properties.borderColor,
    getPolygonOffset: (layerIndex:any) => [this.footprintZoomMultiplierFactor, -(layerIndex.layerIndex * this.footprintAltitudeFactor + this.polygonAltitudeAddendum)],
    onDragStart: (info: any) => {
      this.onPolygonDragStart(info);
    },
    onDrag: (info: any) => {
      this.onPolygonDrag(info);
    },
    onDragEnd: () => {
      this.onPolygonDragEnd();
    },
    wrapLongitude: false,
    fp64: true
  })

  public drawPolygonLayerPlane = new GeoJsonLayer({
    id: 'draw-layer',
    data: this.drawGeoSearchPolygonData,
    pickable: true,
    stroked: true,
    visible: true,
    filled: true,
    extruded: false,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 1,
    lineWidthMaxPixels: 2,
    getLineWidth: 2,
    getFillColor: (d: any) => d.properties.fillColor,
    getLineColor: (d: any) => d.properties.borderColor,
    getPolygonOffset: (layerIndex:any) => [this.footprintZoomMultiplierFactor, -(layerIndex.layerIndex * this.footprintAltitudeFactor + this.polygonAltitudeAddendum)],
    onDragStart: (info: any) => {
      this.onPolygonDragStart(info);
    },
    onDrag: (info: any) => {
      this.onPolygonDrag(info);
    },
    onDragEnd: () => {
      this.onPolygonDragEnd();
    },
    wrapLongitude: true,
    fp64: true
  })

  public drawCirclesLayerGlobe = new ScatterplotLayer({
    id: 'scatterplot-layer',
    data: this.drawGeoSearchCirclesData,
    pickable: true,
    stroked: true,
    filled: true,
    lineWidthUnits: 'pixels',
    radiusUnits: 'pixels',
    getLineWidth: 1,
    getPosition: (d: any) => d.coordinates,
    getRadius: (d: any) => {
      return d === this.hoveredObject ? AppConfig.settings.geoSearchSettings.bigCircleRadius : d.radius
    },
    getFillColor: [255, 255, 255],
    getLineColor: [0, 0, 0],
    getPolygonOffset: (layerIndex:any) => [this.footprintZoomMultiplierFactor, -(layerIndex.layerIndex * this.footprintAltitudeFactor + this.circlesAltitudeAddendum)],
    onDragStart: () => {
      this.onPointDragStart();
    },
    onDrag: (info: any) => {
      this.onPointDrag(info);
    },
    onDragEnd: () => {
      this.onPointDragEnd();
    },
    onHover: (info: any) => {
      this.hoveredObject = info.object;
    },
    updateTriggers: {
      getRadius: [this.hoveredObject]
    },
    wrapLongitude: true,
    fp64: true
  });
  public drawCirclesLayerPlane = new ScatterplotLayer({
    id: 'scatterplot-layer',
    data: this.drawGeoSearchCirclesData,
    pickable: true,
    stroked: true,
    filled: true,
    lineWidthUnits: 'pixels',
    radiusUnits: 'pixels',
    getLineWidth: 1,
    getPosition: (d: any) => d.coordinates,
    getRadius: (d: any) => d.radius,
    getFillColor: [255, 255, 255],
    getLineColor: [0, 0, 0],
    getPolygonOffset: (layerIndex:any) => [this.footprintZoomMultiplierFactor, -(layerIndex.layerIndex * this.footprintAltitudeFactor + this.circlesAltitudeAddendum)],
    onDragStart: () => {
      this.onPointDragStart();
    },
    onDrag: (info: any) => {
      this.onPointDrag(info);
    },
    onDragEnd: () => {
      this.onPointDragEnd();
    },
    wrapLongitude: true,
    fp64: true
  });


  constructor(
    private exchangeService: ExchangeService,
    private toast: ToastComponent
  ) {
    mapLayers = AppConfig.settings.styles;
    mapProjection = initialProjection;
    initialViewState = AppConfig.settings.mapSettings.initialViewState;

    this.currentProjection = mapProjection;
  }

  hideContextMenu() {
    contextMenuContainer.style.left = '-400px';
    contextMenuContainer.style.top = '-400px';
    if (contextMenuContainer.classList.contains('visible')) {
      contextMenuContainer.classList.replace('visible', 'hidden');
    }
  }
  onMouseEnterContextMenu() {
    clearTimeout(this.contextMenuTimeoutId);
  }
  onMouseLeaveContextMenu() {
    this.contextMenuTimeoutId = setTimeout(() => {
      this.hideContextMenu();
    }, 500);
  }
  hideFootprintMenu() {
    this.exchangeService.showFootprintsMenu(null, []);
  }

  ngOnInit(): void {
    canvasContainer = document.getElementById('canvas-container')!;
    contextMenuContainer = document.getElementById('context-menu-container')!;

    canvasContainer.addEventListener("contextmenu", (event: any) => {
      event.preventDefault();
      if (!(this.canDrawRect || this.canDrawPolygon)) {
        this.hideFootprintMenu();
        clearTimeout(this.contextMenuTimeoutId);
        let viewportWidth = window.innerWidth;
        let viewportHeight = window.innerHeight;
        contextMenuContainer.style.left = (event.clientX + 20) + 'px';
        contextMenuContainer.style.top = (event.clientY - 15) + 'px';
        if (contextMenuContainer.classList.contains('hidden')) {
          contextMenuContainer.classList.replace('hidden', 'visible');
          if (viewportHeight - (event.clientY + contextMenuContainer.offsetHeight) < 0) {
            contextMenuContainer.style.top = (viewportHeight - contextMenuContainer.offsetHeight - 8) + 'px';
          }
          if (viewportWidth - (event.clientX + contextMenuContainer.offsetWidth) < 0) {
            contextMenuContainer.style.left = (viewportWidth - contextMenuContainer.offsetWidth - 8) + 'px';
          }
        }
        this.contextMenuTimeoutId = setTimeout(() => {
          this.hideContextMenu();
        }, 3000);
      }
    });

    ["mousedown", "wheel"].forEach((inputEvent: any) => {
      canvasContainer.addEventListener(inputEvent, (event: any) => {
        this.hideContextMenu();
        this.hideFootprintMenu();
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
          const isNotCombinedKey = !(event.ctrlKey || event.altKey || event.shiftKey);
          if (isNotCombinedKey) {
              this.onCancelDrawingButtonClicked(true);
          }
      }
    });
    this.initMapLayers();
    this.initMap();
  }


  ngAfterViewInit(): void {
    this.mapStyleSubscription = this.exchangeService.selectedMapStyle.subscribe((value) => {
      if (typeof(value) === 'string') {
        this.changeMapProjection(value);
      }
    });
    this.productListSubscription = this.exchangeService.productListExchange.subscribe((value) => {
      if (typeof(value) === 'object') {
        this.setProductList(value);
      }
    });
    this.mapLayerSubscription = this.exchangeService.selectedMapLayer.subscribe((value) => {
      if (typeof(value) === 'string') {
        this.changeMapLayer(value);
      }
    });
    this.showProductIndexSubscription = this.exchangeService.showProductOnMapExchange.subscribe((value) => {
      if (typeof(value) === 'number') {
        this.showProductFootprint([value]);
      }
    });
    this.selectedProductIdSubscription = this.exchangeService.selectProductOnMapExchange.subscribe((value) => {
      if (typeof(value) === 'object') {
        if (value.selected) {
          this.selectedProductIndexes.push(value.selectedProductIndex);
        } else {
          this.selectedProductIndexes.splice(this.selectedProductIndexes.indexOf(value.selectedProductIndex), 1);
        }
      }
    });
    this.startRectDrawingSubscription = this.exchangeService.startRectDrawingExchange.subscribe((value) => {
      if (typeof(value) === 'boolean' && value === true) {
        this.onDrawRectButtonClicked(value);
      }
    });
    this.startPolygonDrawingSubscription = this.exchangeService.startPolygonDrawingExchange.subscribe((value) => {
      if (typeof(value) === 'boolean' && value === true) {
        this.onDrawPolygonButtonClicked(value);
      }
    });
    this.cancelDrawingSubscription = this.exchangeService.cancelDrawingExchange.subscribe((value) => {
      if (typeof(value) === 'boolean' && value === true) {
        this.onCancelDrawingButtonClicked(value);
      }
    });
    this.zoomToProductSubscription = this.exchangeService.zoomToProductIdOnMapExchange.subscribe((value) => {
      if (typeof(value) === 'string') {
        this.zoomToProduct(value);
      }
    });
    this.hideGeoSearchToolbarSubscription = this.exchangeService.hideGeoSearchToolbarExchange.subscribe((value) => {
      if (typeof(value) === 'boolean') {
        this.onHideGeoSearchToolbar(value);
      }
    });
    setTimeout(() => {
      mapProjection = AppConfig.settings.mapSettings.projection;
      this.currentProjection = mapProjection;
      this.changeMapProjection(this.currentProjection);
    }, 0);
    setTimeout(() => {
      this.mapAttributionIsVisible = false;
    }, this.mapAttributionShowTimeout);
  }

  ngOnDestroy(): void {
    this.mapStyleSubscription.unsubscribe();
    this.showLabelsSubscription.unsubscribe();
    this.productListSubscription.unsubscribe();
    this.mapLayerSubscription.unsubscribe();
    this.showProductIndexSubscription.unsubscribe();
    this.selectedProductIdSubscription.unsubscribe();
    this.startRectDrawingSubscription.unsubscribe();
    this.startPolygonDrawingSubscription.unsubscribe();
    this.cancelDrawingSubscription.unsubscribe();
    this.zoomToProductSubscription.unsubscribe();
    this.hideGeoSearchToolbarSubscription.unsubscribe();
  }

  initMapLayers(): void {
    this.mapLayerPlane = new TileLayer({
      id: "mapLayer",
      data: mapLayers[selectedMapStyleIndex].url,
      maxZoom: 14,
      tileSize: 256,

      renderSubLayers: (props: any) => {
        const {boundingBox} = props.tile;

        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]]
        });
      },
      visibile: this.drawTileLayer,
      getPolygonOffset: (layerIndex:any) => [0, -(layerIndex.layerIndex * 1000)],
      fp64: true
    })

    this.mapLayerGlobe = new TileLayer({
      id: "mapLayer",
      data: mapLayers[selectedMapStyleIndex].url,
      maxZoom: 14,
      tileSize: 256,

      renderSubLayers: (props: any) => {
        const {boundingBox} = props.tile;

        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]]
        });
      },
      visibile: this.drawTileLayer,
      getPolygonOffset: (layerIndex:any) => [0, -(layerIndex.layerIndex * 1000)],
      fp64: true
    })
  }

  initMap() {
    deckGlobe = new Deck({
      parameters: {
        cull: true
      },
      initialViewState: initialViewState,
      views: new GlobeView({
        id: 'globe',
        resolution: 1,
        nearZMultiplier: 1.4, // 1.4 max near limit
        farZMultiplier: 2.0,
        controller: {keyboard: false, inertia: true, doubleClickZoom: false},
        clear: true
      }),
      canvas: 'map-globe',
      style: {display: mapProjection === 'globe' ? 'block' : 'none'},
      layers: [
        this.mapLayerGlobe,
        this.backgroundLayerGlobe,
        this.geoJsonMapLayerGlobe,
        this.geojsonLayerGlobe,
        this.geojsonLayerGlobeSelected,
        this.drawPolygonLayerGlobe,
        this.drawCirclesLayerGlobe
      ],
      onClick: (info: any, event: any) => {
        this.onClickOnMap(info, event)
      },
      onHover: (info: any) => {
        this.onHoverOnMap(info);
      },
      getCursor: (cursor: any) => {
        if (cursor.isDragging) {
          this.canShowFootprintsMenu = false;
          this.hideProductFootprint();
          return 'grabbing';
        } else {
          if (this.isHoveringOnPoints) {
            this.canShowFootprintsMenu = false;
            this.hideProductFootprint();
            return 'pointer';
          } else {
            if (this.isHoveringOnPolygon) {
              this.canShowFootprintsMenu = false;
              this.hideProductFootprint();
              return 'grab';
            } else {
              this.canShowFootprintsMenu = true;
              if (this.isHoveringOnFootprint) {
                if (this.canDrawPolygon || this.canDrawRect) {
                  return 'crosshair';
                } else {
                  return 'pointer';
                }
              } else {
                return 'crosshair';
              }
            }
          }
        }
      }
    });

    deckPlane = new Deck({
      parameters: {
        cull: true
      },
      initialViewState: initialViewState,
      views: new MapView({
        id: 'plane',
        controller: {keyboard: false, inertia: true, doubleClickZoom: false},
        repeat: false,
        orthographic: false,
        bearing: 0,
        pitch: 0
      }),
      canvas: 'map-plane',
      style: {display: mapProjection === 'plane' ? 'block' : 'none'},
      layers: [
        this.mapLayerPlane,
        this.backgroundLayerPlane,
        this.geoJsonMapLayerPlane,
        this.geojsonLayerPlane,
        this.geojsonLayerPlaneSelected,
        this.drawPolygonLayerPlane,
        this.drawCirclesLayerPlane
      ],
      wrapLongitude: true,
      onClick: (info: any, event: any) => {
        this.onClickOnMap(info, event)
      },
      onHover: (info: any) => {
        this.onHoverOnMap(info);
      },
      getCursor: (cursor: any) => {
        if (cursor.isDragging) {
          this.canShowFootprintsMenu = false;
          this.hideProductFootprint();
          return 'grabbing';
        } else {
          if (this.isHoveringOnPoints) {
            this.canShowFootprintsMenu = false;
            this.hideProductFootprint();
            return 'pointer';
          } else {
            if (this.isHoveringOnPolygon) {
              this.canShowFootprintsMenu = false;
              this.hideProductFootprint();
              return 'grab';
            } else {
              this.canShowFootprintsMenu = true;
              if (this.isHoveringOnFootprint) {
                if (this.canDrawPolygon || this.canDrawRect) {
                  return 'crosshair';
                } else {
                  return 'pointer';
                }
              } else {
                return 'crosshair';
              }
            }
          }
        }
      }
    });
  }

  changeMapProjection(projection: string) {
    this.currentProjection = projection;
    if (this.currentProjection === 'globe') {
      document.getElementById('map-plane')!.style.display = 'none';
      document.getElementById('map-globe')!.style.display = 'block';
    } else {
      document.getElementById('map-globe')!.style.display = 'none';
      document.getElementById('map-plane')!.style.display = 'block';
    }
    this.canShowFootprintsMenu = true;
  }

  changeDrawLayer() {
    if (this.geoSearchPolygonPresent == false) {
      this.drawGeoSearchPolygonData = {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "geometry": {
              "type": "Polygon",
              "coordinates": [[]]
            },
            "properties": {
              "fillColor": this.geoSearchSettings.fillColorActive,
              "borderColor": this.geoSearchSettings.borderColorActive
            }
          }
        ]
      };
      this.drawGeoSearchCirclesData = [
        {
          "coordinates": [0, 90],
          "radius": 0
        }
      ];
    }
    this.drawPolygonLayerPlane = this.drawPolygonLayerPlane.clone({
      data: this.drawGeoSearchPolygonData
    });
    this.drawPolygonLayerGlobe = this.drawPolygonLayerGlobe.clone({
      data: this.drawGeoSearchPolygonData
    });
    this.drawCirclesLayerPlane = this.drawCirclesLayerPlane.clone({
      data: this.drawGeoSearchCirclesData
    });
    this.drawCirclesLayerGlobe = this.drawCirclesLayerGlobe.clone({
      data: this.drawGeoSearchCirclesData,
      getRadius: (d: any, obj: any) => {
        return d === this.hoveredObject ? AppConfig.settings.geoSearchSettings.bigCircleRadius : d.radius
      },
      onHover: (info: any) => {
        this.hoveredObject = info.object;
      },
      updateTriggers: {
        getRadius: [this.hoveredObject]
      }
    });
    this.mapLayerPlane = this.mapLayerPlane.clone({
      visible: this.drawTileLayer
    });
    this.mapLayerGlobe = this.mapLayerGlobe.clone({
      visible: this.drawTileLayer
    });
    this.backgroundLayerPlane = this.backgroundLayerPlane.clone({
      visible: !this.drawTileLayer,
      getFillColor: this.mapLayers[selectedMapStyleIndex].seaColor
    })
    this.geoJsonMapLayerPlane = this.geoJsonMapLayerPlane.clone({
      visible: !this.drawTileLayer,
      getFillColor: this.mapLayers[selectedMapStyleIndex].terrainColor,
      getLineColor: this.mapLayers[selectedMapStyleIndex].borderColor,
    })
    this.backgroundLayerGlobe = this.backgroundLayerGlobe.clone({
      data: this.worldBackgroundFeature,
      visible: !this.drawTileLayer,
      getFillColor: this.mapLayers[selectedMapStyleIndex].seaColor
    })
    this.geoJsonMapLayerGlobe = this.geoJsonMapLayerGlobe.clone({
      visible: !this.drawTileLayer,
      getFillColor: this.mapLayers[selectedMapStyleIndex].terrainColor,
      getLineColor: this.mapLayers[selectedMapStyleIndex].borderColor,
    })
    /* Update Plane View */
    const layersPlane =  [
      this.mapLayerPlane,
      this.backgroundLayerPlane,
      this.geoJsonMapLayerPlane,
      this.geojsonLayerPlane,
      this.geojsonLayerPlaneSelected,
      this.drawPolygonLayerPlane,
      this.drawCirclesLayerPlane
    ]
    deckPlane.setProps({layers: layersPlane});

    /* Update Globe View */
    const layersGlobe =  [
      this.mapLayerGlobe,
      this.backgroundLayerGlobe,
      this.geoJsonMapLayerGlobe,
      this.geojsonLayerGlobe,
      this.geojsonLayerGlobeSelected,
      this.drawPolygonLayerGlobe,
      this.drawCirclesLayerGlobe
    ]
    deckGlobe.setProps({layers: layersGlobe});
  }

  changeMapLayer(layer: string) {
    this.selectedMapStyle = layer;
    this.onMapAttributionClick();
    selectedMapStyleIndex = mapLayers.findIndex(function(item: any, i: any){
      return item.name === layer
    });
    if (selectedMapStyleIndex === 0) {    // Selected OSM Tile -> Make it visible.
      this.drawTileLayer = true;
      this.mapLayerPlane = this.mapLayerPlane.clone({
        data: mapLayers[selectedMapStyleIndex].url
      });
      this.mapLayerGlobe = this.mapLayerGlobe.clone({
        data: mapLayers[selectedMapStyleIndex].url
      });
    } else {
      this.drawTileLayer = false;
    }
    this.mapLayerPlane = this.mapLayerPlane.clone({
      visible: this.drawTileLayer
    });
    this.mapLayerGlobe = this.mapLayerGlobe.clone({
      visible: this.drawTileLayer
    });
    this.backgroundLayerPlane = this.backgroundLayerPlane.clone({
      visible: !this.drawTileLayer,
      getFillColor: this.mapLayers[selectedMapStyleIndex].seaColor
    })
    this.geoJsonMapLayerPlane = this.geoJsonMapLayerPlane.clone({
      visible: !this.drawTileLayer,
      getFillColor: this.mapLayers[selectedMapStyleIndex].terrainColor,
      getLineColor: this.mapLayers[selectedMapStyleIndex].borderColor,
    })
    this.backgroundLayerGlobe = this.backgroundLayerGlobe.clone({
      data: this.worldBackgroundFeature,
      visible: !this.drawTileLayer,
      getFillColor: this.mapLayers[selectedMapStyleIndex].seaColor
    })
    this.geoJsonMapLayerGlobe = this.geoJsonMapLayerGlobe.clone({
      visible: !this.drawTileLayer,
      getFillColor: this.mapLayers[selectedMapStyleIndex].terrainColor,
      getLineColor: this.mapLayers[selectedMapStyleIndex].borderColor,
    })
    /* Update Plane View */
    const layersPlane =  [
      this.mapLayerPlane,
      this.backgroundLayerPlane,
      this.geoJsonMapLayerPlane,
      this.geojsonLayerPlane,
      this.geojsonLayerPlaneSelected,
      this.drawPolygonLayerPlane,
      this.drawCirclesLayerPlane
    ]
    deckPlane.setProps({layers: layersPlane});

    /* Update Globe View */
    const layersGlobe =  [
      this.mapLayerGlobe,
      this.backgroundLayerGlobe,
      this.geoJsonMapLayerGlobe,
      this.geojsonLayerGlobe,
      this.geojsonLayerGlobeSelected,
      this.drawPolygonLayerGlobe,
      this.drawCirclesLayerGlobe
    ]
    deckGlobe.setProps({layers: layersGlobe});
  }

  setProductList(productList: any) {
    this.productList = productList;
    if ("@odata.count" in this.productList) {
      let featureList: any[] = [];
      this.productList.value.forEach((product: any, index: number) => {
        if (product.GeoFootprint != null) {
          let tempGeojson = this.getGeojsonFromGeoFootprint(product.GeoFootprint);
          featureList.push(tempGeojson);
        } else if (product.Footprint != null) {
          let tempGeojson = this.getGeojsonFromWKT(product.Footprint);
          featureList.push(tempGeojson);
        } else {
          featureList.push({
            "type": "Feature",
            "properties": {},
            "geometry": {
              type: "Point",
              coordinates: []
            }
          });
        }
        let tempPlatformArray = this.platformDetailsList.filter((platform: any) => (platform.value === product.platformShortName));
        let tempCustomAttributesArray = this.customAttributesList.filter((customAttribute: any) => {
          return product.Attributes.some((productAttribute: any) => (productAttribute.Name === customAttribute.name && productAttribute.Value === customAttribute.value));
        });

        let tempColor: string = "";
        let tempBorderColor: string = "";
        let tempHoverColor: string = "";
        let tempHoverBorderColor: string = "";
        if (tempCustomAttributesArray.length > 0) {
          tempColor = tempCustomAttributesArray[0].fillColor;
          tempBorderColor = tempCustomAttributesArray[0].borderColor;
          tempHoverColor = tempCustomAttributesArray[0].hoverColor;
          tempHoverBorderColor = tempCustomAttributesArray[0].hoverBorderColor;
        } else if (tempPlatformArray.length > 0) {
          tempColor = tempPlatformArray[0].fillColor;
          tempBorderColor = tempPlatformArray[0].borderColor;
          tempHoverColor = tempPlatformArray[0].hoverColor;
          tempHoverBorderColor = tempPlatformArray[0].hoverBorderColor;
        }
        featureList[index].properties = {
          'Id': product.Id,
          'Name': product.Name,
          'Color': (tempColor !== "" ? this.rgbConvertToArray(tempColor) : this.fallBackFootprintColor),
          'BorderColor': (tempBorderColor !== "" ? this.rgbConvertToArray(tempBorderColor) : this.fallBackFootprintBorderColor),
          'HoverColor': (tempHoverColor !== "" ? this.rgbConvertToArray(tempHoverColor) : this.fallBackFootprintHoverColor),
          'HoverBorderColor': (tempHoverBorderColor !== "" ? this.rgbConvertToArray(tempHoverBorderColor) : this.fallBackFootprintHoverBorderColor),
        }
        product.featureList = featureList[index];
      });

      geojsonData = {
        "type": "FeatureCollection",
        "features": featureList
      };
      this.geojsonLayerGlobe = this.geojsonLayerGlobe.clone({
        data: geojsonData
      })
      this.geojsonLayerGlobeSelected = this.geojsonLayerGlobeSelected.clone({
        data: geojsonData
      })
      this.geojsonLayerPlane = this.geojsonLayerPlane.clone({
        data: geojsonData
      })
      this.geojsonLayerPlaneSelected = this.geojsonLayerPlaneSelected.clone({
        data: geojsonData
      })
      this.mapLayerGlobe = this.mapLayerGlobe.clone({
        visible: this.drawTileLayer
      });
      this.mapLayerPlane = this.mapLayerPlane.clone({
        visible: this.drawTileLayer
      });
      this.backgroundLayerPlane = this.backgroundLayerPlane.clone({
        visible: !this.drawTileLayer,
        getFillColor: this.mapLayers[selectedMapStyleIndex].seaColor
      })
      this.geoJsonMapLayerPlane = this.geoJsonMapLayerPlane.clone({
        visible: !this.drawTileLayer,
        getFillColor: this.mapLayers[selectedMapStyleIndex].terrainColor,
        getLineColor: this.mapLayers[selectedMapStyleIndex].borderColor,
      })
      this.backgroundLayerGlobe = this.backgroundLayerGlobe.clone({
      data: this.worldBackgroundFeature,
        visible: !this.drawTileLayer,
        getFillColor: this.mapLayers[selectedMapStyleIndex].seaColor
      })
      this.geoJsonMapLayerGlobe = this.geoJsonMapLayerGlobe.clone({
        visible: !this.drawTileLayer,
        getFillColor: this.mapLayers[selectedMapStyleIndex].terrainColor,
        getLineColor: this.mapLayers[selectedMapStyleIndex].borderColor,
      })
      /* Update Plane View */
      const layersPlane =  [
        this.backgroundLayerPlane,
        this.geoJsonMapLayerPlane,
        this.mapLayerPlane,
        this.geojsonLayerPlane,
        this.geojsonLayerPlaneSelected,
        this.drawPolygonLayerPlane,
        this.drawCirclesLayerPlane
      ]
      deckPlane.setProps({layers: layersPlane});

      /* Update Globe View */
      const layersGlobe =  [
        this.mapLayerGlobe,
        this.backgroundLayerGlobe,
        this.geoJsonMapLayerGlobe,
        this.geojsonLayerGlobe,
        this.geojsonLayerGlobeSelected,
        this.drawPolygonLayerGlobe,
        this.drawCirclesLayerGlobe
      ]
      deckGlobe.setProps({layers: layersGlobe});
    }
  }

  hideProductFootprint() {
    this.showProductFootprint([-1]);
  }

  showProductFootprint(showProductIndex: number[]) {
    this.selectedFootprintIndex = showProductIndex;
    if (this.currentProjection === 'globe') {
      this.geojsonLayerGlobeSelected = this.geojsonLayerGlobeSelected.clone({
        getLineWidth: (d: any, f:any) => {
          let ret: number = 1;
          if (this.selectedProductIndexes.includes(f.index)) ret = this.selectedFootprintBorderWidth;
          else if (this.selectedFootprintIndex.includes(f.index)) ret = this.hoveredFootprintBorderWidth;
          return ret;
        },
        getFillColor: (d:any, f:any) => {
          let tempCol = [0, 0, 0, 0];
          if (this.selectedFootprintIndex.includes(f.index)) tempCol = d.properties.HoverColor;
          return tempCol;
        },
        getLineColor: (d:any, f:any) => {
          let tempCol = [0, 0, 0, 0];
          if (this.selectedProductIndexes.includes(f.index)) tempCol = this.selectedFootprintBorderColor;
          else if (this.selectedFootprintIndex.includes(f.index)) tempCol = d.properties.HoverBorderColor;
          return tempCol;
        },
        updateTriggers: {
          getFillColor: [this.selectedFootprintIndex],
          getLineWidth: [this.selectedFootprintIndex, this.selectedProductIndexes],
          getLineColor: [this.selectedFootprintIndex, this.selectedProductIndexes]
        }
      });
      this.mapLayerGlobe = this.mapLayerGlobe.clone({
        visible: this.drawTileLayer
      });
      this.backgroundLayerGlobe = this.backgroundLayerGlobe.clone({
      data: this.worldBackgroundFeature,
        visible: !this.drawTileLayer,
        getFillColor: this.mapLayers[selectedMapStyleIndex].seaColor
      })
      this.geoJsonMapLayerGlobe = this.geoJsonMapLayerGlobe.clone({
        visible: !this.drawTileLayer,
        getFillColor: this.mapLayers[selectedMapStyleIndex].terrainColor,
        getLineColor: this.mapLayers[selectedMapStyleIndex].borderColor,
      })
      const layersGlobe =  [
        this.mapLayerGlobe,
        this.backgroundLayerGlobe,
        this.geoJsonMapLayerGlobe,
        this.geojsonLayerGlobe,
        this.geojsonLayerGlobeSelected,
        this.drawPolygonLayerGlobe,
        this.drawCirclesLayerGlobe
      ]
      deckGlobe.setProps({layers: layersGlobe});
    } else {
      this.geojsonLayerPlaneSelected = this.geojsonLayerPlaneSelected.clone({
        getLineWidth: (d: any, f:any) => {
          let ret: number = 1;
          if (this.selectedProductIndexes.includes(f.index)) ret = this.selectedFootprintBorderWidth;
          else if (this.selectedFootprintIndex.includes(f.index)) ret = this.hoveredFootprintBorderWidth;
          return ret;
        },
        getFillColor: (d:any, f:any) => {
          let tempCol = [0, 0, 0, 0];
          if (this.selectedFootprintIndex.includes(f.index)) tempCol = d.properties.HoverColor;
          return tempCol;
        },
        getLineColor: (d:any, f:any) => {
          let tempCol = [0, 0, 0, 0];
          if (this.selectedProductIndexes.includes(f.index)) tempCol = this.selectedFootprintBorderColor;
          else if (this.selectedFootprintIndex.includes(f.index)) tempCol = d.properties.HoverBorderColor;
          return tempCol;
        },
        updateTriggers: {
          getFillColor: [this.selectedFootprintIndex],
          getLineWidth: [this.selectedFootprintIndex, this.selectedProductIndexes],
          getLineColor: [this.selectedFootprintIndex, this.selectedProductIndexes]
        }
      });
      this.mapLayerPlane = this.mapLayerPlane.clone({
        visible: this.drawTileLayer
      });
      this.backgroundLayerPlane = this.backgroundLayerPlane.clone({
        visible: !this.drawTileLayer,
        getFillColor: this.mapLayers[selectedMapStyleIndex].seaColor
      })
      this.geoJsonMapLayerPlane = this.geoJsonMapLayerPlane.clone({
        visible: !this.drawTileLayer,
        getFillColor: this.mapLayers[selectedMapStyleIndex].terrainColor,
        getLineColor: this.mapLayers[selectedMapStyleIndex].borderColor,
      })
      const layersPlane =  [
        this.mapLayerPlane,
        this.backgroundLayerPlane,
        this.geoJsonMapLayerPlane,
        this.geojsonLayerPlane,
        this.geojsonLayerPlaneSelected,
        this.drawPolygonLayerPlane,
        this.drawCirclesLayerPlane
      ]
      deckPlane.setProps({layers: layersPlane});
    }
  }

  zoomToProduct(id: string) {
    let tempZoomedProduct = this.productList.value.filter((product: any) => product.Id === id)[0];
    let zoomToViewState = this.getCoordinatesBounds(tempZoomedProduct.featureList.geometry.coordinates);
    if (zoomToViewState !== null) {
      if (this.currentProjection === 'globe') {
        deckGlobe.setProps({
          initialViewState: {
            longitude: zoomToViewState.centerCoordinates[0],
            latitude: zoomToViewState.centerCoordinates[1],
            zoom: zoomToViewState.zoomLevel,
            transitionDuration: 'auto',
            transitionInterpolator: new FlyToInterpolator({
              speed: 1,
              curve: 2
            })
          }
        });
      } else {
        deckPlane.setProps({
          initialViewState: {
            longitude: zoomToViewState.centerCoordinates[0],
            latitude: zoomToViewState.centerCoordinates[1],
            zoom: zoomToViewState.zoomLevel,
            transitionDuration: 'auto',
            transitionInterpolator: new FlyToInterpolator({
              speed: 1,
              curve: 2
            })
          }
        });
      }
    }
  }

  onHideGeoSearchToolbar(hidden: boolean) {
    if (hidden) {
      this.showGeoSearchToolbar = false;
    } else {
      this.showGeoSearchToolbar = true;
    }
    this.exchangeService.showGeoSearchToolbar(this.showGeoSearchToolbar);
  }

  onMapAttributionClick() {
    this.mapAttributionIsVisible = true;
    setTimeout(() => {
      this.mapAttributionIsVisible = false;
    }, this.mapAttributionShowTimeout);
  }

  getArrayDim(arr: any) {
  if (!arr.length) {
    return [];
  }
  var dim: any = arr.reduce((result: any, current: any) => {
    // check each element of arr against the first element
    // to make sure it has the same dimensions
    return this.arrayEquals(result, this.getArrayDim(current)) ? result : false;
  }, this.getArrayDim(arr[0]));

  // dim is either false or an array
  return dim && [arr.length].concat(dim);
}

  getCoordinatesBounds(coordinates: any) {
    let tempArrayDim = this.getArrayDim(coordinates);
    let centerCoordinates: number[] = [0, 0];
    let zoomLevel: number = 3;
    let tempLatLonBounds: {coordsMin: number[], coordsMax: number[]} = {coordsMin: [0,0], coordsMax: [0,0]};

    if (coordinates.length === 2) {
      /* TwoHalves Footprint */
      let tempCoords: any[] = [];
      coordinates[0][0].forEach((arr: any) => {
        tempCoords.push(arr);
      });
      coordinates[1][0].forEach((arr: any) => {
        tempCoords.push(arr);
      });
      let tempLatLonWorldBounds = this.calcMinMaxCoordinatesValues(tempCoords);

      let tempLatLonBoundsNegative: any;
      let tempLatLonBoundsPositive: any;

      if (coordinates[0][0][0][0] < 0) {
        tempLatLonBoundsNegative = this.calcMinMaxCoordinatesValues(coordinates[0][0]);
        tempLatLonBoundsPositive = this.calcMinMaxCoordinatesValues(coordinates[1][0]);
      } else {
        tempLatLonBoundsNegative = this.calcMinMaxCoordinatesValues(coordinates[1][0]);
        tempLatLonBoundsPositive = this.calcMinMaxCoordinatesValues(coordinates[0][0]);
      }
      tempLatLonBounds = {
        coordsMin: [tempLatLonBoundsPositive.coordsMin[0], tempLatLonWorldBounds.coordsMin[1]],
        coordsMax: [tempLatLonBoundsNegative.coordsMax[0], tempLatLonWorldBounds.coordsMax[1]]
      };
      let centerLon = (tempLatLonBounds.coordsMax[0] + tempLatLonBounds.coordsMin[0])/2;
      if (centerLon < 0) centerLon += 180.0;
      else centerLon -= 180.0;
      centerCoordinates = [centerLon, (tempLatLonBounds.coordsMax[1] + tempLatLonBounds.coordsMin[1])/2];
    } else if (tempArrayDim.length === 3) {
      /* Simple Footprint */
      tempLatLonBounds = this.calcMinMaxCoordinatesValues(coordinates[0]);
      centerCoordinates = [(tempLatLonBounds.coordsMax[0] + tempLatLonBounds.coordsMin[0])/2, (tempLatLonBounds.coordsMax[1] + tempLatLonBounds.coordsMin[1])/2];
    } else if (tempArrayDim.length === 4) {
      /* Multi Footprint */
      let tempCoords: any[] = [];
      coordinates.forEach((arr: any) => {
        arr.forEach((subArr: any) => {
          subArr.forEach((subArr2: any) => {
            tempCoords.push(subArr2);
          });
        });
      });
      tempLatLonBounds = this.calcMinMaxCoordinatesValues(tempCoords);
      centerCoordinates = [(tempLatLonBounds.coordsMax[0] + tempLatLonBounds.coordsMin[0])/2, (tempLatLonBounds.coordsMax[1] + tempLatLonBounds.coordsMin[1])/2];
    } else {
      this.toast.showInfoToast('success', 'NO FOOTPRINT TO ZOOM TO.');
      return null;
    }
    zoomLevel = this.calcZoomLevelFromLatLonBounds(tempLatLonBounds);
    return {centerCoordinates, zoomLevel};
  }

  calcMinMaxCoordinatesValues(coordinates: number[][]) {
    let coordsMin: number[] = [coordinates[0][0], coordinates[0][1]];
    let coordsMax: number[] = [coordinates[0][0], coordinates[0][1]];
    coordinates.forEach((coord: number[]) => {
      if (coord[0] < coordsMin[0]) coordsMin[0] = coord[0];
      if (coord[1] < coordsMin[1]) coordsMin[1] = coord[1];
      if (coord[0] > coordsMax[0]) coordsMax[0] = coord[0];
      if (coord[1] > coordsMax[1]) coordsMax[1] = coord[1];
    });
    return {coordsMin, coordsMax};
  }

  calcZoomLevelFromLatLonBounds(bounds: {coordsMin: number[], coordsMax: number[]}) {
    let tempMaxLat = Math.abs(bounds.coordsMax[1] - bounds.coordsMin[1]);
    let zoomLevel = Math.pow(this.convertRange(tempMaxLat, [0, 180], [2, 0]), 2);
    return zoomLevel;
  }

  convertRange( value: number, r1: number[], r2: number[] ) {
    return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
  }

  /* Convert WKT footprints to geojson Feature */
  getGeojsonFromWKT(footprint: string) {
    /* Footprint example */
    //let footprint = "geography'SRID=4326;MultiPolygon(((-180 -85.05115, -60 -85.05115, -9.873752278028588 -85.05115, -18.697664 -84.41709, -27.291122 -83.34023, -33.327984 -82.15083, -37.678593 -80.89267, -40.903652 -79.59064, -43.35432 -78.25922, -45.256004 -76.90715, -46.758476 -75.54035, -47.962128 -74.16252, -48.936485 -72.77616, -49.731937 -71.38313, -50.38452 -69.98459, -50.920895 -68.58155, -51.36377 -67.17483, -51.40293 -67.03405, -52.28085 -67.1301, -58.67725 -67.66229, -64.64138 -67.89724, -68.03048 -67.914696, -71.67086 -67.83196, -73.95211 -67.72172, -76.583626 -67.53314, -78.33401 -67.36823, -80.456985 -67.12233, -81.93471 -66.91933, -83.80223 -66.6225, -85.15374 -66.37757, -86.92625 -66.01473, -88.256584 -65.70879, -90.06633 -65.24191, -91.47698 -64.83389, -93.47643 -64.183136, -95.10825 -63.583958, -97.55461 -62.561375, -99.69816 -61.533566, -103.27202 -59.520912, -104.76791 -58.558292, -106.7818 -59.64927, -108.93288 -60.7056, -111.231964 -61.722694, -113.68868 -62.69657, -116.312965 -63.622025, -119.112236 -64.49451, -122.09346 -65.307976, -125.260574 -66.05645, -128.61363 -66.73372, -132.1478 -67.33334, -135.85335 -67.84922, -139.71408 -68.27519, -143.70673 -68.605896, -147.80177 -68.83713, -151.96474 -68.96529, -156.15695 -68.98871, -160.338 -68.90681, -164.46829 -68.72086, -168.5109 -68.4337, -172.43407 -68.04902, -176.21161 -67.572075, -179.82462 -67.008575, -180 -66.97568745281865, -180 -85.05115)), ((59.978078453683715 -85.05115, 60 -85.05115, 180 -85.05115, 180 -66.97568745281862, 176.74023 -66.36441, 173.48944 -65.64631, 170.4247 -64.860374, 167.5449 -64.01241, 164.84296 -63.1089, 162.31201 -62.15502, 159.94377 -61.1554, 157.72752 -60.114914, 155.65385 -59.0375, 153.71202 -57.926975, 151.8929 -56.78649, 150.1863 -55.619274, 148.58449 -54.42749, 147.07875 -53.213707, 145.66074 -51.980274, 144.32428 -50.72868, 143.06284 -49.460613, 141.86986 -48.17781, 140.74072 -46.881256, 139.66994 -45.57228, 138.6534 -44.251965, 137.68661 -42.921158, 136.7659 -41.580814, 135.88834 -40.231686, 135.05026 -38.87442, 134.24951 -37.50955, 133.48267 -36.1379, 132.7479 -34.759747, 132.04297 -33.37569, 131.36601 -31.986122, 130.71481 -30.591515, 130.08818 -29.192053, 129.48448 -27.788172, 128.90224 -26.380163, 128.34015 -24.968393, 127.797066 -23.553137, 127.27201 -22.13447, 126.76364 -20.712671, 126.271355 -19.288063, 125.7943 -17.860857, 125.331406 -16.431063, 124.882256 -14.999018, 124.446 -13.564769, 124.02211 -12.128626, 123.60979 -10.690633, 123.20879 -9.250898, 122.81845 -7.8096156, 122.43829 -6.366855, 122.068016 -4.9228134, 121.70711 -3.4775922, 121.35514 -2.0312994, 121.01194 -0.58393055, 120.67694 0.8643173, 120.35023 2.3132932, 120.0314 3.7630463, 119.72011 5.213316, 119.416084 6.6642365, 119.11933 8.1155205, 118.82946 9.56723, 118.54645 11.019191, 118.27004 12.471412, 118.000206 13.923828, 117.73699 15.376323, 117.48014 16.828913, 117.22933 18.28134, 116.984856 19.733765, 116.746666 21.186062, 116.51456 22.63816, 116.28871 24.09004, 116.06896 25.54163, 115.85555 26.992859, 115.64862 28.443764, 115.44794 29.894255, 115.253914 31.344227, 115.06653 32.793766, 114.8862 34.24279, 114.713104 35.691208, 114.547005 37.13901, 114.3889 38.586246, 114.23899 40.032818, 114.09749 41.478737, 113.96502 42.923893, 113.84206 44.368294, 113.72947 45.811943, 113.62754 47.25479, 113.53778 48.6968, 113.46068 50.137936, 113.39755 51.578247, 113.35012 53.017513, 113.319435 54.45584, 113.30762 55.89312, 113.31707 57.329285, 113.35041 58.764328, 113.410446 60.198162, 113.50119 61.630615, 113.62731 63.061657, 113.79463 64.491035, 114.01004 65.91864, 114.28222 67.34423, 114.622116 68.76742, 115.04445 70.18792, 115.5675 71.60514, 116.21626 73.01839, 117.023834 74.42668, 118.03691 75.82861, 119.32079 77.22237, 120.97311 78.60485, 123.13974 79.971596, 126.05391 81.315285, 130.09726 82.623405, 135.92862 83.87316, 144.69469 85.020615, 145.12698213948613 85.05115, 60 85.05115, 0 85.05115, -56.060095777620695 85.05115, -49.12864 84.66965, -39.34633 83.7838, -34.409233 83.15651, -29.556326 82.37678, -26.715324 81.82748, -23.591007 81.128784, -21.584875 80.62072, -19.209015 79.95135, -17.581352 79.44638, -15.540834 78.75525, -14.0664 78.21274, -12.122249 77.437775, -10.646239 76.80045, -8.602081 75.839745, -6.971276 74.99877, -4.5914636 73.62653, -2.5798376 72.297066, 1.8842249721001883e-16 70.2349053338933, 0.58844405 69.76454, 1.8372046 68.567116, 5.948842 68.77987, 10.121085 68.888565, 14.314721 68.891396, 18.48928 68.78874, 22.605053 68.581795, 26.626188 68.2733, 30.522081 67.86817, 34.26726 67.37107, 37.84446 66.78796, 41.24178 66.125404, 44.453228 65.389496, 47.47825 64.58683, 50.319595 63.723335, 52.983395 62.8048, 55.477493 61.8367, 57.81113 60.82395, 59.994225 59.77103, 62.03683 58.681816, 63.949368 57.56026, 65.74095 56.40916, 67.4214 55.2318, 68.99926 54.030605, 70.48269 52.807873, 71.87913 51.565628, 73.19565 50.30573, 74.43848 49.0297, 75.61371 47.739258, 76.72617 46.435295, 77.78124 45.119316, 78.78297 43.792152, 79.73552 42.454815, 80.64244 41.108116, 81.50715 39.752747, 82.33281 38.38954, 83.12202 37.01899, 83.87726 35.641644, 84.60109 34.258106, 85.29528 32.86878, 85.96217 31.47418, 86.603134 30.074476, 87.22006 28.67026, 87.814255 27.261734, 88.387146 25.84913, 88.940155 24.432997, 89.47414 23.013319, 89.99051 21.590485, 90.49007 20.164734, 90.97366 18.736233, 91.44232 17.305239, 91.8964 15.871675, 92.33709 14.436073, 92.76476 12.998327, 93.18017 11.558766, 93.583786 10.117478, 93.9763 8.674642, 94.35807 7.230345, 94.729355 5.7846384, 95.09084 4.337777, 95.44281 2.8898368, 95.78572 1.4409462, 96.11976 -0.00887641, 96.445305 -1.4594045, 96.76236 -2.9106863, 97.071526 -4.3625445, 97.37287 -5.814838, 97.6667 -7.2675724, 97.95303 -8.720591, 98.232 -10.173911, 98.50411 -11.627272, 98.769066 -13.080772, 99.027115 -14.534309, 99.27834 -15.987841, 99.52276 -17.441135, 99.760574 -18.894215, 99.99151 -20.34718, 100.21577 -21.79981, 100.43345 -23.25192, 100.64414 -24.703695, 100.84813 -26.15499, 101.04495 -27.60581, 101.235085 -29.055925, 101.41761 -30.50546, 101.59271 -31.954296, 101.76026 -33.402454, 101.919754 -34.84979, 102.071175 -36.296288, 102.21379 -37.741943, 102.34743 -39.186695, 102.4718 -40.630463, 102.58598 -42.073257, 102.68918 -43.515118, 102.78145 -44.9558, 102.861404 -46.395306, 102.92763 -47.83374, 102.9802 -49.27088, 103.01681 -50.706776, 103.035866 -52.141453, 103.03687 -53.574593, 103.01651 -55.006363, 102.97275 -56.436577, 102.90323 -57.865135, 102.80401 -59.291946, 102.67132 -60.716896, 102.50024 -62.139755, 102.28576 -63.56042, 102.01893 -64.97858, 101.69209 -66.39395, 101.2938 -67.80623, 100.810455 -69.21483, 100.22323 -70.61916, 99.50885 -72.018394, 98.63521 -73.41142, 97.56149 -74.79679, 96.229065 -76.172226, 94.554085 -77.53482, 92.41731 -78.87998, 89.63829 -80.20078, 85.93993 -81.486015, 80.88356 -82.71711, 73.77727 -83.86179, 63.585403 -84.86226, 59.978078453683715 -85.05115)))'";

     let geojsonCoords: any = {};
    if (footprint) {
      footprint = footprint.toUpperCase();
      if (footprint.includes('MULTIPOLYGON')) {
        geojsonCoords = wktToGeoJSON(footprint.substring(footprint.search('MULTIPOLYGON'), footprint.length-1));
      } else if (footprint.includes('POLYGON')) {
        geojsonCoords = wktToGeoJSON(footprint.substring(footprint.search('POLYGON'), footprint.length-1));
      }
    }
    return this.getGeojsonFromGeoFootprint(geojsonCoords);
  }

  /* Convert GeoFootprint footprints to geojson Feature */
  getGeojsonFromGeoFootprint(footprint: any) {
    if (footprint.type === "Polygon") {
      let polygons: Array<any> = [];
      /*
        Check if footprint is crossing the daytime line.
        Method:
          - Check if crosses on -180.0
          - Check if it is a single polygon or a malformed multipolygon:
            -> Single polygon:
          - Divide it on the antimeridian line
          - Check and adjust longitude sign
          - Add missing points
            -> Malformed multipolygon:
          - Divide coords array on every FirstPoint recurrence
          - If more than one recurrence modify GeoFootprint to MultiPolygon
      */
      for (var i = 0; i < footprint.coordinates[0].length - 1; i++) {
        if (this.checkDaylineCrossing([footprint.coordinates[0][i], footprint.coordinates[0][i+1]])) {
          if (this.arrayEquals(footprint.coordinates[0][i], footprint.coordinates[0][0])) {
            polygons = this.fixCrossingMultiPolygon(footprint);
          } else {
            polygons = this.fixCrossingPolygon(footprint);
          }
        }
      }
      if (polygons.length > 1) {
        footprint.type = "MultiPolygon";
        let tempCoord: Array<any> = [];
        for (var i = 0; i < polygons.length; i++) {
          tempCoord.push([polygons[i]]);
        }
        footprint.coordinates = tempCoord;
      }
    }

    /* Create Geojson Feature */
    let geojsonFeature = {
      "type": "Feature",
      "geometry": footprint
    };
    return geojsonFeature;
  }

  divideCrossingPolygonArray(footprintArray: any): Array<any> {
    let tempPolygon: Array<any> = [];
    let crossPoints: Array<any> = [];
    let crossPositions: Array<number> = [];
    for (var i = 0; i < footprintArray[0].length - 1; i++) {
      if (this.checkDaylineCrossing([footprintArray[0][i], footprintArray[0][i+1]])) {
        let point = this.calcCrossPoint([footprintArray[0][i], footprintArray[0][i+1]]);
        crossPoints.push(point);
        crossPositions.push(i+1);
      }
    }
    if (crossPoints.length > 0) {
      /* First Half Polygon */
      crossPoints = [crossPoints[0], [-crossPoints[1][0], crossPoints[1][1]], [-crossPoints[0][0], crossPoints[0][1]], crossPoints[1]];
      tempPolygon.push([]);
      tempPolygon[0].push([]);
      for (var i = 0; i < crossPositions[0]; i++) {
        tempPolygon[0][0].push(footprintArray[0][i]);
      }
      tempPolygon[0][0].push(crossPoints[0]);
      tempPolygon[0][0].push(crossPoints[1]);
      for (var i = crossPositions[1]; i < footprintArray[0].length; i++) {
        tempPolygon[0][0].push(footprintArray[0][i]);
      }

      /* Second Half Polygon */
      tempPolygon.push([]);
      tempPolygon[1].push([]);
      tempPolygon[1][0].push(crossPoints[2]);
      for (var i = crossPositions[0]; i < crossPositions[1]; i++) {
        tempPolygon[1][0].push(footprintArray[0][i]);
      }
      tempPolygon[1][0].push(crossPoints[3]);
      tempPolygon[1][0].push(crossPoints[2]);
    } else {
      tempPolygon = [footprintArray];
    }
    return tempPolygon;
  }

  fixCrossingPolygon(footprint: any): Array<any> {
    let tempPolygons: Array<any> = [];
    let precIndex: number = 0;
    for (var i = 0; i < footprint.coordinates[0].length - 1; i++) {
      if (this.checkDaylineCrossing([footprint.coordinates[0][i], footprint.coordinates[0][i+1]])) {
        let point = this.calcCrossPoint([footprint.coordinates[0][i], footprint.coordinates[0][i+1]]);
        let tempArray = JSON.parse(JSON.stringify(footprint.coordinates[0].slice(precIndex, i).concat([point])));
        if (point[0] < 0) {
          tempArray[0][0] = -tempArray[0][0];
        }
        tempPolygons.push(tempArray);
        precIndex = i;
      }
    }
    return tempPolygons;
  }

  fixCrossingMultiPolygon(footprint: any): Array<any> {
    let tempPolygons: Array<any> = [];
    let precIndex: number = 0;
    let firstPoint = footprint.coordinates[0][0];
    for (var i = 1; i < footprint.coordinates[0].length; i++) {
      if (this.arrayEquals(footprint.coordinates[0][i], firstPoint)) {
        tempPolygons.push(footprint.coordinates[0].slice(precIndex, i + 1));
        precIndex = i + 1;
      }
    }
    tempPolygons.push(footprint.coordinates[0].slice(precIndex));
    return tempPolygons;
  }

  checkDaylineCrossing(line: Array<Array<number>>, angleThreshold: number = 180.0): boolean {
    if (Math.abs(line[1][0] - line[0][0]) > angleThreshold) {
      return true;
    }
    return false;
  }

  calcCrossPoint(line: Array<Array<number>>): Array<number> {
    let point: Array<number> = [];
    if (line[0][0] == 180.0) {
      point = line[0];
    } else if (line[0][0] == -180.0) {
      point = line[0];
    } else if (line[1][0] == 180.0) {
      point = [-line[1][0], line[1][1]];
    } else if (line[1][0] == -180.0) {
      point = [-line[1][0], line[1][1]];
    } else {
      let deltaLon = 360 - Math.abs(line[0][0]) - Math.abs(line[1][0]);
      let refLon = 180 - Math.abs(line[0][0]);
      let deltaLat = line[0][1] - line[1][1];
      let calcLat = line[0][1] - (deltaLat * refLon / deltaLon);
      if (line[0][0] > line[1][0]) {
        point.push(180.0, calcLat);
      } else {
        point.push(-180.0, calcLat);
      }
    }
    return point;
  }

  arrayEquals(a: any, b: any): boolean {
    if (Array.isArray(a[0])) {
      return this.arrayEquals(a[0], b[0]);
    } else {
      return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
    }
  }

  /* Function to convert [r, g, b] or [r, g, b, a] colors to html string: "#rrggbb" or "#rrggbbaa" */
  rgbConvertToString(arrayColor: any) {
    let stringColor: string = '#ff0000';
    if (typeof(arrayColor) == typeof([Number, Number, Number])) {
      stringColor = "#" + arrayColor[0].toString(16).padStart(2, '0') + arrayColor[1].toString(16).padStart(2, '0') + arrayColor[2].toString(16).padStart(2, '0');
      return stringColor;
    } else if (typeof(arrayColor) == typeof([Number, Number, Number, Number])) {
      stringColor = "#" + arrayColor[0].toString(16).padStart(2, '0') + arrayColor[1].toString(16).padStart(2, '0') + arrayColor[2].toString(16).padStart(2, '0') + arrayColor[3].toString(16).padStart(2, '0');
      return stringColor;
    } else return stringColor;
  }

  /* Function to convert #rrggbb or #rrggbbaa colors to array: [r, g, b] or [r, g, b, a] */
  rgbConvertToArray(stringColor: string) {
    if (stringColor.length == 7) {
      if (stringColor.charAt(0) != '#') return [255, 0, 0];
      var r = parseInt(stringColor.substring(1, 3), 16);
      var g = parseInt(stringColor.substring(3, 5), 16);
      var b = parseInt(stringColor.substring(5, 7), 16);
      let arrayColor = [r, g, b];
      return arrayColor;
    } else if (stringColor.length == 9) {
      if (stringColor.charAt(0) != '#') return [255, 0, 0];
      var r = parseInt(stringColor.substring(1, 3), 16);
      var g = parseInt(stringColor.substring(3, 5), 16);
      var b = parseInt(stringColor.substring(5, 7), 16);
      var a = parseInt(stringColor.substring(7, 9), 16);
      let arrayColor = [r, g, b, a];
      return arrayColor;
    } else {
      return [255, 100, 100];
    }
  }
}
