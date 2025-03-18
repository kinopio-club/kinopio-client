import { colord, extend } from 'colord'
import namesPlugin from 'colord/plugins/names'
extend([namesPlugin])

// WebGL shaders
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute float a_size;
  
  uniform vec2 u_resolution;
  
  void main() {
    // Convert from pixel space to clip space
    // Fix scaling issues by properly normalizing coordinates
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    
    // Flip Y to match canvas coordinate system
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);
    
    // Make sure point size is properly scaled
    gl_PointSize = a_size;
  }
`

const fragmentShaderSource = `
  precision mediump float;
  
  uniform vec4 u_color;
  uniform float u_alpha;
  void main() {
    // Calculate distance from center of point (normalized coordinates)
    float distance = length(gl_PointCoord - vec2(0.5));
    
    // Create a sharp circle
    if (distance > 0.5) {
      discard; // Outside of circle
    }
    
    // Apply premultiplied alpha for CSS-like opacity
    vec4 color = u_color;
    color.a *= u_alpha;
    color.rgb *= color.a; // Premultiply RGB by alpha
    
    gl_FragColor = color;
  }
`

// Utility functions for circle opacity
const exponentialDecay = (iteration, rate) => {
  return Math.exp(-rate * iteration)
}

export default class WebGLRenderer {
  constructor () {
    this.canvas = null
    this.gl = null
    this.circleProgram = null
    this.positionBuffer = null
    this.sizeBuffer = null
    this.colorBuffer = null
    this.alphaBuffer = null
    this.resizeObserver = null

    // Default decay rates
    this.rateOfIterationDecay = 0.08 // higher is faster tail decay
    this.rateOfIterationDecaySlow = 0.03 // slower decay rate
  }

  initialize (canvasElement, options = {}) {
    this.canvas = canvasElement

    // Set decay rates if provided
    if (options.rateOfIterationDecay !== undefined) {
      this.rateOfIterationDecay = options.rateOfIterationDecay
    }
    if (options.rateOfIterationDecaySlow !== undefined) {
      this.rateOfIterationDecaySlow = options.rateOfIterationDecaySlow
    }

    // Get proper dimensions from the element
    const displayWidth = this.canvas.clientWidth
    const displayHeight = this.canvas.clientHeight

    // Set canvas size correctly (important for resolution)
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = displayWidth * dpr
    this.canvas.height = displayHeight * dpr

    // Try to get WebGL context with proper options
    this.gl = this.canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true, // Set to true for CSS-like opacity behavior
      antialias: true,
      preserveDrawingBuffer: true
    })

    if (!this.gl) {
      console.error('WebGL not supported')
      return false
    }

    // Create shader program
    const vertexShader = this._createShader(this.gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = this._createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource)
    this.circleProgram = this._createProgram(vertexShader, fragmentShader)

    // Create buffers
    this.positionBuffer = this.gl.createBuffer()
    this.sizeBuffer = this.gl.createBuffer()

    // Set up WebGL state
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.enable(this.gl.BLEND)

    // Set blend mode to match CSS opacity behavior
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)

    return true
  }

  dispose () {
    if (this.gl) {
      // Clean up WebGL resources
      this.gl.deleteProgram(this.circleProgram)
      this.gl.deleteBuffer(this.positionBuffer)
      this.gl.deleteBuffer(this.sizeBuffer)
      if (this.colorBuffer) this.gl.deleteBuffer(this.colorBuffer)
      if (this.alphaBuffer) this.gl.deleteBuffer(this.alphaBuffer)
    }
  }

  _createShader (type, source) {
    const shader = this.gl.createShader(type)
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader))
      this.gl.deleteShader(shader)
      return null
    }

    return shader
  }

  _createProgram (vertexShader, fragmentShader) {
    const program = this.gl.createProgram()
    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(program))
      return null
    }

    return program
  }

  clearCanvas () {
    if (this.gl) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    }
  }

  resizeCanvasToDisplaySize () {
    if (!this.canvas || !this.gl) return false

    // Get the browser's computed display size
    const displayWidth = this.canvas.clientWidth
    const displayHeight = this.canvas.clientHeight

    // Get device pixel ratio for high-DPI displays
    const dpr = window.devicePixelRatio || 1

    // Check if canvas is not the right size
    const needResize = this.canvas.width !== displayWidth * dpr ||
                       this.canvas.height !== displayHeight * dpr

    if (needResize) {
      // Set canvas size accounting for device pixel ratio
      this.canvas.width = displayWidth * dpr
      this.canvas.height = displayHeight * dpr

      // Update the viewport to match the new canvas size
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
      console.debug(`Canvas resized to ${this.canvas.width}x${this.canvas.height} (DPR: ${dpr})`)
    }

    return needResize
  }

  // Render circles using WebGL (batch rendering for performance)
  renderCircles (circles) {
    if (!circles || circles.length === 0) return

    // Make sure canvas size is up-to-date before rendering
    this.resizeCanvasToDisplaySize()

    // Use the program
    this.gl.useProgram(this.circleProgram)

    // Set the resolution uniform - IMPORTANT: use actual canvas size for correct scaling
    const resolutionUniformLocation = this.gl.getUniformLocation(this.circleProgram, 'u_resolution')
    this.gl.uniform2f(resolutionUniformLocation, this.canvas.width, this.canvas.height)

    // For each unique color, batch render circles
    const colorGroups = {}

    // Browser-specific adjustments
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
    const firefoxRadiusMultiplier = isFirefox ? 1.75 : 1 // Firefox needs larger circles

    circles.forEach(circle => {
      if (!circle.color) return

      // Calculate opacity based on iteration if it's not explicitly set
      let alpha
      if (circle.alpha !== undefined) {
        alpha = circle.alpha
      } else {
        // Apply decay based on iteration count
        const decayRate = circle.shouldDecaySlow
          ? this.rateOfIterationDecaySlow
          : this.rateOfIterationDecay
        alpha = exponentialDecay(circle.iteration || 0, decayRate)
      }

      // Skip circles with very low alpha
      if (alpha < 0.05) return

      // Group by color
      if (!colorGroups[circle.color]) {
        colorGroups[circle.color] = []
      }

      // Account for device pixel ratio when setting positions
      const dpr = window.devicePixelRatio || 1
      const adjustedRadius = (circle.radius || 20) * dpr * firefoxRadiusMultiplier

      colorGroups[circle.color].push({
        x: circle.x * dpr,
        y: circle.y * dpr,
        radius: adjustedRadius,
        alpha
      })
    })

    // For each color group, render all circles
    Object.entries(colorGroups).forEach(([color, circleGroup]) => {
      if (circleGroup.length === 0) return

      // Use colord to parse the color
      const { r, g, b } = colord(color).toRgb()

      // Normalize to 0-1 range for WebGL
      const normalizedRgb = { r: r / 255, g: g / 255, b: b / 255 }

      // Prepare position and size arrays
      const positions = []
      const sizes = []
      const alphas = []

      circleGroup.forEach(circle => {
        positions.push(circle.x, circle.y)
        sizes.push(circle.radius * 2) // Double the radius for diameter
        alphas.push(circle.alpha)
      })

      // Set the color uniform - fixed to ensure color is correctly applied
      const colorUniformLocation = this.gl.getUniformLocation(this.circleProgram, 'u_color')
      this.gl.uniform4f(colorUniformLocation, normalizedRgb.r, normalizedRgb.g, normalizedRgb.b, 1.0)

      // Set position attribute
      const positionAttributeLocation = this.gl.getAttribLocation(this.circleProgram, 'a_position')
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW)
      this.gl.enableVertexAttribArray(positionAttributeLocation)
      this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0)

      // Set size attribute
      const sizeAttributeLocation = this.gl.getAttribLocation(this.circleProgram, 'a_size')
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer)
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(sizes), this.gl.STATIC_DRAW)
      this.gl.enableVertexAttribArray(sizeAttributeLocation)
      this.gl.vertexAttribPointer(sizeAttributeLocation, 1, this.gl.FLOAT, false, 0, 0)

      // Draw each circle with its own alpha
      for (let i = 0; i < circleGroup.length; i++) {
        const alphaUniformLocation = this.gl.getUniformLocation(this.circleProgram, 'u_alpha')
        this.gl.uniform1f(alphaUniformLocation, alphas[i])
        this.gl.drawArrays(this.gl.POINTS, i, 1)
      }
    })
  }
}
