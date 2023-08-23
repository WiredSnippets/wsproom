import * as PIXI from "pixi.js";

export class HighlightFilter extends PIXI.Filter {
  constructor(
    private _backgroundColor: number, 
    private _borderColor: number,
    private _opacity: number = 0.5) {
    super(vertex, fragment);
    
    this.uniforms.backgroundColor = new Float32Array([
      ...PIXI.utils.hex2rgb(this._backgroundColor),
      this._opacity,
    ]);
    this.uniforms.borderColor = new Float32Array([
      ...PIXI.utils.hex2rgb(this._borderColor),
      1.0,
    ]);

  }

  public set opacity(value: number) {
    this.uniforms.backgroundColor[3] = value;
  }

  public get opacity(): number {
    return this.uniforms.backgroundColor[3];
  }
}

const vertex = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}
`;

const fragment = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 backgroundColor;
uniform vec4 borderColor;

void main(void) {
    vec4 currentColor = texture2D(uSampler, vTextureCoord);

    if (currentColor.a > 0.0) {
        if (currentColor.r == 0.0 && currentColor.g == 0.0 && currentColor.b == 0.0) {
            gl_FragColor = borderColor;
        } else {
            vec4 modifiedBackgroundColor = vec4(backgroundColor.rgb * backgroundColor.a, backgroundColor.a);
            gl_FragColor = mix(currentColor, modifiedBackgroundColor, 0.6);
        }
    }
}
`;
