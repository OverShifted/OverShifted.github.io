// This file is distributed under GNU GPL 3.0 or later
"use strict";

const canvas = document.getElementById('backfire-canvas')
const ctx = canvas.getContext('2d')

// Settings
var maxParticleCount = 120
var canvasScale = 1
var effectEnabled = false

function drawCircle(centerX, centerY, radius, color) {
    ctx.beginPath()
    ctx.arc(centerX / canvasScale, centerY / canvasScale, radius / canvasScale, 0, 2 * Math.PI, false)
    ctx.fillStyle = color
    ctx.fill()
}

function setCanvasSize(width = window.innerWidth, height = window.innerHeight) {
    canvas.width = width / canvasScale
    canvas.height = height / canvasScale
}

const clearCanvas = () => ctx.clearRect(0, 0, canvas.width, canvas.height)

function interpolateColor(color1, color2, percent) {
    // Convert the hex colors to RGB values
    const r1 = parseInt(color1.substring(1, 3), 16)
    const g1 = parseInt(color1.substring(3, 5), 16)
    const b1 = parseInt(color1.substring(5, 7), 16)
  
    const r2 = parseInt(color2.substring(1, 3), 16)
    const g2 = parseInt(color2.substring(3, 5), 16)
    const b2 = parseInt(color2.substring(5, 7), 16)
  
    // Interpolate the RGB values
    const r = Math.round(r1 + (r2 - r1) * percent)
    const g = Math.round(g1 + (g2 - g1) * percent)
    const b = Math.round(b1 + (b2 - b1) * percent)
  
    // Convert the interpolated RGB values back to a hex color
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// Returns a random number between -r and +r
const random = (r) => (Math.random() - 0.5) * 2 * r
const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

setCanvasSize()

var [mouseX, mouseY] = [0, 0]
var mouseDown = false

window.addEventListener('mousemove', (e) => [mouseX, mouseY] = [e.x, e.y])
document.addEventListener('mouseleave', (e) => [mouseX, mouseY] = [undefined, undefined])
window.addEventListener('mousedown', (e) => [mouseX, mouseY, mouseDown] = [e.x, e.y, true])
window.addEventListener('mouseup', (e) => mouseDown = false)
window.addEventListener('resize', (e) => setCanvasSize())

function addParticle() {
    if (mouseX === undefined)
        return

    // Fire
    scene.push({
        x: mouseX + random(15),
        y: mouseY + random(15),
        velX: random(15),
        velY: -100 + random(15),

        r: 20 + random(10),
        velR: (-20 + random(5)) / 1.2, // Yep! another random value.

        timeAlive: 0,
        lifeTime: 1.2,

        getColor: function() { return this.color },
        color: interpolateColor('#ffa500', '#ffff00', Math.random()) + '50',
    })

    // Smoke
    scene.push({
        x: mouseX,
        y: mouseY - 10,
        velX: random(40),
        velY: -120 + random(30),

        r: 25 + random(10),
        velR: (-15 + random(5)) / 1.2, // Yep! another random value.

        timeAlive: 0,
        lifeTime: 1.2,

        getColor: function() {
            let lifeValue = this.timeAlive / this.lifeTime
            lifeValue = Math.max(lifeValue - 0.4, 0)
            let opacity = clamp(lifeValue * lifeValue * 100, 0, 40)
            return 'rgba(160,160,160,' + opacity.toString() + '%)'
        },
    })

    if (scene.length > maxParticleCount)
        scene.splice(0, scene.length - maxParticleCount)
}

var scene = []
var lastUpdateTime = new Date()
var lastParticleSpawnTime = new Date()

function update() {
    let currentTime = new Date()
    let deltaTime = (currentTime.getTime() - lastUpdateTime.getTime()) / 1000
    lastUpdateTime = currentTime

    let timeSinceLastParticlSpawnMs = currentTime.getTime() - lastParticleSpawnTime.getTime()
    if (/*mouseDown && */timeSinceLastParticlSpawnMs >= 20)
    {
        addParticle()
        lastParticleSpawnTime = currentTime
    }

    var i = scene.length
    while (i--) {
        let obj = scene[i]
        obj.timeAlive += deltaTime
        
        obj.r = Math.max(obj.r + obj.velR * deltaTime, 0)
        
        obj.x += obj.velX * deltaTime
        obj.y += obj.velY * deltaTime
        
        if (obj.y + obj.r <= 0 || obj.r <= 0.01)
            scene.splice(i, 1)
    }
}

function render() {
    if (!effectEnabled)
        return
    
    requestAnimationFrame(render)
    update()
    
    clearCanvas()
    scene.forEach(obj => {
        drawCircle(obj.x, obj.y, obj.r, obj.getColor())
    })
}

function updateEffectEnabled() {
    effectEnabled = effectToggle.checked

    if (effectEnabled)
        render()
    else {
        scene = []
        clearCanvas()
    }
}

var effectToggle = document.getElementById('backfire-toggle')
effectToggle.addEventListener('input', () => updateEffectEnabled())
updateEffectEnabled()

var pixelateToggle = document.getElementById('backfire-pixelate-toggle')
pixelateToggle.addEventListener('input', () => { 
    canvas.classList.toggle('pixelated', pixelateToggle.checked)
    canvasScale = pixelateToggle.checked ? 10 : 1
    setCanvasSize()
})

// var particleCountSlider = document.getElementById('backfire-max-particle-count')
// particleCountSlider.addEventListener('inter', () => maxParticleCount = particleCountSlider.value)
