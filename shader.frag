precision mediump float;

varying vec3 vNormal;
varying vec3 vFragPos;
varying vec2 vTexCoord;

uniform bool uIsSun;
uniform bool uUseNightTexture;
uniform sampler2D uTexture;     
uniform sampler2D uTextureDark; 

void main() {
    vec4 dayColor = texture2D(uTexture, vTexCoord); 

    if (uIsSun) {
        gl_FragColor = dayColor; 
    } else {
        vec3 lightPos = vec3(0.0, 0.0, 0.0);
        vec3 norm = normalize(vNormal);
        vec3 lightDir = normalize(lightPos - vFragPos);
        
        float dotNL = dot(norm, lightDir);
        
        vec3 finalRGB;

        if (uUseNightTexture) {
            vec4 nightColor = texture2D(uTextureDark, vTexCoord);
            float transition = smoothstep(-0.2, 0.2, dotNL);
            finalRGB = mix(nightColor.rgb, dayColor.rgb, transition);
        } else {
            float diff = max(dotNL, 0.0);
            float ambientStrength = 0.05;
            vec3 ambient = ambientStrength * dayColor.rgb;
            vec3 diffuse = diff * dayColor.rgb;
            finalRGB = ambient + diffuse;
        }

        gl_FragColor = vec4(finalRGB, 1.0);
    }
}