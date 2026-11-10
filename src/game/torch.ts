// Torchlight (version 114): on a night run each hero carries a warm
// light. Round them the night's blue gives way to warm firelight, fading
// out over TORCH_RADIUS tiles, with a little flicker. Nothing is lit
// for real (the game's materials are unlit, MeshBasicMaterial): each
// material's shader is given the torches' places and brightens what's near
// them, so it costs a few sums a pixel and no lights.
import * as THREE from "three";

// (twelve since version 165: four for the heroes, eight for the nearest fires
// of the Depths' and the Forgotten Castle's own, each with its own reach)
export const TORCHES = 12;
export const HERO_TORCHES = 4;
export const TORCH_RADIUS = 9;
// The torch's colour against the day's white: brighter than day at its
// heart (the maps' day colours are muted, and a softer one barely showed)
const WARM = new THREE.Color(1.75, 1.28, 0.78);

const uniforms = {
    uTorchPos: { value: Array.from({ length: TORCHES }, () => new THREE.Vector3(0, -1000, 0)) },
    uTorchOn: { value: new Array<number>(TORCHES).fill(0) },
    uTorchBoost: { value: new THREE.Vector3(1, 1, 1) },
    uTorchRadius: { value: new Array<number>(TORCHES).fill(TORCH_RADIUS) },
    // The window through whatever stands between the camera and the hero
    // (version 165): where they stand, which way the camera is over the
    // ground and how steeply it looks down, and whether it's open
    uSeePos: { value: new THREE.Vector3() },
    uSeeDir: { value: new THREE.Vector3(0, 1, 0) },
    uSeeOn: { value: 0 },
};

// A wall of the castle or a rock of the caves between the camera and the
// hero would hide them: what's on the line of sight to them isn't drawn (a
// tile or so across, soft at the edge), so they show through it. `dir` is the
// way from the hero to the camera along the ground, `slope` how much higher
// the line of sight is for each tile along it.
export function setSeeThrough(x: number, y: number, z: number, dirX: number, dirZ: number, slope: number, on: boolean): void {
    uniforms.uSeePos.value.set(x, y, z);
    uniforms.uSeeDir.value.set(dirX, slope, dirZ);
    uniforms.uSeeOn.value = on ? 1 : 0;
}

const patched = new WeakSet<THREE.Material>();

// What the torch multiplies the night's colours by at its heart: back to
// the day's (over the night's light), then warmed
export function setTorchNight(night: THREE.Color): void {
    uniforms.uTorchBoost.value.set(WARM.r / night.r, WARM.g / night.g, WARM.b / night.b);
}

// Where each torch is this frame, how bright (0 for none), and how far it
// reaches
export function setTorch(i: number, x: number, y: number, z: number, on: number, radius = TORCH_RADIUS): void {
    uniforms.uTorchPos.value[i].set(x, y, z);
    uniforms.uTorchOn.value[i] = on;
    uniforms.uTorchRadius.value[i] = radius;
}

export function torchesOut(): void {
    uniforms.uSeeOn.value = 0;
    uniforms.uTorchOn.value.fill(0);
}

// A material lit by the torches from now on (each once; only the unlit
// ones the maps and models are made of)
export function addTorch(material: THREE.Material): void {
    const basic = material as THREE.MeshBasicMaterial;
    if (patched.has(material) || !basic.isMeshBasicMaterial) {
        return;
    }
    patched.add(material);
    const before = material.onBeforeCompile;
    material.onBeforeCompile = (shader, renderer) => {
        before.call(material, shader, renderer);
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader =
            "varying vec3 vTorchWorld;\n" +
            shader.vertexShader.replace(
                "#include <project_vertex>",
                `#include <project_vertex>
                {
                    vec4 torchWorld = vec4(transformed, 1.0);
                    #ifdef USE_INSTANCING
                        torchWorld = instanceMatrix * torchWorld;
                    #endif
                    vTorchWorld = (modelMatrix * torchWorld).xyz;
                }`,
            );
        shader.fragmentShader =
            `uniform vec3 uTorchPos[${TORCHES}];
            uniform float uTorchOn[${TORCHES}];
            uniform vec3 uTorchBoost;
            uniform float uTorchRadius[${TORCHES}];
            uniform vec3 uSeePos;
            uniform vec3 uSeeDir;
            uniform float uSeeOn;
            varying vec3 vTorchWorld;\n` +
            shader.fragmentShader.replace(
                "#include <color_fragment>",
                `#include <color_fragment>
                {
                    float torchLight = 0.0;
                    for (int i = 0; i < ${TORCHES}; i++) {
                        vec3 away = vTorchWorld - uTorchPos[i];
                        away.y *= 0.6;
                        float near = clamp(1.0 - length(away) / uTorchRadius[i], 0.0, 1.0);
                        torchLight = max(torchLight, uTorchOn[i] * near * near * (3.0 - 2.0 * near));
                    }
                    diffuseColor.rgb *= mix(vec3(1.0), uTorchBoost, torchLight);
                    if (uSeeOn > 0.5) {
                        vec2 seeRel = vTorchWorld.xz - uSeePos.xz;
                        float seeAlong = dot(seeRel, uSeeDir.xz);
                        float seeAcross = abs(seeRel.x * uSeeDir.z - seeRel.y * uSeeDir.x);
                        float seeUp = vTorchWorld.y - uSeePos.y - seeAlong * uSeeDir.y;
                        if (seeAlong > 0.4 && seeAlong < 9.0 && seeUp > -0.3 && seeUp < 2.2 && vTorchWorld.y - uSeePos.y > 0.3) {
                            float seeEdge = max(seeAcross - 0.8, 0.0) / 0.5;
                            if (seeEdge < 1.0 && (seeEdge < 0.01 || mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) < 0.5)) {
                                discard;
                            }
                        }
                    }
                }`,
            );
    };
    const key = material.customProgramCacheKey.bind(material);
    material.customProgramCacheKey = () => key() + "|torch12see";
    material.needsUpdate = true;
}

// Every material in a part of the scene
export function addTorchTo(root: THREE.Object3D): void {
    root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) {
            return;
        }
        for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            addTorch(m);
        }
    });
}

// A torch's flicker: two slow waves and a quick one, never far from full
export function flicker(t: number, seed: number): number {
    return 0.9 + 0.05 * Math.sin(t * 2.3 + seed) + 0.03 * Math.sin(t * 5.7 + seed * 2.1) + 0.02 * Math.sin(t * 13.1 + seed * 0.7);
}
