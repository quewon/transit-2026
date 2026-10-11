const locations = [];

function convert_time(seconds) {
    let mm = Math.floor(seconds / 60);
    let ss = seconds % 60;
    if (mm < 10) mm = "0" + mm;
    if (ss < 10) ss = "0" + ss;
    return "XX:" + mm + ":" + ss;
}

function get_time() {
    const now = new Date();
    return now.getMinutes() * 60 + now.getSeconds();
}

function template(name) {
    const t = document.getElementById("template_" + name);
    if (t) {
        const fragment = document.importNode(t.content, true);

        if (name == "rando") {
            const rando = RANDOS[Math.floor(Math.random() * RANDOS.length)];
            fragment.querySelector("img").src = "res/images/" + rando.image;
            fragment.querySelector("img").title = rando.title;
            fragment.querySelector("button").onclick = () => {
                dialogue.textContent = rando.say;
                dialogue.showModal();
            }
        } else if (name == "agent") {
            fragment.querySelector("img").src = "res/images/jobgiver1.png";
            fragment.querySelector("img").title = "job agent";
            fragment.querySelector("button").onclick = () => {
                agent_dialogue();
            }
        } else if (name == "undercover-agent") {
            const rando = RANDOS[Math.floor(Math.random() * RANDOS.length)];
            fragment.querySelector("img").src = "res/images/" + rando.image;
            fragment.querySelector("img").title = rando.title;
            fragment.querySelector("button").onclick = () => {
                undercover_agent_dialogue();
            }
        }

        return fragment;
    }
}

function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}

class Location {
    name = "a location";
    description = "an empty location.";
    objects = [];
    actions = [];

    constructor(station, name, depth, description, objects, actions) {
        this.station = station;
        this.name = name;
        this.depth = depth;
        this.description = description;
        if (objects) this.objects = objects;
        if (actions) this.actions = actions;
        locations.push(this);
    }

    remove_all_objects() {
        while (document.body.querySelector("[data-absolute]"))
            document.body.querySelector("[data-absolute]").remove();
        while (document.body.querySelector("[data-after]"))
            document.body.querySelector("[data-after]").remove();
        while (location_info.previousElementSibling)
            location_info.previousElementSibling.remove();
    }

    remove_all_actions() {
        while (location_navigation.lastElementChild)
            location_navigation.lastElementChild.remove();
    }

    init_objects() {
        for (const object_name of this.objects) {
            const fragment = template(object_name);
            if (object_name == "tunnel") {
                this.tunnel_video = fragment.querySelector("video");
            } else if (object_name == "timetable") {
                timetable.innerHTML = this.generate_timetable();
            } else if (object_name == "train-inside") {
                this.train_video = fragment.querySelector("video");
            } else if (object_name.includes("station_") && object_name.includes("_exit")) {
                fragment.querySelector("video").play();
            }
            if (fragment.querySelector("[data-absolute]")) {
                document.body.appendChild(fragment);
            } else if (fragment.querySelector("[data-after]")) {
                location_info.after(fragment);
            } else {
                location_info.before(fragment);
            }
        }
    }

    init_actions() {
        for (const action of this.actions) {
            const button = document.createElement("button");
            button.type = "button";
            button.innerHTML = action.label;
            button.onclick = action.f;
            location_navigation.appendChild(button);
        }
    }

    update_description(text) {
        if (current_location == this)
            location_description.textContent = text;
        this.description = text;
    }

    enter() {
        if (current_location)
            current_location.exit();
        this.remove_all_objects();
        this.remove_all_actions();
        document.body.className = "depth" + this.depth;
        station_name.textContent = this.station.name + " - " + this.name;
        location_name.textContent = this.name;
        location_description.textContent = this.description;
        this.init_objects();
        this.init_actions();
        current_location = this;
        localStorage.setItem("current_location", locations.indexOf(this));
        localStorage.setItem("current_station", this.station.char);
        location_navigation.querySelector("button").focus();
    }

    exit() {
    }
}