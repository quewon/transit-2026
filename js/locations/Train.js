class Train extends Location {
    timetable;
    line;
    line_direction;
    train_video;

    constructor(line, name) {
        super(null, name, 3, "", ["train-inside", "timetable", "map", "rando", "rando", "rando"]);
        this.line = line;
    }

    generate_timetable() {
        let html = "<div><table>";
        html += "<tr><th>TIME</th><th>STATION</th></tr>";
        for (const entry of this.timetable) {
            if (entry.status == "waiting") {
                html += "<tr>";
                html += `<td>${convert_time(entry.time)}</td>`;
                html += `<td>${entry.station}</td>`;
                html += "</tr>";
            }
        }
        html += "</table></div>";
        return html;
    }

    enter() {
        if (current_location)
            current_location.exit();
        this.remove_all_objects();
        this.remove_all_actions();
        document.body.className = "depth" + this.depth;
        station_name.textContent = "line " + subway.lines[this.line].name + " - " + this.name;
        location_name.textContent = this.name;
        location_description.textContent = this.description;
        this.init_objects();
        this.init_actions();
        current_location = this;
        localStorage.setItem("current_location", locations.indexOf(this));
        
        this.schedule_next_station();
    }

    exit() {
        super.exit();
        if (this.timeout)
            clearTimeout(this.timeout);
        if (this.ticket_checker_timeout)
            clearTimeout(this.ticket_checker_timeout);
        if (this.exit_button) {
            this.exit_button.remove();
            delete this.exit_button;
        }
    }

    get_stop(t) {
        t = t || get_time();
        for (const entry of this.timetable) {
            if (entry.status == "moving" && t >= entry.time && t < entry.time + entry.duration) {
                return entry;
            }
        }
    }

    get_current_stop(t) {
        t = t || get_time();
        for (const entry of this.timetable) {
            if (entry.status == "waiting" && t >= entry.time && t < entry.time + entry.duration) {
                return entry;
            }
        }
    }

    create_exit_button(current_stop) {
        current_stop = current_stop || this.get_current_stop();
        if (current_stop) {
            const fragment = template("exit-button");
            const button = fragment.querySelector("button");
            button.textContent = "station " + current_stop.station;
            button.onclick = () => {
                const platform = subway.stations[current_stop.station].line_platforms[this.line][this.line_direction];
                platform.enter();
            }
            document.body.appendChild(button);
            return button;
        }
    }

    schedule_next_station() {
        const t = get_time();
        const current_stop = this.get_current_stop(t);
        if (current_stop) {
            localStorage.setItem("current_station", current_stop.station);
            this.update_description("the train will be leaving shortly.");
            this.exit_button = this.create_exit_button(current_stop);
            this.train_video.pause();
            this.timeout = setTimeout(() => {
                this.schedule_next_station();
            }, (current_stop.time + current_stop.duration - t) * 1000);
        } else {
            if (this.exit_button) {
                this.exit_button.remove();
                delete this.exit_button;
            }
            this.train_video.play();
            const stop = this.get_stop(t);
            localStorage.setItem("current_station", stop.to);
            this.update_description(`this stop is station ${stop.to}.`);

            let ticket_checker_chance = 0.1 * subway.stations[stop.to].lines.length;
            if (Math.random() <= ticket_checker_chance) {
                this.ticket_checker_timeout = setTimeout(() => {
                    ticket_checker_dialogue();
                }, (stop.duration / 3) * 1000);
            }

            this.timeout = setTimeout(() => {
                this.schedule_next_station();
            }, (stop.time + stop.duration - t) * 1000);
        }
    }
}

function ticket_checker_dialogue() {
    dialogue_noclose.innerHTML = `your ticket, please.<br><br><input type="text" id="ticket_input"><br><br><button type='button' onclick='dialogue_noclose.close(); check_ticket()'>submit</button>`
    dialogue_noclose.showModal();
}

function check_ticket() {
    const ticket = tickets[ticket_input.value.trim()];
    if (ticket) {
        const now = new Date();
        const time = ticket[2];
        if ((now - time) / 1000 > 1200) {
            money -= 10;
            localStorage.setItem("money", money);
            money_counter.textContent = money;
            dialogue.textContent = "this ticket is no longer valid. you have been fined 10c.";
            dialogue.showModal();
        } else {
            dialogue.textContent = "approved. have a good day.";
            dialogue.showModal();
        }
    } else {
        money -= 10;
        localStorage.setItem("money", money);
        money_counter.textContent = money;
        dialogue.textContent = "this is not a valid ticket. you have been fined 10c.";
        dialogue.showModal();
    }
}