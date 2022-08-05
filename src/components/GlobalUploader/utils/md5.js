import SparkMD5 from 'spark-md5'

/**
 * 分段计算MD5
 * @param file {File}
 * @param options {Object} - onProgress | onSuccess | onError
 */
export function generateMD5(file, options = {}) {
  const fileReader = new FileReader()
  const time = new Date().getTime()
  const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
  const chunkSize = 10 * 1024 * 1000
  const chunks = Math.ceil(file.size / chunkSize)
  let currentChunk = 0
  const spark = new SparkMD5.ArrayBuffer()
  const loadNext = () => {
    let start = currentChunk * chunkSize
    let end = start + chunkSize >= file.size ? file.size : start + chunkSize

    fileReader.readAsArrayBuffer(blobSlice.call(file.file, start, end))
  }

  loadNext()

  fileReader.onload = (e) => {
    spark.append(e.target.result)

    if (currentChunk < chunks) {
      currentChunk++
      loadNext()
      if (options.onProgress && typeof options.onProgress == 'function') {
        options.onProgress(currentChunk, chunks)
      }
    } else {
      let md5 = spark.end()

      // md5计算完毕
      if (options.onSuccess && typeof options.onSuccess == 'function') {
        options.onSuccess(md5)
      }

      console.log(
        `MD5计算完毕：${file.name} \nMD5：${md5} \n分片：${chunks} 大小:${file.size} 用时：${
          new Date().getTime() - time
        } ms`
      )
    }
  }

  fileReader.onerror = function () {
    console.log('MD5计算失败')
    if (options.onError && typeof options.onError == 'function') {
      options.onError()
    }
  }
}
