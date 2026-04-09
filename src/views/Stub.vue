<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="stub">
    <p class="stub-text">{{ route.meta.title }} — в разработке</p>
  </div>
</template>

<style scoped>
.stub {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}
.stub-text {
  font-size: 14px;
  color: #bbb;
}
</style>
