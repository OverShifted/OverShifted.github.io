// This file is distributed under GNU GPL 3.0 or later
"use strict";

// Load saved theme
{
    let savedTheme = localStorage.getItem('theme') || 'auto'
    if (!['auto', 'dark', 'light'].includes(savedTheme))
        savedTheme = 'auto'

    document.documentElement.setAttribute('data-theme', savedTheme)
}

window.addEventListener('load', () => {
    document.getElementById('theme-switcher').addEventListener('click', (e) => {
        let currentTheme = document.documentElement.getAttribute('data-theme') || 'auto'

        if (currentTheme === 'auto')
            if (window.matchMedia('(prefers-color-scheme: dark)').matches)
                currentTheme = 'dark'
            else
                currentTheme = 'light'
        
        let nextTheme = {
            'light': 'dark',
            'dark': 'light'
        }[currentTheme]

        document.documentElement.setAttribute('data-theme', nextTheme)
        localStorage.setItem('theme', nextTheme);
    })
})