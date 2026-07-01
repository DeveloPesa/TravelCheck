<script setup>
import { computed, onMounted, watchEffect } from 'vue';
import { Plane, BarChart3, LogOut } from '@lucide/vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useUiStore } from './stores/ui';

const router = useRouter();
const auth = useAuthStore();
const ui = useUiStore();

const isDark = computed(() => ui.theme === 'dark');

function logout() {
  auth.logout();
  router.push({ name: 'login' });
}

function syncDocumentTheme() {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = ui.theme;
  document.documentElement.lang = ui.locale;
}

onMounted(syncDocumentTheme);

watchEffect(syncDocumentTheme);
</script>

<template>
  <div class="app-shell" :data-theme="ui.theme">
    <aside v-if="auth.isAuthenticated" class="sidebar">
      <RouterLink class="brand" :to="{ name: 'dashboard' }">
        <img class="brand-logo" src="/logo.svg" alt="TravelCheck logo" />
        <span>{{ ui.t('app.title') }}</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink :to="{ name: 'dashboard' }">
          <Plane :size="18" />
          {{ ui.t('nav.trips') }}
        </RouterLink>
        <RouterLink :to="{ name: 'stats' }">
          <BarChart3 :size="18" />
          {{ ui.t('nav.stats') }}
        </RouterLink>
      </nav>

      <div class="sidebar-panel">
        <p class="sidebar-panel-title">{{ ui.t('common.theme') }}</p>
        <div class="switch-row">
          <button class="toggle-chip" :class="{ 'is-active': isDark }" type="button" @click="ui.setTheme('dark')">{{ ui.t('theme.dark') }}</button>
          <button class="toggle-chip" :class="{ 'is-active': !isDark }" type="button" @click="ui.setTheme('light')">{{ ui.t('theme.light') }}</button>
        </div>
      </div>

      <div class="sidebar-panel">
        <p class="sidebar-panel-title">{{ ui.t('common.language') }}</p>
        <div class="switch-row">
          <button class="toggle-chip" :class="{ 'is-active': ui.locale === 'it' }" type="button" @click="ui.setLocale('it')">{{ ui.t('language.it') }}</button>
          <button class="toggle-chip" :class="{ 'is-active': ui.locale === 'en' }" type="button" @click="ui.setLocale('en')">{{ ui.t('language.en') }}</button>
        </div>
      </div>

      <button class="ghost-button sidebar-logout" type="button" @click="logout">
        <LogOut :size="18" />
        {{ ui.t('nav.logout') }}
      </button>
    </aside>

    <main class="main-panel">
      <RouterView />
    </main>
  </div>
</template>
