// 3: implement the Clustered Deferred fullscreen fragment shader
// Similar to the Forward+ fragment shader, but with vertex information coming from the G-buffer instead.

@group(0) @binding(0) var<uniform> cameraUniforms: CameraUniforms;
@group(0) @binding(1) var<storage, read> lightSet: LightSet;
@group(0) @binding(2) var<storage, read> clusterSet: ClusterSet;

@group(1) @binding(0) var gPosition: texture_2d<f32>;
@group(1) @binding(1) var gNormal: texture_2d<f32>;
@group(1) @binding(2) var gAlbedo: texture_2d<f32>;

@fragment
fn main(@builtin(position) fragPos: vec4f) -> @location(0) vec4f {
    let coord = vec2i(fragPos.xy);
    let albedo = textureLoad(gAlbedo, coord, 0);

    // background
    if (albedo.a == 0.0) {
        return vec4f(0.0, 0.0, 0.0, 1.0);
    }

    let pos = textureLoad(gPosition, coord, 0).xyz;
    let nor = textureLoad(gNormal, coord, 0).xyz;
    let clusterIdx = getClusterIdx(fragPos.xy, pos, cameraUniforms);
    let numLights = clusterSet.clusters[clusterIdx].numLights;

    var totalLightContrib = vec3f(0, 0, 0);
    for (var i = 0u; i < numLights; i++) {
        let lightIdx = clusterSet.clusters[clusterIdx].lightIndices[i];
        let light = lightSet.lights[lightIdx];
        totalLightContrib += calculateLightContrib(light, pos, normalize(nor));
    }

    return vec4(albedo.rgb * totalLightContrib, 1.0);
}