var current_location;

function clear_ui() {
    while (objects_container.lastElementChild)
        objects_container.lastElementChild.remove();
    while (navigation_down.lastElementChild)
        navigation_down.lastElementChild.remove();
    while (navigation_up.lastElementChild)
        navigation_up.lastElementChild.remove();
}

const locations = [];
class Location {
    name;
    station_name = undefined;
    line_name = undefined;
    depth = 0;
    id;

    objects = []; // template queries
    navigation = [];

    constructor(options) {
        this.name = options.name;
        this.station_name = options.station_name;
        this.line_name = options.line_name;
        if (options.objects) this.objects = options.objects;
        if (options.navigation) this.navigation = options.navigation;
        this.depth = options.depth;
        this.id = locations.length;
        locations.push(this);
    }

    enter() {
        document.body.className = "depth" + this.depth;

        if (current_location)
            current_location.exit();
        else
            clear_ui();
        location_name.textContent = this.name;
        for (let object_name of this.objects) {
            const fragment = gameobject(object_name);
            objects_container.appendChild(fragment);
        }
        for (let entry of this.navigation) {
            const button = document.createElement("button");
            button.textContent = entry.text;
            if (entry.class) button.className = entry.class;
            button.onclick = entry.f;
            if (entry.direction == "up") {
                navigation_up.appendChild(button);
            } else {
                navigation_down.appendChild(button);
            }
        }
        current_location = this;
        localStorage.setItem("current-location-id", this.id);
    }

    exit() {
        clear_ui();
        if (current_location == this)
            current_location = null;
    }
}

function gameobject(object_name) {
    let t = document.querySelectorAll("[data-object='" + object_name + "']");
    if (t) {
        if ("length" in t && t.length > 1) {
            t = t[Math.floor(Math.random() * t.length)];
        } else {
            t = t[0];
        }
        const fragment = document.importNode(t.content, true);
        return fragment;
    }
}

class Exit extends Location {
    constructor(options) {
        super(options);
        const station_videos = document.getElementsByClassName("station-video");
        this.video = station_videos[this.id % station_videos.length];

        const tags = subway.stations[this.station_name].tags;
        if (tags && tags.includes("job agent")) {
            this.objects.push("agent");
        }
    }

    enter() {
        super.enter();
        for (let job of jobs) {
            if (job.destination == this.station_name) {
                const fragment = job.destination_fragment;
                objects_container.appendChild(fragment);
            }
        }
        this.video.classList.remove("hidden");
        this.video.play();
    }

    exit() {
        super.exit();
        this.video.classList.add("hidden");
        this.video.pause();
    }
}

class Platform extends Location {
    constructor(options) {
        super(options);
        this.objects = ["map", "timetable", "rando"];
    }

    enter() {
        super.enter();
        timetable.innerHTML = this.generate_timetable();
        this.schedule_next_train();
        tunnel_video.classList.remove("hidden");
    }

    exit() {
        super.exit();
        if (this.train_button) {
            this.train_button.remove();
            delete this.train_button;
        }
        if (this.timeout)
            clearTimeout(this.timeout);
        tunnel_video.classList.add("hidden");
        tunnel_video.pause();
    }

    generate_timetable() {
        let html = "<div><table>";
        html += "<tr><th>TIME</th><th>TRAIN</th></tr>";
        for (const entry of subway.lines[this.line_name].timetable.filter(v => v.from == this.station_name)) {
            html += "<tr>";
            html += `<td>${seconds_to_time(entry.time)}</td>`;
            html += `<td>${this.line_name}${entry.name}</td>`;
            html += "</tr>";
        }
        html += "</table></div>";
        return html;
    }

    get_stopped_train(t) {
        t = t ?? get_time();
        const filtered = subway.lines[this.line_name].timetable.filter(entry => {
            return (
                entry.stop == this.station_name &&
                t >= entry.time && t < entry.time + entry.duration
            )
        });
        if (filtered.length > 0)
            return filtered[0];
        return null;
    }

    get_next_train(t) {
        t = t ?? get_time();
        let filtered = subway.lines[this.line_name].timetable.filter(entry => {
            return (
                entry.stop == this.station_name &&
                t < entry.time
            )
        });
        if (filtered.length > 0)
            return filtered[0];

        filtered = subway.lines[this.line_name].timetable.filter(entry => {
            return (
                entry.stop == this.station_name &&
                t > entry.time
            )
        });
        return filtered[0];
    }

    create_train_button(train) {
        const fragment = gameobject("train-button");
        const button = fragment.querySelector("button");
        button.textContent = "train " + this.line_name + train.name;
        button.onclick = () => {
            this.enter_train();
        }
        document.body.appendChild(button);
        return button;
    }

