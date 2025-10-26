To render a shape made of bezier curves (In a gpu friendly way, and allows for many shapes on top of each other)

Don't use this one. It almost definitely sucks. Use the gem one please
### Vertex/compute shader
1. For a cubic spline (pretty much a bezier curve), split the curve where the either the y direction or x direction equals zero. This can be done with the quadratic formula. Do this on a compute shader, so we can perform a blelloch scan and stream compation to prevent errors. We do this to make sure the curve is monotone.
2. Next, we create a bounding polygon around the curve (desmos [here](https://www.desmos.com/calculator/grz1su5ks1)).  Guess what: there are 2 cases, one returning 4 triangles, the other returning 2. So, we have to do this also on the compute shader, with more stream compaction. The poor lonely vertex shader.
3. The vertex shader will do what vertex shaders do best: transforming the 2d (possibly 3d) points into 4d for no good reason. It will also package all the information about the curve, triangles and closest t to the fragment shader and draw call.

### Draw call
Here, we split the work in 2. 
1. 

### Fragment shader
1. 


[Book](https://shi-yan.github.io/webgpuunleashed/)
[Gem](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-25-rendering-vector-art-gpu)