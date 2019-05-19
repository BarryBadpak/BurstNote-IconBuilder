import meow from 'meow';
import fs from 'fs';
import {basename, dirname, join} from 'path';
import {getFilePaths} from './utility/lib';

const commandName = basename(__filename);
const cliCommand = meow(`
    Usage
      $ ${commandName} <directory> <string>
    
    The string specified as the second argument will be removed from the filename if present
    
    Examples
      $ ${commandName} ./icons icons8-
`, {});

try {
    getFilePaths(cliCommand.input[0])
        .forEach((iconFilePath: string) => {
            const stringToRemove = cliCommand.input[1] ? cliCommand.input[1] : '';
            const iconFileName = basename(iconFilePath);
            const newIconFileName = iconFileName.replace(stringToRemove, '').replace(/^\_+|\-+$/g, '');
            if (newIconFileName !== iconFileName) {
                const newIconFilePath = join(dirname(iconFilePath), newIconFileName);
                fs.renameSync(
                    iconFilePath,
                    newIconFilePath
                );

                console.log(`Renamed ${iconFilePath} -> ${newIconFilePath}`);
            }
        });
} catch (err) {
    console.log(err.message);
}
