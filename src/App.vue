<template>
  <div id="app">
    <div class="app-nav">
      <div class="app-nav-inner">
        <div class="app-nav-title">Vue Uploader Solutions Next</div>
        <el-menu
          class="app-nav-menu"
          mode="horizontal"
          active-text-color="#1989fa"
          :default-active="activeRoute"
          router
          :ellipsis="false"
        >
          <el-menu-item index="/home">上传页</el-menu-item>
          <el-menu-item index="/about">关于</el-menu-item>
        </el-menu>
      </div>
    </div>

    <div class="app-main">
      <div class="container">
        <router-view />
      </div>
    </div>

    <!-- 将上传组件全局注册 -->
    <GlobalUploader />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import GlobalUploader from '~/components/GlobalUploader/GlobalUploader.vue'

const activeRoute = ref('')
const route = useRoute()

watch(
  () => route.path,
  (path) => {
    activeRoute.value = path
  }
)
</script>

<style lang="scss">
#app {
  display: flex;
  flex-direction: column;

  .app-nav {
    background-color: #fff;

    .app-nav-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 1140px;
      margin: 0 auto;
    }

    .app-nav-title {
      color: #1989fa;
      font-weight: 600;
    }
  }

  .app-main {
    flex: 1;

    > .container {
      height: 100%;
    }
  }
}
</style>
