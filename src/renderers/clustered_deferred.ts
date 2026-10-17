import * as renderer from '../renderer';
import * as shaders from '../shaders/shaders';
import { Stage } from '../stage/stage';

export class ClusteredDeferredRenderer extends renderer.Renderer {
    // 3: add layouts, pipelines, textures, etc. needed for Forward+ here
    // you may need extra uniforms such as the camera view matrix and the canvas resolution
    // G buffer pass
    gBufferSceneBindGroupLayout: GPUBindGroupLayout;
    gBufferSceneBindGroup: GPUBindGroup;
    gBufferPipeline: GPURenderPipeline;

    // G buffer textures
    gPositionTexture: GPUTexture;
    gPositionTextureView: GPUTextureView;
    gNormalTexture: GPUTexture;
    gNormalTextureView: GPUTextureView;
    gAlbedoTexture: GPUTexture;
    gAlbedoTextureView: GPUTextureView;

    depthTexture: GPUTexture;
    depthTextureView: GPUTextureView;


    // Fullscreen pass
    fullscreenSceneBindGroupLayout: GPUBindGroupLayout;
    fullscreenSceneBindGroup: GPUBindGroup;
    gBufferTexturesBindGroupLayout: GPUBindGroupLayout;
    gBufferTexturesBindGroup: GPUBindGroup;
    fullscreenPipeline: GPURenderPipeline;

