function setup_ticket_machine() {
    for (let station in subway.stations) {
        let option = document.createElement("option");
        option.value = station;
        option.textContent = station;
        location_select.appendChild(option);
        let option2 = document.createElement("option");
        option2.value = station;
        option2.textContent = station;
        destination_select.appendChild(option2);
    }
}

function update_ticket_machine() {
    let start = location_select.value;
    let end = destination_select.value;
    if (start && end && start != end) {
        const cost = minimum_travel_cost(start, end);
        buy_button.textContent = "buy ticket (" + cost + "c)";
        buy_button.removeAttribute("disabled");
        buy_button.onclick = () => {
            if (money >= cost) {
                const time = new Date().getTime();
                const number = time;
                const info = `<table><tr><td>FROM</td><td>${start}</td></tr><tr><td>TO</td><td>${end}</td></tr><tr><td>TIME</td><td>${convert_time(get_time())}</td></tr><tr><td>NUMBER</td><td>${number}</td></tr></table>`;
                dialogue_noclose.innerHTML = `thank you for your purchase.<br><br><details><summary>your ticket</summary>${info}</details><br>please store your ticket information somewhere safe. you may be required to present your ticket number to a ticketmaster.<br><br><button type='button' onclick='dialogue_noclose.close(); dialogue.close()'>ok</button>`;
                dialogue_noclose.showModal();
                money -= cost;
                localStorage.setItem("money", money);
                total_spent += cost;
                localStorage.setItem("total_spent", total_spent);
                money_counter.textContent = money;
                tickets[number] = [start, end, time];
                localStorage.setItem("tickets", JSON.parse(tickets));
            } else {
                dialogue.textContent = "insufficient funds.";
                dialogue.showModal();
            }
        }
    } else {
        buy_button.textContent = "buy ticket (?c)";
        buy_button.setAttribute("disabled", true);
    }
}

function minimum_travel_cost(a, b) {
    let cheapest_cost = Infinity;
    for (let path of all_paths_to(a, b)) {
        const cost = path_cost(path);
        if (cost < cheapest_cost) {
            cheapest_cost = cost;
        }
    }
    return cheapest_cost;
}

function path_cost(path) {
    let cost = 0;
    for (let stop of path) {
        cost += stop.cost;
    }
    return cost;
}

function all_paths_to(a, b, ignore) {
    ignore = ignore || [];
    var paths = [];
    for (const line_index of subway.stations[a].lines) {
        if (ignore.includes(line_index)) continue;
        const line = subway.lines[line_index];
        for (let station of line.sequence) {
            if (station == a) continue;
            let stop;
            const ai = line.sequence.indexOf(a);
            const si = line.sequence.indexOf(station);
            if (line.sequence[0] == line.sequence[line.sequence.length - 1]) {
                if (si > ai) {
                    if (si - ai > line.sequence.length / 2) {
                        stop = {
                            direction: 1,
                            line: line_index,
                            stop: station,
                            cost: ai + line.sequence.length - si
                        }
                    } else {
                        stop = {
                            direction: 0,
                            line: line_index,
                            stop: station,
                            cost: si - ai
                        }
                    }
                } else {
                    if (ai - si > line.sequence.length / 2) {
                        stop = {
                            direction: 0,
                            line: line_index,
                            stop: station,
                            cost: si + line.sequence.length - ai
                        }
                    } else {
                        stop = {
                            direction: 1,
                            line: line_index,
                            stop: station,
                            cost: ai - si
                        }
                    }
                }
            } else {
                if (si > ai) {
                    stop = {
                        direction: 0,
                        line: line_index,
                        stop: station,
                        cost: si - ai
                    }
                } else {
                    stop = {
                        direction: 1,
                        line: line_index,
                        stop: station,
                        cost: ai - si
                    }
                }
            }
            if (station == b) {
                paths.push([stop]);
            } else {
                for (let path of all_paths_to(station, b, [...ignore, line_index])) {
                    paths.push([stop, ...path]);
                }
            }
        }
    }
    return paths;
}