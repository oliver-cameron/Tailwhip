let canvas: HTMLCanvasElement = document.getElementById(
  "gcx",
) as HTMLCanvasElement;
var ctx = canvas.getContext("webgpu");
let device: GPUDevice;
const dpr = window.devicePixelRatio || 1;
canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
let shaders: string = `
struct vertexOutput {
    @builtin(position) position : vec4f,
    @location(0) fragColor : vec4f,
}
@vertex
fn vs_nothing(@location(0) pos: vec4f,
             @location(1) fragColor: vec4f) -> vertexOutput {
    var output: vertexOutput;
    output.position = pos;
    output.fragColor = fragColor;
    return output;
}

@fragment
fn fs_nothing(fragData: vertexOutput) -> @location(0) vec4f {
    return fragData.fragColor;
}
`;
const vertexData = new Float32Array([
  -1, 0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, -0.5, -0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
  1.0, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
]);
async function init() {
  if (!navigator.gpu) {
    console.error("WebGPU is not supported. Enable it in chrome://flags");
    return;
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error("Failed to get GPU adapter.");
    return;
  }
  device = await adapter.requestDevice();
  const shaderModule = device.createShaderModule({
    code: shaders,
  });
  for (const msg of (await shaderModule.getCompilationInfo()).messages) {
    console[msg.type === "error" ? "error" : "warn"](
      `WGSL ${msg.type}: ${msg.message} (line ${msg.lineNum})`,
    );
  }
  ctx.configure({
    device,
    format: "bgra8unorm",
  });
  const vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    vertexBuffer,
    0,
    vertexData.buffer,
    vertexData.byteOffset,
    vertexData.byteLength,
  );
  const vertexBuffers: GPUVertexBufferLayout[] = [
    {
      attributes: [
        {
          shaderLocation: 0,
          offset: 0,
          format: "float32x4",
        },
        {
          shaderLocation: 1,
          offset: 16,
          format: "float32x4",
        },
      ],
      arrayStride: 32,
      stepMode: "vertex",
    },
  ];
  const pipelineDescriptor: GPURenderPipelineDescriptor = {
    vertex: {
      module: shaderModule,
      entryPoint: "vs_nothing",
      buffers: vertexBuffers,
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_nothing",
      targets: [
        {
          format: "bgra8unorm",
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
    layout: "auto",
  };
  const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
  const commandEncoder = device.createCommandEncoder();
  const clearColour: GPUColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };
  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        clearValue: clearColour,
        loadOp: "clear",
        storeOp: "store",
        view: ctx.getCurrentTexture().createView(),
      },
    ],
  };
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(renderPipeline);
  passEncoder.setVertexBuffer(0, vertexBuffer);
  passEncoder.draw(3, 1, 0, 0);
  passEncoder.end();
  device.queue.submit([commandEncoder.finish()]);
}
init();
