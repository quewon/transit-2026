const subway = {
    train_wait_time: 20,
    train_speed: 10, //per square
    map: [],
    lines: [],
    stations: {}
};

function generate_stations() {
    for (const char in subway.stations) {
        const lines = [];
        for (const line_index in subway.lines) {
            if (subway.lines[line_index].sequence.includes(char))
                lines.push(parseInt(line_index));
        }
        subway.stations[char] = new Station(char, lines);
    }
}

function station_position(char) {
    for (let y=0; y<subway.map.length; y++) {
        for (let x=0; x<subway.map[y].length; x++) {
            if (subway.map[y][x] == char)
                return [x, y];
        }
    }
}

function generate_timetables() {
    // subway.lines.timetable
    // the "timetable" in a station shows when trains are scheduled for that station
    for (const line of subway.lines) {
        line.timetables = [];
        const { sequence } = line;
        for (let d=0; d<2; d++) {
            const timetable = [];
            // n number of trains cycling through 60 minutes
            // n depends on how many stations the line goes through
            // 1 train per 2 stations, for each direction
            const n = Math.floor(sequence.length / 2);
            for (let t=0; t<n; t++) {
                let current_station = (t * 2) % sequence.length;
                let s = 0;
                while (s < 60 * 60) {
                    timetable.push({
                        time: s,
                        duration: subway.train_wait_time,
                        train: t,
                        status: "waiting",
                        station: sequence[current_station]
                    })
                    s += subway.train_wait_time;

                    if (s >= 60 * 60) break;

                    let next_station = d == 0 ? current_station - 1 : current_station + 1;
                    if (sequence[0] == sequence[sequence.length - 1]) {
                        // circular line
                        if (next_station < 0) next_station = sequence.length - 2;
                        else if (next_station >= sequence.length) next_station = 1;
                    } else {
                        if (next_station < 0) next_station = sequence.length - 1;
                        else if (next_station >= sequence.length) next_station = 0;
                    }

                    let current_station_position = station_position(sequence[current_station]);
                    let next_station_position = station_position(sequence[next_station]);
                    let distance =
                        Math.abs(next_station_position[1] - current_station_position[1]) +
                        Math.abs(next_station_position[0] - current_station_position[0]);
                    let duration = distance * subway.train_speed;

                    timetable.push({
                        time: s,
                        duration: duration,
                        train: t,
                        status: "moving",
                        from: sequence[current_station],
                        to: sequence[next_station]
                    })
                    
                    s += duration;

                    current_station = next_station;
                }
            }
            timetable.sort((a, b) => a.time - b.time);
            line.timetables[d] = timetable;
        }
    }
}

function generate_trains() {
    for (let l=0; l<subway.lines.length; l++) {
        const line = subway.lines[l];
        line.trains = [];
        for (let d=0; d<2; d++) {
            const n = Math.floor(line.sequence.length / 2);
            line.trains[d] = [];
            for (let t=0; t<n; t++) {
                line.trains[d][t] = new Train(l, `train ${d}-${t}`);
                line.trains[d][t].timetable = line.timetables[d].filter(v => v.train == t);
                line.trains[d][t].line_direction = d;
            }
        }
    }
}