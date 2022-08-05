<template>
  <div id="global-uploader" :class="{ 'global-uploader-single': !global }">
    <!-- 上传 -->
    <uploader
      ref="uploaderRef"
      class="uploader-app"
      :options="initOptions"
      :file-status-text="fileStatusText"
      :auto-start="false"
      @file-added="onFileAdded"
      @file-success="onFileSuccess"
      @file-progress="onFileProgress"
      @file-error="onFileError"
    >
      <uploader-unsupport></uploader-unsupport>

      <uploader-btn id="global-uploader-btn" ref="uploadBtnRef">选择文件</uploader-btn>

      <uploader-list v-show="panelShow">
        <template #default="{ fileList }">
          <div class="file-panel" :class="{ collapse: collapse }">
            <div class="file-title">
              <div class="title">文件列表</div>
              <div class="operate">
                <el-button :title="collapse ? '展开' : '折叠'" link @click="collapse = !collapse">
                  <Icon :icon="collapse ? 'ri:fullscreen-fill' : 'ri:subtract-fill'" width="18" />
                </el-button>
                <el-button title="关闭" link @click="close">
                  <Icon icon="ri:close-fill" width="20" />
                </el-button>
              </div>
            </div>

            <ul class="file-list">
              <li
                v-for="file in fileList"
                :key="file.id"
                class="file-item"
                :class="`file-${file.id}`"
              >
                <uploader-file
                  ref="files"
                  :class="'file_' + file.id"
                  :file="file"
                  :list="true"
                ></uploader-file>
              </li>
              <div v-if="!fileList.length" class="no-file">
                <Icon icon="ri:file-3-line" width="16" /> 暂无待上传文件
              </div>
            </ul>
          </div>
        </template>
      </uploader-list>
    </uploader>
  </div>
</template>

<script>
/**
 *  全局上传插件，两种调用方式
 *   1. 作为全局页面的组件，使用event bus
 *   调用方法：Bus.emit('openUploader', {params: {}, options: {}})
 *               params: 发送给服务器的额外参数；
 *               options：上传选项，目前支持 target、testChunks、mergeFn、accept
 *
 *   监听函数：Bus.on('fileAdded', fn); 文件选择后的回调
 *           Bus.on('fileSuccess', fn); 文件上传成功的回调，监听后记得释放
 *
 *   2. 作为普通组件在单个页面中调用，使用props
 */
import { ref, watch, computed, nextTick, onMounted } from 'vue'
import { mergeSimpleUpload } from '~/api'
import { generateMD5 } from './utils/md5'
import Bus from './utils/bus'

