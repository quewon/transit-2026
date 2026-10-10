function parse_map() {
    for (let line of map.textContent.split("\n")) {
        line = line.trim();
        if (!line) continue;
        // parsing a "subway line" line
        if (line.indexOf("line ") == 0) {
            const name = line.split("line ")[1].split(": ")[0];
            const sequence = line.split(": ")[1].split("-");
            subway.lines.push({ name, sequence });
            continue;
        }
        // parsing a "subway map" line
        subway.map.push([]);
        let x = 0;
        for (const char of line) {
            if (char == ".") {
                subway.map[subway.map.length - 1][x] = null;
            } else {
                subway.map[subway.map.length - 1][x] = char;
                subway.stations[char] = undefined;
            }
            x++;
        }
    }
}

function copy_array(original) {
    var array = [];
    for (let y = 0; y < original.length; y++) {
        array.push([]);
        for (let x = 0; x < original[y].length; x++) {
            array[y][x] = original[y][x];
        }
    }
    return array;
}

function add_path_to_array(array, a, b, path_index) {
    let a_position;
    let b_position;
    for (let y = 0; y < array.length; y++) {
        for (let x = 0; x < array[y].length; x++) {
            if (array[y][x] == a) {
                a_position = [x, y];
            } else if (array[y][x] == b) {
                b_position = [x, y];
            }
        }
    }
    const direction = [
        Math.sign(b_position[0] - a_position[0]),
        Math.sign(b_position[1] - a_position[1])
    ];
    let x = a_position[0];
    let y = a_position[1];
    while (x != b_position[0]) {
        if (!array[y][x])
            array[y][x] = path_index;
        x += direction[0];
    }
    while (y != b_position[1]) {
        if (!array[y][x])
            array[y][x] = path_index;
        y += direction[1];
    }
    return array;
}

function draw_array_to_map(array, no_buttons) {
    let html = "<div class='flex column'><fieldset><legend>map</legend>";
    for (let y = 0; y < array.length; y++) {
        for (let x = 0; x < array[y].length; x++) {
            const char = array[y][x];
            if (char === null) {
                html += " ";
            } else if (typeof char === "number") {
                html += ".";
            } else if (typeof char === "string") {
                html += `<span>${char}</span>`;
            }
        }
        html += "\n";
    }
    html += "</fieldset>";
    if (!no_buttons) {
        html += "<div class='flex'>";
        for (let i=0; i<subway.lines.length; i++) {
            const line = subway.lines[i];
            html += `<button onclick="select_subway_line(${i})">${line.name}</button>`;
        }
        html += `<button onclick="select_subway_line()">clear</button>`;
        html += "</div>";
    }
    html += "</div>";
    map.innerHTML = html;
}

function draw_map(line_index, no_buttons) {
    let copy = copy_array(subway.map);
    if (line_index !== undefined) {
        const sequence = subway.lines[line_index].sequence;
        for (let i=0; i < sequence.length - 1; i++) {
            copy = add_path_to_array(copy, sequence[i], sequence[i + 1], line_index);
        }
    }
    draw_array_to_map(copy, no_buttons);
    for (const span of map.querySelectorAll("span")) {
        if (span.textContent == localStorage.getItem("current_station")) {
            span.classList.add("current-position");
            break;
        }
    }
}

// ui

function select_subway_line(line) {
    draw_map(line);
    for (const button of map.querySelectorAll("button")) {
        if (
            line !== undefined && button.textContent == subway.lines[line].name ||
            line === undefined && button.textContent == "clear"
        ) {
            setTimeout(() => {
                button.focus();
            }, 0);
            break;
        }
    }
}

function open_map() {
    if ("line" in current_location) {
        draw_map(current_location.line, true);
    } else {
        draw_map();
        for (const button of map.querySelectorAll("button")) {
            if (button.textContent == "clear") {
                setTimeout(() => {
                    button.focus();
                }, 0);
                break;
            }
        }
    }
    map.showModal();
}