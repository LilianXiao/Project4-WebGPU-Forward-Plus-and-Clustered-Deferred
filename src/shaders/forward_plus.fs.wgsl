// 2: implement the Forward+ fragment shader

// See naive.fs.wgsl for basic fragment shader setup; this shader should use light clusters instead of looping over all lights

// ------------------------------------
// Shading process:
// ------------------------------------
// Determine which cluster contains the current fragment.
// Retrieve the number of lights that affect the current fragment from the cluster’s data.
// Initialize a variable to accumulate the total light contribution for the fragment.
// For each light in the cluster:
//     Access the light's properties using its index.
//     Calculate the contribution of the light based on its position, the fragment’s position, and the surface normal.
//     Add the calculated contribution to the total light accumulation.
// Multiply the fragment’s diffuse color by the accumulated light contribution.
// Return the final color, ensuring that the alpha component is set appropriately (typically to 1).

@group(${bindGroup_scene}) @binding(0) var<uniform> cameraUniforms: CameraUniforms;
@group(${bindGroup_scene}) @binding(1) var<storage, read> lightSet: LightSet;
@group(${bindGroup_scene}) @binding(2) var<storage, read> clusterSet: ClusterSet;

@group(${bindGroup_material}) @binding(0) var diffuseTex: texture_2d<f32>;
@group(${bindGroup_material}) @binding(1) var diffuseTexSampler: sampler;

struct FragmentInput
{
    @builtin(position) fragPos: vec4f,
    @location(0) pos: vec3f,
    @location(1) nor: vec3f,
    @location(2) uv: vec2f
}

fn getClusterIdx(fragCoord: vec2f, posWorld: vec3f, camera: CameraUniforms) -> u32 {
    // fun cluster stuff
    let X = ${clusterCountX}u;
    let Y = ${clusterCountY}u;
    let Z = ${clusterCountZ}u;

    // find the screen tile (xy plane)
    let XY = vec2u(
        fragCoord / camera.screenSize * vec2f(f32(X), f32(Y))
    );
    let tX = min(XY.x, X - 1u);
    let tY = min(XY.y, Y - 1u);

    // find depth slice (z)
    let near = camera.near;
    let far = camera.far;
    let vZ = -(camera.viewMat * vec4f(posWorld, 1.0)).z;

    let slice = u32(max(log(vZ / near) / log(far / near) * f32(Z), 0.0));
    let tZ = min(slice, Z - 1u);

    return tX + tY * X + tZ * X * Y;
}

@fragment
fn main(in: FragmentInput) -> @location(0) vec4f
{
    let diffuseColor = textureSample(diffuseTex, diffuseTexSampler, in.uv);
    if (diffuseColor.a < 0.5f) {
        discard;
    }

    let clusterIdx = getClusterIdx(in.fragPos.xy, in.pos, cameraUniforms);
    let numLights = clusterSet.clusters[clusterIdx].numLights;

    var totalLightContrib = vec3f(0, 0, 0);
    for (var i = 0u; i < numLights; i++) {
        let lightIdx = clusterSet.clusters[clusterIdx].lightIndices[i];
        let light = lightSet.lights[lightIdx];
        totalLightContrib += calculateLightContrib(light, in.pos, normalize(in.nor));
    }

    var finalColor = diffuseColor.rgb * totalLightContrib;
    return vec4(finalColor, 1);
}
