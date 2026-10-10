class Platform extends Location {
    is_platform = true;
    line;
    line_direction;
    timetable;
    tunnel_video;

    constructor(station, name, actions) {
        super(station, name, 3, "", ["tunnel", "timetable", "map", "rando"], actions);
    }

    generate_timetable() {
        let html = "<div><table>";
        html += "<tr><th>TIME</th><th>TRAIN</th></tr>";
        for (const entry of this.timetable) {
            if (entry.status == "waiting" && entry.station == this.station.char) {
                html += "<tr>";
                html += `<td>${convert_time(entry.time)}</td>`;
                html += `<td>${this.line_direction}-${entry.train}</td>`;
                html += "</tr>";
            }
        }
        html += "</table></div>";
        return html;
    }

    enter() {
        super.enter();
        this.schedule_next_train();
    }

    exit() {
        super.exit();
        if (this.timeout)
            clearTimeout(this.timeout);
        if (this.train) {
            this.train.remove();
            delete this.train;
        }
    }

    create_train() {
        const fragment = template("train");
        const button = fragment.querySelector("button");
        button.onclick = () => {
            this.enter_train();
        }
        document.body.appendChild(button);
        return button;
    }

    get_outgoing_train(t) {
        t = t ?? get_time();
        const going_table = this.timetable.filter(v => v.status == "waiting" || v.status == "moving" && v.from == this.station.char);
        for (const entry of going_table) {
            if (t >= entry.time && t < entry.time + entry.duration) {
                return entry;
            }
        }
    }

    enter_train() {
        const t = get_time();
        const outgoing_train = this.get_outgoing_train(t);
        if (outgoing_train) {
            const train = subway.lines[this.line].trains[this.line_direction][outgoing_train.train];
            train.enter();
        } else {
            console.error("tried to enter a train that doesn't exist");
        }
    }

    get_active_trains(t) {
        t = t ?? get_time();
        let current_waiting;
        let next_waiting;
        const waiting_table = this.timetable.filter(v => v.status == "waiting");
        for (const entry of waiting_table) {
            if (t >= entry.time && t < entry.time + entry.duration)
                current_waiting = entry;
            if (entry.time > t) {
                next_waiting = entry;
                break;
            }
        }
        if (!next_waiting) {
            for (const entry of waiting_table) {
                if (entry.time > t - 60) {
                    next_waiting = entry;
                    break;
                }
            }
        }
        return [current_waiting, next_waiting];
    }

    schedule_next_train() {
        const t = get_time();
        const [current_waiting, next_waiting] = this.get_active_trains(t);
        if (current_waiting) {
            this.update_description("the train has arrived.");
            this.train = this.create_train();
            this.tunnel_video.play();
            this.timeout = setTimeout(() => {
                this.schedule_next_train();
            }, (current_waiting.time + current_waiting.duration - t) * 1000);
        } else {
            this.update_description("the tunnel echoes.");
            if (this.train) {
                this.train.remove();
                delete this.train;
            }
            this.tunnel_video.pause();
            this.tunnel_video.currentTime = 0;
            this.timeout = setTimeout(() => {
                this.schedule_next_train();
            }, (next_waiting.time - t) * 1000);
        }
    }
}