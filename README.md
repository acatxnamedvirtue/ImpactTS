# ImpactTS
This is ImpactJS ported over to TypeScript.  

ImpactJS repo: https://github.com/phoboslab/Impact

ImpactJS site: https://impactjs.com/

ImpactJS docs: https://impactjs.com/documentation

### Many thanks to:
@phoboslab for open sourcing the original engine

@city41 for completing a huge portion of a TypeScript port in his repo here: https://github.com/city41/impact.ts

# Differences from the original ImpactJS
* Uses ES6 classes instead of proprietary class and module system
* ig is no longer a global object placed on window, it must be imported instead 
  * ie import { ig } from '@city41/impact.ts/dist/impact'
* ig.global has been removed
* Strongly and statically typed
* No separate server (PHP or otherwise) is required. For WM, the filesystem is accessed via the NodeJS `fs` module.

Even so, I have attempted to keep as much of the code as close to the original as possible, except in cases where type safety or deprecations warranted changes.

## All classes prefixed with "ig"
All impact.ts classes start with ig, ie igTimer, igEntity, etc. This was done because without the prefix, igImage would clash with the built in Image type in browsers.

## igGame#spawnEntity
spawnEntity no longer accepts a string for the type parameter. You must pass in an entity class instead. This is due to no longer having ig.global.

## igGame#loadLevel
loadLevel requires you pass in an entityMap parameter, due to the above spawnEntity change.

## Built in prototypes no longer augmented
Number and Array no longer get additional methods added to their prototype. These methods instead live in `util`.

For example, instead of:

```javascript
const a = 123;
const b = a.limit(10, 200);
```

do
```javascript
import { limit } from 'src/impact/util';

const a = 123;
const b = limit(a, 10, 200);
```


## bundling
Since impact.ts is a standard TypeScript library, there is no need for any kind of bundling solution such as impact's bake.php.

This repo comes set up to use with NW.JS, which will package your app up into a standalone executable app, but you can realistically use whatever you want!

# Getting Started
The scripts in package.json assume you're on Linix/Mac, so you'll need to modify them if you're running on Windows.

```bash
yarn
yarn start
```

Once the app is running, you can open Weltmeister by pressing `Shift + W` or open the JumpNRun demo game by pressing `Shift + G`.
You can modify `src/index.ts` to have one or the other auto-open, or change the shortcuts.

No separate server (PHP or otherwise) is required!

## Debugging

When either the Game or Weltmeister is running, you can open the DevTools (or have them open automatically, see `src/index.ts`), and anything that is `console.log`-ed will appear there just like normal. 

# License
All code (aside from the vendored JQuery files) is licensed under the same license as ImpactJS, the MIT license.
Feel free to use or modify this code for any purpose!

# Multiline Comment Regex Matcher
(\/)([\*])+(.|\n)+?(\2\1)