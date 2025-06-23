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
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uIntensity;

// Smooth minimum function for organic blending
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Create smooth gradient transition
vec3 gradient(vec3 a, vec3 b, vec3 c, float t) {
  float t1 = smoothstep(0.0, 0.5, t);
  float t2 = smoothstep(0.5, 1.0, t);
  return mix(mix(a, b, t1), c, t2);
}

void main() {
  vec2 uv = vUv;
  
  // Create flowing gradient patterns
  float flow = sin(uv.x * 2.0 + uTime * 0.3) * 0.5 + 0.5;
  float wave = cos(uv.y * 3.0 - uTime * 0.2) * 0.5 + 0.5;
  
  // Organic blend of patterns
  float pattern = smin(flow, wave, 0.4);
  
  // Create rich, multi-layered gradient
  float gradientMix = uv.y + pattern * 0.3;
  vec3 color = gradient(uColor1, uColor2, uColor3, gradientMix);
  
  // Add luminosity variation for depth
  float luminosity = sin(uv.x * 5.0 + uv.y * 3.0 + uTime) * 0.1 + 1.0;
  color *= luminosity;
  
  // Shimmer and glow effect
  float shimmer = abs(vDistortion) * 3.0;
  vec3 glowColor = mix(uColor2, uColor1, shimmer);
  color = mix(color, glowColor, shimmer * 0.4);
  
  // Apply theme intensity
  color *= uIntensity;
  
  // Distance-based transparency with better falloff
  float distanceFade = 1.0 - smoothstep(0.0, 1.5, abs(uScrollProgress));
  float alpha = mix(0.2, 0.95, distanceFade);
  
  // Enhanced contrast and saturation
  color = pow(color, vec3(0.9)); // Gamma correction
  color = mix(vec3(dot(color, vec3(0.299, 0.587, 0.114))), color, 1.2); // Boost saturation
  
  gl_FragColor = vec4(color, alpha);
}
`
