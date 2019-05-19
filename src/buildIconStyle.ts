import {basename, join} from 'path';
import meow from 'meow';
import {css, encodeSVG, getArgumentValue, intersectMap, mapIcons, uniqueMap, writeFile} from './utility/lib';
import * as fs from 'fs';
import rimraf from 'rimraf';

const commandName = basename(__filename);
const cliCommand = meow(`
    Usage
      $ ${commandName} <directory> <outDir>
    
    Options
      -d  --debug  
        Writes used map files as json in <outDir>

    Examples
      $ ${commandName} ./icons-src ./icons-dist
`, {
    flags: {
        debug: {
            type: 'boolean',
            alias: 'd'
        }
    }
});

try {
    const debug = cliCommand.flags['debug'];
    const srcDir = getArgumentValue(cliCommand, 0);
    const destDir = getArgumentValue(cliCommand, 1);
    const cssDir = join(destDir, 'css');

    if (fs.existsSync(destDir)) {
        rimraf.sync(destDir);
    }

    fs.mkdirSync(destDir);
    fs.mkdirSync(cssDir);

    const iconMap = mapIcons(srcDir);
    const intersectIconMap = intersectMap(iconMap);
    const uniqueIconMap = uniqueMap(iconMap, intersectIconMap);
    const iconThemes = Object.keys(iconMap);

    if (debug) {
        writeFile(join(destDir, 'iconMap.json'), JSON.stringify(iconMap, null, 2));
        writeFile(join(destDir, 'intersectIconMap.json'), JSON.stringify(intersectIconMap, null, 2));
        writeFile(join(destDir, 'uniqueIconMap.json'), JSON.stringify(uniqueIconMap, null, 2));
    }

    let iconsCss = '';
    for (const iconTheme of iconThemes) {
        let themeFileName = `_theme-${iconTheme}`;
        let themeCss = `.body[data-theme="${iconTheme}"] {\n`;
        for (const iconName of intersectIconMap[iconTheme]) {
            const iconSvg = fs.readFileSync(join(srcDir, iconTheme, iconName))
                .toString()
                .replace(/<!--.*-->/g, '');
            const encodedIcon = encodeSVG(iconSvg);

            const properties = {
                'background': `url("data:image/svg+xml;charset=UTF-8,${encodedIcon}") no-repeat 50% 50%`,
                'background-size': 'cover'
            };

            themeCss += css(`.ico-${iconName.replace('.svg', '')}`, properties, 1);
        }
        themeCss += '}\n';

        writeFile(join(cssDir, `${themeFileName}.scss`), themeCss);
        iconsCss += `@import "${themeFileName}";\n`;
    }

    writeFile(join(cssDir, `icons.scss`), iconsCss);
} catch (err) {
    console.log(err.message);
}
