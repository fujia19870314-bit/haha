const fs = require('fs')
const path = require('path')
const babel = require('@babel/core')

function transformFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8')
  const result = babel.transformSync(code, {
    presets: [['@babel/preset-env', { targets: { ie: '11' } }]],
    filename: filePath,
    compact: false
  })
  fs.writeFileSync(filePath, result.code)
}

function walkDir(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      walkDir(fullPath)
    } else if (file.endsWith('.js')) {
      transformFile(fullPath)
    }
  }
}

const distDir = path.join(__dirname, '../dist/build/mp-weixin')
if (!fs.existsSync(distDir)) {
  console.error('dist/build/mp-weixin not found')
  process.exit(1)
}

// 1. Transform all JS files to ES5
walkDir(distDir)
console.log('ES5 transform applied to all JS files')

// 2. Update project.config.json to set libVersion
const projectConfigPath = path.join(distDir, 'project.config.json')
if (fs.existsSync(projectConfigPath)) {
  const config = JSON.parse(fs.readFileSync(projectConfigPath, 'utf-8'))
  config.libVersion = '2.30.0'
  config.setting = config.setting || {}
  config.setting.enhance = true
  config.setting.minified = true
  fs.writeFileSync(projectConfigPath, JSON.stringify(config, null, 2))
  console.log('Updated project.config.json with libVersion 2.30.0')
}

console.log('Post-build fix complete')
