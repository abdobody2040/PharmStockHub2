declare module 'qrcode' {
  export interface QRCodeOptions {
    /**
     * QR Code version. If not specified the more suitable value will be calculated.
     */
    version?: number;
    
    /**
     * Error correction level. Possible values: 'L', 'M', 'Q', 'H'
     */
    errorCorrectionLevel?: string;
    
    /**
     * Size of the modules in pixels
     */
    size?: number;
    
    /**
     * Margin in modules
     */
    margin?: number;
    
    /**
     * Define how the QR Code should be rendered. Possible values: 'canvas', 'svg', 'terminal'
     */
    type?: string;
    
    /**
     * Color options
     */
    color?: {
      /**
       * Color of dark module. Value must be in hex format (RGBA). Default: #000000ff
       */
      dark?: string;
      
      /**
       * Color of light module. Value must be in hex format (RGBA). Default: #ffffffff
       */
      light?: string;
    };
    
    /**
     * Scale factor. A value of 1 means 1px per modules.
     */
    scale?: number;
    
    /**
     * Forces a specific rendering engine. Options: undefined, 'utf8', 'svg', 'terminal'
     */
    rendererOpts?: any;
    
    /**
     * Output format. Options: 'png', 'svg', 'utf8'
     */
    output?: string;
    
    /**
     * Quality level for output image. Only for JPG format.
     */
    quality?: number;
    
    /**
     * Width in pixels of the output image. If not specified, value will be calculated from other properties.
     */
    width?: number;
  }
  
  /**
   * Creates a QR Code and returns a data URI containing a representation of the QR Code image.
   * @param text The text to encode
   * @param options The QR Code options
   */
  export function toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
  
  /**
   * Creates a QR Code and returns a data URI containing a representation of the QR Code image.
   * @param text The text to encode
   * @param callback The callback function
   */
  export function toDataURL(text: string, callback: (error: Error | null, url: string) => void): void;
  
  /**
   * Creates a QR Code and returns a data URI containing a representation of the QR Code image.
   * @param text The text to encode
   * @param options The QR Code options
   * @param callback The callback function
   */
  export function toDataURL(text: string, options: QRCodeOptions, callback: (error: Error | null, url: string) => void): void;

  /**
   * Creates a QR Code Symbol and returns a string containing a UTF8 representation of the QR Code.
   * @param text The text to encode
   * @param options The QR Code options
   */
  export function toString(text: string, options?: QRCodeOptions): Promise<string>;

  /**
   * Draws qr code symbol to canvas.
   * @param canvas HTML Canvas element
   * @param text The text to encode
   * @param options The QR Code options
   */
  export function toCanvas(canvas: HTMLCanvasElement, text: string, options?: QRCodeOptions): Promise<HTMLCanvasElement>;
}