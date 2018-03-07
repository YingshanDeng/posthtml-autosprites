const posthtml = require('posthtml')
const autoSprite = require('../index.js')
const fs = require('fs')
const path = require('path')

const options = {
  stylesheetPath: './expects',
  spritePath: './expects/images',
  basePath: './fixtures'
}

posthtml([ autoSprite(options) ])
  .process(fs.readFileSync('./fixtures/index.html', 'utf8'))
  .then((res) => fs.writeFileSync('./expects/index.html', res.html, 'utf8'))
