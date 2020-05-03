# vue-cli-plugin-auto-import-tags
Auto import vue components by tags.  
It must be used along with [babel-plugin-transform-imports](https://github.com/viruscamp/babel-plugin-transform-imports/tree/babel-7) or [babel-plugin-import](https://github.com/ant-design/babel-plugin-import).

This lib is in alpha stage.  
USE ON YOUR OWN RISK. WITHOUT ANY EXPRESS OR IMPLIED WARRANTIES.

Currently, you cannot use it with babel-plugin-import, due to some bugs (maybe related to babel-plugin-import).  
Use it with my fork of babel-plugin-transform-imports.

## Usage with vue-cli-3.x
0. Prerequirements  Your project must have these as devDependencies:
```json
  "@vue/cli-service": "^3.0.0",
  "babel-plugin-transform-imports": "github:viruscamp/babel-plugin-transform-imports#babel-7",
  // or
  "babel-plugin-import": "^1.0.0", // not usable currently
```

1. Install  
```npm install github:viruscamp/vue-cli-plugin-auto-import-tags --save-dev```

2. Configurate  
Just add "tagPrefix" to your existing babel-plugin-import/babel-plugin-transform-imports options in .babelrc or babel.config.js .  
To work with babel-plugin-transform-imports's regular expressions library match, you must add "libraryName" to it.
```javascript
// babel.config.js
module.exports = {
  presets: [
    '@vue/app'
  ],
  "plugins": [
    [
      "transform-imports", {
        "ant-design-vue": {
          tagPrefix: "a", // added for babel-plugin-transform-imports
          memberConverter: 'kebab',
          transform: "ant-design-vue/lib/${member}",
          transformStyle: "ant-design-vue/lib/${member}/style/css",
          preventFullImport: true
        },
        "my-library\/?(((\\w*)?\/?)*)": {
          tagPrefix: "my", // added for babel-plugin-transform-imports
          libraryName: "my-library", // added for babel-plugin-transform-imports's regular expressions library match
          memberConverter: 'kebab',
          transform: "my-library/${1}/${member}",
          transformStyle: "my-library/${1}/${member}/style",
          preventFullImport: true
        }
      }
    ],
    [
      "import", {
        tagPrefix: "a", // added for babel-plugin-import
        libraryName: "ant-design-vue",
        libraryDirectory: "es",
        style: "css"
      }
    ]
  ]
}
```
Currently the plugin does not support parallel build, so you must turn it off.
```javascript
// vue.config.js
module.exports = {
  parallel: false,
}
```

3. Code  
Instead of writing:  
```vue
<template>
  <div>
    <AButton />
    <a-auto-complete />
  </div>
</template>
<script>
import { Button, AutoComplete } from 'ant-design-vue'
export default {
  components: {
    AButton: Button,
    AAutoComplete: AutoComplete
  }
}
</script>
```
You can now write:  
```vue
<template>
  <div>
    <AButton />
    <a-auto-complete />
  </div>
</template>
```
Because it will generate a vue custom block , below is result code:  
```javascript
import { Button as AButton } from 'ant-design-vue'
import { AutoComplete as AAutoComplete } from 'ant-design-vue'

export default function (Component) {
  let c = Component.options.components
  if (c == null) c = Component.options.components = {}
  if (c.AButton == null) c.AButton = AButton
  if (c.AAutoComplete == null) c.AAutoComplete = AAutoComplete
}
```

## Usage with manual mantained webpack.conf
TODO

## Limitations
1. Only works for *.vue file \<template\> part
2. Invalid for directive 'is', like \<div is="staticComponent" /\> or \<div :is="dynamicComponent" /\>
3. Invalid for string template
4. Invalid for render function and JSX
5. Does not support parallel build
6. It runs vue-template-compiler twice for one template part of a vue file

## Internals
We generate the source like below, then feed it to babel-loader, pass to vue-loader as vue custom block output.  
In babel, babel-plugin-transform-imports or babel-plugin-import will do the rest.
```javascript
import { DatePicker as ADatePicker } from 'ant-design-vue'
import { AutoComplete as AAutoComplete } from 'ant-design-vue'

export default function (Component) {
  let c = Component.options.components
  if (c == null) c = Component.options.components = {}
  if (c.ADatePicker == null) c.ADatePicker = ADatePicker
  if (c.AAutoComplete == null) c.AAutoComplete = AAutoComplete
}
```

## Fatal bugs:
1. Just use vue-cli-3.x, babel-plugin-import, and ant-design-vue, without this plugin.  
```javascript
import {Breadcrumb as ABreadcrumb} from 'ant-design-vue'
```
It tries to import ant-design-vue/es/a-breadcrumb

