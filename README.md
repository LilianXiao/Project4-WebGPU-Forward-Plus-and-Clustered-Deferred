WebGL Forward+ and Clustered Deferred Shading
======================

**University of Pennsylvania, CIS 565: GPU Programming and Architecture, Project 4**

* Lilian Xiao
  * [LinkedIn](https://www.linkedin.com/in/lilian-xiao/), [personal website](https://lilianxiao.carrd.co/), [art website](https://lilianxvis.carrd.co/)
* Tested on: Windows 11, Intel(R) Core(TM) Ultra 9 185H (2.50 GHz), 16.0 GB RAM, NVIDIA GeForce RTX 4070 Laptop GPU (8 GB)
Intel(R) Arc(TM) Graphics (128 MB) (Personal Laptop)

## Live Demo

See the live Github page [here](https://lilianxiao.github.io/Project4-WebGPU-Forward-Plus-and-Clustered-Deferred/).

## Deferred Clustered Renderer Demo Video

https://github.com/user-attachments/assets/a0487931-3bd7-49ab-a0d1-9f09c3ff3879

## Toon Shader Post-Processing Demo Video

https://github.com/user-attachments/assets/e1c7062a-5f42-451f-a814-c599907563ec

## Exploring different rendering techniques with WebGPU

In this project, we explore three different techniques to render the famous Sponza scene, as well as some nice extra features and optimization steps.

### Overview

In naive rendering, every fragment must loop on every light in the scene.  For a simple scene, this is alright, but as the number of lights grow, using naive rendering becomes extremely slow and ineffective.  Additionally, when triangles overlap, each fragment is fully shaded before the depth test discards the covered ones, which is unnecessary work.  In short, naive rendering scales quite poorly with the complexity and size of the scene.

Forward+ rendering presents a clustering method by inserting a compute pass before rendering, where light is sorted into clusters.  Thus, each fragment will only have to loop over the lights in the closest valid cluster.  This is done by compartmentalizing the viewing frustum into a grid (in this implementation, a 16x9x24 size grid), where screen tiles are visible along the xy plane and depth is measured through distance along the z axis.  Sphere-to-box testing is conducted against each light to help create these clusters.

This is already a great improvement, scaling by roughly number of clusters times the number of lights, but this doesn't fix the formerly mentioned excess work being done to shade unnecessary fragments.

Deferred clustered rendering leverages the geometry buffer to "precompute"/prepare the position, normal, and albedo (base color) information for each fragment, which are pushed into this g-buffer.  The first pass is thus the g-buffer pass, which writes to these three respective textures.  Then, the second pass is a fullscreen shader, and this technique uses the same clustering method as with forward+.  Despite the depth of the scene, this technique guarantees that with the small overhead of writing to a couple of textures, overdraw will be removed from the equation.  Of course, the most desirable renderer depends on the scene.  It wouldn't be surprising to see the deferred clustered renderer actually being slower than forward+ for a scene with a trivial light count.

## General Performance

### Comparing Renderers

Using chrome developer performance tools, I took traces of each base renderer at 500 total light sources for the same scene.  Consider the following trace reports of the naive, forward+, and deferred clustered implementations respectively.

Naive renderer

<img width="637" height="481" alt="image" src="https://github.com/user-attachments/assets/6c372827-c794-4315-808a-1531d22b0719" />

Forward+ renderer

<img width="637" height="480" alt="image" src="https://github.com/user-attachments/assets/ca413d28-9dd1-4736-91cf-e8c63ba58c1d" />

Deferred clustered renderer

<img width="637" height="473" alt="image" src="https://github.com/user-attachments/assets/137af120-6d8c-4a6e-b7ce-48699f26150d" />

Visibly, the naive renderer struggled significantly.  The consistent red bars appear to indicate nearly every frame missing its "display deadline", and the display must keep old frames.

| Metric | Naive | Forward+ | Clustered Deferred |
|---|---|---|---|
| Recording length | 61.3 s | 60.4 s | 60.4 s |
| Scripting | 9.4 ms/s | 44.6 ms/s | 77.4 ms/s |
| Painting | 1.1 ms/s | 7.8 ms/s | 14.8 ms/s |
| Rendering | 0.5 ms/s | 3.6 ms/s | 7.6 ms/s |
| Main thread busy | ~1.6% | ~8% | ~14.5% |
| Frames track | Nearly all red | Red and yellow interspersed | Majority green |

Using the painting and rendering as a good approximate for the frame counter, the ratio of painting is roughly 14-7.4-1 and the ratio of rendering is roughly 15.5-7.4-1 (deferred, forward+, naive respectively).  We can observe how the naive renderer was roughly 4 FPS, with each frame taking approximately 250 ms of GPU time, which is extremely unideal.  The forward+ renderer is an improvement, but is still visibly affected by overdraws and shading an unnecessary amount of fragments.  The deferred renderer was most consistent and verified the effectiveness of clustering in fixing the light-scaling issue and single shading pass per visible pixel.

## Additional Features

### G-Buffer Optimization

Currently, the g-buffer stores 72 bytes of data per pixel, distributed as: position (16 bytes), normals (8 bytes), and albedo (4 bytes), with additional padding.  A useful optimization would then be to reduce a lot of this unnecessary space.  The optimization goal is to fit everything into one rg32uint texture, which will be 8 bytes per pixel.

### Credits

- [Vite](https://vitejs.dev/)
- [loaders.gl](https://loaders.gl/)
- [dat.GUI](https://github.com/dataarts/dat.gui)
- [stats.js](https://github.com/mrdoob/stats.js)
- [wgpu-matrix](https://github.com/greggman/wgpu-matrix)
