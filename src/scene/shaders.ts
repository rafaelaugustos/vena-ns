import { HEART_CENTER } from './heart-space'

export const anatomyShader = `
#pragma arguments
float formation;
float beat;
float pulsePower;
float isHeart;
float focus;
float touchPower;
float3 touchPosition;
float2 orbit;
float ripple;
float3 rippleOrigin;
float heartTap;
float rippleFromHeart;
#pragma body
float3 p = _geometry.position.xyz;
float seed = fract(sin(dot(p, float3(12.9898, 78.233, 45.164))) * 43758.5453);
float angle = seed * 6.2831853;
float3 dispersed = float3(cos(angle), sin(angle), sin(angle * 3.0)) * (1.8 + seed * 1.6);
p = mix(dispersed, p, formation);
float3 center = float3(${HEART_CENTER.join(', ')});
float3 heartPosition = center;
float contraction = exp(-pow((beat - 0.17) / 0.095, 2.0)) + 0.38 * exp(-pow((beat - 0.39) / 0.085, 2.0));
float tapContraction = exp(-pow((heartTap - 0.15) / 0.095, 2.0)) + 0.28 * exp(-pow((heartTap - 0.38) / 0.09, 2.0));
contraction = min(1.5, contraction + tapContraction * 1.1);
float3 pulseScale = float3(1.0 + contraction * 0.14, 1.0 + contraction * 0.075, 1.0 + contraction * 0.1);
p = mix(p, center + (p - center) * pulseScale, isHeart);
float cx = cos(orbit.y), sx = sin(orbit.y);
float cy = cos(orbit.x), sy = sin(orbit.x);
p = float3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);
p = float3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
heartPosition = float3(heartPosition.x, heartPosition.y * cx - heartPosition.z * sx, heartPosition.y * sx + heartPosition.z * cx);
heartPosition = float3(heartPosition.x * cy + heartPosition.z * sy, heartPosition.y, -heartPosition.x * sy + heartPosition.z * cy);
float zoom = 1.0 + focus * 1.5;
p = (p - center * focus * 0.95) * zoom;
heartPosition = (heartPosition - center * focus * 0.95) * zoom;
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
// Each beat sends light out from the heart. Taps add a wave without resetting it.
float beatPhase = clamp((beat - 0.17) / 0.8, 0.0, 1.0);
float2 fromHeart = p.xy - heartPosition.xy;
float pulseWave = exp(-pow((length(fromHeart) - beatPhase * 3.8) / 0.22, 2.0));
pulseWave *= smoothstep(0.0, 0.035, beatPhase) * pow(1.0 - beatPhase, 1.4) * pulsePower * body;
float tapPhase = mix(ripple, clamp((ripple - 0.12) / 0.88, 0.0, 1.0), rippleFromHeart);
float2 fromImpact = p.xy - mix(rippleOrigin.xy, heartPosition.xy, rippleFromHeart);
float radius = tapPhase * 3.8;
float tapWave = exp(-pow((length(fromImpact) - radius) / 0.18, 2.0));
tapWave *= smoothstep(0.0, 0.035, tapPhase) * pow(1.0 - tapPhase, 1.4) * body;
float wave = min(1.0, pulseWave * 0.85 + tapWave);
p.xy += normalize(fromImpact + float2(0.001)) * tapWave * (0.07 + seed * 0.05);
p.xy += normalize(fromHeart + float2(0.001)) * pulseWave * 0.035;
p.z += wave * (0.12 + seed * 0.1);
_geometry.position.xyz = p;
float neckFade = 1.0 - smoothstep(1.08, 1.48, _geometry.position.y);
float waistFade = smoothstep(-1.2, -0.3, _geometry.position.y);
_geometry.color.a *= formation * mix((1.0 - focus * 0.97) * neckFade * waistFade, 1.0, isHeart);
float heartbeatLight = mix(1.0, 0.8 + contraction * 1.15, isHeart);
_geometry.color.rgb *= heartbeatLight * (1.0 + illumination * 0.85);
// Lift the warm highlights locally so the pointer reads as light, not a flash.
_geometry.color.rgb += float3(0.12, 0.14, 0.1) * illumination * isHeart;
_geometry.color.rgb += float3(0.08, 0.14, 0.17) * pow(min(contraction, 1.0), 3.0) * isHeart;
// The wave leaves the heart red and turns pearl white as it crosses the chest.
float3 redLight = float3(1.0, 0.025, 0.075);
float3 whiteLight = float3(0.88, 0.95, 1.0);
float3 pulseColor = mix(redLight, whiteLight, smoothstep(0.15, 0.4, beatPhase));
float3 tapColor = mix(redLight, whiteLight, smoothstep(0.15, 0.4, tapPhase));
float energy = pulseWave * 0.85 + tapWave;
float3 flash = (pulseColor * pulseWave * 0.85 + tapColor * tapWave) / max(1.0, energy);
_geometry.color.rgb *= 1.0 - wave * 0.5;
_geometry.color.rgb += flash;
_geometry.color.a *= 1.0 + wave * 2.0;
`;
