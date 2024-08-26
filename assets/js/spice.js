// This file is distributed under GNU GPL 3.0 or later
"use strict";

const canvas = document.getElementById('spice-canvas')
const ctx = canvas.getContext('2d')

const massiveModeStep = 150
const massiveMaxParticleCount = 1100
const normalMaxParticleCount = 120

const pixelateCanvasScale = 12
const normalCanvasScale = 1

// Settings
var maxParticleCount = normalMaxParticleCount
var canvasScale = normalCanvasScale
var spiceEnabled = false
var massiveMode = false

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

document.querySelector("body").addEventListener('mousemove', (e) => [mouseX, mouseY] = [e.x, e.y])
document.querySelector("body").addEventListener('mouseenter', (e) => [mouseX, mouseY] = [e.x, e.y])
document.querySelector("body").addEventListener('mouseleave', () => [mouseX, mouseY] = [undefined, undefined])
window.addEventListener('resize', () => setCanvasSize())

function addParticle(x = mouseX, y = mouseY, fireBaseR = 20) {
    if (x === undefined)
        return

    // Fire
    scene.push({
        x: x + (massiveMode ? 0 : random(15)),
        y: y + random(15),
        velX: random(15),
        velY: -100 + random(15),

        r: fireBaseR + random(10),
        velR: (-fireBaseR + random(5)) / (massiveMode ? 1.5 : 1.2), // Yep! another random value.

        timeAlive: 0,
        lifeTime: 1.2,

        getColor: function() { return this.color },
        color: interpolateColor('#ffa500', '#ffff00', Math.random()) + '50',
    })

    // Smoke
    scene.push({
        x: x,
        y: y - (massiveMode ? 20 : 0),
        velX: random(40),
        velY: -120 + random(30),

        r: 30 + random(5),
        velR: (-(massiveMode ? 20 : 15) + random(5)) / 1.2, // Yep! another random value.

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
    if (timeSinceLastParticlSpawnMs >= 20) {
        lastParticleSpawnTime = currentTime

        if (massiveMode)
            for (let i = 0; i < 10; i++)
                addParticle(Math.random() * window.innerWidth, window.innerHeight + 40, 30)
        else
            addParticle()
    }

    var i = scene.length
    while (i--) {
        let obj = scene[i]
        obj.timeAlive += deltaTime

        obj.r = Math.max(obj.r + obj.velR * deltaTime, 0)

        obj.x += obj.velX * deltaTime
        obj.y += obj.velY * deltaTime

        if (obj.y + obj.r <= 0 || obj.y + obj.r <= 0 || obj.x - obj.r >= window.innerWidth || obj.r <= 1)
            scene.splice(i, 1)
    }
}

function render() {
    if (!spiceEnabled)
        return

    requestAnimationFrame(render)
    update()

    clearCanvas()
    scene.forEach(obj => {
        drawCircle(obj.x, obj.y, obj.r, obj.getColor())
    })
}


function setInputCallbackAndCall(id, callback) {
    let element = document.getElementById(id)
    element.addEventListener('input', () => callback(element))
    callback(element)
}

var spiceParticleCount = document.getElementById('spice-particle-count')
function setParticleCountGUI() {
    spiceParticleCount.innerHTML = scene.length
}
setInterval(setParticleCountGUI, 200)

var spiceSettings = document.getElementById('spice-settings')
setInputCallbackAndCall('spice-toggle', (e) => {
    spiceEnabled = e.checked
    spiceSettings.classList.toggle('hidden', !spiceEnabled)

    if (spiceEnabled) {
        // Resetting the timer to prevent "big" updates after pauses
        lastUpdateTime = new Date()
        render()
    } else {
        scene = []
        clearCanvas()
    }

    setParticleCountGUI()
})

setInputCallbackAndCall('spice-pixelate-toggle', (e) => {
    canvas.classList.toggle('pixelated', e.checked)
    canvasScale = e.checked ? pixelateCanvasScale : normalCanvasScale
    setCanvasSize()
})

const pyroLaugh = new Audio('/assets/audio/laughlong01.mp3')
setInputCallbackAndCall('spice-massive-toggle', (e) => {
    massiveMode = e.checked
    maxParticleCount = massiveMode ? massiveMaxParticleCount : normalMaxParticleCount
    scene = []

    setParticleCountGUI()

    if (massiveMode) {
        pyroLaugh.currentTime = 0
        pyroLaugh.play()
    } else {
        pyroLaugh.pause()
    }
})

document.getElementById('spice-souce-code-link').addEventListener('mousedown', (e) => {
    e.target.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    if (e.button == 2)
        setTimeout(() => e.target.href = "/assets/js/spice.js", 500)
})

document.getElementById('spice-souce-code-link').addEventListener('mouseup', (e) => {
    setTimeout(() => e.target.href = "/assets/js/spice.js", 200)
})

// var particleCountSlider = document.getElementById('spice-max-particle-count')
// particleCountSlider.addEventListener('inter', () => maxParticleCount = particleCountSlider.value)
