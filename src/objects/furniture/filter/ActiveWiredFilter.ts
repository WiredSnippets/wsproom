import * as PIXI from "pixi.js";

export class ActiveWiredFilter extends PIXI.Filter {
  constructor() {
    super(vertex, fragment);
    this.uniforms.tintColor = new Float32Array([0.4, 0.75, 0.95, 1.0]);
    this.uniforms.tintStrength = 0.45;
    this.uniforms.alphaMultiplier = 0.82;
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
uniform vec3 tintColor;
uniform float tintStrength;
uniform float alphaMultiplier;

void main(void) {
    vec4 color = texture2D(uSampler, vTextureCoord);
    if (color.a > 0.0) {
        color.rgb = mix(color.rgb, tintColor, tintStrength);
        color.a *= alphaMultiplier;
    }
    gl_FragColor = color;
}
`;
