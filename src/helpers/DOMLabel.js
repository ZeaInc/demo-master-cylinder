// import domtoimage from 'dom-to-image-more'
const {
  Color,
  DataImage,
  StringParameter,
  BooleanParameter,
  ColorParameter,
  NumberParameter,
  Registry,
  labelManager,
} = window.zeaEngine;

/** Class representing a label.
 * @extends DataImage
 */
class DOMLabel extends DataImage {
  /**
   * Create a label.
   * @param {string} name - The name value.
   * @param {any} library - The library value.
   */
  constructor(name, library) {
    super(name);

    // this.__canvasElem = document.createElement('canvas')
    const fontSize = 22;

    const libraryParam = this.addParameter(new StringParameter('library'));
    this.addParameter(new StringParameter('Header', ''));
    this.addParameter(new StringParameter('Text', ''));
    // or load the label when it is loaded.

    // const setLabelTextToLibrary = ()=>{
    //     const library = libraryParam.getValue();
    //     const name = this.getName();
    //     const text = textParam.getValue();
    //     labelManager.setLabelTextToLibrary(library, name, text);
    // }
    // textParam.on('valueChanged', setLabelText);

    this.addParameter(new ColorParameter('fontColor', new Color(0, 0, 0)));
    // this.addParameter(new StringParameter('textAlign', 'left'))
    // this.addParameter(MultiChoiceParameter('textAlign', 0, ['left', 'right']));
    // this.addParameter(new BooleanParameter('fillText', true))
    this.addParameter(new NumberParameter('margin', fontSize * 0.1));
    this.addParameter(new NumberParameter('width', 400));
    this.addParameter(new NumberParameter('borderWidth', 2));
    this.addParameter(new NumberParameter('borderRadius', fontSize * 0.5));
    this.addParameter(new BooleanParameter('outlineColor', new Color(0, 0, 0)));
    this.addParameter(new ColorParameter('backgroundColor', new Color('#FBC02D')));
    this.addParameter(new NumberParameter('fontSize', 22));
    this.addParameter(new StringParameter('font', 'Verdana'));

    const reload = () => {
      this.loadLabelData();
    };
    this.on('nameChanged', reload);

    if (library) libraryParam.setValue(library);

    this.__requestedRerender = true;
    this.loadLabelData();
  }

  /**
   * This method can be overrridden in derived classes
   * to perform general updates (see GLPass or BaseItem).
   * @param {any} param - The param param.
   * @param {any} mode - The mode param.
   * @private
   */
  __parameterValueChanged(param, mode) {
    // if (!this.__requestedRerender) {
    //   this.__requestedRerender = true
    this.loadLabelData();
    // }
  }

  /**
   * The loadLabelData method.
   */
  loadLabelData() {
    const onLoaded = () => {
      this.__requestedRerender = false;
      this.renderLabelToImage();
    };

    const loadText = () => {
      return new Promise((resolve) => {
        const library = this.getParameter('library').getValue();
        if (library == '') {
          resolve();
          return;
        }
        if (!labelManager.isLibraryFound(library)) {
          console.warn('Label Libary not found:', library);
          resolve();
          return;
        }
        const getLibraryText = () => {
          const name = this.getName();
          try {
            const labelText = labelManager.getLabelText(library, name);
            this.getParameter('Header').setValue(labelText);
          } catch (e) {
            // Note: if the text is not found in the labels pack
            // an exception is thrown, and we catch it here.
            console.warn(e);
          }
          try {
            const detailText = labelManager.getLabelText(library, name + '-detail');
            if (detailText) this.getParameter('Text').setValue(detailText);
          } catch (e) {
            // Note: if the detail text is not found in the labels pack, do error.
          }
          resolve();
        };
        if (!labelManager.isLibraryLoaded(library)) {
          labelManager.on('labelLibraryLoaded', (event) => {
            if (event.library == library) getLibraryText();
          });
        } else {
          getLibraryText();
        }
      });
    };
    const loadFont = () => {
      return new Promise((resolve) => {
        if (document.fonts != undefined) {
          const font = this.getParameter('font').getValue();
          const fontSize = this.getParameter('fontSize').getValue();
          document.fonts.load(fontSize + 'px "' + font + '"').then(() => {
            // console.log("Font Loaded:" + font);
            resolve();
          });
        } else {
          resolve();
        }
      });
    };
    Promise.all([loadText(), loadFont()]).then(onLoaded);
  }

  /**
   * Renders the label text to a canvas element ready to display,
   */
  renderLabelToImage() {
    let header = this.getParameter('Header').getValue();
    let text = this.getParameter('Text').getValue();
    if (header == '') header = this.getName();

    const width = this.getParameter('width').getValue();
    const font = this.getParameter('font').getValue();
    const fontColor = this.getParameter('fontColor').getValue();
    const textAlign = 'center'; //this.getParameter('textAlign').getValue()
    const fontSize = this.getParameter('fontSize').getValue();
    const margin = this.getParameter('margin').getValue();
    const borderWidth = this.getParameter('borderWidth').getValue();
    const borderRadius = this.getParameter('borderRadius').getValue();
    const outlineColor = this.getParameter('outlineColor').getValue();
    const backgroundColor = this.getParameter('backgroundColor').getValue();

    const div = document.createElement('div');
    div.style['text-align'] = textAlign;
    div.style['font'] = `${fontSize}px ${font}`;
    div.style['width'] = `${width}px`;
    div.style['padding'] = `${margin}px`;
    div.style['color'] = fontColor.toHex();
    div.style['background'] = backgroundColor.toHex();
    div.style['border'] = `${borderWidth}px solid`;
    // div.style['border-radius'] = borderRadius
    div.style['border-radius'] = `${borderRadius}px`;
    div.style['border-color'] = outlineColor.toHex();

    if (text) {
      div.innerHTML = `<h3>${header}</h3><p>${text}</p>`;
    } else {
      div.innerHTML = `<h3>${header}</h3>`;
    }

    document.body.appendChild(div);
    domtoimage
      .toPng(div)
      .then((dataUrl) => {
        var img = new Image();
        img.src = dataUrl;
        if (img.width > 0 && img.height > 0) {
          this.__data = img;
          if (!this.__loaded) {
            this.__loaded = true;
            this.emit('loaded');
          } else {
            this.emit('updated');
          }
        } else {
          // We often get errors trying to render labels and I'm not sure why.
          // Eventually they render.
          // console.warn('Unable to render Label:', this.getName());
        }
        document.body.removeChild(div);
      })
      .catch(function (error) {
        console.error('oops, something went wrong!', error);
      });
  }

  /**
   * The getParams method.
   * @return {any} - The return value.
   */
  getParams() {
    return super.getParams();
  }

  // ////////////////////////////////////////
  // Persistence

  /**
   * The toJSON method encodes this type as a json object for persistences.
   * @param {object} context - The context value.
   * @param {number} flags - The flags value.
   * @return {object} - Returns the json object.
   */
  toJSON(context, flags) {
    const j = super.toJSON(context, flags);
    return j;
  }

  /**
   * The fromJSON method decodes a json object for this type.
   * @param {object} j - The json object this item must decode.
   * @param {object} context - The context value.
   * @param {number} flags - The flags value.
   */
  fromJSON(j, context, flags) {
    super.fromJSON(j, context, flags);
    this.__getLabelText();
  }
}

Registry.register('DOMLabel', DOMLabel);

export { DOMLabel };
