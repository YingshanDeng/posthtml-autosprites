# posthtml-autosprites
**Auto generate sprites from the html file, it will parse the inline/internal/external css styles to generate the sprites and auto insert the related css rule**

- posthtml-autosprite is based on the [postcss-sprites](https://github.com/2createStudio/postcss-sprites)
- posthtml-autosprite is only support the image using **absolute path** which is better and simpler than relative path

## Usage Demo
go to the `test` folder and run `node test.js`

```
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
```

## LICENSE
MIT