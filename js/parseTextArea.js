const split_regex = /(?:[ ]+)|(:[^ ]*:)|({{[^ }]*}})/;
const icon_regex = /(:[^ ]*:)|({{[^ }]*}})/;
const bw_bar_regex = /^---*$/;

/** @typedef {{icon: string, offset: number, line: number}} Icon*/ 

/**
 * @param {CanvasRenderingContext2D} ctx The canvas context
 * @param {string} text Text to draw
 * @param {number} maxWidth Maximum width of the text to be drawn
 * @param {number} scale The card scaling used
 * @param {boolean} [parseIcons=true] Whether to parse icons (default true)
 * @returns { {lines: string[], icons: Icon[]}[] } Returns the lines and icons of the drawn text area
 */
export function parseTextArea(ctx, text, maxWidth, scale, parseIcons = true) {
    const sections = [];

    // preserve user lines
    const paragraphs = text.split(/\r\n|\n|\r/);
    for (const i in paragraphs) {
        const text = paragraphs[i];
        // If user inputed a newline without text
        if (text.trim() == '') {
            sections.push({ lines: [], icons: [] });
            continue;
        }

        sections.push(parseLine(ctx, text, maxWidth, scale, parseIcons));
    }

    return sections;
}

/**
 * @param {CanvasRenderingContext2D} ctx The canvas context
 * @param {string} text Text to draw
 * @param {number} maxWidth Maximum width of the text to be drawn
 * @param {number} scale The card scaling used
 * @param {boolean} [parseIcons=true] Whether to parse icons (default true)
 * @returns { {lines: string[], icons: Icon[]} } Returns the parsed lines of the given text input
 */
export function parseLine (ctx, text, maxWidth, scale, parseIcons = true) {
    // Filter out the undefined capture groups from the regex
    const words = text.split(split_regex).filter(el => (el));
    let remaining = words.length;

    // Recursive function that draws lines of text
    // If the text is longer than the line, breaks on the next word
    const parseWords = (lines=[], icons=[]) => {
        let line_text = "";
        let line_width = 0;
        let first_word = true;

        while (remaining > 0) {
            let next_word = words[words.length - remaining];
            let new_width = line_width;
            let icon = null;

            // brainwash bar drawing
            if (parseIcons && bw_bar_regex.test(next_word)) {
                lines.push("bw_bar");
                return { lines, icons };
            }
            // draw an icon in the line
            else if (parseIcons && icon_regex.test(next_word)) {
                icon = parseIcon(next_word);
                new_width += 12 * scale; // width of the icon
                next_word = " ".repeat(4); // equivalent width of placeholding spaces
            }
            else {
                if (!first_word) {
                    next_word = ` ${next_word}`;
                } else {
                    first_word = false;
                }
                new_width += ctx.measureText(next_word).width;
            }

            if (new_width > maxWidth * scale) {
                lines.push(line_text);
                return parseWords(lines, icons);
            }
            else {
                if (icon !== null) {
                    icons.push({
                        icon,
                        offset: line_width / scale,
                        line: lines.length
                    });
                }
                line_text += next_word;
                line_width = new_width;
                remaining--;
            }
        }

        lines.push(line_text);

        return { lines, icons };
    };

    return parseWords();
}

const mc_regex = /{{([^ {}]*)}}/;
/** @type {(word: string) => string | null} */
function parseIcon(word) {
    let icon = word.match(icon_regex)[0];

    if (icon.startsWith(":")) {
        icon = icon.replaceAll(":", "").toLowerCase();
        if (available_icons.includes(icon)) {
            icon = `icon_${icon}`;
        } else {
            icon = null;
        }
    }
    else if (icon.startsWith("{{")) {
        // don't need to lowercase(), since done in preparser
        icon = icon.replace(mc_regex, "mc_$1");
    }

    return icon;
}

// These are the list of usable icons, if the user provides a value out of these, it won't load
export const available_icons = [
    "air",
    "courage",
    "danian",
    "earth",
    "fire",
    "generic",
    "m'arrillian",
    "mipedian",
    "overworld",
    "power",
    "speed",
    "underworld",
    "water",
    "wisdom"
];
