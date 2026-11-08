function parse_map() {
    var subway = {
        map: [],
        lines: {},
        stations: {},
    }
    for (let line of map.textContent.split("\n")) {
        line = line.trim();
        if (!line) continue;
        // parsing a "subway line" line
        if (line.indexOf("line ") == 0) {
            const name = line.split("line ")[1].split(": ")[0];
            const sequence = line.split(": ")[1].split("-");
            subway.lines[name] = { sequence };
            continue;
        }
        // parsing a "subway tags" line
        if (line.indexOf("station ") == 0) {
            const name = line.split("station ")[1].split(": ")[0];
            const tags = line.split(": ")[1].split(", ");
            subway.stations[name].tags = tags;
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
                subway.stations[char] = {};
            }
            x++;
        }
    }
    for (let station_name in subway.stations) {
        var lines = [];
        for (let line_name in subway.lines) {
            if (subway.lines[line_name].sequence.includes(station_name)) {
                lines.push(line_name);
            }
        }
        subway.stations[station_name].lines = lines;
    }
    return subway;
}

// ui

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

function add_path_to_array(array, a, b, line_name) {
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
            array[y][x] = `<span class="line${line_name}"> </span>`;
        x += direction[0];
    }
    while (y != b_position[1]) {
        if (!array[y][x])
            array[y][x] = `<span class="line${line_name}"> </span>`;
        y += direction[1];
    }
    return array;
}

function draw_array_to_map(array, no_buttons) {
    let html = "<div class='flex column'><fieldset style='overflow: visible'><legend>map</legend>";
    for (let y = 0; y < array.length; y++) {
        for (let x = 0; x < array[y].length; x++) {
            const string = array[y][x];
            if (string === null) {
                html += " ";
            } else if (typeof string === "string") {
                let char = string;
                if (string.includes(">")) {
                    char = string.split(">")[1].split("<")[0];
                }
                if (subway.stations[char] && "tags" in subway.stations[char]) {
                    html += `<span class="map-station" data-tags="${subway.stations[char].tags}">${string}<div class='tag-bubbles'>`
                    for (let tag of subway.stations[char].tags) {
                        html += `<div></div>`;
                    }
                    html += `</div></span>`;
                } else {
                    html += string;
                }
            }
        }
        html += "\n";
    }
    html += "</fieldset>";
    if (!no_buttons) {
        html += `<div class='flex'">`;
        for (let line_name in subway.lines) {
            html += `<input oninput="select_subway_line()" type="radio" name="map" value="${line_name}" /><label class="line${line_name}">${line_name}</labeL>`;
        }
        html += `<input oninput="select_subway_line()" type="radio" name="map" value=""><label>clear</label>`;
        html += "</div>";
    }
    html += "</div>";
    map.innerHTML = html;
}

function draw_map(line_name, no_buttons) {
    let copy = copy_array(subway.map);
    if (line_name !== undefined) {
        const sequence = subway.lines[line_name].sequence;
        for (let i=0; i < sequence.length - 1; i++) {
            copy = add_path_to_array(copy, sequence[i], sequence[i + 1], line_name);
        }
        for (let station_name of sequence) {
            let position;
            for (let y = 0; y < copy.length; y++) {
                for (let x = 0; x < copy[y].length; x++) {
                    if (copy[y][x] == station_name) {
                        position = [x, y];
                        break;
                    }
                }
            }
            if (position)
                copy[position[1]][position[0]] = `<span class="line${line_name}">${station_name}</span>`;
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

function select_subway_line() {
    let line_name = map.querySelector('input[name="map"]:checked').value;
    if (line_name)
        draw_map(line_name);
    else
        draw_map();
    for (const input of map.querySelectorAll("input")) {
        if (input.value == line_name) {
            setTimeout(() => {
                input.checked = true;
            }, 0);
            break;
        }
    }
}

function open_map() {
    if (current_location.line_name !== undefined) {
        draw_map(current_location.line_name, true);
        for (const input of map.querySelectorAll("input")) {
            if (input.value == current_location.line_name) {
                setTimeout(() => {
                    input.checked = true;
                }, 0);
                break;
            }
        }
    } else {
        draw_map();
        for (const input of map.querySelectorAll("input")) {
            if (input.value == "") {
                setTimeout(() => {
                    input.checked = true;
                }, 0);
                break;
            }
        }
    }
    map.showModal();
}