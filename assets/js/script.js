// This file is distributed under GNU GPL 3.0 or later

window.addEventListener('load', () => {
    document.getElementById('theme-switcher').addEventListener('click', (e) => {
        // let currentTheme = document.documentElement.getAttribute('data-theme') || 'auto'

        // // auto, dark, light
        // let nextTheme = {
        //     'auto': 'dark',
        //     'dark': 'light',
        //     'light': 'auto'
        // }[currentTheme]

        // console.log(`${currentTheme} => ${nextTheme}`)

        // document.documentElement.setAttribute('data-theme', nextTheme)




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

        console.log(`${currentTheme} => ${nextTheme}`)

        document.documentElement.setAttribute('data-theme', nextTheme)
    })
})