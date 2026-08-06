import * as PIXI from "pixi.js";
import { filterVertex } from "./filterVertex";

export class HighlightFilter extends PIXI.Filter {
  constructor(
    backgroundColor: number,
    borderColor: number,
    opacity = 0.5
  ) {
    const bg = new PIXI.Color(backgroundColor).toArray();
    const border = new PIXI.Color(borderColor).toArray();

    super({
      glProgram: PIXI.GlProgram.from({
        vertex: filterVertex,
        fragment,
      }),
      resources: {
        highlightUniforms: {
          uBackgroundColor: {
            value: new Float32Array([bg[0], bg[1], bg[2], opacity]),
            type: "vec4<f32>",
          },
          uBorderColor: {
            value: new Float32Array([border[0], border[1], border[2], 1.0]),
            type: "vec4<f32>",
          },
        },
      },
    });
  }

  public set opacity(value: number) {
    this.resources.highlightUniforms.uniforms.uBackgroundColor[3] = value;
  }

  public get opacity(): number {
    return this.resources.highlightUniforms.uniforms.uBackgroundColor[3];
  }
}

const fragment = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uBackgroundColor;
uniform vec4 uBorderColor;

void main(void) {
    vec4 currentColor = texture(uTexture, vTextureCoord);

    if (currentColor.a > 0.0) {
        if (currentColor.r == 0.0 && currentColor.g == 0.0 && currentColor.b == 0.0) {
            finalColor = uBorderColor;
        } else {
            vec4 modifiedBackgroundColor = vec4(uBackgroundColor.rgb * uBackgroundColor.a, uBackgroundColor.a);
            finalColor = mix(currentColor, modifiedBackgroundColor, 0.7);
            finalColor.a = max(currentColor.a, modifiedBackgroundColor.a);
        }
    } else {
        finalColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
`;
