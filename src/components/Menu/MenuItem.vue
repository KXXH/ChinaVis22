<script lang="jsx">
import { NDropdown } from 'naive-ui';
export default {
    props: {
        dropdown: {
            type: Boolean,
            default: false
        },
        dropdownOption: Object
    },
    setup(props,{ slots }){
        const trigger = ()=>(
            <div 
                class="inline-block rounded transition duration-200 select-none flex items-center"
                bg="hover:main-300" px="2" py="1"
                text="white"
            >
                <div>
                    {slots.default()}    
                </div>
            </div>
        );

        const render = props.dropdown?()=>(
            <NDropdown trigger="hover" options={props.dropdownOption} size="medium" placement="bottom-start">
                {trigger()}
            </NDropdown>
        ):trigger

        return render;
    }
}
</script>