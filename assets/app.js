//import { createApp } from 'vue/dist/vue.esm-bundler';
import { createApp } from 'vue';
import Modal from 'bootstrap/js/src/modal';
import Form from './form.vue';


if (document.getElementsByClassName('available-work').length > 0) {

    const app = createApp(Form)

    let topNav = document.getElementById('rlb-top-nav-bar');

    let modal_vue = document.createElement('div');


    document.body.appendChild(modal_vue);


    app.mount(modal_vue);

    let myModal = document.getElementById('cargomatic_modal')
    if (myModal) {
        let modal_bs = new Modal(myModal)

        let label = document.createElement('label');
        label.classList.add('css-1wfh6xe');

        let span = document.createElement('span');

        let div = document.createElement('div')
        div.classList.add('css-14dbfau')
        div.innerText = 'Cargomatic';
        div.onclick = function () {
            modal_bs.show()
        }

        span.appendChild(div)

        let line = document.createElement('div');
        line.classList.add('css-1m0wqi4');

        label.appendChild(span);
        label.appendChild(line);


        topNav.getElementsByTagName('div')[0].appendChild(label)
    }



}


/*
document.addEventListener('DOMContentLoaded', function(){

    console.log('DOMContentLoaded');



    var topNav = document.getElementById('rlb-top-nav-bar');

    console.log(topNav);

    if (topNav) {
        topNav.appendChild(app.$el)
    }
});*/
