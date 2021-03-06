import {basename, join} from 'path';
import meow from 'meow';
import {css, encodeSVG, getArgumentValue, intersectMap, mapIcons, uniqueMap, writeFile} from './utility/lib';
import * as fs from 'fs';
import rimraf from 'rimraf';

const commandName = basename(__filename);
const cliCommand = meow(`
    Usage
      $ ${commandName} <directory> <outDir> <include>

    Options
      -d  --debug
        Writes used map files as json in <outDir>

    Examples
      $ ${commandName} ./icons-src ./icons-dist
      $ ${commandName} ./icons-src ./icons-dist theme-a,theme-b
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
    const includeThemes = cliCommand.input[2] ? cliCommand.input[2].split(',') : [];
    const srcDir = getArgumentValue(cliCommand, 0);
    const destDir = getArgumentValue(cliCommand, 1);
    const cssDir = join(destDir, 'css');

    if (fs.existsSync(destDir)) {
        rimraf.sync(destDir);
    }

    fs.mkdirSync(destDir);
    fs.mkdirSync(cssDir);

    const iconMap = mapIcons(srcDir, includeThemes);
    const intersectIconMap = intersectMap(iconMap);
    const uniqueIconMap = uniqueMap(iconMap, intersectIconMap);
    const iconThemes = Object.keys(iconMap);

    if (debug) {
        writeFile(join(destDir, 'iconMap.json'), JSON.stringify(iconMap, null, 2));
        writeFile(join(destDir, 'intersectIconMap.json'), JSON.stringify(intersectIconMap, null, 2));
        writeFile(join(destDir, 'uniqueIconMap.json'), JSON.stringify(uniqueIconMap, null, 2));
    }

    for (const iconTheme of iconThemes) {
        const themeFileName = `theme-${iconTheme}`;
        let themeCss = '';
        for (let iconName of intersectIconMap[iconTheme]) {
            const iconSvg = fs.readFileSync(join(srcDir, iconTheme, iconName))
                .toString()
                .replace(/<!--.*-->/g, '');
            const encodedIcon = encodeSVG(iconSvg);
            iconName = iconName.replace('.svg', '').replace(/_/g, '-');

            const properties = {
                '-webkit-mask': `url("data:image/svg+xml;charset=UTF-8,${encodedIcon}") no-repeat 50% 50%`,
                '-webkit-mask-size': 'cover'
            };

            themeCss += css(
                `body[data-icon-theme="${iconTheme}"] .ico-${iconName}`,
                properties
            );
        }

        writeFile(join(cssDir, `${themeFileName}.css`), themeCss);
    }
} catch (err) {
    console.log(err.message);
}
