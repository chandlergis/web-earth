import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import earthVertexShader from './shaders/earth/vertex.glsl'
import earthFragmentShader from './shaders/earth/fragment.glsl'
import atmosphereVertexShader from './shaders/atmosphere/vertex.glsl'
import atmosphereFragmentShader from './shaders/atmosphere/fragment.glsl'

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const textureLoader = new THREE.TextureLoader()

/**
 * Earth
 */
const earthParameters = {}
earthParameters.atmosphereDayColor = '#00aaff'
earthParameters.atmosphereTwilightColor = '#ff6600'

gui
    .addColor(earthParameters, 'atmosphereDayColor')
    .onChange(() =>
    {
        earthMaterial.uniforms.uAtmosphereDayColor.value.set(earthParameters.atmosphereDayColor)
        atmosphereMaterial.uniforms.uAtmosphereDayColor.value.set(earthParameters.atmosphereDayColor)
    })

gui
    .addColor(earthParameters, 'atmosphereTwilightColor')
    .onChange(() =>
    {
        earthMaterial.uniforms.uAtmosphereTwilightColor.value.set(earthParameters.atmosphereTwilightColor)
        atmosphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(earthParameters.atmosphereTwilightColor)
    })

// Textures
const earthDayTexture = textureLoader.load('./earth/day.jpg')
earthDayTexture.colorSpace = THREE.SRGBColorSpace
earthDayTexture.anisotropy = 8

const earthNightTexture = textureLoader.load('./earth/night.jpg')
earthNightTexture.colorSpace = THREE.SRGBColorSpace
earthNightTexture.anisotropy = 8

const earthSpecularCloudsTexture = textureLoader.load('./earth/specularClouds.jpg')
earthSpecularCloudsTexture.anisotropy = 8

// Mesh
const earthGeometry = new THREE.SphereGeometry(2, 64, 64)
const earthMaterial = new THREE.ShaderMaterial({
    vertexShader: earthVertexShader,
    fragmentShader: earthFragmentShader,
    uniforms:
    {
        uDayTexture: new THREE.Uniform(earthDayTexture),
        uNightTexture: new THREE.Uniform(earthNightTexture),
        uSpecularCloudsTexture: new THREE.Uniform(earthSpecularCloudsTexture),
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
        uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
        uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor))
    }
})
const earth = new THREE.Mesh(earthGeometry, earthMaterial)
scene.add(earth)

// Atmosphere
const atmosphereMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms:
    {
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
        uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
        uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor))
    },
})

const atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial)
atmosphere.scale.set(1.04, 1.04, 1.04)
scene.add(atmosphere)

/**
 * Sun
 */
// Coordinates
const sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5)
const sunDirection = new THREE.Vector3()

// Update
const updateSun = () =>
{
    // Sun direction
    sunDirection.setFromSpherical(sunSpherical)

    // Uniforms
    earthMaterial.uniforms.uSunDirection.value.copy(sunDirection)
    atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection)
}
updateSun()

// Tweaks
gui
    .add(sunSpherical, 'phi')
    .min(0)
    .max(Math.PI)
    .onChange(updateSun)

gui
    .add(sunSpherical, 'theta')
    .min(- Math.PI)
    .max(Math.PI)
    .onChange(updateSun)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 12
camera.position.y = 5
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)
renderer.setClearColor('#000011')

const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    earth.rotation.y = elapsedTime * 0.1

    controls.update()

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()

/**
 * Time and Messages
 */
const timeElement = document.getElementById('time')
const addMessageButton = document.getElementById('addMessageButton')
const messageForm = document.getElementById('messageForm')
const messageInput = document.getElementById('messageInput')
const messagesContainer = document.getElementById('messages')
const toggleMessagesButton = document.getElementById('toggleMessagesButton')

const updateTime = () => {
    const now = new Date()
    timeElement.textContent = now.toLocaleTimeString()
}

setInterval(updateTime, 1000)

// 读取留言
const loadMessages = () => {
    const messages = JSON.parse(localStorage.getItem('messages')) || []
    messages.forEach(message => {
        const messageDiv = document.createElement('div')
        messageDiv.classList.add('message')

        const messageTime = document.createElement('div')
        messageTime.classList.add('message-time')
        messageTime.textContent = message.time

        const messageContent = document.createElement('div')
        messageContent.classList.add('message-content')
        messageContent.textContent = message.content

        const deleteButton = document.createElement('button')
        deleteButton.classList.add('delete-button')
        deleteButton.textContent = '✖'
        deleteButton.addEventListener('click', () => {
            deleteMessage(message)
            messageDiv.remove()
            checkToggleMessagesButton()
        })

        messageDiv.appendChild(messageTime)
        messageDiv.appendChild(messageContent)
        messageDiv.appendChild(deleteButton)
        messagesContainer.appendChild(messageDiv)
    })

    checkToggleMessagesButton()
}

// 保存留言
const saveMessage = (message) => {
    const messages = JSON.parse(localStorage.getItem('messages')) || []
    messages.push(message)
    localStorage.setItem('messages', JSON.stringify(messages))
}

// 删除留言
const deleteMessage = (messageToDelete) => {
    let messages = JSON.parse(localStorage.getItem('messages')) || []
    messages = messages.filter(message => message.time !== messageToDelete.time || message.content !== messageToDelete.content)
    localStorage.setItem('messages', JSON.stringify(messages))
}

// 检查是否显示折叠按钮
const checkToggleMessagesButton = () => {
    const messages = JSON.parse(localStorage.getItem('messages')) || []
    toggleMessagesButton.style.display = messages.length > 0 ? 'block' : 'none'
}

// 页面加载时读取留言
loadMessages()

document.getElementById('submitMessage').addEventListener('click', () => {
    const message = messageInput.value
    if (message) {
        const now = new Date()
        const messageObj = {
            time: now.toLocaleString(),
            content: message
        }

        const messageDiv = document.createElement('div')
        messageDiv.classList.add('message')

        const messageTime = document.createElement('div')
        messageTime.classList.add('message-time')
        messageTime.textContent = messageObj.time

        const messageContent = document.createElement('div')
        messageContent.classList.add('message-content')
        messageContent.textContent = messageObj.content

        const deleteButton = document.createElement('button')
        deleteButton.classList.add('delete-button')
        deleteButton.textContent = '✖'
        deleteButton.addEventListener('click', () => {
            deleteMessage(messageObj)
            messageDiv.remove()
            checkToggleMessagesButton()
        })

        messageDiv.appendChild(messageTime)
        messageDiv.appendChild(messageContent)
        messageDiv.appendChild(deleteButton)
        messagesContainer.appendChild(messageDiv)

        messageInput.value = ''
        messageForm.style.display = 'none'

        // 保存留言到 localStorage
        saveMessage(messageObj)

        // 检查是否显示折叠按钮
        checkToggleMessagesButton()
    }
})

let areMessagesCollapsed = false

toggleMessagesButton.addEventListener('click', () => {
    if (areMessagesCollapsed) {
        messagesContainer.style.display = 'block';
        toggleMessagesButton.textContent = '折叠所有留言';
    } else {
        messagesContainer.style.display = 'none';
        toggleMessagesButton.textContent = '展开所有留言';
    }
    areMessagesCollapsed = !areMessagesCollapsed;
})

// 初始隐藏折叠按钮
toggleMessagesButton.style.display = 'none'

addMessageButton.addEventListener('click', () => {
    messageForm.style.display = 'flex'
})