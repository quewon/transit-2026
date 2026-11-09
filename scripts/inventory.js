var money = localStorage.getItem("money") ? parseInt(localStorage.getItem("money")) : 4;
var inventory = [];

function add_to_inventory(item, ignoreLocalStorage) {
    const li = document.createElement("li");
    li.textContent = item;
    inventory_list.appendChild(li);
    if (!ignoreLocalStorage) {
        inventory.push(item);
        localStorage.setItem("inventory", JSON.stringify(inventory));
    }
}

function remove_from_inventory(item) {
    inventory.splice(inventory.indexOf(item), 1);
    for (let i=0; i<inventory_list.children.length; i++) {
        if (inventory_list.children[i].textContent == item) {
            inventory_list.children[i].remove();
            localStorage.setItem("inventory", JSON.stringify(inventory));
            return;
        }
    }
}

function add_money(v) {
    money += v;
    money_counter.textContent = money;
    localStorage.setItem("money", money);
}

function sub_money(v) {
    money -= v;
    money_counter.textContent = money;
    localStorage.setItem("money", money);
}

money_counter.textContent = money;
if (localStorage.getItem("inventory")) {
    inventory = JSON.parse(localStorage.getItem("inventory"));
    for (const item of inventory) {
        add_to_inventory(item, true);
    }
}