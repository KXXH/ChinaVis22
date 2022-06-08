<template>
    <div class="grid grid-cols-[min-content,1fr] gap-1 border rounded m-2 p-1 h-min">
        <square-fill text="[#7fc97f]" /> <span>Domain</span>
        <square-fill text="[#beaed4]" /> <span>IP</span>
        <square-fill text="[#fdc086]" /> <span>Cert</span>
        <square-fill text="[#ffff99]" /> <span>Whois_Name</span>
        <square-fill text="[#386cb0]" /> <span>Whois_Phone</span>
        <square-fill text="[#f0027f]" /> <span>Whois_Email</span>
    </div>
</template>

<script setup>
import SquareFill from "~icons/akar-icons/square-fill"
</script>