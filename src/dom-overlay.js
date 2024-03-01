 function domOverlayHtml() {
    const html = `
    <div class="container">
        <!--<div class="button start" data-event="xr:start">Start AR</div>-->
        <div id="xr-end-button" class="button end" data-event="xr:end">End AR</div>
        <div class="text">

        </div>
        <div class="text message available hidden">WebXR AR is not available</div>
        <div class="text message support" hidden>WebXR DOM Overlay is not supported</div>
    </div>`;

    return html;
 }

 export class DomOverlayElement {
  _element;

  constructor() {
    this._element = document.createElement('div');
    this._element.innerHTML = domOverlayHtml();
  }

  get element() {
    return this._element;
  }

  set endXrCallback(callback) {
    if (!this._element) {
      return;
    }
    else {
      console.warn(`endXrCallback - element is null`);
    }

    const endXrButton = this._element.querySelector('#xr-end-button');

    if (endXrButton) {
      endXrButton.addEventListener('click', () => callback());
    }
    else {
      console.warn(`endXrCallback - could not retrieve xr-end-button`);
    }
  }
 }
