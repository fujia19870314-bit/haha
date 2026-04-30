<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { isWeb } from './services/platform.js'
import { isLoggedIn } from './services/auth.js'

// Web 平台启动时检查登录状态
onLaunch(() => {
  if (isWeb() && !isLoggedIn()) {
    uni.navigateTo({ url: '/pages/login/index' })
  }
})
</script>

<style>
@import './styles/index.css';
</style>
