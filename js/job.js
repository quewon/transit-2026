function create_next_job() {
    const current_station = localStorage.getItem("current_station");
    if (current_job) {
        const start_objects = subway.stations[current_job.start_station].exit.objects;
        const end_objects = subway.stations[current_job.end_station].exit.objects;
        start_objects.splice(start_objects.indexOf("agent"), 1);
        end_objects.splice(end_objects.indexOf("undercover-agent"), 1);
    }
    if (MESSAGE.index < MESSAGE.parts.length) {
        const part = MESSAGE.parts[MESSAGE.index++];
        localStorage.setItem("message_index", MESSAGE.index);
        const stations = Object.keys(subway.stations);
        const start_pool = stations.filter(v => v !== current_station);
        const start_station = start_pool[Math.floor(Math.random() * start_pool.length)];
        const end_pool = stations.filter(v => v !== start_station && v !== current_station);
        const end_station = end_pool[Math.floor(Math.random() * end_pool.length)];

        if (!current_job) {
            dialogue_noclose.innerHTML = "your next job is waiting for you at the exit of station " + start_station + ".<br><br><button type='button' onclick='dialogue_noclose.close()'>ok</button>";
            dialogue_noclose.showModal();
        } else {
            dialogue_noclose.innerHTML = "thanks. you have a friend waiting for you at station " + start_station + ".<br><br><button type='button' onclick='dialogue_noclose.close()'>ok</button>";
            dialogue_noclose.showModal();
        }
        
        current_job = {
            start_station: start_station,
            end_station: end_station,
            message: part,
            message_received: false,
            budget: Math.ceil(minimum_travel_cost(start_station, end_station) / 5) * 5,
        }
        localStorage.setItem("current_job", JSON.stringify(current_job));

        subway.stations[start_station].exit.objects.push("agent");
        subway.stations[end_station].exit.objects.push("undercover-agent");
    } else {
        current_job = null;
        const elapsed = (new Date() - parseInt(localStorage.getItem("jobs_start_time"))) / 1000;
        let time_spent = Math.floor(elapsed / 60) + " minutes, " + Math.floor(elapsed % 60) + " seconds";
        results = `<table><tr><td>TOTAL MONEY SPENT</td><td>${total_spent}</td></tr><tr><td>TOTAL TIME SPENT</td><td>${time_spent}</td></tr></table>`;
        dialogue_noclose.innerHTML = `well, i think that's it. all your friends have gone home. it's time for you to head home, too.<br><br>...or wherever else you want to go.<br><br><details><summary>one final message</summary>${results}</details><br><button type='button' onclick='dialogue_noclose.close()'>ok</button>`;
        dialogue_noclose.showModal();
    }
}

function agent_dialogue() {
    const { message, end_station, budget, message_received } = current_job;
    if (message_received) {
        dialogue.textContent = "do i know you?";
        dialogue.showModal();
    } else {
        dialogue_noclose.innerHTML = `a job for you.<br><br>deliver this <details><summary>message</summary>${message}</details> to the agent at station ${end_station}.<br><br>memorize it. you won't be able to request this information again.<br><br>...here's ${budget}c for your travel.<br><br><button type='button' onclick='dialogue_noclose.close()'>ok</button>`;
        dialogue_noclose.showModal();
        money += budget;
        localStorage.setItem("money", money);
        money_counter.textContent = money;
        current_job.message_received = true;
    }
}

function undercover_agent_dialogue() {
    dialogue_noclose.innerHTML = `got a message for me?<br><br><input type="text" id="delivery_input"><br><br><button type='button' onclick='dialogue_noclose.close(); check_message()'>submit</button>`;
    dialogue_noclose.showModal();
}

function check_message() {
    if (delivery_input.value.trim() == current_job.message) {
        create_next_job();
        subway.stations[localStorage.getItem("current_station")].exit.enter();
    } else {
        dialogue_noclose.innerHTML = "you forgot the message, didn't you?<br><br><button type='button' onclick='dialogue_noclose.close(); undercover_agent_dialogue()'>no, i have it</button> <button type='button' onclick='dialogue_noclose.close(); give_up_job()'>...yeah</button>";
        dialogue_noclose.showModal();
    }
}

function give_up_job() {
    MESSAGE.index--;
    localStorage.setItem("message_index", MESSAGE.index);
    current_job = null;
    create_next_job();
    subway.stations[localStorage.getItem("current_station")].exit.enter();
}