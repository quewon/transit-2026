var jobs = localStorage.getItem("jobs") ? JSON.parse(localStorage.getItem("jobs")) : [];
var packages = ["love letter", "box", "wrist watch", "water bottle", "bouquet", "cell phone", "handbag", "wallet", "letter", "keychain"];

function offer_job(agent_index) {
    for (let job of jobs) {
        if (job.agent_index == agent_index) {
            say(`i've already given you a job. you need to get to <u>station ${job.destination}</u>.`);
            return;
        }
    }
    const possible_destinations = Object.keys(subway.stations).filter(name => name != current_location.station_name);
    const destination = possible_destinations[Math.floor(Math.random() * possible_destinations.length)];
    const package = packages[Math.floor(Math.random() * packages.length)];
    const destination_fragment = gameobject("rando");
    const job = {
        agent_index,
        start_time: get_time(),
        destination,
        destination_fragment,
        package,
        done: false
    };
    destination_fragment.querySelector("button").onclick = () => {
        if (job.done) {
            say("...");
            return;
        }
        const dialogue_options = [
            `that's my ${package}! thanks!`,
            `thanks for the ${package}.`,
            `what a lovely ${package}!`,
            `just what i ordered. thank you.`,
        ]
        say(dialogue_options[Math.floor(Math.random() * dialogue_options.length)]);
        remove_from_inventory(package);
        add_money(5);
        jobs.splice(jobs.indexOf(job), 1);
        localStorage.setItem("jobs", JSON.stringify(jobs));
        job.done = true;
    }
    jobs.push(job);
    localStorage.setItem("jobs", JSON.stringify(jobs));
    add_to_inventory(package);
    say(`take this <u>${package}</u> to <u>station ${destination}</u>.`);
}

// (unused plan below)

// game:

// today i have to catch a flight
// but before that, i want to write and deliver a letter
// and i want to visit a friend
// and i want to receive my payment from my job

// i am leaving this place for good
// just another city i am moving through
// but all cities are the same sort

// you have to pay 2 money to enter a direction
// you can also choose not to pay, but you might be checked for that