"use strict"

function sendMessageToGiscus(message) {
    const iframe = document.querySelector('iframe.giscus-frame')
    if (!iframe) return
    iframe.contentWindow.postMessage({ giscus: message }, 'https://giscus.app')
}

function resolveTheme(theme) {
    if (!['auto', 'dark', 'light'].includes(theme))
        theme = 'auto'

    if (theme === 'auto')
        if (window.matchMedia('(prefers-color-scheme: dark)').matches)
            theme = 'dark'
        else
            theme = 'light'

    return theme
}

function setTheme(theme, setLocalStorage = false) {
    document.documentElement.setAttribute('data-theme', theme)
    sendMessageToGiscus({ setConfig: { theme } })

    if (setLocalStorage) {
        localStorage.setItem('theme', theme)
    }
}

function setInitialTheme() {
    let savedTheme = resolveTheme(localStorage.getItem('theme') || 'auto')
    setTheme(savedTheme)
}

setInitialTheme()

document.addEventListener("DOMContentLoaded", (_event) => {
    document.getElementById('theme-switcher').addEventListener('click', (_e) => {
        let currentTheme = resolveTheme(document.documentElement.getAttribute('data-theme') || 'auto')

        let nextTheme = {
            'light': 'dark',
            'dark': 'light'
        }[currentTheme]

        setTheme(nextTheme, true)
    })
})

function handleMessage(event) {
    if (event.origin !== 'https://giscus.app') return
    if (!(typeof event.data === 'object' && event.data.giscus)) return

    // const giscusData = event.data.giscus
    setInitialTheme()

    window.removeEventListener('message', handleMessage)
}

window.addEventListener('message', handleMessage)
