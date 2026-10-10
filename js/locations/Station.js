class Station {
    constructor(char, lines) {
        this.char = char;
        this.lines = lines;
        this.name = "station " + char;
        this.exit = new Location(
            this, "exit", 0,
            template("station_" + char + "_exit")?.querySelector("*[name='exit image']")?.getAttribute("alt"),
            ["station_" + char + "_exit"],
            [
                {
                    label: "↓<br>enter",
                    f: () => { this.hall.enter() }
                }
            ]
        )
        this.hall = new Location(
            this, "hall", 1,
            "people pass you by.",
            ["ticket_machine", "map"],
            [
                {
                    label: "exit<br>↑",
                    f: () => { this.exit.enter() }
                },
            ]
        )
        this.generate_line_locations(char, lines);
    }

    generate_line_locations(char, lines) {
        this.line_halls = [];
        this.line_platforms = [];
        const line_entrances = [];
        for (const line_index of lines) {
            const name = subway.lines[line_index].name;
            line_entrances.push({
                label: "↓<br>line " + name,
                f: () => { this.line_halls[line_index].enter() }
            })

            const directions = [];
            const sequence = subway.lines[line_index].sequence;
            const sequence_index = sequence.indexOf(char);
            if (sequence[0] == sequence[sequence.length - 1]) {
                // circular line
                let prev = sequence_index - 1;
                let next = sequence_index + 1;
                if (prev < 0) prev = sequence.length - 2;
                if (next > sequence.length - 1) next = 1;
                directions.push({
                    label: "↓<br>" + sequence[prev] + " ↺",
                    name: sequence[prev] + " ↺",
                    f: () => {
                        this.line_platforms[line_index][0].enter()
                    }
                })
                directions.push({
                    label: "↓<br>" + sequence[next] + " ↻",
                    name: sequence[next] + " ↻",
                    f: () => {
                        this.line_platforms[line_index][1].enter()
                    }
                })
            } else {
                if (sequence_index > 0) {
                    // not the first station
                    if (sequence_index > 1) {
                        directions.push({
                            label: "↓<br>" + sequence[sequence_index - 1] + "..." + sequence[0],
                            name: sequence[sequence_index - 1] + "..." + sequence[0],
                            f: () => {
                                this.line_platforms[line_index][0].enter()
                            }
                        })
                    } else {
                        directions.push({
                            label: "↓<br>" + sequence[0],
                            name: sequence[0],
                            f: () => {
                                this.line_platforms[line_index][0].enter()
                            }
                        })
                    }
                } else {
                    directions.push({
                        label: "↓<br>(end of line)",
                        name: "(end of line)",
                        f: () => {
                            this.line_platforms[line_index][0].enter()
                        }
                    })
                }
                if (sequence_index < sequence.length - 1) {
                    // not the last station
                    if (sequence_index < sequence.length - 2) {
                        directions.push({
                            label: "↓<br>" + sequence[sequence_index + 1] + "..." + sequence[sequence.length - 1],
                            name: sequence[sequence_index + 1] + "..." + sequence[sequence.length - 1],
                            f: () => {
                                this.line_platforms[line_index][1].enter()
                            }
                        })
                    } else {
                        directions.push({
                            label: "↓<br>" + sequence[sequence.length - 1],
                            name: sequence[sequence.length - 1],
                            f: () => {
                                this.line_platforms[line_index][1].enter()
                            }
                        })
                    }
                } else {
                    directions.push({
                        label: "↓<br>(end of line)",
                        name: "(end of line)",
                        f: () => {
                            this.line_platforms[line_index][1].enter()
                        }
                    })
                }
            }

            this.line_halls[line_index] = new Location(
                this, "hall [line " + name + "]", 2,
                "you push past the bustle.",
                ["ticket_machine", "map"],
                [
                    {
                        label: "upstairs<br>↑",
                        f: () => { this.hall.enter() }
                    },
                    ...directions
                ]
            )
            this.line_halls[line_index].line = line_index;

            this.line_platforms[line_index] = [];
            for (let i=0; i<2; i++) {
                this.line_platforms[line_index][i] = new Platform(
                    this, "platform [" + directions[i].name + "]",
                    [
                        {
                            label: "upstairs<br>↑",
                            f: () => { this.line_halls[line_index].enter() }
                        }
                    ]
                )
                const timetable = subway.lines[line_index].timetables[i];
                this.line_platforms[line_index][i].line = line_index;
                this.line_platforms[line_index][i].line_direction = i;
                this.line_platforms[line_index][i].timetable = timetable.filter(v => v.station == char || v.to == char || v.from == char);
            }
        }
        this.hall.actions = [...this.hall.actions, ...line_entrances];
    }

    enter() {
        this.exit.enter();
        localStorage.setItem("current_station", this.char);
    }
}