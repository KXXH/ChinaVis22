<template>
    <div class="legend mt-2 mb-1">
        <square-fill text="[#7fc97f]" /> <span>Domain</span>
        <square-fill text="[#beaed4]" /> <span>IP</span>
        <square-fill text="[#fdc086]" /> <span>Cert</span>
        <square-fill text="[#ffff99]" /> <span>Whois_Name</span>
        <square-fill text="[#386cb0]" /> <span>Whois_Phone</span>
        <square-fill text="[#f0027f]" /> <span>Whois_Email</span>

    </div>     
    <div class="legend mb-2 mt-1">   
    <square-fill text="[#0000ff]" /> <span>0 Jump</span>
        <square-fill text="[#696aff]" /> <span>1 Jump</span>
        <square-fill text="[#b5b6fe]" /> <span>2 Jump</span>
        <square-fill text="[#eff1fd]" /> <span>3 Jump</span>
    </div>
</template>

<script setup>
import SquareFill from "~icons/akar-icons/square-fill"
</script>

<style scoped>
.legend{
    @apply grid gap-1 border mx-2 p-1 h-min;
    grid-template-columns: repeat(auto-fit, 25px minmax(100px, 1fr));
}

</style>