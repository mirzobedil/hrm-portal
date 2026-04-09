<script setup>
/**
 * Стандартная панель над таблицей: слева поиск, справа — слот filters (селекты и т.д.).
 * Использование: поместить внутрь .card с padding: 0, перед <table>.
 */
defineProps({
  /** Для region / a11y */
  ariaLabel: { type: String, default: 'Фильтры таблицы' },
})
</script>

<template>
  <div class="ui-table-toolbar" role="search" :aria-label="ariaLabel">
    <div v-if="$slots.search" class="ui-table-toolbar__search">
      <slot name="search" />
    </div>
    <div v-if="$slots.filters" class="ui-table-toolbar__filters">
      <slot name="filters" />
    </div>
  </div>
</template>

<style scoped>
.ui-table-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}
.ui-table-toolbar__search {
  width: 280px;
  max-width: min(100%, 320px);
  flex: 0 0 auto;
  min-width: 0;
}
.ui-table-toolbar__search :deep(.ui-search-field) {
  width: 100%;
  max-width: 100%;
}
.ui-table-toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}
@media (max-width: 640px) {
  .ui-table-toolbar__search {
    width: 100%;
    max-width: 100%;
  }
  .ui-table-toolbar__filters {
    margin-left: 0;
    width: 100%;
  }
}
</style>
