WebGL Forward+ and Clustered Deferred Shading
======================

**University of Pennsylvania, CIS 565: GPU Programming and Architecture, Project 4**

* Lilian Xiao
  * [LinkedIn](https://www.linkedin.com/in/lilian-xiao/), [personal website](https://lilianxiao.carrd.co/), [art website](https://lilianxvis.carrd.co/)
* Tested on: Windows 11, Intel(R) Core(TM) Ultra 9 185H (2.50 GHz), 16.0 GB RAM, NVIDIA GeForce RTX 4070 Laptop GPU (8 GB)
Intel(R) Arc(TM) Graphics (128 MB) (Personal Laptop)

### Live Demo

See the live Github page [here](https://lilianxiao.github.io/Project4-WebGPU-Forward-Plus-and-Clustered-Deferred/).

### Demo Video/GIF

[![](img/video.mp4)](TODO)

## Exploring different rendering techniques with WebGPU

In this project, we explore three different techniques to render the famous Sponza scene, as well as some nice extra features and optimization steps.

### Overview

In naive rendering, every fragment must loop on every light in the scene.  For a simple scene, this is alright, but as the number of lights grow, using naive rendering becomes extremely slow and ineffective.  Additionally, when triangles overlap, each fragment is fully shaded before the depth test discards the covered ones, which is unnecessary work.  In short, naive rendering scales quite poorly with the complexity and size of the scene.

Forward+ rendering presents a clustering method by inserting a compute pass before rendering, where light is sorted into clusters.  Thus, each fragment will only have to loop over the lights in the closest valid cluster.  This is done by compartmentalizing the viewing frustum into a grid (in this implementation, a 16x9x24 size grid), where screen tiles are visible along the xy plane and depth is measured through distance along the z axis.  Sphere-to-box testing is conducted against each light to help create these clusters.

This is already a great improvement, scaling by roughly number of clusters times the number of lights, but this doesn't fix the formerly mentioned excess work being done to shade unnecessary fragments.

Deferred clustered rendering leverages the geometry buffer to "precompute"/prepare the position, normal, and albedo (base color) information for each fragment, which are pushed into this g-buffer.  The first pass is thus the g-buffer pass, which writes to these three respective textures.  Then, the second pass is a fullscreen shader, and this technique uses the same clustering method as with forward+.  Despite the depth of the scene, this technique guarantees that with the small overhead of writing to a couple of textures, overdraw will be removed from the equation.  Of course, the most desirable renderer depends on the scene.  It wouldn't be surprising to see the deferred clustered renderer actually being slower than forward+ for a scene with a trivial light count.

### Credits

- [Vite](https://vitejs.dev/)
- [loaders.gl](https://loaders.gl/)
- [dat.GUI](https://github.com/dataarts/dat.gui)
- [stats.js](https://github.com/mrdoob/stats.js)
- [wgpu-matrix](https://github.com/greggman/wgpu-matrix)
