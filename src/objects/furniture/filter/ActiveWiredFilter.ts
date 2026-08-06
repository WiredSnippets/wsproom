import * as PIXI from "pixi.js";
import { filterVertex } from "./filterVertex";

export class ActiveWiredFilter extends PIXI.Filter {
  constructor() {
    super({
      glProgram: PIXI.GlProgram.from({
        vertex: filterVertex,
        fragment,
      }),
      resources: {
        wiredUniforms: {
          uTintColor: {
            value: new Float32Array([0.4, 0.75, 0.95]),
            type: "vec3<f32>",
          },
          uTintStrength: { value: 0.45, type: "f32" },
          uAlphaMultiplier: { value: 0.82, type: "f32" },
        },
      },
    });
  }
}

const fragment = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec3 uTintColor;
uniform float uTintStrength;
uniform float uAlphaMultiplier;

void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);
    if (color.a > 0.0) {
        color.rgb = mix(color.rgb, uTintColor, uTintStrength);
        color.a *= uAlphaMultiplier;
    }
    finalColor = color;
}
`;
