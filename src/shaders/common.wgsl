// CHECKITOUT: code that you add here will be prepended to all shaders

struct Light {
    pos: vec3f,
    color: vec3f
}

struct LightSet {
    numLights: u32,
    lights: array<Light>
}

// 2: a ClusterSet struct similar to LightSet

struct CameraUniforms {
    // 1.3: entry for the view proj mat (of type mat4x4f)
    viewProjMat: mat4x4f, // 64
    viewMat: mat4x4f, // offset 64; 64
    invProjMat: mat4x4f, // offset 128; 64
    screenSize: vec2f, // offset 192; 8
    near: f32, // offset 200
    far: f32 // offset 204
} // 208

struct Cluster {
    numLights: u32,
    lightIndices: array<u32, ${maxLightsInCluster}>
}

struct ClusterSet {
    clusters: array<Cluster>
}

// CHECKITOUT: this special attenuation function ensures lights don't affect geometry outside the maximum light radius
fn rangeAttenuation(distance: f32) -> f32 {
    return clamp(1.f - pow(distance / ${lightRadius}, 4.f), 0.f, 1.f) / (distance * distance);
}

fn calculateLightContrib(light: Light, posWorld: vec3f, nor: vec3f) -> vec3f {
    let vecToLight = light.pos - posWorld;
    let distToLight = length(vecToLight);

    let lambert = max(dot(nor, normalize(vecToLight)), 0.f);
    return light.color * lambert * rangeAttenuation(distToLight);
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
