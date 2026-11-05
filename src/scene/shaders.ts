export const anatomyShader = `
#pragma arguments
float formation;
float beat;
float isHeart;
float focus;
float touchPower;
float3 touchPosition;
float2 orbit;
float ripple;
float3 rippleOrigin;
#pragma body
float3 p = _geometry.position.xyz;
float seed = fract(sin(dot(p, float3(12.9898, 78.233, 45.164))) * 43758.5453);
float angle = seed * 6.2831853;
float3 dispersed = float3(cos(angle), sin(angle), sin(angle * 3.0)) * (1.8 + seed * 1.6);
p = mix(dispersed, p, formation);
float3 center = float3(0.2, 0.42, 0.55);
float contraction = exp(-pow((beat - 0.17) / 0.095, 2.0)) + 0.38 * exp(-pow((beat - 0.39) / 0.085, 2.0));
float3 pulseScale = float3(1.0 + contraction * 0.14, 1.0 + contraction * 0.075, 1.0 + contraction * 0.1);
p = mix(p, center + (p - center) * pulseScale, isHeart);
float cx = cos(orbit.y), sx = sin(orbit.y);
float cy = cos(orbit.x), sy = sin(orbit.x);
p = float3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);
p = float3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
float zoom = 1.0 + focus * 1.5;
p = (p - center * focus * 0.95) * zoom;
float body = 1.0 - isHeart;
float3 delta = p - touchPosition;
float d = length(delta.xy);
float influence = exp(-d * d * 24.0) * touchPower * body;
float illumination = exp(-d * d * 9.0) * touchPower;
float2 direction = normalize(delta.xy + float2(0.001));
float2 tangent = float2(-direction.y, direction.x);
// Only the torso parts around the cursor. The heart keeps its silhouette.
p.xy += (direction * (0.075 + seed * 0.045) + tangent * (seed - 0.35) * 0.06) * influence;
p.z += influence * (0.08 + seed * 0.12);
// A click sends a short, expanding wave through the torso, independently of hover.
float2 fromImpact = p.xy - rippleOrigin.xy;
float radius = ripple * 3.8;
float wave = exp(-pow((length(fromImpact) - radius) / 0.18, 2.0));
wave *= smoothstep(0.0, 0.035, ripple) * pow(1.0 - ripple, 1.4) * body;
p.xy += normalize(fromImpact + float2(0.001)) * wave * (0.07 + seed * 0.05);
p.z += wave * (0.12 + seed * 0.1);
_geometry.position.xyz = p;
float neckFade = 1.0 - smoothstep(1.08, 1.48, _geometry.position.y);
float waistFade = smoothstep(-1.2, -0.3, _geometry.position.y);
_geometry.color.a *= formation * mix((1.0 - focus * 0.97) * neckFade * waistFade, 1.0, isHeart);
float heartbeatLight = mix(1.0, 0.95 + contraction * 1.4, isHeart);
_geometry.color.rgb *= heartbeatLight * (1.0 + illumination * 0.85);
// Lift the warm highlights locally so the pointer reads as light, not a flash.
_geometry.color.rgb += float3(0.12, 0.14, 0.1) * illumination * isHeart;
_geometry.color.rgb += float3(0.7, 0.5, 0.65) * wave;
_geometry.color.a *= 1.0 + wave * 2.5;
`;
