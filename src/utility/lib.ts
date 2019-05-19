import {basename, dirname, join} from 'path';
import glob from 'glob';
import {Result} from 'meow';
import * as fs from 'fs';

export function getArgumentValue(commandResult: Result, argumentIndex: number): string
{
    if (!commandResult.input[argumentIndex]) {
        throw new Error(`Argument \'${argumentIndex}\' is empty.`);
    }

    return commandResult.input[argumentIndex];
}

export function getFilePaths(directory: string): string[]
{
    if (!directory) {
        throw new Error('No directory argument provided.');
    }

    return glob.sync(join(directory, '**/*.svg'));
}

/**
 * Maps icons from a given src directory.
 *
 * Icons will be grouped by theme
 * Theme name is taken from the parent directory's name
 *
 * @param directory
 */
export function mapIcons(directory: string): { [key: string]: string[] }
{
    const iconMap: { [key: string]: string[] } = {};
    const iconFiles = getFilePaths(directory);

    iconFiles.forEach((iconFilePath: string) => {
        const iconTheme = basename(dirname(iconFilePath));
        if (!iconMap[iconTheme]) {
            iconMap[iconTheme] = [];
        }

        iconMap[iconTheme].push(basename(iconFilePath));
    });

    return iconMap;
}

/**
 * Generates a intersect map based on a source map
 *
 * @param map
 */
export function intersectMap(map: { [key: string]: string[] }): { [key: string]: string[] }
{
    const intersectMap: { [key: string]: string[] } = {};
    const mapKeys = Object.keys(map);

    for (const key of mapKeys) {
        const intersectionArrays: string[][] = [];
        for (const compareKey of mapKeys) {
            if (compareKey === key) {
                continue;
            }

            intersectionArrays.push(
                map[key].filter((x: string) => map[compareKey].includes(x))
            );
        }

        intersectMap[key] = [...new Set(...intersectionArrays)];
    }

    return intersectMap;
}

/**
 * Create a unique map based on the source map and intersect map
 *
 * @param map
 * @param intersectMap
 */
export function uniqueMap(map: { [key: string]: string[] }, intersectMap: { [key: string]: string[] }): { [key: string]: string[] }
{
    const uniqueMap: { [key: string]: string[] } = {};
    const mapKeys = Object.keys(map);

    for (const key of mapKeys) {
        uniqueMap[key] = map[key].filter((x: string) => !intersectMap[key].includes(x));
    }

    return uniqueMap;
}

/**
 * Generate css with a given identifier and a set of properties
 *
 * @param identifier
 * @param properties
 */
export function css(identifier: string, properties: { [key: string]: string }, indentLevel?: number): string
{
    const indent = indentLevel ? '\t'.repeat(indentLevel) : '';
    let statement = `${indent}${identifier} {\n`;
    for (const propertyName in properties) {
        const propertyValue = properties[propertyName];
        statement += `${indent}  ${propertyName}: ${propertyValue};\n`;
    }
    statement += `${indent}}\n`;

    return statement;
}

export function writeFile(filePath: string, contents: string): void
{
    fs.appendFileSync(
        filePath,
        contents,
    );
}

export function encodeSVG(data: string): string
{
    if ( data.indexOf( 'http://www.w3.org/2000/svg' ) < 0 ) {
        data = data.replace( /<svg/g, `<svg xmlns='http://www.w3.org/2000/svg'` );
    }

    data = data.replace(/"/g, '\'');
    data = data.replace(/>\s{1,}</g, '><');
    data = data.replace(/\s{2,}/g, ' ');

    return data.replace(/[\r\n%#()<>?\[\\\]^`{|}]/g, encodeURIComponent);
}