    constructor(stage: Stage) {
        super(stage);

        const size = [renderer.canvas.width, renderer.canvas.height];
        const usage = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING;

        this.gPositionTexture = renderer.device.createTexture(
            {
                label: "g-position",
                size,
                format: "rgba32float",
                usage: usage
            }
        );
        this.gPositionTextureView = this.gPositionTexture.createView();

        this.gNormalTexture = renderer.device.createTexture(
            {
                label: "g-normal",
                size,
                format: "rgba16float",
                usage: usage
            }
        );
        this.gNormalTextureView = this.gNormalTexture.createView();

        this.gAlbedoTexture = renderer.device.createTexture(
            {
                label: "g-albedo",
                size,
                format: "rgba8unorm",
                usage: usage
            }
        );
        this.gAlbedoTextureView = this.gAlbedoTexture.createView();

        this.depthTexture = renderer.device.createTexture(
            {
                label: "deferred depth",
                size,
                format: "depth24plus",
                usage: GPUTextureUsage.RENDER_ATTACHMENT
            }
        );
        this.depthTextureView = this.depthTexture.createView();

        // G buffer pass
        this.gBufferSceneBindGroupLayout = renderer.device.createBindGroupLayout(
            {
                label: "g-buffer scene bind group layout",
                entries: [
                    { // camera
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX,
                        buffer: { type: "uniform" }
                    }
                ]
            }
        );

        this.gBufferSceneBindGroup = renderer.device.createBindGroup(
            {
                label: "g-buffer scene bind group",
                layout: this.gBufferSceneBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: this.camera.uniformsBuffer
                        }
                    }
                ]
            }
        );

        this.gBufferPipeline = renderer.device.createRenderPipeline(
            {
                label: "g-buffer pipeline",
                layout: renderer.device.createPipelineLayout(
                    {
                        label: "g-buffer pipeline layout",
                        bindGroupLayouts: [
                            this.gBufferSceneBindGroupLayout,
                            renderer.modelBindGroupLayout,
                            renderer.materialBindGroupLayout
                        ]
                    }
                ), 
                depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: "less",
                    format: "depth24plus"
                }, 
                vertex: {
                    module: renderer.device.createShaderModule(
                        {
                            label: "naive vert shader (g-buffer)",
                            code: shaders.naiveVertSrc
                        }
                    ), 
                    buffers: [
                        renderer.vertexBufferLayout
                    ]
                }, 
                fragment: {
                    module: renderer.device.createShaderModule(
                        {
                            label: "g-buffer frag shader",
                            code: shaders.clusteredDeferredFragSrc
                        }
                    ), 
                    targets: [
                        { format: "rgba32float" },
                        { format: "rgba16float" },
                        { format: "rgba8unorm" }
                    ]
                }
            }
        );

        // fullscreen pass
        this.fullscreenSceneBindGroupLayout = renderer.device.createBindGroupLayout(
            {
                label: "fullscreen scene bind group layout",
                entries: [
                    { // camera
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: "uniform" }
                    },
                    { // light set
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: "read-only-storage" }
                    },
                    { // cluster set
                        binding: 2,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: "read-only-storage" }
                    }
                ]
            }
        )

        this.fullscreenSceneBindGroup = renderer.device.createBindGroup(
            {
                label: "fullscreen scene bind group",
                layout: this.fullscreenSceneBindGroupLayout,
                entries: [
                    { // position
                        binding: 0,
                        resource: {
                            buffer: this.camera.uniformsBuffer
                        }
                    },
                    { // normal
                        binding: 1,
                        resource: {
                            buffer: this.lights.lightSetStorageBuffer
                        }
                    },
                    { // albedo
                        binding: 2,
                        resource: {
                            buffer: this.lights.clusterSetStorageBuffer
                        }
                    }
                ]
            }
        );

        this.gBufferTexturesBindGroupLayout = renderer.device.createBindGroupLayout(
            {
                label: "g-buffer textures bind group layout",
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        texture: { sampleType: "unfilterable-float" }
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT,
                        texture: { sampleType: "unfilterable-float" }
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.FRAGMENT,
                        texture: { sampleType: "unfilterable-float" }
                    }
                ]
            }
        );

        this.gBufferTexturesBindGroup = renderer.device.createBindGroup(
            {
                label: "g-buffer textures bind group",
                layout: this.gBufferTexturesBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: this.gPositionTextureView
                    }, 
                    {
                        binding: 1,
                        resource: this.gNormalTextureView
                    },
                    {
                        binding: 2,
                        resource: this.gAlbedoTextureView
                    }
                ]
            }
        );

        this.fullscreenPipeline = renderer.device.createRenderPipeline(
            {
                label: "fullscreen pipeline",
                layout: renderer.device.createPipelineLayout(
                    {
                        label: "fullscreen pipeline layout",
                        bindGroupLayouts: [
                            this.fullscreenSceneBindGroupLayout,
                            this.gBufferTexturesBindGroupLayout
                        ]
                    }
                ), 
                vertex: {
                    module: renderer.device.createShaderModule(
                        {
                            label: "fullscreen vert shader",
                            code: shaders.clusteredDeferredFullscreenVertSrc
                        }
                    )
                },
                fragment: {
                    module: renderer.device.createShaderModule(
                        {
                            label: "fullscreen frag shader",
                            code: shaders.clusteredDeferredFullscreenFragSrc
                        }
                    ), 
                    targets: [
                        { format: renderer.canvasFormat }
                    ]
                }
            }
        );
    }

    override draw() {
        // 3: run the Forward+ rendering pass:
        // - run the clustering compute shader
        // - run the G-buffer pass, outputting position, albedo, and normals
        // - run the fullscreen pass, which reads from the G-buffer and performs lighting calculations

        const encoder = renderer.device.createCommandEncoder();

        // first clustering pass (recall forward+)
        this.lights.doLightClustering(encoder);

        // G-buffer pass
        const gPass = encoder.beginRenderPass(
            {
                label: "g-buffer pass",
                colorAttachments: [
                    {
                        view: this.gPositionTextureView,
                        clearValue: [0, 0, 0, 0],
                        loadOp: "clear",
                        storeOp: "store"
                    }, 
                    {
                        view: this.gNormalTextureView,
                        clearValue: [0, 0, 0, 0],
                        loadOp: "clear",
                        storeOp: "store"
                    },
                    {
                        view: this.gAlbedoTextureView,
                        clearValue: [0, 0, 0, 0],
                        loadOp: "clear",
                        storeOp: "store"
                    }
                ], 
                depthStencilAttachment: {
                    view: this.depthTextureView,
                    depthClearValue: 1.0,
                    depthLoadOp: "clear",
                    depthStoreOp: "store"
                }
            }
        );

        gPass.setPipeline(this.gBufferPipeline);
        gPass.setBindGroup(shaders.constants.bindGroup_scene, this.gBufferSceneBindGroup);

        this.scene.iterate(node => {
            gPass.setBindGroup(shaders.constants.bindGroup_model, node.modelBindGroup);
        }, material => {
            gPass.setBindGroup(shaders.constants.bindGroup_material, material.materialBindGroup);
        }, primitive => {
            gPass.setVertexBuffer(0, primitive.vertexBuffer);
            gPass.setIndexBuffer(primitive.indexBuffer, 'uint32');
            gPass.drawIndexed(primitive.numIndices);
        });

        gPass.end();

        // final pass (fullscreen lighting)
        const canvasTextureView = renderer.context.getCurrentTexture().createView();
        const fsPass = encoder.beginRenderPass(
            {
                label: "fullscreen pass",
                colorAttachments: [
                    {
                        view: canvasTextureView,
                        clearValue: [0, 0, 0, 0],
                        loadOp: "clear",
                        storeOp: "store"
                    }
                ]
            }
        );

        fsPass.setPipeline(this.fullscreenPipeline);
        fsPass.setBindGroup(0, this.fullscreenSceneBindGroup);
        fsPass.setBindGroup(1, this.gBufferTexturesBindGroup);
        
        fsPass.draw(3);
        fsPass.end();

        renderer.device.queue.submit([encoder.finish()]);
    }
}
