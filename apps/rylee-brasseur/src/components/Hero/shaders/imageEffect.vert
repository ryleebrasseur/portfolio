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