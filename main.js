var sourceVk;

let friendsList;
const content = document.querySelector('.friends_content');
const friendsListLeft = document.querySelector('.friends_list-left');
const friendsListRight = document.querySelector('.friends_list-right');
const overlay = document.querySelector('.overlay');
const close = document.querySelector('#close');
const btnSave = document.querySelector('#btnSave');

let storage = localStorage.getItem('friends');

if (!storage) {
    storage = [];
}

let leftSource;
let rightSource;

VK.init({
    apiId: 5990129
});

function auth() {
    return new Promise((resolve, reject) => {
        VK.Auth.login(data => {
            if (data.session) {
                resolve(data);
            } else {
                reject(new Error('Не удалось авторизоваться'));
            }
        }, 2);
    });
};

function callAPI(method, params) {
    params.v = '5.76';

    return new Promise((resolve, reject) => {
        VK.api(method, params, (data) => {
            if (data.error) {
                reject(data.error);
            } else {
                resolve(data.response);
            }
        });
    });
}

auth()
    .then(() => {
        return callAPI('users.get', {name_case: 'gen'});
    })
    .then((me) => {
        let title = document.querySelector('#title');
        title.innerText += ` ${me[0].first_name} ${me[0].last_name}`;

        return callAPI('friends.get', {fields: 'first_name, last_name, photo_50'});
    })
    .then((friends) => {
        sourceVk = friends.items;
        setSources();
    });

btnSave.addEventListener('click', (e) => {
    overlay.style.display = 'none';
    localStorage.setItem('friends', storage);
});

close.addEventListener('click', () => {
    overlay.style.display = 'none';
})

content.addEventListener('input', (e) => {
    let data;
    if (e.target.className == 'search_input-left') {
        friendsList = friendsListLeft;
        data = leftSource;

    } else {
        friendsList = friendsListRight;
        data = rightSource;
    }
    let value = e.target.value.toLowerCase();
    let newFriendsList = data.filter((item) => {
        let name = `${item.first_name} ${item.last_name}`;
        return name.toLowerCase().match(value);
    });

    createFriendsList(newFriendsList, friendsList);
});

makeDnD([friendsListLeft, friendsListRight]);

function setSources() {
    leftSource = sourceVk.filter(item => {
        if (storage.indexOf(item.id) == -1) {
            return item;
        }
        ;
    });
    rightSource = sourceVk.filter(item => {
        if (storage.indexOf(item.id) != -1) {
            return item;
        }
    });

    createFriendsList(leftSource, friendsListLeft);
    createFriendsList(rightSource, friendsListRight);
}

function createFriendsList(arr, list) {
    let action,
        fragment = document.createDocumentFragment(),
        len = arr.length;

    if (list == friendsListLeft) {
        action = 'add';
    } else {
        action = 'delete';
    }
    list.innerHTML = '';

    for (let i = 0; i < len; i++) {
        let li = document.createElement('li');
        li.classList.add('friends_list_item');
        li.setAttribute('id', arr[i].id);
        li.draggable = true;
        let html = '<div class="friend">' +
            '<div class="friend_photo"><img src="' + arr[i].photo_50 + '"></div>' +
            '<div class="friend_name">' + arr[i].first_name + ' ' + arr[i].last_name + '</div>' +
            '</div>' +
            '<span class="close btn dark ' + action + '"></span>';
        li.innerHTML = html;
        li.addEventListener('click', (e) => moveFriend(e))
        fragment.appendChild(li);
    }

    list.appendChild(fragment);
}

function makeDnD(items) {
    let currentDrug;

    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            currentDrug = {source: item, node: e.target};
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        item.addEventListener('drop', (e) => {

            if (currentDrug) {
                e.preventDefault();

                if (currentDrug.source !== item) {
                    if (e.target.classList.contains('friends_list')) {
                        item.insertBefore(currentDrug.node, item.lastElementChild);
                    }
                    else {
                        item.insertBefore(currentDrug.node, item.nextElementChild)
                    }
                }
                currentDrug = null;
            }

            setStorage();
            setSources();
        })
    })
}

function moveFriend(e) {

    let friend = e.target.parentNode,
        removed;

    if (e.target.classList.contains('add')) {
        removed = friendsListLeft.removeChild(friend);
        friendsListRight.appendChild(removed);
    }
    if (e.target.classList.contains('delete')) {
        removed = friendsListRight.removeChild(friend);
        friendsListLeft.appendChild(removed);
    }
    setStorage();
    setSources();
}

function setStorage() {
    let arr = friendsListRight.children;
    storage = [];
    [].forEach.call(arr, function (elem) {
        storage.push(parseInt(elem.getAttribute('id')));
    });
}
