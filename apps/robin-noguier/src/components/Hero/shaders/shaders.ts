export const vertexShader = `
varying vec2 vUv;
varying float vDistortion;
uniform float uTime;
uniform float uScrollProgress;

void main() {
  vUv = uv;
  
  vec3 pos = position;
  
  // Wave distortion based on scroll
  float wave = sin(uv.x * 10.0 + uTime) * 0.05;
  pos.z += wave * abs(uScrollProgress);
  
  // Store distortion for fragment shader
  vDistortion = wave;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`

export const fragmentShader = `
varying vec2 vUv;
varying float vDistortion;
uniform float uTime;
uniform float uScrollProgress;
uniform vec3 uColor;

void main() {
  vec2 uv = vUv;
  
  // Create gradient effect
  vec3 color = mix(uColor, vec3(1.0), uv.y);
  
  // Add some noise/grain
  float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
  color += noise * 0.02;
  
  // Fade based on scroll distance
  float alpha = 1.0 - min(abs(uScrollProgress) * 0.5, 0.8);
  
  gl_FragColor = vec4(color, alpha);
}
`
