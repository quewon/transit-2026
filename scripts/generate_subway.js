var subway;

function generate_subway() {
    subway = parse_map();
    build_locations();
    build_trains();
}

function line_is_cycle(line_name) {
    const sequence = subway.lines[line_name].sequence;
    return sequence[0] == sequence[sequence.length - 1];
}

function build_locations() {
    for (const station_name in subway.stations) {
        const exit = new Exit({
            name: "station " + station_name + " — exit",
            depth: 0,
            station_name,
            navigation: [
                {
                    text: "enter",
                    f: () => { main_hall.enter() }
                }
            ]
        });

        const main_hall = new Location({
            name: "station " + station_name + " — hall",
            depth: 1,
            station_name,
            objects: ["map"],
            navigation: [
                {
                    text: "exit",
                    f: () => { if (subway.stations[station_name].lines.length > 0) { fare_check_menu.showModal() } exit.enter() },
                    direction: "up"
                }
            ]
        })

        subway.stations[station_name].line_halls = {};
        subway.stations[station_name].line_platforms = {};
        for (let line_name of subway.stations[station_name].lines) {
            const sequence = subway.lines[line_name].sequence;
            const index = sequence.indexOf(station_name);

            const line_hall = new Location({
                name: "station " + station_name + " — hall [line " + line_name + "]",
                depth: 2,
                line_name,
                station_name,
                objects: ["map"],
                navigation: [
                    {
                        text: "hall",
                        f: () => { main_hall.enter() },
                        direction: "up"
                    }
                ]
            })
            main_hall.navigation.push({
                text: line_name,
                class: "line" + line_name,
                f: () => { line_hall.enter() }
            });

            var next_stations;
            var line_ends;
            if (line_is_cycle(line_name)) {
                next_stations = [
                    index - 1 < 0 ? sequence[sequence.length - 2] : sequence[index - 1],
                    index + 1 >= sequence.length ? sequence[1] : sequence[index + 1],
                ]
                line_ends = [" ↺", " ↻"];
            } else {
                next_stations = [
                    index - 1 < 0 ? "end of line" : sequence[index - 1],
                    index + 1 >= sequence.length ? "end of line" : sequence[index + 1],
                ]
                line_ends = [
                    next_stations[0] == "end of line" || 0 == index - 1 ? "" : "..." + sequence[0],
                    next_stations[1] == "end of line" || sequence.length - 1 == index + 1 ? "" : "..." + sequence[sequence.length - 1],
                ]
            }
            subway.stations[station_name].line_platforms[line_name] = [];
            for (let i=0; i<2; i++) {
                const platform = new Platform({
                    name: "station " + station_name + " — platform [line " + line_name + " → " + next_stations[i] + line_ends[i] + "]",
                    depth: 3,
                    line_name,
                    station_name,
                    navigation: [
                        {
                            text: "hall",
                            class: "line" + line_name,
                            f: () => { line_hall.enter() },
                            direction: "up"
                        }
                    ]
                })
                line_hall.navigation.push({
                    text: next_stations[i] + line_ends[i],
                    class: "line" + line_name,
                    f: () => { fare_menu.showModal(); platform.enter() }
                })

                subway.stations[station_name].line_platforms[line_name][i] = platform;
            }

            subway.stations[station_name].line_halls[line_name] = line_hall;
        }

        subway.stations[station_name].exit = exit;
        subway.stations[station_name].hall = main_hall;
    }
}

