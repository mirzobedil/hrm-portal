<script setup>
defineProps({
  /** Заголовок блока, напр. «Процесс утверждения» */
  title: { type: String, default: '' },
})
</script>

<template>
  <section class="activity-feed">
    <h3 v-if="title" class="activity-feed__title">{{ title }}</h3>
    <div class="activity-feed__list" role="list">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.activity-feed {
  min-width: 0;
}

.activity-feed__title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.activity-feed__list {
  display: flex;
  flex-direction: column;
}
</style>