    schedule_next_train() {
        const t = get_time();
        const stopped_train = this.get_stopped_train(t);
        if (stopped_train && stopped_train.status == "waiting") {
            this.train_button = this.create_train_button(stopped_train);
            tunnel_video.play();
            tunnel_video.currentTime = t - stopped_train.time;
            this.timeout = setTimeout(() => {
                this.schedule_next_train();
            }, (stopped_train.time + stopped_train.duration - t) * 1000);
        } else {
            const next_train = this.get_next_train(t);
            if (this.train_button) {
                this.train_button.remove();
                delete this.train_button;
            }
            tunnel_video.pause();
            tunnel_video.currentTime = 0;
            this.timeout = setTimeout(() => {
                this.schedule_next_train();
            }, (next_train.time - t) * 1000);
        }
    }

    enter_train() {
        const t = get_time();
        const stopped_train = this.get_stopped_train(t);
        if (stopped_train) {
            const train = subway.lines[this.line_name].trains[stopped_train.name];
            train.enter();
        } else {
            console.error("tried to enter a train that doesn't exist");
        }
    }
}

class Train extends Location {
    constructor(options) {
        super(options);
        this.train_name = options.train_name;
        this.direction = options.direction;
        this.objects = ["map", "timetable", "rando"];
    }

    enter() {
        super.enter();
        timetable.innerHTML = this.generate_timetable();
        this.schedule_next_station();
        train_video.classList.remove("hidden");
    }

    exit() {
        super.exit();
        if (this.station_button) {
            this.station_button.remove();
            delete this.station_button;
        }
        if (this.timeout)
            clearTimeout(this.timeout);
        train_video.classList.add("hidden");
        train_video.pause();
    }

    generate_timetable() {
        let html = "<div><table>";
        html += "<tr><th>TIME</th><th>STOP</th></tr>";
        for (const entry of subway.lines[this.line_name].timetable.filter(v => v.status == "moving" && v.name == this.train_name)) {
            html += "<tr>";
            html += `<td>${seconds_to_time(entry.time)}</td>`;
            html += `<td>${entry.from}</td>`;
            html += "</tr>";
        }
        html += "</table></div>";
        return html;
    }

    create_station_button(station_name) {
        const fragment = gameobject("station-button");
        const button = fragment.querySelector("button");
        button.textContent = "station " + station_name;
        button.onclick = () => {
            this.enter_station();
        }
        document.body.appendChild(button);
        return button;
    }

    get_stopped_station(t) {
        t = t ?? get_time();
        const filtered = subway.lines[this.line_name].timetable.filter(entry => {
            return (
                entry.name == this.train_name &&
                (entry.status == "waiting" || entry.status == "idle") &&
                t >= entry.time && t < entry.time + entry.duration
            )
        });
        if (filtered.length > 0)
            return filtered[0];
        return null;
    }

    get_next_stop(t) {
        t = t ?? get_time();
        let filtered = subway.lines[this.line_name].timetable.filter(entry => {
            return (
                entry.name == this.train_name &&
                (entry.status == "waiting" || entry.status == "idle") &&
                t < entry.time
            )
        });
        if (filtered.length > 0)
            return filtered[0];

        filtered = subway.lines[this.line_name].timetable.filter(entry => {
            return (
                entry.name == this.train_name &&
                (entry.status == "waiting" || entry.status == "idle") &&
                t > entry.time
            )
        });
        return filtered[0];
    }

    schedule_next_station() {
        const t = get_time();
        const stopped_station = this.get_stopped_station(t);
        if (stopped_station) {
            this.station_button = this.create_station_button(stopped_station.stop);
            train_video.pause();
            train_video.currentTime = 0;
            this.timeout = setTimeout(() => {
                if (stopped_station.status == "idle") {
                    this.exit();
                    say("this train no longer operates within the hour. please exit the train car.");
                    return;
                }
                this.schedule_next_station();
            }, (stopped_station.time + stopped_station.duration - t) * 1000);
        } else {
            const next_stop = this.get_next_stop(t);
            if (this.station_button) {
                this.station_button.remove();
                delete this.station_button;
            }
            train_video.play();
            this.timeout = setTimeout(() => {
                this.schedule_next_station();
            }, (next_stop.time - t) * 1000);
        }
    }

    enter_station() {
        const t = get_time();
        const stopped_station = this.get_stopped_station(t);
        if (stopped_station) {
            const platform = subway.stations[stopped_station.stop].line_platforms[this.line_name][this.direction];
            platform.enter();
        } else {
            console.error("tried to stop where the train wasn't stopped.");
        }
    }
}