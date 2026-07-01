<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';

const router = useRouter();
const auth = useAuthStore();
const ui = useUiStore();
const mode = ref('login');
const resetStep = ref('request');
const loading = ref(false);
const error = ref('');
const success = ref('');
const recoveryToken = ref('');
const recoveryExpiresAt = ref('');
const form = ref({ name: '', email: '', password: '', token: '', newPassword: '' });

const isRecoverMode = computed(() => mode.value === 'recover');

async function submit() {
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    if (mode.value === 'login') {
      await auth.login({ email: form.value.email, password: form.value.password });
      router.push({ name: 'dashboard' });
      return;
    }

    if (mode.value === 'register') {
      await auth.register(form.value);
      router.push({ name: 'dashboard' });
      return;
    }

    if (resetStep.value === 'request') {
      const result = await auth.requestPasswordReset(form.value.email);
      recoveryToken.value = result.recoveryToken || '';
      recoveryExpiresAt.value = result.expiresAt || '';
      success.value = result.message || 'Token generato';
      resetStep.value = 'confirm';
      return;
    }

    await auth.confirmPasswordReset({
      email: form.value.email,
      token: form.value.token,
      newPassword: form.value.newPassword
    });
    router.push({ name: 'dashboard' });
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function switchMode(nextMode) {
  mode.value = nextMode;
  error.value = '';
  success.value = '';
  recoveryToken.value = '';
  recoveryExpiresAt.value = '';
  resetStep.value = 'request';
  form.value = { name: '', email: '', password: '', token: '', newPassword: '' };
}
</script>

<template>
  <section class="auth-screen">
    <form class="card auth-card" @submit.prevent="submit">
      <img class="auth-logo" src="/logo.svg" alt="TravelCheck logo" />
      <h1>{{ ui.t('auth.title') }}</h1>
      <p v-if="mode === 'recover'">{{ ui.t('auth.recoverSubtitle') }}</p>
      <p v-else>{{ ui.t('auth.loginSubtitle') }}</p>

      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">{{ success }}</div>

      <div class="form-grid">
        <label v-if="mode === 'register'" class="field">
          <span>{{ ui.t('auth.name') }}</span>
          <input v-model="form.name" required autocomplete="name" />
        </label>
        <label class="field">
          <span>{{ ui.t('auth.email') }}</span>
          <input v-model="form.email" required autocomplete="email" type="email" />
        </label>
        <label v-if="mode !== 'recover'" class="field">
          <span>{{ ui.t('auth.password') }}</span>
          <input v-model="form.password" required autocomplete="current-password" minlength="8" type="password" />
        </label>

        <template v-if="mode === 'recover'">
          <div v-if="recoveryToken" class="token-box">
            <span>{{ ui.t('auth.token') }}</span>
            <strong>{{ recoveryToken }}</strong>
            <small v-if="recoveryExpiresAt">{{ ui.locale === 'en' ? 'Expires at' : 'Scade alle' }} {{ recoveryExpiresAt }}</small>
          </div>

          <label v-if="resetStep === 'confirm'" class="field">
            <span>{{ ui.t('auth.token') }}</span>
            <input v-model="form.token" required autocomplete="one-time-code" />
          </label>

          <label v-if="resetStep === 'confirm'" class="field">
            <span>{{ ui.t('auth.newPassword') }}</span>
            <input v-model="form.newPassword" required minlength="8" type="password" />
          </label>
        </template>

        <button class="button" type="submit" :disabled="loading">
          {{ loading ? '...' : mode === 'login' ? ui.t('auth.login') : mode === 'register' ? ui.t('auth.createAccount') : resetStep === 'request' ? ui.t('auth.generateToken') : ui.t('auth.updatePassword') }}
        </button>
        <button v-if="mode !== 'recover'" class="ghost-button" type="button" @click="switchMode(mode === 'login' ? 'register' : 'login')">
          {{ mode === 'login' ? ui.t('auth.createAnAccount') : ui.t('auth.haveAccount') }}
        </button>
        <button v-if="mode === 'login'" class="ghost-button" type="button" @click="switchMode('recover')">
          {{ ui.t('auth.recover') }}
        </button>
        <button v-if="mode === 'recover'" class="ghost-button" type="button" @click="switchMode('login')">
          {{ ui.t('auth.backLogin') }}
        </button>
      </div>
    </form>
  </section>
</template>
