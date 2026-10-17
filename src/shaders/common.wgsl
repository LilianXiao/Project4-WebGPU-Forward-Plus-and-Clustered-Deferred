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
