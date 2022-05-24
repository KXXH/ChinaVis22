<script setup>
import {ref} from "vue";
import MenuBar from "./components/MenuBar.vue";

</script>

<template>
  <div id="container">
    <header h="50px">
      <MenuBar w="1/1" class="border-b border-grey-400"/>
    </header>
  </div>


</template>


<style scoped>
#container{
  @apply flex h-100vh flex-col;
}


</style>