export default {
  name: 'GlobalUploader',
  props: {
    global: {
      type: Boolean,
      default: true
    },
    // 发送给服务器的额外参数
    params: {
      type: Object
    },
    options: {
      type: Object
    }
  },
  emits: ['fileAdded', 'fileSuccess'],

  setup(props, { emit }) {
    const initOptions = {
      target: 'http://localhost:3000/upload',
      chunkSize: '2048000',
      fileParameterName: 'file',
      maxChunkRetries: 3,
      // 是否开启服务器分片校验
      testChunks: true,
      // 服务器分片校验函数，秒传及断点续传基础
      checkChunkUploadedByResponse: function (chunk, message) {
        let skip = false

        try {
          let objMessage = JSON.parse(message)
          if (objMessage.skipUpload) {
            skip = true
          } else {
            skip = (objMessage.uploaded || []).indexOf(chunk.offset + 1) >= 0
          }
        } catch (e) {}

        return skip
      },
      query: (file, chunk) => {
        return {
          ...file.params
        }
      }
    }
    const fileStatusText = {
      success: '上传成功',
      error: '上传失败',
      uploading: '上传中',
      paused: '已暂停',
      waiting: '等待上传'
    }
    const panelShow = ref(false)
    const collapse = ref(false)
    const uploaderRef = ref()
    const uploadBtnRef = ref()
    let mergeFn = mergeSimpleUpload

    const uploader = computed(() => uploaderRef.value?.uploader)

    let customParams = {}
    watch(
      () => props.params,
      (data) => {
        if (data) {
          customParams = data
        }
      }
    )
    watch(
      () => props.options,
      (data) => {
        if (data) {
          setTimeout(() => {
            customizeOptions(data)
          }, 0)
        }
      }
    )

    // 自定义options
    function customizeOptions(opts) {
      // 自定义上传url
      if (opts.target) {
        uploader.value.opts.target = opts.target
      }
      // 是否可以秒传、断点续传
      if (opts.testChunks !== undefined) {
        uploader.value.opts.testChunks = opts.testChunks
      }
      // merge 的方法，类型为Function，返回Promise
      if (opts.mergeFn) {
        mergeFn = opts.mergeFn
      }
      // 自定义文件上传类型
      if (opts.accept) {
        let input = document.querySelector('#global-uploader-btn input')
        input.setAttribute(opts.accept, accept.join())
      }
    }
    async function onFileAdded(file) {
      panelShow.value = true
      trigger('fileAdded')
      // 将额外的参数赋值到每个文件上，以不同文件使用不同params的需求
      file.params = customParams.value
      // 计算MD5
      const md5 = await computeMD5(file)
      startUpload(file, md5)
    }
    function computeMD5(file) {
      // 文件状态设为"计算MD5"
      statusSet(file.id, 'md5')
      // 暂停文件
      file.pause()
      // 计算MD5时隐藏”开始“按钮
      nextTick(() => {
        document.querySelector(`.file-${file.id} .uploader-file-resume`).style.display = 'none'
      })
      // 开始计算MD5
      return new Promise((resolve, reject) => {
        generateMD5(file, {
          onProgress(currentChunk, chunks) {
            // 实时展示MD5的计算进度
            nextTick(() => {
              const md5ProgressText = '校验MD5 ' + ((currentChunk / chunks) * 100).toFixed(0) + '%'
              document.querySelector(`.custom-status-${file.id}`).innerText = md5ProgressText
            })
          },
          onSuccess(md5) {
            statusRemove(file.id)
            resolve(md5)
          },
          onError() {
            error(`文件${file.name}读取出错，请检查该文件`)
            file.cancel()
            statusRemove(file.id)
            reject()
          }
        })
      })
    }
    // md5计算完毕，开始上传
    function startUpload(file, md5) {
      file.uniqueIdentifier = md5
      file.resume()
    }
    function onFileSuccess(rootFile, file, response, chunk) {
      let res = JSON.parse(response)

      // 服务端自定义的错误（即http状态码为200，但是是错误的情况），这种错误是Uploader无法拦截的
      if (!res.result) {
        error(res.message)
        // 文件状态设为“失败”
        statusSet(file.id, 'failed')
        return
      }

      // 如果服务端返回了需要合并的参数
      if (res.needMerge) {
        // 文件状态设为“合并中”
        statusSet(file.id, 'merging')

        mergeFn({
          tempName: res.tempName,
          fileName: file.name,
          ...file.params
        })
          .then((res) => {
            // 文件合并成功
            trigger('fileSuccess')

            statusRemove(file.id)
          })
          .catch((e) => {})

        // 不需要合并
      } else {
        trigger('fileSuccess')
        console.log('上传成功')
      }
    }
    function onFileProgress(rootFile, file, chunk) {
      console.log(
        `上传中 ${file.name}，chunk：${chunk.startByte / 1024 / 1024} ~ ${
          chunk.endByte / 1024 / 1024
        }`
      )
    }
    function onFileError(rootFile, file, response, chunk) {
      error(response)
    }
    function close() {
      uploader.value.cancel()
      panelShow.value = false
    }
    /**
     * 新增的自定义的状态: 'md5'、'merging'、'transcoding'、'failed'
     * @param id
     * @param status
     */
    function statusSet(id, status) {
      const statusMap = {
        md5: {
          text: '校验MD5',
          bgc: '#fff'
        },
        merging: {
          text: '合并中',
          bgc: '#e2eeff'
        },
        transcoding: {
          text: '转码中',
          bgc: '#e2eeff'
        },
        failed: {
          text: '上传失败',
          bgc: '#e2eeff'
        }
      }

      nextTick(() => {
        const statusTag = document.createElement('p')
        statusTag.className = `custom-status-${id} custom-status`
        statusTag.innerText = statusMap[status].text
        statusTag.style.backgroundColor = statusMap[status].bgc

        const statusWrap = document.querySelector(`.file_${id} .uploader-file-status`)
        statusWrap.appendChild(statusTag)
      })
    }
    function statusRemove(id) {
      nextTick(() => {
        const statusTag = document.querySelector(`.custom-status-${id}`)
        statusTag.remove()
      })
    }
    function trigger(e) {
      Bus.emit(e)
      emit(e)
    }
    function error(msg) {
      ElNotification({
        title: '错误',
        message: msg,
        type: 'error',
        duration: 2000
      })
    }

    onMounted(() => {
      Bus.on('openUploader', ({ params = {}, options = {} }) => {
        customParams = params

        customizeOptions(options)

        if (uploadBtnRef.value) {
          uploadBtnRef.value.$el.click()
        }
      })
    })

    return {
      initOptions,
      fileStatusText,
      panelShow,
      collapse,
      uploaderRef,
      uploadBtnRef,
      onFileAdded,
      onFileSuccess,
      onFileProgress,
      onFileError,
      close
    }
  }
}
</script>

<style lang="scss">
#global-uploader {
  &:not(.global-uploader-single) {
    position: fixed;
    z-index: 20;
    right: 15px;
    bottom: 15px;
    box-sizing: border-box;
  }

  .uploader-app {
    width: 520px;
  }

  .file-panel {
    background-color: #fff;
    border: 1px solid #e2e2e2;
    border-radius: 7px 7px 0 0;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);

    .file-title {
      display: flex;
      height: 40px;
      line-height: 40px;
      padding: 0 15px;
      border-bottom: 1px solid #ddd;

      .operate {
        flex: 1;
        text-align: right;

        .el-button {
          --el-button-hover-link-text-color: #{$blue};

          + .el-button {
            margin-left: 8px;
          }
        }
      }
    }

    .file-list {
      position: relative;
      height: 240px;
      overflow-x: hidden;
      overflow-y: auto;
      background-color: #fff;
      transition: all 0.3s;

      .file-item {
        background-color: #fff;
      }
    }

    &.collapse {
      .file-title {
        background-color: #e7ecf2;
      }
      .file-list {
        height: 0;
      }
    }
  }

  .no-file {
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #999;

    svg {
      vertical-align: text-bottom;
    }
  }

  .uploader-file-icon {
    &:before {
      content: '' !important;
    }

    &[icon='image'] {
      background: url(./images/image-icon.png);
    }
    &[icon='audio'] {
      background: url(./images/audio-icon.png);
      background-size: contain;
    }
    &[icon='video'] {
      background: url(./images/video-icon.png);
    }
    &[icon='document'] {
      background: url(./images/text-icon.png);
    }
    &[icon='unknown'] {
      background: url(./images/zip.png) no-repeat center;
      background-size: contain;
    }
  }

  .uploader-file-actions > span {
    margin-right: 6px;
  }

  .custom-status {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
  }
}

/* 隐藏上传按钮 */
#global-uploader-btn {
  position: absolute;
  clip: rect(0, 0, 0, 0);
}

.global-uploader-single {
  #global-uploader-btn {
    position: relative;
  }
}
</style>
