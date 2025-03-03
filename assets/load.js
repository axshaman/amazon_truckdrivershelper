/*
let ajax = new XMLHttpRequest();
ajax.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
        eval(this.responseText);
    }
};
ajax.open('GET', 'https://dev.itsai.org/cargomatic', true);
ajax.send();
*/
(function () {
    let scriptEl = document.createElement('script');
    scriptEl.src = 'https://dev.itsai.org/app.js';
    //scriptEl.src = 'https://dev.itsai.org/loader_after.js';
    document.body.appendChild(scriptEl);
})()
