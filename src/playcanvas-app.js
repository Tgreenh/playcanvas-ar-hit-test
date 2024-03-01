import * as pc from 'playcanvas';
import { DomOverlayElement } from './dom-overlay.js';

import './dom-overlay.css';

export class PlayCanvasApp {
  _app;

  _camera;

  _domOverlayElement;

  constructor({ canvasDomElement }) {

    this._app = new pc.Application(canvasDomElement, {
      mouse: new pc.Mouse(canvasDomElement),
      touch: new pc.TouchDevice(canvasDomElement),
      keyboard: new pc.Keyboard(window),
      graphicsDeviceOptions: { alpha: true },
    });

    this._app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    this._app.setCanvasResolution(pc.RESOLUTION_AUTO);

    // use device pixel ratio
    this._app.graphicsDevice.maxPixelRatio = window.devicePixelRatio;

    // use device pixel ratio
    this._app.graphicsDevice.maxPixelRatio = window.devicePixelRatio;

    this._app.start();

    this.initCamera();

    this.initScene();

    this.configureAr();

    this._domOverlayElement = new DomOverlayElement();
  }

  initCamera() {
    this._camera = new pc.Entity();

    this._camera.addComponent("camera", {
        clearColor: new pc.Color(0, 0, 0, 0),
        farClip: 10000
    });

    this._camera.translate(0, 1.6, 0);
    this._camera.lookAt(0, 1.6, -10);

    this._app.root.addChild(this._camera);
  }

  initScene() {
    const l = new pc.Entity();
    l.addComponent("light", {
      type: "spot",
      range: 30,
    });

    l.translate(0, 10, -3);
    this._app.root.addChild(l);

    const box = new pc.Entity('cube');
    box.addComponent('model', {
        type: 'box'
    });
    box.translate(0, 0, 0);
    this._app.root.addChild(box);

    this._app.on('update', (dt) => {
      box.rotate(10 * dt, 20 * dt, 30 * dt)
    });

    // const createCube = (x, y, z) => {
    //   const cube = new pc.Entity();
    //   cube.addComponent("model", {
    //     type: "box",
    //   });

    //   cube.setLocalScale(0.5, 0.5, 0.5);
    //   cube.translate(x * 0.5, y, z * 0.5);
    //   this._app.root.addChild(cube);
    // };

    // // create a grid of cubes
    // const SIZE = 4;
    // for (let x = 0; x < SIZE; x++) {
    //   for (let y = 0; y < SIZE; y++) {
    //     createCube(2 * x - SIZE, 0.25, 2 * y - SIZE);
    //   }
    // }

    this.loadMesh('./duck.glb', 'd.glb', 'd').then((entity) => {
      entity.setLocalPosition(0, 0, -5);

      entity.setLocalScale(0.01, 0.01, 0.01);

      this._app.root.addChild(entity);
    });
  }

  async loadMesh(url, filename, name) {
    return new Promise((resolve, reject) => {
      const asset = new pc.Asset(name, 'container', { url, filename });

      asset.on('load', () => {
        console.log(`loaded asset: ${filename}`);
        const loadedEntity = asset.resource.instantiateRenderEntity();
        resolve(loadedEntity);
      });

      asset.on('error', (err) => {
        console.log(`loading asset failed: ${url} - ${err}`);
        reject(err);
      });

      this._app.assets.add(asset);
      this._app.assets.load(asset);
    });
  }

  configureAr() {
    if (this._app.xr.supported) {
      const activate = () => {
        if (this._app.xr.isAvailable(pc.XRTYPE_AR)) {
          if (this._app.xr.domOverlay && this._app.xr.domOverlay.supported) {
            this._app.xr.domOverlay.root = this._domOverlayElement.element;

            this._domOverlayElement.endXrCallback = () => {
              if (this._app.xr.active) {
                this._app.xr.end();
              }
            };
          }
          else {
            console.warn('DOM overlay not supported');
          }

          this._camera.camera.startXr(pc.XRTYPE_AR, pc.XRSPACE_LOCALFLOOR, {
            callback: (err) => {
              if (err)
                PlayCanvasApp.message(
                  "WebXR Immersive AR failed to start: " +
                  err.message
                );
            },
            optionalFeatures: ['dom-overlay', 'hit-test']
          });
        }
        else {
          PlayCanvasApp.message("Immersive AR is not available");
        }
      };

      this._app.mouse.on("mousedown", () => {
        if (!this._app.xr.active) {
          activate();
        }
      });

      if (this._app.touch) {
        this._app.touch.on("touchend", (evt) => {
          if (!this._app.xr.active) {
            // if not in AR, activate
            activate();
          }
          else {
            // otherwise reset camera
            this._camera.camera.endXr();
          }

          evt.event.preventDefault();
          evt.event.stopPropagation();
        });
      }

      // end session by keyboard ESC
      this._app.keyboard.on("keydown", (evt) => {
        if (evt.key === pc.KEY_ESCAPE && this._app.xr.active) {
          this._app.xr.end();
        }
      });

      this._app.xr.on("start", () => {
        PlayCanvasApp.message("Immersive AR session has started");
      });

      this._app.xr.on("end", () => {
        PlayCanvasApp.message("Immersive AR session has ended");
      });

      this._app.xr.on("available:" + pc.XRTYPE_AR, (available) => {
        PlayCanvasApp.message(
          "Immersive AR is " + (available ? "available" : "unavailable")
        );
      });

      this._app.xr.on("update", (xrFrame) => {
        console.log("XR Update");
        console.log(xrFrame);
        console.log(this._app.xr._referenceSpace);

        const pose  = xrFrame.getViewerPose(this._app.xr._referenceSpace);
        console.log(pose);
      });

      if (!this._app.xr.isAvailable(pc.XRTYPE_AR)) {
        PlayCanvasApp.message("Immersive AR is not available");
      }
    } else {
      PlayCanvasApp.message("WebXR is not supported");
    }
  }

  static message(msg) {
    let el = document.querySelector(".message");
    if (!el) {
        el = document.createElement("div");
        el.classList.add("message");
        document.body.append(el);
    }
    el.textContent = msg;
  }
}
