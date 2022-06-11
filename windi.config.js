import { defineConfig } from 'windicss/helpers'
import colors from 'windicss/colors'


export default defineConfig({
    attributify: true,
    theme:{
        extend:{
            colors:{
                main:colors.blue
            },
            flex:{
                2: "2 2 0%",
                3: "3 3 0%",
                4: "4 4 0%",
                5: "5 5 0%",
                6: "6 6 0%",

            },
            transitionProperty: {
                height: 'height',
                width: 'width'
            },
        }
    },
    variants: {
        scrollbar: ['rounded']
    },
    plugins: [
        require('@windicss/plugin-scrollbar'),
    ],
})