function build_trains() {
    // trains simulation

    const TRAIN_WAIT_TIME = 25;
    const TRAIN_SPEED = 10; // per square
    const TRAIN_IDLE_TIME = 40;

    function create_trains() {
        var trains = {};
        for (const line_name in subway.lines) {
            const line = subway.lines[line_name];
            const sequence = line.sequence;
            trains[line_name] = [];
            for (let d of [-1, 1]) {
                // n number of trains cycling through 60 minutes
                // 1 train per 2 stations, for each direction
                const n = Math.max(Math.floor(sequence.length / 2), 1);
                for (let t=0; t<n; t++) {
                    trains[line_name].push({
                        name: (d == -1 ? "0" : "1") + t,
                        direction: d,
                        timer: 0,
                        current_station_index: t * 2 + (d == 1 && sequence.length % 2 == 1)
                    });
                }
            }
        }
        return trains;
    }

    function simulate_trains(trains, simulation_duration) {
        function position(station_name) {
            for (let y=0; y<subway.map.length; y++) {
                for (let x=0; x<subway.map[y].length; x++) {
                    if (subway.map[y][x] == station_name)
                        return [x, y];
                }
            }
        }

        function distance(a, b) {
            const a_position = position(a);
            const b_position = position(b);
            const d = [
                Math.abs(b_position[0] - a_position[0]),
                Math.abs(b_position[1] - a_position[1])
            ]
            return d[0] + d[1];
        }

        function next_station_index(line_name, index, direction) {
            const sequence = subway.lines[line_name].sequence;
            let next_index = index + direction;
            if (line_is_cycle(line_name)) {
                if (next_index < 0) return sequence.length - 2;
                else if (next_index >= sequence.length) return 1;
            } else if (next_index < 0 || next_index >= sequence.length) {
                return undefined;
            }
            return next_index;
        }

        function timetable_snapshot(time, line_name, train) {
            const sequence = subway.lines[line_name].sequence;
            const { current_station_index, direction, status, name } = train;
            const stop = sequence[current_station_index];
            if (status == "waiting") {
                return { time, direction, name, status, stop, duration: TRAIN_WAIT_TIME }
            } else if (status == "moving") {
                const next_stop = next_station_index(line_name, current_station_index, direction);
                const duration = TRAIN_SPEED * distance(
                    sequence[current_station_index],
                    sequence[next_stop]
                );
                return {
                    time, direction, name, status,
                    from: stop,
                    to: sequence[next_stop],
                    duration
                }
            } else if (status == "idle") {
                return {
                    time,
                    name, status, stop,
                    duration: TRAIN_IDLE_TIME
                }
            }
        }

        let timetables = {};
        for (let line_name in trains) {
            timetables[line_name] = [];
            for (let train of trains[line_name]) {
                const next_stop = next_station_index(line_name, train.current_station_index, train.direction);
                if (next_stop !== undefined)
                    train.status = "waiting";
                else
                    train.status = "idle";
                timetables[line_name].push(timetable_snapshot(0, line_name, train));
            }
        }
        for (let t=0; t < simulation_duration; t++) {
            for (let line_name in trains) {
                for (let train of trains[line_name]) {
                    train.timer++;
                    const { current_station_index, direction, status, timer } = train;
                    if (status == "waiting" && timer > TRAIN_WAIT_TIME) {
                        const next_stop = next_station_index(line_name, current_station_index, direction);
                        if (next_stop !== undefined) {
                            train.status = "moving";
                            train.timer = 0;
                        } else {
                            train.status = "idle";
                            train.timer = 0;
                        }
                        timetables[line_name].push(timetable_snapshot(t, line_name, train));
                    } else if (status == "moving") {
                        const sequence = subway.lines[line_name].sequence;
                        const next_stop = next_station_index(line_name, current_station_index, direction);
                        const duration = TRAIN_SPEED * distance(
                            sequence[current_station_index],
                            sequence[next_stop]
                        );
                        if (train.timer > duration) {
                            train.status = "waiting";
                            train.current_station_index = next_stop;
                            train.timer = 0;
                            timetables[line_name].push(timetable_snapshot(t, line_name, train));
                        }
                    } else if (status == "idle" && timer > TRAIN_IDLE_TIME) {
                        train.direction *= -1;
                        train.status = "waiting";
                        train.timer = 0;
                        timetables[line_name].push(timetable_snapshot(t, line_name, train));
                    }
                }
            }
        }
        return timetables;
    }

    function make_loopable(timetables, simulation_duration) {
        for (let line_name in trains) {
            for (let train of trains[line_name]) {
                for (let i = timetables[line_name].length - 1; i >= 0; i--) {
                    const entry = timetables[line_name][i];
                    if (entry.name == train.name) {
                        // force end on an idle state
                        if (entry.status == "idle" && entry.time + TRAIN_IDLE_TIME <= simulation_duration) {
                            break;
                        } else if (entry.status == "waiting") {
                            // if previous entry was an idle state, use that
                            // otherwise, idle here
                            const previous_entry = timetables[line_name][i - 1];
                            if (previous_entry.status == "idle") {
                                timetables[line_name].splice(i, 1);
                                break;
                            } else if (entry.time + TRAIN_IDLE_TIME <= simulation_duration) {
                                entry.status = "idle";
                                entry.duration = TRAIN_IDLE_TIME;
                                delete entry.direction;
                                break;
                            }
                        }
                        timetables[line_name].splice(i, 1);
                    }
                }
            }
        }
    }

    function create_locations(trains) {
        for (const line_name in trains) {
            subway.lines[line_name].trains = {};
            for (const train of trains[line_name]) {
                subway.lines[line_name].trains[train.name] = new Train({
                    name: "train " + line_name + train.name,
                    train_name: train.name,
                    line_name,
                    depth: 3,
                    direction: train.direction == -1 ? 0 : 1
                })
            }
        }
    }

    const trains = create_trains();
    const timetables = simulate_trains(trains, 60 * 60);
    // make_loopable(timetables, 60 * 60);
    create_locations(trains);

    for (let line_name in subway.lines) {
        subway.lines[line_name].timetable = timetables[line_name];
    }
}