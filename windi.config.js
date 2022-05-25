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
                3: "3 3 0%"

            }
        }
    },
    variants: {
        scrollbar: ['rounded']
    },
    plugins: [
        require('@windicss/plugin-scrollbar'),
    ],
})