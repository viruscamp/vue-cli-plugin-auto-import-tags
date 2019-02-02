# vue-cli-plugin-auto-import-tag
Auto import vue components by tags using babel-plugin-import

## Usage with vue-cli-3.x
0. Prerequirements  
Your project must have these as devDependencies:  
"@vue/cli-service": "^3.0.0",  
"babel-plugin-import": "^1.0.0",

1. Install  
npm install github:viruscamp/vue-cli-plugin-auto-import-tag --save-dev

2. Configurate  
Just add "tagPrefix" to your existing babel-plugin-import options in .babelrc or babel.config.js:  
```json
{
  "tagPrefix": "a",
  "libraryName": "ant-design-vue",
  "style": true
}
```

3. Code  
You can now write:  
```vue
<template>
  <div>
    <AButton />
    <a-auto-complete />
  </div>
</template>
```
Instead of:  
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

## Usage with manual mantained webpack.conf
TODO

## Limitations
1. Only works for *.vue file \<template\> part
2. Invalid for dynamic 'is', like \<div :is="compName" /\>
3. Invalid for string template
4. Invalid for render function and JSX
