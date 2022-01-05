const split_regex = /(?:[ ]+)|(:[^ ]*:)|({{[^ }]*}})/;
const icon_regex = /(:[^ ]*:)|({{[^ }]*}})/;

/**
 * @param {CanvasRenderingContext2D} ctx The canvas context
 * @param {string} text Text to draw
 * @param {number} maxWidth Maximum width of the text to be drawn
 * @returns { [{lines: string[], icons: *[]}] } Returns the lines and icons of the drawn text area
 */
export function parseTextArea(ctx, text, maxWidth, parseIcons = true) {
    const sections = [];

    // preserve user lines
    const paragraphs = text.split(/\r\n|\n|\r/);
    for (const i in paragraphs) {
        const text = paragraphs[i];
        // If user inputed a newline without text
        if (text.trim() == '') {
            sections.push({ lines: [], icons: [] });
        }

        // Filter out the undefined capture groups from the regex
        const words = text.split(split_regex).filter(el => (el));
        let remaining = words.length;

        // Recursive function that draws lines of text
        // If the text is longer than the line, breaks on the next word
        const parseLine = (lines=[], icons=[]) => {
            let line_text = "";
            let line_width = 0;
            let first_word = true;

            while (remaining > 0) {
                let next_word = words[words.length - remaining];
                let new_width = line_width;
                let icon = null;

                if (parseIcons && icon_regex.test(next_word)) {
                    icon = parseIcon(next_word);
                    new_width += 12; // width of the icon
                    next_word = " ".repeat(4);
                }
                else {
                    if (!first_word) {
                        next_word = ` ${next_word}`;
                    } else {
                        first_word = false;
                    }
                    new_width += ctx.measureText(next_word).width;
                }

                if (new_width > maxWidth) {
                    lines.push(line_text);
                    return parseLine(lines, icons);
                }
                else {
                    if (icon !== null) {
                        icons.push({
                            icon,
                            offset: line_width,
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

        sections.push(parseLine());
    }

    return sections;
}

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
        icon = `mc_${icon.replace("{{", "").replace("}}", "").toLowerCase()}`;    
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
