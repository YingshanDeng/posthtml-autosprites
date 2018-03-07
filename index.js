const postcss = require('postcss')
const sprites = require('postcss-sprites')
const updateRule = require('postcss-sprites/lib/core').updateRule;
const fs = require('fs')
const path = require('path')

module.exports = (options) => {
  options = options || {}
  options.stylesheetPath = options.stylesheetPath || './'
  options.spritePath = options.spritePath || './'
  options.basePath = options.basePath || './'
  options.hooks = options.hooks || {
    onUpdateRule: (rule, token, image) => {
      // updateRule(rule, token, image)

      var ratio = image.ratio;
      var coords = image.coords;
      var spriteUrl = image.spriteUrl;
      var posX = coords.x / ratio;
      var posY = coords.y / ratio;
      rule.insertAfter(rule.last, postcss.decl({
        prop: 'background-image',
        value: 'url(/' + spriteUrl + ')'
      }))
      rule.insertAfter(rule.last, postcss.decl({
        prop: 'background-position',
        value: -1 * posX + 'px ' + -1 * posY + 'px'
      }))
      // This semicolon can not be omitted
      ;['width', 'height'].forEach((prop) => {
        rule.insertAfter(rule.last, postcss.decl({
          prop: prop,
          value: coords[prop] + 'px'
        }))
      })
    }
  }

  var wirteFile = function (filePath, content) {
    // 先创建目录
    const targetDir = path.dirname(filePath)
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    targetDir.split(sep).reduce((parentDir, childDir) => {
      const curDir = path.resolve(parentDir, childDir);
      if (!fs.existsSync(curDir)) {
        fs.mkdirSync(curDir);
      }
      return curDir;
    }, initDir);

    fs.writeFileSync(filePath, content, {
      encoding: 'utf8',
      flag: 'w'
    })
  }

  return tree => {
    let index = 0
    let styleCnt = ''
    let externalLinks = []
    let collectStyles = cnt => {
      if (cnt[0] != '\n') {
        cnt = '\n' + cnt
      }
      if (cnt[cnt.length-1] != '\n') {
        cnt += '\n'
      }
      styleCnt += `// ${index}${cnt}`
      return index++
    }

    // collect inline css style
    tree.match({}, (node) => {
      if (!node.tag || !node.attrs || node.attrs.style === undefined) {
        return node
      }
      node.attrs.style = collectStyles(`{${node.attrs.style}}`)
      return node
    })
    // collect internal css style
    tree.match({tag: 'style'}, node => {
      let _cnt = node.content.toString()
      node.content = collectStyles(_cnt)
      return node
    })
    // collect external css style
    tree.match({tag: 'link'}, node => {
      node.attrs.href && externalLinks.push(node.attrs.href)
      return node
    })
    for(let i = 0; i < externalLinks.length; i++) {
      let _srcPath = path.resolve(options.basePath, externalLinks[i])
      let _destPath = path.resolve(options.stylesheetPath, externalLinks[i])
      let _cnt = fs.readFileSync(_srcPath, 'utf8')
      let _index = collectStyles(_cnt)
      wirteFile(_destPath, _index)
    }
    //
    let autoSprite = postcss([ sprites(options) ])
      .process(styleCnt, {
        from: undefined, to: undefined // Set to `undefined` to prevent the warning
      })
      .then((result) => {
        let styles = result.css.split('// ')
        styles.shift()

        // distribute inline css style
        tree.match({}, node => {
          if (!node.tag || !node.attrs || node.attrs.style === undefined) {
            return node
          }
          let _index = node.attrs.style
          let _cnt = styles[_index].replace(`${_index}\n`, '')
          _cnt = _cnt.substring(1, _cnt.length-2) // remove `{` `}`
          node.attrs.style = _cnt
          return node
        })
        // distribute internal css style
        tree.match({tag: 'style'}, (node) => {
          node.content = styles[node.content].replace(`${node.content}\n`, '\n')
          return node
        })
        // distribute external css style
        for(let i = 0; i < externalLinks.length; i++) {
          let _filePath = path.resolve(options.stylesheetPath, externalLinks[i])
          let _index = fs.readFileSync(_filePath, 'utf8')
          let _cnt = styles[parseInt(_index)].replace(`${_index}\n`, '\n')
          wirteFile(_filePath, _cnt)
        }
      })

    return Promise.resolve(autoSprite).then(() => tree)
  }
}
